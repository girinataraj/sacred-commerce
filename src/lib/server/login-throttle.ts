import 'server-only';
import type { PrismaClient } from '../../generated/prisma/client';
import { createHmac } from 'node:crypto';
import { EntryError } from './errors';
import { assertRuntimeDatabase } from './runtime-access';
export async function consumeLoginRequest(db: PrismaClient, email: string, now=new Date()) {
  const secret=process.env.AUTH_THROTTLE_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret) || !Number.isFinite(now.getTime())) throw new EntryError(503);
  const hash=(value: string) => createHmac('sha256',secret).update(value).digest('hex');
  const windowStart=new Date(Math.floor(now.getTime()/60000)*60000);
  const retryAfter=Math.ceil((windowStart.getTime()+60000-now.getTime())/1000);
  try {
    await assertRuntimeDatabase(db);
    return await db.$transaction(async tx => {
      // Global row first gives stable lock order and limits new-key growth.
      for (const [key,limit] of [[hash('global-login'),30],[hash('account:'+email.trim().toLowerCase()),5]] as const) {
        const rows=await tx.$queryRaw<{ count:number }[]>`
          INSERT INTO commerce."LoginRequestBucket"("keyHash","windowStart",count,"updatedAt")
          VALUES (${key},${windowStart},1,${now})
          ON CONFLICT ("keyHash","windowStart") DO UPDATE
          SET count=LEAST(commerce."LoginRequestBucket".count+1,${limit+1}),"updatedAt"=${now}
          RETURNING count`;
        if (!rows[0]) throw new EntryError(503);
        if (rows[0].count>limit) return { allowed:false,retryAfter };
      }
      return { allowed:true,retryAfter:0 };
    });
  } catch { throw new EntryError(503); }
}
