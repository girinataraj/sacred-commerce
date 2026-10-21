'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import LogoutButton from '../app/login/logout-button';
import { subscribeAuthChanges } from '../lib/auth-events';
export default function AuthControls({ onNavigate,onSignedOut }: { onNavigate?:()=>void; onSignedOut?:()=>void }) {
  const [signedIn,setSignedIn]=useState(false),[admin,setAdmin]=useState(false);
  useEffect(() => {
    const controller=new AbortController();
    let generation=0;
    const refresh=()=>{const current=++generation;void fetch('/api/auth/session',{ cache:'no-store',signal:controller.signal })
      .then(async response => {const value=response.ok?await response.json():null;if(!controller.signal.aborted&&current===generation){setSignedIn(response.ok);setAdmin(value?.data?.actor?.role==='ADMIN');}})
      .catch(() => {});
    };
    refresh();const unsubscribe=subscribeAuthChanges(refresh);
    return () => {controller.abort();unsubscribe();};
  },[]);
  // UI visibility is convenience only; all authority stays on the server.
  return <nav aria-label="Account" className="mt-6">{signedIn ? <><Link href="/account" onClick={onNavigate} className="inline-flex min-h-11 items-center underline mr-4">My account</Link>{admin&&<Link href="/admin" onClick={onNavigate} className="inline-flex min-h-11 items-center underline mr-4">Administration</Link>}<LogoutButton onSignedOut={() => { setSignedIn(false);setAdmin(false); onSignedOut?.(); }} /></> : <Link href="/login" onClick={onNavigate} className="inline-flex min-h-11 items-center underline">Sign in</Link>}</nav>;
}
