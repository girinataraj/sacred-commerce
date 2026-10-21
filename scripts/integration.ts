import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve, relative, isAbsolute } from 'node:path';
import { spawn } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';
import { testActors } from '../tests/support/actors';
import { startCartAuthProvider } from '../tests/support/cart-auth-provider';
import { startCartTlsProxy } from '../tests/support/cart-tls-proxy';

// This runner never consumes TEST_DATABASE_URL from a caller. It owns a new
// loopback-only cluster and cannot reset an external/demo/release database.
const root = resolve('.local/integration');
const directory = resolve(root, randomUUID());
const ownedPath = relative(root, directory);
if (!ownedPath || ownedPath.startsWith('..') || isAbsolute(ownedPath)) throw new Error('Unsafe test directory.');
await mkdir(directory, { recursive: true });
const server = createServer();
const port = await new Promise<number>((accept, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    if (!address || typeof address === 'string') return reject(new Error('No free test port.'));
    server.close(() => accept(address.port));
  });
});
const password = randomBytes(32).toString('hex');
const cluster = new EmbeddedPostgres({
  databaseDir: resolve(directory, 'data'), user: 'postgres', password, port,
  persistent: true, authMethod: 'scram-sha-256', createPostgresUser: false,
  postgresFlags: ['-h', '127.0.0.1'], onLog: () => {}, onError: () => {},
});
const url = `postgresql://postgres:${password}@127.0.0.1:${port}/sacred_commerce_test`;
const env: NodeJS.ProcessEnv = { ...process.env, DIRECT_URL: url, DATABASE_URL: url, TEST_DATABASE_URL: url };
function redact(text: string) { return text.replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[REDACTED_DATABASE_URL]'); }
async function run(entry: string, args: string[], childEnv:NodeJS.ProcessEnv=env) {
  return new Promise<number>((accept, reject) => {
    const child = spawn(process.execPath, [resolve(entry), ...args], { env:childEnv, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    child.stdout.on('data', (chunk) => process.stdout.write(redact(String(chunk))));
    child.stderr.on('data', (chunk) => process.stderr.write(redact(String(chunk))));
    child.once('error', reject);
    child.once('exit', (code) => accept(code ?? 1));
  });
}
let started = false;
let cartProvider:Awaited<ReturnType<typeof startCartAuthProvider>>|undefined;
let cartTls:Awaited<ReturnType<typeof startCartTlsProxy>>|undefined;
try {
  await cluster.initialise();
  await cluster.start();
  started = true;
  await cluster.createDatabase('sacred_commerce_test');
  const client = new Client({ connectionString: url });
  await client.connect();
  // Explicit test-only Auth FK fixture; this does not emulate Supabase Auth
  // tokens, passwords, API or customer/admin login provisioning.
  await client.query('CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY, email text); CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN');
  const version = await client.query('SHOW server_version');
  console.log(`Disposable real PostgreSQL ${version.rows[0].server_version}; loopback-only; synthetic Auth FK fixture.`);
  await client.end();
  for (let attempt = 0; attempt < 2; attempt++) {
    const code = await run('node_modules/prisma/build/index.js', ['migrate', 'deploy']);
    if (code !== 0) throw new Error(`Migration deploy failed (${code}).`);
  }
  const fixtureClient = new Client({ connectionString: url });
  await fixtureClient.connect();
  const runtimePassword = randomBytes(32).toString('hex');
  const roleSql = await fixtureClient.query("SELECT format('CREATE ROLE commerce_test_login LOGIN INHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD %L', $1::text) AS sql", [runtimePassword]);
  await fixtureClient.query(roleSql.rows[0].sql);
  await fixtureClient.query('GRANT commerce_app TO commerce_test_login');
  Object.assign(env, { TEST_APP_DATABASE_URL: `postgresql://commerce_test_login:${runtimePassword}@127.0.0.1:${port}/sacred_commerce_test` });
  for (const actor of testActors) {
    await fixtureClient.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)', [actor.id, `actor-${actor.id.slice(-1)}@example.test`]);
    await fixtureClient.query('INSERT INTO commerce."Profile"(id,role,"updatedAt") VALUES ($1,$2,NOW())', [actor.id, actor.role]);
  }
  await fixtureClient.end();
  // Exercise the documented Prisma seed CLI wiring as well as the callable
  // repeat/history tests, using only this runner's isolated connection.
  for (let attempt = 0; attempt < 2; attempt++) {
    const code = await run('node_modules/prisma/build/index.js', ['db', 'seed']);
    if (code !== 0) throw new Error(`Catalogue seed CLI failed (${code}).`);
  }
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--evidence='));
  const evidence = process.argv.slice(2).find((arg) => arg.startsWith('--evidence='))?.split('=')[1];
  const vitestArgs = ['run', '--config', 'vitest.integration.config.ts', ...args];
  if (evidence) {
    if (!/^[a-z0-9-]+$/i.test(evidence)) throw new Error('Invalid evidence name.');
    await mkdir('docs/qa/evidence', { recursive: true });
    vitestArgs.push('--reporter=default', '--reporter=json', `--outputFile=docs/qa/evidence/${evidence}.json`);
  }
  if (process.argv.includes('--cart-browser')) {
    cartProvider=await startCartAuthProvider();
    if(process.env.CART_PRODUCTION==='true')cartTls=await startCartTlsProxy(directory);
    const cartEnv:NodeJS.ProcessEnv={...env,DATABASE_URL:env.TEST_APP_DATABASE_URL,CART_FIXTURE_DATABASE_URL:url,CART_BROWSER_TEST_OWNED:'true',CART_TEST_PROVIDER_URL:cartProvider.url,CART_TEST_PASSWORD:cartProvider.password,CART_TEST_THROTTLE_SECRET:randomBytes(32).toString('hex')};
    delete cartEnv.DIRECT_URL;delete cartEnv.TEST_DATABASE_URL;delete cartEnv.TEST_APP_DATABASE_URL;
    cartEnv.CART_TEST_APP_ORIGIN=cartTls?.origin??'http://127.0.0.1:3103';
    process.exitCode=await run('node_modules/@playwright/test/cli.js',['test','--config','playwright.cart.config.ts',...args.filter(arg=>arg!=='--cart-browser')],cartEnv);
  } else if (process.argv.includes('--storefront')) {
    // Same owned disposable cluster/cleanup; browser app uses the existing
    // least-privilege runtime login, never migration-owner credentials.
    const browserEnv:NodeJS.ProcessEnv={...env,DATABASE_URL:env.TEST_APP_DATABASE_URL,STOREFRONT_LOCK_DATABASE_URL:url,STOREFRONT_TEST_OWNED:'true'};
    delete browserEnv.DIRECT_URL; delete browserEnv.TEST_DATABASE_URL; delete browserEnv.TEST_APP_DATABASE_URL;
    const browserFixtures=new Client({connectionString:url});
    await browserFixtures.connect();
    // One inactive record in this owned test DB proves HTTP/UI exclusion.
    // Active original product facts and the production seed are untouched.
    await browserFixtures.query(`INSERT INTO commerce."Product" (id,"categoryId",sku,slug,name,description,"imagePath","imageAlt","pricePaise","compareAtPricePaise",material,dimensions,care,"includedContents","occasionTags","intentTags",stock,version,active,featured,"updatedAt")
      SELECT gen_random_uuid(),"categoryId",'TEST-INACTIVE','hidden-browser-fixture','Hidden Browser Fixture',description,"imagePath","imageAlt","pricePaise",NULL,material,dimensions,care,"includedContents","occasionTags","intentTags",0,0,false,false,NOW() FROM commerce."Product" WHERE slug='neem-wood-comb'`);
    await browserFixtures.end();
    process.exitCode = await run('node_modules/@playwright/test/cli.js', ['test','--config','playwright.storefront.config.ts',...args.filter(arg=>arg!=='--storefront')],browserEnv);
  } else {
    process.exitCode = await run('node_modules/vitest/vitest.mjs', vitestArgs);
  }
  await writeFile(resolve(directory, 'result.json'), JSON.stringify({ exitCode: process.exitCode, credentialsLogged: false }));
} catch (error) {
  console.error(redact(error instanceof Error ? error.message : 'Integration setup failed.'));
  process.exitCode = 1;
} finally {
  if(cartTls)await cartTls.close();
  if(cartProvider)await cartProvider.close();
  if (started) await cluster.stop();
  // Absolute target is validated against our intended root before recursion.
  const cleanupPath = relative(root, directory);
  if (!cleanupPath || cleanupPath.startsWith('..') || isAbsolute(cleanupPath)) throw new Error('Refusing unsafe cleanup.');
  await rm(directory, { recursive: true, force: true });
}
// embedded-postgres registers a beforeExit hook with code0. Explicit exit after
// awaited cleanup preserves Vitest's nonzero code instead of a false-green CI.
process.exit(process.exitCode ?? 0);
