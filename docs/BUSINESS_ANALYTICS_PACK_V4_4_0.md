# MavenLex v4.4.0 — Business Analytics Pack

This release adds internal business analytics for MavenLex without requiring an external CRM or analytics vendor.

## Added

- Conversion funnel: visit → signup → analysis → export → checkout → payment.
- Revenue metrics from succeeded payment records.
- Active user estimates for 7 and 30 days.
- Plan distribution overview.
- Popular pages overview.
- 14-day daily series for page views, signups, analyses and revenue.
- Admin-only business analytics endpoint.
- Public readiness endpoint for automated checks.

## Endpoints

- `GET /api/analytics/business/readiness`
- `GET /api/analytics/business`
- `GET /api/admin/business-analytics`
- `POST /api/analytics/track`

## Check

```bash
npm run business-analytics-check
```

For production:

```bash
API_URL=https://your-site.app npm run business-analytics-check
```

## Notes

This is an internal analytics layer. It does not send data to Google Analytics, Meta Pixel, CRM tools, or third-party tracking systems.
