alter table public.messages
add column if not exists sender_email text;

create or replace function public.set_message_sender_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $function$
begin
  if new.sender_email is null or new.sender_email = '' then
    select u.email
    into new.sender_email
    from auth.users u
    where u.id = new.sender_id;
  end if;

  return new;
end;
$function$;

drop trigger if exists messages_set_sender_email on public.messages;

create trigger messages_set_sender_email
before insert or update of sender_id on public.messages
for each row
execute function public.set_message_sender_email();

update public.messages m
set sender_email = u.email
from auth.users u
where u.id = m.sender_id
  and (m.sender_email is null or m.sender_email = '');
