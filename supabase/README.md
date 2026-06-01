# Supabase SQL Layout

This folder is the home for Supabase-specific SQL and related database assets.

## Current live migration history

The connected Supabase project currently reports these migrations via MCP:

- `20260225202115_allow_public_admin_users_demo_login`
- `20260225202702_secure_admin_users_google_only_rls`
- `20260317032400_add_test_admin_user`
- `20260317032715_fix_announcement_dismissals_rls`
- `20260317034616_fix_announcements_rls`
- `20260527194535_allow_authenticated_admin_user_reads`

## Recommended local layout

- `supabase/migrations/` for versioned DDL and RLS changes
- `supabase/policies/` for policy snippets or policy-only experiments
- `supabase/seed/` for seed data and fixtures

## App integration

The application-side Supabase usage is documented in [SUPABASE-INTEGRATION.md](../SUPABASE-INTEGRATION.md).
