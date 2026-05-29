import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'package.json',
  'server.js',
  'index.html',
  'src/main.jsx',
  'src/styles.css',
  '.env.example',
  'test-contracts/test_contract.txt'
];

let ok = true;
console.log('MavenLex doctor check');
console.log('Node:', process.version);
console.log('Project:', root);

for (const file of required) {
  const exists = fs.existsSync(path.join(root, file));
  console.log(`${exists ? 'OK ' : 'MISS'} ${file}`);
  if (!exists) ok = false;
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const requiredDeps = ['express', 'vite', 'react', 'react-dom', 'multer', 'mammoth', 'pdfjs-dist', 'concurrently'];
for (const dep of requiredDeps) {
  const exists = Boolean(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]);
  console.log(`${exists ? 'OK ' : 'MISS'} dependency ${dep}`);
  if (!exists) ok = false;
}

const envExists = fs.existsSync(path.join(root, '.env'));
console.log(`${envExists ? 'OK ' : 'INFO'} .env ${envExists ? 'exists' : 'not found - local MVP still works without it'}`);

if (!ok) {
  console.error('Doctor check failed. Fix missing files/dependencies before release.');
  process.exit(1);
}
console.log('Doctor check passed.');
