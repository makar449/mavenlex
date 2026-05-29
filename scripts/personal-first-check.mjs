import fs from 'node:fs';
const main = fs.readFileSync('src/main.jsx','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const forbiddenVisible = ['/workspace-required', "'/team'", 'Team Workspace', 'Create workspace', 'Create a workspace first', 'Set up your workspace'];
for (const marker of forbiddenVisible) {
  if (main.includes(marker)) throw new Error(`Visible workspace/team marker still present: ${marker}`);
}
if (pkg.scripts['workspace-check'] || pkg.scripts['team-check']) throw new Error('Legacy workspace/team checks are still exposed.');
console.log('[personal-first-check] Personal-first UX verified');
