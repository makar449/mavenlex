import fs from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';

const src = fs.readFileSync('src/main.jsx','utf8');
const server = fs.readFileSync('server.js','utf8');
function ok(name, pass, detail='') { console.log(`${pass ? 'OK' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`); if (!pass) process.exitCode = 1; }
ok('comparison route exists', src.includes('/compare'));
ok('comparison endpoint exists', server.includes('/api/compare-contracts'));
ok('comparison readiness exists', server.includes('/api/ai/contract-comparison-readiness'));
ok('comparison export exists', src.includes('comparisonMarkdown'));
if (process.exitCode) process.exit(process.exitCode);

const PORT = process.env.PORT || 3521;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
const startedServer = !process.env.API_URL;
let child = null;
function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: options.method || 'GET', headers: options.headers || {} }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(body || '{}') }); }
        catch { resolve({ status: res.statusCode, json: {}, raw: body }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}
async function waitForHealth() {
  for (let i = 0; i < 50; i++) {
    try { const r = await requestJson(`${API_URL}/api/health`); if (r.status < 500) return; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Server did not become healthy.');
}
function multipart(fields, files) {
  const boundary = '----mavenlexcompare' + Math.random().toString(16).slice(2);
  const parts = [];
  for (const [name, value] of Object.entries(fields || {})) parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
  for (const file of files) parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: text/plain\r\n\r\n${file.content}\r\n`);
  parts.push(`--${boundary}--\r\n`);
  const body = parts.join('');
  return { boundary, body };
}
try {
  if (startedServer) {
    child = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env: { ...process.env, PORT: String(PORT), DISABLE_LIVE_AI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', d => process.stdout.write(`[api] ${d}`));
    child.stderr.on('data', d => process.stderr.write(`[api] ${d}`));
  }
  await waitForHealth();
  const ready = await requestJson(`${API_URL}/api/ai/contract-comparison-readiness`);
  ok('remote comparison readiness', ready.status === 200 && ready.json.ok && ready.json.features?.includes('risk_delta'), `${ready.status}`);
  const oldContract = `SERVICE AGREEMENT\nPayment: Client shall pay EUR 2000 within 30 days. Termination requires 14 days written notice. Liability is capped at fees paid in the last 3 months. Disputes are governed by the law of Sweden.`;
  const newContract = `SERVICE AGREEMENT\nPayment: Client shall pay EUR 2000 within 7 days. Late payment penalty is 2% per day. Provider may terminate without notice at any time. Provider shall not be liable for indirect damages under any circumstances. Disputes are governed by the law of Sweden.`;
  const { boundary, body } = multipart({ jurisdiction: 'Sweden', analysisDepth: 'deep', userRole: 'customer' }, [
    { name: 'oldContract', filename: 'old.txt', content: oldContract },
    { name: 'newContract', filename: 'new.txt', content: newContract }
  ]);
  const compared = await requestJson(`${API_URL}/api/compare-contracts`, { method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(body) }, body });
  if (compared.status !== 200) throw new Error(`Comparison failed: ${compared.status} ${JSON.stringify(compared.json)}`);
  const j = compared.json;
  ok('risk delta returned', typeof j.riskDelta === 'number', `${j.riskDelta}`);
  ok('risk changes returned', Array.isArray(j.riskChanges), String(j.riskChanges?.length || 0));
  ok('clause changes returned', Array.isArray(j.clauseChanges), String(j.clauseChanges?.length || 0));
  ok('decision returned', Boolean(j.decision?.ru || j.decision?.en));
  if (process.exitCode) process.exit(process.exitCode);
  console.log('contract-comparison-check OK');
} finally {
  if (child) child.kill('SIGTERM');
}
