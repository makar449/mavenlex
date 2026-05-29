# v3.13.0 — Performance & Reliability Pack

This release adds production reliability guardrails for MavenLex.

## Added

- API request timeout protection.
- Slow request tracking.
- Reliability readiness endpoint.
- Admin reliability overview.
- Memory, uptime and latency snapshot in health checks.
- Static asset caching headers for production frontend serving.
- Dedicated performance and reliability checks.

## Commands

```bash
npm run performance-check
npm run reliability-check
npm run check
```

## Endpoints

- `GET /api/reliability/readiness`
- `GET /api/admin/reliability`
- `GET /api/health` includes reliability snapshot.

## Env

```env
RELIABILITY_API_TIMEOUT_MS=45000
RELIABILITY_AI_TIMEOUT_MS=60000
RELIABILITY_SLOW_REQUEST_MS=2500
STATIC_CACHE_MAX_AGE=1h
HEALTH_PROBE_STRICT=false
```
