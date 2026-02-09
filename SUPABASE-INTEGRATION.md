# Supabase Integration Guide

This document outlines the preparation for Supabase integration and the migration path from the current localStorage-based system.

## Current Implementation

### Authentication
- **Current**: localStorage-based session with hardcoded credentials
- **Location**: `/admin-auth.js`
- **Features**: 
  - Simple username/password check
  - 24-hour session duration
  - Session refresh capability

### Announcements
- **Current**: localStorage for announcement storage
- **Location**: `/announcements.js`
- **Features**:
  - Create, read, delete announcements
  - User dismissal tracking
  - Type-based styling (info, success, warning, error)

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

Create a `.env` file (add to `.gitignore`):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation

```bash
npm install @supabase/supabase-js
```

### 4. Migration Steps

#### Phase 1: Setup Supabase Client
Create `/src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Phase 2: Migrate Authentication
1. Enable Supabase Auth with Email/Password provider
2. Update `admin-auth.js` to use Supabase Auth:
   ```javascript
   import { supabase } from './lib/supabase'
   
   async function authenticateAdmin(email, password) {
     const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password
     })
     return { data, error }
   }
   ```

#### Phase 3: Migrate Announcements
1. Update `announcements.js` to use Supabase Database:
   ```javascript
   async function saveAnnouncement(announcement) {
     const { data, error } = await supabase
       .from('announcements')
       .insert({
         message: announcement.message,
         type: announcement.type,
         dismissible: announcement.dismissible
       })
     return { data, error }
   }
   ```

#### Phase 4: Real-time Updates
Enable real-time subscriptions for live announcement updates:
```javascript
const subscription = supabase
  .channel('announcements')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'announcements'
  }, (payload) => {
    displayAnnouncementBanner(payload.new)
  })
  .subscribe()
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
