import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabase } from '../supabase/server';
import { getDb } from './db';
import { z } from 'zod';
import { loginSchema, safeReturnPath } from '../auth-contract';
import { createIdentityService } from './identity-core';
import { EntryError, errorResponse, successResponse } from './errors';
import { readMutationJson } from './origin';
import { consumeLoginRequest } from './login-throttle';

export function createAuthHandlers(makeContext = createRequestSupabase, database = getDb) {
  type Context = ReturnType<typeof makeContext>;
  function handler(operation: (request: NextRequest, context: () => Context) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      let context: Context | undefined;
      const getContext = () => context ??= makeContext(request);
      try { const response=await operation(request,getContext); return context ? context.apply(response) : response; }
      catch (error) { const response=errorResponse(error); return context ? context.apply(response) : response; }
    };
  }
  function providerFailure(error: { status?: number }) {
    // The SDK error does not expose the provider response's Retry-After header.
    // Use a conservative hint, without claiming to know its exact reset time.
    if (error.status===429) throw new EntryError(429,undefined,60);
    throw new EntryError(error.status && error.status < 500 ? 401 : 503);
  }
  const login=handler(async (request,context) => {
    const parsed=loginSchema.safeParse(await readMutationJson(request));
    if (!parsed.success) throw new EntryError(422);
    const { email,password,next }=parsed.data;
    const { client }=context();
    const db=database();
    const quota=await consumeLoginRequest(db,email);
    if (!quota.allowed) throw new EntryError(429,undefined,quota.retryAfter);
    const result=await client.auth.signInWithPassword({ email,password });
    if (result.error) { if (result.error.status && result.error.status<500 && result.error.status!==429) throw new EntryError(401,'credentials'); providerFailure(result.error); }
    await createIdentityService(() => client.auth.getUser(),db).requireActor();
    return successResponse({ next:safeReturnPath(next) });
  });
  const logout=handler(async (request,context) => {
    if (!z.object({}).strict().safeParse(await readMutationJson(request)).success) throw new EntryError(422);
    // Local session cleanup is allowed even if identity has already expired.
    // No profile, cart, inventory or global Auth-account mutation occurs.
    const result=await context().client.auth.signOut({ scope:'local' });
    if (result.error) providerFailure(result.error);
    return successResponse({ signedOut:true });
  });
  const session=handler(async (_request,context) => {
    const { client }=context();
    const actor=await createIdentityService(() => client.auth.getUser(),database()).requireActor();
    return successResponse({ actor });
  });
  const adminAccess=handler(async (_request,context) => {
    const { client }=context();
    const identity=createIdentityService(() => client.auth.getUser(),database());
    await identity.requireAdmin(await identity.requireActor());
    return successResponse({ authorized:true });
  });
  return { login,logout,session,adminAccess };
}
