import 'server-only';
import type { PrismaClient } from '../../generated/prisma/client';
import { EntryError } from './errors';
import { assertRuntimeDatabase } from './runtime-access';
export type VerifiedUserResult = { data: { user: { id: string } | null }; error: { status?: number } | null };
export type Actor = Readonly<{ userId: string; role: 'CUSTOMER' | 'ADMIN' }>;
const issued = new WeakSet<object>();
export function assertActor(actor: Actor): void { if (!issued.has(actor)) throw new EntryError(401); }
export function createIdentityService(verify: () => Promise<VerifiedUserResult>, db: PrismaClient) {
  return {
    async requireActor(): Promise<Actor> {
      try {
        const result = await verify();
        if (result.error) throw new EntryError(result.error.status && result.error.status < 500 ? 401 : 503);
        const id = result.data.user?.id;
        if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new EntryError(401);
        await assertRuntimeDatabase(db);
        // Role deliberately omitted: DB default + column grants protect it.
        await db.$executeRaw`INSERT INTO commerce."Profile"(id,"updatedAt") VALUES (${id}::uuid,NOW()) ON CONFLICT (id) DO NOTHING`;
        const profile = await db.profile.findUnique({ where: { id }, select: { id: true, role: true } });
        if (!profile) throw new EntryError(503);
        const actor = Object.freeze({ userId:profile.id,role:profile.role });
        issued.add(actor);
        return actor;
      } catch (error) { if (error instanceof EntryError) throw error; throw new EntryError(503); }
    },
    async requireAdmin(actor: Actor): Promise<void> {
      assertActor(actor);
      try {
        const profile = await db.profile.findUnique({ where: { id: actor.userId }, select: { role: true } });
        if (profile?.role !== 'ADMIN') throw new EntryError(403);
      } catch (error) { if (error instanceof EntryError) throw error; throw new EntryError(503); }
    },
    assertOwnership(actor: Actor, ownerId: string): void {
      assertActor(actor);
      if (actor.userId !== ownerId) throw new EntryError(404);
    },
  };
}
