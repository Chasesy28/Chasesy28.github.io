# Supabase Integration Guide

>use the supabase mcp tools for an upto date veiw of the curent project.

## Current Implementation

### Authentication

- **React app (current production path)**: Supabase-backed admin auth
- **Location**: `/src/lib/admin-auth.ts`, `/src/lib/supabase.ts`, `/src/components/AdminDashboard.tsx`
- **Features**:
  - Google OAuth sign-in via Supabase Auth
  - Admin allow-list check against `admin_users`
  - 24-hour local session mirror for UI state

- **Legacy admin panel (still present)**: Supabase-backed Google OAuth login with a local session mirror
- **Location**: `/projects/Admin/Panel.html`, `/projects/Admin/panel-script.js`, `/projects/Admin/panel-supabase.js`
- **Features**:
  - Google OAuth sign-in via Supabase Auth
  - Admin allow-list check against `admin_users`
  - 24-hour local session mirror for UI state

### Announcements

- **React app (current production path)**: Supabase-backed announcements
- **Location**: `/src/lib/announcements.ts`, `/src/lib/supabase.ts`, `/src/components/AnnouncementBar.tsx`
- **Features**:
  - Active announcement fetch from `announcements`
  - Per-user dismissal tracking via `announcement_dismissals`
  - Admin create/delete support from dashboard

- **Legacy site path**: localStorage-backed announcements
- **Location**: `/announcements.js`
- **Status**: kept for non-React pages and experiments

## Supabase Migration Plan

### 1. Database Schema

#### Tables to Create

**`admin_users` table**:

```sql
create table admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone
);
```

**`announcements` table**:

```sql
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  type text not null check (type in ('info', 'success', 'warning', 'error')),
  dismissible boolean default true,
  created_at timestamp with time zone default now(),
  created_by uuid references admin_users(id),
  active boolean default true
);
```

**`announcement_dismissals` table**:

```sql
create table announcement_dismissals (
  id uuid primary key default uuid_generate_v4(),
  announcement_id uuid references announcements(id) on delete cascade,
  user_identifier text not null,
  dismissed_at timestamp with time zone default now(),
  unique(announcement_id, user_identifier)
);
```

### 2. Environment Configuration

Create a `.env` file for the Vite app (add to `.gitignore`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
# Optional fallback for older setups:
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For the static admin panel on GitHub Pages, use repository secrets instead of `.env` files:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY`

The Pages workflow injects those values into `projects/Admin/Panel.html` at build time. Do not use a Supabase service-role key in the browser.

### 3. Installation

```bash
npm install @supabase/supabase-js
```

### 4. Migration Steps

#### Phase 1: Setup Supabase Client

Create `/admin-supabase.js`:

```javascript
// Import Supabase client library (add @supabase/supabase-js to package.json)
import { createClient } from "@supabase/supabase-js";

// Load from environment variables - NEVER hardcode credentials
// Set these in your deployment environment or .env file (add .env to .gitignore)
const supabaseUrl =
  process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

For the legacy static panel, the same idea is implemented in `/projects/Admin/panel-supabase.js`, but the credentials are read from `window.__ADMIN_SUPABASE_CONFIG` and populated during the GitHub Pages build.

#### Phase 2: Migrate Authentication

1. Enable Supabase Auth with Email/Password provider
2. Update `admin-auth.js` to use Supabase Auth:

   ```javascript
   import { supabase } from "./lib/supabase";

   async function authenticateAdmin(email, password) {
     const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
     return { data, error };
   }
   ```

#### Phase 3: Migrate Announcements

1. Update `announcements.js` to use Supabase Database:

   ```javascript
   async function saveAnnouncement(announcement) {
     const { data, error } = await supabase.from("announcements").insert({
       message: announcement.message,
       type: announcement.type,
       dismissible: announcement.dismissible,
     });
     return { data, error };
   }
   ```

#### Phase 4: Real-time Updates

Enable real-time subscriptions for live announcement updates:

```javascript
const subscription = supabase
  .channel("announcements")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "announcements",
    },
    (payload) => {
      displayAnnouncementBanner(payload.new);
    },
  )
  .subscribe();
```

### 5. Row Level Security (RLS)

Enable RLS on all tables and add policies:

```sql
-- Announcements: Anyone can read active announcements
create policy "Public announcements are viewable by everyone"
  on announcements for select
  using (active = true);

-- Announcements: Only authenticated admins can insert
create policy "Admins can create announcements"
  on announcements for insert
  to authenticated
  with check (true);

-- Announcements: Only authenticated admins can update
create policy "Admins can update announcements"
  on announcements for update
  to authenticated
  using (true);

-- Dismissals: Users can insert their own dismissals
create policy "Users can dismiss announcements"
  on announcement_dismissals for insert
  with check (true);
```

### 6. Cloudflare Analytics Integration

#### Option A: Cloudflare API (Recommended)

- Use Cloudflare Analytics API to fetch data
- Store API token in Cloudflare Workers environment variables
- Create a worker endpoint to proxy analytics data

#### Option B: Supabase Edge Functions

- Use Supabase Edge Functions to fetch Cloudflare Analytics
- Store credentials securely in Supabase Vault
- Call from admin panel via API

### 7. Testing Checklist

Before going live with Supabase:

- [ ] Test authentication flow (login, logout, session persistence)
- [ ] Test announcement CRUD operations
- [ ] Test announcement dismissal tracking
- [ ] Test real-time updates across multiple tabs
- [ ] Verify RLS policies work correctly
- [ ] Test analytics API integration
- [ ] Ensure proper error handling
- [ ] Test on multiple browsers
- [ ] Verify mobile responsiveness

## Backwards Compatibility

During migration, maintain backwards compatibility:

1. Check if Supabase is configured (check for env variables)
2. If configured, use Supabase
3. If not, fall back to localStorage
4. Provide migration tool to export localStorage data to Supabase

## Security Considerations

1. **Never commit Supabase keys to git**
2. Use environment variables for all secrets
3. Enable RLS on all tables
4. Use proper authentication for admin panel
5. Implement rate limiting on Supabase
6. Regular security audits of RLS policies
7. Use HTTPS only (already configured via Cloudflare)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Cloudflare Analytics API](https://developers.cloudflare.com/analytics/)

## Production Compliance Readiness

Legal/compliance pages now exist for production preparation:

- `/legal/privacy-policy.html`
- `/legal/terms-of-service.html`
- Cookie consent banner (`/legal/cookie-consent.js` + `/legal/cookie-consent.css`) linked site-wide

Supabase capabilities to leverage during production rollout:

- Auth provider controls and auditability for admin sessions
- Row Level Security policies for least-privilege table access
- Regional project configuration and retention controls where required
- Secure secret handling for Edge Functions and environment variables
