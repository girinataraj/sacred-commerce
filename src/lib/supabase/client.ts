'use client';
import { createBrowserClient } from '@supabase/ssr';
import { publicSupabaseConfig } from './config';
// Public anonymous SDK only. HttpOnly identity is owned by server endpoints;
// this browser client must never supply a session or authorize commerce access.
export function createPublicBrowserSupabase() {
  const { url, key } = publicSupabaseConfig();
  return createBrowserClient(url,key,{ isSingleton: false, auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}
