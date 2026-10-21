// Test process entrypoint only. Never imported by application code or used in
// normal next dev/start. The actual SSR SDK still performs getUser verification.
if (process.env.CART_BROWSER_TEST_OWNED !== 'true') throw Error('Owned cart browser test required');
const provider = new URL(process.env.CART_TEST_PROVIDER_URL ?? '');
if (provider.protocol !== 'http:' || provider.hostname !== '127.0.0.1' || !provider.port) throw Error('Loopback test provider required');
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.hostname === 'sacred-cart-test.supabase.co' && url.protocol === 'https:') {
    const target = new URL(url.pathname + url.search, provider);
    return originalFetch(input instanceof Request ? new Request(target, input) : target, init);
  }
  return originalFetch(input, init);
};
