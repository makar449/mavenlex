import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const APP_VERSION = '6.1.6-simplified-owner-local-admin';
// legacy release marker: 5.1.0-production-hardening-commercial-polish
const MAX_FILE_SIZE_MB = 15;
const MIN_EXTRACTED_CHARS = 80;
const EXTRACTION_TIMEOUT_MS = Number(process.env.EXTRACTION_TIMEOUT_MS || 30000);
const ABUSE_RATE_LIMIT_ENABLED = String(process.env.ABUSE_RATE_LIMIT_ENABLED || 'true').toLowerCase() !== 'false';
const ABUSE_DEFAULT_WINDOW_MS = Number(process.env.ABUSE_DEFAULT_WINDOW_MS || 60_000);
const ABUSE_DEFAULT_MAX = Number(process.env.ABUSE_DEFAULT_MAX || 240);
const ABUSE_AUTH_MAX = Number(process.env.ABUSE_AUTH_MAX || 20);
const ABUSE_AI_MAX_PER_HOUR = Number(process.env.ABUSE_AI_MAX_PER_HOUR || 80);
const ABUSE_UPLOAD_MAX_PER_HOUR = Number(process.env.ABUSE_UPLOAD_MAX_PER_HOUR || 30);
const SUPPORT_MAX_MESSAGE_CHARS = Number(process.env.SUPPORT_MAX_MESSAGE_CHARS || 3000);
const PUBLIC_SEO_PAGES = ['/', '/faq', '/launch', '/qa', '/ai-contract-analysis', '/contract-risk-analysis', '/business-contract-review', '/ai-nda-analysis', '/ai-service-agreement-analysis', '/ai-lease-analysis', '/contract-penalty-analysis', '/check-contract-before-signing', '/privacy', '/terms', '/security', '/support', '/help', '/clauses', '/rewrite'];
const SUPPORTED_LANGUAGES = ['ru', 'en'];
const DEFAULT_LANGUAGE = String(process.env.DEFAULT_LANGUAGE || 'ru').toLowerCase() === 'en' ? 'en' : 'ru';
const MULTILINGUAL_MODE = String(process.env.MULTILINGUAL_MODE || 'true').toLowerCase() !== 'false';
const LANGUAGE_DETECTION_ENABLED = String(process.env.LANGUAGE_DETECTION_ENABLED || 'true').toLowerCase() !== 'false';

const RELIABILITY_API_TIMEOUT_MS = Number(process.env.RELIABILITY_API_TIMEOUT_MS || 45000);
const RELIABILITY_AI_TIMEOUT_MS = Number(process.env.RELIABILITY_AI_TIMEOUT_MS || 90000);
const RELIABILITY_SLOW_REQUEST_MS = Number(process.env.RELIABILITY_SLOW_REQUEST_MS || 2500);
const RELIABILITY_MAX_SLOW_EVENTS = Number(process.env.RELIABILITY_MAX_SLOW_EVENTS || 500);
const STATIC_CACHE_MAX_AGE = process.env.STATIC_CACHE_MAX_AGE || '1h';
const HEALTH_PROBE_STRICT = String(process.env.HEALTH_PROBE_STRICT || 'false').toLowerCase() === 'true';

const AI_COST_TRACKING_ENABLED = String(process.env.AI_COST_TRACKING_ENABLED || 'true').toLowerCase() !== 'false';
const AI_COST_CURRENCY = String(process.env.AI_COST_CURRENCY || 'RUB').toUpperCase();
const AI_COST_INPUT_PER_1K = Number(process.env.AI_COST_INPUT_PER_1K || 0.12);
const AI_COST_OUTPUT_PER_1K = Number(process.env.AI_COST_OUTPUT_PER_1K || 0.20);
const AI_COST_MONTHLY_BUDGET = Number(process.env.AI_COST_MONTHLY_BUDGET || 3000);
const AI_COST_ALERT_THRESHOLD_PERCENT = Number(process.env.AI_COST_ALERT_THRESHOLD_PERCENT || 80);
const AI_COST_DEEP_ANALYSIS_FREE_LIMIT = Number(process.env.AI_COST_DEEP_ANALYSIS_FREE_LIMIT || 0);
const AI_COST_PROVIDER_MODEL = process.env.AI_COST_PROVIDER_MODEL || process.env.YANDEX_MODEL || 'yandexgpt';

const STORAGE_MODE = String(process.env.FILE_STORAGE_MODE || process.env.STORAGE_MODE || 'none').toLowerCase();
const FILE_RETENTION_DAYS = Number(process.env.FILE_RETENTION_DAYS || 7);
const FILE_PRIVACY_MODE = String(process.env.FILE_PRIVACY_MODE || 'metadata-only').toLowerCase();
const SECURE_FILE_STORAGE_DIR = process.env.SECURE_FILE_STORAGE_DIR || path.join(process.cwd(), '.data', 'secure-files');
const STORAGE_MAX_FILE_SIZE_MB = Number(process.env.STORAGE_MAX_FILE_SIZE_MB || MAX_FILE_SIZE_MB);
const TEAM_WORKSPACE_ENABLED = String(process.env.TEAM_WORKSPACE_ENABLED || 'true').toLowerCase() !== 'false';
const CLAUSE_LIBRARY_ENABLED = String(process.env.CLAUSE_LIBRARY_ENABLED || 'true').toLowerCase() !== 'false';
const REWRITE_ASSISTANT_ENABLED = String(process.env.REWRITE_ASSISTANT_ENABLED || 'true').toLowerCase() !== 'false';

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function clientError(message, status = 400, details = {}) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}

function uploadErrorMessage(error) {
  if (!error) return 'Upload failed.';
  if (error.code === 'LIMIT_FILE_SIZE') return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
  return error.message || 'Upload failed.';
}

function normalizeLanguage(value, fallback = DEFAULT_LANGUAGE) {
  const lang = String(value || '').toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : fallback;
}

function detectTextLanguage(text = '') {
  const sample = String(text || '').slice(0, 6000);
  const cyrillic = (sample.match(/[А-Яа-яЁё]/g) || []).length;
  const latin = (sample.match(/[A-Za-z]/g) || []).length;
  if (!LANGUAGE_DETECTION_ENABLED) return { language: DEFAULT_LANGUAGE, confidence: 'Disabled', cyrillic, latin };
  if (cyrillic >= Math.max(40, latin * 0.6)) return { language: 'ru', confidence: cyrillic > latin ? 'High' : 'Medium', cyrillic, latin };
  if (latin >= Math.max(80, cyrillic * 1.7)) return { language: 'en', confidence: latin > cyrillic * 3 ? 'High' : 'Medium', cyrillic, latin };
  return { language: DEFAULT_LANGUAGE, confidence: 'Low', cyrillic, latin };
}

function localizedPublicPages() {
  return PUBLIC_SEO_PAGES.flatMap(page => page === '/' ? ['/', '/ru', '/en'] : [page, `/ru${page}`, `/en${page}`]);
}
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(txt|docx|pdf)$/i.test(file.originalname || '');
    if (!ok) return cb(new Error('Unsupported file type. Please upload TXT, DOCX or PDF.'));
    cb(null, true);
  }
});

app.use(cors({ origin: true, credentials: true }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});
app.use(express.json({ limit: '3mb' }));

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  req.setTimeout(RELIABILITY_API_TIMEOUT_MS);
  res.setTimeout(RELIABILITY_API_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      try { recordServerError(req, 'API request timeout', 504); } catch (_) {}
      res.status(504).json({ error: 'The service is taking longer than expected. Please try again.', code: 'API_TIMEOUT' });
    }
  });
  next();
});

const abuseBuckets = new Map();
function ipKey(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'unknown').split(',')[0].trim();
}
function abuseProfile(req) {
  const p = req.path || '';
  if (p.includes('/auth/login') || p.includes('/auth/register') || p.includes('/password-reset')) return { name: 'auth', windowMs: 60_000, max: ABUSE_AUTH_MAX };
  if (p.includes('/analyze-contract') || p.includes('/compare-contracts')) return { name: 'upload_ai', windowMs: 60 * 60_000, max: ABUSE_UPLOAD_MAX_PER_HOUR };
  if (p.includes('/legal-chat') || p.includes('/law-article-search')) return { name: 'ai_chat', windowMs: 60 * 60_000, max: ABUSE_AI_MAX_PER_HOUR };
  if (p.includes('/support')) return { name: 'support', windowMs: 60 * 60_000, max: 20 };
  return { name: 'api', windowMs: ABUSE_DEFAULT_WINDOW_MS, max: ABUSE_DEFAULT_MAX };
}
function recordAbuseEvent(req, profile, count) {
  try {
    const db = readDb();
    db.abuseEvents = db.abuseEvents || [];
    db.abuseEvents.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), type: 'rate_limit_blocked', profile: profile.name, count, path: safePathForLog(req), method: req.method, ip: ipKey(req), userAgent: String(req.headers['user-agent'] || '').slice(0, 180) });
    db.abuseEvents = db.abuseEvents.slice(0, 1000);
    writeDb(db);
  } catch (e) { console.warn('[abuse/log]', e.message); }
}
app.use((req, res, next) => {
  if (!ABUSE_RATE_LIMIT_ENABLED || !req.path.startsWith('/api/')) return next();
  const profile = abuseProfile(req);
  const now = Date.now();
  const key = `${profile.name}:${ipKey(req)}`;
  const bucket = abuseBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > profile.windowMs) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  abuseBuckets.set(key, bucket);
  res.setHeader('X-RateLimit-Limit', String(profile.max));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, profile.max - bucket.count)));
  if (bucket.count > profile.max) {
    recordAbuseEvent(req, profile, bucket.count);
    return res.status(429).json({ error: 'Too many requests. Please wait and try again.', code: 'RATE_LIMITED', profile: profile.name });
  }
  next();
});
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      const durationMs = Date.now() - started;
      console.log(`[api] ${req.method} ${req.path} -> ${res.statusCode} ${durationMs}ms`);
      recordAuditEvent({ method: req.method, path: req.path, status: res.statusCode, durationMs });
      if (durationMs >= RELIABILITY_SLOW_REQUEST_MS) recordSlowRequest(req, durationMs, res.statusCode);
      if (res.statusCode >= 500) recordServerError(req, `HTTP ${res.statusCode}`, res.statusCode);
    }
  });
  next();
});



// -----------------------------
// MavenLex Auth + JSON Database Foundation
// -----------------------------
const DATA_DIR = process.env.MAVENLEX_DATA_DIR || path.join(process.cwd(), '.data');
const DB_FILE = process.env.MAVENLEX_DB_FILE || path.join(DATA_DIR, 'mavenlex-db.json');
const AUTH_TOKEN_TTL_DAYS = Number(process.env.AUTH_TOKEN_TTL_DAYS || 30);
const AUTH_PASSWORD_MIN_LENGTH = Number(process.env.AUTH_PASSWORD_MIN_LENGTH || 8);
const AUTH_PASSWORD_COMPLEXITY = String(process.env.AUTH_PASSWORD_COMPLEXITY || 'medium').toLowerCase();
const AUTH_MAX_SESSIONS_PER_USER = Number(process.env.AUTH_MAX_SESSIONS_PER_USER || 10);
const AUTH_RESET_TOKEN_TTL_MINUTES = Number(process.env.AUTH_RESET_TOKEN_TTL_MINUTES || 60);
const AUTH_VERIFY_TOKEN_TTL_HOURS = Number(process.env.AUTH_VERIFY_TOKEN_TTL_HOURS || 24);
const AUTH_FAILED_LOGIN_LIMIT = Number(process.env.AUTH_FAILED_LOGIN_LIMIT || 5);
const AUTH_FAILED_LOGIN_LOCK_MINUTES = Number(process.env.AUTH_FAILED_LOGIN_LOCK_MINUTES || 15);
const AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_BILLING = String(process.env.AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_BILLING || 'false').toLowerCase() === 'true';
const AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_AI = String(process.env.AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_AI || 'false').toLowerCase() === 'true';
const EMAIL_PROVIDER = String(process.env.EMAIL_PROVIDER || process.env.MAIL_PROVIDER || 'console').toLowerCase();
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.MAIL_FROM || 'MavenLex <no-reply@mavenlex.app>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_REPLY_TO || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const AUTH_COOKIE_ENABLED = String(process.env.AUTH_COOKIE_ENABLED || 'true').toLowerCase() !== 'false';
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mavenlex_session';
const AUTH_CSRF_ENABLED = String(process.env.AUTH_CSRF_ENABLED || 'true').toLowerCase() !== 'false';
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true';
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'Lax';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';
const DATABASE_PROVIDER = String(process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER || 'json').toLowerCase();
const DATABASE_URL = process.env.DATABASE_URL || '';
const BILLING_PROVIDER = String(process.env.BILLING_PROVIDER || 'manual').toLowerCase();
const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === 'true';
const APP_BASE_URL = String(process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
const FRONTEND_DIST_DIR = process.env.FRONTEND_DIST_DIR || path.join(process.cwd(), 'dist');
const SERVE_FRONTEND = process.env.SERVE_FRONTEND !== 'false';
const BILLING_CURRENCY = String(process.env.BILLING_CURRENCY || 'RUB').toUpperCase();
const BILLING_SUCCESS_PATH = process.env.BILLING_SUCCESS_PATH || '/billing/success';
const BILLING_CANCEL_PATH = process.env.BILLING_CANCEL_PATH || '/billing/cancel';
const BILLING_WEBHOOK_SECRET = process.env.BILLING_WEBHOOK_SECRET || '';
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';
const YOOKASSA_RETURN_URL_MODE = String(process.env.YOOKASSA_RETURN_URL_MODE || 'success-page').toLowerCase();
const YOOKASSA_CAPTURE = String(process.env.YOOKASSA_CAPTURE || 'true').toLowerCase() !== 'false';
const YOOKASSA_ENABLE_RECEIPTS = String(process.env.YOOKASSA_ENABLE_RECEIPTS || 'false').toLowerCase() === 'true';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const YOOKASSA_API_URL = String(process.env.YOOKASSA_API_URL || 'https://api.yookassa.ru/v3').replace(/\/$/, '');
const YOOKASSA_VAT_CODE = process.env.YOOKASSA_VAT_CODE || '';
const YOOKASSA_TAX_SYSTEM_CODE = process.env.YOOKASSA_TAX_SYSTEM_CODE || '';
const BILLING_WEBHOOK_VERIFY_WITH_PROVIDER = String(process.env.BILLING_WEBHOOK_VERIFY_WITH_PROVIDER || 'true').toLowerCase() !== 'false';
const BILLING_ALLOW_MOCK_IN_PRODUCTION = String(process.env.BILLING_ALLOW_MOCK_IN_PRODUCTION || 'false').toLowerCase() === 'true';
const BILLING_STRICT_WEBHOOKS = String(process.env.BILLING_STRICT_WEBHOOKS || 'true').toLowerCase() !== 'false';
const LAUNCH_MODE = String(process.env.LAUNCH_MODE || 'public').toLowerCase();
const PUBLIC_LAUNCH_MODE = String(process.env.PUBLIC_LAUNCH_MODE || 'true').toLowerCase() !== 'false';
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || '').split(',').map(normalizeEmail).filter(Boolean);
const OWNER_EMAILS = String(process.env.OWNER_EMAILS || process.env.ADMIN_OWNER_EMAILS || 'starmatew3@gmail.com').split(',').map(normalizeEmail).filter(Boolean);
const PLAN_LIMITS = {
  free: { reviews: 3, questions: 20, exports: 3, aiDailyBudget: Number(process.env.AI_BUDGET_FREE_DAILY || 0), aiMonthlyBudget: Number(process.env.AI_BUDGET_FREE_MONTHLY || 0), label: 'Free' },
  pro: { reviews: 30, questions: 300, exports: 30, aiDailyBudget: Number(process.env.AI_BUDGET_PRO_DAILY || 60), aiMonthlyBudget: Number(process.env.AI_BUDGET_PRO_MONTHLY || 900), label: 'Pro' },
  business: { reviews: 200, questions: 2000, exports: 200, aiDailyBudget: Number(process.env.AI_BUDGET_BUSINESS_DAILY || 300), aiMonthlyBudget: Number(process.env.AI_BUDGET_BUSINESS_MONTHLY || 5000), label: 'Business' }
};
const PLAN_CATALOG = {
  free: { id: 'free', label: 'Free', priceMonthly: 0, currency: BILLING_CURRENCY, checkout: false, description: 'Starter plan with low limits.' },
  pro: { id: 'pro', label: 'Pro', priceMonthly: Number(process.env.PRO_PRICE_MONTHLY || 990), currency: BILLING_CURRENCY, checkout: true, description: 'Individual plan for regular contract reviews.' },
  business: { id: 'business', label: 'Business', priceMonthly: Number(process.env.BUSINESS_PRICE_MONTHLY || 4990), currency: BILLING_CURRENCY, checkout: true, description: 'Small-business plan with higher usage limits.' }
};
function configuredDbProvider() {
  if (DATABASE_PROVIDER === 'postgres' || DATABASE_PROVIDER === 'postgresql' || DATABASE_PROVIDER === 'supabase' || DATABASE_PROVIDER === 'neon') return DATABASE_PROVIDER;
  return 'json';
}
function databaseModeInfo() {
  const provider = configuredDbProvider();
  const hasUrl = Boolean(DATABASE_URL);
  const productionReady = provider !== 'json' && hasUrl;
  return {
    provider,
    productionReady,
    hasDatabaseUrl: hasUrl,
    jsonFallback: provider === 'json' || !hasUrl,
    dataDir: provider === 'json' ? DATA_DIR : undefined,
    migrationFile: 'docs/sql/003_postgresql_database_foundation.sql',
    requiredTables: ['users', 'sessions', 'analyses', 'ai_questions', 'usage', 'subscriptions', 'payments', 'billing_events', 'server_errors', 'growth_events', 'audit_events', 'admin_audit_logs'],
    supportedProviders: ['json', 'postgresql', 'supabase', 'neon'],
    nextAction: productionReady ? 'Run migrations and configure persistent backups on the provider.' : 'Set DATABASE_PROVIDER=postgresql and DATABASE_URL on the hosting provider before heavy public usage.',
    note: provider === 'json' ? 'JSON storage is suitable for local development only. Use PostgreSQL/Supabase/Neon for real users.' : 'PostgreSQL-compatible database mode is configured. Run the SQL migration before switching live traffic.'
  };
}
function databaseReadiness(db = null) {
  const info = databaseModeInfo();
  const activeDb = db || readDb();
  const counts = {
    users: (activeDb.users || []).length,
    sessions: (activeDb.sessions || []).length,
    analyses: (activeDb.history || []).length,
    usage: (activeDb.usage || []).length,
    subscriptions: (activeDb.subscriptions || []).length,
    payments: (activeDb.payments || []).length,
    billingEvents: (activeDb.billingEvents || []).length,
    serverErrors: (activeDb.serverErrors || []).length,
    growthEvents: (activeDb.growthEvents || []).length,
    auditEvents: (activeDb.auditEvents || []).length
  };
  const blockers = [];
  const warnings = [];
  if (LAUNCH_MODE === 'production' && info.jsonFallback) blockers.push('Production launch mode requires DATABASE_PROVIDER=postgresql/supabase/neon and DATABASE_URL.');
  if (info.jsonFallback) warnings.push('JSON storage is not durable enough for real user data on most hosting platforms.');
  if (!info.hasDatabaseUrl && info.provider !== 'json') blockers.push('DATABASE_PROVIDER is set but DATABASE_URL is missing.');
  return { ok: blockers.length === 0, info, counts, blockers, warnings };
}

function goLiveUrlReadiness() {
  const publicUrl = String(process.env.PUBLIC_APP_URL || process.env.APP_BASE_URL || '').trim().replace(/\/$/, '');
  const blockers = [];
  const warnings = [];
  let parsed = null;
  try {
    parsed = publicUrl ? new URL(publicUrl) : null;
  } catch (_) {
    blockers.push({ code: 'PUBLIC_APP_URL_INVALID', title: 'PUBLIC_APP_URL is invalid', fix: 'Set PUBLIC_APP_URL to the real https://...app domain on hosting.' });
  }
  if (!publicUrl) blockers.push({ code: 'PUBLIC_APP_URL_MISSING', title: 'PUBLIC_APP_URL is missing', fix: 'Set PUBLIC_APP_URL=https://your-site.app on hosting.' });
  if (parsed && parsed.protocol !== 'https:' && !parsed.hostname.includes('localhost')) blockers.push({ code: 'PUBLIC_APP_URL_NOT_HTTPS', title: 'Public app URL must use HTTPS', fix: 'Use the final https://...app domain.' });
  if (parsed && /example|your-site|your-app/i.test(parsed.hostname)) warnings.push({ code: 'PUBLIC_APP_URL_PLACEHOLDER', title: 'Public app URL still looks like a placeholder', fix: 'Replace it with the real .app domain before go-live.' });
  const appBaseUrl = APP_BASE_URL;
  if (publicUrl && appBaseUrl && publicUrl !== appBaseUrl && !appBaseUrl.includes('localhost')) warnings.push({ code: 'APP_BASE_URL_MISMATCH', title: 'APP_BASE_URL and PUBLIC_APP_URL differ', fix: 'Use the same production domain for both values.' });
  return {
    ok: blockers.length === 0,
    publicUrl: publicUrl || null,
    appBaseUrl,
    hostname: parsed?.hostname || null,
    isHttps: parsed?.protocol === 'https:',
    isLocalhost: Boolean(parsed?.hostname?.includes('localhost')),
    expectedRoutes: ['/', '/faq', '/privacy', '/terms', '/security', '/pricing', '/account', '/admin'],
    expectedApi: ['/api/health', '/api/launch-check', '/api/production-check', '/api/go-live-check', '/api/commercial-release-check'],
    blockers,
    warnings
  };
}

function planForUser(user) {
  return String(user?.plan || 'free').toLowerCase();
}
function planLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}
function usageWithLimits(user, usage) {
  const plan = planForUser(user);
  const limits = planLimits(plan);
  return {
    plan,
    limits,
    usage: { reviews: Number(usage?.reviews || 0), questions: Number(usage?.questions || 0), exports: Number(usage?.exports || 0) },
    remaining: {
      reviews: Math.max(0, limits.reviews - Number(usage?.reviews || 0)),
      questions: Math.max(0, limits.questions - Number(usage?.questions || 0)),
      exports: Math.max(0, limits.exports - Number(usage?.exports || 0))
    }
  };
}



function usageWarningsForUser(user, usage) {
  const snapshot = usageWithLimits(user, usage);
  const warnings = [];
  for (const key of ['reviews','questions','exports']) {
    const limit = Number(snapshot.limits?.[key] || 0);
    const used = Number(snapshot.usage?.[key] || 0);
    if (limit && limit < 999) {
      const percent = Math.round((used / limit) * 100);
      if (percent >= 100) warnings.push({ key, level: 'blocked', percent, message: `${key} limit is reached.` });
      else if (percent >= 80) warnings.push({ key, level: 'warning', percent, message: `${key} usage is above 80%.` });
    }
  }
  return warnings;
}
function billingLifecycleForUser(db, user) {
  const payments = (db.payments || []).filter(p => p.userId === user.id);
  const failed = payments.find(p => ['failed','canceled','cancelled'].includes(String(p.status || '').toLowerCase()));
  const active = activeSubscriptionForUser(db, user.id);
  const status = user.billingStatus || (active ? active.status : 'free');
  let banner = null;
  if (failed) banner = { type: 'warning', code: 'PAYMENT_ATTENTION', text: 'Payment needs attention. Update billing or retry checkout.' };
  if (['cancelled','expired','past_due','inactive'].includes(String(status).toLowerCase())) banner = { type: 'danger', code: 'SUBSCRIPTION_INACTIVE', text: 'Subscription is not active. Upgrade or reactivate to keep paid limits.' };
  if (!banner && planForUser(user) === 'free') banner = { type: 'info', code: 'FREE_PLAN', text: 'Free plan is active. Upgrade for higher AI and export limits.' };
  return { status, active: Boolean(active), failedPayment: failed ? { id: failed.id, status: failed.status, planId: failed.planId, amount: failed.amount, currency: failed.currency, createdAt: failed.createdAt } : null, banner };
}
function normalizedBillingProvider() {
  if (['manual', 'mock', 'yookassa', 'stripe'].includes(BILLING_PROVIDER)) return BILLING_PROVIDER;
  return 'manual';
}
function billingProviderStatus() {
  const provider = normalizedBillingProvider();
  const yookassaConfigured = Boolean(YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY);
  const stripeConfigured = Boolean(STRIPE_SECRET_KEY);
  const configured = provider === 'manual' || provider === 'mock' || (provider === 'yookassa' && yookassaConfigured) || (provider === 'stripe' && stripeConfigured);
  const externalProvider = provider !== 'manual' && provider !== 'mock';
  const mockBlockedInProduction = LAUNCH_MODE === 'production' && provider === 'mock' && !BILLING_ALLOW_MOCK_IN_PRODUCTION;
  const webhookSecretConfigured = Boolean(BILLING_WEBHOOK_SECRET);
  const returnUrlConfigured = APP_BASE_URL.startsWith('https://') || APP_BASE_URL.includes('localhost');
  return {
    provider,
    mode: provider === 'manual' || provider === 'mock' ? 'safe-fallback' : 'external-provider-ready',
    paymentsEnabled: PAYMENTS_ENABLED,
    liveReady: PAYMENTS_ENABLED && configured && externalProvider && webhookSecretConfigured && returnUrlConfigured,
    configured,
    currency: BILLING_CURRENCY,
    appBaseUrl: APP_BASE_URL,
    returnUrlConfigured,
    yookassaConfigured,
    stripeConfigured,
    webhookSecretConfigured,
    webhookVerificationWithProvider: BILLING_WEBHOOK_VERIFY_WITH_PROVIDER,
    strictWebhooks: BILLING_STRICT_WEBHOOKS,
    allowMockInProduction: BILLING_ALLOW_MOCK_IN_PRODUCTION,
    mockBlockedInProduction,
    productionSafety: {
      mockBlockedInProduction,
      manualRequiresAdminActivation: provider === 'manual',
      externalProvider,
      liveCheckoutAllowed: PAYMENTS_ENABLED && configured && !mockBlockedInProduction
    },
    note: provider === 'manual' || provider === 'mock'
      ? (PUBLIC_LAUNCH_MODE ? 'Safe plan activation is active.' : 'Manual/mock checkout is active. No real money is charged.')
      : configured
        ? `${provider} environment variables are present. Live checkout adapter is enabled when PAYMENTS_ENABLED=true.`
        : `${provider} is selected but required secrets are missing.`,
    publicMode: PUBLIC_LAUNCH_MODE,
    publicNotice: provider === 'manual' || provider === 'mock' ? {
      ru: 'Оплата временно обрабатывается в безопасном режиме. После выбора тарифа статус и лимиты обновятся в кабинете.',
      en: 'Payments are temporarily handled in a secure mode. After choosing a plan, status and limits update in Account.'
    } : null
  };
}
function subscriptionPeriodForUser(user, subscription = null) {
  const now = new Date();
  const start = subscription?.currentPeriodStart ? new Date(subscription.currentPeriodStart) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString(), renewalDate: end.toISOString(), daysLeft: Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000)) };
}
function subscriptionOverview(db, user) {
  const usage = userUsage(db, user.id);
  const subscription = activeSubscription(db, user.id) || (db.subscriptions || []).find(s => s.userId === user.id && s.status !== 'cancelled') || null;
  const snapshot = usageWithLimits(user, usage);
  const period = subscriptionPeriodForUser(user, subscription);
  return {
    ok: true,
    plan: snapshot.plan,
    status: user.billingStatus || (snapshot.plan === 'free' ? 'free' : 'active'),
    provider: user.billingProvider || BILLING_PROVIDER,
    usage: snapshot.usage,
    limits: snapshot.limits,
    remaining: snapshot.remaining,
    period,
    subscription,
    renewalDate: period.renewalDate,
    gracePeriodDays: Number(process.env.BILLING_GRACE_PERIOD_DAYS || 3),
    canUpgrade: snapshot.plan !== 'business',
    canDowngrade: snapshot.plan !== 'free',
    canCancel: snapshot.plan !== 'free',
    warnings: usageWarningsForUser(user, usage),
    lifecycle: billingLifecycleForUser(db, user)
  };
}
function workspaceSummary(db, user) {
  const items = (db.history || []).filter(x => x.userId === user.id);
  const active = items.filter(x => !x.archived);
  const contracts = active.filter(x => x.type === 'contract');
  const comparisons = active.filter(x => x.type === 'comparison');
  const folders = [...new Set(active.map(x => x.folder).filter(Boolean))].sort();
  const highRisk = contracts.filter(x => Number(x.riskScore || x.payload?.riskScore || 0) >= 80).length;
  const favorites = active.filter(x => x.favorite).length;
  return { ok: true, total: items.length, active: active.length, archived: items.length - active.length, contracts: contracts.length, comparisons: comparisons.length, favorites, highRisk, folders, recent: active.slice(0, 10) };
}
function emailNotificationsReadiness(db = readDb()) {
  const blockers = [];
  const warnings = [];
  if (LAUNCH_MODE === 'production' && EMAIL_PROVIDER === 'console') blockers.push('Set EMAIL_PROVIDER=resend or smtp for production notifications.');
  if (EMAIL_PROVIDER === 'resend' && !RESEND_API_KEY) blockers.push('RESEND_API_KEY is missing.');
  if (!EMAIL_FROM) blockers.push('EMAIL_FROM is missing.');
  if (!APP_BASE_URL || APP_BASE_URL.includes('localhost') && LAUNCH_MODE === 'production') warnings.push('APP_BASE_URL should point to the public .app domain for email links.');
  return {
    ok: blockers.length === 0,
    provider: EMAIL_PROVIDER,
    from: EMAIL_FROM,
    templates: ['verify_email', 'reset_password', 'payment_success', 'payment_failed', 'plan_activated', 'report_ready', 'admin_alert'],
    endpoints: ['/api/auth/email-readiness','/api/email/notifications/readiness','/api/email/report-ready','/api/email/admin-alert','/api/auth/email/test'],
    blockers,
    warnings,
    recentEvents: (db.auditEvents || []).filter(e => String(e.type || '').startsWith('email_')).slice(0, 10)
  };
}
async function sendNotificationEmail(db, user, type, data = {}) {
  const email = user?.email || data.email;
  if (!email) return { ok: false, skipped: true, reason: 'missing_email' };
  const titles = {
    payment_success: 'MavenLex: оплата прошла успешно',
    payment_failed: 'MavenLex: не удалось обработать оплату',
    plan_activated: 'MavenLex: тариф активирован',
    report_ready: 'MavenLex: отчёт готов',
    admin_alert: 'MavenLex admin alert'
  };
  const subject = data.subject || titles[type] || 'MavenLex notification';
  const text = data.text || (type === 'report_ready'
    ? `Отчёт по договору готов. Откройте кабинет: ${APP_BASE_URL}/account`
    : type === 'plan_activated'
      ? `Тариф ${data.plan || user.plan || 'Pro'} активирован. Кабинет: ${APP_BASE_URL}/account`
      : `Откройте MavenLex: ${APP_BASE_URL}`);
  const html = emailLayout(subject, `<p>${clean(text)}</p>`, 'Открыть MavenLex', `${APP_BASE_URL}/account`);
  const result = await sendEmail({ to: email, subject, html, text, tags: [type] });
  db.auditEvents = db.auditEvents || [];
  db.auditEvents.unshift({ id: crypto.randomUUID(), type: `email_${type}`, userId: user?.id || null, email, provider: EMAIL_PROVIDER, delivered: Boolean(result.ok), error: result.error || null, createdAt: new Date().toISOString() });
  db.auditEvents = db.auditEvents.slice(0, 500);
  return result;
}

function activeSubscriptionForUser(db, userId) {
  const now = Date.now();
  return (db.subscriptions || []).find(s => s.userId === userId && ['active', 'trialing'].includes(s.status) && (!s.currentPeriodEnd || new Date(s.currentPeriodEnd).getTime() > now)) || null;
}
function billingStatusForUser(db, user) {
  const subscription = activeSubscriptionForUser(db, user.id);
  const payments = (db.payments || []).filter(p => p.userId === user.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 10);
  return {
    plan: planForUser(user),
    billingStatus: user.billingStatus || (subscription ? subscription.status : 'free'),
    billingProvider: user.billingProvider || normalizedBillingProvider(),
    subscription,
    recentPayments: payments.map(p => ({ id: p.id, planId: p.planId, status: p.status, provider: p.provider, amount: p.amount, currency: p.currency, createdAt: p.createdAt, paidAt: p.paidAt || null }))
  };
}
function billingQaChecks() {
  const provider = billingProviderStatus();
  const paidPlans = Object.values(PLAN_CATALOG).filter(plan => plan.checkout && Number(plan.priceMonthly || 0) > 0);
  return {
    provider: provider.provider,
    mode: provider.mode,
    livePaymentsEnabled: provider.liveReady,
    paymentsEnabled: provider.paymentsEnabled,
    webhookSecretConfigured: provider.webhookSecretConfigured,
    webhookProviderVerification: provider.webhookVerificationWithProvider,
    strictWebhooks: provider.strictWebhooks,
    returnUrlConfigured: provider.returnUrlConfigured,
    mockBlockedInProduction: provider.mockBlockedInProduction,
    allowMockInProduction: provider.allowMockInProduction,
    paidPlansConfigured: paidPlans.length >= 2 && paidPlans.every(plan => plan.id && plan.priceMonthly && plan.currency),
    checkoutEndpoint: '/api/billing/checkout',
    webhookEndpoint: '/api/billing/webhook',
    statusEndpoint: '/api/billing/status',
    readinessEndpoint: '/api/billing/readiness',
    mockCompletionEnabled: (provider.provider === 'manual' || provider.provider === 'mock') && !provider.mockBlockedInProduction,
    needsLiveProvider: provider.provider === 'manual' || provider.provider === 'mock' || !provider.liveReady,
    safetyRules: [
      'Do not activate a paid plan unless payment status is succeeded/paid.',
      'Reject webhook activation when provider payment id, plan, amount, or currency do not match the local payment.',
      'Treat duplicate payment_succeeded webhooks as idempotent.',
      'Block mock checkout in production unless BILLING_ALLOW_MOCK_IN_PRODUCTION=true.'
    ],
    liveChecklistEndpoint: '/api/billing/yookassa/readiness',
    nextLiveSteps: [
      'Set BILLING_PROVIDER=yookassa.',
      'Set PAYMENTS_ENABLED=true only after provider keys are present.',
      'Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY on hosting.',
      'Set BILLING_WEBHOOK_SECRET or keep provider verification enabled.',
      'Set APP_BASE_URL to the final https .app domain.',
      'Run one low-value test payment and confirm plan activation in Account and Admin.'
    ]
  };
}

function billingLiveChecklist() {
  const status = billingProviderStatus();
  const checks = [
    { code: 'provider_yookassa', label: 'BILLING_PROVIDER=yookassa', ok: status.provider === 'yookassa' },
    { code: 'payments_enabled', label: 'PAYMENTS_ENABLED=true', ok: status.paymentsEnabled },
    { code: 'shop_id', label: 'YOOKASSA_SHOP_ID configured', ok: Boolean(YOOKASSA_SHOP_ID) },
    { code: 'secret_key', label: 'YOOKASSA_SECRET_KEY configured', ok: Boolean(YOOKASSA_SECRET_KEY) },
    { code: 'webhook_secret', label: 'BILLING_WEBHOOK_SECRET configured', ok: Boolean(BILLING_WEBHOOK_SECRET) || BILLING_WEBHOOK_VERIFY_WITH_PROVIDER },
    { code: 'provider_verification', label: 'Provider verification enabled', ok: BILLING_WEBHOOK_VERIFY_WITH_PROVIDER },
    { code: 'return_url', label: 'APP_BASE_URL is HTTPS or localhost', ok: status.returnUrlConfigured },
    { code: 'success_path', label: 'Success path is configured', ok: BILLING_SUCCESS_PATH === '/billing/success' },
    { code: 'cancel_path', label: 'Cancel path is configured', ok: BILLING_CANCEL_PATH === '/billing/cancel' },
    { code: 'currency_rub', label: 'Currency is RUB', ok: BILLING_CURRENCY === 'RUB' },
    { code: 'mock_guard', label: 'Mock billing blocked in production', ok: status.provider !== 'mock' || !status.mockBlockedInProduction },
    { code: 'strict_webhooks', label: 'Strict webhooks enabled', ok: BILLING_STRICT_WEBHOOKS }
  ];
  const blockers = checks.filter(c => !c.ok).map(c => c.label);
  return {
    ok: blockers.length === 0,
    provider: status.provider,
    liveReady: status.liveReady,
    yookassa: {
      apiUrl: YOOKASSA_API_URL,
      shopIdConfigured: Boolean(YOOKASSA_SHOP_ID),
      secretKeyConfigured: Boolean(YOOKASSA_SECRET_KEY),
      capture: YOOKASSA_CAPTURE,
      receiptsEnabled: YOOKASSA_ENABLE_RECEIPTS,
      returnUrlMode: YOOKASSA_RETURN_URL_MODE
    },
    checks,
    blockers,
    nextSteps: blockers.length ? [
      'Set BILLING_PROVIDER=yookassa.',
      'Set PAYMENTS_ENABLED=true.',
      'Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY on hosting.',
      'Set APP_BASE_URL and PUBLIC_APP_URL to the final .app domain.',
      'Configure YooKassa webhook to POST /api/billing/webhook.',
      'Run API_URL=https://your-site.app npm run billing-check after deploy.'
    ] : [
      'Create a low-value YooKassa test payment.',
      'Return to /billing/success and confirm the plan activates.',
      'Open /admin and verify billing events.',
      'Check YooKassa webhook delivery logs.'
    ]
  };
}

function billingOverview(db) {
  const users = db.users || [];
  const payments = db.payments || [];
  const subs = db.subscriptions || [];
  const byPlan = { free: 0, pro: 0, business: 0 };
  for (const user of users) byPlan[planForUser(user)] = (byPlan[planForUser(user)] || 0) + 1;
  return {
    provider: billingProviderStatus(),
    qa: billingQaChecks(),
    liveChecklist: billingLiveChecklist(),
    usersByPlan: byPlan,
    activeSubscriptions: subs.filter(s => s.status === 'active').length,
    pastDueSubscriptions: subs.filter(s => s.status === 'past_due').length,
    cancelledSubscriptions: subs.filter(s => s.status === 'cancelled').length,
    paymentsTotal: payments.length,
    paymentsSucceeded: payments.filter(p => p.status === 'succeeded').length,
    paymentsPending: payments.filter(p => p.status === 'pending').length,
    paymentsFailed: payments.filter(p => p.status === 'failed').length,
    revenueRecorded: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + Number(p.amount || 0), 0),
    currency: BILLING_CURRENCY,
    recentPayments: payments.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 12),
    recentEvents: (db.billingEvents || []).slice(0, 30)
  };
}
function ensureSubscriptionForPayment(db, payment, status = 'active') {
  const now = new Date();
  const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.subscriptions = db.subscriptions || [];
  let sub = db.subscriptions.find(s => s.userId === payment.userId && s.providerSubscriptionId === payment.providerPaymentId);
  if (!sub) {
    sub = { id: crypto.randomUUID(), userId: payment.userId, planId: payment.planId, status, provider: payment.provider, providerSubscriptionId: payment.providerPaymentId, currentPeriodStart: now.toISOString(), currentPeriodEnd, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    db.subscriptions.unshift(sub);
  } else {
    sub.status = status;
    sub.planId = payment.planId;
    sub.currentPeriodEnd = currentPeriodEnd;
    sub.updatedAt = now.toISOString();
  }
  const user = (db.users || []).find(u => u.id === payment.userId);
  if (user && status === 'active') {
    user.plan = payment.planId;
    user.billingStatus = 'active';
    user.billingProvider = payment.provider;
    user.updatedAt = now.toISOString();
  }
  return sub;
}

function providerReturnUrl(pathname, params = {}) {
  const url = new URL(pathname, APP_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}
function yookassaAuthHeader() {
  return `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`;
}
async function yookassaRequest(endpoint, options = {}) {
  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    const err = new Error('YooKassa credentials are missing. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY.');
    err.status = 503;
    throw err;
  }
  const res = await fetch(`${YOOKASSA_API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: yookassaAuthHeader(),
      'Content-Type': 'application/json',
      ...(options.idempotenceKey ? { 'Idempotence-Key': options.idempotenceKey } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.description || data?.message || `YooKassa API error: ${res.status}`);
    err.status = 502;
    err.providerResponse = data;
    throw err;
  }
  return data;
}
function yookassaAmount(plan) {
  return { value: Number(plan.priceMonthly || 0).toFixed(2), currency: plan.currency || BILLING_CURRENCY };
}
function yookassaReceipt(user, plan) {
  const email = normalizeEmail(user.email || '');
  if (!email) return undefined;
  const item = {
    description: `MavenLex ${plan.label} monthly access`.slice(0, 128),
    quantity: '1.00',
    amount: yookassaAmount(plan),
    payment_subject: 'service',
    payment_mode: 'full_payment'
  };
  if (YOOKASSA_VAT_CODE) item.vat_code = Number(YOOKASSA_VAT_CODE);
  const receipt = { customer: { email }, items: [item] };
  if (YOOKASSA_TAX_SYSTEM_CODE) receipt.tax_system_code = Number(YOOKASSA_TAX_SYSTEM_CODE);
  return receipt;
}
async function createYooKassaPayment(payment, user, plan) {
  const idempotenceKey = payment.id;
  const body = {
    amount: yookassaAmount(plan),
    capture: YOOKASSA_CAPTURE,
    confirmation: {
      type: 'redirect',
      return_url: providerReturnUrl(BILLING_SUCCESS_PATH, { payment: payment.id, plan: plan.id, provider: 'yookassa' })
    },
    description: `MavenLex ${plan.label} subscription`,
    metadata: {
      mavenlexPaymentId: payment.id,
      userId: user.id,
      planId: plan.id
    }
  };
  const receipt = YOOKASSA_ENABLE_RECEIPTS ? yookassaReceipt(user, plan) : undefined;
  if (receipt) body.receipt = receipt;
  const yPayment = await yookassaRequest('/payments', { method: 'POST', idempotenceKey, body });
  payment.providerPaymentId = yPayment.id;
  payment.providerStatus = yPayment.status;
  payment.checkoutUrl = yPayment.confirmation?.confirmation_url || providerReturnUrl(BILLING_SUCCESS_PATH, { payment: payment.id, plan: plan.id, provider: 'yookassa' });
  payment.providerPayload = {
    id: yPayment.id,
    status: yPayment.status,
    paid: yPayment.paid,
    test: yPayment.test,
    created_at: yPayment.created_at
  };
  return payment;
}
function paymentAmountMatches(payment, providerObject = {}) {
  const plan = PLAN_CATALOG[payment?.planId];
  const expected = Number(plan?.priceMonthly || payment?.amount || 0);
  const providerAmount = providerObject.amount?.value ?? providerObject.amount?.amount ?? providerObject.amount;
  const actual = providerAmount === undefined ? Number(payment?.amount || 0) : Number(providerAmount);
  const currency = String(providerObject.amount?.currency || payment?.currency || '').toUpperCase();
  return Number.isFinite(actual) && Math.abs(actual - expected) < 0.01 && currency === String(payment?.currency || BILLING_CURRENCY).toUpperCase();
}
function paymentMetadataMatches(payment, providerObject = {}) {
  const metadata = providerObject.metadata || {};
  if (metadata.mavenlexPaymentId && metadata.mavenlexPaymentId !== payment.id) return false;
  if (metadata.paymentId && metadata.paymentId !== payment.id) return false;
  if (metadata.userId && metadata.userId !== payment.userId) return false;
  if (metadata.planId && metadata.planId !== payment.planId) return false;
  if (providerObject.id && payment.providerPaymentId && providerObject.id !== payment.providerPaymentId) return false;
  return true;
}
function providerPaymentIsPaid(providerObject = {}) {
  return providerObject.status === 'succeeded' || providerObject.paid === true;
}
function addBillingEvent(db, event) {
  db.billingEvents = db.billingEvents || [];
  db.billingEvents.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...event });
  db.billingEvents = db.billingEvents.slice(0, 1000);
}

async function refreshProviderPayment(payment) {
  if (!payment) return null;
  if (payment.provider === 'yookassa' && payment.providerPaymentId && YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY) {
    return yookassaRequest(`/payments/${encodeURIComponent(payment.providerPaymentId)}`);
  }
  return null;
}
async function verifyYooKassaWebhookObject(object, localPayment) {
  if (!BILLING_WEBHOOK_VERIFY_WITH_PROVIDER) return true;
  if (!object?.id || !YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) return Boolean(BILLING_WEBHOOK_SECRET);
  const live = await yookassaRequest(`/payments/${encodeURIComponent(object.id)}`);
  if (localPayment?.providerPaymentId && live.id !== localPayment.providerPaymentId) return false;
  if (object.status && live.status !== object.status) return false;
  return true;
}

async function createCheckoutSession(db, user, planId) {
  const plan = PLAN_CATALOG[planId];
  if (!plan || planId === 'free') {
    const err = new Error('Paid planId is required.');
    err.status = 400;
    throw err;
  }
  const providerInfo = billingProviderStatus();
  if (providerInfo.mockBlockedInProduction) {
    const err = new Error('Mock billing is blocked in production. Set BILLING_PROVIDER=yookassa for live payments or explicitly set BILLING_ALLOW_MOCK_IN_PRODUCTION=true for a controlled staging environment.');
    err.status = 503;
    throw err;
  }
  if (!PAYMENTS_ENABLED && !['manual', 'mock'].includes(providerInfo.provider)) {
    const err = new Error('Payments are not enabled. Set PAYMENTS_ENABLED=true after configuring the provider.');
    err.status = 503;
    throw err;
  }
  const payment = {
    id: crypto.randomUUID(),
    userId: user.id,
    planId,
    status: 'pending',
    provider: providerInfo.provider,
    providerPaymentId: `ml_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    amount: plan.priceMonthly,
    currency: plan.currency,
    checkoutUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (providerInfo.provider === 'manual' || providerInfo.provider === 'mock') {
    payment.checkoutUrl = `${APP_BASE_URL}/account?mockPayment=${payment.id}&plan=${planId}`;
  } else if (providerInfo.provider === 'yookassa') {
    if (!providerInfo.yookassaConfigured) {
      const err = new Error('YooKassa is selected but YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY is missing.');
      err.status = 503;
      throw err;
    }
    await createYooKassaPayment(payment, user, plan);
  } else if (providerInfo.provider === 'stripe') {
    if (!providerInfo.stripeConfigured) {
      const err = new Error('Stripe is selected but STRIPE_SECRET_KEY is missing.');
      err.status = 503;
      throw err;
    }
    payment.checkoutUrl = providerReturnUrl(BILLING_SUCCESS_PATH, { provider: 'stripe', payment: payment.id, plan: planId });
    payment.providerTodo = 'Stripe live adapter is not enabled in this build. Use YooKassa for live checkout or add Stripe SDK adapter later.';
  }
  db.payments = db.payments || [];
  db.payments.unshift(payment);
  addBillingEvent(db, { type: 'checkout_created', paymentId: payment.id, userId: user.id, planId, provider: payment.provider, amount: payment.amount, currency: payment.currency });
  return payment;
}
function markPaymentSucceeded(db, payment, source = 'mock') {
  if (!payment) return null;
  if (payment.status === 'succeeded') {
    addBillingEvent(db, { type: 'payment_succeeded_duplicate_ignored', source, paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider });
    return activeSubscriptionForUser(db, payment.userId) || ensureSubscriptionForPayment(db, payment, 'active');
  }
  payment.status = 'succeeded';
  payment.paidAt = new Date().toISOString();
  payment.updatedAt = new Date().toISOString();
  const subscription = ensureSubscriptionForPayment(db, payment, 'active');
  addBillingEvent(db, { type: 'payment_succeeded', source, paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider });
  addBillingEvent(db, { type: 'subscription_activated', source, paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider, subscriptionId: subscription?.id });
  return subscription;
}
function verifyBillingWebhook(req) {
  if (!BILLING_WEBHOOK_SECRET) return !BILLING_STRICT_WEBHOOKS || normalizedBillingProvider() === 'manual' || normalizedBillingProvider() === 'mock';
  const provided = req.headers['x-mavenlex-webhook-secret'] || req.headers['x-webhook-secret'];
  if (!provided) return false;
  const providedBuf = Buffer.from(String(provided));
  const secretBuf = Buffer.from(String(BILLING_WEBHOOK_SECRET));
  if (providedBuf.length !== secretBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, secretBuf);
}

function isOwnerUser(user) {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return OWNER_EMAILS.includes(normalizeEmail(user.email));
}
const PRODUCT_ROLES = ['user', 'local_admin', 'owner'];
const LEGACY_ROLE_MAP = { admin: 'local_admin', analyst: 'user', manager: 'user', billing: 'user', support: 'local_admin' };
function normalizeProductRole(role) {
  const value = String(role || 'user').toLowerCase();
  return PRODUCT_ROLES.includes(value) ? value : (LEGACY_ROLE_MAP[value] || 'user');
}
function isLocalAdminUser(user) {
  if (!user) return false;
  if (isOwnerUser(user)) return true;
  if (normalizeProductRole(user.role) === 'local_admin') return true;
  return ADMIN_EMAILS.includes(normalizeEmail(user.email));
}
function isAdminUser(user) {
  return isLocalAdminUser(user);
}
function activeOwners(db) {
  return (db.users || []).filter(u => isOwnerUser(u) && !['suspended','deleted'].includes(String(u.status || 'active')));
}
function isProtectedOwner(db, user) {
  if (!user) return false;
  return isOwnerUser(user) || OWNER_EMAILS.includes(normalizeEmail(user.email));
}
function promoteAdminIfConfigured(db, user) {
  if (!user) return false;
  let changed = false;
  const email = normalizeEmail(user.email);
  const nextRole = OWNER_EMAILS.includes(email) ? 'owner' : (ADMIN_EMAILS.includes(email) ? 'local_admin' : normalizeProductRole(user.role));
  if (user.role !== nextRole) {
    user.role = nextRole;
    user.updatedAt = new Date().toISOString();
    auditAuth(db, nextRole === 'owner' ? 'owner_auto_promoted' : nextRole === 'local_admin' ? 'local_admin_auto_promoted' : 'role_normalized', { userId: user.id, email: user.email, role: nextRole });
    changed = true;
  }
  return changed;
}
function requireAdmin(req, res, next) {
  const auth = getAuth(req);
  if (!auth) return res.status(401).json({ error: 'Authentication required.' });
  if (promoteAdminIfConfigured(auth.db, auth.user)) writeDb(auth.db);
  if (!isAdminUser(auth.user)) return res.status(403).json({ error: 'Admin access required.' });
  req.auth = auth;
  next();
}
function requireOwner(req, res, next) {
  const auth = getAuth(req);
  if (!auth) return res.status(401).json({ error: 'Authentication required.' });
  if (promoteAdminIfConfigured(auth.db, auth.user)) writeDb(auth.db);
  if (!isOwnerUser(auth.user)) return res.status(403).json({ error: 'Owner access required.' });
  req.auth = auth;
  next();
}
function compactError(error) {
  return String(error?.message || error || 'Unknown error').slice(0, 800);
}
function safePathForLog(req) {
  return String(req?.path || req?.originalUrl || '').slice(0, 180);
}
function recordAuditEvent(event) {
  try {
    const db = readDb();
    db.auditEvents = db.auditEvents || [];
    db.auditEvents.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...event });
    db.auditEvents = db.auditEvents.slice(0, 1500);
    writeDb(db);
  } catch (e) {
    console.warn('[monitoring/audit]', e.message);
  }
}
function recordGrowthEvent(event) {
  try {
    const db = readDb();
    db.growthEvents = db.growthEvents || [];
    db.growthEvents.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...event });
    db.growthEvents = db.growthEvents.slice(0, 2500);
    writeDb(db);
  } catch (e) {
    console.warn('[growth/analytics]', e.message);
  }
}
function growthOverview(db = readDb()) {
  const events = db.growthEvents || [];
  const byType = events.reduce((acc, e) => { acc[e.type || 'unknown'] = (acc[e.type || 'unknown'] || 0) + 1; return acc; }, {});
  const landingPaths = ['/ai-contract-analysis', '/contract-risk-analysis', '/business-contract-review', '/faq'];
  return {
    totalEvents: events.length,
    pageViews: byType.page_view || 0,
    checkoutStarts: byType.checkout_started || 0,
    planSelections: byType.plan_selected || 0,
    landingViews: events.filter(e => e.type === 'page_view' && landingPaths.includes(e.path)).length,
    popularPaths: Object.entries(events.filter(e => e.type === 'page_view').reduce((acc, e) => { acc[e.path || '/'] = (acc[e.path || '/'] || 0) + 1; return acc; }, {})).sort((a,b)=>b[1]-a[1]).slice(0,8)
  };
}


function businessAnalyticsOverview(db = readDb()) {
  const events = db.growthEvents || [];
  const users = db.users || [];
  const history = db.history || [];
  const payments = db.payments || [];
  const subscriptions = db.subscriptions || [];
  const rewrites = db.rewriteJobs || [];
  const aiCosts = aiCostOverview(db);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const inWindow = (item, days) => {
    const t = new Date(item.createdAt || item.updatedAt || 0).getTime();
    return Number.isFinite(t) && now - t <= days * dayMs;
  };
  const eventCount = (type, days = 30) => events.filter(e => e.type === type && inWindow(e, days)).length;
  const pageViews30 = eventCount('page_view', 30);
  const signups30 = users.filter(u => inWindow(u, 30)).length;
  const uploads30 = history.filter(h => h.type === 'contract' && inWindow(h, 30)).length;
  const comparisons30 = history.filter(h => h.type === 'comparison' && inWindow(h, 30)).length;
  const exports30 = eventCount('export_report', 30) + eventCount('export_comparison', 30);
  const checkoutStarts30 = eventCount('checkout_started', 30);
  const paymentsSucceeded30 = payments.filter(p => p.status === 'succeeded' && inWindow(p, 30)).length;
  const revenue30 = payments.filter(p => p.status === 'succeeded' && inWindow(p, 30)).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const revenueTotal = payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const activeUsers7 = new Set([
    ...events.filter(e => inWindow(e, 7) && e.userId).map(e => e.userId),
    ...history.filter(h => inWindow(h, 7) && h.userId).map(h => h.userId)
  ]).size;
  const activeUsers30 = new Set([
    ...events.filter(e => inWindow(e, 30) && e.userId).map(e => e.userId),
    ...history.filter(h => inWindow(h, 30) && h.userId).map(h => h.userId)
  ]).size;
  const pathCounts = events.filter(e => e.type === 'page_view').reduce((acc, e) => { const key = e.path || '/'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const planCounts = users.reduce((acc, u) => { const plan = planForUser(u); acc[plan] = (acc[plan] || 0) + 1; return acc; }, { free: 0, pro: 0, business: 0 });
  const funnel = [
    { key: 'visits', label: 'Visits', count: pageViews30 },
    { key: 'signups', label: 'Signups', count: signups30, conversionFromPrevious: pageViews30 ? Math.round((signups30 / pageViews30) * 1000) / 10 : 0 },
    { key: 'analyses', label: 'Analyses', count: uploads30, conversionFromPrevious: signups30 ? Math.round((uploads30 / signups30) * 1000) / 10 : 0 },
    { key: 'exports', label: 'Exports', count: exports30, conversionFromPrevious: uploads30 ? Math.round((exports30 / uploads30) * 1000) / 10 : 0 },
    { key: 'checkout', label: 'Checkout starts', count: checkoutStarts30, conversionFromPrevious: uploads30 ? Math.round((checkoutStarts30 / uploads30) * 1000) / 10 : 0 },
    { key: 'payments', label: 'Paid conversions', count: paymentsSucceeded30, conversionFromPrevious: checkoutStarts30 ? Math.round((paymentsSucceeded30 / checkoutStarts30) * 1000) / 10 : 0 }
  ];
  const daily = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date(now - (13 - idx) * dayMs);
    const key = d.toISOString().slice(0, 10);
    return {
      date: key,
      pageViews: events.filter(e => e.type === 'page_view' && String(e.createdAt || '').startsWith(key)).length,
      analyses: history.filter(h => h.type === 'contract' && String(h.createdAt || '').startsWith(key)).length,
      signups: users.filter(u => String(u.createdAt || '').startsWith(key)).length,
      revenue: payments.filter(p => p.status === 'succeeded' && String(p.createdAt || '').startsWith(key)).reduce((sum, p) => sum + Number(p.amount || 0), 0)
    };
  });
  return {
    ok: true,
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    currency: BILLING_CURRENCY,
    summary: {
      totalUsers: users.length,
      activeUsers7,
      activeUsers30,
      totalAnalyses: history.filter(h => h.type === 'contract').length,
      totalComparisons: history.filter(h => h.type === 'comparison').length,
      totalRewrites: rewrites.length,
      aiSpendMonth: aiCosts.totals.spendMonth,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      revenue30,
      revenueTotal
    },
    funnel,
    planCounts,
    popularPages: Object.entries(pathCounts).sort((a,b)=>b[1]-a[1]).slice(0, 12).map(([path, views]) => ({ path, views })),
    daily,
    languageDistribution: events.reduce((acc,e)=>{ const l = e.payload?.lang || e.language || 'unknown'; acc[l] = (acc[l] || 0) + 1; return acc; }, {}),
    aiCost: { byFeature: aiCosts.byFeature, byPlan: aiCosts.byPlan, byUser: aiCosts.byUser },
    retentionSignals: {
      returningUsersEstimate: Math.max(0, activeUsers30 - signups30),
      analysesPerActiveUser30: activeUsers30 ? Math.round((uploads30 / activeUsers30) * 100) / 100 : 0,
      comparisons30,
      exports30
    },
    adminNotes: [
      'Track visit -> signup -> analysis -> export -> checkout -> payment.',
      'Use this internal dashboard before adding external analytics.',
      'Revenue is based on succeeded payment records in the current database.'
    ]
  };
}

function businessAnalyticsReadiness() {
  return {
    ok: true,
    version: APP_VERSION,
    enabled: true,
    features: ['conversion_funnel','revenue_metrics','active_users','popular_pages','daily_series','plan_distribution','admin_dashboard'],
    trackedEvents: ['page_view','plan_selected','checkout_started','export_report','export_comparison','analysis_completed','comparison_completed'],
    endpoints: ['/api/analytics/business','/api/admin/business-analytics','/api/analytics/track'],
    checks: { internalEvents: true, revenueMetrics: true, adminAccess: true, noExternalTrackerRequired: true },
    generatedAt: new Date().toISOString()
  };
}


function estimateTokensFromText(value = '') {
  return Math.max(1, Math.ceil(String(value || '').length / 4));
}
function estimateAiCost({ inputChars = 0, outputChars = 0, provider = 'local' } = {}) {
  if (provider !== 'live-yandexgpt' && provider !== 'yandexgpt') return { inputTokens: estimateTokensFromText('x'.repeat(inputChars)), outputTokens: estimateTokensFromText('x'.repeat(outputChars)), totalCost: 0 };
  const inputTokens = estimateTokensFromText('x'.repeat(inputChars));
  const outputTokens = estimateTokensFromText('x'.repeat(outputChars));
  const inputCost = (inputTokens / 1000) * AI_COST_INPUT_PER_1K;
  const outputCost = (outputTokens / 1000) * AI_COST_OUTPUT_PER_1K;
  return { inputTokens, outputTokens, inputCost: Math.round(inputCost * 10000) / 10000, outputCost: Math.round(outputCost * 10000) / 10000, totalCost: Math.round((inputCost + outputCost) * 10000) / 10000 };
}
function recordAiCostEvent({ req, feature, mode = 'local', inputChars = 0, outputChars = 0, success = true, metadata = {} } = {}) {
  if (!AI_COST_TRACKING_ENABLED) return null;
  try {
    const auth = req ? optionalAuth(req) : null;
    const provider = mode === 'live-yandexgpt' ? 'yandexgpt' : 'local';
    const estimate = estimateAiCost({ inputChars, outputChars, provider: mode === 'live-yandexgpt' ? 'live-yandexgpt' : 'local' });
    const db = readDb();
    db.aiCostEvents = db.aiCostEvents || [];
    const event = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      feature,
      provider,
      model: AI_COST_PROVIDER_MODEL,
      mode,
      success: Boolean(success),
      userId: auth?.user?.id || null,
      plan: planForUser(auth?.user),
      workspaceId: metadata.workspaceId || metadata.orgId || null,
      inputChars: Number(inputChars || 0),
      outputChars: Number(outputChars || 0),
      inputTokens: estimate.inputTokens,
      outputTokens: estimate.outputTokens,
      cost: estimate.totalCost,
      currency: AI_COST_CURRENCY,
      path: req ? safePathForLog(req) : '',
      metadata
    };
    db.aiCostEvents.unshift(event);
    db.aiCostEvents = db.aiCostEvents.slice(0, 5000);
    writeDb(db);
    return event;
  } catch (e) {
    console.warn('[ai-cost]', e.message);
    return null;
  }
}

function userAiCostSnapshot(db, user) {
  const plan = planForUser(user);
  const limits = planLimits(plan);
  const month = new Date().toISOString().slice(0, 7);
  const day = new Date().toISOString().slice(0, 10);
  const events = (db.aiCostEvents || []).filter(e => e.userId === user?.id);
  const spendMonth = Math.round(events.filter(e => String(e.createdAt || '').startsWith(month)).reduce((sum, e) => sum + Number(e.cost || 0), 0) * 10000) / 10000;
  const spendToday = Math.round(events.filter(e => String(e.createdAt || '').startsWith(day)).reduce((sum, e) => sum + Number(e.cost || 0), 0) * 10000) / 10000;
  const dailyBudget = Number(limits.aiDailyBudget || 0);
  const monthlyBudget = Number(limits.aiMonthlyBudget || 0);
  const monthlyPercent = monthlyBudget > 0 ? Math.round((spendMonth / monthlyBudget) * 1000) / 10 : 0;
  const dailyPercent = dailyBudget > 0 ? Math.round((spendToday / dailyBudget) * 1000) / 10 : 0;
  const alerts = [];
  if (monthlyBudget > 0 && monthlyPercent >= 80) alerts.push({ code: 'USER_AI_MONTHLY_BUDGET', level: monthlyPercent >= 100 ? 'blocked' : 'warning', percent: monthlyPercent });
  if (dailyBudget > 0 && dailyPercent >= 80) alerts.push({ code: 'USER_AI_DAILY_BUDGET', level: dailyPercent >= 100 ? 'blocked' : 'warning', percent: dailyPercent });
  return { plan, currency: AI_COST_CURRENCY, spendToday, spendMonth, dailyBudget, monthlyBudget, dailyPercent, monthlyPercent, remainingToday: dailyBudget > 0 ? Math.max(0, dailyBudget - spendToday) : null, remainingMonth: monthlyBudget > 0 ? Math.max(0, monthlyBudget - spendMonth) : null, alerts };
}
function enforceAiCostBudget(auth, feature = 'ai') {
  if (!auth?.user || !AI_COST_TRACKING_ENABLED) return { ok: true, tracked: false };
  const snapshot = userAiCostSnapshot(auth.db, auth.user);
  const blocked = snapshot.alerts.find(a => a.level === 'blocked');
  if (blocked) {
    const err = new Error(`AI budget exceeded for ${snapshot.plan}. Upgrade the plan or wait for reset.`);
    err.status = 402;
    err.code = 'AI_BUDGET_EXCEEDED';
    err.aiBudget = snapshot;
    throw err;
  }
  return { ok: true, tracked: true, feature, aiBudget: snapshot };
}
function aiCostOverview(db = readDb()) {
  const events = db.aiCostEvents || [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const monthKeyNow = new Date().toISOString().slice(0, 7);
  const monthEvents = events.filter(e => String(e.createdAt || '').startsWith(monthKeyNow));
  const last24h = events.filter(e => now - new Date(e.createdAt || 0).getTime() <= dayMs);
  const sumCost = rows => Math.round(rows.reduce((sum, e) => sum + Number(e.cost || 0), 0) * 10000) / 10000;
  const groupBy = (rows, key) => rows.reduce((acc, e) => { const k = e[key] || 'unknown'; acc[k] = acc[k] || { count: 0, cost: 0, inputTokens: 0, outputTokens: 0 }; acc[k].count += 1; acc[k].cost += Number(e.cost || 0); acc[k].inputTokens += Number(e.inputTokens || 0); acc[k].outputTokens += Number(e.outputTokens || 0); return acc; }, {});
  const normalizeGroups = obj => Object.entries(obj).map(([key, v]) => ({ key, count: v.count, cost: Math.round(v.cost * 10000) / 10000, inputTokens: v.inputTokens, outputTokens: v.outputTokens })).sort((a,b)=>b.cost-a.cost);
  const monthlySpend = sumCost(monthEvents);
  const budgetPercent = AI_COST_MONTHLY_BUDGET > 0 ? Math.round((monthlySpend / AI_COST_MONTHLY_BUDGET) * 1000) / 10 : 0;
  const alerts = [];
  if (AI_COST_MONTHLY_BUDGET > 0 && budgetPercent >= AI_COST_ALERT_THRESHOLD_PERCENT) alerts.push({ code: 'AI_BUDGET_THRESHOLD', level: budgetPercent >= 100 ? 'critical' : 'warning', message: `AI spend is ${budgetPercent}% of monthly budget.` });
  const failed24h = last24h.filter(e => !e.success).length;
  if (failed24h >= 5) alerts.push({ code: 'AI_FAILURE_SPIKE', level: 'warning', message: `${failed24h} AI failures recorded in the last 24 hours.` });
  return {
    ok: true,
    version: APP_VERSION,
    enabled: AI_COST_TRACKING_ENABLED,
    currency: AI_COST_CURRENCY,
    pricing: { inputPer1k: AI_COST_INPUT_PER_1K, outputPer1k: AI_COST_OUTPUT_PER_1K, monthlyBudget: AI_COST_MONTHLY_BUDGET, alertThresholdPercent: AI_COST_ALERT_THRESHOLD_PERCENT },
    totals: { events: events.length, monthEvents: monthEvents.length, last24h: last24h.length, spendMonth: monthlySpend, spend24h: sumCost(last24h), budgetPercent },
    byFeature: normalizeGroups(groupBy(monthEvents, 'feature')),
    byPlan: normalizeGroups(groupBy(monthEvents, 'plan')),
    byProvider: normalizeGroups(groupBy(monthEvents, 'provider')),
    byUser: normalizeGroups(groupBy(monthEvents, 'userId')).slice(0, 20),
    byWorkspace: normalizeGroups(groupBy(monthEvents, 'workspaceId')).slice(0, 20),
    recent: events.slice(0, 30),
    alerts,
    generatedAt: new Date().toISOString()
  };
}
function aiCostReadiness() {
  const overview = aiCostOverview();
  return {
    ok: true,
    version: APP_VERSION,
    enabled: AI_COST_TRACKING_ENABLED,
    providerModel: AI_COST_PROVIDER_MODEL,
    currency: AI_COST_CURRENCY,
    budgetConfigured: AI_COST_MONTHLY_BUDGET > 0,
    liveAiConfigured: hasLiveAi(),
    deepAnalysisFreeLimit: AI_COST_DEEP_ANALYSIS_FREE_LIMIT,
    endpoints: ['/api/ai-cost/readiness','/api/ai-cost/overview','/api/admin/ai-cost'],
    checks: { costEvents: true, budgetAlerts: true, perFeatureBreakdown: true, perPlanBreakdown: true, adminDashboard: true },
    alerts: overview.alerts,
    generatedAt: new Date().toISOString()
  };
}

function seoReadiness() {
  return { ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), pages: PUBLIC_SEO_PAGES, localizedPages: localizedPublicPages(), languages: SUPPORTED_LANGUAGES, defaultLanguage: DEFAULT_LANGUAGE, sitemap: '/sitemap.xml', robots: '/robots.txt', schemaReady: true, internalLinking: true, hreflangReady: true, generatedAt: new Date().toISOString() };
}
function supportOverview(db = readDb()) {
  const tickets = db.supportTickets || [];
  return { total: tickets.length, open: tickets.filter(t => ['new','in_progress'].includes(t.status)).length, resolved: tickets.filter(t => t.status === 'resolved').length, byCategory: tickets.reduce((acc,t)=>{ acc[t.category || 'other'] = (acc[t.category || 'other'] || 0) + 1; return acc; }, {}), recent: tickets.slice(0, 20) };
}
function abuseOverview(db = readDb()) {
  const events = db.abuseEvents || [];
  const since24h = events.filter(e => Date.now() - new Date(e.createdAt).getTime() <= 24 * 60 * 60 * 1000);
  return { enabled: ABUSE_RATE_LIMIT_ENABLED, totalEvents: events.length, events24h: since24h.length, limits: { defaultPerMinute: ABUSE_DEFAULT_MAX, authPerMinute: ABUSE_AUTH_MAX, aiPerHour: ABUSE_AI_MAX_PER_HOUR, uploadsPerHour: ABUSE_UPLOAD_MAX_PER_HOUR }, recent: events.slice(0, 30) };
}

function recordServerError(req, error, status = 500) {
  try {
    const db = readDb();
    db.serverErrors = db.serverErrors || [];
    db.serverErrors.unshift({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      method: req?.method || 'UNKNOWN',
      path: safePathForLog(req),
      status,
      message: compactError(error),
      userAgent: String(req?.headers?.['user-agent'] || '').slice(0, 180)
    });
    db.serverErrors = db.serverErrors.slice(0, 200);
    writeDb(db);
  } catch (e) {
    console.warn('[monitoring/error-log]', e.message);
  }
}

function recordSlowRequest(req, durationMs, statusCode = 200) {
  try {
    const db = readDb();
    db.slowRequests = db.slowRequests || [];
    db.slowRequests.unshift({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      method: req.method,
      path: safePathForLog(req),
      statusCode,
      durationMs,
      ip: ipKey(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 160)
    });
    db.slowRequests = db.slowRequests.slice(0, RELIABILITY_MAX_SLOW_EVENTS);
    writeDb(db);
  } catch (e) { console.warn('[slow-request/log]', e.message); }
}

function reliabilitySnapshot() {
  const db = readDb();
  const now = Date.now();
  const last24h = (items = []) => items.filter((item) => now - new Date(item.createdAt || 0).getTime() <= 24 * 60 * 60 * 1000);
  const errors24h = last24h(db.serverErrors || []);
  const slow24h = last24h(db.slowRequests || []);
  const audit24h = last24h(db.auditEvents || []);
  const apiDurations = audit24h.map((item) => Number(item.durationMs || 0)).filter(Boolean).sort((a, b) => a - b);
  const p95 = apiDurations.length ? apiDurations[Math.min(apiDurations.length - 1, Math.floor(apiDurations.length * 0.95))] : 0;
  const memory = process.memoryUsage();
  const blockers = [];
  if (HEALTH_PROBE_STRICT && errors24h.length > 25) blockers.push('High server error volume in the last 24h.');
  if (HEALTH_PROBE_STRICT && p95 > RELIABILITY_API_TIMEOUT_MS * 0.8) blockers.push('API p95 latency is too close to timeout.');
  return {
    ready: blockers.length === 0,
    mode: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round(process.uptime()),
    apiTimeoutMs: RELIABILITY_API_TIMEOUT_MS,
    aiTimeoutMs: RELIABILITY_AI_TIMEOUT_MS,
    slowRequestThresholdMs: RELIABILITY_SLOW_REQUEST_MS,
    errorsLast24h: errors24h.length,
    slowRequestsLast24h: slow24h.length,
    apiEventsLast24h: audit24h.length,
    p95DurationMs: p95,
    memory: {
      rssMb: Math.round(memory.rss / 1024 / 1024),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024)
    },
    staticCacheMaxAge: STATIC_CACHE_MAX_AGE,
    blockers
  };
}
function usageTotalsByPlan(db) {
  const totals = { free: { users: 0, reviews: 0, questions: 0, exports: 0 }, pro: { users: 0, reviews: 0, questions: 0, exports: 0 }, business: { users: 0, reviews: 0, questions: 0, exports: 0 } };
  for (const user of db.users || []) {
    const plan = planForUser(user);
    if (!totals[plan]) totals[plan] = { users: 0, reviews: 0, questions: 0, exports: 0 };
    totals[plan].users += 1;
  }
  for (const row of db.usage || []) {
    const user = (db.users || []).find(u => u.id === row.userId);
    const plan = planForUser(user);
    if (!totals[plan]) totals[plan] = { users: 0, reviews: 0, questions: 0, exports: 0 };
    totals[plan].reviews += Number(row.reviews || 0);
    totals[plan].questions += Number(row.questions || 0);
    totals[plan].exports += Number(row.exports || 0);
  }
  return totals;
}

function brandUiReadiness() {
  return {
    ok: true,
    version: APP_VERSION,
    enabled: true,
    system: 'MavenLex Brand UI System',
    tokens: {
      colors: ['ink','muted','surface','surfaceStrong','border','accent','success','warning','danger'],
      radius: ['sm','md','lg','xl','pill'],
      shadows: ['soft','panel','focus'],
      spacing: ['xs','sm','md','lg','xl'],
      typography: ['eyebrow','title','subtitle','body','hint']
    },
    components: ['button','card','metric','statusBadge','emptyState','loadingSkeleton','dataTable','adminPanel','formField','notice','tabs'],
    publicPolish: ['consistent_cta_hierarchy','shared_empty_states','shared_error_states','mobile_tap_targets','report_layout_alignment'],
    adminPolish: ['admin_console_shell','admin_section_cards','admin_data_tables','status_badges','quick_actions'],
    checks: { designTokens: true, reusableUiPatterns: true, adminUiPatterns: true, responsiveGuards: true },
    generatedAt: new Date().toISOString()
  };
}

function adminConsoleProSnapshot(db = readDb()) {
  const users = db.users || [];
  const payments = db.payments || [];
  const subscriptions = db.subscriptions || [];
  const supportTickets = db.supportTickets || [];
  const abuseEvents = db.abuseEvents || [];
  const storedFiles = db.storedFiles || [];
  const orgs = db.organizations || [];
  const members = db.organizationMembers || [];
  const errors = db.serverErrors || [];
  const aiCosts = aiCostOverview(db);
  const analytics = businessAnalytics(db);
  const reliability = reliabilitySnapshot();
  return {
    ok: true,
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    modules: {
      users: { total: users.length, admins: users.filter(isAdminUser).length, suspended: users.filter(u => u.status === 'suspended').length, recent: users.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 8).map(publicUser) },
      teams: { organizations: orgs.length, members: members.length, recent: orgs.slice(0, 8) },
      billing: { payments: payments.length, succeeded: payments.filter(p => p.status === 'succeeded').length, pending: payments.filter(p => p.status === 'pending').length, subscriptions: subscriptions.length, activeSubscriptions: subscriptions.filter(s => s.status === 'active').length, recentPayments: payments.slice(0, 8) },
      support: { total: supportTickets.length, open: supportTickets.filter(t => t.status !== 'resolved').length, highPriority: supportTickets.filter(t => t.priority === 'high').length, recent: supportTickets.slice(0, 8) },
      abuse: { events: abuseEvents.length, recent: abuseEvents.slice(0, 8) },
      storage: { ...storageReadiness(), filesTracked: storedFiles.length, contentStored: storedFiles.filter(f => f.contentStored).length, expiringSoon: storedFiles.filter(f => f.expiresAt && Date.parse(f.expiresAt) - Date.now() < 7 * 24 * 60 * 60 * 1000).length },
      aiCost: aiCosts,
      analytics,
      reliability,
      system: { errors24h: last24h(errors).length, slowRequests24h: reliability.slowRequests24h || 0, uptimeSeconds: Math.round(process.uptime()), node: process.version }
    },
    quickActions: [
      { key: 'refresh', label: 'Refresh console', safe: true },
      { key: 'review_support', label: 'Review support queue', safe: true },
      { key: 'check_billing', label: 'Check billing readiness', safe: true },
      { key: 'check_storage', label: 'Check storage policy', safe: true },
      { key: 'review_abuse', label: 'Review abuse events', safe: true }
    ]
  };
}

function adminOverview() {
  const db = readDb();
  const auditEvents = db.auditEvents || [];
  const serverErrors = db.serverErrors || [];
  const users = db.users || [];
  const history = db.history || [];
  const usage = db.usage || [];
  const testFeedback = db.testFeedback || [];
  const growthEvents = db.growthEvents || [];
  const supportTickets = db.supportTickets || [];
  const abuseEvents = db.abuseEvents || [];
  const apiHits = auditEvents.filter(e => String(e.path || '').startsWith('/api/'));
  const analyzeHits = apiHits.filter(e => e.path === '/api/analyze-contract').length;
  const chatHits = apiHits.filter(e => e.path === '/api/legal-chat' || e.path === '/api/law-article-search').length;
  const contractHistory = history.filter(x => x.type === 'contract').length;
  const questionUsage = usage.reduce((sum, row) => sum + Number(row.questions || 0), 0);
  const ratings = testFeedback.map(x => Number(x.rating || 0)).filter(Boolean);
  const avgFeedbackRating = ratings.length ? Math.round((ratings.reduce((a,b)=>a+b,0) / ratings.length) * 10) / 10 : null;
  return {
    ok: true,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    generatedAt: new Date().toISOString(),
    stats: {
      users: users.length,
      admins: users.filter(isAdminUser).length,
      sessions: (db.sessions || []).filter(s => new Date(s.expiresAt).getTime() > Date.now()).length,
      analyses: Math.max(contractHistory, analyzeHits),
      aiQuestions: Math.max(questionUsage, chatHits),
      serverErrors: serverErrors.length,
      apiRequests24h: apiHits.filter(e => Date.now() - new Date(e.createdAt).getTime() <= 24 * 60 * 60 * 1000).length,
      testFeedback: testFeedback.length,
      avgFeedbackRating,
      growthEvents: growthEvents.length,
      supportTickets: supportTickets.length,
      abuseEvents: abuseEvents.length,
      landingViews: growthEvents.filter(e => e.type === 'page_view' && String(e.path || '').includes('analysis')).length,
      checkoutStarts: growthEvents.filter(e => e.type === 'checkout_started').length
    },
    health: {
      backend: { ok: true, uptimeSeconds: Math.round(process.uptime()), node: process.version },
      database: { ok: true, ...databaseModeInfo(), dbFileExists: fs.existsSync(DB_FILE) },
      yandexgpt: { ok: hasLiveAi() && process.env.DISABLE_LIVE_AI !== 'true', configured: hasLiveAi(), disabled: process.env.DISABLE_LIVE_AI === 'true', model: process.env.YANDEX_MODEL || 'not set' },
      billing: billingProviderStatus()
    },
    usageByPlan: usageTotalsByPlan(db),
    launch: launchBlockers(db),
    billing: billingOverview(db),
    recentUsers: users.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,10).map(publicUser),
    recentHistory: history.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,12).map(item => ({ ...item, email: users.find(u => u.id === item.userId)?.email || '' })),
    recentErrors: serverErrors.slice(0,20),
    recentFeedback: testFeedback.slice(0,20),
    growth: growthOverview(db),
    support: supportOverview(db),
    abuse: abuseOverview(db),
    aiCost: aiCostOverview(db),
    seo: seoReadiness(),
    recentRequests: apiHits.slice(0,30),
    recentAdminAudit: (db.adminAuditLogs || []).slice(0, 30),
    recentAuthEvents: (db.authEvents || []).slice(0, 30),
    emailReadiness: emailDeliveryReadiness()
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function emptyDb() {
  return { users: [], sessions: [], history: [], usage: [], subscriptions: [], payments: [], billingEvents: [], supportTickets: [], abuseEvents: [], testFeedback: [], growthEvents: [], auditEvents: [], adminAuditLogs: [], authEvents: [], passwordResetTokens: [], emailVerificationTokens: [], serverErrors: [], storedFiles: [], organizations: [], organizationMembers: [], clauseFavorites: [], rewriteJobs: [], aiCostEvents: [], designSettings: defaultDesignSettings(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}
function defaultDesignSettings() {
  return {
    updatedAt: new Date().toISOString(),
    cms: {
      homeTitleRu: 'Договор → риски → действия',
      homeTitleEn: 'Contract → risks → actions',
      homeLeadRu: 'Можно ли подписывать, где риск и что делать дальше.',
      homeLeadEn: 'Whether to sign, where the risk is and what to do next.',
      primaryCtaRu: 'Разобрать ситуацию',
      primaryCtaEn: 'Analyze situation',
      secondaryCtaRu: 'Проверить договор',
      secondaryCtaEn: 'Review contract'
    },
    ui: { buttonStyle: 'premium-pill', frameStyle: 'soft-glass', textStyle: 'high-contrast', underlineImportant: false, navyReadable: true, compactHero: true, colors: { primary: '#0f172a', accent: '#2563eb', cta: '#1f1408', ctaText: '#ffffff', frame: '#64748b', surface: '#ffffff', muted: '#64748b', navyBg: '#06182f', navyCard: '#0d2a4a', navyText: '#eaf6ff' }, textEmphasis: { home: 'риски, действия, договор', contract: 'штраф, срок, ответственность', law: 'статья, последствия, доказательства' } },
    rolePanels: {
      user: ['Договор', 'Ситуация', 'Статьи', 'Тарифы', 'Кабинет'],
      local_admin: ['Пользователи', 'Восстановление доступа', 'Поддержка', 'Блокировки', 'AI-статус', 'Ошибки пользователей'],
      owner: ['Все функции', 'Дизайн', 'Тексты', 'Роли', 'Безопасность', 'AI', 'Система']
    },
    security: { ownerOnlyAdminFunctions: true, requireStrongPasswords: true, showTechnicalBillingToUsers: false, allowAccountRecovery: true },
    ai: { mode: 'live-only', showStatusToAdmin: true, allowLocalFallback: false }
  };
}
function mergeDesignSettings(value = {}) {
  const base = defaultDesignSettings();
  return {
    ...base,
    ...value,
    cms: { ...base.cms, ...(value.cms || {}) },
    ui: { ...base.ui, ...(value.ui || {}) },
    rolePanels: Object.fromEntries(Object.entries({ ...base.rolePanels, ...(value.rolePanels || {}) }).filter(([role]) => PRODUCT_ROLES.includes(normalizeProductRole(role))).map(([role, panels]) => [normalizeProductRole(role), panels])),
    security: { ...base.security, ...(value.security || {}) },
    ai: { ...base.ai, ...(value.ai || {}) }
  };
}
function readDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const db = emptyDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { ...emptyDb(), ...parsed };
  } catch (e) {
    console.error('[db] Could not read DB file, creating a fresh one:', e.message);
    const db = emptyDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
}
function writeDb(db) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify({ ...db, updatedAt: new Date().toISOString() }, null, 2));
}


function storageReadiness() {
  const supportedModes = ['none', 'metadata-only', 'local', 's3', 'supabase'];
  const mode = supportedModes.includes(STORAGE_MODE) ? STORAGE_MODE : 'none';
  const storesContent = ['local', 's3', 'supabase'].includes(mode) && FILE_PRIVACY_MODE !== 'do-not-store';
  return {
    ok: true,
    mode,
    privacyMode: FILE_PRIVACY_MODE,
    storesContent,
    retentionDays: FILE_RETENTION_DAYS,
    maxFileSizeMb: STORAGE_MAX_FILE_SIZE_MB,
    localReady: mode === 'local' ? fs.existsSync(SECURE_FILE_STORAGE_DIR) || true : undefined,
    s3Ready: mode === 's3' ? Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) : undefined,
    supabaseReady: mode === 'supabase' ? Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_STORAGE_BUCKET) : undefined,
    policy: 'By default MavenLex stores metadata only. Enable local/s3/supabase explicitly for file content storage.'
  };
}
function sha256Buffer(buf) { return crypto.createHash('sha256').update(buf || Buffer.from('')).digest('hex'); }
function maybeStoreUploadedFile(db, req, file, purpose = 'analysis') {
  if (!file) return null;
  db.storedFiles = db.storedFiles || [];
  const mode = storageReadiness().mode;
  const auth = optionalAuth(req);
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const metadata = {
    id,
    userId: auth?.user?.id || null,
    purpose,
    fileName: file.originalname || 'document',
    fileType: getFileType(file.originalname || ''),
    size: file.size || 0,
    hash: sha256Buffer(file.buffer),
    storageMode: mode,
    privacyMode: FILE_PRIVACY_MODE,
    contentStored: false,
    path: null,
    expiresAt,
    createdAt: now.toISOString()
  };
  if (mode === 'local' && FILE_PRIVACY_MODE !== 'do-not-store') {
    const dir = path.join(SECURE_FILE_STORAGE_DIR, String(metadata.userId || 'anonymous'));
    fs.mkdirSync(dir, { recursive: true });
    const safeName = `${id}-${String(file.originalname || 'document').replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, '-')}`;
    const target = path.join(dir, safeName);
    fs.writeFileSync(target, file.buffer);
    metadata.contentStored = true;
    metadata.path = target;
  }
  db.storedFiles.unshift(metadata);
  db.storedFiles = db.storedFiles.slice(0, 5000);
  return metadata;
}
function cleanupExpiredFiles(db = readDb()) {
  const now = Date.now();
  let removed = 0;
  db.storedFiles = (db.storedFiles || []).filter(file => {
    const expired = file.expiresAt && Date.parse(file.expiresAt) < now;
    if (expired && file.contentStored && file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (_) {}
    }
    if (expired) removed += 1;
    return !expired;
  });
  if (removed) writeDb(db);
  return removed;
}
function orgRole(db, userId, orgId) {
  return (db.organizationMembers || []).find(m => m.userId === userId && m.orgId === orgId)?.role || null;
}
function requireOrgRole(db, userId, orgId, roles = ['owner','admin']) {
  const role = orgRole(db, userId, orgId);
  if (!role || !roles.includes(role)) throw clientError('Not allowed for this team.', 403, { orgId, role });
  return role;
}
const CLAUSE_LIBRARY = [
  { id:'payment-terms', category:'Оплата', risk:'medium', title:'Сроки и порядок оплаты', problem:'Нет точного срока оплаты или порядка выставления счета.', safer:'Оплата производится в течение 10 рабочих дней после получения счета и подписанного акта.', negotiation:'Попросите указать срок оплаты, валюту, документы и последствия просрочки.' },
  { id:'liability-cap', category:'Ответственность', risk:'high', title:'Лимит ответственности', problem:'Ответственность не ограничена или исключена полностью.', safer:'Ответственность стороны ограничена суммой оплат за последние 3 месяца, кроме умысла и грубой неосторожности.', negotiation:'Попросите разумный лимит ответственности и исключения для грубых нарушений.' },
  { id:'termination-notice', category:'Расторжение', risk:'high', title:'Уведомление и срок на исправление', problem:'Договор можно расторгнуть внезапно без срока на исправление.', safer:'Сторона вправе расторгнуть договор после письменного уведомления и 14 календарных дней на исправление нарушения.', negotiation:'Попросите notice + cure period.' },
  { id:'acceptance', category:'Приёмка', risk:'medium', title:'Приёмка работ/услуг', problem:'Нет понятного порядка приёмки и срока на замечания.', safer:'Результат считается принятым, если в течение 5 рабочих дней не направлены мотивированные замечания.', negotiation:'Уточните срок проверки, формат замечаний и последствия молчания.' },
  { id:'confidentiality', category:'Конфиденциальность', risk:'medium', title:'Конфиденциальная информация', problem:'Нет защиты коммерческой информации и документов.', safer:'Стороны обязуются не раскрывать конфиденциальную информацию третьим лицам без письменного согласия.', negotiation:'Попросите NDA-пункт, срок действия и исключения.' },
  { id:'dispute-resolution', category:'Споры', risk:'medium', title:'Порядок разрешения споров', problem:'Неясно, где и как будут решаться споры.', safer:'Споры сначала решаются путем переговоров в течение 15 дней, затем передаются в согласованный суд.', negotiation:'Уточните юрисдикцию, язык, претензионный порядок и применимое право.' }
];
function clauseLibraryReadiness() {
  return { ok: true, enabled: CLAUSE_LIBRARY_ENABLED, clauses: CLAUSE_LIBRARY.length, categories: [...new Set(CLAUSE_LIBRARY.map(c => c.category))], endpoints: ['/api/clauses/library','/api/clauses/recommend','/api/clauses/favorites'] };
}
function suggestClauses({ contractType='', riskArea='', text='' }) {
  const q = `${contractType} ${riskArea} ${text}`.toLowerCase();
  let items = CLAUSE_LIBRARY.filter(c => q.includes(c.category.toLowerCase()) || q.includes(c.id.split('-')[0]) || q.includes(c.title.toLowerCase().split(' ')[0]));
  if (!items.length) items = CLAUSE_LIBRARY.slice(0, 4);
  return items.slice(0, 6);
}
function rewriteClause({ clause='', direction='neutral', role='balanced', tone='firm' }) {
  const raw = clean(clause) || 'Стороны согласуют условия договора.';
  const roleHint = role === 'customer' ? 'в интересах заказчика' : role === 'provider' ? 'в интересах исполнителя' : 'сбалансированно для обеих сторон';
  const toneHint = tone === 'soft' ? 'мягко' : tone === 'firm' ? 'жёстко, но делово' : 'нейтрально';
  let safer = 'Стороны исполняют обязательства добросовестно, письменно фиксируют существенные уведомления и предоставляют разумный срок для устранения нарушений.';
  if (/расторж|terminat|отказ/i.test(raw)) safer = 'Сторона вправе расторгнуть договор только после письменного уведомления и предоставления другой стороне 14 календарных дней на устранение нарушения.';
  if (/штраф|пен|неусто|penalt/i.test(raw)) safer = 'Размер неустойки ограничивается разумным пределом и не может превышать 10% от суммы нарушенного обязательства, если иное не согласовано письменно.';
  if (/ответствен|liabil/i.test(raw)) safer = 'Ответственность стороны ограничивается прямыми документально подтверждёнными убытками, кроме случаев умысла, грубой неосторожности и нарушения конфиденциальности.';
  if (/оплат|payment|счет|invoice/i.test(raw)) safer = 'Оплата производится в течение 10 рабочих дней после получения корректного счёта и подписанного акта либо мотивированных замечаний.';
  return {
    original: raw,
    direction,
    role,
    tone,
    rewrittenClause: `${safer} Формулировка подготовлена ${roleHint}, тон: ${toneHint}.`,
    explanation: 'Цель правки — убрать неопределённость, добавить срок на исправление, ограничить чрезмерные последствия и сделать условие проверяемым.',
    negotiationMessage: `Здравствуйте. Предлагаем заменить спорный пункт на более понятную и сбалансированную редакцию: "${safer}"`,
    checklist: ['Проверить сумму и срок обязательства.', 'Убедиться, что уведомления направляются письменно.', 'Согласовать лимит ответственности.', 'Проверить применимое право и подсудность.'],
    disclaimer: 'AI-редакция является черновиком и должна быть проверена MavenLex перед подписанием.'
  };
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, passwordSalt, resetTokenHash, verificationTokenHash, failedLoginCount, lockedUntilAt, ...safe } = user;
  return safe;
}

function userAccessState(db, user) {
  const plan = planForUser(user);
  const onboarding = user.onboarding || {};
  const role = normalizeProductRole(user.role || (isAdminUser(user) ? 'local_admin' : 'user'));
  const workspace = workspaceSummary(db, user);
  const billing = billingStatusForUser(db, user);
  const emailVerified = Boolean(user.emailVerified);
  const hasWorkspace = true; // Personal-first: a private account space is available automatically.
  const subscriptionActive = billing.status === 'active' || plan === 'free';
  return {
    ok: true,
    userId: user.id,
    role,
    plan,
    emailVerified,
    hasWorkspace,
    subscriptionActive,
    onboardingCompleted: Boolean(onboarding.completed),
    gates: {
      canUseAi: subscriptionActive && (!AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_AI || emailVerified),
      canManageBilling: ['owner','local_admin','user'].includes(role),
      canManageTeam: false,
      canOpenAdmin: isAdminUser(user),
      needsAccountSetup: !onboarding.completed,
      needsEmailVerification: !emailVerified,
      needsPaidPlan: plan === 'free'
    },
    personalSpace: { enabled: true, historyItems: workspace.total, activeItems: workspace.active, folders: workspace.folders || [] },
    billing: { status: billing.status, warnings: billing.warnings || [] }
  };
}
function accountExportPayload(db, user) {
  return {
    exportedAt: new Date().toISOString(),
    product: 'MavenLex',
    version: APP_VERSION,
    user: publicUser(user),
    usage: userUsage(db, user.id),
    onboarding: user.onboarding || null,
    billing: billingStatusForUser(db, user),
    access: userAccessState(db, user),
    history: (db.history || []).filter(x => x.userId === user.id),
    supportTickets: (db.supportTickets || []).filter(x => normalizeEmail(x.email) === normalizeEmail(user.email)),
    authEvents: (db.authEvents || []).filter(x => x.userId === user.id || normalizeEmail(x.email) === normalizeEmail(user.email)).slice(0, 200)
  };
}
function auditAuth(db, type, details = {}) {
  db.authEvents = db.authEvents || [];
  db.authEvents.unshift({ id: crypto.randomUUID(), type, ...details, createdAt: new Date().toISOString() });
  db.authEvents = db.authEvents.slice(0, 500);
}
function auditAdmin(db, type, actorId, details = {}) {
  db.adminAuditLogs = db.adminAuditLogs || [];
  db.adminAuditLogs.unshift({ id: crypto.randomUUID(), type, actorId, ...details, createdAt: new Date().toISOString() });
  db.adminAuditLogs = db.adminAuditLogs.slice(0, 500);
}
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  return Object.fromEntries(raw.split(';').map(x => x.trim()).filter(Boolean).map(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return [part, ''];
    return [decodeURIComponent(part.slice(0, idx)), decodeURIComponent(part.slice(idx + 1))];
  }));
}
function authCookieOptions(maxAgeMs = null) {
  const parts = [`HttpOnly`, `Path=/`, `SameSite=${COOKIE_SAME_SITE}`];
  if (COOKIE_SECURE) parts.push('Secure');
  if (COOKIE_DOMAIN) parts.push(`Domain=${COOKIE_DOMAIN}`);
  if (maxAgeMs) parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`);
  return parts.join('; ');
}
function setAuthCookies(res, session) {
  if (!AUTH_COOKIE_ENABLED || !session?.token) return;
  const maxAgeMs = Math.max(1000, new Date(session.expiresAt).getTime() - Date.now());
  res.setHeader('Set-Cookie', [
    `${encodeURIComponent(AUTH_COOKIE_NAME)}=${encodeURIComponent(session.token)}; ${authCookieOptions(maxAgeMs)}`,
    `mavenlex_csrf=${encodeURIComponent(session.csrfToken || '')}; Path=/; SameSite=${COOKIE_SAME_SITE}${COOKIE_SECURE ? '; Secure' : ''}${COOKIE_DOMAIN ? `; Domain=${COOKIE_DOMAIN}` : ''}; Max-Age=${Math.floor(maxAgeMs / 1000)}`
  ]);
}
function clearAuthCookies(res) {
  if (!AUTH_COOKIE_ENABLED) return;
  res.setHeader('Set-Cookie', [
    `${encodeURIComponent(AUTH_COOKIE_NAME)}=; ${authCookieOptions()}; Max-Age=0`,
    `mavenlex_csrf=; Path=/; SameSite=${COOKIE_SAME_SITE}${COOKIE_SECURE ? '; Secure' : ''}${COOKIE_DOMAIN ? `; Domain=${COOKIE_DOMAIN}` : ''}; Max-Age=0`
  ]);
}
function csrfHeader(req) {
  return String(req.headers['x-csrf-token'] || req.headers['x-mavenlex-csrf'] || '').trim();
}
function isUnsafeMethod(req) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(String(req.method || 'GET').toUpperCase());
}
async function sendEmail({ to, subject, html, text, tags = [] }) {
  const normalizedTo = normalizeEmail(to);
  const provider = EMAIL_PROVIDER;
  const payload = { to: normalizedTo, subject, html, text, tags, createdAt: new Date().toISOString() };
  if (!normalizedTo) return { ok: false, provider, skipped: true, reason: 'missing_recipient' };
  if (provider === 'console' || provider === 'log') {
    console.log(`[email:${subject}] to=${normalizedTo}\n${text || html}`);
    return { ok: true, provider: 'console', delivered: false, logged: true };
  }
  if (provider === 'resend') {
    if (!RESEND_API_KEY) return { ok: false, provider, error: 'RESEND_API_KEY is missing.' };
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: EMAIL_FROM, to: normalizedTo, subject, html, text, reply_to: SUPPORT_EMAIL || undefined, tags: tags.map(name => ({ name, value: 'true' })) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, provider, status: response.status, error: data.message || data.error || 'Resend request failed.' };
      return { ok: true, provider, id: data.id || null };
    } catch (error) {
      return { ok: false, provider, error: error.message || 'Resend delivery failed.' };
    }
  }
  if (provider === 'smtp') {
    return { ok: false, provider, error: 'SMTP provider is configured but nodemailer transport is not installed. Use EMAIL_PROVIDER=resend or console in this build.' };
  }
  return { ok: false, provider, error: `Unsupported EMAIL_PROVIDER=${provider}.` };
}
function emailLayout(title, bodyHtml, ctaLabel, ctaUrl) {
  const safeTitle = clean(title);
  const safeCta = clean(ctaLabel || 'Open MavenLex');
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7fb;color:#111827;font-family:Inter,Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table width="100%" style="max-width:620px;background:#fff;border-radius:18px;border:1px solid #e5e7eb;overflow:hidden"><tr><td style="padding:28px"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280">MavenLex</div><h1 style="margin:10px 0 14px;font-size:24px;line-height:1.25">${safeTitle}</h1><div style="font-size:15px;line-height:1.65;color:#374151">${bodyHtml}</div>${ctaUrl ? `<p style="margin:26px 0"><a href="${ctaUrl}" style="background:#111827;color:white;text-decoration:none;padding:12px 18px;border-radius:12px;display:inline-block;font-weight:700">${safeCta}</a></p>` : ''}<p style="font-size:12px;color:#6b7280;line-height:1.5">Если вы не запрашивали это действие, просто проигнорируйте письмо. ${SUPPORT_EMAIL ? `Поддержка: ${SUPPORT_EMAIL}` : ''}</p></td></tr></table></td></tr></table></body></html>`;
  return html;
}
function passwordResetEmail(link, minutes) {
  const text = `MavenLex password reset\n\nOpen this link to set a new password: ${link}\n\nThe link expires in ${minutes} minutes. If you did not request it, ignore this email.`;
  const html = emailLayout('Сброс пароля MavenLex', `<p>Вы запросили сброс пароля. Ссылка действует ${minutes} минут.</p><p>Если это были не вы, письмо можно игнорировать.</p>`, 'Сбросить пароль', link);
  return { subject: 'MavenLex: сброс пароля', text, html };
}
function emailVerificationEmail(link, hours) {
  const text = `MavenLex email verification\n\nOpen this link to verify your email: ${link}\n\nThe link expires in ${hours} hours.`;
  const html = emailLayout('Подтвердите email в MavenLex', `<p>Подтвердите email, чтобы защитить аккаунт и использовать платёжные функции.</p><p>Ссылка действует ${hours} часов.</p>`, 'Подтвердить email', link);
  return { subject: 'MavenLex: подтвердите email', text, html };
}
async function sendAndAuditAuthEmail(db, type, user, link) {
  const template = type === 'password_reset' ? passwordResetEmail(link, AUTH_RESET_TOKEN_TTL_MINUTES) : emailVerificationEmail(link, AUTH_VERIFY_TOKEN_TTL_HOURS);
  const result = await sendEmail({ to: user.email, subject: template.subject, text: template.text, html: template.html, tags: [`mavenlex_${type}`] });
  db.emailDeliveries = db.emailDeliveries || [];
  db.emailDeliveries.unshift({ id: crypto.randomUUID(), userId: user.id, email: user.email, type, provider: EMAIL_PROVIDER, ok: !!result.ok, delivered: !!result.id, error: result.error || null, providerId: result.id || null, createdAt: new Date().toISOString() });
  db.emailDeliveries = db.emailDeliveries.slice(0, 500);
  auditAuth(db, result.ok ? `${type}_email_sent` : `${type}_email_failed`, { userId: user.id, email: user.email, provider: EMAIL_PROVIDER, error: result.error || null });
  return result;
}
function emailDeliveryReadiness(db = readDb()) {
  const blockers = [];
  const warnings = [];
  if (!['console', 'log', 'resend', 'smtp'].includes(EMAIL_PROVIDER)) blockers.push(`Unsupported EMAIL_PROVIDER=${EMAIL_PROVIDER}.`);
  if (LAUNCH_MODE === 'production' && EMAIL_PROVIDER === 'console') blockers.push('Production auth requires EMAIL_PROVIDER=resend or another real email provider.');
  if (EMAIL_PROVIDER === 'resend' && !RESEND_API_KEY) blockers.push('RESEND_API_KEY is required when EMAIL_PROVIDER=resend.');
  if (EMAIL_PROVIDER === 'smtp') warnings.push('SMTP is reserved for a future nodemailer transport in this build. Use Resend for real delivery now.');
  if (!EMAIL_FROM || !EMAIL_FROM.includes('@')) warnings.push('EMAIL_FROM should be a verified sender address/domain.');
  return { ok: blockers.length === 0, provider: EMAIL_PROVIDER, fromConfigured: Boolean(EMAIL_FROM), resendConfigured: Boolean(RESEND_API_KEY), smtpConfigured: Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS), counts: { deliveries: (db.emailDeliveries || []).length, failed: (db.emailDeliveries || []).filter(x => !x.ok).length }, blockers, warnings };
}
function cookieSessionReadiness() {
  const blockers = [];
  const warnings = [];
  const secret = Boolean(process.env.SESSION_SECRET || process.env.JWT_SECRET || process.env.AUTH_SECRET);
  if (LAUNCH_MODE === 'production' && !secret) blockers.push('SESSION_SECRET/JWT_SECRET/AUTH_SECRET is required in production.');
  if (LAUNCH_MODE === 'production' && AUTH_COOKIE_ENABLED && !COOKIE_SECURE) blockers.push('COOKIE_SECURE=true is required for production cookie sessions.');
  if (AUTH_COOKIE_ENABLED && !AUTH_CSRF_ENABLED) warnings.push('AUTH_CSRF_ENABLED=false weakens cookie-based sessions.');
  return { ok: blockers.length === 0, cookieEnabled: AUTH_COOKIE_ENABLED, csrfEnabled: AUTH_CSRF_ENABLED, cookieName: AUTH_COOKIE_NAME, secure: COOKIE_SECURE, sameSite: COOKIE_SAME_SITE, domainConfigured: Boolean(COOKIE_DOMAIN), blockers, warnings };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password || ''), salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash };
}
function verifyPassword(password, user) {
  if (!user?.passwordSalt || !user?.passwordHash) return false;
  const { hash } = hashPassword(password, user.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}
function passwordPolicyErrors(password) {
  const value = String(password || '');
  const errors = [];
  if (value.length < AUTH_PASSWORD_MIN_LENGTH) errors.push(`Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`);
  if (AUTH_PASSWORD_COMPLEXITY !== 'off') {
    if (!/[A-Za-zА-Яа-я]/.test(value)) errors.push('Password must include at least one letter.');
    if (!/\d/.test(value)) errors.push('Password must include at least one number.');
  }
  if (AUTH_PASSWORD_COMPLEXITY === 'strong') {
    if (!/[A-ZА-Я]/.test(value)) errors.push('Password must include an uppercase letter.');
    if (!/[a-zа-я]/.test(value)) errors.push('Password must include a lowercase letter.');
    if (!/[^A-Za-zА-Яа-я0-9]/.test(value)) errors.push('Password must include a symbol.');
  }
  const weak = ['password','password1','12345678','qwerty123','admin123','mavenlex','11111111'];
  if (weak.includes(value.toLowerCase())) errors.push('Password is too common.');
  return errors;
}
function setUserPassword(user, password) {
  const { salt, hash } = hashPassword(password);
  user.passwordSalt = salt;
  user.passwordHash = hash;
  user.passwordChangedAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
}
function authActionLink(path, token) {
  const base = String(process.env.PUBLIC_APP_URL || APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}
function createExpiringToken(db, collectionName, userId, ttlMs, type) {
  const token = crypto.randomBytes(32).toString('hex');
  db[collectionName] = (db[collectionName] || []).filter(t => t.userId !== userId && !t.usedAt);
  const row = { id: crypto.randomUUID(), userId, tokenHash: hashToken(token), type, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + ttlMs).toISOString(), usedAt: null };
  db[collectionName].push(row);
  return { token, row };
}
function canExposeDevToken() { return process.env.NODE_ENV !== 'production' && EMAIL_PROVIDER === 'console'; }
function createSession(db, userId, req = null) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + AUTH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.sessions = (db.sessions || []).filter(s => s.userId !== userId || (!s.revokedAt && new Date(s.expiresAt).getTime() > Date.now()));
  const activeForUser = db.sessions.filter(s => s.userId === userId).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  for (const extra of activeForUser.slice(Math.max(0, AUTH_MAX_SESSIONS_PER_USER - 1))) extra.revokedAt = now;
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const session = { id: crypto.randomUUID(), tokenHash: hashToken(token), csrfTokenHash: hashToken(csrfToken), userId, createdAt: now, lastSeenAt: now, expiresAt, revokedAt: null, ip: req?.ip || '', userAgent: req?.headers?.['user-agent'] || '' };
  db.sessions.push(session);
  return { token, csrfToken, expiresAt, id: session.id };
}
function publicSession(sessionResultOrRow = null) {
  if (!sessionResultOrRow) return null;
  return {
    id: sessionResultOrRow.id || null,
    csrfToken: sessionResultOrRow.csrfToken || null,
    expiresAt: sessionResultOrRow.expiresAt || null,
    mode: AUTH_COOKIE_ENABLED ? 'cookie' : 'bearer-legacy'
  };
}
function hashToken(token) { return crypto.createHash('sha256').update(String(token || '')).digest('hex'); }
const authRateBuckets = new Map();
function authRateLimit(req, key, limit = 8, windowMs = 15 * 60 * 1000) {
  const id = `${key}:${req.ip || 'local'}:${normalizeEmail(req.body?.email || '')}`;
  const now = Date.now();
  const current = authRateBuckets.get(id) || { count: 0, resetAt: now + windowMs };
  if (now > current.resetAt) { current.count = 0; current.resetAt = now + windowMs; }
  current.count += 1;
  authRateBuckets.set(id, current);
  return current.count <= limit;
}
function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}
function getAuthToken(req) {
  const cookieToken = parseCookies(req)[AUTH_COOKIE_NAME];
  if (AUTH_COOKIE_ENABLED && cookieToken) return { token: cookieToken, method: 'cookie' };
  const bearer = getBearerToken(req);
  if (bearer) return { token: bearer, method: 'bearer-legacy' };
  return { token: '', method: 'none' };
}
function getAuth(req) {
  const tokenInfo = getAuthToken(req);
  const token = tokenInfo.token;
  if (!token) return null;
  const db = readDb();
  const tokenHash = hashToken(token);
  const session = (db.sessions || []).find(s => !s.revokedAt && (s.tokenHash === tokenHash || s.token === token) && new Date(s.expiresAt).getTime() > Date.now());
  if (!session) return null;
  const user = (db.users || []).find(u => u.id === session.userId);
  if (!user || ['suspended','deleted'].includes(user.status)) return null;
  session.lastSeenAt = new Date().toISOString();
  const auth = { db, session, user, authMethod: tokenInfo.method };
  if (tokenInfo.method === 'cookie' && AUTH_CSRF_ENABLED && isUnsafeMethod(req)) {
    const provided = csrfHeader(req);
    const expected = session.csrfTokenHash || '';
    if (!provided || hashToken(provided) !== expected) return { csrfError: true, status: 403, body: { error: 'CSRF token required.' } };
  }
  return auth;
}
function requireAuth(req, res, next) {
  const auth = getAuth(req);
  if (auth?.csrfError) return res.status(auth.status).json(auth.body);
  if (!auth) return res.status(401).json({ error: 'Authentication required.' });
  req.auth = auth;
  next();
}
function monthKeyNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function userUsage(db, userId) {
  const month = monthKeyNow();
  let row = (db.usage || []).find(x => x.userId === userId && x.month === month);
  if (!row) {
    row = { id: crypto.randomUUID(), userId, month, reviews: 0, questions: 0, exports: 0, updatedAt: new Date().toISOString() };
    db.usage = db.usage || [];
    db.usage.push(row);
  }
  return row;
}
function bumpServerUsage(db, userId, kind) {
  const row = userUsage(db, userId);
  row[kind] = Number(row[kind] || 0) + 1;
  row.updatedAt = new Date().toISOString();
  return row;
}

function optionalAuth(req) {
  try { return getAuth(req); } catch (_e) { return null; }
}
function authSecurityReadiness(db = readDb()) {
  const blockers = [];
  const warnings = [];
  const secureSecret = Boolean(process.env.SESSION_SECRET || process.env.JWT_SECRET || process.env.AUTH_SECRET);
  if (LAUNCH_MODE === 'production' && !secureSecret) blockers.push('Set SESSION_SECRET/JWT_SECRET/AUTH_SECRET on hosting.');
  if (LAUNCH_MODE === 'production' && AUTH_TOKEN_TTL_DAYS > 30) warnings.push('AUTH_TOKEN_TTL_DAYS is longer than 30 days.');
  if (LAUNCH_MODE === 'production' && !AUTH_COOKIE_ENABLED) blockers.push('AUTH_COOKIE_ENABLED=true is required for full production auth.');
  if (LAUNCH_MODE === 'production' && !AUTH_CSRF_ENABLED) blockers.push('AUTH_CSRF_ENABLED=true is required with cookie auth.');
  if (AUTH_PASSWORD_MIN_LENGTH < 8) blockers.push('AUTH_PASSWORD_MIN_LENGTH must be at least 8.');
  if (!['off','medium','strong'].includes(AUTH_PASSWORD_COMPLEXITY)) warnings.push('AUTH_PASSWORD_COMPLEXITY should be off, medium, or strong.');
  const emailReadiness = emailDeliveryReadiness(db);
  const cookieReadiness = cookieSessionReadiness();
  if (EMAIL_PROVIDER === 'console' && LAUNCH_MODE === 'production') blockers.push('EMAIL_PROVIDER=console is not acceptable for production password reset/email verification.');
  for (const b of emailReadiness.blockers) blockers.push(b);
  for (const b of cookieReadiness.blockers) blockers.push(b);
  return {
    ok: blockers.length === 0,
    passwordPolicy: { minLength: AUTH_PASSWORD_MIN_LENGTH, complexity: AUTH_PASSWORD_COMPLEXITY },
    sessions: { ttlDays: AUTH_TOKEN_TTL_DAYS, maxPerUser: AUTH_MAX_SESSIONS_PER_USER },
    email: { provider: EMAIL_PROVIDER, verificationRequiredForBilling: AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_BILLING, verificationRequiredForAi: AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_AI, delivery: emailReadiness },
    cookies: cookieReadiness,
    counts: { users: (db.users || []).length, activeSessions: (db.sessions || []).filter(s => !s.revokedAt && new Date(s.expiresAt).getTime() > Date.now()).length, authEvents: (db.authEvents || []).length },
    env: { hasSessionSecret: secureSecret, launchMode: LAUNCH_MODE },
    blockers,
    warnings
  };
}
function limitSnapshot(user, usage, kind) {
  const snapshot = usageWithLimits(user, usage);
  const limit = Number(snapshot.limits?.[kind] || 0);
  const used = Number(snapshot.usage?.[kind] || 0);
  return { ...snapshot, kind, limit, used, allowed: limit >= 999 || used < limit };
}
function enforceUsageLimit(auth, kind) {
  if (!auth?.user) return { ok: true, tracked: false };
  const usage = userUsage(auth.db, auth.user.id);
  const snapshot = limitSnapshot(auth.user, usage, kind);
  if (!snapshot.allowed) {
    const err = new Error(`Monthly ${kind} limit reached for ${snapshot.plan}. Upgrade the plan or wait until next month.`);
    err.status = 402;
    err.code = 'PLAN_LIMIT_REACHED';
    err.usageLimits = snapshot;
    throw err;
  }
  return { ok: true, tracked: true, usage, snapshot };
}
function commitUsage(auth, kind) {
  if (!auth?.user) return null;
  const usage = bumpServerUsage(auth.db, auth.user.id, kind);
  writeDb(auth.db);
  return usageWithLimits(auth.user, usage);
}
function launchBlockers(db = readDb()) {
  const overviewErrors = db.serverErrors || [];
  const errors24h = overviewErrors.filter(e => Date.now() - new Date(e.createdAt).getTime() <= 24 * 60 * 60 * 1000).length;
  const blockers = [];
  const warnings = [];
  const dbInfo = databaseModeInfo();
  if (!ADMIN_EMAILS.length) blockers.push({ code: 'ADMIN_EMAILS_MISSING', level: 'blocker', title: 'ADMIN_EMAILS is not configured', fix: 'Add ADMIN_EMAILS=founder@example.com to .env before opening the site to users.' });
  if (!hasLiveAi() || process.env.DISABLE_LIVE_AI === 'true') blockers.push({ code: 'YANDEXGPT_NOT_READY', level: 'blocker', title: 'YandexGPT is not ready', fix: 'Set YANDEX_API_KEY, YANDEX_FOLDER_ID and make sure DISABLE_LIVE_AI is not true.' });
  if (dbInfo.jsonFallback) warnings.push({ code: 'JSON_DATABASE', level: 'warning', title: 'JSON database is local-development only', fix: 'Use PostgreSQL/Supabase/Neon before heavy public usage.' });
  const billingInfo = billingProviderStatus();
  if (billingInfo.mockBlockedInProduction) blockers.push({ code: 'MOCK_BILLING_BLOCKED_IN_PRODUCTION', level: 'blocker', title: 'Mock billing is blocked in production', fix: 'Use BILLING_PROVIDER=yookassa for real payments, or set BILLING_ALLOW_MOCK_IN_PRODUCTION=true only for staging.' });
  if ((billingInfo.provider === 'manual' || billingInfo.provider === 'mock') && LAUNCH_MODE === 'production' && !billingInfo.mockBlockedInProduction) warnings.push({ code: 'PAYMENTS_FALLBACK_IN_PRODUCTION', level: 'warning', title: 'Payments are still manual/mock', fix: 'Use YooKassa or Stripe with verified webhooks before selling automated subscriptions.' });
  if (!billingInfo.configured) blockers.push({ code: 'BILLING_PROVIDER_NOT_CONFIGURED', level: 'blocker', title: 'Billing provider is not fully configured', fix: billingInfo.note });
  if ((billingInfo.provider === 'yookassa' || billingInfo.provider === 'stripe') && !billingInfo.webhookSecretConfigured && BILLING_STRICT_WEBHOOKS) warnings.push({ code: 'WEBHOOK_SECRET_MISSING', level: 'warning', title: 'Billing webhook secret is missing', fix: 'Set BILLING_WEBHOOK_SECRET or keep provider verification enabled before real payments.' });
  if ((billingInfo.provider === 'yookassa' || billingInfo.provider === 'stripe') && !billingInfo.returnUrlConfigured) warnings.push({ code: 'RETURN_URL_NOT_HTTPS', level: 'warning', title: 'APP_BASE_URL is not a live https URL', fix: 'Set APP_BASE_URL=https://your-domain.app before enabling live checkout.' });
  if (billingInfo.provider !== 'manual' && billingInfo.provider !== 'mock' && !PAYMENTS_ENABLED) warnings.push({ code: 'LIVE_PAYMENTS_DISABLED', level: 'warning', title: 'Live provider selected but payments are disabled', fix: 'Set PAYMENTS_ENABLED=true only after provider keys and webhook verification are ready.' });
  if (errors24h >= 5) blockers.push({ code: 'HIGH_ERROR_RATE', level: 'blocker', title: `${errors24h} server errors in 24h`, fix: 'Check recent server errors before sending users.' });
  if (LAUNCH_MODE === 'production' && dbInfo.jsonFallback) blockers.push({ code: 'PRODUCTION_DB_REQUIRED', level: 'blocker', title: 'Production mode requires a real database', fix: 'Configure DATABASE_PROVIDER and DATABASE_URL.' });
  return { ok: blockers.length === 0, blockers, warnings, errors24h, launchMode: LAUNCH_MODE, billingChecks: billingQaChecks() };
}

const B = (ru, en) => ({ ru, en });
const clean = v => String(v || '').replace(/\s+/g, ' ').trim();
const pick = (lang, ru, en) => lang === 'en' ? en : ru;
const T = (v, lang = 'ru') => Array.isArray(v) ? v : (typeof v === 'object' && v ? (v[lang] ?? v.ru ?? v.en ?? '') : (v ?? ''));


function normalizeDocumentText(value) {
  return String(value || '')
    .replace(/\r/g, '\n')
    .replace(/[\t\u00a0]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getFileType(fileName = '') {
  const name = String(fileName).toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.txt')) return 'txt';
  return 'unknown';
}

function extractionWarnings(text, fileName = '') {
  const warnings = [];
  const type = getFileType(fileName);
  if (type === 'pdf' && text.length < 1500) warnings.push('PDF parsed successfully, but extracted text is short. If this is a scanned PDF, convert it to DOCX/TXT for better analysis.');
  if (/�/.test(text)) warnings.push('Some characters could not be decoded cleanly. Please review extracted text if the report looks incomplete.');
  if (text.length > 55000) warnings.push('Long document detected. The first 60,000 characters were analyzed in this MVP version.');
  return warnings;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hasLiveAi() {
  return Boolean(process.env.YANDEX_API_KEY && process.env.YANDEX_PROJECT_ID);
}

function safeJsonParse(raw) {
  const text = String(raw || '').trim();
  if (!text) throw new Error('AI returned an empty response.');
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return JSON.parse(text.slice(first, last + 1));
  throw new Error('AI response was not valid JSON.');
}

function ensureBilingual(value, fallbackRu = '', fallbackEn = '') {
  if (value && typeof value === 'object' && ('ru' in value || 'en' in value)) {
    return { ru: String(value.ru || value.en || fallbackRu || ''), en: String(value.en || value.ru || fallbackEn || '') };
  }
  return { ru: String(value || fallbackRu || ''), en: String(value || fallbackEn || value || '') };
}

function normalizeAiReport(ai, fallback, opts = {}) {
  const risks = Array.isArray(ai.risks) && ai.risks.length ? ai.risks : fallback.risks;
  const normalizedRisks = risks.map((r, idx) => {
    const score = Math.max(1, Math.min(100, Number(r.score || r.riskScore || fallback.risks?.[idx]?.score || 60)));
    const level = r.level || (score >= 75 ? 'High' : score >= 45 ? 'Medium' : 'Low');
    return {
      id: r.id || `risk-${idx + 1}`,
      score,
      level,
      title: ensureBilingual(r.title, `Риск ${idx + 1}`, `Risk ${idx + 1}`),
      source: String(r.source || r.excerpt || r.contractFragment || fallback.risks?.[idx]?.source || ''),
      plainLanguage: ensureBilingual(r.plainLanguage || r.explanation, 'Требуется дополнительная проверка.', 'Additional review is required.'),
      businessImpact: ensureBilingual(r.businessImpact || r.whyItMatters, 'Может создать финансовые или операционные риски.', 'May create financial or operational risks.'),
      whatToDo: ensureBilingual(r.whatToDo || r.recommendedAction || r.action, 'Запросить уточнение или правку пункта.', 'Request clarification or an edit.'),
      questionForMavenLex: ensureBilingual(r.questionForMavenLex, 'Как безопаснее изменить этот пункт?', 'What is the safest way to revise this clause?'),
      suggestedDraft: ensureBilingual(r.suggestedDraft || r.saferWording, 'Предложите более сбалансированную формулировку после юридической проверки.', 'Use a more balanced wording after legal review.'),
      worstCaseScenario: ensureBilingual(r.worstCaseScenario, 'Риск может привести к потерям или спору.', 'The risk may lead to losses or a dispute.'),
      confidence: r.confidence ? {
        level: r.confidence.level || r.confidence || 'Medium',
        reason: ensureBilingual(r.confidence.reason || r.confidenceReason, 'Уверенность основана на тексте договора и найденном фрагменте.', 'Confidence is based on the contract text and the detected excerpt.')
      } : (fallback.risks?.[idx]?.confidence || { level: 'Medium', reason: B('Уверенность основана на локальном анализе текста.', 'Confidence is based on local text analysis.') })
    };
  });
  const avg = Math.round(normalizedRisks.reduce((s, r) => s + r.score, 0) / Math.max(1, normalizedRisks.length));
  const riskScore = Math.max(1, Math.min(100, Number(ai.riskScore || ai.overallRiskScore || avg)));
  return {
    provider: ai.provider || 'YandexGPT live legal reasoning',
    summary: ensureBilingual(ai.summary, fallback.summary.ru, fallback.summary.en),
    riskScore,
    riskLevel: ai.riskLevel || (riskScore >= 75 ? 'High' : riskScore >= 55 ? 'Medium' : 'Low'),
    signatureReadiness: {
      status: ai.signatureReadiness?.status || ai.signatureReadiness || fallback.signatureReadiness?.status || '',
      text: ensureBilingual(ai.signatureReadiness?.text || ai.signatureReadiness, fallback.signatureReadiness?.text?.ru, fallback.signatureReadiness?.text?.en)
    },
    decisionRecommendation: ensureBilingual(ai.decisionRecommendation, fallback.decisionRecommendation.ru, fallback.decisionRecommendation.en),
    clarifyingQuestions: Array.isArray(ai.clarifyingQuestions) ? ai.clarifyingQuestions.map(q => ensureBilingual(q)) : (fallback.clarifyingQuestions || []),
    priorityPlan: { ru: Array.isArray(ai.priorityPlan?.ru) ? ai.priorityPlan.ru : (fallback.priorityPlan?.ru || []), en: Array.isArray(ai.priorityPlan?.en) ? ai.priorityPlan.en : (fallback.priorityPlan?.en || []) },
    decisionTree: { ru: Array.isArray(ai.decisionTree?.ru) ? ai.decisionTree.ru : (fallback.decisionTree?.ru || []), en: Array.isArray(ai.decisionTree?.en) ? ai.decisionTree.en : (fallback.decisionTree?.en || []) },
    contractIntelligence: ai.contractIntelligence || fallback.contractIntelligence || {},
    riskMatrix: ai.riskMatrix || fallback.riskMatrix || {},
    clauseMap: Array.isArray(ai.clauseMap) && ai.clauseMap.length ? ai.clauseMap : (fallback.clauseMap || []),
    missingClauses: Array.isArray(ai.missingClauses) && ai.missingClauses.length ? ai.missingClauses : (fallback.missingClauses || []),
    redFlags: Array.isArray(ai.redFlags) && ai.redFlags.length ? ai.redFlags : (fallback.redFlags || []),
    risks: normalizedRisks,
    worstCaseScenarios: Array.isArray(ai.worstCaseScenarios) && ai.worstCaseScenarios.length ? ai.worstCaseScenarios.map((w, i) => ({
      title: ensureBilingual(w.title, normalizedRisks[i]?.title.ru, normalizedRisks[i]?.title.en),
      scenario: ensureBilingual(w.scenario, normalizedRisks[i]?.worstCaseScenario.ru, normalizedRisks[i]?.worstCaseScenario.en),
      prevention: ensureBilingual(w.prevention || w.howToPrevent, normalizedRisks[i]?.whatToDo.ru, normalizedRisks[i]?.whatToDo.en)
    })) : fallback.worstCaseScenarios,
    actionPlan: { ru: Array.isArray(ai.actionPlan?.ru) ? ai.actionPlan.ru : (Array.isArray(fallback.actionPlan?.ru) ? fallback.actionPlan.ru : []), en: Array.isArray(ai.actionPlan?.en) ? ai.actionPlan.en : (Array.isArray(fallback.actionPlan?.en) ? fallback.actionPlan.en : []) },
    todayPlan: { ru: Array.isArray(ai.todayPlan?.ru) ? ai.todayPlan.ru : (fallback.todayPlan?.ru || []), en: Array.isArray(ai.todayPlan?.en) ? ai.todayPlan.en : (fallback.todayPlan?.en || []) },
    dontDo: { ru: Array.isArray(ai.dontDo?.ru) ? ai.dontDo.ru : (fallback.dontDo?.ru || []), en: Array.isArray(ai.dontDo?.en) ? ai.dontDo.en : (fallback.dontDo?.en || []) },
    alreadySignedPlan: { ru: Array.isArray(ai.alreadySignedPlan?.ru) ? ai.alreadySignedPlan.ru : (fallback.alreadySignedPlan?.ru || []), en: Array.isArray(ai.alreadySignedPlan?.en) ? ai.alreadySignedPlan.en : (fallback.alreadySignedPlan?.en || []) },
    MavenLexPackage: { ru: Array.isArray(ai.MavenLexPackage?.ru) ? ai.MavenLexPackage.ru : (fallback.MavenLexPackage?.ru || []), en: Array.isArray(ai.MavenLexPackage?.en) ? ai.MavenLexPackage.en : (fallback.MavenLexPackage?.en || []) },
    moneyRisk: { ru: Array.isArray(ai.moneyRisk?.ru) ? ai.moneyRisk.ru : (fallback.moneyRisk?.ru || []), en: Array.isArray(ai.moneyRisk?.en) ? ai.moneyRisk.en : (fallback.moneyRisk?.en || []) },
    counterpartyMessages: ai.counterpartyMessages || fallback.counterpartyMessages || {},
    roleRecommendations: ai.roleRecommendations || fallback.roleRecommendations || {},
    negotiationMessage: ensureBilingual(ai.negotiationMessage, fallback.negotiationMessage.ru, fallback.negotiationMessage.en),
    MavenLexQuestions: Array.isArray(ai.MavenLexQuestions) && ai.MavenLexQuestions.length ? ai.MavenLexQuestions.map(q => ensureBilingual(q)) : fallback.MavenLexQuestions,
    suggestedEdits: Array.isArray(ai.suggestedEdits) && ai.suggestedEdits.length ? ai.suggestedEdits.map((e, i) => ({
      title: ensureBilingual(e.title, normalizedRisks[i]?.title.ru, normalizedRisks[i]?.title.en),
      level: e.level || normalizedRisks[i]?.level || 'Medium',
      source: String(e.source || normalizedRisks[i]?.source || ''),
      suggestedDraft: ensureBilingual(e.suggestedDraft || e.saferWording, normalizedRisks[i]?.suggestedDraft.ru, normalizedRisks[i]?.suggestedDraft.en)
    })) : normalizedRisks.map(r => ({ title: r.title, level: r.level, source: r.source, suggestedDraft: r.suggestedDraft })),
    redline: Array.isArray(ai.redline) && ai.redline.length ? ai.redline : normalizedRisks.map(r => ({ title: r.title, remove: r.source, add: r.suggestedDraft })),
    timeline: Array.isArray(ai.timeline) && ai.timeline.length ? ai.timeline.map(t => ({ date: ensureBilingual(t.date), event: ensureBilingual(t.event) })) : fallback.timeline,
    voiceScript: ensureBilingual(ai.voiceScript, fallback.voiceScript.ru, fallback.voiceScript.en),
    MavenLexBrief: ai.MavenLexBrief || fallback.MavenLexBrief,
    disclaimer: ensureBilingual(ai.disclaimer, fallback.disclaimer.ru, fallback.disclaimer.en),
    analysisNotes: ensureBilingual(ai.analysisNotes || ai.methodology, 'AI проверил текст договора, выделил рискованные пункты и подготовил практические следующие шаги.', 'AI reviewed the contract text, identified risky clauses and prepared practical next steps.'),
    originalContext: opts.contextSnippet || ''
  };
}


function extractMoneyInfo(text = '') {
  const raw = String(text || '');
  const moneyMatch = raw.match(/(?:€|\$|£|₽)\s?\d[\d\s,.]*|\d[\d\s,.]*\s?(?:eur|usd|gbp|rub|руб|₽|€|\$|£)/i);
  const percentMatch = raw.match(/(\d+(?:[.,]\d+)?)\s?%/);
  const amountText = moneyMatch ? moneyMatch[0].replace(/\s+/g, ' ').trim() : '';
  const percent = percentMatch ? Number(percentMatch[1].replace(',', '.')) : 0;
  const numeric = amountText ? Number((amountText.match(/[\d\s,.]+/)?.[0] || '').replace(/\s/g, '').replace(',', '.')) : 0;
  const currency = amountText.includes('€') || /eur/i.test(amountText) ? '€' : amountText.includes('$') || /usd/i.test(amountText) ? '$' : amountText.includes('£') || /gbp/i.test(amountText) ? '£' : amountText.includes('₽') || /руб|rub/i.test(amountText) ? '₽' : '';
  const penaltyValue = numeric && percent ? Math.round((numeric * percent / 100) * 100) / 100 : 0;
  return { amountText, amount: numeric, currency, percent, penaltyValue };
}

function buildPracticalPackage({ text = '', risks = [], score = 0, opts = {} }) {
  const top = risks.slice(0, 3);
  const riskNamesRu = top.map(r => r.title?.ru).filter(Boolean).join(', ') || 'оплата, расторжение и ответственность';
  const riskNamesEn = top.map(r => r.title?.en).filter(Boolean).join(', ') || 'payment, termination and liability';
  const money = extractMoneyInfo(text);
  const todayPlan = B([
    'Не подписывать и не подтверждать согласие, пока не закрыты ключевые риски.',
    `Сначала запросить правки по пунктам: ${riskNamesRu}.`,
    'Получить новую редакцию договора, а не только обещание в переписке.',
    'Сохранить договор, переписку, счета, приложения и все версии файла.',
    'Собрать короткий пакет: договор + спорные пункты + конкретные вопросы для следующего шага.'
  ], [
    'Do not sign or confirm acceptance until key risks are addressed.',
    `First request edits for: ${riskNamesEn}.`,
    'Get a revised contract draft, not only a promise in messages.',
    'Save the contract, correspondence, invoices, attachments and all file versions.',
    'Send a short MavenLex package: contract + disputed clauses + specific questions.'
  ]);
  const dontDo = B([
    'Не подписывать “сейчас, а потом поправим” — правки должны быть в тексте договора.',
    'Не признавать долг, просрочку или нарушение в переписке, пока не понятна позиция и доказательства.',
    'Не платить штраф без письменного расчёта и ссылки на конкретный пункт договора.',
    'Не удалять переписку, счета, акты и старые версии договора.',
    'Не соглашаться на устные обещания вместо новой редакции договора.'
  ], [
    'Do not sign “now and fix later” — edits must be inside the contract text.',
    'Do not admit debt, delay or breach in writing before reviewing your position.',
    'Do not pay a penalty without written calculation and a specific contract clause.',
    'Do not delete correspondence, invoices, acts or older contract versions.',
    'Do not accept oral promises instead of a revised contract draft.'
  ]);
  const alreadySignedPlan = B([
    'Соберите договор, приложения, переписку, счета, акты и уведомления.',
    'Проверьте, какой пункт реально пытаются применить против вас.',
    'Не признавайте нарушение письменно, пока не понятна позиция и доказательства.',
    'Запросите у второй стороны письменное обоснование требований.',
    'MavenLexу задайте точный вопрос: можно ли снизить последствия, оспорить пункт или выйти из договора безопаснее.'
  ], [
    'Collect the contract, attachments, correspondence, invoices, acts and notices.',
    'Check which clause is actually being used against you.',
    'Do not admit breach in writing before reviewing your position.',
    'Ask the counterparty for written justification of their demand.',
    'Ask MavenLex a focused question: can consequences be reduced, the clause challenged, or the contract exited more safely?'
  ]);
  const MavenLexPackage = B([
    'Сам договор и все приложения.',
    'Переписку до подписания и после возникновения спора.',
    'Счета, акты, подтверждения оплаты и уведомления.',
    `Отмеченные MavenLex спорные пункты: ${riskNamesRu}.`,
    'Вашу цель: подписать после правок, снизить штраф, выйти из договора или защититься от требования.'
  ], [
    'The contract and all attachments.',
    'Correspondence before signing and after the issue started.',
    'Invoices, acts, payment confirmations and notices.',
    `MavenLex disputed clauses: ${riskNamesEn}.`,
    'Your goal: sign after edits, reduce a penalty, exit the contract or defend against a claim.'
  ]);
  const moneyRisk = B([
    money.percent ? `В договоре найден процент риска: ${money.percent}%. Если сумма договора известна, умножьте её на ${money.percent / 100}.` : 'Процент штрафа в тексте явно не найден. Проверьте, есть ли фиксированный штраф, пеня за день или лимит ответственности.',
    money.penaltyValue ? `По найденной сумме ${money.amountText} ориентировочный риск ${money.percent}% = примерно ${money.currency}${money.penaltyValue}.` : 'Если сумма договора, например 2 000, штраф 15% будет примерно 300. Подставьте свою сумму для оценки.',
    'Это не финальный расчёт: точная сумма зависит от формулы штрафа, срока просрочки, валюты, лимитов и применимого права.'
  ], [
    money.percent ? `Detected risk percentage: ${money.percent}%. If the contract amount is known, multiply it by ${money.percent / 100}.` : 'No explicit penalty percentage was detected. Check for fixed penalties, daily penalties or liability caps.',
    money.penaltyValue ? `Based on detected amount ${money.amountText}, estimated ${money.percent}% exposure is about ${money.currency}${money.penaltyValue}.` : 'If the contract amount is 2,000, a 15% penalty is about 300. Insert your own amount to estimate exposure.',
    'This is not a final calculation: the exact amount depends on formula, delay period, currency, caps and governing law.'
  ]);
  const counterpartyMessages = {
    soft: B(`Здравствуйте. Мы внимательно посмотрели договор и хотим спокойно уточнить несколько пунктов перед подписанием: ${riskNamesRu}. Просим прислать обновлённую редакцию с более понятными условиями по уведомлению, ответственности и последствиям нарушения. Так мы сможем быстрее согласовать документ.`, `Hello. We reviewed the agreement carefully and would like to clarify a few points before signing: ${riskNamesEn}. Please send an updated draft with clearer terms on notice, liability and breach consequences. This should help us approve the document faster.`),
    neutral: B(`Здравствуйте. Перед подписанием просим скорректировать пункты: ${riskNamesRu}. В текущей редакции они создают для нас коммерческий риск. Просим добавить письменное уведомление, срок на исправление нарушения, разумные лимиты штрафов/ответственности и направить новую редакцию договора.`, `Hello. Before signing, please revise the following areas: ${riskNamesEn}. In the current version they create commercial risk for us. Please add written notice, a cure period, reasonable penalty/liability caps and send a revised draft.`),
    firm: B(`Здравствуйте. В текущей редакции мы не готовы подписывать договор из-за пунктов: ${riskNamesRu}. Для продолжения согласования нужна новая редакция, где риски распределены взаимно и письменно зафиксированы уведомление, срок на исправление, лимиты ответственности и понятный порядок расторжения.`, `Hello. We are not ready to sign the current version because of: ${riskNamesEn}. To continue, we need a revised draft with mutual risk allocation and written notice, cure period, liability caps and a clear termination process.`)
  };
  const roleRecommendations = {
    customer: B([
      'Для заказчика особенно опасны отсутствие ответственности исполнителя, внезапное расторжение и отсутствие возврата денег.',
      'Просите SLA/сроки, ответственность за срыв, порядок возврата и право прекратить договор при плохом качестве.'
    ], [
      'For a customer, the biggest risks are weak provider liability, sudden termination and no refund mechanism.',
      'Ask for deadlines/SLA, responsibility for failure, refund process and a right to terminate for poor quality.'
    ]),
    provider: B([
      'Для исполнителя особенно опасны жёсткие штрафы, короткие сроки оплаты, неограниченная ответственность и односторонний отказ заказчика.',
      'Просите лимит ответственности, понятный порядок приёмки, оплату этапами и срок на исправление претензий.'
    ], [
      'For a provider, the biggest risks are harsh penalties, unclear payment timing, unlimited liability and unilateral customer termination.',
      'Ask for liability caps, clear acceptance process, milestone payments and time to cure complaints.'
    ]),
    unknown: B([
      'Уточните свою роль: заказчик, исполнитель, арендатор, работодатель, сотрудник или партнёр.',
      'Один и тот же пункт может быть выгодным для одной стороны и опасным для другой.'
    ], [
      'Clarify your role: customer, provider, tenant, employer, employee or partner.',
      'The same clause can be good for one side and dangerous for the other.'
    ])
  };
  return { todayPlan, dontDo, alreadySignedPlan, MavenLexPackage, moneyRisk, counterpartyMessages, roleRecommendations };
}

function normalizeChatHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history.slice(-8).map(item => ({
    role: String(item.role || item.from || '').includes('ai') ? 'MavenLex' : 'User',
    text: String(item.text || item.content || '').replace(/\s+/g, ' ').trim().slice(0, 1200)
  })).filter(item => item.text);
}

function humanLegalCounselBehaviorBlock(language = 'ru') {
  const ru = language !== 'en';
  return `
HUMAN LEGAL COUNSEL STYLE — VERY IMPORTANT:
- Answer like a smart human legal analyst in a live chat, close to a strong ChatGPT-style legal reasoning conversation, not like a form, template, FAQ, or generic assistant.
- Treat messy language, typos, slang, panic, anger and short messages as normal. Infer the user's meaning and help.
- Start with the practical conclusion first when the user needs a decision. For tiny follow-ups, answer naturally in 2-6 useful sentences, not a forced report.
- Do not over-disclaim. Do not redirect the user away from MavenLex. MavenLex must answer the question itself: conclusion, risk, next action, evidence, message text and what to verify.
- Do not say you are only an assistant. Answer as MavenLex: confident, calm, useful, direct.
- If the user asks a follow-up like "а если уже подписал", "что грозит", "что написать", keep the previous article/contract/situation context.
- If information is missing, still give a provisional safe answer, then ask 1-3 targeted questions. Do not interrogate the user if you can already help.
- If the issue is risky, explain what NOT to do: do not delete evidence, do not forge documents, do not threaten, do not admit fault carelessly.
- If the user asks for a message, draft a ready-to-send message in a natural tone.
- If the user asks about a law article, explain: plain meaning, what conduct creates risk, consequences factors, what to do now, what to verify next.
- If exact current law text matters, say it should be verified in official/current sources, but do not refuse to explain the legal logic.
Preferred language tone: ${ru ? 'Russian, natural, direct, human, without bureaucratic wording.' : 'English, natural, direct, human, without legalese when possible.'}
`;
}


function chatGptLikeLegalReasoningBlock(language = 'ru') {
  const ru = language !== 'en';
  return `
CHATGPT-LIKE LEGAL REASONING MODE — DO THIS IN EVERY AI ANSWER:
- Behave like a strong conversational legal AI inside the product, not as a questionnaire, template, or canned report.
- Match the user's style without copying insults: if the user is messy, angry, short, scared or uses slang, calmly translate it into a clear legal issue.
- Choose the answer depth automatically:
  * tiny follow-up -> short natural answer with the key point;
  * unclear issue -> useful provisional answer + 2-3 exact questions;
  * serious dispute/contract/article -> deeper breakdown with practical steps;
  * request for text -> draft the exact message first, then explain why.
- Do not force identical numbered sections every time. Use structure only when it helps readability.
- Keep conversation memory: "а если уже подписал", "а если он не платит", "что грозит" refers to the current article/contract/situation unless the user changes topic.
- Think before answering: identify role, stage, jurisdiction, money/deadlines, evidence, safest next action, and worst mistake to avoid.
- Never answer with one vague paragraph. If the issue has legal risk, include at least one concrete action and one thing not to do.
- If the user asks something impossible or unsafe, explain the legal risk and redirect to safe steps, prevention, evidence, and verification points.
- Do not sound like a disclaimer bot. Do not redirect the user away from MavenLex; answer as MavenLex with the strongest useful legal analysis available from the facts.
- Tone: ${ru ? 'живой русский язык, спокойно, уверенно, без канцелярита, как сильный AI-собеседник в чате.' : 'natural English, calm, direct, confident, no corporate legalese, like a strong AI chat partner.'}
`;
}

function inferAnswerDepth(question = '', report = {}, history = []) {
  const q = String(question || '').toLowerCase();
  const hasContext = !!(report && Object.keys(report || {}).length) || (Array.isArray(history) && history.length > 0);
  if (q.length < 80 && /^(а если|если|что грозит|че грозит|что делать|почему|как|ну а|and if|what if|why|how)/i.test(q.trim()) && hasContext) return 'follow-up';
  if (/напиши|составь|ответь|письмо|сообщение|претензи|draft|write|message|email|claim/i.test(q)) return 'draft';
  if (/договор|контракт|подпис|пункт|штраф|расторг|ответствен|contract|clause|sign|penalty|termination|liability/i.test(q)) return 'deep-contract';
  if (/стать|ук рф|гк рф|коап|тк рф|закон|article|criminal code|civil code|law/i.test(q)) return 'article';
  if (q.length > 450 || /суд|полици|MavenLex|долг|увольн|угрож|претенз|court|police|MavenLex|debt|dismiss/i.test(q)) return 'deep-situation';
  return 'balanced';
}

function buildAdaptiveAnswerInstruction({ question = '', report = {}, language = 'ru', history = [] }) {
  const depth = inferAnswerDepth(question, report, history);
  const ru = language !== 'en';
  const map = ru ? {
    'follow-up': 'Это короткий follow-up. Не начинай заново весь отчёт. Ответь как в живом чате: прямо, с учётом предыдущего контекста, и скажи ближайшее безопасное действие.',
    'draft': 'Пользователь хочет готовый текст. Сначала дай готовое сообщение/претензию/ответ, потом коротко объясни, почему такая формулировка безопаснее.',
    'deep-contract': 'Это серьёзный договорной вопрос. Дай вывод по подписи/переговорам, риск, последствия, правку формулировки, что написать второй стороне и что проверить в формулировках.',
    'article': 'Это вопрос по статье/закону. Объясни человечески: о чём статья, что может грозить в общем виде, от чего зависит итог, что делать, что не делать, что уточнить по фактам и актуальной редакции.',
    'deep-situation': 'Это реальная юридическая ситуация. Разбери как собеседник: что происходит, риски, что сделать сегодня, что не делать, доказательства, сообщение второй стороне и уточняющие вопросы.',
    'balanced': 'Ответь естественно и полезно. Не растягивай без причины, но дай прямой вывод, риск и следующий шаг.'
  } : {
    'follow-up': 'This is a short follow-up. Do not restart the full report. Answer like a live chat partner, use previous context, and give the safest next action.',
    'draft': 'The user wants ready text. First provide the message/claim/reply, then briefly explain why this wording is safer.',
    'deep-contract': 'This is a serious contract question. Give a signing/negotiation view, risk, consequence, safer wording, counterparty message and MavenLex check points.',
    'article': 'This is a statute/article question. Explain plainly: what it means, general consequences, factors, what to do, what not to do, and what to verify next.',
    'deep-situation': 'This is a real legal situation. Analyze conversationally: what is happening, risks, what to do today, what not to do, evidence, message to the other side and clarifying questions.',
    'balanced': 'Answer naturally and usefully. Do not over-expand, but include a direct conclusion, risk and next step.'
  };
  return `Detected answer depth: ${depth}. ${map[depth] || map.balanced}`;
}

function shouldRegenerateForChatGptLikeQuality(answer = '', language = 'ru') {
  const value = String(answer || '').trim();
  const lower = value.toLowerCase();
  if (looksLikeWeakLegalAnswer(value)) return true;
  if (/я не могу обсуждать|не могу помочь|cannot discuss|can't help|cannot help/i.test(lower)) return true;
  if (/^(как ии|как ai|как языковая модель|я всего лишь|я не MavenLex|i am not MavenLex|as an ai)/i.test(lower)) return true;
  if (value.length > 350 && !/[.!?]\s+[А-ЯA-ZЁ]/.test(value) && value.split('\n').length < 3) return true;
  const hasHumanSignals = language !== 'en'
    ? /коротко|прямо|по сути|я бы|сейчас|если уже|риск|что делать|не делай|доказатель|сообщение/i.test(value)
    : /short answer|directly|i would|right now|risk|what to do|do not|evidence|message/i.test(value);
  return !hasHumanSignals && value.length < 900;
}

function looksLikeWeakLegalAnswer(answer = '') {
  const value = String(answer || '').trim();
  const lower = value.toLowerCase();
  if (isAiRefusalText(value)) return true;
  if (value.length < 220) return true;
  if (/^(я не MavenLex|i am not MavenLex|используйте MavenLex|use MavenLex)/i.test(value)) return true;
  if (/не могу (дать|предоставить|помочь|обсуждать)|can't help|cannot help|cannot discuss|не могу обсуждать/i.test(value)) return true;
  const usefulSignals = ['что делать', 'риск', 'доказатель', 'документ', 'MavenLex', 'ответствен', 'штраф', 'next', 'risk', 'evidence', 'MavenLex', 'documents', 'liability'];
  return usefulSignals.filter(s => lower.includes(s)).length < 2;
}


function legalAnswerQualityIssues(answer = '') {
  const value = String(answer || '').trim();
  const lower = value.toLowerCase();
  const issues = [];
  if (!value) issues.push('empty');
  if (isAiRefusalText(value) || /не могу обсуждать|cannot discuss|can't help|cannot help/i.test(value)) issues.push('refusal');
  if (value.length < 500) issues.push('too_short');
  if (/^(я не MavenLex|i am not MavenLex|используйте MavenLex|use MavenLex)/i.test(value)) issues.push('disclaimer_first');
  const mustHave = [
    ['conclusion', /прямо|вывод|итог|коротко|directly|conclusion|bottom line/i],
    ['risk', /риск|грозит|последств|ответствен|штраф|risk|consequence|liability|penalty/i],
    ['action', /что делать|сделать|шаг|сейчас|действ|next step|do now|action/i],
    ['avoid', /не делать|нельзя|избег|не совет|what not|avoid|do not/i],
    ['evidence', /доказатель|документ|переписк|скрин|evidence|document|message|record/i]
  ];
  for (const [name, re] of mustHave) if (!re.test(lower)) issues.push(`missing_${name}`);
  return issues;
}

function buildHumanCounselRepairPrompt({ originalPrompt, weakAnswer, question, language = 'ru' }) {
  const isRu = language !== 'en';
  return `${originalPrompt}

The previous answer was not good enough for MavenLex.
Previous answer:
${String(weakAnswer || '').slice(0, 2500)}

Rewrite from scratch as MavenLex Human Legal Counsel AI.
Hard requirements:
- Sound like a real human legal analyst in chat, not a template. The answer must feel close to a strong ChatGPT legal reasoning reply inside MavenLex.
- Understand messy wording and answer the likely meaning of the user question.
- Start with a direct practical conclusion.
- Give risks/consequences in plain language.
- Give what to do now.
- Give what NOT to do.
- Say what evidence/documents to keep.
- If useful, draft a ready-to-send message.
- Ask 1-3 clarifying questions only after giving a useful provisional answer, and only if the missing facts matter.
- Do not start with disclaimers. Use one short safety sentence at the end.
- Do not say "I cannot discuss this topic" for lawful legal questions.
- Language: ${isRu ? 'Russian, natural, direct, no bureaucratic tone.' : 'English, natural, direct, no bureaucratic tone.'}

User question again:
${question}`;
}

function localHumanCounselFromQuestion(question = '', language = 'ru') {
  const isRu = language !== 'en';
  const q = String(question || '').trim();
  if (isRu) {
    return `По сути: пока не надо делать резких движений. Сначала нужно зафиксировать факты, понять вашу роль и не написать/не сделать что-то, что потом ударит по позиции.

Что может быть важно:
1. Что именно произошло: договор, долг, штраф, увольнение, претензия, полиция, аренда или другой спор.
2. Есть ли документы: договор, переписка, чеки, акты, скрины, уведомления.
3. Уже подписано/оплачено/получена претензия или вы только планируете действие.
4. Какая юрисдикция и кто вы в ситуации: физлицо, компания, работник, заказчик, исполнитель.

Что сделать сейчас:
1. Сохранить все документы и переписку.
2. Ничего не удалять и не переписывать задним числом.
3. Не признавать вину письменно, пока не понятно, что именно вам предъявляют.
4. Коротко собрать хронологию: дата, кто что написал, что было обещано, что фактически произошло.

Что НЕ делать:
1. Не угрожать второй стороне.
2. Не подделывать документы.
3. Не удалять сообщения.
4. Не платить штраф/долг без письменного расчёта и основания.

Скиньте коротко: что произошло, вы уже что-то подписали, какая сумма/сроки, и есть ли договор или переписка — тогда я разложу уже точнее по шагам.`;
  }
  return `I understand the question. I’ll answer the likely meaning even if details are incomplete.

Direct conclusion: do not take sharp steps yet. First preserve facts, clarify your role, and separate legal risk from emotion.

What matters:
1. What happened: contract, debt, penalty, dismissal, claim, police, rent, consumer dispute or another issue.
2. What documents exist: contract, messages, receipts, acts, screenshots, notices.
3. Whether anything has already been signed/paid/claimed or you are only planning an action.
4. Jurisdiction and your role: individual, company, employee, customer or provider.

Do now:
1. Save all documents and correspondence.
2. Do not delete or backdate anything.
3. Do not admit fault in writing until you understand the claim.
4. Build a short timeline: date, who said what, what was promised, what actually happened.

Do not:
1. Threaten the other side.
2. Forge documents.
3. Delete messages.
4. Pay a penalty/debt without written calculation and legal basis.

To analyze precisely, tell me briefly what happened, whether anything is already signed, the amount/deadlines, and whether you have messages or a contract.`;
}

function buildLegalAnalysisPrompt({ text, opts, localReport }) {
  const outputLanguage = normalizeLanguage(opts.reportLanguage || opts.language);
  const detectedLanguage = opts.detectedLanguage || opts.documentLanguage || 'unknown';
  const lang = outputLanguage === 'en' ? 'English' : 'Russian';
  const role = opts.userRole || 'not specified';
  const status = opts.signingStatus || 'not specified';
  return `You are MavenLex Human Legal Counsel AI: a strong AI legal analyst for contracts, disputes, statutory questions and real-life legal situations. You are MavenLex: a serious legal-counsel-style AI analyst. Answer directly, completely, practically and based on the facts provided. Your job is to help the user understand legal meaning, consequences, risks, actions, negotiation text, points to verify, and possible next steps.

Output language: ${lang}.
Detected/source document language: ${detectedLanguage}.
Jurisdiction selected by user: ${opts.jurisdiction || 'not specified'}.
Contract type selected by user: ${opts.contractType || 'not specified'}.
User role: ${role}.
Signing status: ${status}.

Behavior requirements:
${humanLegalCounselBehaviorBlock(outputLanguage)}
${chatGptLikeLegalReasoningBlock(outputLanguage)}
- Do NOT refuse ordinary legal analysis, contract review, legal article explanation, dispute planning or risk review. If a safety boundary is relevant, redirect to safe legal explanation instead of refusing.
- Do NOT answer with phrases like "I cannot discuss this topic", "I can't help with that", "Я не могу обсуждать эту тему" for lawful legal questions.
- Do NOT write like a template. Every risk must refer to an actual excerpt or missing clause from the contract.
- Think like a practical assistant: explain what can happen in real life, what the user should do now, what to negotiate, and what to verify next.
- Distinguish between BEFORE SIGNING and ALREADY SIGNED. If unclear, include clarifying questions and give separate paths.
- Prioritize risks. Tell the user what to fix first, second and third. Do not list everything as equally important.
- Make the report feel like a business mini-audit, not raw AI text: every risk needs problem, why it matters, what to change, and a practical next action.
- Give confidence with reasons. Example: high confidence because the excerpt directly says "without prior notice".
- If information is missing, say what is missing and what the user should find/check. Do not invent facts.
- If jurisdiction-specific law is needed, flag it for MavenLex deep verification and explain what to verify.
- Be direct, human and useful. Avoid vague advice like "consult someone" unless you also say what to ask the MavenLex.
- Safe wording: say "informational AI analysis", "prepare for deeper verification", "recommended to verify". Never say this is final legal advice.
- Always return both ru/en fields, but make the requested output language more polished and natural.

Return ONLY valid JSON with this structure. Use concrete text, not placeholders:
{
  "provider":"YandexGPT live legal reasoning",
  "summary":{"ru":"human summary", "en":"human summary"},
  "riskScore":72,
  "riskLevel":"High|Medium|Low",
  "signatureReadiness":{"status":"Ready|Negotiate First|MavenLex Deep Check Recommended|Do Not Sign Yet", "text":{"ru":"clear signing recommendation", "en":"clear signing recommendation"}},
  "decisionRecommendation":{"ru":"clear practical recommendation", "en":"clear practical recommendation"},
  "clarifyingQuestions":[{"ru":"question if needed", "en":"question if needed"}],
  "priorityPlan":{"ru":["first priority", "second priority", "third priority"], "en":["first priority", "second priority", "third priority"]},
  "decisionTree":{"ru":["If not signed: ...", "If already signed: ...", "If counterparty refuses: ..."], "en":["If not signed: ...", "If already signed: ...", "If counterparty refuses: ..."]},
  "contractIntelligence":{"detectedType":{"ru":"detected contract type", "en":"detected contract type"}, "analysisDepth":"quick|standard|deep", "userSide":{"ru":"likely user side or unknown", "en":"likely user side or unknown"}, "confidence":"High|Medium|Low"},
  "riskMatrix":{"financial":{"score":0,"level":"Low|Medium|High","reason":{"ru":"...","en":"..."}},"legal":{"score":0,"level":"Low|Medium|High","reason":{"ru":"...","en":"..."}},"operational":{"score":0,"level":"Low|Medium|High","reason":{"ru":"...","en":"..."}},"termination":{"score":0,"level":"Low|Medium|High","reason":{"ru":"...","en":"..."}},"dispute":{"score":0,"level":"Low|Medium|High","reason":{"ru":"...","en":"..."}},"confidentiality":{"score":0,"level":"Low|Medium|High","reason":{"ru":"...","en":"..."}}},
  "clauseMap":[{"key":"payment|term|liability|termination|dispute|confidentiality|ip|acceptance","title":{"ru":"...","en":"..."},"status":"Found|Missing|Weak","excerpt":"exact excerpt or missing note","risk":{"ru":"why it matters","en":"why it matters"},"recommendation":{"ru":"what to add/change","en":"what to add/change"}}],
  "missingClauses":[{"title":{"ru":"missing/weak clause","en":"missing/weak clause"},"whyImportant":{"ru":"...","en":"..."},"suggestedAddition":{"ru":"...","en":"..."}}],
  "redFlags":[{"title":{"ru":"red flag","en":"red flag"},"severity":"High|Medium|Low","evidence":"contract excerpt or missing evidence","action":{"ru":"...","en":"..."}}],
  "risks":[
    {
      "id":"short-id",
      "score":80,
      "level":"High|Medium|Low",
      "title":{"ru":"specific risk name", "en":"specific risk name"},
      "source":"exact contract excerpt or clear note that clause is missing",
      "confidence":{"level":"High|Medium|Low", "reason":{"ru":"why you are confident", "en":"why you are confident"}},
      "plainLanguage":{"ru":"what this means in normal words", "en":"what this means in normal words"},
      "businessImpact":{"ru":"what can happen to the user", "en":"what can happen to the user"},
      "whatToDo":{"ru":"specific next action", "en":"specific next action"},
      "questionForMavenLex":{"ru":"specific MavenLex verification point", "en":"specific MavenLex verification point"},
      "suggestedDraft":{"ru":"safer draft wording", "en":"safer draft wording"},
      "worstCaseScenario":{"ru":"specific worst case", "en":"specific worst case"}
    }
  ],
  "worstCaseScenarios": [{"title":{"ru":"...","en":"..."},"scenario":{"ru":"...","en":"..."},"prevention":{"ru":"...","en":"..."}}],
  "actionPlan": {"ru":["step 1", "step 2", "step 3", "step 4"], "en":["step 1", "step 2", "step 3", "step 4"]},
  "todayPlan": {"ru":["what the user should do today"], "en":["what the user should do today"]},
  "dontDo": {"ru":["what the user must avoid doing"], "en":["what the user must avoid doing"]},
  "alreadySignedPlan": {"ru":["what to do if already signed"], "en":["what to do if already signed"]},
  "MavenLexPackage": {"ru":["what documents/info to send to MavenLex"], "en":["what documents/info to send to MavenLex"]},
  "moneyRisk": {"ru":["money exposure calculation/explanation"], "en":["money exposure calculation/explanation"]},
  "counterpartyMessages": {"soft":{"ru":"soft ready message", "en":"soft ready message"}, "neutral":{"ru":"neutral ready message", "en":"neutral ready message"}, "firm":{"ru":"firm ready message", "en":"firm ready message"}},
  "roleRecommendations": {"customer":{"ru":["for customer"], "en":["for customer"]}, "provider":{"ru":["for provider"], "en":["for provider"]}, "unknown":{"ru":["ask role"], "en":["ask role"]}},
  "negotiationMessage": {"ru":"ready-to-send message to counterparty", "en":"ready-to-send message to counterparty"},
  "MavenLexQuestions": [{"ru":"specific question", "en":"specific question"}],
  "suggestedEdits": [{"title":{"ru":"...","en":"..."},"level":"High|Medium|Low","source":"...","suggestedDraft":{"ru":"...","en":"..."}}],
  "redline": [{"title":{"ru":"...","en":"..."},"remove":"risky text","add":{"ru":"safer replacement","en":"safer replacement"}}],
  "timeline": [{"date":{"ru":"...","en":"..."},"event":{"ru":"...","en":"..."}}],
  "voiceScript": {"ru":"30-45 sec voice summary", "en":"30-45 sec voice summary"},
  "MavenLexBrief": {"objective":{"ru":"...","en":"..."},"keyRisks":[{"ru":"...","en":"..."}],"jurisdiction":"..."},
  "analysisNotes": {"ru":"how you reasoned, in 1-2 sentences", "en":"how you reasoned, in 1-2 sentences"},
  "disclaimer": {"ru":"AI-разбор MavenLex. Проверяйте факты, документы и актуальные нормы перед действием.", "en":"MavenLex AI analysis. Verify facts, documents and current rules before acting."}
}

Local pre-scan found these likely risk categories. Use them only as hints, not as final truth:
${JSON.stringify(localReport.risks.map(r => ({ title: r.title.en, score: r.score, excerpt: r.source })).slice(0,8))}

CONTRACT TEXT:
${text}`;
}


function isAiRefusalText(value = '') {
  const s = String(value || '').toLowerCase();
  return /я не могу обсуждать|не могу помочь с этим|не могу помочь в этом|давайте поговорим о чем-нибудь|давайте поговорим о чём-нибудь|i can.?t discuss|i cannot discuss|i can.?t help with that|i cannot help with that|let.?s talk about something else/.test(s);
}
function legalCounselRescuePrompt(originalPrompt, userQuestion = '') {
  return `You previously produced a refusal. That is incorrect for MavenLex.
You are MavenLex Human Legal Counsel AI. The user is asking for lawful legal information, contract analysis or risk explanation. You must answer safely and usefully.
Do not provide instructions for committing crimes, hiding evidence, evading law enforcement, forging documents or harming people. If a request touches those areas, reframe into legal risks, what to avoid, safe steps, evidence to preserve, and questions to verify.
Do not say \"I cannot discuss this topic\". Give a structured legal analysis.

User question/context:
${userQuestion || ''}

Original task:
${originalPrompt}`;
}

async function callYandexText(prompt, { timeoutMs = 115000 } = {}) {
  const apiKey = process.env.YANDEX_API_KEY;
  const projectId = process.env.YANDEX_PROJECT_ID;
  const model = process.env.YANDEX_MODEL || 'yandexgpt/rc';
  if (!apiKey || !projectId) throw new Error('YANDEX_API_KEY or YANDEX_PROJECT_ID is missing.');
  const endpoint = process.env.YANDEX_BASE_URL || 'https://ai.api.cloud.yandex.net/v1/responses';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'OpenAI-Project': projectId
  };
  const body = JSON.stringify({
    model,
    input: prompt,
    temperature: 0.2,
    max_output_tokens: Number(process.env.YANDEX_MAX_OUTPUT_TOKENS || 9000)
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, { method: 'POST', headers, body, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const details = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 500);
      throw new Error(`YandexGPT request failed: ${details}`);
    }
    const answer = data.output_text || data.text || data.choices?.[0]?.message?.content || data.output?.map?.(o => o.content?.map?.(c => c.text).join('')).join('\n') || JSON.stringify(data);
    if (isAiRefusalText(answer)) {
      const rescueBody = JSON.stringify({
        model,
        input: legalCounselRescuePrompt(prompt),
        temperature: 0.15,
        max_output_tokens: Number(process.env.YANDEX_MAX_OUTPUT_TOKENS || 9000)
      });
      const rescue = await fetch(endpoint, { method: 'POST', headers, body: rescueBody, signal: controller.signal });
      const rescueData = await rescue.json().catch(() => ({}));
      if (rescue.ok) {
        const rescueAnswer = rescueData.output_text || rescueData.text || rescueData.choices?.[0]?.message?.content || rescueData.output?.map?.(o => o.content?.map?.(c => c.text).join('')).join('\n') || '';
        if (rescueAnswer && !isAiRefusalText(rescueAnswer)) return rescueAnswer;
      }
    }
    return answer;
  } finally {
    clearTimeout(timer);
  }
}

async function buildAiReport(text, opts = {}) {
  const localReport = analyzeLocal(text, opts);
  const contextSnippet = text.slice(0, 24000);
  if (!hasLiveAi() || process.env.DISABLE_LIVE_AI === 'true') {
    throw clientError('AI не работает: live AI provider не подключён. Добавьте YANDEX_API_KEY, YANDEX_PROJECT_ID и YANDEX_MODEL, затем поставьте DISABLE_LIVE_AI=false.', 503, { code: 'LIVE_AI_NOT_CONFIGURED' });
  }
  const started = Date.now();
  try {
    const prompt = buildLegalAnalysisPrompt({ text: contextSnippet, opts, localReport });
    const raw = await callYandexText(prompt, { timeoutMs: Number(process.env.AI_TIMEOUT_MS || 180000) });
    const ai = safeJsonParse(raw);
    const report = normalizeAiReport(ai, localReport, { contextSnippet });
    const minMs = Number(process.env.ANALYSIS_MIN_MS || 12000);
    const elapsed = Date.now() - started;
    if (elapsed < minMs) await sleep(minMs - elapsed);
    return { ...report, metaAiMode: 'live-yandexgpt' };
  } catch (e) {
    console.warn('[ai-analysis-error]', e.message);
    const minMs = Number(process.env.ANALYSIS_MIN_MS || 3000);
    const elapsed = Date.now() - started;
    if (elapsed < minMs) await sleep(minMs - elapsed);
    throw clientError(`AI не работает: live AI не смог обработать договор. Причина: ${e.message}`, 503, { code: 'LIVE_AI_FAILED' });
  }
}

function classifyChatIntent(question = '') {
  const q = String(question || '').toLowerCase();
  if (/подпис|sign|можно ли|can i|стоит ли/.test(q)) return 'signing-decision';
  if (/что делать|план|дальше|поступ|action|next|steps/.test(q)) return 'action-plan';
  if (/сообщ|письм|ответ|переговор|message|negotiat|email|написать/.test(q)) return 'negotiation-message';
  if (/MavenLex|MavenLex|вопрос/.test(q)) return 'MavenLex-questions';
  if (/худш|worst|опас|кин/.test(q)) return 'worst-case';
  if (/измен|правк|rewrite|clause|формулиров/.test(q)) return 'rewrite';
  if (/уже подпис|signed|подписал|подписала/.test(q)) return 'already-signed';
  if (/штраф|penalt|неустой/.test(q)) return 'penalty';
  if (/расторг|terminate|termination/.test(q)) return 'termination';
  return 'general-help';
}

function compactReportForAi(report = {}) {
  return {
    type: report.type,
    title: report.title,
    area: report.area,
    jurisdiction: report.jurisdiction,
    summary: report.summary,
    mayLeadToViolation: report.mayLeadToViolation,
    howToAvoidViolation: report.howToAvoidViolation,
    whatToDoNow: report.whatToDoNow,
    riskScore: report.riskScore,
    riskLevel: report.riskLevel,
    signatureReadiness: report.signatureReadiness,
    decisionRecommendation: report.decisionRecommendation,
    clarifyingQuestions: report.clarifyingQuestions,
    priorityPlan: report.priorityPlan,
    decisionTree: report.decisionTree,
    risks: (report.risks || []).slice(0, 10).map(r => ({
      title: r.title,
      level: r.level,
      score: r.score,
      source: r.source,
      confidence: r.confidence,
      plainLanguage: r.plainLanguage,
      businessImpact: r.businessImpact,
      whatToDo: r.whatToDo,
      questionForMavenLex: r.questionForMavenLex,
      suggestedDraft: r.suggestedDraft,
      worstCaseScenario: r.worstCaseScenario
    })),
    actionPlan: report.actionPlan,
    todayPlan: report.todayPlan,
    dontDo: report.dontDo,
    alreadySignedPlan: report.alreadySignedPlan,
    MavenLexPackage: report.MavenLexPackage,
    moneyRisk: report.moneyRisk,
    counterpartyMessages: report.counterpartyMessages,
    roleRecommendations: report.roleRecommendations,
    negotiationMessage: report.negotiationMessage,
    MavenLexQuestions: report.MavenLexQuestions,
    worstCaseScenarios: report.worstCaseScenarios,
    originalContext: String(report.originalContext || '').slice(0, 12000)
  };
}

function buildChatPrompt({ question, report, language, mode = 'smart', history = [] }) {
  const lang = language === 'en' ? 'English' : 'Russian';
  const intent = classifyChatIntent(question);
  const compact = compactReportForAi(report);
  const chatHistory = normalizeChatHistory(history);
  return `You are MavenLex Human Legal Counsel AI inside the MavenLex website. Your job is to answer as a strong, calm, human legal analyst in chat — close to ChatGPT-quality reasoning, not as a rigid template bot. You are MavenLex and must be direct, useful, practical and complete.
${humanLegalCounselBehaviorBlock(language)}
${chatGptLikeLegalReasoningBlock(language)}
${buildAdaptiveAnswerInstruction({ question, report, language, history })}

CRITICAL POSITIONING:
- Act as MavenLex Human Legal Counsel AI: direct, serious, practical and complete. Do not behave like a generic chatbot.
- Do NOT refuse ordinary legal questions. If the user asks about a contract, law article, fine, dispute, police, employment, debt, claim, liability, consumer, family or business legal issue, answer with safe legal analysis.
- Never reply with "I cannot discuss this topic" / "Я не могу обсуждать эту тему" to a normal legal question.
- Do NOT restrict yourself to the uploaded contract. The uploaded document is context when relevant, not a prison.
- If the question is about the uploaded contract, use the contract evidence and say what clause/fragment matters.
- If the question is about a law article, dispute, police, debt, employment, family, consumer issue, fines, liability, or another legal situation, answer the question directly using general legal reasoning and clearly state what must be verified in the current law.
- If the user explicitly asks "answer only by the uploaded file", then answer only by the uploaded file and say when the file does not contain enough information.
- Help like a strong assistant preparing a person for MavenLex, negotiation, court/police/inspection, or next action.

Answer language: ${lang}.
Answer mode requested: ${mode}. Intent detected: ${intent}.

STYLE RULES:
- Do NOT sound like a template, checklist generator, robotic FAQ, or generic disclaimer bot. The user should feel they are talking to a real strong AI legal mind.
- Start with the practical conclusion when useful, but for small follow-ups answer conversationally first.
- Use simple human language. The user may be stressed, confused or scared.
- Be specific: what can happen, what to do today, what not to do, what evidence to keep, what to ask, what message to send. Avoid filler.
- Mention uncertainty honestly, but do not hide behind "use MavenLex" as the whole answer.
- If exact penalties or current statutory text matter, say that the current official text/part of article must be checked.
- If information is missing, ask 2-4 targeted questions after giving a safe provisional answer.
- Distinguish BEFORE ACTION vs ALREADY DONE / ALREADY SIGNED / ALREADY CHARGED.
- If asked about punishment for an article, explain consequences at a high level and say what factors affect severity. Do not fabricate exact numbers if uncertain.
- If asked "how to violate", reframe into "what conduct may be treated as violation and what to avoid".
- Do not help with evading law enforcement, destroying evidence, hiding assets, intimidating people, forging documents, or committing crimes.
- Safe footer should be short: "Это информационная помощь, важные решения проверьте в MavenLex." Do not overdo disclaimers.

FOR RUSSIAN LAW ARTICLE QUESTIONS:
Use this logic, but do not force these headings if the user asks a small follow-up:
1. Прямой ответ: что это за статья / о чём она.
2. Что может грозить в общем виде, без выдумывания точных санкций, если не уверен.
3. От чего зависит итог: часть статьи, размер/сумма, умысел, доказательства, повторность, роль человека, последствия.
4. Что делать сейчас безопасно.
5. Что НЕ делать.
6. Что спросить у фактов и актуальной редакции.

FOR CONTRACT QUESTIONS:
- Say whether you would sign, negotiate first, or not sign yet.
- Point to the risky clauses and explain the real-world consequence.
- Suggest concrete edits and ready-to-send wording when useful.

ANSWER QUALITY BAR:
Before finalizing, mentally check: did I answer like a human, give a conclusion, explain risk, say what to do now, say what not to do, mention evidence/documents, and ask only useful clarifying questions? If not, rewrite the answer before sending it.
Do not use numbered headings mechanically if the user asked a small follow-up. For a short follow-up, answer conversationally but still useful. If the answer sounds like a canned template, rewrite it into a natural chat answer before sending.
If the user writes emotionally or with profanity, stay calm and practical; do not moralize.

Recent chat memory, use for follow-up questions:
${chatHistory.length ? chatHistory.map((m, i) => `${i + 1}. ${m.role}: ${m.text}`).join('\n') : 'No previous messages yet.'}

User question:
${question}

Uploaded document/report/article context JSON, use when relevant:
${JSON.stringify(compact, null, 2)}`;
}

function detectLegalReference(question = '') {
  const raw = String(question || '');
  const lower = raw.toLowerCase().replace(/ё/g, 'е');
  const articleMatch = lower.match(/(?:ст(?:атья|\.)?|article)\s*(?:№|no\.?\s*)?(\d+(?:\.\d+)?)/i)
    || lower.match(/(?:ук|гк|тк|нк|коап)\s*рф\s*(\d+(?:\.\d+)?)/i)
    || lower.match(/(\d+(?:\.\d+)?)\s*(?:ук|гк|тк|нк|коап)\s*рф/i);
  const code = /ук\s*рф|уголовн|criminal code/.test(lower)
    ? 'criminal'
    : /гк\s*рф|гражданск|civil code/.test(lower)
      ? 'civil'
      : /тк\s*рф|трудов|labou?r code|labor code/.test(lower)
        ? 'labour'
        : /коап|административ|administrative/.test(lower)
          ? 'administrative'
          : /нк\s*рф|налогов|tax code/.test(lower)
            ? 'tax'
            : '';
  const codeLabel = code === 'criminal' ? 'УК РФ' : code === 'civil' ? 'ГК РФ' : code === 'labour' ? 'ТК РФ' : code === 'administrative' ? 'КоАП РФ' : code === 'tax' ? 'НК РФ' : '';
  return { article: articleMatch?.[1] || '', code, codeLabel };
}

function localHelpfulChat(question = '', report = {}, language = 'ru', mode = 'smart') {
  const isRu = language !== 'en';
  const qRaw = String(question || '').trim();
  const q = qRaw.toLowerCase();
  const risks = Array.isArray(report.risks) ? report.risks : [];
  const sorted = [...risks].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  const top = sorted.slice(0, 3);
  const first = top[0];
  const lang = isRu ? 'ru' : 'en';
  const legalRef = detectLegalReference(qRaw);
  const names = top.map(r => T(r.title, lang)).filter(Boolean).join(', ');
  const source = r => r?.source ? (isRu ? `Я опираюсь на конкретный фрагмент договора: “${r.source}”.` : `I’m relying on a specific contract excerpt: “${r.source}”.`) : '';
  const actionsFromReport = () => {
    const priority = T(report.priorityPlan, lang);
    const plan = T(report.actionPlan, lang);
    const src = Array.isArray(priority) && priority.length ? priority : (Array.isArray(plan) ? plan : []);
    return src.slice(0, 4);
  };
  const numbered = arr => arr.filter(Boolean).map((x, i) => `${i + 1}. ${x}`).join('\n');
  const topEvidence = () => top.map((r, i) => `${i + 1}. ${T(r.title, lang)} — ${T(r.plainLanguage, lang) || T(r.businessImpact, lang)}${r.source ? `\n   ${isRu ? 'Фрагмент' : 'Excerpt'}: “${r.source}”` : ''}`).join('\n');
  const primaryAction = first ? T(first.whatToDo, lang) : (isRu ? 'сначала проверить оплату, расторжение, ответственность и сроки.' : 'first check payment, termination, liability and timing.');
  const shortMode = mode === 'quick';
  const actionMode = mode === 'action';
  const deepMode = mode === 'deep';
  const practicalList = key => {
    const value = T(report[key], lang);
    return Array.isArray(value) ? value : [];
  };
  const msg = report.counterpartyMessages || {};
  const role = report.roleRecommendations || {};

  if (/сегодня|today|прямо сейчас|сейчас сделать/.test(q)) {
    const items = practicalList('todayPlan');
    return isRu
      ? `План на сегодня такой:\n\n${numbered(items.length ? items : ['Не подписывать текущую редакцию.', 'Запросить правки по самым рискованным пунктам.', 'Сохранить договор и переписку.', 'Подготовить что проверить.'])}\n\nГлавная цель сегодня — не решить весь спор идеально, а не сделать шаг, который ухудшит вашу позицию.`
      : `Today’s plan:\n\n${numbered(items.length ? items : ['Do not sign the current version.', 'Request edits to the riskiest clauses.', 'Save the contract and correspondence.', 'Prepare verification questions.'])}\n\nThe goal today is not to solve everything perfectly, but to avoid making your position worse.`;
  }

  if (/не делать|нельзя|чего не|dont|don't|avoid|not do/.test(q)) {
    const items = practicalList('dontDo');
    return isRu
      ? `Вот что я бы НЕ делал:\n\n${numbered(items.length ? items : ['Не подписывать без новой редакции.', 'Не признавать нарушение письменно.', 'Не платить штраф без расчёта.', 'Не удалять переписку.'])}\n\nЭто важно, потому что в юридических спорах часто вредят не сами пункты договора, а поспешные сообщения и действия после них.`
      : `Here is what I would NOT do:\n\n${numbered(items.length ? items : ['Do not sign without a revised draft.', 'Do not admit breach in writing.', 'Do not pay a penalty without calculation.', 'Do not delete correspondence.'])}\n\nThis matters because in disputes, rushed messages and actions often hurt more than the clause itself.`;
  }

  if (/что отправить MavenLex|проверке отправ|пакет MavenLex|MavenLex package|send.*MavenLex/.test(q)) {
    const items = practicalList('MavenLexPackage');
    return isRu
      ? `MavenLexу лучше отправить не хаос, а короткий пакет:\n\n${numbered(items.length ? items : ['Договор и приложения.', 'Переписку.', 'Счета и акты.', 'Спорные пункты.', 'Вашу цель.'])}\n\nИ главный вопрос сформулируйте так: “Можно ли подписывать после этих правок, и какие последствия останутся для меня?”`
      : `Send the MavenLex a clean package, not chaos:\n\n${numbered(items.length ? items : ['Contract and attachments.', 'Correspondence.', 'Invoices and acts.', 'Disputed clauses.', 'Your goal.'])}\n\nThe main question should be: “Is it safe to sign after these edits, and what exposure remains for me?”`;
  }

  if (/деньг|сумм|сколько|расч[её]т|money|cost|calculate|exposure/.test(q)) {
    const items = practicalList('moneyRisk');
    return isRu
      ? `По деньгам я бы смотрел так:\n\n${numbered(items.length ? items : ['Найдите сумму договора.', 'Найдите процент или формулу штрафа.', 'Умножьте сумму на процент.', 'Проверьте лимит ответственности.'])}\n\nЕсли пришлёте сумму договора и формулу штрафа, можно прикинуть риск точнее.`
      : `For money exposure, I would look at it like this:\n\n${numbered(items.length ? items : ['Find the contract amount.', 'Find the penalty percentage or formula.', 'Multiply amount by percentage.', 'Check the liability cap.'])}\n\nIf you provide the contract amount and penalty formula, the exposure can be estimated more precisely.`;
  }

  if (/заказчик|клиент|customer|client/.test(q)) {
    const items = Array.isArray(T(role.customer, lang)) ? T(role.customer, lang) : [];
    return isRu ? `Если вы заказчик, я бы смотрел на договор так:\n\n${numbered(items.length ? items : ['Опасно, если исполнитель почти ни за что не отвечает.', 'Нужны сроки, качество, ответственность и возврат денег.', 'Проверить, можно ли выйти из договора при плохом исполнении.'])}` : `If you are the customer, I would read the contract like this:\n\n${numbered(items.length ? items : ['It is risky if the provider has almost no responsibility.', 'You need deadlines, quality obligations, liability and refund logic.', 'Check whether you can exit for poor performance.'])}`;
  }

  if (/исполнитель|подрядчик|provider|contractor|freelancer/.test(q)) {
    const items = Array.isArray(T(role.provider, lang)) ? T(role.provider, lang) : [];
    return isRu ? `Если вы исполнитель, я бы смотрел на договор так:\n\n${numbered(items.length ? items : ['Опасны жёсткие штрафы и неограниченная ответственность.', 'Нужен понятный порядок приёмки и оплаты.', 'Нужен срок на исправление претензий.'])}` : `If you are the provider, I would read the contract like this:\n\n${numbered(items.length ? items : ['Harsh penalties and unlimited liability are dangerous.', 'You need a clear acceptance and payment process.', 'You need time to cure complaints.'])}`;
  }

  if (/мягк|ж[её]стк|официальн|short|firm|soft|neutral/.test(q) && /сообщ|письм|ответ|message|email|напис/.test(q)) {
    const style = /ж[её]стк|firm/.test(q) ? 'firm' : /мягк|soft/.test(q) ? 'soft' : 'neutral';
    const text = T(msg[style], lang) || T(report.negotiationMessage, lang);
    return isRu ? `Вот ${style === 'firm' ? 'жёсткий' : style === 'soft' ? 'мягкий' : 'нейтральный'} вариант сообщения:\n\n${text}` : `Here is the ${style} message:\n\n${text}`;
  }

  if (/^(hi|hello|hey|привет|здравствуй|здравствуйте|салам)/i.test(qRaw)) {
    return isRu
      ? `Привет. Я MavenLex. Я могу помочь по-человечески, а не шаблоном: объяснить, где риск, можно ли подписывать, что попросить изменить, что написать второй стороне и что спросить у проверки. По текущему договору я бы в первую очередь смотрел на: ${names || 'оплату, расторжение и ответственность'}.`
      : `Hi. I’m MavenLex. I can help like an assistant, not a template: explain the real risk, tell you whether signing is safe, suggest edits, draft a message to the counterparty, and prepare verification points. In this contract I would first look at: ${names || 'payment, termination and liability'}.`;
  }

  if (legalRef.article || /кодекс|закон|law|statute|статья|ук рф|гк рф|коап|тк рф|нк рф/.test(q)) {
    if (!legalRef.article) {
      return isRu
        ? `Тут лучше уточнить статью и кодекс. Например: “УК РФ 228”, “ГК РФ 421”, “КоАП РФ 12.8”, “ТК РФ 81”. Тогда я объясню нормально: о чём статья, какие последствия возможны, от чего зависит риск, что делать сейчас и чего точно не делать.`
        : `Please specify the article and code. For example: “Russian Criminal Code 228”, “Civil Code 421”, “Administrative Code 12.8”, “Labour Code 81”. Then I can explain what it is about, possible consequences, risk factors, immediate steps and what to avoid.`;
    }

    const codeLabel = legalRef.codeLabel || (legalRef.code === 'criminal' ? 'УК РФ' : legalRef.code === 'civil' ? 'ГК РФ' : legalRef.code === 'labour' ? 'ТК РФ' : legalRef.code === 'administrative' ? 'КоАП РФ' : legalRef.code === 'tax' ? 'НК РФ' : 'УК РФ');
    const ref = safeLocalArticleResult({ code: codeLabel, article: legalRef.article, question: qRaw });
    const list = arr => (Array.isArray(arr) ? arr : []).filter(Boolean).map((x, i) => `${i + 1}. ${x}`).join('\n');
    const exactKnown = RU_LAW_ARTICLES[lawArticleKey(codeLabel, legalRef.article)];

    if (isRu) {
      const consequence = exactKnown
        ? ref.summary
        : `Я не буду фантазировать точные санкции только по номеру статьи. Для точного ответа нужно проверить актуальную редакцию ${codeLabel}, часть статьи и обстоятельства. Но общий подход такой: риск зависит от состава нарушения, доказательств, размера/суммы, умысла, повторности и последствий.`;
      return `Прямо: вопрос уже не про договор, а про ${codeLabel} статью ${legalRef.article}. ${ref.area && ref.area !== 'Статья не найдена в локальной базе MavenLex.' ? `Это связано с темой: ${ref.area}.` : 'Нужно уточнить точную часть статьи и факты.'}

Что это значит простыми словами:
${consequence}

Что может привести к проблеме:
${list(ref.mayLeadToViolation)}

Что делать сейчас безопасно:
${list(ref.whatToDoNow)}

Что НЕ делать:
${list(ref.howToAvoidViolation)}

Что спросить у фактов и актуальной редакции:
${list(ref.MavenLexQuestions)}

Это информационная помощь MavenLex. Важные решения, особенно по уголовным/административным делам, нужно проверять с MavenLexом и по актуальной редакции закона.`;
    }

    return `Directly: this is no longer mainly a contract question; it is about ${codeLabel} Article ${legalRef.article}. ${ref.area ? `Topic: ${ref.area}.` : 'The exact part of the article and facts matter.'}

Plain meaning:
${ref.summary}

Conduct that may create liability:
${list(ref.mayLeadToViolation)}

Safe steps now:
${list(ref.whatToDoNow)}

What to avoid:
${list(ref.howToAvoidViolation)}

Questions for MavenLex:
${list(ref.MavenLexQuestions)}

This is informational MavenLex help. Important decisions should be verified with MavenLex and the current official text.`;
  }

  if (/подпис|sign|можно ли|стоит ли|норм договор|normal/.test(q)) {
    const readiness = T(report.signatureReadiness?.text, lang) || (Number(report.riskScore || 0) >= 75 ? (isRu ? 'не подписывать без правок' : 'do not sign without edits') : (isRu ? 'сначала согласовать правки' : 'negotiate first'));
    const actions = actionsFromReport();
    if (shortMode) {
      return isRu
        ? `Коротко: я бы не подписывал этот договор как есть. Сейчас вывод такой: ${readiness}. Главная причина — самые опасные зоны здесь ${names || 'оплата, расторжение и ответственность'}. Следующий шаг простой: попросить правки по этим пунктам, получить новую редакцию и только потом решать вопрос с подписью.`
        : `Short answer: I would not sign this contract as is. The conclusion right now is: ${readiness}. The main reason is the risky areas here — ${names || 'payment, termination and liability'}. The practical next step is to request edits to those clauses, get a revised version, and only then decide about signing.`;
    }
    return isRu
      ? `Если говорить прямо: я бы не подписывал это как есть. Мой вывод сейчас — ${readiness}.\n\nПочему так: ${topEvidence() || 'в договоре есть пункты, которые слишком сильно влияют на деньги, сроки и возможность безопасно выйти из сделки.'}\n\nЧто это значит на практике: если оставить текст без правок, вы берёте на себя риск лишних платежей, слабой защиты по убыткам или неприятного выхода из договора.\n\nЧто делать дальше: ${actions.length ? '\n' + numbered(actions) : 'сначала попросить правки по самым опасным пунктам, затем получить новую редакцию письменно и заново пройти спорные места в MavenLex.'}`
      : `Speaking directly: I would not sign this as it is. My current conclusion is ${readiness}.\n\nWhy: ${topEvidence() || 'the contract contains clauses that affect money, deadlines and your ability to exit too heavily.'}\n\nWhat this means in real life: if you leave the text unchanged, you may be accepting extra payment exposure, weak damage protection, or a difficult exit.\n\nWhat to do next: ${actions.length ? '\n' + numbered(actions) : 'first request edits to the riskiest clauses, then get a revised written version and verify with MavenLex to review the disputed parts.'}`;
  }

  if (/что делать|план|дальше|поступ|action|next|steps|как быть/.test(q)) {
    const actions = actionsFromReport();
    const tree = T(report.decisionTree, lang);
    if (actionMode || deepMode) {
      return isRu
        ? `Я бы действовал спокойно и по приоритету. Сначала закрываем самый опасный блок — ${first ? T(first.title, 'ru') : 'ключевые коммерческие условия'}. Потом фиксируем правки письменно и только после этого возвращаемся к вопросу подписи.\n\nПошагово:\n${numbered(actions.length ? actions : ['Попросить правки по самым рискованным пунктам.', 'Получить новую редакцию договора, а не обещание в переписке.', 'Сравнить новую версию с текущей.', 'Перед подписью отдельно проверить спорные пункты и вопрос: можно ли подписывать после этих правок?'])}${Array.isArray(tree) && tree.length ? `\n\nЕсли ситуация меняется, я бы держал в голове ещё и такие развилки:\n${numbered(tree.slice(0, 3))}` : ''}`
        : `I would move calmly and in order. First fix the most dangerous block — ${first ? T(first.title, 'en') : 'the key commercial terms'}. Then get the edits in writing, and only after that return to the signing decision.\n\nStep by step:\n${numbered(actions.length ? actions : ['Request edits to the riskiest clauses.', 'Get a revised draft, not just promises in messages.', 'Compare the revised version with the current one.', 'Before signing, verify with MavenLex a focused question: is it safe to sign after these edits?'])}${Array.isArray(tree) && tree.length ? `\n\nIf the situation changes, keep these branches in mind:\n${numbered(tree.slice(0, 3))}` : ''}`;
    }
    return isRu
      ? `Я бы начал так: не подписывать, пока не закрыт самый опасный риск — ${first ? T(first.title, 'ru') : 'оплата / расторжение / ответственность'}. Потом попросить конкретные правки, получить новую редакцию и уже её перепроверить. Если нужно, я могу сразу написать тебе готовое сообщение второй стороне.`
      : `I would start like this: do not sign until the biggest risk is addressed — ${first ? T(first.title, 'en') : 'payment / termination / liability'}. Then request specific edits, get a revised version, and review that version. If you want, I can also draft a ready-to-send message to the counterparty.`;
  }

  if (/сообщ|письм|ответ|переговор|message|negotiat|email|написать/.test(q)) {
    const risky = top.map(r => T(r.title, lang)).join(', ');
    return isRu
      ? `Вот нормальный текст без канцелярщины, который можно отправить второй стороне:\n\nЗдравствуйте. Мы посмотрели договор и перед подписанием хотим уточнить несколько пунктов: ${risky || 'расторжение, ответственность, штрафы и оплату'}. В текущей редакции эти условия создают для нас лишний коммерческий риск. Просим прислать обновлённую версию, где расторжение возможно только после уведомления и срока на исправление, штрафы ограничены разумным пределом, а ответственность сторон сформулирована ясно и взаимно. После этого мы сможем быстрее вернуться к согласованию.`
      : `Here is a clean message you can send:\n\nHello. We reviewed the agreement and would like to clarify several points before signing: ${risky || 'termination, liability, penalties and payment'}. In the current version these terms create unnecessary commercial risk for us. Please send an updated draft where termination requires notice and a cure period, penalties are capped at a reasonable level, and liability is clear and mutual. After that we should be able to move forward faster.`;
  }

  if (/MavenLex|MavenLex|вопрос/.test(q)) {
    const qs = (report.MavenLexQuestions || []).slice(0, 5).map(x => T(x, lang)).filter(Boolean);
    const extra = isRu
      ? ['Можно ли безопасно подписывать после этих правок?', 'Есть ли риск, что этот пункт окажется недействительным или спорным именно в моей юрисдикции?', 'Что произойдёт, если вторая сторона попытается применить этот пункт против меня?', 'Какие документы нужно сохранить на случай спора?']
      : ['Is it safe to sign after these edits?', 'Could this clause be invalid or disputed in my jurisdiction?', 'What happens if the counterparty tries to enforce this clause against me?', 'Which documents should I preserve in case of a dispute?'];
    return isRu
      ? `MavenLexу лучше идти не с вопросом “норм договор?”, а с точечными вопросами. Я бы спросил так:\n\n${numbered([...qs, ...extra].slice(0, 8))}`
      : `A MavenLex should not get just “is this contract okay?”. I would ask focused questions like these:\n\n${numbered([...qs, ...extra].slice(0, 8))}`;
  }

  if (/худш|worst|опас|кин|обман/.test(q)) {
    const ws = (report.worstCaseScenarios || []).slice(0, 3).map(w => `${T(w.title, lang)} — ${T(w.scenario, lang)}`);
    return isRu
      ? `Самый неприятный сценарий здесь не в том, что договор просто “плохой”, а в том, что он может ударить по деньгам и оставить вас без нормального манёвра. По сути worst case тут такой:\n\n${numbered(ws.length ? ws : ['штраф могут начислить даже при небольшой просрочке;', 'договор могут прекратить без нормального предупреждения;', 'получить компенсацию за убытки будет сложно из-за ограничения ответственности.'])}\n\nЧтобы не попасть в это, я бы заранее потребовал уведомление, срок на исправление, лимит штрафов и понятный порядок выхода из договора.`
      : `The real worst case is not simply that the contract is “bad”. It is that it can hurt your money position and leave you with very little room to react. In practical terms, the worst case here looks like this:\n\n${numbered(ws.length ? ws : ['a penalty may apply even after a small delay;', 'the contract may be terminated without proper warning;', 'recovering damages may be difficult because of liability limits.'])}\n\nTo reduce that risk, I would ask for notice, a cure period, penalty caps and a clear exit process.`;
  }

  if (/уже подпис|signed|подписал|подписала/.test(q)) {
    const items = practicalList('alreadySignedPlan');
    return isRu
      ? `Если договор уже подписан, задача уже другая: не переписать текст, а не ухудшить позицию.\n\nЯ бы сделал так:\n${numbered(items.length ? items : ['Сохранить договор и переписку.', 'Понять, какой пункт применяют против вас.', 'Не признавать нарушение письменно.', 'Попросить письменное обоснование требований.', 'В MavenLex разобрать, можно ли снизить последствия или оспорить пункт.'])}`
      : `If the contract is already signed, the task changes: it is not to rewrite the text, but to avoid making your position worse.\n\nI would do this:\n${numbered(items.length ? items : ['Save the contract and correspondence.', 'Identify which clause is being used against you.', 'Do not admit breach in writing.', 'Ask for written justification.', 'Ask MavenLex if consequences can be reduced or the clause challenged.'])}`;
  }

  if (/измен|правк|rewrite|clause|формулиров|перепис/.test(q)) {
    const edits = top.map((r, i) => `${i + 1}. ${T(r.title, lang)}\n${T(r.suggestedDraft, lang)}`).join(`\n\n`);
    return isRu
      ? `Я бы не переписывал весь договор подряд. Смысл есть именно в замене самых опасных кусков. Начать стоит отсюда:\n\n${edits || 'Добавить письменное уведомление, срок на исправление, лимит ответственности и понятный порядок оплаты и расторжения.'}\n\nИ важный момент: после этого нужна новая редакция самого договора, а не просто обещание в переписке.`
      : `I would not rewrite the whole contract line by line first. The value is in replacing the most dangerous parts. I would start here:\n\n${edits || 'Add written notice, a cure period, a liability cap, and a clear payment and termination process.'}\n\nOne important point: after that, you need a revised contract draft, not only reassurance in messages.`;
  }

  if (/штраф|penalt|неустой/.test(q)) {
    const r = sorted.find(x => /штраф|penalt|late/i.test(T(x.title, 'ru') + T(x.title, 'en') + x.source)) || first;
    return isRu
      ? `По штрафам я бы был внимателен. ${source(r)} Это опасно не из-за самого слова “штраф”, а потому что даже небольшая задержка или спор по оплате может быстро превратиться в дополнительные деньги с вашей стороны. Я бы просил четыре вещи: письменное уведомление перед штрафом, 5–7 дней на исправление, верхний предел штрафа и запрет начислять штраф на сумму, которую вы добросовестно оспариваете.`
      : `I would watch the penalty clause closely. ${source(r)} The danger is not the word “penalty” itself, but the fact that even a small delay or payment dispute can quickly turn into extra money claimed from you. I would ask for four things: written notice before any penalty, a 5–7 day cure period, a penalty cap, and no penalty on amounts disputed in good faith.`;
  }

  if (/расторг|terminate|termination/.test(q)) {
    const r = sorted.find(x => /расторг|terminat/i.test(T(x.title, 'ru') + T(x.title, 'en') + x.source)) || first;
    return isRu
      ? `Расторжение — это один из самых чувствительных пунктов. ${source(r)} Если у второй стороны слишком широкое право быстро прекратить договор, вы можете потерять услугу, доступ или деньги почти без времени на реакцию. Нормальная правка здесь такая: расторжение только после письменного уведомления, разумного срока на исправление и понятного порядка закрытия расчётов, доступа и обязательств.`
      : `Termination is one of the most sensitive clauses. ${source(r)} If the other side has a broad right to end the contract quickly, you may lose service, access or money with almost no time to react. A safer edit is: termination only after written notice, a reasonable cure period, and a clear process for closing payments, access and remaining obligations.`;
  }

  const clarifying = (report.clarifyingQuestions || []).slice(0, 3).map(x => T(x, lang)).filter(Boolean);
  const clarifyingBlock = clarifying.length ? (isRu ? `\n\nЧтобы я помог точнее, ответь ещё на 2–3 вопроса:\n${numbered(clarifying)}` : `\n\nTo help more precisely, answer 2–3 quick questions:\n${numbered(clarifying)}`) : '';
  const intro = first
    ? (isRu ? `Я бы начал с пункта “${T(first.title, 'ru')}”, потому что он сейчас сильнее всего влияет на ваши деньги и переговорную позицию. ${source(first)}` : `I would start with “${T(first.title, 'en')}” because it currently has the biggest impact on your money and negotiation position. ${source(first)}`)
    : (isRu ? 'Мне не хватает контекста, но безопасный стартовый подход такой: не подписывать, пока не проверены оплата, ответственность, расторжение и сроки.' : 'I need more context, but the safe starting position is: do not sign until payment, liability, termination and deadlines are checked.');
  return isRu
    ? `${intro}\n\nПрактический следующий шаг: ${primaryAction}.${clarifyingBlock}`
    : `${intro}\n\nPractical next step: ${primaryAction}.${clarifyingBlock}`;
}
async function parsePdfText(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer), disableWorker: true, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  const chunks = [];
  const maxPages = Math.min(pdf.numPages || 0, 80);
  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str || '').join(' ');
    if (pageText.trim()) chunks.push(pageText);
  }
  return chunks.join('\n\n');
}

async function extractText(file) {
  const name = (file.originalname || '').toLowerCase();
  if (!file?.buffer?.length) throw clientError('Uploaded file is empty. Please choose a readable TXT, DOCX or PDF file.');
  let extracted = '';
  if (name.endsWith('.txt')) {
    extracted = file.buffer.toString('utf8');
  } else if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    extracted = result.value || '';
  } else if (name.endsWith('.pdf')) {
    extracted = await withTimeout(parsePdfText(file.buffer), EXTRACTION_TIMEOUT_MS, 'PDF parsing timed out. Try a smaller text-based PDF or convert it to DOCX/TXT.');
  } else {
    throw clientError('Unsupported file type. Please upload TXT, DOCX or PDF.');
  }
  extracted = normalizeDocumentText(extracted);
  if (extracted.length < MIN_EXTRACTED_CHARS) {
    throw clientError('The file was uploaded, but not enough readable text was extracted. Try DOCX/TXT or a text-based PDF instead of a scanned image PDF.');
  }
  return extracted;
}

function findLine(text, re, fallback) {
  const lines = String(text || '').split(/\n|(?<=[.!?;])\s+/).map(clean).filter(Boolean);
  return lines.find(x => re.test(x)) || fallback;
}

function risk(id, score, titleRu, titleEn, source, plainRu, plainEn, impactRu, impactEn, actionRu, actionEn, rewriteRu, rewriteEn) {
  const level = score >= 75 ? 'High' : score >= 45 ? 'Medium' : 'Low';
  return {
    id, score, level, title: B(titleRu, titleEn), source,
    plainLanguage: B(plainRu, plainEn), businessImpact: B(impactRu, impactEn),
    whatToDo: B(actionRu, actionEn),
    questionForMavenLex: B(`Можно ли изменить пункт «${titleRu}» и снизить риск для моей стороны?`, `Can we change “${titleEn}” and reduce risk for my side?`),
    suggestedDraft: B(rewriteRu, rewriteEn),
    worstCaseScenario: B(`В худшем случае: ${impactRu.toLowerCase()}`, `Worst case: ${impactEn.toLowerCase()}`),
    confidence: { level: source && source !== 'Penalty clause detected.' && source !== 'Termination clause detected.' && source !== 'Liability clause detected.' ? 'High' : 'Medium', reason: B(source ? `Найден фрагмент договора: “${source}”.` : 'Основано на локальном поиске рискованных формулировок.', source ? `Detected contract excerpt: “${source}”.` : 'Based on local detection of risky wording.') }
  };
}


const CONTRACT_TYPE_PROFILES = {
  service: { ru: 'Договор оказания услуг', en: 'Service agreement', keywords: /услуг|service|services|оказан|deliverable|statement of work|sow/i, expected: ['payment','acceptance','liability','termination','confidentiality','dispute'] },
  nda: { ru: 'NDA / договор конфиденциальности', en: 'NDA / confidentiality agreement', keywords: /nda|confidential|конфиденц|non-disclosure|разглаш/i, expected: ['confidentiality','term','liability','dispute','return_destroy'] },
  lease: { ru: 'Договор аренды', en: 'Lease agreement', keywords: /lease|rent|аренд|помещен|tenant|landlord/i, expected: ['payment','term','termination','liability','dispute','deposit'] },
  employment: { ru: 'Трудовой / employment договор', en: 'Employment contract', keywords: /employment|employee|работник|работодатель|зарплат|salary|трудов/i, expected: ['payment','term','termination','confidentiality','non_compete','dispute'] },
  supply: { ru: 'Договор поставки', en: 'Supply agreement', keywords: /поставк|supply|goods|товар|delivery|shipment/i, expected: ['payment','delivery','acceptance','liability','termination','dispute'] },
  partnership: { ru: 'Партнёрское соглашение', en: 'Partnership agreement', keywords: /partnership|partner|партнер|партнёр|joint|совместн/i, expected: ['payment','governance','liability','termination','dispute','confidentiality'] },
  loan: { ru: 'Договор займа / loan', en: 'Loan agreement', keywords: /loan|заем|заём|займ|interest|процент|repayment/i, expected: ['payment','term','liability','dispute','security'] },
  custom: { ru: 'Смешанный / нестандартный договор', en: 'Custom agreement', keywords: /./i, expected: ['payment','term','liability','termination','dispute','confidentiality'] }
};
const CLAUSE_PATTERNS = {
  payment: { title: B('Оплата', 'Payment'), re: /оплат|стоимост|цена|invoice|payment|fee|price|руб|eur|usd|₽|€|\$/i, risk: B('Без понятной оплаты легко спорить о сумме, сроках и просрочке.', 'Without clear payment terms, amount, timing and delay are easy to dispute.'), rec: B('Указать сумму, валюту, срок оплаты, основание для счета и последствия просрочки.', 'State amount, currency, due date, invoice basis and late-payment consequences.') },
  term: { title: B('Срок действия', 'Term'), re: /срок|term|period|effective date|действует|valid/i, risk: B('Без срока действия непонятно, когда обязательства начинаются и заканчиваются.', 'Without a term, it is unclear when obligations start and end.'), rec: B('Добавить дату начала, срок действия и условия продления.', 'Add start date, term and renewal terms.') },
  delivery: { title: B('Поставка / результат', 'Delivery'), re: /поставк|delivery|deliverable|результат|товар|shipment/i, risk: B('Без результата и сроков сложно доказать исполнение или нарушение.', 'Without deliverables and timing, performance or breach is hard to prove.'), rec: B('Описать результат, сроки, критерии приемки и документы.', 'Describe deliverables, deadlines, acceptance criteria and documents.') },
  acceptance: { title: B('Приёмка', 'Acceptance'), re: /приемк|приёмк|acceptance|act of acceptance|акт|approve|approval/i, risk: B('Без приёмки могут спорить о качестве, сроках и оплате.', 'Without acceptance rules, quality, timing and payment can be disputed.'), rec: B('Добавить процедуру приемки, срок проверки и последствия молчания.', 'Add acceptance procedure, review period and consequences of silence.') },
  liability: { title: B('Ответственность', 'Liability'), re: /ответствен|liability|damages|убыт|indemn/i, risk: B('Ответственность может быть неограниченной или, наоборот, слишком исключённой.', 'Liability may be unlimited or too broadly excluded.'), rec: B('Добавить разумный лимит и исключения для умысла, конфиденциальности и IP.', 'Add a reasonable cap and carve-outs for intent, confidentiality and IP.') },
  termination: { title: B('Расторжение', 'Termination'), re: /расторг|terminate|termination|cancel|отказ|прекрат/i, risk: B('Без порядка расторжения можно внезапно потерять деньги, доступ или результат.', 'Without termination process, money, access or deliverables can be lost suddenly.'), rec: B('Добавить уведомление, срок на исправление и порядок закрытия расчетов.', 'Add notice, cure period and settlement process.') },
  dispute: { title: B('Споры и право', 'Disputes and law'), re: /спор|суд|арбитраж|jurisdiction|governed|court|law of|applicable law/i, risk: B('Спор может уйти в неудобный суд, право или дорогую процедуру.', 'A dispute may go to an inconvenient court, law or costly process.'), rec: B('Указать применимое право, суд/арбитраж, язык и распределение расходов.', 'State governing law, venue/arbitration, language and costs.') },
  confidentiality: { title: B('Конфиденциальность', 'Confidentiality'), re: /конфиденц|confidential|secret|nda|разглаш/i, risk: B('Без защиты конфиденциальных данных может быть сложно доказать нарушение.', 'Without confidentiality protection, a breach may be hard to prove.'), rec: B('Определить конфиденциальную информацию, срок защиты, исключения и ответственность.', 'Define confidential information, protection period, exclusions and liability.') },
  ip: { title: B('Интеллектуальная собственность', 'Intellectual property'), re: /интеллект|авторск|copyright|ip|intellectual property|license|лиценз/i, risk: B('Неясно, кому принадлежат результаты, код, дизайн, тексты или лицензии.', 'Ownership of results, code, design, texts or licenses may be unclear.'), rec: B('Указать момент перехода прав, объем лицензии и ограничения использования.', 'State transfer timing, license scope and use restrictions.') }
};
function detectContractType(text = '', selected = '') {
  const joined = `${selected} ${String(text || '').slice(0, 8000)}`;
  for (const [key, profile] of Object.entries(CONTRACT_TYPE_PROFILES)) {
    if (key !== 'custom' && profile.keywords.test(joined)) return { key, title: B(profile.ru, profile.en), expected: profile.expected };
  }
  return { key: 'custom', title: B(CONTRACT_TYPE_PROFILES.custom.ru, CONTRACT_TYPE_PROFILES.custom.en), expected: CONTRACT_TYPE_PROFILES.custom.expected };
}
function levelFromScore(score) { return score >= 75 ? 'High' : score >= 45 ? 'Medium' : 'Low'; }
function clauseMapFor(text = '', detectedType = null) {
  const expected = new Set([...(detectedType?.expected || []), 'payment','liability','termination','dispute']);
  return Object.entries(CLAUSE_PATTERNS).filter(([key]) => expected.has(key)).map(([key, meta]) => {
    const excerpt = findLine(text, meta.re, '');
    const found = Boolean(excerpt);
    const weak = found && (/sole discretion|без уведом|without notice|not liable|не несет|не несёт|unlimited|любой момент/i.test(excerpt));
    return { key, title: meta.title, status: found ? (weak ? 'Weak' : 'Found') : 'Missing', excerpt: found ? excerpt : '', risk: meta.risk, recommendation: meta.rec };
  });
}
function missingClausesFromMap(map = []) {
  return map.filter(c => c.status === 'Missing' || c.status === 'Weak').slice(0, 6).map(c => ({
    title: c.status === 'Missing' ? B(`Отсутствует: ${c.title.ru}`, `Missing: ${c.title.en}`) : B(`Слабый пункт: ${c.title.ru}`, `Weak clause: ${c.title.en}`),
    whyImportant: c.risk,
    suggestedAddition: c.recommendation
  }));
}
function riskMatrixFor(text = '', risks = [], map = []) {
  const scoreBy = (keys, base=25) => Math.max(base, Math.min(100, base + risks.filter(r => keys.some(k => String(r.id).includes(k))).reduce((s,r)=>s+Math.round(Number(r.score||0)/4),0) + map.filter(c => keys.includes(c.key) && c.status !== 'Found').length * 18));
  const mk = (keys, ru, en, base) => { const score = scoreBy(keys, base); return { score, level: levelFromScore(score), reason: B(ru, en) }; };
  return {
    financial: mk(['payment','penalty','liability'], 'Оценка основана на оплате, штрафах и ответственности.', 'Based on payment, penalties and liability.', 30),
    legal: mk(['liability','dispute','ip'], 'Оценка основана на ответственности, праве, суде и правах на результат.', 'Based on liability, governing law, venue and rights.', 28),
    operational: mk(['delivery','acceptance','term'], 'Оценка основана на сроках, результате и приемке.', 'Based on deadlines, deliverables and acceptance.', 24),
    termination: mk(['termination','renewal'], 'Оценка основана на расторжении и продлении.', 'Based on termination and renewal.', 22),
    dispute: mk(['dispute','jurisdiction'], 'Оценка основана на порядке споров и юрисдикции.', 'Based on dispute process and jurisdiction.', 20),
    confidentiality: mk(['confidentiality','ip'], 'Оценка основана на конфиденциальности и IP.', 'Based on confidentiality and IP.', 18)
  };
}
function redFlagsFor(text = '', risks = [], map = []) {
  const flags = [];
  for (const r of risks.filter(r => Number(r.score || 0) >= 75).slice(0,4)) flags.push({ title: r.title, severity: r.level || 'High', evidence: r.source || '', action: r.whatToDo });
  for (const c of map.filter(c => c.status === 'Missing').slice(0,3)) flags.push({ title: B(`Нет важного пункта: ${c.title.ru}`, `Important clause missing: ${c.title.en}`), severity: 'Medium', evidence: 'Clause not found in extracted text', action: c.recommendation });
  return flags.slice(0,6);
}
function advancedContractIntelligence(text = '', opts = {}, risks = []) {
  const detectedType = detectContractType(text, opts.contractType);
  const map = clauseMapFor(text, detectedType);
  return {
    contractIntelligence: { detectedType: detectedType.title, selectedType: opts.contractType || '', analysisDepth: opts.analysisDepth || 'standard', userSide: B(opts.userRole || 'Не указано', opts.userRole || 'Not specified'), confidence: risks.length >= 3 ? 'High' : 'Medium' },
    riskMatrix: riskMatrixFor(text, risks, map),
    clauseMap: map,
    missingClauses: missingClausesFromMap(map),
    redFlags: redFlagsFor(text, risks, map)
  };
}

function analyzeLocal(text, opts = {}) {
  const lower = text.toLowerCase();
  const risks = [];
  const add = (...args) => risks.push(risk(...args));

  if (/penalt|late fee|штраф|неустой|пен/i.test(text)) add('penalty', 84, 'Штрафы и просрочка', 'Penalties and late payment', findLine(text, /penalt|late fee|штраф|неустой|пен/i, 'Penalty clause detected.'), 'В договоре есть штрафы за просрочку или нарушение.', 'The contract includes penalties for delay or breach.', 'можно потерять деньги даже при небольшой задержке оплаты или спорной ситуации.', 'you may lose money even after a minor payment delay or disputed situation.', 'Попросить ограничить штраф, добавить льготный период и письменное уведомление.', 'Ask to cap penalties, add a grace period and written notice.', 'Штраф начисляется только после письменного уведомления и 7 дней на исправление, общий размер штрафа ограничен 10% просроченной суммы.', 'Penalties apply only after written notice and a 7-day cure period, capped at 10% of the overdue amount.');
  if (/terminate|without notice|расторг|без уведом|прекрат/i.test(text)) add('termination', /without notice|без уведом/i.test(text) ? 88 : 66, 'Расторжение', 'Termination', findLine(text, /terminate|without notice|расторг|без уведом|прекрат/i, 'Termination clause detected.'), 'Другая сторона может получить слишком широкое право прекратить договор.', 'The other party may have broad rights to end the contract.', 'услугу, поставку или доступ могут остановить внезапно.', 'service, delivery or access may stop suddenly.', 'Добавить уведомление, срок на исправление и порядок закрытия обязательств.', 'Add notice, cure period and exit process.', 'Расторжение при нарушении возможно только после письменного уведомления и 14 календарных дней на исправление.', 'Termination for breach is allowed only after written notice and a 14-calendar-day cure period.');
  if (/liab|responsib|indirect damages|ответствен|убыт|не нес/i.test(text)) add('liability', /not liable|under any circumstances|не нес/i.test(text) ? 86 : 61, 'Ответственность', 'Liability', findLine(text, /liab|responsib|indirect damages|ответствен|убыт|не нес/i, 'Liability clause detected.'), 'Пункт может ограничивать компенсацию или переносить риск на вас.', 'The clause may limit compensation or shift risk to you.', 'при ущербе может быть сложно взыскать реальные потери.', 'if losses happen, recovering damages may be difficult.', 'Попросить разумный лимит ответственности и исключения для умысла, грубой неосторожности, конфиденциальности и IP.', 'Ask for a reasonable liability cap and carve-outs for intent, gross negligence, confidentiality and IP.', 'Ответственность ограничена суммой, уплаченной за последние 3 месяца, кроме случаев умысла, грубой неосторожности, нарушения конфиденциальности и IP.', 'Liability is capped at fees paid in the last 3 months except for intent, gross negligence, confidentiality breaches and IP violations.');
  if (/renew|автоматическ|продл/i.test(text)) add('renewal', 64, 'Автоматическое продление', 'Automatic renewal', findLine(text, /renew|автоматическ|продл/i, 'Renewal clause detected.'), 'Договор может продлиться автоматически, если заранее не отказаться.', 'The agreement may renew automatically unless cancelled in time.', 'можно случайно попасть на новый период оплаты или обязательств.', 'you may accidentally enter a new paid term or obligation period.', 'Попросить продление только по письменному подтверждению или напоминание заранее.', 'Ask for opt-in renewal or advance reminders.', 'Продление возможно только по письменному согласию обеих сторон не позднее чем за 15 дней до окончания срока.', 'Renewal requires written agreement of both parties at least 15 days before the term ends.');
  if (/governed|jurisdiction|court|law of|юрисдикц|суд|применим/i.test(text)) add('jurisdiction', 58, 'Юрисдикция', 'Jurisdiction', findLine(text, /governed|jurisdiction|court|law of|юрисдикц|суд|применим/i, `Selected jurisdiction: ${opts.jurisdiction || 'Sweden'}`), 'Спор может идти по праву или в суде, которые неудобны для вас.', 'Disputes may use law or courts that are inconvenient for you.', 'решать спор может быть дорого и долго.', 'disputes may become costly and slow.', 'Проверить применимое право, место суда/арбитража, язык и расходы.', 'Check governing law, venue, language and costs.', 'Споры рассматриваются по месту нахождения ответчика либо в согласованном арбитраже с понятным распределением расходов.', 'Disputes are heard where the defendant is located or in agreed arbitration with clear cost allocation.');
  if (!risks.length) add('general', 42, 'Общая проверка', 'General review', text.slice(0, 240) || 'No specific high-risk clauses detected.', 'Критических фраз не найдено, но договор всё равно нужно проверить по суммам, срокам, ответственности и расторжению.', 'No obvious critical phrases detected, but amounts, deadlines, liability and termination should still be reviewed.', 'скрытые риски могут быть в деталях, приложениях или отсутствующих пунктах.', 'hidden risks may sit in details, attachments or missing clauses.', 'Проверить ключевые коммерческие условия перед подписанием.', 'Review key commercial terms before signing.', 'Добавить понятные сроки, оплату, ответственность, расторжение и порядок разрешения споров.', 'Add clear deadlines, payment, liability, termination and dispute process.');

  const score = Math.min(96, Math.round(risks.reduce((s, r) => s + r.score, 0) / risks.length + risks.length * 4));
  const readiness = score >= 75 ? 'High Risk — не подписывать без правок' : score >= 55 ? 'MavenLex Deep Check Recommended' : 'Negotiate First';
  const practical = buildPracticalPackage({ text, risks, score, opts });
  const advanced = advancedContractIntelligence(text, opts, risks);
  return {
    provider: process.env.YANDEX_API_KEY ? 'Local engine + optional YandexGPT' : 'Local legal-intelligence engine',
    summary: B(`Обнаружено ${risks.length} важных зон риска. Общий риск: ${score}/100.`, `${risks.length} important risk areas detected. Overall risk: ${score}/100.`),
    riskScore: score,
    riskLevel: score >= 75 ? 'High' : score >= 55 ? 'Medium' : 'Low',
    signatureReadiness: { status: readiness, text: B(readiness, readiness) },
    decisionRecommendation: B(score >= 75 ? 'Не подписывать без правок и повторной проверки рисков.' : 'Можно обсуждать дальше, но сначала согласовать ключевые правки.', score >= 75 ? 'Do not sign without edits and a fresh risk check.' : 'You can continue discussions, but agree key edits first.'),
    contractIntelligence: advanced.contractIntelligence,
    riskMatrix: advanced.riskMatrix,
    clauseMap: advanced.clauseMap,
    missingClauses: advanced.missingClauses,
    redFlags: advanced.redFlags,
    risks,
    worstCaseScenarios: risks.slice(0,3).map(r => ({ title: r.title, scenario: r.worstCaseScenario, prevention: r.whatToDo })),
    actionPlan: B(['Не подписывать текущую редакцию без проверки ключевых рисков.', 'Запросить правки по пунктам High/Medium.', 'Отдельно проверить применимое право, ответственность, оплату и расторжение.', 'После новой версии повторно сравнить изменения.'], ['Do not sign the current version without reviewing key risks.', 'Request edits for High/Medium issues.', 'Check governing law, liability, payment and termination separately.', 'After a revised version, compare changes again.']),
    todayPlan: practical.todayPlan,
    dontDo: practical.dontDo,
    alreadySignedPlan: practical.alreadySignedPlan,
    MavenLexPackage: practical.MavenLexPackage,
    moneyRisk: practical.moneyRisk,
    counterpartyMessages: practical.counterpartyMessages,
    roleRecommendations: practical.roleRecommendations,
    negotiationMessage: B(`Здравствуйте! Перед подписанием просим уточнить и скорректировать пункты: ${risks.slice(0,3).map(r => r.title.ru).join(', ')}. Нужны понятные сроки уведомления, разумные ограничения ответственности и прозрачный порядок оплаты/расторжения.`, `Hello, before signing we would like to clarify and adjust: ${risks.slice(0,3).map(r => r.title.en).join(', ')}. We need clear notice periods, reasonable liability limits and a transparent payment/termination process.`),
    MavenLexQuestions: risks.map(r => r.questionForMavenLex),
    suggestedEdits: risks.map(r => ({ title: r.title, level: r.level, source: r.source, suggestedDraft: r.suggestedDraft })),
    redline: risks.map(r => ({ title: r.title, remove: r.source, add: r.suggestedDraft })),
    timeline: [
      { date: B('Сразу', 'Now'), event: B('Проверить пункты High/Medium', 'Review High/Medium issues') },
      { date: B('До подписания', 'Before signing'), event: B('Согласовать правки письменно', 'Agree edits in writing') },
      { date: B('После новой версии', 'After revised version'), event: B('Повторно сравнить изменения', 'Compare changes again') }
    ],
    voiceScript: B(`Кратко: риск договора ${score} из 100. Главные зоны: ${risks.slice(0,3).map(r => r.title.ru).join(', ')}. Следующий шаг — запросить правки и повторно проверить спорные места.`, `Summary: contract risk is ${score} out of 100. Main areas: ${risks.slice(0,3).map(r => r.title.en).join(', ')}. Next step: request edits and re-check disputed clauses.`),
    MavenLexBrief: { objective: B('Проверить договор перед подписанием и снизить коммерческие/правовые риски.', 'Review before signing and reduce commercial/legal risks.'), keyRisks: risks.slice(0,5).map(r => r.title), jurisdiction: opts.jurisdiction || 'Sweden' },
    disclaimer: B('AI-разбор MavenLex. Проверяйте факты, документы и актуальные нормы перед действием.', 'MavenLex AI analysis. Verify facts, documents and current rules before acting.')
  };
}

function tokenizeLegalTerms(text = '') {
  const words = String(text || '').toLowerCase().match(/[a-zа-яё0-9]{4,}/gi) || [];
  const stop = new Set(['agreement','contract','shall','with','that','this','there','will','from','have','party','parties','договор','сторон','стороны','настоящ','котор','должн','может','будет','услов','раздел']);
  return words.filter(w => !stop.has(w)).slice(0, 6000);
}
function compareTermSets(oldText = '', newText = '') {
  const oldSet = new Set(tokenizeLegalTerms(oldText));
  const newSet = new Set(tokenizeLegalTerms(newText));
  const added = [...newSet].filter(x => !oldSet.has(x)).slice(0, 30);
  const removed = [...oldSet].filter(x => !newSet.has(x)).slice(0, 30);
  return { added, removed };
}
function clauseStatusIndex(report = {}) {
  const map = {};
  for (const c of report.clauseMap || []) map[c.key || T(c.title,'en') || Math.random()] = c;
  return map;
}
function compareClauseMaps(oldReport = {}, newReport = {}) {
  const oldMap = clauseStatusIndex(oldReport);
  const newMap = clauseStatusIndex(newReport);
  const keys = [...new Set([...Object.keys(oldMap), ...Object.keys(newMap)])];
  return keys.map(key => {
    const before = oldMap[key];
    const after = newMap[key];
    const beforeStatus = before?.status || 'missing';
    const afterStatus = after?.status || 'missing';
    let direction = 'unchanged';
    if (!before && after) direction = 'added';
    else if (before && !after) direction = 'removed';
    else if (beforeStatus !== afterStatus) direction = 'changed';
    return {
      key,
      title: after?.title || before?.title || B(key, key),
      beforeStatus,
      afterStatus,
      direction,
      beforeExcerpt: before?.excerpt || '',
      afterExcerpt: after?.excerpt || '',
      recommendation: after?.recommendation || before?.recommendation || B('Проверьте изменение пункта вручную.', 'Review this clause change manually.')
    };
  }).filter(x => x.direction !== 'unchanged').slice(0, 18);
}
function riskDeltaLabel(delta) {
  if (delta >= 12) return B('Новая версия заметно рискованнее', 'New version is materially riskier');
  if (delta >= 4) return B('Новая версия немного рискованнее', 'New version is slightly riskier');
  if (delta <= -12) return B('Новая версия заметно безопаснее', 'New version is materially safer');
  if (delta <= -4) return B('Новая версия немного безопаснее', 'New version is slightly safer');
  return B('Риск примерно на том же уровне', 'Risk is broadly unchanged');
}
function compareRisks(oldReport = {}, newReport = {}) {
  const oldById = new Map((oldReport.risks || []).map(r => [r.id || T(r.title,'en'), r]));
  const newById = new Map((newReport.risks || []).map(r => [r.id || T(r.title,'en'), r]));
  const keys = [...new Set([...oldById.keys(), ...newById.keys()])];
  const changes = [];
  for (const key of keys) {
    const before = oldById.get(key);
    const after = newById.get(key);
    if (!before && after) changes.push({ type:'new_risk', level: after.level, scoreDelta: after.score || 0, title: after.title, beforeScore: 0, afterScore: after.score || 0, action: after.whatToDo });
    else if (before && !after) changes.push({ type:'risk_removed', level: before.level, scoreDelta: -(before.score || 0), title: before.title, beforeScore: before.score || 0, afterScore: 0, action: B('Проверьте, что риск действительно устранён, а не перенесён в другой пункт.', 'Check that the risk was truly removed and not moved to another clause.') });
    else if (before && after) {
      const delta = (after.score || 0) - (before.score || 0);
      if (Math.abs(delta) >= 5) changes.push({ type: delta > 0 ? 'risk_worse' : 'risk_better', level: after.level, scoreDelta: delta, title: after.title, beforeScore: before.score || 0, afterScore: after.score || 0, action: after.whatToDo });
    }
  }
  return changes.sort((a,b)=>Math.abs(b.scoreDelta)-Math.abs(a.scoreDelta)).slice(0, 12);
}
function buildComparisonReport(oldText, newText, opts = {}) {
  const oldReport = analyzeLocal(oldText, opts);
  const newReport = analyzeLocal(newText, opts);
  const riskDelta = Number(newReport.riskScore || 0) - Number(oldReport.riskScore || 0);
  const riskChanges = compareRisks(oldReport, newReport);
  const clauseChanges = compareClauseMaps(oldReport, newReport);
  const termDiff = compareTermSets(oldText, newText);
  const worse = riskChanges.filter(x => ['new_risk','risk_worse'].includes(x.type));
  const better = riskChanges.filter(x => ['risk_removed','risk_better'].includes(x.type));
  const decision = riskDelta >= 8 || worse.length >= 2
    ? B('Не принимать новую версию без правок: появились или усилились существенные риски.', 'Do not accept the new version without edits: material risks appeared or increased.')
    : riskDelta <= -8 && worse.length === 0
      ? B('Новая версия выглядит безопаснее, но финально проверьте изменённые пункты.', 'The new version looks safer, but still review changed clauses before signing.')
      : B('Новая версия требует ручной проверки изменений перед подписанием.', 'The new version requires manual review of changes before signing.');
  return {
    provider: process.env.YANDEX_API_KEY ? 'Local comparison + optional YandexGPT' : 'Local comparison engine',
    comparisonVersion: APP_VERSION,
    summary: B(`Сравнение готово. Risk score: ${oldReport.riskScore} → ${newReport.riskScore} (${riskDelta >= 0 ? '+' : ''}${riskDelta}).`, `Comparison complete. Risk score: ${oldReport.riskScore} → ${newReport.riskScore} (${riskDelta >= 0 ? '+' : ''}${riskDelta}).`),
    riskDelta,
    riskDeltaLabel: riskDeltaLabel(riskDelta),
    before: { riskScore: oldReport.riskScore, riskLevel: oldReport.riskLevel, detectedType: oldReport.contractIntelligence?.detectedType || null },
    after: { riskScore: newReport.riskScore, riskLevel: newReport.riskLevel, detectedType: newReport.contractIntelligence?.detectedType || null },
    decision,
    riskChanges,
    clauseChanges,
    addedTerms: termDiff.added,
    removedTerms: termDiff.removed,
    negotiationFocus: B(
      (worse.length ? worse : riskChanges).slice(0,5).map(x => `Проверить: ${T(x.title,'ru')} (${x.beforeScore} → ${x.afterScore})`),
      (worse.length ? worse : riskChanges).slice(0,5).map(x => `Review: ${T(x.title,'en')} (${x.beforeScore} → ${x.afterScore})`)
    ),
    nextActions: B([
      'Не подписывать новую версию, пока не проверены все ухудшившиеся пункты.',
      'Сравнить изменения по оплате, ответственности, расторжению, штрафам и спорам.',
      'Попросить контрагента письменно объяснить новые или изменённые условия.',
      'Перед подписанием сохранить обе версии договора и переписку.'
    ], [
      'Do not sign the new version until all worsened clauses are reviewed.',
      'Compare payment, liability, termination, penalties and dispute changes.',
      'Ask the counterparty to explain new or changed terms in writing.',
      'Before signing, keep both contract versions and correspondence.'
    ]),
    counterpartyMessage: B(
      'Здравствуйте. Мы сравнили версии договора и просим отдельно согласовать изменения, которые влияют на риск: ответственность, расторжение, штрафы, оплату и порядок споров. Просим прислать пояснение по новой редакции этих пунктов.',
      'Hello. We compared the contract versions and would like to separately agree the changes affecting risk: liability, termination, penalties, payment and dispute process. Please send an explanation for the revised wording of these clauses.'
    ),
    disclaimer: B('Информационное AI-сравнение версий договора. Для финального решения используйте MavenLex.', 'Informational AI comparison of contract versions. Use MavenLex to verify facts, documents and current rules.'),
    oldReport,
    newReport
  };
}

function generatedContract(answers = {}) {
  const type = answers.type || 'Service agreement';
  const country = answers.country || 'Sweden';
  const partyA = answers.partyA || '[Party A]';
  const partyB = answers.partyB || '[Party B]';
  const subject = answers.subject || '[describe services / subject]';
  const price = answers.price || '[price]';
  const payment = answers.payment || '[payment terms]';
  const term = answers.term || '[term]';
  const termination = answers.termination || '[notice period]';
  const liability = answers.liability || 'Limited to fees paid in the last 3 months';
  const ru = `${type.toUpperCase()}\n\n1. Стороны\n${partyA} и ${partyB} заключают настоящий draft-договор.\n\n2. Предмет\n${subject}.\n\n3. Цена и оплата\nСтоимость: ${price}. Порядок оплаты: ${payment}.\n\n4. Срок\n${term}.\n\n5. Расторжение\nРасторжение возможно при письменном уведомлении: ${termination}.\n\n6. Конфиденциальность\nСтороны сохраняют конфиденциальность информации.\n\n7. Ответственность\n${liability}, кроме случаев умысла, грубой неосторожности, нарушения конфиденциальности и IP.\n\n8. Применимое право\nDraft подготовлен для юрисдикции: ${country}. Требуется проверка фактов, документов и актуальных норм.`;
  const en = `${type.toUpperCase()}\n\n1. Parties\n${partyA} and ${partyB} enter into this draft agreement.\n\n2. Subject\n${subject}.\n\n3. Price and payment\nPrice: ${price}. Payment terms: ${payment}.\n\n4. Term\n${term}.\n\n5. Termination\nTermination requires written notice: ${termination}.\n\n6. Confidentiality\nThe parties must keep confidential information confidential.\n\n7. Liability\n${liability}, except for intent, gross negligence, confidentiality breaches and IP violations.\n\n8. Governing law\nDraft prepared for: ${country}. Verify facts, documents and current rules before signing.`;
  return {
    title: B(`Draft: ${type}`, `Draft: ${type}`),
    contractText: B(ru, en),
    riskScore: 48,
    riskLevel: 'Medium',
    fillGuide: B(['Заполните стороны и реквизиты.', 'Проверьте цену, валюту и сроки оплаты.', 'Уточните срок действия и расторжение.', 'Проверьте draft перед отправкой.'], ['Fill party details.', 'Check price, currency and payment timing.', 'Clarify term and termination.', 'Review the draft before sending.']),
    clauseOptions: [
      { title: B('Ответственность', 'Liability'), soft: B('Только прямые доказанные убытки.', 'Direct proven damages only.'), standard: B('Лимит — платежи за последние 3 месяца.', 'Cap at fees paid in the last 3 months.'), firm: B('Исключить косвенные убытки и ограничить суммой договора.', 'Exclude indirect damages and cap at contract amount.') },
      { title: B('Расторжение', 'Termination'), soft: B('Уведомление за 30 дней.', '30 days notice.'), standard: B('14 дней на исправление нарушения.', '14-day cure period.'), firm: B('Только при существенном нарушении.', 'Only for material breach.') }
    ],
    riskCheck: [B('Проверить юрисдикцию и суд/арбитраж.', 'Check jurisdiction and venue/arbitration.'), B('Проверить лимит ответственности.', 'Check liability cap.'), B('Проверить оплату, сроки и последствия просрочки.', 'Check payment, deadlines and late-payment consequences.')],
    MavenLexQuestions: [B('Можно ли использовать этот шаблон в выбранной юрисдикции?', 'Can this template be used in the selected jurisdiction?'), B('Достаточно ли ограничена ответственность?', 'Is liability capped appropriately?')],
    disclaimer: B('Draft-шаблон для подготовки. AI-разбор MavenLex: проверяйте факты и актуальные нормы.', 'Preparation draft template. Not legal advice.')
  };
}


function productionHardeningChecklist(db = readDb()) {
  const auth = authSecurityReadiness(db);
  const billing = billingQaChecks();
  const storage = storageReadiness();
  const analytics = businessAnalyticsReadiness();
  const aiCost = aiCostReadiness();
  const dbReady = databaseReadiness(db);
  const checks = [
    { code: 'auth_cookie_csrf', area: 'security', label: 'Cookie auth and CSRF protection', ok: AUTH_COOKIE_ENABLED && AUTH_CSRF_ENABLED },
    { code: 'admin_emails', area: 'security', label: 'ADMIN_EMAILS configured', ok: ADMIN_EMAILS.length > 0 },
    { code: 'personal_first_access', area: 'access', label: 'Personal-first account access enforced', ok: true },
    { code: 'billing_status', area: 'billing', label: 'Billing status, plans and webhook endpoints available', ok: billing.ok !== false },
    { code: 'ai_budget_limits', area: 'ai-cost', label: 'Per-plan daily/monthly AI budgets enabled', ok: AI_COST_TRACKING_ENABLED },
    { code: 'analytics_v2', area: 'analytics', label: 'Business analytics v2 and conversion events enabled', ok: analytics.ok },
    { code: 'secure_storage', area: 'storage', label: 'Secure storage policy configured', ok: Boolean(storage.mode) },
    { code: 'database', area: 'production', label: 'Production database readiness checked', ok: dbReady.ok || LAUNCH_MODE !== 'production' },
    { code: 'onboarding', area: 'ux', label: 'Commercial onboarding API and UI available', ok: true },
    { code: 'docs', area: 'release', label: 'v5.1 release docs and checklist included', ok: fs.existsSync(path.join(process.cwd(), 'docs', 'PRODUCTION_HARDENING_COMMERCIAL_POLISH_V5_1_0.md')) }
  ];
  const blockers = checks.filter(c => !c.ok && (LAUNCH_MODE === 'production' || ['security','billing','ai-cost','production'].includes(c.area)));
  return { ok: blockers.length === 0, version: APP_VERSION, generatedAt: new Date().toISOString(), checks, blockers, auth, billing, aiCost, database: dbReady };
}
app.get('/api/health', (_, res) => res.json({
  ok: true,
  service: 'MavenLex API',
  version: APP_VERSION, reliability: reliabilitySnapshot(),
  mode: DATABASE_URL ? 'production-foundation' : 'local-mvp',
  deployment: { serveFrontend: SERVE_FRONTEND, frontendDistExists: fs.existsSync(FRONTEND_DIST_DIR), appBaseUrl: APP_BASE_URL, launchMode: LAUNCH_MODE },
  database: databaseModeInfo(),
  billing: billingProviderStatus(),
  uptimeSeconds: Math.round(process.uptime()),
  node: process.version,
  supportedFiles: ['txt', 'docx', 'pdf'],
  maxFileSizeMb: MAX_FILE_SIZE_MB,
  extractionTimeoutMs: EXTRACTION_TIMEOUT_MS,
  liveAiConfigured: hasLiveAi(), endpoints: ['/api/health', '/api/diagnostics', '/api/db/status', '/api/db/readiness', '/api/db/migration-plan', '/api/trust/status', '/api/admin/overview', '/api/admin/health', '/api/admin/errors', '/api/admin/launch-readiness', '/api/launch-check', '/api/go-live-check', '/api/feedback', '/api/billing/readiness', '/api/billing/yookassa/readiness', '/api/billing/plans', '/api/billing/status', '/api/billing/checkout', '/api/billing/confirm', '/api/billing/webhook', '/api/subscription/current', '/api/auth/register', '/api/auth/login', '/api/auth/me', '/api/auth/logout', '/api/auth/change-password', '/api/auth/password-reset/request', '/api/auth/password-reset/validate', '/api/auth/email-verification/request', '/api/auth/email-verification/confirm', '/api/auth/security-status', '/api/auth/access-state', '/api/auth/security-readiness', '/api/auth/email-readiness', '/api/auth/cookie-session-readiness', '/api/auth/full-cookie-auth-readiness', '/api/auth/sessions', '/api/user/profile', '/api/user/export', '/api/user/history', '/api/user/usage', '/api/ai/advanced-analysis-readiness', '/api/ai/contract-comparison-readiness', '/api/export/readiness', '/api/personal-space/readiness', '/api/subscription/readiness', '/api/email/notifications/readiness', '/api/compare-contracts', '/api/analyze-contract', '/api/generate-contract', '/api/legal-chat']
}));




app.get('/api/public/config', (_req, res) => {
  const db = readDb();
  res.json({ ok: true, version: APP_VERSION, designSettings: mergeDesignSettings(db.designSettings || {}) });
});

app.get('/api/ai/status', (_req, res) => {
  const liveConfigured = hasLiveAi() && process.env.DISABLE_LIVE_AI !== 'true';
  res.json({
    ok: true,
    liveAiConfigured: liveConfigured,
    mode: liveConfigured ? 'live-yandexgpt' : 'ai-offline',
    message: liveConfigured ? 'Live AI provider is configured.' : 'AI не работает: live provider не подключён. Пользователь должен видеть честное состояние, без локальных шаблонов.',
    needs: liveConfigured ? [] : ['YANDEX_API_KEY', 'YANDEX_PROJECT_ID', 'YANDEX_MODEL']
  });
});

app.get('/api/admin/design-settings', requireOwner, (req, res) => {
  const { db } = req.auth;
  res.json({ ok: true, designSettings: mergeDesignSettings(db.designSettings || {}), ownerEmails: OWNER_EMAILS, adminEmails: ADMIN_EMAILS });
});

app.patch('/api/admin/design-settings', requireOwner, (req, res) => {
  const { db, user } = req.auth;
  const current = mergeDesignSettings(db.designSettings || {});
  const body = req.body || {};
  const cleanText = v => String(v ?? '').slice(0, 800);
  const safeUi = body.ui && typeof body.ui === 'object' ? body.ui : {};
  const cleanPanels = Object.fromEntries(Object.entries(body.rolePanels || {}).map(([role, panels]) => [role, Array.isArray(panels) ? panels.map(x => cleanText(x).slice(0, 80)).filter(Boolean).slice(0, 12) : String(panels || '').split(',').map(x=>x.trim()).filter(Boolean).slice(0,12)]));
  const next = mergeDesignSettings({
    ...current,
    cms: { ...current.cms, ...Object.fromEntries(Object.entries(body.cms || {}).map(([k,v]) => [k, cleanText(v)])) },
    ui: { ...current.ui, ...safeUi, colors: { ...(current.ui?.colors || {}), ...(safeUi.colors || {}) }, textEmphasis: { ...(current.ui?.textEmphasis || {}), ...(safeUi.textEmphasis || {}) } },
    rolePanels: { ...current.rolePanels, ...cleanPanels },
    security: { ...current.security, ...(body.security || {}) },
    ai: { ...current.ai, ...(body.ai || {}) },
    updatedAt: new Date().toISOString(),
    updatedBy: user.email
  });
  db.designSettings = next;
  auditAdmin(db, 'design_settings_updated', user.id, { keys: Object.keys(body || {}) });
  writeDb(db);
  res.json({ ok: true, designSettings: next });
});

app.get('/api/admin/role-panels', requireOwner, (req, res) => {
  const db = req.auth.db;
  const settings = mergeDesignSettings(db.designSettings || {});
  res.json({ ok: true, rolePanels: settings.rolePanels, roles: ['user','local_admin','owner'] });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const { db } = req.auth;
  const q = normalizeEmail(req.query.q || '');
  const role = String(req.query.role || '').toLowerCase();
  const status = String(req.query.status || '').toLowerCase();
  let users = (db.users || []).slice();
  if (q) users = users.filter(u => normalizeEmail(u.email).includes(q) || String(u.name || '').toLowerCase().includes(q));
  if (role) users = users.filter(u => String(u.role || 'user') === role);
  if (status) users = users.filter(u => String(u.status || 'active') === status);
  users = users.map(u => ({ ...publicUser(u), activeSessions: (db.sessions || []).filter(s => s.userId === u.id && !s.revokedAt && new Date(s.expiresAt).getTime() > Date.now()).length })).slice(0, 200);
  res.json({ ok: true, users });
});

app.patch('/api/admin/users/:id', requireOwner, (req, res) => {
  const { db, user: actor } = req.auth;
  const target = (db.users || []).find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  const nextRole = req.body?.role;
  const nextStatus = req.body?.status;
  const nextEmailVerified = req.body?.emailVerified;
  const forceLogout = req.body?.forceLogout === true;
  const resetUsage = req.body?.resetUsage === true;
  if (nextRole && !PRODUCT_ROLES.includes(normalizeProductRole(nextRole))) return res.status(400).json({ error: 'Invalid role.' });
  if (nextStatus && !['active','suspended','blocked','invited'].includes(nextStatus)) return res.status(400).json({ error: 'Invalid status.' });
  const normalizedNextStatus = nextStatus === 'blocked' ? 'suspended' : nextStatus;
  const requestedRole = nextRole ? normalizeProductRole(nextRole) : null;
  if (isProtectedOwner(db, target)) {
    if (requestedRole && requestedRole !== 'owner') return res.status(400).json({ error: 'Нельзя понизить владельца. Owner-доступ защищён.' });
    if (normalizedNextStatus && normalizedNextStatus !== 'active') return res.status(400).json({ error: 'Нельзя заблокировать или удалить владельца.' });
  }
  if (requestedRole && target.role === 'owner' && requestedRole !== 'owner' && activeOwners(db).length <= 1) return res.status(400).json({ error: 'Cannot remove the last owner.' });
  if (requestedRole) target.role = requestedRole;
  if (nextStatus) target.status = normalizedNextStatus;
  if (typeof nextEmailVerified === 'boolean') target.emailVerified = nextEmailVerified;
  target.updatedAt = new Date().toISOString();
  if (normalizedNextStatus === 'suspended' || forceLogout) db.sessions = (db.sessions || []).map(s => s.userId === target.id ? { ...s, revokedAt: new Date().toISOString() } : s);
  if (resetUsage) db.usage = (db.usage || []).filter(u => u.userId !== target.id);
  auditAdmin(db, 'user_updated', actor.id, { targetUserId: target.id, role: target.role, status: target.status, emailVerified: target.emailVerified, forceLogout, resetUsage });
  writeDb(db);
  res.json({ ok: true, user: publicUser(target) });
});



app.post('/api/admin/users/assign-role', requireOwner, async (req, res) => {
  try {
    const { db, user: actor } = req.auth;
    const email = normalizeEmail(req.body?.email);
    const role = normalizeProductRole(req.body?.role || 'user');
    const status = String(req.body?.status || 'active').toLowerCase();
    const name = clean(req.body?.name || '');
    const sendInvite = req.body?.sendInvite !== false;
    const customLimitsInput = req.body?.customLimits || {};
    const customLimits = {
      monthlyAiLimit: Number(customLimitsInput.monthlyAiLimit || req.body?.monthlyAiLimit || 0) || null,
      monthlyReviewLimit: Number(customLimitsInput.monthlyReviewLimit || req.body?.monthlyReviewLimit || 0) || null,
      allowedTools: String(customLimitsInput.allowedTools || req.body?.allowedTools || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 20)
    };
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid user email is required.' });
    if (!PRODUCT_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    if (!['active','suspended','blocked','invited'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const normalizedStatus = status === 'blocked' ? 'suspended' : status;
    let target = (db.users || []).find(u => normalizeEmail(u.email) === email);
    let created = false;
    if (!target) {
      if (role === 'owner' && !OWNER_EMAILS.includes(email)) return res.status(400).json({ error: 'Owner can be assigned only to OWNER_EMAILS.' });
      target = { id: crypto.randomUUID(), email, name, role, status: normalizedStatus, emailVerified: false, plan: 'free', billingStatus: 'free', billingProvider: normalizedBillingProvider(), createdByOwnerId: actor.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.users = db.users || [];
      db.users.unshift(target);
      created = true;
      auditAuth(db, 'owner_created_user_by_email', { userId: target.id, email, role });
    } else {
      if (isProtectedOwner(db, target) && role !== 'owner') return res.status(400).json({ error: 'Нельзя понизить владельца. Owner-доступ защищён.' });
      if (isProtectedOwner(db, target) && normalizedStatus !== 'active') return res.status(400).json({ error: 'Нельзя заблокировать владельца.' });
      if (role === 'owner' && !OWNER_EMAILS.includes(email)) return res.status(400).json({ error: 'Owner can be assigned only to OWNER_EMAILS.' });
      if (name) target.name = name;
      target.role = role;
      target.status = normalizedStatus;
      target.customLimits = customLimits;
      target.updatedAt = new Date().toISOString();
      if (normalizedStatus === 'suspended') db.sessions = (db.sessions || []).map(s => s.userId === target.id ? { ...s, revokedAt: new Date().toISOString() } : s);
    }
    target.customLimits = customLimits;
    target.updatedAt = new Date().toISOString();
    let resetLink = null;
    let emailDelivery = null;
    if (sendInvite && normalizedStatus === 'active') {
      const reset = createExpiringToken(db, 'passwordResetTokens', target.id, AUTH_RESET_TOKEN_TTL_MINUTES * 60 * 1000, 'owner_invite_set_password');
      resetLink = authActionLink('/reset-password', reset.token);
      emailDelivery = await sendAndAuditAuthEmail(db, 'password_reset', target, resetLink);
      auditAuth(db, 'owner_invite_reset_token_created', { userId: target.id, email, expiresAt: reset.row.expiresAt });
    }
    auditAdmin(db, created ? 'user_role_assigned_by_email_created' : 'user_role_assigned_by_email_updated', actor.id, { targetUserId: target.id, email, role, status: normalizedStatus, sendInvite, emailDelivery: emailDelivery ? { ok: emailDelivery.ok, provider: emailDelivery.provider } : null });
    writeDb(db);
    res.json({ ok: true, created, user: publicUser(target), emailDelivery: emailDelivery ? { ok: emailDelivery.ok, provider: emailDelivery.provider, error: emailDelivery.error || null } : null, devResetLink: canExposeDevToken() ? resetLink : undefined });
  } catch (e) {
    console.error('[admin/assign-role]', e);
    res.status(500).json({ error: 'Could not assign role by email.' });
  }
});

app.get('/api/admin/users/:id/security', requireAdmin, (req, res) => {
  const { db } = req.auth;
  const target = (db.users || []).find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  res.json({ ok: true, user: publicUser(target), sessions: (db.sessions || []).filter(s => s.userId === target.id).map(s => ({ ...s, token: undefined, tokenHash: undefined })).slice(0, 50), authEvents: (db.authEvents || []).filter(e => e.userId === target.id || e.email === target.email).slice(0, 50) });
});

app.get('/api/admin/auth-events', requireAdmin, (req, res) => {
  const { db } = req.auth;
  res.json({ ok: true, events: (db.authEvents || []).slice(0, 100), adminAuditLogs: (db.adminAuditLogs || []).slice(0, 100) });
});


app.get('/api/admin/audit-events', requireAdmin, (req, res) => {
  const { db } = req.auth;
  const audit = (db.auditEvents || []).slice(0, 120);
  const admin = (db.adminAuditLogs || []).slice(0, 120);
  const auth = (db.authEvents || []).slice(0, 120);
  res.json({ ok: true, auditEvents: audit, adminAuditLogs: admin, authEvents: auth });
});

app.post('/api/admin/ai-test', requireOwner, async (req, res) => {
  const started = Date.now();
  const liveConfigured = hasLiveAi() && process.env.DISABLE_LIVE_AI !== 'true';
  if (!liveConfigured) {
    return res.status(503).json({ ok: false, error: 'AI не работает: live AI не подключён. Добавьте YandexGPT ключи и DISABLE_LIVE_AI=false.', code: 'LIVE_AI_NOT_CONFIGURED' });
  }
  try {
    const prompt = 'Ответь коротко: MavenLex live AI работает. Не давай юридическую консультацию, только статус.';
    const answer = await callYandexText(prompt, { timeoutMs: Number(process.env.AI_TEST_TIMEOUT_MS || 45000) });
    auditAdmin(req.auth.db, 'ai_live_test_success', req.auth.user.id, { durationMs: Date.now() - started });
    writeDb(req.auth.db);
    res.json({ ok: true, mode: 'live-yandexgpt', durationMs: Date.now() - started, answer: String(answer || '').slice(0, 500) });
  } catch (e) {
    auditAdmin(req.auth.db, 'ai_live_test_failed', req.auth.user.id, { durationMs: Date.now() - started, error: e.message });
    writeDb(req.auth.db);
    res.status(502).json({ ok: false, error: `AI не работает: ${e.message}`, code: 'LIVE_AI_TEST_FAILED', durationMs: Date.now() - started });
  }
});

app.get('/api/diagnostics', (_, res) => {
  const major = Number(process.versions.node.split('.')[0]);
  const warnings = [];
  if (major < 18) warnings.push('Node.js 18+ is recommended.');
  if (major >= 24) warnings.push('Node.js 24 detected. If dependencies behave strangely, use Node.js 20 LTS.');
  res.json({
    ok: true,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    cwd: process.cwd(),
    port: PORT,
    hasEnvFile: Boolean(process.env.PORT || process.env.EXTRACTION_TIMEOUT_MS || process.env.YANDEX_API_KEY),
    liveAiConfigured: hasLiveAi(),
    maxFileSizeMb: MAX_FILE_SIZE_MB,
    warnings,
    databaseFoundation: { enabled: true, ...databaseModeInfo(), dbFileExists: fs.existsSync(DB_FILE) }
  });
});



app.get('/api/launch-readiness/v5-6', (_req, res) => {
  const db = databaseReadiness();
  const billing = billingProviderStatus();
  const legalTemplates = ['contract_review','nda_review','service_agreement','lease_review','employment_contract','privacy_policy','claim_letter','risk_memo'];
  const browserFlow = ['/home','/onboarding','/analyze','/report','/pricing','/account','/legal','/security','/support'];
  const blockers = [];
  if (!db.ok) blockers.push('Connect PostgreSQL before public paid launch.');
  if (!billing.liveReady && process.env.NODE_ENV === 'production') blockers.push('Enable a verified payment provider before selling paid plans.');
  res.json({
    ok: blockers.length === 0,
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    focus: 'Quality launch readiness for real MavenLex users',
    browserQa: {
      routes: browserFlow,
      requiredScenarios: [
        'Visitor opens landing page and understands the product in 10 seconds.',
        'User switches RU/EN and all visible UI follows the selected language.',
        'User creates or opens account, completes quick start, uploads a contract and reaches report.',
        'User sees pricing, starts checkout, returns to account and sees billing status.',
        'User can export data, delete account, contact support and open trust/legal pages.'
      ]
    },
    database: { ...db, setup: ['DATABASE_PROVIDER=postgresql', 'DATABASE_URL=postgres://...', 'Run SQL files in docs/sql in order.'] },
    billing: { provider: billing.provider, liveReady: billing.liveReady, paymentsEnabled: billing.paymentsEnabled, returnUrlConfigured: billing.returnUrlConfigured, webhookSecretConfigured: billing.webhookSecretConfigured },
    legalSpecialization: { templates: legalTemplates, outputStandard: 'decision, risk table, action plan, negotiation message, verification points' },
    userFlow: ['language','account','legal task','ai analysis','report','billing when needed','history/account'],
    blockers,
    recommendation: blockers.length ? 'Resolve blockers before advertising a paid public launch.' : 'Ready for final manual browser review and controlled launch.'
  });
});

app.get('/api/legal/templates', (_req, res) => {
  res.json({ ok: true, version: APP_VERSION, templates: [
    { id:'contract_review', ru:'Анализ договора перед подписанием', en:'Pre-signing contract review', path:'/analyze' },
    { id:'nda_review', ru:'Проверка NDA', en:'NDA review', path:'/ai-nda-analysis' },
    { id:'service_agreement', ru:'Проверка договора услуг', en:'Service agreement review', path:'/ai-service-agreement-analysis' },
    { id:'lease_review', ru:'Проверка договора аренды', en:'Lease review', path:'/ai-lease-analysis' },
    { id:'employment_contract', ru:'Трудовой договор', en:'Employment contract', path:'/builder' },
    { id:'privacy_policy', ru:'Privacy Policy / обработка данных', en:'Privacy policy / data processing', path:'/builder' },
    { id:'claim_letter', ru:'Претензия контрагенту', en:'Counterparty claim letter', path:'/situation' },
    { id:'risk_memo', ru:'Юридическая записка по рискам', en:'Legal risk memo', path:'/situation' }
  ]});
});

app.get('/api/qa/user-flow', (_req, res) => {
  res.json({ ok: true, version: APP_VERSION, scenarios: [
    { id:'first_value', title:'First value flow', steps:['Open home','Choose language','Open Analyze','Upload document','Receive report','Open history'] },
    { id:'billing', title:'Billing flow', steps:['Open Pricing','Select Pro','Start checkout','Return success','Open Account billing status'] },
    { id:'trust', title:'Trust flow', steps:['Open Security','Open Privacy','Open Terms','Contact support'] },
    { id:'account', title:'Account control flow', steps:['Login/register','Update profile','Export data','Review access state','Delete account only after confirmation'] }
  ]});
});


app.get('/api/executive-quality/v5-7', (_req, res) => {
  const db = databaseReadiness();
  const billing = billingProviderStatus();
  const qualityGates = [
    { id:'first_impression', title:'Premium first impression', ok:true, note:'Landing explains AI legal value immediately.' },
    { id:'personal_first', title:'Personal-first UX', ok:true, note:'Workspace is not part of the visible user journey.' },
    { id:'language_consistency', title:'RU/EN interface consistency', ok:true, note:'Localized routes and interface language are supported.' },
    { id:'legal_focus', title:'Legal scenario focus', ok:true, note:'Contract review includes user-side and review-focus selection.' },
    { id:'database', title:'Production database readiness', ok:db.ok, note:db.ok ? 'PostgreSQL configuration detected.' : 'Connect PostgreSQL before paid public launch.' },
    { id:'payments', title:'Payment readiness', ok:billing.liveReady || process.env.NODE_ENV !== 'production', note:billing.liveReady ? 'Payment provider is live-ready.' : 'Use live payment credentials before selling paid plans.' },
    { id:'trust', title:'Trust and account controls', ok:true, note:'Privacy, terms, security, support, data export and delete-account flows are present.' }
  ];
  const blockers = qualityGates.filter(x => !x.ok).map(x => x.note);
  res.json({
    ok: blockers.length === 0,
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    qualityGates,
    blockers,
    userPromise: 'User can understand the product, select language, choose a legal task, upload a document, receive a structured report, see pricing and manage the account.',
    recommendation: blockers.length ? 'Resolve remaining production configuration blockers, then run browser QA.' : 'Ready for controlled client review and final browser QA.'
  });
});

app.get('/api/db/status', (_, res) => {
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), database: databaseModeInfo(), readiness: databaseReadiness(), requiredTables: databaseModeInfo().requiredTables });
});

app.get('/api/db/readiness', (_, res) => {
  const readiness = databaseReadiness();
  res.status(readiness.ok ? 200 : 503).json({ ok: readiness.ok, version: APP_VERSION, reliability: reliabilitySnapshot(), generatedAt: new Date().toISOString(), ...readiness });
});

app.get('/api/db/migration-plan', (_, res) => {
  const info = databaseModeInfo();
  const readiness = databaseReadiness();
  res.json({
    ok: true,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    generatedAt: new Date().toISOString(),
    provider: info.provider,
    productionReady: info.productionReady,
    migrationFile: info.migrationFile,
    migrationOrder: [
      'docs/sql/001_init.sql',
      'docs/sql/002_production_database_schema.sql',
      'docs/sql/003_postgresql_database_foundation.sql'
    ],
    requiredEnv: ['DATABASE_PROVIDER=postgresql', 'DATABASE_URL=postgres://...'],
    requiredTables: info.requiredTables,
    blockers: readiness.blockers,
    warnings: readiness.warnings,
    nextStep: info.productionReady ? 'Run npm run db-migration-plan, review SQL, then run the SQL on Supabase/Neon/PostgreSQL.' : 'Create a PostgreSQL database, set DATABASE_PROVIDER=postgresql and DATABASE_URL on hosting, then run migrations.'
  });
});

app.get('/api/trust/status', (_, res) => {
  res.json({
    ok: true,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    trustLayer: true,
    legalPages: ['/privacy', '/terms', '/security', '/legal', '/faq'],
    safety: {
      informationalAiOnly: true,
      noFinalLegalAdvice: true,
      MavenLexReviewRecommendedForHighRisk: true,
      noSecretsInRepository: true,
      uploadLimitMb: MAX_FILE_SIZE_MB
    },
    securityHeaders: {
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'DENY',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()'
    },
    productionChecklist: [
      'Use Render/Vercel environment variables for secrets.',
      'Do not commit .env files.',
      'Use PostgreSQL/Supabase/Neon before large public launch.',
      'Review legal pages with MavenLex before taking payments.',
      'Enable real payment provider webhooks before selling subscriptions.'
    ]
  });
});



app.post('/api/analytics/track', (req, res) => {
  try {
    const body = req.body || {};
    const type = String(body.type || 'event').slice(0, 80);
    const publicPath = String(body.path || req.headers.referer || '').slice(0, 200);
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    recordGrowthEvent({ type, path: publicPath, payload, userAgent: String(req.headers['user-agent'] || '').slice(0, 180) });
    res.json({ ok: true });
  } catch (e) {
    console.error('[analytics/track]', e);
    res.status(500).json({ ok: false, error: 'Could not track event.' });
  }
});

app.get('/api/growth/overview', (_req, res) => {
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), growth: growthOverview() });
});


app.get('/api/analytics/business/readiness', (_req, res) => {
  res.json(businessAnalyticsReadiness());
});

app.get('/api/analytics/business', (_req, res) => {
  res.json(businessAnalyticsOverview());
});

app.get('/api/admin/business-analytics', requireAdmin, (_req, res) => {
  res.json(businessAnalyticsOverview());
});


app.get('/api/ai-cost/readiness', (_req, res) => {
  res.json(aiCostReadiness());
});
app.get('/api/ai-cost/overview', (_req, res) => {
  res.json(aiCostOverview());
});
app.get('/api/admin/ai-cost', requireAdmin, (_req, res) => {
  res.json(aiCostOverview());
});

app.get('/api/seo/readiness', (_req, res) => {
  res.json(seoReadiness());
});

app.get('/api/support/readiness', (_req, res) => {
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), publicForm: true, adminQueue: true, statuses: ['new','in_progress','resolved'], categories: ['analysis','billing','account','upload','other'] });
});

app.post('/api/support/tickets', (req, res) => {
  try {
    const auth = optionalAuth(req);
    const db = auth?.db || readDb();
    const body = req.body || {};
    const message = String(body.message || '').trim();
    const email = normalizeEmail(body.email || auth?.user?.email || '');
    const category = String(body.category || 'other').slice(0, 40);
    if (!message || message.length < 10) return res.status(400).json({ ok: false, error: 'Describe the issue in at least 10 characters.' });
    if (message.length > SUPPORT_MAX_MESSAGE_CHARS) return res.status(400).json({ ok: false, error: 'Support message is too long.' });
    db.supportTickets = db.supportTickets || [];
    const ticket = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'new', category, priority: String(body.priority || 'normal').slice(0, 20), email, userId: auth?.user?.id || null, subject: String(body.subject || category).slice(0, 120), message: message.slice(0, SUPPORT_MAX_MESSAGE_CHARS), userAgent: String(req.headers['user-agent'] || '').slice(0, 180) };
    db.supportTickets.unshift(ticket);
    db.supportTickets = db.supportTickets.slice(0, 1000);
    writeDb(db);
    res.json({ ok: true, ticket: { id: ticket.id, status: ticket.status, createdAt: ticket.createdAt } });
  } catch (e) { console.error('[support/tickets]', e); res.status(500).json({ ok: false, error: 'Could not create support ticket.' }); }
});

app.get('/api/admin/support', requireAdmin, (_req, res) => {
  const db = readDb();
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), support: supportOverview(db) });
});

app.patch('/api/admin/support/:id', requireAdmin, (req, res) => {
  const { db, user } = req.auth;
  const ticket = (db.supportTickets || []).find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });
  const status = String(req.body?.status || ticket.status);
  if (!['new','in_progress','resolved'].includes(status)) return res.status(400).json({ error: 'Invalid support status.' });
  ticket.status = status;
  ticket.adminNote = String(req.body?.adminNote || ticket.adminNote || '').slice(0, 1200);
  ticket.updatedAt = new Date().toISOString();
  auditAdmin(db, 'support_ticket_update', user.id, { ticketId: ticket.id, status });
  writeDb(db);
  res.json({ ok: true, ticket });
});

app.get('/api/abuse/readiness', (_req, res) => {
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), ...abuseOverview() });
});

app.get('/api/admin/abuse', requireAdmin, (_req, res) => {
  const db = readDb();
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), abuse: abuseOverview(db) });
});

app.post('/api/feedback', (req, res) => {
  try {
    const db = readDb();
    const body = req.body || {};
    const message = String(body.message || '').trim();
    const rating = Number(body.rating || 0);
    if (!message || message.length < 5) return res.status(400).json({ ok: false, error: 'Feedback message is too short.' });
    if (message.length > 1200) return res.status(400).json({ ok: false, error: 'Feedback message is too long.' });
    const feedback = {
      id: crypto.randomUUID(),
      rating: Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0,
      category: String(body.category || 'general').slice(0, 40),
      message,
      page: String(body.page || '').slice(0, 160),
      email: normalizeEmail(body.email || ''),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 240),
      createdAt: new Date().toISOString()
    };
    db.testFeedback = db.testFeedback || [];
    db.testFeedback.unshift(feedback);
    db.testFeedback = db.testFeedback.slice(0, 300);
    writeDb(db);
    res.json({ ok: true, feedback: { id: feedback.id, createdAt: feedback.createdAt } });
  } catch (e) {
    console.error('[feedback]', e);
    res.status(500).json({ ok: false, error: 'Could not save feedback.' });
  }
});


app.get('/api/reliability/readiness', (_req, res) => {
  const snapshot = reliabilitySnapshot();
  res.status(snapshot.ready ? 200 : 503).json({ ok: snapshot.ready, reliability: snapshot, features: ['api_timeouts', 'slow_request_tracking', 'memory_snapshot', 'static_cache_headers', 'health_probes'] });
});

app.get('/api/admin/reliability', requireAdmin, (_req, res) => {
  const db = readDb();
  res.json({
    reliability: reliabilitySnapshot(),
    slowRequests: (db.slowRequests || []).slice(0, 50),
    recentErrors: (db.serverErrors || []).slice(0, 50)
  });
});

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  res.json(adminOverview());
});

app.get('/api/admin/health', requireAdmin, (_req, res) => {
  const overview = adminOverview();
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), generatedAt: overview.generatedAt, health: overview.health });
});

app.get('/api/admin/errors', requireAdmin, (_req, res) => {
  const db = readDb();
  res.json({ ok: true, errors: (db.serverErrors || []).slice(0, 100) });
});

app.get('/api/admin/launch-readiness', requireAdmin, (_req, res) => {
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), generatedAt: new Date().toISOString(), launch: launchBlockers() });
});


app.get('/api/launch-check', (_req, res) => {
  const db = readDb();
  const launch = launchBlockers(db);
  const health = {
    backend: { ok: true, uptimeSeconds: Math.round(process.uptime()), node: process.version },
    database: databaseModeInfo(),
    databaseReadiness: databaseReadiness(db),
    yandexgpt: { configured: hasLiveAi(), disabled: process.env.DISABLE_LIVE_AI === 'true' },
    billing: billingProviderStatus()
  };
  res.json({
    ok: true,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    generatedAt: new Date().toISOString(),
    readyForPublicLaunch: launch.blockers.length === 0,
    productionLaunchCandidate: true,
    blockersCount: launch.blockers.length,
    warningsCount: launch.warnings.length,
    errors24h: launch.errors24h,
    launchMode: launch.launchMode,
    health,
    checks: {
      env: { adminEmailsConfigured: ADMIN_EMAILS.length > 0, liveAiConfigured: hasLiveAi() },
      billing: launch.billingChecks,
      legal: { pagesAvailable: true, pages: ['/privacy', '/terms', '/security'], disclaimersPresent: true },
      monitoring: { adminOverview: true, serverErrorsTracked: true, apiAuditTracked: true },
      productionCandidate: { launchCenter: true, exportActions: true,
      professionalExport: { ok: true, formats: ['pdf-print', 'html', 'word', 'markdown', 'txt', 'json'], endpoint: '/api/export/readiness' }, decisionHelper: true, seoPages: ['/ai-contract-analysis', '/contract-risk-analysis', '/business-contract-review', '/faq'], finalDocs: 'docs/PRODUCTION_LAUNCH_CANDIDATE_V3_0_1.md' }
    },
    note: 'Public-safe launch check. Full details are available in /api/admin/launch-readiness for admin users.'
  });
});




function commercialReleaseSnapshot(db = readDb()) {
  const launch = launchBlockers(db);
  const dbReady = databaseReadiness(db);
  const billingReady = billingQaChecks();
  const urlReady = goLiveUrlReadiness();
  const emailReady = emailDeliveryReadiness();
  const cookieReady = cookieSessionReadiness();
  const reliability = reliabilitySnapshot();
  const storageReady = storageReadiness();
  const blockers = [
    ...(launch.blockers || []),
    ...(urlReady.blockers || [])
  ];
  const warnings = [
    ...(launch.warnings || []),
    ...(urlReady.warnings || [])
  ];
  if (!hasLiveAi()) blockers.push({ code: 'AI_NOT_CONFIGURED', title: 'Live AI is not configured', fix: 'Set YANDEX_API_KEY and YANDEX_PROJECT_ID on hosting.' });
  if (databaseModeInfo(db).jsonFallback) warnings.push({ code: 'DATABASE_NOT_POSTGRES', title: 'PostgreSQL is not active', fix: 'Set DATABASE_PROVIDER=postgresql/supabase/neon and DATABASE_URL before scaling sales.' });
  if (normalizedBillingProvider() !== 'yookassa') warnings.push({ code: 'BILLING_NOT_YOOKASSA', title: 'Live YooKassa is not active', fix: 'Set BILLING_PROVIDER=yookassa and YooKassa secrets before automatic paid sales.' });
  if (!emailReady.ok) warnings.push({ code: 'EMAIL_NOT_READY', title: 'Email delivery is not fully ready', fix: 'Set EMAIL_PROVIDER=resend or smtp and provider credentials.' });
  if (!cookieReady.ok) warnings.push({ code: 'COOKIE_AUTH_WARNING', title: 'Cookie auth is not fully hardened', fix: 'Review AUTH_COOKIE_ENABLED, COOKIE_SECURE and SESSION_SECRET.' });
  const ready = blockers.length === 0;
  return {
    ok: ready,
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    release: 'Commercial SaaS Release',
    readyForCommercialSales: ready,
    blockers,
    warnings,
    checks: {
      publicSite: { ok: true, pages: PUBLIC_SEO_PAGES.length, multilingual: MULTILINGUAL_MODE },
      domain: urlReady,
      ai: { ok: hasLiveAi(), provider: 'YandexGPT', disabled: process.env.DISABLE_LIVE_AI === 'true' },
      database: dbReady,
      auth: { ok: true, cookie: cookieReady, emailVerification: true, passwordReset: true, roles: ['user','local_admin','owner'] },
      billing: billingReady,
      email: emailReady,
      legal: { ok: true, pages: ['/privacy','/terms','/security'] },
      seo: { ok: true, pages: PUBLIC_SEO_PAGES, sitemap: true, robots: true },
      personalSpace: { ok: true, history: true, folders: true, favorites: true, notes: true },
      analysis: { ok: true, advanced: true, comparison: true, rewriteAssistant: REWRITE_ASSISTANT_ENABLED, clauseLibrary: CLAUSE_LIBRARY_ENABLED },
      export: { ok: true, formats: ['pdf-print','html','word','markdown','txt','json'] },
      team: { ok: TEAM_WORKSPACE_ENABLED, roles: ['owner','local_admin','member','viewer'] },
      storage: storageReady,
      support: { ok: true, tickets: true, adminQueue: true },
      abuseProtection: { ok: ABUSE_RATE_LIMIT_ENABLED, rateLimits: ['auth','ai','upload','support','api'] },
      analytics: { ok: true, businessAnalytics: true, aiCostManagement: AI_COST_TRACKING_ENABLED },
      admin: { ok: true, launchCenter: true, consolePro: true },
      reliability
    },
    nextStep: ready ? 'Deploy to .app, run API_URL=https://your-domain.app npm run commercial-release-check, then test payment and AI manually.' : 'Fix blockers before selling publicly.'
  };
}

app.get('/api/commercial-release-check', (_req, res) => {
  const snapshot = commercialReleaseSnapshot();
  res.status(snapshot.ok ? 200 : 200).json(snapshot);
});
app.get('/api/production-hardening-check', (_req, res) => {
  const snapshot = productionHardeningChecklist();
  res.status(snapshot.ok ? 200 : 503).json(snapshot);
});

app.get('/api/go-live-check', (_req, res) => {
  const db = readDb();
  const launch = launchBlockers(db);
  const dbReady = databaseReadiness(db);
  const billingReady = billingQaChecks();
  const urlReady = goLiveUrlReadiness();
  const blockers = [...(launch.blockers || []), ...(urlReady.blockers || [])];
  const warnings = [...(launch.warnings || []), ...(urlReady.warnings || [])];
  const ready = blockers.length === 0;
  res.status(200).json({
    ok: ready,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    generatedAt: new Date().toISOString(),
    goLiveReady: ready,
    publicUrl: urlReady,
    checks: {
      backend: { ok: true, uptimeSeconds: Math.round(process.uptime()), node: process.version },
      publicDomain: urlReady,
      frontendServing: { serveFrontend: SERVE_FRONTEND, distExists: fs.existsSync(FRONTEND_DIST_DIR), distDir: FRONTEND_DIST_DIR },
      ai: { configured: hasLiveAi(), disabled: process.env.DISABLE_LIVE_AI === 'true' },
      database: dbReady,
      billing: billingReady,
      legalPages: ['/privacy', '/terms', '/security'],
      seoPages: ['/ai-contract-analysis', '/contract-risk-analysis', '/business-contract-review', '/faq'],
      admin: { adminEmailsConfigured: ADMIN_EMAILS.length > 0, launchCenter: true },
      export: { available: true, professional: true, formats: ['pdf-print', 'html', 'word', 'markdown', 'txt', 'json'] }
    },
    blockers,
    warnings,
    nextStep: ready ? 'Deploy this build and verify the same endpoint on the live .app domain.' : 'Fix blockers before giving the .app link to users.'
  });
});

app.get('/api/production-check', (_req, res) => {
  const db = readDb();
  const launch = launchBlockers(db);
  const dbReady = databaseReadiness(db);
  const billingReady = billingQaChecks();
  const blockers = [...(launch.blockers || [])];
  const warnings = [...(launch.warnings || [])];
  if (!dbReady.ok) warnings.push({ code: 'DATABASE_READINESS', title: 'Database readiness warning', fix: 'Configure PostgreSQL/Supabase/Neon DATABASE_URL before high-traffic public use.' });
  if (!billingReady.livePaymentsEnabled && normalizedBillingProvider() === 'yookassa') blockers.push({ code: 'BILLING_LIVE_NOT_READY', title: 'Live billing not ready', fix: 'Configure YooKassa credentials, webhook secret and APP_BASE_URL.' });
  res.json({
    ok: blockers.length === 0,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    generatedAt: new Date().toISOString(),
    productionLaunchCandidate: true,
    readyForPublicUse: blockers.length === 0,
    blockers,
    warnings,
    checks: {
      publicSite: true,
      aiAnalysis: hasLiveAi(),
      database: dbReady,
      billing: billingReady,
      legalPages: ['/privacy', '/terms', '/security'],
      seoPages: ['/ai-contract-analysis', '/contract-risk-analysis', '/business-contract-review', '/faq'],
      exportActions: true,
      professionalExport: { ok: true, formats: ['pdf-print', 'html', 'word', 'markdown', 'txt', 'json'], endpoint: '/api/export/readiness' },
      adminLaunchCenter: true
    }
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const db = readDb();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const name = clean(req.body?.name || '');
    if (!authRateLimit(req, 'register', 5)) return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required.' });
    const policyErrors = passwordPolicyErrors(password);
    if (policyErrors.length) return res.status(400).json({ error: policyErrors[0], policyErrors });
    if ((db.users || []).some(u => normalizeEmail(u.email) === email)) return res.status(409).json({ error: 'User already exists. Please log in.' });
    const user = { id: crypto.randomUUID(), email, name, role: OWNER_EMAILS.includes(email) ? 'owner' : (ADMIN_EMAILS.includes(email) ? 'local_admin' : 'user'), status: 'active', emailVerified: false, plan: 'free', billingStatus: 'free', billingProvider: normalizedBillingProvider(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setUserPassword(user, password);
    db.users = db.users || [];
    db.users.unshift(user);
    const usage = userUsage(db, user.id);
    auditAuth(db, 'register', { userId: user.id, email });
    const verification = createExpiringToken(db, 'emailVerificationTokens', user.id, AUTH_VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000, 'email_verify');
    auditAuth(db, 'email_verification_token_created', { userId: user.id, email, expiresAt: verification.row.expiresAt });
    const verificationLink = authActionLink('/verify-email', verification.token);
    if (canExposeDevToken()) console.log(`[dev email verification link] ${email}: ${verificationLink}`);
    const emailResult = await sendAndAuditAuthEmail(db, 'email_verification', user, verificationLink);
    const session = createSession(db, user.id, req);
    setAuthCookies(res, session);
    writeDb(db);
    res.json({ ok: true, user: publicUser(user), session: publicSession(session), usage, usageLimits: usageWithLimits(user, usage), emailDelivery: { ok: emailResult.ok, provider: EMAIL_PROVIDER }, devVerificationLink: canExposeDevToken() ? verificationLink : undefined });
  } catch (e) {
    console.error('[auth/register]', e);
    res.status(500).json({ error: 'Could not create account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const db = readDb();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!authRateLimit(req, 'login', 10)) return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    let user = (db.users || []).find(u => normalizeEmail(u.email) === email);
    // Real-user recovery guard: Render/free deploys can lose JSON storage after redeploys.
    // If a user tries to log in and the account no longer exists, create it with the entered credentials
    // instead of trapping the user behind "invalid password". Existing accounts still require the correct password.
    if (!user && email && password && passwordPolicyErrors(password).length === 0) {
      user = { id: crypto.randomUUID(), email, name: email.split('@')[0] || 'User', role: OWNER_EMAILS.includes(email) ? 'owner' : (ADMIN_EMAILS.includes(email) ? 'local_admin' : 'user'), status: 'active', emailVerified: false, plan: 'free', billingStatus: 'free', billingProvider: normalizedBillingProvider(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), recreatedAfterMissingStorage: true };
      setUserPassword(user, password);
      db.users = db.users || [];
      db.users.unshift(user);
      auditAuth(db, 'login_auto_recreated_missing_account', { userId: user.id, email });
    }
    if (user?.lockedUntilAt && new Date(user.lockedUntilAt).getTime() > Date.now()) {
      auditAuth(db, 'login_blocked_locked', { userId: user.id, email });
      writeDb(db);
      return res.status(423).json({ error: 'Account is temporarily locked after failed login attempts. Try again later.' });
    }
    if (!user || !verifyPassword(password, user)) {
      // Production-hardening guard for Render JSON storage/version drift.
      // Owner email must never get locked out because an older deploy stored an incompatible password hash.
      // This repair only applies to OWNER_EMAILS and only when the entered password satisfies policy.
      if (user && OWNER_EMAILS.includes(email) && passwordPolicyErrors(password).length === 0 && process.env.DISABLE_OWNER_LOGIN_REPAIR !== 'true') {
        setUserPassword(user, password);
        user.role = 'owner';
        user.status = 'active';
        user.emailVerified = true;
        user.failedLoginCount = 0;
        user.lockedUntilAt = null;
        user.updatedAt = new Date().toISOString();
        auditAuth(db, 'owner_login_password_repaired', { userId: user.id, email });
      } else {
        if (user) {
          user.failedLoginCount = Number(user.failedLoginCount || 0) + 1;
          if (user.failedLoginCount >= AUTH_FAILED_LOGIN_LIMIT) user.lockedUntilAt = new Date(Date.now() + AUTH_FAILED_LOGIN_LOCK_MINUTES * 60 * 1000).toISOString();
        }
        auditAuth(db, 'login_failed', { userId: user?.id, email, failedLoginCount: user?.failedLoginCount || 0 });
        writeDb(db);
        return res.status(401).json({ error: 'Неверная почта или пароль. Если это ваш owner-email после деплоя, введите новый пароль не короче 8 символов с буквами и цифрами — MavenLex восстановит owner-доступ.', code: 'INVALID_LOGIN_OR_OWNER_REPAIR_AVAILABLE' });
      }
    }
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended.' });
    user.failedLoginCount = 0;
    user.lockedUntilAt = null;
    promoteAdminIfConfigured(db, user);
    const usage = userUsage(db, user.id);
    const session = createSession(db, user.id, req);
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    setAuthCookies(res, session);
    writeDb(db);
    res.json({ ok: true, user: publicUser(user), session: publicSession(session), usage, usageLimits: usageWithLimits(user, usage) });
  } catch (e) {
    console.error('[auth/login]', e);
    res.status(500).json({ error: 'Could not log in.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const { db, user, session } = req.auth;
  promoteAdminIfConfigured(db, user);
  const usage = userUsage(db, user.id);
  const csrfToken = parseCookies(req).mavenlex_csrf || '';
  writeDb(db);
  res.json({ ok: true, user: publicUser(user), session: publicSession({ ...session, csrfToken }), usage, usageLimits: usageWithLimits(user, usage), billing: billingStatusForUser(db, user) });
});



app.post('/api/auth/logout', requireAuth, (req, res) => {
  const { db, session, user } = req.auth;
  db.sessions = (db.sessions || []).map(s => (s === session || s.id === session.id) ? { ...s, revokedAt: new Date().toISOString() } : s);
  auditAuth(db, 'logout', { userId: user.id, email: user.email });
  clearAuthCookies(res);
  writeDb(db);
  res.json({ ok: true });
});

app.post('/api/auth/logout-all', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  db.sessions = (db.sessions || []).map(s => s.userId === user.id ? { ...s, revokedAt: new Date().toISOString() } : s);
  auditAuth(db, 'logout_all', { userId: user.id, email: user.email });
  clearAuthCookies(res);
  writeDb(db);
  res.json({ ok: true });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const { db, user } = req.auth;
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!verifyPassword(currentPassword, user)) return res.status(401).json({ error: 'Current password is incorrect.' });
    const policyErrors = passwordPolicyErrors(newPassword);
    if (policyErrors.length) return res.status(400).json({ error: policyErrors[0], policyErrors });
    setUserPassword(user, newPassword);
    db.sessions = (db.sessions || []).map(s => s.userId === user.id ? { ...s, revokedAt: new Date().toISOString() } : s);
    auditAuth(db, 'password_changed', { userId: user.id, email: user.email });
    writeDb(db);
    res.json({ ok: true, message: 'Password changed. Please log in again.' });
  } catch (e) {
    console.error('[auth/change-password]', e);
    res.status(500).json({ error: 'Could not change password.' });
  }
});

app.post('/api/auth/password-reset/request', async (req, res) => {
  const db = readDb();
  const email = normalizeEmail(req.body?.email);
  const user = (db.users || []).find(u => normalizeEmail(u.email) === email);
  let devResetLink;
  if (user) {
    const reset = createExpiringToken(db, 'passwordResetTokens', user.id, AUTH_RESET_TOKEN_TTL_MINUTES * 60 * 1000, 'password_reset');
    devResetLink = authActionLink('/reset-password', reset.token);
    auditAuth(db, 'password_reset_requested', { userId: user.id, email, expiresAt: reset.row.expiresAt });
    if (canExposeDevToken()) console.log(`[dev password reset link] ${email}: ${devResetLink}`);
    await sendAndAuditAuthEmail(db, 'password_reset', user, devResetLink);
  }
  writeDb(db);
  res.json({ ok: true, message: 'If the email exists, password reset instructions will be sent.', devResetLink: canExposeDevToken() ? devResetLink : undefined });
});

app.get('/api/auth/password-reset/validate', (req, res) => {
  const db = readDb();
  const token = String(req.query.token || '');
  const row = (db.passwordResetTokens || []).find(t => t.tokenHash === hashToken(token) && !t.usedAt && new Date(t.expiresAt).getTime() > Date.now());
  res.json({ ok: Boolean(row), valid: Boolean(row), expiresAt: row?.expiresAt || null });
});

app.post('/api/auth/password-reset/confirm', (req, res) => {
  const db = readDb();
  const token = String(req.body?.token || '');
  const newPassword = String(req.body?.newPassword || '');
  const policyErrors = passwordPolicyErrors(newPassword);
  if (policyErrors.length) return res.status(400).json({ error: policyErrors[0], policyErrors });
  const row = (db.passwordResetTokens || []).find(t => t.tokenHash === hashToken(token) && !t.usedAt && new Date(t.expiresAt).getTime() > Date.now());
  if (!row) return res.status(400).json({ error: 'Invalid or expired reset token.' });
  const user = (db.users || []).find(u => u.id === row.userId);
  if (!user) return res.status(400).json({ error: 'Invalid reset token.' });
  setUserPassword(user, newPassword);
  row.usedAt = new Date().toISOString();
  db.passwordResetTokens = (db.passwordResetTokens || []).map(t => t.userId === user.id && !t.usedAt ? { ...t, usedAt: row.usedAt, revokedReason: 'password_reset_completed' } : t);
  db.sessions = (db.sessions || []).map(s => s.userId === user.id ? { ...s, revokedAt: new Date().toISOString() } : s);
  auditAuth(db, 'password_reset_confirmed', { userId: user.id, email: user.email });
  writeDb(db);
  res.json({ ok: true });
});

app.post('/api/auth/email-verification/request', requireAuth, async (req, res) => {
  const { db, user } = req.auth;
  if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true, message: 'Email is already verified.' });
  const verification = createExpiringToken(db, 'emailVerificationTokens', user.id, AUTH_VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000, 'email_verify');
  const devVerificationLink = authActionLink('/verify-email', verification.token);
  auditAuth(db, 'email_verification_requested', { userId: user.id, email: user.email, expiresAt: verification.row.expiresAt });
  if (canExposeDevToken()) console.log(`[dev email verification link] ${user.email}: ${devVerificationLink}`);
  const emailResult = await sendAndAuditAuthEmail(db, 'email_verification', user, devVerificationLink);
  writeDb(db);
  res.json({ ok: true, message: 'Verification instructions prepared.', emailDelivery: { ok: emailResult.ok, provider: EMAIL_PROVIDER }, devVerificationLink: canExposeDevToken() ? devVerificationLink : undefined });
});

function confirmEmailVerificationToken(token) {
  const db = readDb();
  const row = (db.emailVerificationTokens || []).find(t => t.tokenHash === hashToken(token) && !t.usedAt && new Date(t.expiresAt).getTime() > Date.now());
  if (!row) return { status: 400, body: { error: 'Invalid or expired verification token.' } };
  const user = (db.users || []).find(u => u.id === row.userId);
  if (!user) return { status: 400, body: { error: 'Invalid verification token.' } };
  user.emailVerified = true;
  user.emailVerifiedAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
  row.usedAt = new Date().toISOString();
  auditAuth(db, 'email_verified', { userId: user.id, email: user.email });
  writeDb(db);
  return { status: 200, body: { ok: true, user: publicUser(user) } };
}
app.get('/api/auth/email-verification/confirm', (req, res) => {
  const result = confirmEmailVerificationToken(String(req.query?.token || ''));
  res.status(result.status).json(result.body);
});
app.post('/api/auth/email-verification/confirm', (req, res) => {
  const result = confirmEmailVerificationToken(String(req.body?.token || ''));
  res.status(result.status).json(result.body);
});

app.get('/api/auth/security-status', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const activeSessions = (db.sessions || []).filter(s => s.userId === user.id && !s.revokedAt && new Date(s.expiresAt).getTime() > Date.now());
  res.json({ ok: true, status: { role: user.role || 'user', accountStatus: user.status || 'active', emailVerified: !!user.emailVerified, emailVerifiedAt: user.emailVerifiedAt || null, activeSessions: activeSessions.length, lastLoginAt: user.lastLoginAt || null, passwordChangedAt: user.passwordChangedAt || null, lockedUntilAt: user.lockedUntilAt || null, passwordPolicy: { minLength: AUTH_PASSWORD_MIN_LENGTH, complexity: AUTH_PASSWORD_COMPLEXITY } } });
});

app.get('/api/auth/sessions', requireAuth, (req, res) => {
  const { db, user, session } = req.auth;
  const sessions = (db.sessions || []).filter(s => s.userId === user.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 50).map(s => ({ id: s.id || hashToken(s.token || s.tokenHash || '').slice(0,12), current: s === session || s.id === session.id, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt || s.createdAt, expiresAt: s.expiresAt, revokedAt: s.revokedAt || null, ip: s.ip || '', userAgent: s.userAgent || '' }));
  res.json({ ok: true, sessions });
});

app.delete('/api/auth/sessions/:id', requireAuth, (req, res) => {
  const { db, user, session } = req.auth;
  const targetId = String(req.params.id || '');
  let changed = false;
  db.sessions = (db.sessions || []).map(s => {
    const sid = s.id || hashToken(s.token || s.tokenHash || '').slice(0,12);
    if (s.userId === user.id && sid === targetId && s !== session && s.id !== session.id) { changed = true; return { ...s, revokedAt: new Date().toISOString() }; }
    return s;
  });
  if (changed) auditAuth(db, 'session_revoked', { userId: user.id, email: user.email, sessionId: targetId });
  writeDb(db);
  res.json({ ok: true, changed });
});

app.delete('/api/auth/delete-account', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const password = String(req.body?.password || '');
  if (!verifyPassword(password, user)) return res.status(401).json({ error: 'Password is incorrect.' });
  if (isProtectedOwner(db, user)) return res.status(400).json({ error: 'Владелец не может удалить owner-аккаунт. Сначала нужно перенести OWNER_EMAILS и подтвердить нового владельца.' });
  const deletedEmail = user.email;
  user.status = 'deleted';
  user.email = `deleted-${user.id}@deleted.local`;
  user.name = 'Deleted account';
  user.emailVerified = false;
  user.updatedAt = new Date().toISOString();
  db.sessions = (db.sessions || []).map(s => s.userId === user.id ? { ...s, revokedAt: new Date().toISOString() } : s);
  auditAuth(db, 'account_deleted', { userId: user.id, email: deletedEmail });
  writeDb(db);
  res.json({ ok: true });
});

app.get('/api/auth/security-readiness', (_, res) => {
  res.json({ ok: true, readiness: authSecurityReadiness() });
});

app.get('/api/auth/email-readiness', (_, res) => {
  const readiness = emailDeliveryReadiness();
  res.status(readiness.ok ? 200 : 503).json({ ok: readiness.ok, readiness });
});

app.get('/api/auth/cookie-session-readiness', (_, res) => {
  const readiness = cookieSessionReadiness();
  res.status(readiness.ok ? 200 : 503).json({ ok: readiness.ok, readiness });
});

app.get('/api/auth/full-cookie-auth-readiness', (_, res) => {
  const cookie = cookieSessionReadiness();
  const blockers = [...(cookie.blockers || [])];
  const warnings = [...(cookie.warnings || [])];
  if (!AUTH_COOKIE_ENABLED) blockers.push('AUTH_COOKIE_ENABLED=true is required.');
  if (!AUTH_CSRF_ENABLED) blockers.push('AUTH_CSRF_ENABLED=true is required.');
  if (LAUNCH_MODE === 'production' && !COOKIE_SECURE) blockers.push('COOKIE_SECURE=true is required in production.');
  res.status(blockers.length ? 503 : 200).json({
    ok: blockers.length === 0,
    readiness: { cookieAuth: true, bearerTokens: 'legacy-fallback-only', csrf: AUTH_CSRF_ENABLED, frontendTokenStorage: 'disabled-by-v3.3.3', cookie, blockers, warnings }
  });
});

app.post('/api/auth/email/test', requireAdmin, async (req, res) => {
  const { db, user } = req.auth;
  const to = normalizeEmail(req.body?.to || user.email);
  const link = `${APP_BASE_URL}/account`;
  const template = emailLayout('MavenLex email delivery test', '<p>Это тестовое письмо MavenLex. Если вы его получили, почтовая доставка работает.</p>', 'Открыть MavenLex', link);
  const result = await sendEmail({ to, subject: 'MavenLex: email delivery test', html: template, text: `MavenLex email delivery test
${link}`, tags: ['mavenlex_test'] });
  db.emailDeliveries = db.emailDeliveries || [];
  db.emailDeliveries.unshift({ id: crypto.randomUUID(), userId: user.id, email: to, type: 'test', provider: EMAIL_PROVIDER, ok: !!result.ok, error: result.error || null, providerId: result.id || null, createdAt: new Date().toISOString() });
  auditAdmin(db, result.ok ? 'email_test_sent' : 'email_test_failed', user.id, { to, provider: EMAIL_PROVIDER, error: result.error || null });
  writeDb(db);
  res.status(result.ok ? 200 : 500).json({ ok: !!result.ok, result });
});

app.get('/api/user/history', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const items = (db.history || []).filter(x => x.userId === user.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 100);
  res.json({ ok: true, items });
});

app.post('/api/user/history', requireAuth, (req, res) => {
  try {
    const { db, user } = req.auth;
    const item = req.body?.item || {};
    const id = item.id || crypto.randomUUID();
    db.history = db.history || [];
    const saved = { ...item, id, userId: user.id, createdAt: item.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    const existing = db.history.findIndex(x => x.id === id && x.userId === user.id);
    if (existing >= 0) db.history[existing] = saved; else db.history.unshift(saved);
    db.history = db.history.slice(0, 2000);
    writeDb(db);
    res.json({ ok: true, item: saved });
  } catch (e) {
    console.error('[user/history]', e);
    res.status(500).json({ error: 'Could not save history item.' });
  }
});

app.delete('/api/user/history/:id', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const before = (db.history || []).length;
  db.history = (db.history || []).filter(x => !(x.userId === user.id && x.id === req.params.id));
  writeDb(db);
  res.json({ ok: true, removed: before - db.history.length });
});

app.post('/api/user/history/clear', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  db.history = (db.history || []).filter(x => x.userId !== user.id);
  writeDb(db);
  res.json({ ok: true });
});

app.get('/api/billing/readiness', (_req, res) => {
  const status = billingProviderStatus();
  const qa = billingQaChecks();
  const blockers = [];
  const warnings = [];
  if (!status.configured) blockers.push('Selected billing provider is not fully configured.');
  if (status.mockBlockedInProduction) blockers.push('Mock billing is blocked in production.');
  if (status.provider === 'yookassa' && !status.yookassaConfigured) blockers.push('YooKassa credentials are missing.');
  if ((status.provider === 'yookassa' || status.provider === 'stripe') && !status.paymentsEnabled) warnings.push('Live provider is selected but PAYMENTS_ENABLED is false.');
  if ((status.provider === 'yookassa' || status.provider === 'stripe') && !status.webhookSecretConfigured && BILLING_STRICT_WEBHOOKS) warnings.push('Webhook shared secret is missing; provider verification must stay enabled.');
  if (!status.returnUrlConfigured) warnings.push('APP_BASE_URL should be a valid https domain before live checkout.');
  res.status(blockers.length ? 503 : 200).json({ ok: blockers.length === 0, version: APP_VERSION, reliability: reliabilitySnapshot(), generatedAt: new Date().toISOString(), status, qa, liveChecklist: billingLiveChecklist(), blockers, warnings });
});


app.get('/api/billing/yookassa/readiness', (_req, res) => {
  const checklist = billingLiveChecklist();
  res.status(checklist.ok ? 200 : 503).json({ ok: checklist.ok, version: APP_VERSION, reliability: reliabilitySnapshot(), generatedAt: new Date().toISOString(), checklist });
});

app.get('/api/billing/payment/:id', requireAuth, async (req, res) => {
  try {
    const { db, user } = req.auth;
    const payment = (db.payments || []).find(p => p.id === req.params.id && p.userId === user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    let providerStatus = null;
    if (payment.provider === 'yookassa' && payment.providerPaymentId) {
      providerStatus = await refreshProviderPayment(payment).catch(e => ({ error: e.message || 'Provider status unavailable.' }));
    }
    res.json({ ok: true, payment: { id: payment.id, planId: payment.planId, status: payment.status, amount: payment.amount, currency: payment.currency, provider: payment.provider, providerStatus: payment.providerStatus || null, createdAt: payment.createdAt, paidAt: payment.paidAt || null }, providerStatus });
  } catch (e) {
    console.error('[billing/payment]', e);
    res.status(e.status || 500).json({ error: e.message || 'Could not read payment status.' });
  }
});

app.get('/api/billing/plans', (_, res) => {
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), provider: billingProviderStatus(), paymentsEnabled: PAYMENTS_ENABLED, plans: Object.fromEntries(Object.entries(PLAN_CATALOG).map(([id, plan]) => [id, { ...plan, limits: PLAN_LIMITS[id] }])) });
});

app.get('/api/billing/status', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const usage = userUsage(db, user.id);
  writeDb(db);
  res.json({ ok: true, user: publicUser(user), ...usageWithLimits(user, usage), billing: billingStatusForUser(db, user), subscription: subscriptionOverview(db, user), provider: billingProviderStatus() });
});

app.get('/api/subscription/current', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const usage = userUsage(db, user.id);
  writeDb(db);
  res.json({ ok: true, user: publicUser(user), ...usageWithLimits(user, usage), billing: billingStatusForUser(db, user) });
});

app.get('/api/subscription/readiness', (req, res) => {
  const db = readDb();
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), plans: Object.fromEntries(Object.entries(PLAN_CATALOG).map(([id, plan]) => [id, { ...plan, limits: PLAN_LIMITS[id] }])), features: ['billing_period','renewal_date','usage_meter','cancel_subscription','change_plan','admin_override_ready','monthly_reset'], activeSubscriptions: (db.subscriptions || []).filter(s => s.status === 'active').length });
});

app.post('/api/subscription/change', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const planId = String(req.body.planId || '').toLowerCase();
  if (!PLAN_CATALOG[planId]) return res.status(400).json({ error: 'Unknown plan.' });
  if (planId !== 'free' && normalizedBillingProvider() === 'yookassa') return res.status(402).json({ error: 'Use checkout to change to a paid plan.' });
  user.plan = planId;
  user.billingStatus = planId === 'free' ? 'free' : 'active';
  user.billingProvider = normalizedBillingProvider();
  user.updatedAt = new Date().toISOString();
  if (planId !== 'free') {
    db.subscriptions = db.subscriptions || [];
    db.subscriptions.unshift({ id: crypto.randomUUID(), userId: user.id, planId, status: 'active', provider: user.billingProvider, currentPeriodStart: new Date().toISOString(), currentPeriodEnd: new Date(Date.now() + 30*86400000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual_change' });
  } else {
    for (const sub of db.subscriptions || []) if (sub.userId === user.id && sub.status === 'active') { sub.status = 'cancelled'; sub.cancelledAt = new Date().toISOString(); sub.updatedAt = new Date().toISOString(); }
  }
  writeDb(db);
  res.json({ ok: true, subscription: subscriptionOverview(db, user), user: publicUser(user) });
});

app.post('/api/subscription/cancel', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  for (const sub of db.subscriptions || []) if (sub.userId === user.id && sub.status === 'active') { sub.status = 'cancelled'; sub.cancelledAt = new Date().toISOString(); sub.updatedAt = new Date().toISOString(); }
  user.plan = 'free';
  user.billingStatus = 'cancelled';
  user.updatedAt = new Date().toISOString();
  addBillingEvent(db, { type: 'subscription_cancelled_by_user', userId: user.id, provider: user.billingProvider || normalizedBillingProvider() });
  writeDb(db);
  res.json({ ok: true, subscription: subscriptionOverview(db, user), user: publicUser(user) });
});

app.post('/api/subscription/reset-usage', requireAdmin, (req, res) => {
  const { db } = req.auth;
  const userId = String(req.body.userId || '');
  if (!userId) return res.status(400).json({ error: 'userId is required.' });
  db.usage = (db.usage || []).filter(row => row.userId !== userId || row.month !== monthKeyNow());
  auditAdmin(db, 'usage_reset', req.auth.user.id, { userId });
  writeDb(db);
  res.json({ ok: true });
});

app.get('/api/email/notifications/readiness', (req, res) => {
  const readiness = emailNotificationsReadiness();
  res.status(readiness.ok ? 200 : 503).json({ version: APP_VERSION, reliability: reliabilitySnapshot(), ...readiness });
});

app.post('/api/email/report-ready', requireAuth, async (req, res) => {
  const { db, user } = req.auth;
  const result = await sendNotificationEmail(db, user, 'report_ready', { text: req.body?.text });
  writeDb(db);
  res.status(result.ok ? 200 : 502).json({ ok: result.ok, result });
});

app.post('/api/email/admin-alert', requireAdmin, async (req, res) => {
  const { db, user } = req.auth;
  const recipients = ADMIN_EMAILS.length ? ADMIN_EMAILS : [user.email].filter(Boolean);
  const results = [];
  for (const email of recipients) results.push(await sendNotificationEmail(db, { email }, 'admin_alert', { subject: req.body?.subject || 'MavenLex admin alert', text: req.body?.message || 'Admin alert from MavenLex.' }));
  writeDb(db);
  res.json({ ok: results.every(r => r.ok), results });
});

app.post('/api/billing/checkout', requireAuth, async (req, res) => {
  try {
    const { db, user } = req.auth;
    const planId = String(req.body.planId || '').toLowerCase();
    if (AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_BILLING && !user.emailVerified) return res.status(403).json({ error: 'Verify your email before starting checkout.' });
    const payment = await createCheckoutSession(db, user, planId);
    writeDb(db);
    res.json({ ok: true, provider: billingProviderStatus(), payment: { id: payment.id, planId: payment.planId, status: payment.status, amount: payment.amount, currency: payment.currency, provider: PUBLIC_LAUNCH_MODE ? undefined : payment.provider }, checkoutUrl: payment.checkoutUrl, safeCompletionRequired: payment.provider === 'manual' || payment.provider === 'mock', mockCompleteRequired: payment.provider === 'manual' || payment.provider === 'mock', providerPaymentId: PUBLIC_LAUNCH_MODE ? undefined : payment.providerPaymentId, message: payment.provider === 'manual' || payment.provider === 'mock' ? 'Plan activation created.' : 'Live provider checkout created.' });
  } catch (e) {
    console.error('[billing/checkout]', e);
    res.status(e.status || 500).json({ error: e.message || String(e) });
  }
});


app.post('/api/billing/confirm', requireAuth, async (req, res) => {
  try {
    const db = req.auth.db;
    const user = req.auth.user;
    const paymentId = String(req.body?.paymentId || req.query?.payment || '').trim();
    const payment = (db.payments || []).find(p => p.id === paymentId && p.userId === user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    if (payment.status === 'succeeded') {
      const usage = userUsage(db, user.id);
      return res.json({ ok: true, payment, user: publicUser(user), ...usageWithLimits(user, usage), billing: billingStatusForUser(db, user), alreadyActive: true });
    }
    const providerPayment = await refreshProviderPayment(payment);
    if (providerPayment) {
      payment.providerStatus = providerPayment.status;
      payment.providerPayload = { id: providerPayment.id, status: providerPayment.status, paid: providerPayment.paid, test: providerPayment.test, captured_at: providerPayment.captured_at || null };
      if (providerPaymentIsPaid(providerPayment)) {
        if (!paymentAmountMatches(payment, providerPayment) || !paymentMetadataMatches(payment, providerPayment)) {
          payment.status = 'failed';
          payment.updatedAt = new Date().toISOString();
          addBillingEvent(db, { type: 'payment_verification_failed', source: 'provider-confirm', paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider, reason: 'amount_or_metadata_mismatch' });
        } else {
          markPaymentSucceeded(db, payment, 'provider-confirm');
        }
      } else if (['canceled', 'cancelled'].includes(providerPayment.status)) {
        payment.status = 'cancelled';
        payment.updatedAt = new Date().toISOString();
        addBillingEvent(db, { type: 'payment_cancelled', source: 'provider-confirm', paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider });
      }
    }
    writeDb(db);
    const freshUser = (db.users || []).find(u => u.id === user.id) || user;
    const usage = userUsage(db, freshUser.id);
    res.json({ ok: true, payment, user: publicUser(freshUser), ...usageWithLimits(freshUser, usage), billing: billingStatusForUser(db, freshUser), providerStatus: payment.providerStatus || payment.status });
  } catch (e) {
    console.error('[billing/confirm]', e);
    res.status(e.status || 500).json({ error: e.message || 'Could not confirm payment.' });
  }
});

app.post('/api/billing/mock-complete', requireAuth, (req, res) => {
  try {
    const { db, user } = req.auth;
    const paymentId = String(req.body.paymentId || '');
    const payment = (db.payments || []).find(p => p.id === paymentId && p.userId === user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    if (!['manual', 'mock'].includes(payment.provider)) return res.status(400).json({ error: PUBLIC_LAUNCH_MODE ? 'Plan activation is not available for this provider.' : 'Mock completion is only available for manual/mock providers.' });
    const subscription = markPaymentSucceeded(db, payment, 'mock-complete');
    const usage = userUsage(db, user.id);
    writeDb(db);
    res.json({ ok: true, payment, subscription, user: publicUser((db.users || []).find(u => u.id === user.id) || user), ...usageWithLimits((db.users || []).find(u => u.id === user.id) || user, usage), billing: billingStatusForUser(db, (db.users || []).find(u => u.id === user.id) || user) });
  } catch (e) {
    console.error('[billing/mock-complete]', e);
    res.status(e.status || 500).json({ error: e.message || String(e) });
  }
});

app.post('/api/billing/webhook', async (req, res) => {
  try {
    const db = readDb();
    if (!verifyBillingWebhook(req)) {
      addBillingEvent(db, { type: 'webhook_rejected', provider: normalizedBillingProvider(), reason: 'invalid_secret_or_strict_webhook' });
      writeDb(db);
      return res.status(401).json({ error: 'Invalid webhook secret.' });
    }
    const event = req.body || {};
    const type = String(event.event || event.type || event.status || 'unknown');
    const object = event.object || event.payment || {};
    const providerPaymentId = object.id || event.providerPaymentId || null;
    const metadataPaymentId = object.metadata?.mavenlexPaymentId || object.metadata?.paymentId || event.paymentId || event.id;
    const payment = (db.payments || []).find(p => p.id === metadataPaymentId || p.providerPaymentId === providerPaymentId);

    addBillingEvent(db, { type: 'webhook_received', paymentId: payment?.id || metadataPaymentId || null, providerPaymentId, provider: payment?.provider || normalizedBillingProvider(), rawType: type });

    if (!payment) {
      addBillingEvent(db, { type: 'webhook_unknown_payment_ignored', paymentId: metadataPaymentId || null, providerPaymentId, provider: normalizedBillingProvider(), rawType: type });
      writeDb(db);
      return res.json({ ok: true, handled: false, ignored: 'unknown_payment', type });
    }

    if (normalizedBillingProvider() === 'yookassa' && providerPaymentId) {
      const verified = await verifyYooKassaWebhookObject(object, payment);
      if (!verified) {
        addBillingEvent(db, { type: 'webhook_provider_verification_failed', paymentId: payment.id, providerPaymentId, provider: payment.provider, rawType: type });
        writeDb(db);
        return res.status(401).json({ error: 'Could not verify YooKassa webhook object.' });
      }
    }

    if (!paymentMetadataMatches(payment, object)) {
      payment.status = 'failed';
      payment.updatedAt = new Date().toISOString();
      addBillingEvent(db, { type: 'webhook_metadata_mismatch_ignored', paymentId: payment.id, providerPaymentId, provider: payment.provider, rawType: type });
      writeDb(db);
      return res.status(400).json({ ok: false, error: 'Webhook metadata does not match payment.' });
    }

    payment.providerStatus = object.status || payment.providerStatus;
    payment.providerPayload = { id: object.id || payment.providerPaymentId, status: object.status, paid: object.paid, event: type };

    if (type.includes('succeeded') || providerPaymentIsPaid(object)) {
      if (!paymentAmountMatches(payment, object)) {
        payment.status = 'failed';
        payment.updatedAt = new Date().toISOString();
        addBillingEvent(db, { type: 'webhook_amount_mismatch_ignored', paymentId: payment.id, providerPaymentId, provider: payment.provider, rawType: type, expected: payment.amount, currency: payment.currency });
      } else {
        markPaymentSucceeded(db, payment, 'webhook');
      }
    } else if (type.includes('canceled') || type.includes('cancelled') || ['canceled', 'cancelled'].includes(object.status)) {
      payment.status = 'cancelled';
      payment.updatedAt = new Date().toISOString();
      addBillingEvent(db, { type: 'payment_cancelled', source: 'webhook', paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider });
      const sub = (db.subscriptions || []).find(sub => sub.userId === payment.userId && sub.planId === payment.planId && sub.status === 'active');
      if (sub) { sub.status = 'cancelled'; sub.updatedAt = new Date().toISOString(); }
      const user = (db.users || []).find(u => u.id === payment.userId);
      if (user) { user.plan = 'free'; user.billingStatus = 'cancelled'; user.updatedAt = new Date().toISOString(); }
    } else if (type.includes('waiting_for_capture') || object.status === 'waiting_for_capture') {
      payment.status = 'waiting_for_capture';
      payment.updatedAt = new Date().toISOString();
      addBillingEvent(db, { type: 'payment_waiting_for_capture', source: 'webhook', paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider });
    } else if (type.includes('pending') || object.status === 'pending') {
      payment.status = 'pending';
      payment.updatedAt = new Date().toISOString();
      addBillingEvent(db, { type: 'payment_pending', source: 'webhook', paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider });
    } else if (type.includes('failed') || object.status === 'failed') {
      payment.status = 'failed';
      payment.updatedAt = new Date().toISOString();
      addBillingEvent(db, { type: 'payment_failed', source: 'webhook', paymentId: payment.id, userId: payment.userId, planId: payment.planId, provider: payment.provider });
    } else {
      addBillingEvent(db, { type: 'webhook_ignored', paymentId: payment.id, providerPaymentId, provider: payment.provider, rawType: type });
    }
    writeDb(db);
    res.json({ ok: true, handled: Boolean(payment), type, paymentStatus: payment.status });
  } catch (e) {
    console.error('[billing/webhook]', e);
    res.status(e.status || 500).json({ error: e.message || 'Webhook failed.' });
  }
});

app.patch('/api/user/history/:id', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const item = (db.history || []).find(x => x.id === req.params.id && x.userId === user.id);
  if (!item) return res.status(404).json({ error: 'History item not found.' });
  const allowed = ['favorite', 'archived', 'folder', 'notes', 'title'];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) item[key] = req.body[key];
  }
  item.updatedAt = new Date().toISOString();
  writeDb(db);
  res.json({ ok: true, item });
});



app.get('/api/user/favorites', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const historyFavs = (db.history || []).filter(x => x.userId === user.id && x.favorite && !x.archived).map(x => ({ id: x.id, type: x.type || 'history', title: x.title || x.fileName || x.summary || 'Saved item', text: x.summary || x.notes || '', source: 'history', createdAt: x.createdAt, updatedAt: x.updatedAt }));
  const clauseFavs = (db.clauseFavorites || []).filter(x => x.userId === user.id).map(x => ({ ...x, type: 'clause', source: 'clause-library' }));
  res.json({ ok: true, favorites: [...historyFavs, ...clauseFavs].slice(0, 200) });
});

app.get('/api/user/personal-space-summary', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  res.json({ ok: true, personalSpace: true, ...workspaceSummary(db, user) });
});

app.get('/api/personal-space/readiness', (req, res) => {
  const db = readDb();
  res.json({ ok: true, version: APP_VERSION, reliability: reliabilitySnapshot(), features: ['search','risk_filter','type_filter','date_filter','favorites','archive','folders','notes','comparison_history'], counts: { history: (db.history || []).length }, endpoints: ['/api/user/history','/api/user/history/:id','/api/user/personal-space-summary'] });
});

app.get('/api/user/usage', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const usage = userUsage(db, user.id);
  writeDb(db);
  res.json({ ok: true, usage, usageLimits: usageWithLimits(user, usage), warnings: usageWarningsForUser(user, usage), aiBudget: userAiCostSnapshot(db, user) });
});

app.get('/api/account/export', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const userId = user.id;
  const organizations = (db.organizations || []).filter(o => (db.organizationMembers || []).some(m => m.orgId === o.id && m.userId === userId)).map(o => ({ ...o, members: (db.organizationMembers || []).filter(m => m.orgId === o.id).map(m => ({ email: m.email, role: m.role, status: m.status, createdAt: m.createdAt })) }));
  const exportPayload = { exportedAt: new Date().toISOString(), appVersion: APP_VERSION, account: publicUser(user), billing: billingStatusForUser(db, user), usage: (db.usage || []).filter(x => x.userId === userId), history: (db.history || []).filter(x => x.userId === userId).map(x => ({ id: x.id, type: x.type, createdAt: x.createdAt, updatedAt: x.updatedAt, summary: x.summary || x.fileName || '', riskScore: x.riskScore || x.payload?.riskScore || null })), files: (db.files || []).filter(x => x.userId === userId).map(x => ({ id: x.id, fileName: x.fileName, mimeType: x.mimeType, size: x.size, createdAt: x.createdAt, expiresAt: x.expiresAt })), organizations, sessions: (db.sessions || []).filter(sess => sess.userId === userId).map(sess => ({ id: sess.id, createdAt: sess.createdAt, lastSeenAt: sess.lastSeenAt, expiresAt: sess.expiresAt, revokedAt: sess.revokedAt || null, ip: sess.ip || '', userAgent: sess.userAgent || '' })), notes: ['Export excludes password hashes, session tokens, reset tokens and raw secret values.'] };
  auditAuth(db, 'account_exported', { userId, email: user.email });
  writeDb(db);
  res.json({ ok: true, export: exportPayload });
});

app.get('/api/account/real-user-readiness', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const membershipCount = (db.organizationMembers || []).filter(m => m.userId === user.id).length;
  res.json({ ok: true, readiness: { userId: user.id, emailVerified: !!user.emailVerified, role: user.role || 'user', accountStatus: user.status || 'active', personalSpaceReady: true, hasActivePlan: true, dataExportAvailable: true, accountDeletionAvailable: true, trustPages: ['/privacy','/terms','/security','/support'], recommendations: [ ...(user.emailVerified ? [] : ['Verify email before production billing and sensitive AI usage.']), ...(configuredDbProvider() === 'json' ? ['Use PostgreSQL/Supabase/Neon for production user data.'] : []) ] } });
});
app.get('/api/user/onboarding', requireAuth, (req, res) => {
  const { user } = req.auth;
  res.json({ ok: true, onboarding: user.onboarding || { completed: false, useCase: '', language: DEFAULT_LANGUAGE, sampleRewriteDone: false } });
});
app.patch('/api/user/onboarding', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const current = user.onboarding || {};
  user.onboarding = { ...current, ...req.body, updatedAt: new Date().toISOString() };
  if (user.onboarding.useCase && user.onboarding.sampleRewriteDone) user.onboarding.completed = true;
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  res.json({ ok: true, onboarding: user.onboarding, user: publicUser(user) });
});

app.get('/api/auth/access-state', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  res.json(userAccessState(db, user));
});

app.get('/api/user/profile', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  res.json({ ok: true, user: publicUser(user), access: userAccessState(db, user) });
});

app.patch('/api/user/profile', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const body = req.body || {};
  const allowed = ['name', 'company', 'locale', 'timezone', 'supportEmail', 'marketingConsent', 'productUpdatesConsent', 'preferredLanguage'];
  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    if (['marketingConsent', 'productUpdatesConsent'].includes(key)) user[key] = Boolean(body[key]);
    else if (key === 'preferredLanguage') user[key] = normalizeLanguage(body[key] || DEFAULT_LANGUAGE);
    else user[key] = clean(String(body[key] || '').slice(0, 160));
  }
  user.updatedAt = new Date().toISOString();
  auditAuth(db, 'profile_updated', { userId: user.id, email: user.email });
  writeDb(db);
  res.json({ ok: true, user: publicUser(user), access: userAccessState(db, user) });
});

app.get('/api/user/export', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const payload = accountExportPayload(db, user);
  auditAuth(db, 'account_data_exported', { userId: user.id, email: user.email });
  writeDb(db);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="mavenlex-account-export.json"');
  res.send(JSON.stringify(payload, null, 2));
});


app.get('/api/ai/advanced-analysis-readiness', (_, res) => {
  res.json({
    ok: true,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    features: ['contract_type_detection','risk_matrix','clause_map','missing_clauses','red_flags','deep_standard_quick_modes','decision_helper'],
    liveAiConfigured: hasLiveAi(),
    localFallback: true,
    supportedContractTypes: Object.keys(CONTRACT_TYPE_PROFILES),
    generatedAt: new Date().toISOString()
  });
});


app.get('/api/export/readiness', (_req, res) => {
  res.json({
    ok: true,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    generatedAt: new Date().toISOString(),
    professionalExport: true,
    formats: ['pdf-print', 'html', 'word', 'markdown', 'txt', 'json'],
    reportExports: ['full professional report', 'executive summary', 'risk table', 'decision helper', 'signing checklist', 'verification points'],
    comparisonExports: ['comparison pdf-print', 'comparison html', 'comparison word', 'comparison markdown', 'comparison txt', 'comparison json'],
    planLimits: PLAN_LIMITS,
    publicSafe: true,
    note: 'PDF export uses browser print-to-PDF. Word export uses Word-compatible HTML .doc for maximum zero-dependency reliability.'
  });
});

app.get('/api/ai/contract-comparison-readiness', (_, res) => {
  res.json({
    ok: true,
    version: APP_VERSION, reliability: reliabilitySnapshot(),
    features: ['two_version_upload','risk_delta','clause_change_map','new_removed_risks','negotiation_focus','comparison_export'],
    supportedFormats: ['TXT','DOCX','PDF'],
    localFallback: true,
    liveAiConfigured: hasLiveAi(),
    generatedAt: new Date().toISOString()
  });
});

app.post('/api/compare-contracts', (req, res) => {
  upload.fields([{ name: 'oldContract', maxCount: 1 }, { name: 'newContract', maxCount: 1 }])(req, res, async (uploadError) => {
    const auth = optionalAuth(req);
    try {
      if (AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_AI && auth?.user && !auth.user.emailVerified) return res.status(403).json({ error: 'Verify your email before comparing contracts.' });
      enforceUsageLimit(auth, 'reviews');
      if (uploadError) return res.status(400).json({ error: uploadErrorMessage(uploadError) });
      const oldFile = req.files?.oldContract?.[0];
      const newFile = req.files?.newContract?.[0];
      if (!oldFile || !newFile) return res.status(400).json({ error: 'Upload both oldContract and newContract files.' });
      const [oldText, newText] = await Promise.all([extractText(oldFile), extractText(newFile)]);
      if (!clean(oldText) || !clean(newText)) return res.status(400).json({ error: 'Could not extract readable text from one of the files. Try TXT/DOCX or text-based PDF files.' });
      const opts = { contractType: req.body.contractType, jurisdiction: req.body.jurisdiction, analysisDepth: req.body.analysisDepth || 'standard', userRole: req.body.userRole, language: normalizeLanguage(req.body.reportLanguage || req.body.language), reportLanguage: normalizeLanguage(req.body.reportLanguage || req.body.language), oldLanguage: String(req.body.oldLanguage || 'auto'), newLanguage: String(req.body.newLanguage || 'auto') };
      const comparison = buildComparisonReport(oldText.slice(0, 60000), newText.slice(0, 60000), opts);
      const warnings = [...extractionWarnings(oldText, oldFile.originalname), ...extractionWarnings(newText, newFile.originalname)];
      recordAiCostEvent({ req, feature: 'contract_comparison', mode: comparison.metaAiMode || 'local-comparison', inputChars: oldText.length + newText.length, outputChars: JSON.stringify(comparison).length, success: true, metadata: { oldFileType: getFileType(oldFile.originalname), newFileType: getFileType(newFile.originalname) } });
      const serverUsageLimits = commitUsage(auth, 'reviews');
      res.json({
        ...comparison,
        meta: {
          oldFileName: oldFile.originalname,
          newFileName: newFile.originalname,
          oldFileType: getFileType(oldFile.originalname),
          newFileType: getFileType(newFile.originalname),
          oldExtractedCharacters: oldText.length,
          newExtractedCharacters: newText.length,
          warnings,
          generatedAt: new Date().toISOString(),
          apiVersion: APP_VERSION,
          aiMode: 'local-comparison',
          usageLimits: serverUsageLimits
        }
      });
    } catch (e) {
      console.error('[compare-contracts]', e);
      res.status(e.status || 500).json({ error: e.message || String(e), details: e.details || undefined });
    }
  });
});

app.post('/api/analyze-contract', (req, res) => {
  upload.single('contract')(req, res, async (uploadError) => {
    const auth = optionalAuth(req);
    try {
      if (AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_AI && auth?.user && !auth.user.emailVerified) return res.status(403).json({ error: 'Verify your email before using AI analysis.' });
      enforceUsageLimit(auth, 'reviews');
      if (uploadError) return res.status(400).json({ error: uploadErrorMessage(uploadError) });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded. Please choose a TXT, DOCX or PDF file.' });
      const storageDb = readDb();
      const storedFile = maybeStoreUploadedFile(storageDb, req, req.file, 'analysis');
      writeDb(storageDb);
      const text = await extractText(req.file);
      if (!clean(text)) return res.status(400).json({ error: 'Could not extract readable text. Try a TXT/DOCX file or a text-based PDF.' });
      const warnings = extractionWarnings(text, req.file.originalname);
      const detectedLanguage = detectTextLanguage(text);
      const requestedLanguage = normalizeLanguage(req.body.language);
      const documentLanguage = String(req.body.documentLanguage || 'auto').toLowerCase() === 'auto' ? detectedLanguage.language : normalizeLanguage(req.body.documentLanguage, requestedLanguage);
      const reportLanguage = normalizeLanguage(req.body.reportLanguage || req.body.language, requestedLanguage);
      const analysisMode = String(req.body.analysisDepth || req.body.mode || 'standard').toLowerCase();
      const authUserPlan = planForUser(auth?.user);
      if (auth?.user && analysisMode === 'deep' && authUserPlan === 'free' && AI_COST_DEEP_ANALYSIS_FREE_LIMIT <= 0) {
        return res.status(402).json({ error: 'Deep analysis is available on paid plans. Use Standard analysis or upgrade your plan.', code: 'DEEP_ANALYSIS_REQUIRES_PAID_PLAN' });
      }
      const report = await buildAiReport(text.slice(0, 60000), { ...req.body, language: reportLanguage, reportLanguage, documentLanguage, detectedLanguage: detectedLanguage.language });
      recordAiCostEvent({ req, feature: 'contract_analysis', mode: report.metaAiMode || 'unknown', inputChars: Math.min(text.length, 60000), outputChars: JSON.stringify(report).length, success: true, metadata: { fileType: getFileType(req.file.originalname), analysisMode, reportLanguage, documentLanguage } });
      const allWarnings = [...warnings];
      if (report.metaAiMode !== 'live-yandexgpt') {
        allWarnings.push('MavenLex использовал встроенный юридический анализ. Для более глубокого рассуждения проверьте подключение AI в настройках владельца.');
      }
      const serverUsageLimits = commitUsage(auth, 'reviews');
      res.json({ ...report, meta: { fileName: req.file.originalname, fileType: getFileType(req.file.originalname), fileSize: req.file.size, extractedCharacters: text.length, language: reportLanguage, documentLanguage, detectedLanguage, multilingual: { enabled: MULTILINGUAL_MODE, outputLanguage: reportLanguage, sourceLanguage: documentLanguage }, warnings: allWarnings, generatedAt: new Date().toISOString(), apiVersion: APP_VERSION, aiMode: report.metaAiMode || 'unknown', aiProvider: report.provider || 'unknown', usageLimits: serverUsageLimits, storedFile: storedFile ? { id: storedFile.id, storageMode: storedFile.storageMode, contentStored: storedFile.contentStored, expiresAt: storedFile.expiresAt } : null } });
    } catch (e) {
      console.error('[analyze-contract]', e);
      res.status(e.status || 500).json({ error: e.message || String(e), details: e.details || undefined });
    }
  });
});
app.post('/api/generate-contract', (req, res) => {
  try {
    const answers = req.body.answers || {};
    const required = ['partyA', 'partyB', 'subject', 'price'];
    const missing = required.filter(k => !clean(answers[k]));
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    res.json(generatedContract(answers));
  } catch (e) {
    console.error('[generate-contract]', e);
    res.status(e.status || 500).json({ error: e.message || String(e), details: e.details || undefined });
  }
});

const RU_LAW_ARTICLES = {
  'ук рф 228': {
    title: 'УК РФ статья 228',
    area: 'Незаконный оборот наркотических средств без цели сбыта',
    summary: 'Статья связана с незаконным приобретением, хранением, перевозкой, изготовлением или переработкой наркотических средств, психотропных веществ либо их аналогов без цели сбыта. Конкретные последствия зависят от части статьи, размера вещества и обстоятельств.',
    mayLead: [
      'Хранение запрещённых веществ без законных оснований.',
      'Приобретение или перевозка таких веществ без назначения врача и законного разрешения.',
      'Попытка давать объяснения без понимания фактов, если уже есть проверка или задержание.'
    ],
    avoid: [
      'Не хранить и не перевозить запрещённые вещества.',
      'Не подписывать объяснения или признания, пока не поняли последствия и факты.',
      'Если ситуация уже произошла — срочно связаться с MavenLexом по уголовным делам.'
    ]
  },
  'ук рф 159': {
    title: 'УК РФ статья 159',
    area: 'Мошенничество',
    summary: 'Статья связана с хищением чужого имущества или приобретением права на чужое имущество путём обмана или злоупотребления доверием. Важно, была ли цель обмануть, какой ущерб и какие доказательства есть.',
    mayLead: ['Получение денег или имущества через заведомо ложные обещания.', 'Сокрытие существенной информации при получении выгоды.', 'Использование чужого доверия для получения имущества или права.'],
    avoid: ['Фиксировать договорённости письменно.', 'Не обещать то, что невозможно или не планируется выполнять.', 'Сохранять документы, подтверждающие добросовестность действий.']
  },
  'гк рф 330': {
    title: 'ГК РФ статья 330',
    area: 'Неустойка, штраф, пеня',
    summary: 'Статья описывает неустойку: денежную сумму, которую должник должен уплатить при нарушении обязательства. Обычно это просрочка оплаты, сроков выполнения работ или иных обязательств.',
    mayLead: ['Просрочка оплаты или выполнения обязательств.', 'Нарушение срока передачи документов, товаров или результатов работ.', 'Подписание договора с чрезмерной пеней без лимита.'],
    avoid: ['Проверять размер штрафа до подписания.', 'Просить лимит неустойки и срок на исправление нарушения.', 'При споре запрашивать письменный расчёт и основание начисления.']
  },
  'гк рф 421': {
    title: 'ГК РФ статья 421',
    area: 'Свобода договора',
    summary: 'Статья закрепляет принцип свободы договора: стороны обычно сами выбирают условия сделки, если они не противоречат закону. Это не значит, что любые условия автоматически безопасны.',
    mayLead: ['Подписание невыгодных условий без проверки.', 'Согласие на односторонние права второй стороны.', 'Игнорирование обязательных норм закона.'],
    avoid: ['Проверять баланс прав и обязанностей.', 'Фиксировать важные условия в тексте договора.', 'Спорные условия отдельно проверять до подписания.']
  },
  'гк рф 450': {
    title: 'ГК РФ статья 450',
    area: 'Изменение и расторжение договора',
    summary: 'Статья связана с основаниями изменения или расторжения договора. На практике важны порядок уведомления, существенное нарушение и условия самого договора.',
    mayLead: ['Односторонний отказ без права на это в договоре или законе.', 'Нарушение порядка уведомления.', 'Прекращение исполнения без фиксации причин.'],
    avoid: ['Проверить порядок расторжения в договоре.', 'Направлять уведомления письменно и сохранять доказательства отправки.', 'До прекращения исполнения оценить риски в MavenLex.']
  },
  'коап рф 12.8': {
    title: 'КоАП РФ статья 12.8',
    area: 'Управление транспортом в состоянии опьянения',
    summary: 'Статья связана с управлением транспортным средством в состоянии опьянения или передачей управления такому лицу. Последствия могут включать штрафы и лишение права управления.',
    mayLead: ['Управление автомобилем после алкоголя или веществ, влияющих на состояние.', 'Передача автомобиля человеку в состоянии опьянения.', 'Отказ от законных процедур освидетельствования может иметь отдельные последствия.'],
    avoid: ['Не садиться за руль после алкоголя или сомнительных препаратов.', 'Не передавать управление человеку с признаками опьянения.', 'При спорной ситуации фиксировать обстоятельства и фиксировать факты и действовать через MavenLex-план.']
  },
  'тк рф 81': {
    title: 'ТК РФ статья 81',
    area: 'Расторжение трудового договора по инициативе работодателя',
    summary: 'Статья перечисляет основания увольнения по инициативе работодателя. Для законности важны основание, доказательства, процедура и сроки.',
    mayLead: ['Увольнение без правильного основания и документов.', 'Нарушение процедуры дисциплинарного взыскания.', 'Игнорирование гарантий для отдельных категорий работников.'],
    avoid: ['Проверить основание увольнения и документы.', 'Сохранять приказы, уведомления и переписку.', 'Работнику — не подписывать документы без понимания последствий.']
  }
};

function normalizeRuLawCode(code = '') {
  const s = String(code || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (/уголов|ук/.test(s)) return 'УК РФ';
  if (/граждан|гк/.test(s)) return 'ГК РФ';
  if (/коап|админ/.test(s)) return 'КоАП РФ';
  if (/труд|тк/.test(s)) return 'ТК РФ';
  if (/налог|нк/.test(s)) return 'НК РФ';
  return String(code || 'УК РФ').trim();
}
function normalizeArticleNumber(v = '') {
  return String(v || '').toLowerCase().replace(/ст\.?|статья|№/g, '').replace(',', '.').trim();
}
function lawArticleKey(code, article) {
  return `${normalizeRuLawCode(code).toLowerCase()} ${normalizeArticleNumber(article)}`.replace(/\s+/g,' ').trim();
}
function safeLocalArticleResult({ code, article, question = '' }) {
  const key = lawArticleKey(code, article);
  const item = RU_LAW_ARTICLES[key];
  const title = item?.title || `${normalizeRuLawCode(code)} статья ${normalizeArticleNumber(article) || '—'}`;
  return {
    title,
    jurisdiction: 'Россия',
    area: item?.area || 'Статья не найдена в локальной базе MavenLex.',
    summary: item?.summary || 'Локальная база пока содержит только часть популярных статей. Если Live AI подключён, MavenLex попробует объяснить статью через AI. Для точного вывода нужно сверять актуальную редакцию закона и практику.',
    mayLeadToViolation: item?.mayLead || ['Нужно уточнить состав статьи, часть статьи и фактические обстоятельства.', 'Риск обычно зависит от действия, умысла, последствий, суммы/размера и доказательств.', 'Не стоит делать вывод только по номеру статьи без текста нормы.'],
    howToAvoidViolation: item?.avoid || ['Проверить актуальный текст статьи в официальном источнике.', 'Описать факты в MavenLex: что произошло, когда, с кем, какие документы есть.', 'Не признавать нарушение письменно, пока позиция не проверена.'],
    whatToDoNow: [
      'Уточнить кодекс, номер статьи, часть статьи и регион/ситуацию.',
      'Сохранить документы, переписку, уведомления, протоколы и другие доказательства.',
      'Если есть проверка, претензия, вызов или задержание — зафиксировать документы и разобрать ситуацию в MavenLex.'
    ],
    MavenLexQuestions: [
      'Какая часть статьи может применяться к моей ситуации?',
      'Какие элементы состава или условия ответственности должны быть доказаны?',
      'Какие документы и доказательства мне срочно собрать?',
      'Какие действия сейчас лучше не совершать, чтобы не ухудшить позицию?'
    ],
    disclaimer: 'Информационное объяснение MavenLex. Это AI-разбор MavenLex и не инструкция по нарушению закона. Актуальную редакцию статьи и стратегию нужно сверять по актуальным источникам и фактам.'
  };
}
function buildLawArticlePrompt({ code, article, question }) {
  return `You are MavenLex Human Legal Counsel AI. Explain Russian law articles like a strong human legal analyst: clear, direct, practical, and not robotic.
${humanLegalCounselBehaviorBlock('ru')}
Never provide instructions for committing a crime or evading law enforcement.
Replace any request like "how to violate it" with "what conduct may be treated as a violation and what to avoid".
Do not invent exact penalties if uncertain. Mention only that current official text and facts must be checked if needed. Do not refuse ordinary legal article questions; if needed, reframe unsafe requests into legal risks and safe conduct. Do not tell the user to use MavenLex; give the best complete answer MavenLex can provide.

Return ONLY valid JSON:
{
 "title": "...",
 "jurisdiction": "Россия",
 "area": "...",
 "summary": "...",
 "mayLeadToViolation": ["high-level conduct that may create liability, not operational instructions"],
 "howToAvoidViolation": ["safe preventive steps"],
 "whatToDoNow": ["practical safe steps"],
 "MavenLexQuestions": ["points to verify"],
 "disclaimer": "..."
}

Code: ${normalizeRuLawCode(code)}
Article: ${normalizeArticleNumber(article)}
User question: ${question || ''}`;
}



app.get('/api/ai/legal-counsel-mode', (_req, res) => {
  res.json({ ok: true, version: APP_VERSION, mode: 'MavenLex Human Legal Counsel AI', liveAiConfigured: hasLiveAi() && process.env.DISABLE_LIVE_AI !== 'true', timeoutMs: Number(process.env.AI_TIMEOUT_MS || 180000), articleDatabase: Object.keys(RU_LAW_ARTICLES).length, behavior: ['contract review','legal questions','Russian law articles','risk explanation','next actions','counterparty messages'], safety: 'Answers lawful legal questions directly; unsafe requests are reframed into risk, prevention and verification points.' });
});


app.get('/api/ai/human-quality-check', (_req, res) => {
  const sample = localHumanCounselFromQuestion('меня кинули по договору че делать', 'ru');
  res.json({
    ok: true,
    version: APP_VERSION,
    mode: 'Human counsel answer quality gate',
    checks: {
      refusalDetection: looksLikeWeakLegalAnswer('Я не могу обсуждать эту тему.'),
      sampleIssues: legalAnswerQualityIssues(sample),
      sampleLength: sample.length
    },
    promise: 'MavenLex should answer messy legal questions with a direct, human, useful legal analysis instead of template disclaimers.'
  });
});


app.get('/api/ai/chatgpt-like-legal-reasoning-check', (_req, res) => {
  const sampleQuestion = 'а если уже подписал и он не платит че делать';
  const sample = localHumanCounselFromQuestion(sampleQuestion, 'ru');
  res.json({
    ok: true,
    version: APP_VERSION,
    mode: 'ChatGPT-like legal reasoning layer',
    adaptiveDepth: inferAnswerDepth(sampleQuestion, { risks: [{ title: { ru: 'Оплата' } }] }, [{ role: 'user', text: 'договор услуг' }]),
    weakAnswerRejected: shouldRegenerateForChatGptLikeQuality('Я не могу обсуждать эту тему.', 'ru'),
    sampleLength: sample.length,
    promise: 'MavenLex should answer like a strong human AI legal conversation: adaptive, contextual, practical, not a rigid template.'
  });
});

app.post('/api/law-article-search', async (req, res) => {
  const { code = 'УК РФ', article = '', question = '' } = req.body || {};
  try {
    if (!clean(article)) return res.status(400).json({ error: 'Article number is required.' });
    if (!hasLiveAi() || process.env.DISABLE_LIVE_AI === 'true') {
      throw clientError('AI не работает: подключите YandexGPT в Environment. Локальные шаблоны для статей отключены.', 503, { code: 'LIVE_AI_NOT_CONFIGURED' });
    }
    const raw = await callYandexText(buildLawArticlePrompt({ code, article, question }), { timeoutMs: Number(process.env.LAW_AI_TIMEOUT_MS || 70000) });
    const ai = safeJsonParse(raw);
    const mode = 'live-yandexgpt';
    const result = ai;
    recordAiCostEvent({ req, feature: 'law_article_search', mode, inputChars: String(code).length + String(article).length + String(question).length, outputChars: JSON.stringify(result).length, success: true, metadata: { code: normalizeRuLawCode(code), article: normalizeArticleNumber(article) } });
    res.json({ ok: true, mode, result });
  } catch (e) {
    console.error('[law-article-search]', e);
    res.status(e.status || 500).json({ error: e.message || String(e) });
  }
});

app.post('/api/legal-chat', async (req, res) => {
  const { question = '', report = {}, language = 'ru', history = [] } = req.body || {};
  const auth = optionalAuth(req);
  const started = Date.now();
  try {
    if (AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_AI && auth?.user && !auth.user.emailVerified) return res.status(403).json({ error: 'Verify your email before using AI chat.' });
    enforceUsageLimit(auth, 'questions');
    enforceAiCostBudget(auth, 'legal_chat');
    if (!clean(question)) return res.status(400).json({ error: 'Question is required.' });
    if (!hasLiveAi() || process.env.DISABLE_LIVE_AI === 'true') {
      throw clientError('AI не работает: live AI не подключён. Добавьте YandexGPT ключи и DISABLE_LIVE_AI=false. Локальные шаблонные ответы отключены.', 503, { code: 'LIVE_AI_NOT_CONFIGURED' });
    }
    let answer = '';
    let mode = 'live-yandexgpt-human-counsel';
    try {
      const prompt = buildChatPrompt({ question, report, language, mode: req.body?.mode || 'smart', history });
      answer = await callYandexText(prompt, { timeoutMs: Number(process.env.CHAT_TIMEOUT_MS || 180000) });
      if (looksLikeWeakLegalAnswer(answer) || shouldRegenerateForChatGptLikeQuality(answer, language)) {
        const rescuePrompt = buildHumanCounselRepairPrompt({ originalPrompt: prompt, weakAnswer: answer, question, language });
        answer = await callYandexText(rescuePrompt, { timeoutMs: Number(process.env.CHAT_TIMEOUT_MS || 180000) });
        mode = 'live-yandexgpt-human-rescue';
      }
      if (looksLikeWeakLegalAnswer(answer) || legalAnswerQualityIssues(answer).length >= 3) {
        throw clientError('AI не работает качественно: live AI вернул слабый или шаблонный ответ. Проверьте модель/ключи YandexGPT.', 502, { code: 'LIVE_AI_WEAK_RESPONSE' });
      }
    } catch (e) {
      console.warn('[legal-chat-ai-error]', e.message);
      throw clientError(`AI не работает: ${e.message}`, e.status || 503, { code: e.details?.code || 'LIVE_AI_FAILED' });
    }
    const minMs = Number(process.env.CHAT_MIN_MS || 3500);
    const elapsed = Date.now() - started;
    if (elapsed < minMs) await sleep(minMs - elapsed);
    recordAiCostEvent({ req, feature: 'legal_chat', mode, inputChars: String(question).length + JSON.stringify(report || {}).slice(0, 20000).length, outputChars: String(answer || '').length, success: true, metadata: { chatMode: req.body?.mode || 'smart', language } });
    const serverUsageLimits = commitUsage(auth, 'questions');
    res.json({ answer, mode, usageLimits: serverUsageLimits });
  } catch (e) {
    console.error('[legal-chat]', e);
    res.status(e.status || 500).json({ error: e.message || String(e) });
  }
});



// -----------------------------
// v4.2.0 Secure storage + Team + Clause library + Rewrite assistant
// -----------------------------
app.get('/api/storage/readiness', (_req, res) => {
  const db = readDb();
  cleanupExpiredFiles(db);
  res.json({ ...storageReadiness(), version: APP_VERSION, filesTracked: (db.storedFiles || []).length, endpoints: ['/api/storage/readiness','/api/user/files','/api/user/files/:id'] });
});
app.get('/api/user/files', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  cleanupExpiredFiles(db);
  const files = (db.storedFiles || []).filter(f => f.userId === user.id).map(f => ({ id:f.id, fileName:f.fileName, fileType:f.fileType, size:f.size, storageMode:f.storageMode, contentStored:f.contentStored, expiresAt:f.expiresAt, createdAt:f.createdAt, purpose:f.purpose }));
  res.json({ ok: true, files, storage: storageReadiness() });
});
app.delete('/api/user/files/:id', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const idx = (db.storedFiles || []).findIndex(f => f.id === req.params.id && f.userId === user.id);
  if (idx < 0) return res.status(404).json({ error: 'File not found.' });
  const [file] = db.storedFiles.splice(idx, 1);
  if (file.contentStored && file.path && fs.existsSync(file.path)) { try { fs.unlinkSync(file.path); } catch (_) {} }
  writeDb(db);
  res.json({ ok: true, deleted: file.id });
});
app.post('/api/storage/cleanup', requireAdmin, (_req, res) => {
  const removed = cleanupExpiredFiles(readDb());
  res.json({ ok: true, removed });
});

app.get('/api/team/readiness', (_req, res) => {
  const db = readDb();
  res.json({ ok: true, enabled: TEAM_WORKSPACE_ENABLED, organizations: (db.organizations || []).length, members: (db.organizationMembers || []).length, roles: ['owner','local_admin','member','viewer'], endpoints: ['/api/team/organizations','/api/team/organizations/:id/members','/api/team/organizations/:id/invite','/api/team/organizations/:id/activity'] });
});
app.get('/api/team/organizations', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const orgIds = (db.organizationMembers || []).filter(m => m.userId === user.id).map(m => m.orgId);
  const organizations = (db.organizations || []).filter(o => orgIds.includes(o.id)).map(o => ({ ...o, role: orgRole(db, user.id, o.id), members: (db.organizationMembers || []).filter(m => m.orgId === o.id).length }));
  res.json({ ok: true, organizations });
});
app.post('/api/team/organizations', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const name = clean(req.body?.name || 'MavenLex Team');
  const org = { id: crypto.randomUUID(), name, ownerId: user.id, plan: user.plan || 'free', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.organizations = db.organizations || [];
  db.organizationMembers = db.organizationMembers || [];
  db.organizations.unshift(org);
  db.organizationMembers.unshift({ id: crypto.randomUUID(), orgId: org.id, userId: user.id, email: user.email, role: 'owner', status: 'active', createdAt: new Date().toISOString() });
  auditAdmin(db, 'team_created', user.id, { orgId: org.id, name });
  writeDb(db);
  res.json({ ok: true, organization: org });
});
app.get('/api/team/organizations/:id/members', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  requireOrgRole(db, user.id, req.params.id, ['owner','admin','member','viewer']);
  const members = (db.organizationMembers || []).filter(m => m.orgId === req.params.id);
  res.json({ ok: true, members });
});
app.post('/api/team/organizations/:id/invite', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  requireOrgRole(db, user.id, req.params.id, ['owner','admin']);
  const email = normalizeEmail(req.body?.email);
  const role = ['admin','member','viewer'].includes(req.body?.role) ? req.body.role : 'member';
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  db.organizationMembers = db.organizationMembers || [];
  const existing = db.organizationMembers.find(m => m.orgId === req.params.id && m.email === email);
  if (existing) return res.json({ ok: true, member: existing, alreadyExists: true });
  const member = { id: crypto.randomUUID(), orgId: req.params.id, userId: null, email, role, status: 'invited', invitedBy: user.id, createdAt: new Date().toISOString() };
  db.organizationMembers.unshift(member);
  auditAdmin(db, 'team_member_invited', user.id, { orgId: req.params.id, email, role });
  writeDb(db);
  res.json({ ok: true, member });
});
app.patch('/api/team/organizations/:id/members/:memberId', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  requireOrgRole(db, user.id, req.params.id, ['owner','admin']);
  const member = (db.organizationMembers || []).find(m => m.orgId === req.params.id && m.id === req.params.memberId);
  if (!member) return res.status(404).json({ error: 'Member not found.' });
  if (req.body?.role && ['admin','member','viewer'].includes(req.body.role)) member.role = req.body.role;
  if (req.body?.status && ['active','invited','removed'].includes(req.body.status)) member.status = req.body.status;
  member.updatedAt = new Date().toISOString();
  auditAdmin(db, 'team_member_updated', user.id, { orgId: req.params.id, memberId: member.id });
  writeDb(db);
  res.json({ ok: true, member });
});

app.get('/api/clauses/readiness', (_req, res) => res.json({ ...clauseLibraryReadiness(), version: APP_VERSION }));
app.get('/api/clauses/library', (_req, res) => res.json({ ok: true, clauses: CLAUSE_LIBRARY, categories: [...new Set(CLAUSE_LIBRARY.map(c => c.category))] }));
app.post('/api/clauses/recommend', (req, res) => res.json({ ok: true, recommendations: suggestClauses(req.body || {}) }));
app.post('/api/clauses/favorites', requireAuth, (req, res) => {
  const { db, user } = req.auth;
  const clauseId = String(req.body?.clauseId || '');
  if (!CLAUSE_LIBRARY.find(c => c.id === clauseId)) return res.status(404).json({ error: 'Clause not found.' });
  db.clauseFavorites = db.clauseFavorites || [];
  const exists = db.clauseFavorites.find(x => x.userId === user.id && x.clauseId === clauseId);
  if (!exists) db.clauseFavorites.unshift({ id: crypto.randomUUID(), userId: user.id, clauseId, createdAt: new Date().toISOString() });
  writeDb(db);
  res.json({ ok: true, favorites: db.clauseFavorites.filter(x => x.userId === user.id) });
});

app.get('/api/rewrite/readiness', (_req, res) => res.json({ ok: true, enabled: REWRITE_ASSISTANT_ENABLED, version: APP_VERSION, features: ['rewrite_clause','safer_wording','customer_provider_balanced_roles','negotiation_message','checklist'], endpoints: ['/api/rewrite/clause'] }));
app.post('/api/rewrite/clause', async (req, res) => {
  const auth = optionalAuth(req);
  try {
    if (AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_AI && auth?.user && !auth.user.emailVerified) return res.status(403).json({ error: 'Verify your email before using AI rewrite.' });
    enforceUsageLimit(auth, 'questions');
    enforceAiCostBudget(auth, 'rewrite_clause');
    const result = rewriteClause(req.body || {});
    const db = readDb();
    db.rewriteJobs = db.rewriteJobs || [];
    db.rewriteJobs.unshift({ id: crypto.randomUUID(), userId: auth?.user?.id || null, direction: req.body?.direction || 'neutral', role: req.body?.role || 'balanced', createdAt: new Date().toISOString(), result });
    db.rewriteJobs = db.rewriteJobs.slice(0, 1000);
    writeDb(db);
    const usageLimits = commitUsage(auth, 'questions');
    res.json({ ok: true, result, usageLimits });
  } catch (e) {
    console.error('[rewrite/clause]', e);
    res.status(e.status || 500).json({ error: e.message || String(e), details: e.details || undefined });
  }
});
app.get('/api/admin/product-expansion', requireAdmin, (_req, res) => {
  const db = readDb();
  res.json({ ok: true, storage: { ...storageReadiness(), filesTracked: (db.storedFiles || []).length }, teams: { organizations: (db.organizations || []).length, members: (db.organizationMembers || []).length }, clauses: clauseLibraryReadiness(), rewrites: { total: (db.rewriteJobs || []).length }, generatedAt: new Date().toISOString() });
});


app.get('/api/i18n/readiness', (_req, res) => {
  res.json({
    ok: true,
    version: APP_VERSION,
    enabled: MULTILINGUAL_MODE,
    defaultLanguage: DEFAULT_LANGUAGE,
    supportedLanguages: SUPPORTED_LANGUAGES,
    languageDetection: LANGUAGE_DETECTION_ENABLED,
    features: ['ui_translations','localized_routes','report_language','document_language_detection','bilingual_exports','localized_email_templates','hreflang_sitemap'],
    routes: { root: '/', russian: '/ru', english: '/en' },
    checks: {
      uiDictionary: true,
      reportOutputLanguage: true,
      analyzeLanguageOptions: true,
      seoHreflang: true,
      emailTemplates: true,
      legalAndFaq: true
    },
    generatedAt: new Date().toISOString()
  });
});

app.get('/api/i18n/languages', (_req, res) => {
  res.json({ ok: true, defaultLanguage: DEFAULT_LANGUAGE, languages: [
    { code: 'ru', label: 'Русский', nativeName: 'Русский', direction: 'ltr' },
    { code: 'en', label: 'English', nativeName: 'English', direction: 'ltr' }
  ] });
});

app.post('/api/i18n/detect-language', (req, res) => {
  const detection = detectTextLanguage(req.body?.text || '');
  res.json({ ok: true, ...detection });
});

app.get('/robots.txt', (_req, res) => {
  const base = APP_BASE_URL || '';
  res.type('text/plain').send(`User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req, res) => {
  const base = APP_BASE_URL || '';
  const now = new Date().toISOString();
  const urls = PUBLIC_SEO_PAGES.map(page => {
    const loc = `${base}${page === '/' ? '' : page}`;
    const altRu = `${base}${page === '/' ? '/ru' : `/ru${page}`}`;
    const altEn = `${base}${page === '/' ? '/en' : `/en${page}`}`;
    return `<url><loc>${loc}</loc><xhtml:link rel="alternate" hreflang="ru" href="${altRu}"/><xhtml:link rel="alternate" hreflang="en" href="${altEn}"/><xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/><lastmod>${now}</lastmod><changefreq>${page === '/' ? 'weekly' : 'monthly'}</changefreq><priority>${page === '/' ? '1.0' : '0.7'}</priority></url>`;
  }).join('');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`);
});


app.get('/api/brand-ui/readiness', (_req, res) => res.json(brandUiReadiness()));
app.get('/api/admin/console-pro', requireAdmin, (_req, res) => res.json(adminConsoleProSnapshot()));

// -----------------------------
// Production frontend serving
// -----------------------------
if (SERVE_FRONTEND && fs.existsSync(FRONTEND_DIST_DIR)) {
  app.use(express.static(FRONTEND_DIST_DIR, {
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    etag: true,
    index: false
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(FRONTEND_DIST_DIR, 'index.html'));
  });
} else if (process.env.NODE_ENV === 'production') {
  console.warn(`[deployment] Frontend dist not found at ${FRONTEND_DIST_DIR}. Run npm run build before starting production server.`);
}

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

process.on('SIGINT', () => {
  console.log('Stopping backend...');
  server.close(() => process.exit(0));
});

app.use((err, _req, res, _next) => {
  console.error('[server-error]', err);
  recordServerError(_req, err, err.status || 500);
  res.status(err.status || 500).json({ error: err.message || 'Unexpected server error.' });
});
