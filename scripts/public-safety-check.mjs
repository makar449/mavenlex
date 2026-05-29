import fs from 'node:fs';

const checks = [
  ['src/main.jsx', ['TEST LAUNCH FEEDBACK', 'mock checkout активировал', 'Mock checkout creates', 'preview-отчёт', 'Create backend account']],
];

let failed = false;
for (const [file, forbidden] of checks) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  for (const phrase of forbidden) {
    if (text.includes(phrase)) {
      console.error(`Public safety check failed: ${file} contains "${phrase}"`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Public safety check passed.');
