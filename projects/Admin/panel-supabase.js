import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.4/+esm";

const SESSION_KEY = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000;
const PLACEHOLDER_PREFIX = "__SUPABASE_";
const VITE_ADMIN_ROUTE = "/vite/admin/auth";
const DEFAULT_SITE_ORIGIN = "https://chasesy28.github.io";

const config = window.__ADMIN_SUPABASE_CONFIG ?? {};
const configuredSiteOrigin =
  typeof config.siteOrigin === "string" ? config.siteOrigin.trim() : "";
const supabaseUrl = typeof config.url === "string" ? config.url.trim() : "";
const supabaseKey =
  typeof config.publishableKey === "string" && config.publishableKey.trim()
    ? config.publishableKey.trim()
    : typeof config.anonKey === "string" && config.anonKey.trim()
      ? config.anonKey.trim()
      : "";

function isPlaceholder(value) {
  return typeof value === "string" && value.startsWith(PLACEHOLDER_PREFIX);
}

const hasSupabaseCredentials =
  Boolean(supabaseUrl && supabaseKey) &&
  !isPlaceholder(supabaseUrl) &&
  !isPlaceholder(supabaseKey);

function getSiteOrigin() {
  if (configuredSiteOrigin && !isPlaceholder(configuredSiteOrigin)) {
    return configuredSiteOrigin.replace(/\/$/, "");
  }

  return DEFAULT_SITE_ORIGIN;
}

function getAbsoluteRedirectUrl(pathname) {
  return new URL(pathname, getSiteOrigin()).toString();
}

if (!hasSupabaseCredentials) {
  console.warn(
    "Supabase credentials are missing for the admin panel. Set GitHub Secrets SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, then rebuild the Pages artifact.",
  );
}

export function isSupabaseConfigured() {
  return hasSupabaseCredentials;
}

export function getSupabaseConfigError() {
  if (hasSupabaseCredentials) {
    return "";
  }

  return "Supabase is not configured. Set GitHub Secrets SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, then rebuild the Pages artifact.";
}

export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set GitHub Secrets SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, then rebuild the Pages artifact.",
    );
  }

  return supabase;
}

function createSession(admin) {
  const session = {
    adminId: admin.id,
    email: admin.email,
    loginTime: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData);

    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error parsing admin session:", error);
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function refreshSession() {
  const session = getSession();
  if (!session) return null;

  session.expiresAt = Date.now() + SESSION_DURATION;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSessionExpirationMinutes() {
  const session = getSession();
  if (!session) return null;

  const minutesLeft = Math.floor((session.expiresAt - Date.now()) / (60 * 1000));
  return Math.max(0, minutesLeft);
}

export async function authenticateAdmin(email) {
  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (data) {
      await client
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);

      return data;
    }

    return null;
  } catch (error) {
    console.error("Error authenticating admin:", error);
    return null;
  }
}

export async function loginWithGoogle(redirectPath) {
  const client = requireSupabaseClient();

  const targetRedirect = redirectPath ?? VITE_ADMIN_ROUTE;
  const redirectTo = getAbsoluteRedirectUrl(targetRedirect);

  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw error;
  }
}

export async function initializeAuthFromSupabase() {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  const userEmail = data.session?.user?.email;
  if (!userEmail) return null;

  const admin = await authenticateAdmin(userEmail);
  if (!admin) {
    await client.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    throw new Error(
      "Your account is authenticated but is not authorized for admin access.",
    );
  }

  createSession(admin);
  return admin;
}

export async function logout() {
  if (supabase) {
    await supabase.auth.signOut();
  }

  localStorage.removeItem(SESSION_KEY);
}

export async function getAllAnnouncements() {
  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
}

export async function createAnnouncement(message, type, dismissible, createdBy) {
  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("announcements")
      .insert({
        message,
        type,
        created_by: createdBy,
        dismissible,
        active: true,
      })
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error("Error creating announcement:", error);
    return null;
  }
}

export async function deleteAnnouncement(announcementId) {
  try {
    const client = requireSupabaseClient();
    const { data: softDeletedRows, error: softDeleteError } = await client
      .from("announcements")
      .update({ active: false })
      .select("id")
      .eq("id", announcementId);

    if (softDeleteError) throw softDeleteError;

    if (softDeletedRows && softDeletedRows.length > 0) {
      return true;
    }

    const { data: hardDeletedRows, error: hardDeleteError } = await client
      .from("announcements")
      .delete()
      .eq("id", announcementId)
      .select("id");

    if (hardDeleteError) throw hardDeleteError;

    if (hardDeletedRows && hardDeletedRows.length > 0) {
      return true;
    }

    console.warn(
      "Delete announcement affected 0 rows. Check RLS policies for update/delete access.",
    );
    return false;
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return false;
  }
}
