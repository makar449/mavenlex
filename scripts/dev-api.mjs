process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.SERVE_FRONTEND = 'false';
process.env.APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

console.log('[dev-api] Backend API mode enabled.');
console.log('[dev-api] Frontend is served by Vite: http://localhost:5173');
console.log('[dev-api] Backend API only: http://localhost:3001/api/health');
console.log('[dev-api] Do not open http://localhost:3001 for the app while developing. It is API-only in dev.');

await import('../server.js');
