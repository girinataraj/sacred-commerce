import type { Client } from 'pg';
import { z } from 'zod';
export type DemoSubjects = { customerA: string; customerB: string; admin: string };
export async function provisionDemoProfiles(client: Client, subjects: DemoSubjects): Promise<void> {
  const ids=Object.values(subjects);
  if (ids.length!==3 || new Set(ids).size!==3 || ids.some(id => !z.uuid().safeParse(id).success)) throw new Error('Provide three distinct Auth UUIDs.');
  const records=[
    { id:subjects.customerA,email:'customer-a@example.test',role:'CUSTOMER' },
    { id:subjects.customerB,email:'customer-b@example.test',role:'CUSTOMER' },
    { id:subjects.admin,email:'admin@example.test',role:'ADMIN' },
  ];
  await client.query('BEGIN');
  try {
    const users=await client.query('SELECT id,email FROM auth.users WHERE id=ANY($1::uuid[]) FOR SHARE',[ids]);
    if (records.some(record => !users.rows.some(user => user.id===record.id && user.email===record.email))) throw new Error('Auth users must exactly match the three synthetic demo emails.');
    for (const record of records) await client.query('INSERT INTO commerce."Profile"(id,role,"updatedAt") VALUES ($1,$2,NOW()) ON CONFLICT (id) DO UPDATE SET role=EXCLUDED.role,"updatedAt"=NOW()',[record.id,record.role]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}
