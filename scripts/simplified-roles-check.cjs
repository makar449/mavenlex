const fs = require('fs');
const server = fs.readFileSync('server.js','utf8');
const app = fs.readFileSync('src/main.jsx','utf8');
const required = [
  ['PRODUCT_ROLES', server.includes("const PRODUCT_ROLES = ['user', 'local_admin', 'owner']")],
  ['local_admin backend', server.includes('local_admin')],
  ['owner protected downgrade', server.includes('Нельзя понизить владельца')],
  ['owner protected delete', server.includes('Владелец не может удалить owner-аккаунт')],
  ['frontend three roles', app.includes("value:'local_admin'") && !app.includes("value:'analyst'") && !app.includes("value:'manager'") && !app.includes("value:'billing'")],
  ['owner protection hint', app.includes('владельца нельзя заблокировать')]
];
const failed = required.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('Simplified role check failed:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}
console.log('Simplified role model OK: user, local_admin, owner with owner protection.');
