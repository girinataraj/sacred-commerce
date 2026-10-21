import { notFound } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function ComponentReviewPage() {
  if (process.env.NODE_ENV!=='development') notFound();
  // Gate before loading any synthetic fixture/UI review module.
  const { default:ReviewClient }=await import('./review-client');
  return <ReviewClient />;
}
