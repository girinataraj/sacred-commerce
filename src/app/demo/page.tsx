import {notFound} from 'next/navigation';
import {DemoStore} from '../../features/demo/store';
import type {Metadata} from 'next';
import {demoProducts,demoCategories} from '../../features/demo/model';
import {informationPages} from '../../features/demo/information';
export const dynamic='force-dynamic';
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{
 const params=await searchParams;const path=typeof params.__demoPath==='string'?params.__demoPath:'/';
 const product=demoProducts.find(p=>path===`/products/${p.slug}`);
 const information=informationPages[path as keyof typeof informationPages];
 const titles:Record<string,string>={'/':'Considered living','/products':'All offerings','/cart':'Your guest cart','/checkout':'Simulated checkout','/collections/navratri-2026':'Navratri 2026'};
 const title=product?.name??information?.eyebrow??demoCategories[path.split('/')[2]]??titles[path]??'Guest demo';
 return {title:`${title} · Sacred Commerce demo`};
}
export default async function DemoPage({searchParams}:Props){
 if(process.env.SACRED_DEMO_MODE!=='true')notFound();
 const params=await searchParams;const query=Object.fromEntries(Object.entries(params).map(([k,v])=>[k,typeof v==='string'?v:'']));
 const path=query.__demoPath||'/';
 const known=['/','/products','/cart','/checkout','/collections/navratri-2026',...Object.keys(informationPages),...Object.keys(demoCategories).map(slug=>`/categories/${slug}`),...demoProducts.map(p=>`/products/${p.slug}`)];
 const guest=['/login','/account','/admin','/orders'].some(prefix=>path===prefix||path.startsWith(`${prefix}/`));
 if(!known.includes(path)&&!guest)notFound();
 return <DemoStore key={query.__demoPath} path={query.__demoPath||'/'} query={query}/>;
}
