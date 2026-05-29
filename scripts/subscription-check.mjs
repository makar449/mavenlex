const API_URL = process.env.API_URL || '';
if (API_URL) {
  const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/subscription/readiness`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(`Subscription readiness failed: ${res.status} ${JSON.stringify(data)}`);
  for (const feature of ['billing_period','renewal_date','usage_meter','cancel_subscription','change_plan','monthly_reset']) {
    if (!data.features?.includes(feature)) throw new Error(`Missing subscription feature: ${feature}`);
  }
  console.log('[subscription-check] API readiness OK');
} else {
  const fs = await import('fs');
  const server = fs.readFileSync('server.js', 'utf8');
  for (const check of ['/api/subscription/readiness','/api/subscription/change','/api/subscription/cancel','subscriptionOverview']) {
    if (!server.includes(check)) throw new Error(`Missing subscription backend feature: ${check}`);
  }
  console.log('[subscription-check] Local subscription features OK');
}
