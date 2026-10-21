import 'server-only';
import { createServerSupabase } from '../supabase/server';
import { getDb } from './db';
import { createIdentityService, type Actor } from './identity-core';
import { EntryError } from './errors';
export { type Actor } from './identity-core';
export async function requireActor(): Promise<Actor> {
  try { const client = await createServerSupabase(); return await createIdentityService(() => client.auth.getUser(),getDb()).requireActor(); }
  catch (error) { if (error instanceof EntryError) throw error; throw new EntryError(503); }
}
export async function requireAdmin(actor: Actor): Promise<void> {
  return createIdentityService(async () => ({ data: { user: null },error: null }),getDb()).requireAdmin(actor);
}
export function assertOwnership(actor: Actor, ownerId: string): void {
  return createIdentityService(async () => ({ data: { user: null },error: null }),getDb()).assertOwnership(actor,ownerId);
}
