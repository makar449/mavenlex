import fs from 'node:fs';
const server = fs.readFileSync('server.js','utf8');
const main = fs.readFileSync('src/main.jsx','utf8');
const css = fs.readFileSync('src/styles.css','utf8');
const must = [
  ['login auto recreate', 'login_auto_recreated_missing_account', server],
  ['article category map', 'articleCategoryMap', main],
  ['article category click', 'pickCategory', main],
  ['dropzone horizontal fix', 'writing-mode:horizontal-tb', css],
  ['topbar nowrap', '.topbarPanel nav', css]
];
const missing = must.filter(([_, token, text]) => !text.includes(token));
if (missing.length) {
  console.error('Missing checks:', missing.map(x => x[0]).join(', '));
  process.exit(1);
}
console.log('v6.1.4 account/AI/layout fix checks passed');
