const API_URL = process.env.API_URL || '';
const requiredFormats = ['pdf-print', 'html', 'word', 'markdown', 'txt', 'json'];

if (API_URL) {
  const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/export/readiness`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(`Export readiness failed: ${res.status} ${JSON.stringify(data)}`);
  for (const format of requiredFormats) {
    if (!data.formats?.includes(format)) throw new Error(`Missing export format from API readiness: ${format}`);
  }
  console.log('[export-check] API export readiness OK');
} else {
  const fs = await import('fs');
  const src = fs.readFileSync('src/main.jsx', 'utf8');
  const checks = ['professionalReportHtml', 'professionalComparisonHtml', 'downloadReportFile', 'downloadComparison', 'exportLimitHint'];
  for (const check of checks) {
    if (!src.includes(check)) throw new Error(`Missing frontend export feature: ${check}`);
  }
  console.log('[export-check] Local export features OK');
}
