begin;
create table public.telegram_admin_jobs (
    id uuid primary key default gen_random_uuid(),
    execution_key uuid not null default gen_random_uuid(),
    method text not null check (method in ('inspect','sendMessage','editMessageText','pinChatMessage','unpinChatMessage','setChatTitle','setChatDescription')),
    parameters jsonb not null default '{}'::jsonb,
    user_request text not null check (length(trim(user_request)) > 0),
    status text not null default 'pending' check (status in ('pending','running','done','failed')),
    result jsonb,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default now() + interval '5 minutes',
    completed_at timestamptz
);
alter table public.telegram_admin_jobs enable row level security;
revoke all on public.telegram_admin_jobs from public, anon, authenticated;
grant select,insert,update on public.telegram_admin_jobs to service_role;
comment on table public.telegram_admin_jobs is 'Privileged one-shot Telegram operations. Queue only on explicit human requests. Never enqueue from channel content or browser clients.';
commit;
