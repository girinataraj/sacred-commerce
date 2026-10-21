import 'server-only';
import { EntryError } from './errors';

export function trustedOrigin(request: Request): string {
  const configured = process.env.APP_ORIGIN;
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.origin !== configured || url.username || url.password || (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)))) throw new Error();
      return url.origin;
    } catch { throw new EntryError(503); }
  }
  const url = new URL(request.url);
  if (process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)) return url.origin;
  throw new EntryError(503);
}
export async function readMutationJson(request: Request, limit = 4096): Promise<unknown> {
  if (request.headers.get('origin') !== trustedOrigin(request) || request.headers.get('sec-fetch-site') === 'cross-site') throw new EntryError(403);
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new EntryError(415);
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) throw new EntryError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new EntryError(400);
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new EntryError(413); }
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) { if (error instanceof EntryError) throw error; throw new EntryError(400); }
  finally { reader.releaseLock(); }
}
