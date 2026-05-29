import fs from 'fs';
const server = fs.readFileSync('server.js','utf8');
const main = fs.readFileSync('src/main.jsx','utf8');
for (const marker of ['REWRITE_ASSISTANT_ENABLED','/api/rewrite/readiness','/api/rewrite/clause','rewriteClause','rewriteJobs']) {
  if (!server.includes(marker)) throw new Error(`Missing rewrite marker: ${marker}`);
}
for (const marker of ['RewriteAssistantPage','/rewrite','AI-помощник по правкам договора']) {
  if (!main.includes(marker)) throw new Error(`Missing rewrite frontend marker: ${marker}`);
}
console.log('rewrite-assistant-check OK');
