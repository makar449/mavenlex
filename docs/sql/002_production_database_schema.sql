-- MavenLex v2.8.0 Production Database Foundation
-- PostgreSQL-compatible schema for Supabase, Neon, Render PostgreSQL, Railway, or managed Postgres.
-- Run this before switching DATABASE_PROVIDER to postgresql/supabase/neon in production.

create table if not exists users (
  id text primary key,
  email text unique not null,
  name text,
  role text not null default 'user',
  plan text not null default 'free',
  billing_status text not null default 'active',
  password_hash text,
  password_salt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  user_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);

create table if not exists analyses (
  id text primary key,
  user_id text references users(id) on delete set null,
  file_name text,
  file_type text,
  summary text,
  risk_level text,
  ai_mode text,
  provider text,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_analyses_user_id on analyses(user_id);
create index if not exists idx_analyses_created_at on analyses(created_at desc);

create table if not exists usage_counters (
  user_id text primary key references users(id) on delete cascade,
  reviews integer not null default 0,
  questions integer not null default 0,
  exports integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  plan text not null,
  status text not null,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

create table if not exists payments (
  id text primary key,
  user_id text references users(id) on delete set null,
  plan text not null,
  amount integer not null default 0,
  currency text not null default 'RUB',
  status text not null,
  provider text not null,
  provider_payment_id text,
  checkout_url text,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_user_id on payments(user_id);
create index if not exists idx_payments_status on payments(status);

create table if not exists billing_events (
  id text primary key,
  provider text not null,
  event_type text not null,
  payment_id text,
  subscription_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists server_errors (
  id text primary key,
  type text,
  message text not null,
  path text,
  stack text,
  created_at timestamptz not null default now()
);
create index if not exists idx_server_errors_created_at on server_errors(created_at desc);

create table if not exists growth_events (
  id text primary key,
  type text not null,
  path text,
  plan text,
  user_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_growth_events_type on growth_events(type);
create index if not exists idx_growth_events_created_at on growth_events(created_at desc);

create table if not exists audit_events (
  id text primary key,
  actor_user_id text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_events_created_at on audit_events(created_at desc);
