import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginSchema, safeReturnPath } from '../../src/lib/auth-contract';
import { readMutationJson } from '../../src/lib/server/origin';

afterEach(() => vi.unstubAllEnvs());
describe('safe login return navigation', () => {
  it('preserves a valid local product return path', () => expect(safeReturnPath('/products/lamp?quantity=2')).toBe('/products/lamp?quantity=2'));
  it.each(['//evil.test', 'https://evil.test', '/\\evil', '/%2fevil', '/%5cevil', '/login?next=/login', '/api/auth/login', '/x\nY'])('rejects %s', (path) => expect(safeReturnPath(path)).toBe('/'));
});
describe('credential contract', () => {
  it('rejects malformed credentials', () => expect(loginSchema.safeParse({ email: 'wrong', password: '' }).success).toBe(false));
  it('rejects client privilege fields', () => expect(loginSchema.safeParse({ email: 'customer@example.test', password: 'synthetic', role: 'ADMIN', userId: 'other' }).success).toBe(false));
});
describe('same-origin bounded JSON mutations', () => {
  const request = (body: string, origin = 'http://127.0.0.1:3100', contentType = 'application/json', extra = {}) => new Request('http://127.0.0.1:3100/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': contentType, ...extra }, body });
  it('accepts JSON at configured origin', async () => { vi.stubEnv('APP_ORIGIN', 'http://127.0.0.1:3100'); expect(await readMutationJson(request('{"next":"/"}'))).toEqual({ next: '/' }); });
  it.each(['https://evil.test', 'null', ''])('rejects foreign or missing origin %s', async (origin) => { vi.stubEnv('APP_ORIGIN', 'http://127.0.0.1:3100'); await expect(readMutationJson(request('{}', origin))).rejects.toMatchObject({ status: 403 }); });
  it('rejects wrong content type', async () => { await expect(readMutationJson(request('{}', undefined, 'text/plain'))).rejects.toMatchObject({ status: 415 }); });
  it('rejects malformed JSON', async () => { await expect(readMutationJson(request('{'))).rejects.toMatchObject({ status: 400 }); });
  it('counts actual bytes even when Content-Length lies', async () => { await expect(readMutationJson(request('"' + 'x'.repeat(64) + '"', undefined, undefined, { 'Content-Length': '2' }), 32)).rejects.toMatchObject({ status: 413 }); });
  it('does not trust forwarded host or arbitrary Host', async () => { vi.stubEnv('APP_ORIGIN', ''); const r = new Request('https://evil.test/api', { method: 'POST', body: '{}', headers: { Origin: 'https://evil.test', 'Content-Type': 'application/json', 'X-Forwarded-Host': '127.0.0.1' } }); await expect(readMutationJson(r)).rejects.toMatchObject({ status: 503 }); });
});
