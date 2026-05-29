import fs from 'fs';
const server = fs.readFileSync('server.js','utf8');
for (const marker of ['FILE_STORAGE_MODE','/api/storage/readiness','/api/user/files','/api/storage/cleanup','maybeStoreUploadedFile','cleanupExpiredFiles']) {
  if (!server.includes(marker)) throw new Error(`Missing storage marker: ${marker}`);
}
console.log('storage-check OK');
