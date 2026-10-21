'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { ErrorPanel } from '../../components/ui/feedback';
export function CatalogueFailure({title='Products could not be loaded'}:{title?:string}) {
  const router=useRouter(); const [pending,startTransition]=useTransition();
  return <section className="catalogue-recovery"><h2 className="sr-only">Product service status</h2><ErrorPanel title={title} action={<Button pending={pending} onClick={()=>startTransition(()=>router.refresh())}>{pending ? 'Retrying catalogue…':'Retry catalogue'}</Button>}>Product data is temporarily unavailable. Your search stays in the address bar. Please try again.</ErrorPanel></section>;
}
