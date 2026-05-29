-- MavenLex v5.6.0 launch-ready PostgreSQL extensions
-- Run after 001, 002 and 003 when preparing a managed PostgreSQL database.

CREATE TABLE IF NOT EXISTS legal_templates (
  id TEXT PRIMARY KEY,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  category TEXT NOT NULL,
  default_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  checked_by TEXT,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS launch_readiness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_version TEXT NOT NULL,
  area TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO legal_templates (id, title_ru, title_en, category, default_path) VALUES
  ('contract_review', 'Анализ договора перед подписанием', 'Pre-signing contract review', 'review', '/analyze'),
  ('nda_review', 'Проверка NDA', 'NDA review', 'review', '/ai-nda-analysis'),
  ('service_agreement', 'Проверка договора услуг', 'Service agreement review', 'review', '/ai-service-agreement-analysis'),
  ('lease_review', 'Проверка договора аренды', 'Lease review', 'review', '/ai-lease-analysis'),
  ('employment_contract', 'Трудовой договор', 'Employment contract', 'drafting', '/builder'),
  ('privacy_policy', 'Privacy Policy / обработка данных', 'Privacy policy / data processing', 'drafting', '/builder'),
  ('claim_letter', 'Претензия контрагенту', 'Counterparty claim letter', 'action', '/situation'),
  ('risk_memo', 'Юридическая записка по рискам', 'Legal risk memo', 'analysis', '/situation')
ON CONFLICT (id) DO UPDATE SET
  title_ru = EXCLUDED.title_ru,
  title_en = EXCLUDED.title_en,
  category = EXCLUDED.category,
  default_path = EXCLUDED.default_path,
  updated_at = NOW();
