-- MavenLex v2.0.0 Production Database Foundation
-- PostgreSQL / Supabase / Neon compatible schema.

create table if not exists users (
  id uuid primary key,
  email text not null unique,
  name text,
  company text,
  plan text not null default 'free',
  role text not null default 'user',
  password_salt text,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists history (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null default 'note',
  file_name text,
  risk_score integer default 0,
  summary text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists history_user_created_idx on history(user_id, created_at desc);

create table if not exists usage (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  month text not null,
  reviews integer not null default 0,
  questions integer not null default 0,
  exports integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, month)
);

create table if not exists subscriptions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  provider text not null default 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key,
  user_id uuid references users(id) on delete set null,
  provider text not null,
  provider_payment_id text,
  amount integer not null default 0,
  currency text not null default 'RUB',
  status text not null default 'pending',
  raw_event jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key,
  user_id uuid references users(id) on delete set null,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
