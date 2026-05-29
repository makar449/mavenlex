-- MavenLex v3.1.0 PostgreSQL Database Foundation
-- Run after 001_init.sql and 002_production_database_schema.sql.
-- Compatible with Supabase, Neon and standard PostgreSQL.

create extension if not exists pgcrypto;

create table if not exists app_meta (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into app_meta (key, value)
values ('schema_version', '{"version":"3.1.0","name":"postgresql_database_foundation"}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

create table if not exists users (
  id text primary key default gen_random_uuid()::text,
  email text not null unique,
  password_hash text,
  role text not null default 'user',
  plan text not null default 'free',
  billing_status text not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists analyses (
  id text primary key default gen_random_uuid()::text,
  user_id text references users(id) on delete set null,
  filename text,
  contract_type text,
  risk_score integer,
  risk_level text,
  summary text,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_questions (
  id text primary key default gen_random_uuid()::text,
  user_id text references users(id) on delete set null,
  analysis_id text references analyses(id) on delete set null,
  question text not null,
  answer text,
  created_at timestamptz not null default now()
);

create table if not exists usage_counters (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users(id) on delete cascade,
  period text not null,
  reviews integer not null default 0,
  questions integer not null default 0,
  exports integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, period)
);

create table if not exists subscriptions (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users(id) on delete cascade,
  plan text not null,
  status text not null default 'inactive',
  provider text not null default 'manual',
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id text primary key default gen_random_uuid()::text,
  user_id text references users(id) on delete set null,
  plan text not null,
  provider text not null,
  provider_payment_id text unique,
  amount numeric(12,2) not null default 0,
  currency text not null default 'RUB',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists billing_events (
  id text primary key default gen_random_uuid()::text,
  payment_id text references payments(id) on delete set null,
  user_id text references users(id) on delete set null,
  event_type text not null,
  provider text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists server_errors (
  id text primary key default gen_random_uuid()::text,
  path text,
  method text,
  status integer,
  message text,
  stack text,
  created_at timestamptz not null default now()
);

create table if not exists growth_events (
  id text primary key default gen_random_uuid()::text,
  user_id text references users(id) on delete set null,
  event_type text not null,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists admin_audit_logs (
  id text primary key default gen_random_uuid()::text,
  admin_user_id text references users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_email on users(email);
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);
create index if not exists idx_analyses_user_id_created_at on analyses(user_id, created_at desc);
create index if not exists idx_ai_questions_user_id_created_at on ai_questions(user_id, created_at desc);
create index if not exists idx_payments_user_id_created_at on payments(user_id, created_at desc);
create index if not exists idx_payments_provider_payment_id on payments(provider_payment_id);
create index if not exists idx_billing_events_created_at on billing_events(created_at desc);
create index if not exists idx_server_errors_created_at on server_errors(created_at desc);
create index if not exists idx_growth_events_created_at on growth_events(created_at desc);
create index if not exists idx_admin_audit_logs_created_at on admin_audit_logs(created_at desc);
