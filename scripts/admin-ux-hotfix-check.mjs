import fs from 'node:fs';
const source = fs.readFileSync('src/main.jsx','utf8');
const css = fs.readFileSync('src/styles.css','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const required = ['Панель управления MavenLex','adminExecutivePage','ADMIN_EMAILS','loadOverview();'];
for (const item of required) {
  if (!source.includes(item) && !css.includes(item)) {
    console.error('Missing admin UX marker:', item);
    process.exit(1);
  }
}
if (source.includes("secondaryItems.push(['/design-system'")) {
  console.error('Design-system link is still exposed in admin nav');
  process.exit(1);
}
if (pkg.version !== '5.9.6') {
  console.error('Expected version 5.9.6, got', pkg.version);
  process.exit(1);
}
console.log('Admin UX hotfix check passed.');
