import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabase } from './lib/supabase/server';
import { demoApiBlocked } from './features/demo/model';
export async function proxy(request: NextRequest) {
  const pathname=request.nextUrl.pathname;
  if(process.env.SACRED_DEMO_MODE==='true') {
    if(demoApiBlocked(true,pathname))return NextResponse.json({error:'Backend APIs, authentication and database operations are disabled in this self-contained demo.'},{status:503,headers:{'Cache-Control':'no-store'}});
    if(pathname.startsWith('/_next/')||pathname.startsWith('/fonts/')||pathname.startsWith('/editorial/')||/^\/products\/[a-z0-9-]+\.(svg|png|webp|jpg)$/.test(pathname)||pathname==='/favicon.ico')return NextResponse.next();
    if(!['GET','HEAD'].includes(request.method))return new NextResponse('Demo mode is read-only on the server.',{status:405});
    if(pathname==='/demo')return NextResponse.next();
    const url=request.nextUrl.clone();url.pathname='/demo';url.searchParams.set('__demoPath',pathname);
    return NextResponse.rewrite(url,{headers:{'Cache-Control':'no-store'}});
  }
  // Preserve the original Auth-refresh scope when the isolated demo is off.
  if(!/^\/(login|account|orders|cart|checkout|admin|api)(\/|$)/.test(pathname))return NextResponse.next();
  // Unsafe methods validate origin/body in their handler before touching Auth.
  if (!['GET','HEAD'].includes(request.method)) return NextResponse.next();
  try {
    const context = createRequestSupabase(request);
    await context.client.auth.getUser();
    return context.apply(NextResponse.next({ request: { headers: request.headers } }));
  } catch {
    // No identity is granted here. Every protected service verifies again.
    const response = NextResponse.next();
    response.headers.set('Cache-Control','private, no-store');
    return response;
  }
}
export const config = { matcher: ['/:path*'] };
