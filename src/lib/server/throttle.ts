import 'server-only';
import type { PrismaClient, Prisma } from '../../generated/prisma/client';
import { assertActor, type Actor } from './identity-core';
import { EntryError } from './errors';
import { isSerializationConflict } from './transaction-conflicts';
export async function consumeCheckoutRequest(db: PrismaClient | Prisma.TransactionClient, actor: Actor, now = new Date(), limit = 10) {
  assertActor(actor);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isFinite(now.getTime())) throw new EntryError(503);
  const windowStart = new Date(Math.floor(now.getTime() / 60000) * 60000);
  try {
    const result = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO commerce."RequestBucket"("userId",action,"windowStart",count,"updatedAt")
      VALUES (${actor.userId}::uuid,'checkout',${windowStart},1,${now})
      ON CONFLICT ("userId",action,"windowStart") DO UPDATE
      SET count=LEAST(commerce."RequestBucket".count+1,${limit + 1}),"updatedAt"=${now}
      RETURNING count`;
    if (!result[0]) throw new EntryError(503);
    const allowed = result[0].count <= limit;
    return { allowed, retryAfter: allowed ? 0 : Math.ceil((windowStart.getTime() + 60000 - now.getTime()) / 1000) };
  } catch(error) {
    // The caller's Serializable transaction must retry the WHOLE attempt,
    // including this bucket write, rather than lose its conflict identity.
    if(isSerializationConflict(error))throw error;
    throw new EntryError(503);
  }
}
