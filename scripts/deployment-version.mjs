import fs from 'fs';
import path from 'path';

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const server = fs.readFileSync(path.join(process.cwd(), 'server.js'), 'utf8');
const versionMatch = server.match(/const APP_VERSION = '([^']+)'/);
const distExists = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));

console.log('MavenLex deployment version check');
console.log(`package.json: ${pkg.version}`);
console.log(`server APP_VERSION: ${versionMatch?.[1] || 'not found'}`);
console.log(`dist/index.html: ${distExists ? 'exists' : 'missing'}`);
console.log('Local development URL: http://localhost:5173');
console.log('Backend health URL: http://localhost:3001/api/health');
console.log('Production/local single-server URL after build: http://localhost:3001');

if (!distExists) {
  console.log('\nRun npm run build before production deploy or before opening the single-server backend page.');
}
