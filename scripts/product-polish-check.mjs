import fs from 'node:fs';
const src = fs.readFileSync('src/main.jsx','utf8');
const required = ['FIRST USEFUL ACTION','PROFESSIONAL REPORT','NEGOTIATION MODE','PERSONAL NOTES','FAVORITES','OWNER SYSTEM STATUS','ARTICLE KNOWLEDGE BASE'];
const missing = required.filter(x => !src.includes(x));
if (missing.length) { console.error('Missing v6.1.1 polish blocks:', missing.join(', ')); process.exit(1); }
console.log('v6.1.1 product polish check passed');
