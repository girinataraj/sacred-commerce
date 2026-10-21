import 'server-only';
import type { PrismaClient } from '../../generated/prisma/client';
import { EntryError } from './errors';
export async function assertRuntimeDatabase(db: PrismaClient): Promise<void> {
  const rights=await db.$queryRaw<{ allowed:boolean }[]>`
    SELECT (NOT r.rolsuper AND NOT r.rolbypassrls AND NOT r.rolcreaterole AND NOT r.rolcreatedb
      AND pg_has_role(current_user,'commerce_app','MEMBER')
      AND NOT has_schema_privilege(current_user,'commerce','CREATE')
      AND NOT has_schema_privilege(current_user,'auth','USAGE')
      AND NOT has_column_privilege(current_user,'commerce."Profile"','role','UPDATE')
      AND NOT has_column_privilege(current_user,'commerce."Profile"','role','INSERT')) AS allowed
    FROM pg_roles r WHERE r.rolname=current_user`;
  if (!rights[0]?.allowed) throw new EntryError(503);
}
