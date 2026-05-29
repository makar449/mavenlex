const API_URL = process.env.API_URL || '';
if (API_URL) {
  const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/email/notifications/readiness`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(`Email notifications readiness failed: ${res.status} ${JSON.stringify(data)}`);
  for (const template of ['verify_email','reset_password','payment_success','payment_failed','plan_activated','report_ready','admin_alert']) {
    if (!data.templates?.includes(template)) throw new Error(`Missing email template: ${template}`);
  }
  console.log('[email-notifications-check] API readiness OK');
} else {
  const fs = await import('fs');
  const server = fs.readFileSync('server.js', 'utf8');
  for (const check of ['emailNotificationsReadiness','sendNotificationEmail','/api/email/report-ready','/api/email/admin-alert']) {
    if (!server.includes(check)) throw new Error(`Missing email notification feature: ${check}`);
  }
  console.log('[email-notifications-check] Local email notification features OK');
}
