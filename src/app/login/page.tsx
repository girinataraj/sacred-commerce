import { safeReturnPath } from '../../lib/auth-contract';
import LoginForm from './login-form';
import Link from 'next/link';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next }=await searchParams;
  return <main id="main-content" tabIndex={-1} className="login-page">
    <Link href="/" className="underline">Sacred Commerce</Link>
    <h1 className="mt-8 text-3xl">Sign in to Sacred Commerce</h1>
    <p className="mt-4">Independent interview demo. Use only your privately provided demo account.</p>
    <LoginForm next={safeReturnPath(next)} />
    <p className="mt-6 text-sm">Public registration is unavailable. Ask the demo owner for account access through a private channel.</p>
  </main>;
}
