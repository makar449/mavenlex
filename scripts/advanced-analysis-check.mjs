import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = process.env.PORT || 3520;
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
        catch (e) { reject(new Error(`Invalid JSON from ${url}: ${body.slice(0, 200)}`)); }
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
try {
  if (startedServer) {
    child = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env: { ...process.env, PORT: String(PORT), DISABLE_LIVE_AI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', d => process.stdout.write(`[api] ${d}`));
    child.stderr.on('data', d => process.stderr.write(`[api] ${d}`));
  }
  await waitForHealth();
  const ready = await requestJson(`${API_URL}/api/ai/advanced-analysis-readiness`);
  if (ready.status !== 200 || !ready.json.features?.includes('risk_matrix')) throw new Error('Advanced analysis readiness failed.');

  const contract = `SERVICE AGREEMENT\nPayment: Client shall pay EUR 2000 after invoice. Late payment penalty is 2% per day.\nTermination: Provider may terminate without notice at any time.\nLiability: Provider is not liable for indirect damages under any circumstances.\nDisputes are governed by the law of Sweden.`;
  const boundary = '----mavenlexadvanced' + Math.random().toString(16).slice(2);
  const bodyParts = [];
  const addField = (name, value) => bodyParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
  const addFile = (name, filename, content) => bodyParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: text/plain\r\n\r\n${content}\r\n`);
  addField('language', 'ru'); addField('jurisdiction', 'Sweden'); addField('contractType', 'Service agreement'); addField('analysisDepth', 'deep'); addFile('contract', 'advanced-test.txt', contract); bodyParts.push(`--${boundary}--\r\n`);
  const body = bodyParts.join('');
  const analyzed = await requestJson(`${API_URL}/api/analyze-contract`, { method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(body) }, body });
  if (analyzed.status !== 200) throw new Error(`Analysis endpoint failed: ${JSON.stringify(analyzed.json)}`);
  const j = analyzed.json;
  for (const key of ['contractIntelligence','riskMatrix','clauseMap','missingClauses','redFlags']) {
    if (!(key in j)) throw new Error(`Missing advanced field: ${key}`);
  }
  if (!Array.isArray(j.clauseMap) || j.clauseMap.length < 3) throw new Error('Clause map is incomplete.');
  if (!j.riskMatrix.financial || !j.riskMatrix.termination) throw new Error('Risk matrix is incomplete.');
  console.log('advanced-analysis-check OK');
} finally {
  if (child) child.kill('SIGTERM');
}
