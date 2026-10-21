import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { provisionDemoProfiles } from '../../scripts/lib/provision-demo-profiles';
const owner = new Client({ connectionString:process.env.TEST_DATABASE_URL });
beforeAll(() => owner.connect()); afterAll(() => owner.end());
it('provisions exactly two synthetic customers and one admin and is replayable', async () => {
  const subjects={ customerA:randomUUID(),customerB:randomUUID(),admin:randomUUID() };
  for (const [key,email] of [['customerA','customer-a@example.test'],['customerB','customer-b@example.test'],['admin','admin@example.test']] as const) await owner.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)',[subjects[key],email]);
  await provisionDemoProfiles(owner,subjects); await provisionDemoProfiles(owner,subjects);
  const profiles=await owner.query('SELECT id,role FROM commerce."Profile" WHERE id=ANY($1::uuid[])',[Object.values(subjects)]);
  expect(profiles.rows).toHaveLength(3);
  expect(profiles.rows.find(r => r.id===subjects.customerA)?.role).toBe('CUSTOMER');
  expect(profiles.rows.find(r => r.id===subjects.customerB)?.role).toBe('CUSTOMER');
  expect(profiles.rows.find(r => r.id===subjects.admin)?.role).toBe('ADMIN');
});
it('rejects real/nonmatching account email before any role change', async () => {
  const subjects={ customerA:randomUUID(),customerB:randomUUID(),admin:randomUUID() };
  for (const [key,email] of [['customerA','customer-a@example.test'],['customerB','real@example.com'],['admin','admin@example.test']] as const) await owner.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)',[subjects[key],email]);
  await expect(provisionDemoProfiles(owner,subjects)).rejects.toThrow();
  expect((await owner.query('SELECT id FROM commerce."Profile" WHERE id=ANY($1::uuid[])',[Object.values(subjects)])).rows).toHaveLength(0);
});
it('rejects reused subjects', async () => { const id=randomUUID(); await expect(provisionDemoProfiles(owner,{ customerA:id,customerB:id,admin:id })).rejects.toThrow(); });
