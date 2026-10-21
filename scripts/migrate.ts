import { config } from 'dotenv';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });
if (!process.env.DIRECT_URL) {
  console.error('DIRECT_URL must be configured privately before applying migrations.');
  process.exit(1);
}
const child = spawn(process.execPath, [resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
function redact(value: unknown) { return String(value).replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[REDACTED_DATABASE_URL]'); }
child.stdout.on('data', (value) => process.stdout.write(redact(value)));
child.stderr.on('data', (value) => process.stderr.write(redact(value)));
child.once('error', () => { console.error('Migration process could not start.'); process.exitCode = 1; });
child.once('exit', (code) => { process.exitCode = code ?? 1; });
