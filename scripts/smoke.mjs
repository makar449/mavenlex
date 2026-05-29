const base = process.env.API_URL || 'http://localhost:3001';

async function getJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${url} failed: ${JSON.stringify(data)}`);
  return data;
}

try {
  console.log('Smoke test target:', base);
  const health = await getJson(`${base}/api/health`);
  console.log('Health OK:', health.version);

  const contractText = `SERVICE AGREEMENT\n\n1. PAYMENT TERMS\nThe Client agrees to pay all invoices within 5 calendar days.\n\n2. PENALTIES\nLate payment may result in a penalty of 15% of the outstanding amount.\n\n3. TERMINATION\nThe Provider may terminate this agreement without prior notice if payment is delayed.\n\n4. LIABILITY\nThe Provider shall not be liable for indirect damages under any circumstances.\n\n5. AUTOMATIC RENEWAL\nThis agreement automatically renews every 12 months unless canceled 30 days before renewal.`;
  const form = new FormData();
  form.append('contract', new Blob([contractText], { type: 'text/plain' }), 'smoke_test_contract.txt');
  form.append('language', 'en');
  form.append('jurisdiction', 'Sweden');
  form.append('contractType', 'Service agreement');

  const report = await getJson(`${base}/api/analyze-contract`, { method: 'POST', body: form });
  if (!Array.isArray(report.risks) || report.risks.length === 0) throw new Error('Analyze returned no risks.');
  console.log('Analyze OK:', `${report.risks.length} risks`, `score ${report.riskScore}/100`);

  const generated = await getJson(`${base}/api/generate-contract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: { partyA: 'Client LLC', partyB: 'Provider Ltd', subject: 'Website development services', price: '2000 EUR' } })
  });
  if (!generated.contractText) throw new Error('Generate returned no contract text.');
  console.log('Builder API OK');
  console.log('Smoke test passed.');
} catch (error) {
  console.error(error.message || error);
  console.error('\nStart the backend first with: npm run api');
  console.error('Then run: npm run smoke');
  process.exit(1);
}
