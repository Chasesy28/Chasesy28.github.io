alter table public.chat_members enable row level security;

drop policy if exists "Authenticated users can read their chat member record" on public.chat_members;

create policy "Authenticated users can read their chat member record"
on public.chat_members
for select
to authenticated
using (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or id::text = auth.uid()::text
);
