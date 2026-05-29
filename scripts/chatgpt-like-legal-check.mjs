import fs from 'node:fs';
const server = fs.readFileSync('server.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const required = [
  'chatGptLikeLegalReasoningBlock',
  'inferAnswerDepth',
  'buildAdaptiveAnswerInstruction',
  'shouldRegenerateForChatGptLikeQuality',
  '/api/ai/chatgpt-like-legal-reasoning-check',
  '6.0.3-role-access-visual-polish'
];
const missing = required.filter(x => !server.includes(x));
if (!/^6\.0\.[23]$/.test(pkg.version)) missing.push('package version 6.0.x');
if (missing.length) {
  console.error('ChatGPT-like legal reasoning check failed:', missing.join(', '));
  process.exit(1);
}
console.log('ChatGPT-like legal reasoning check passed.');
