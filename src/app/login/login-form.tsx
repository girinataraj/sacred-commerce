'use client';
import { useRef, useState, type FormEvent } from 'react';
import { loginSchema, safeReturnPath } from '../../lib/auth-contract';
import { useRouter } from 'next/navigation';
import { notifyAuthChange } from '../../lib/auth-events';
export default function LoginForm({ next }: { next: string }) {
  const [pending,setPending]=useState(false);
  const [message,setMessage]=useState('');
  const email=useRef<HTMLInputElement>(null);
  const router=useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form=event.currentTarget;
    const fields=new FormData(form);
    const parsed=loginSchema.safeParse({ email:fields.get('email'),password:fields.get('password'),next });
    if (!parsed.success) { setMessage('Enter a valid email and password to sign in.'); email.current?.focus(); return; }
    setPending(true); setMessage('');
    try {
      const response=await fetch('/api/auth/login',{ method:'POST',headers:{ 'Content-Type':'application/json' },body:JSON.stringify(parsed.data),signal:AbortSignal.timeout(15000) });
      const data=await response.json();
      if (!response.ok) { setMessage(data.error?.message ?? 'Sign-in failed. Please try again.'); return; }
      // Server-produced path; this component never authorizes identity or role.
      notifyAuthChange('SIGNED_IN');
      router.replace(safeReturnPath(data.data?.next)); router.refresh();
    } catch { setMessage('Sign-in could not be completed. Check your connection and try again.'); }
    finally { (form.elements.namedItem('password') as HTMLInputElement).value=''; setPending(false); }
  }
  return <form onSubmit={submit} noValidate className="mt-8 space-y-5" aria-busy={pending}>
    <div><label htmlFor="email">Email</label><input ref={email} id="email" name="email" type="email" autoComplete="username" required maxLength={254} className="mt-1 block min-h-11 w-full rounded border p-3" aria-describedby={message ? 'login-error' : undefined} /></div>
    <div><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} className="mt-1 block min-h-11 w-full rounded border p-3" aria-describedby={message ? 'login-error' : undefined} /></div>
    {message && <p id="login-error" role="alert">{message}</p>}
    <button type="submit" disabled={pending} className="min-h-11 rounded border px-6 py-3 disabled:opacity-60">{pending ? 'Signing in…' : 'Sign in'}</button>
  </form>;
}
