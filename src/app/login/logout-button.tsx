'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notifyAuthChange } from '../../lib/auth-events';
export default function LogoutButton({ onSignedOut }: { onSignedOut?:()=>void }) {
  const [pending,setPending]=useState(false); const [error,setError]=useState('');
  const router=useRouter();
  async function logout() {
    setPending(true); setError('');
    try {
      const response=await fetch('/api/auth/logout',{ method:'POST',headers:{ 'Content-Type':'application/json' },body:'{}',signal:AbortSignal.timeout(15000) });
      if (!response.ok) { setError('Sign-out could not be completed. Please try again.'); return; }
      onSignedOut?.();
      notifyAuthChange('SIGNED_OUT');
      router.replace('/login'); router.refresh();
    } catch { setError('Check your connection and try signing out again.'); }
    finally { setPending(false); }
  }
  return <div><button onClick={logout} disabled={pending} className="min-h-11 rounded border px-6 py-3">{pending ? 'Signing out…' : 'Sign out'}</button>{error && <p role="alert">{error}</p>}</div>;
}
