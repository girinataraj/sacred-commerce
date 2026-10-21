export function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Public Supabase configuration is unavailable.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co') || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('Public Supabase configuration is invalid.');
  return { url: parsed.origin, key };
}
