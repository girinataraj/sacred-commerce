import { config } from 'dotenv';
import { Client } from 'pg';
import { provisionDemoProfiles } from './lib/provision-demo-profiles';
config({ path:['.env.local','.env'],quiet:true });
let client: Client | undefined;
try {
  if (process.env.DEMO_PROVISION_ENV!=='development' || process.env.DEMO_PROVISION_CONFIRM!=='synthetic-accounts-only' || process.env.NODE_ENV==='production') throw new Error();
  const url=process.env.DIRECT_URL;
  if (!url || !process.env.DEMO_EXPECTED_DB_HOST || new URL(url).hostname!==process.env.DEMO_EXPECTED_DB_HOST) throw new Error();
  client=new Client({ connectionString:url,connectionTimeoutMillis:5000 });
  await client.connect();
  await provisionDemoProfiles(client,{ customerA:process.env.DEMO_CUSTOMER_A_ID ?? '',customerB:process.env.DEMO_CUSTOMER_B_ID ?? '',admin:process.env.DEMO_ADMIN_ID ?? '' });
  console.log('Synthetic Customer A, Customer B and Administrator profiles provisioned. No Auth passwords were read or logged.');
} catch {
  console.error('Demo provisioning refused or failed. Verify the private development target, confirmation fields, migration privileges and exact synthetic Auth users.');
  process.exitCode=1;
} finally { await client?.end(); }
