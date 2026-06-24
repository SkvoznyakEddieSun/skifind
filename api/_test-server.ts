/**
 * Local test server — NOT deployed (Vercel ignores files prefixed with _).
 * Mimics the Vercel Function routing so curl tests work locally.
 *
 * Usage:
 *   npx tsx api/_test-server.ts
 *   curl -X POST http://localhost:3001/api/auth/request-code -H 'Content-Type: application/json' -d '{"phone":"+79991234567"}'
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { requestCode } from './_lib/auth';
import { verifyCode } from './_lib/auth';

// Load .env.local (Node ≥20.6 --env-file flag works too, but this is portable)
try {
  const raw = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  console.warn('[test-server] .env.local not found — set env vars manually');
}

async function readBody(req: IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c: Buffer) => { buf += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(buf || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(json);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method Not Allowed' });

  let body: Record<string, string>;
  try { body = await readBody(req); }
  catch { return send(res, 400, { ok: false, error: 'Invalid JSON' }); }

  const url = req.url ?? '/';

  if (url === '/api/auth/request-code') {
    const result = await requestCode(body.phone ?? '');
    const status = result.ok ? 200 : result.code === 'RATE_LIMITED' ? 429 : 400;
    return send(res, status, result);
  }

  if (url === '/api/auth/verify') {
    const result = await verifyCode(body.phone ?? '', body.code ?? '');
    return send(res, result.ok ? 200 : 400, result);
  }

  send(res, 404, { ok: false, error: 'Not Found' });
});

server.listen(3001, () => {
  console.log('Test server → http://localhost:3001');
  console.log('  POST /api/auth/request-code  { "phone": "+79991234567" }');
  console.log('  POST /api/auth/verify        { "phone": "...", "code": "..." }');
});
