import fs from 'fs';
const server = fs.readFileSync('server.js','utf8');
const main = fs.readFileSync('src/main.jsx','utf8');
for (const marker of ['CLAUSE_LIBRARY','/api/clauses/readiness','/api/clauses/library','/api/clauses/recommend','suggestClauses']) {
  if (!server.includes(marker)) throw new Error(`Missing clause marker: ${marker}`);
}
for (const marker of ['ClauseLibraryPage','/clauses','Библиотека юридических пунктов']) {
  if (!main.includes(marker)) throw new Error(`Missing clause frontend marker: ${marker}`);
}
console.log('clause-library-check OK');
