import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY

const hasSupabaseCredentials = Boolean(supabaseUrl && supabaseKey)

if (!hasSupabaseCredentials) {
  console.warn(
    'Supabase credentials are missing. Set VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY in .env.local or .env.'
  )
}

export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl!, supabaseKey!)
  : null

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.'
    )
  }
  return supabase
}

export function isSupabaseConfigured() {
  return hasSupabaseCredentials
}

// Helper function to get announcements
export async function getAnnouncements() {
  try {
    const client = requireSupabaseClient()
    const { data, error } = await client
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return []
  }
}

// Helper function to dismiss an announcement
export async function dismissAnnouncement(announcementId: string, userIdentifier: string) {
  try {
    const client = requireSupabaseClient()
    const { error } = await client
      .from('announcement_dismissals')
      .insert({
        announcement_id: announcementId,
        user_identifier: userIdentifier
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error dismissing announcement:', error)
    return false
  }
}

// Helper function to check if an announcement is dismissed for a user
export async function isAnnouncementDismissed(announcementId: string, userIdentifier: string) {
  try {
    const client = requireSupabaseClient()
    const { data, error } = await client
      .from('announcement_dismissals')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('user_identifier', userIdentifier)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  } catch (error) {
    console.error('Error checking announcement dismissal:', error)
    return false
  }
}

// Helper function to authenticate admin
export async function authenticateAdmin(email: string) {
  try {
    const client = requireSupabaseClient()
    const { data, error } = await client
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (data) {
      // Update last login
      await client
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)

      return data
    }
    return null
  } catch (error) {
    console.error('Error authenticating admin:', error)
    return null
  }
}

// Helper function to create announcement
export async function createAnnouncement(
  message: string,
  type: string,
  dismissible: boolean,
  createdBy: string | null
) {
  try {
    const client = requireSupabaseClient()
    const { data, error } = await client
      .from('announcements')
      .insert({
        message,
        type,
        created_by: createdBy,
        dismissible,
        active: true
      })
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error creating announcement:', error)
    return null
  }
}

// Helper function to delete announcement
export async function deleteAnnouncement(announcementId: string) {
  try {
    const client = requireSupabaseClient()
    const { error } = await client
      .from('announcements')
      .update({ active: false })
      .eq('id', announcementId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return false
  }
}
