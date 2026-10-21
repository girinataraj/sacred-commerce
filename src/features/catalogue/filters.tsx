'use client';
import { useEffect,useRef,useState,useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button,ActionLink } from '../../components/ui/button';
import { FormField,SelectField } from '../../components/ui/form-field';
import { Drawer } from '../../components/ui/drawer';
import { catalogueHref,parseCatalogueQuery,priceDraftToPaise,type CatalogueQuery } from './schemas';
import type { CategoryDTO,FilterMetadata } from './types';
type Props={query:CatalogueQuery;path:string;categories:readonly CategoryDTO[];metadata:FilterMetadata;lockedCategory?:boolean;resetHref?:string;resultAnchor?:string};
export function CatalogueControls(props:Props) {
  const focusIntent=useRef<'filters'|'sort'|null>(null); const key=catalogueHref(props.query,props.path);
  useEffect(()=>{
    if(!focusIntent.current) return;
    const trigger=document.querySelector<HTMLButtonElement>('button[aria-label="Open product filters"]');
    const target=focusIntent.current==='sort' ? document.getElementById('sort-products') : trigger && trigger.getClientRects().length ? trigger : document.getElementById('catalogue-result-count');
    target?.focus(); focusIntent.current=null;
  },[key]);
  return <ControlsFrame key={key} {...props} onFocusIntent={(intent,next)=>{focusIntent.current=catalogueHref(next,props.path)===key ? null:intent;}}/>;
}
function ControlsFrame({query,path,categories,metadata,lockedCategory=false,resetHref=path,resultAnchor='',onFocusIntent}:Props & {onFocusIntent:(intent:'filters'|'sort',next:CatalogueQuery)=>void}) {
  const [open,setOpen]=useState(false); const [pending,startTransition]=useTransition(); const router=useRouter();
  const forUrl=(value:Partial<CatalogueQuery>)=>lockedCategory ? {...value,category:undefined}:value;
  const navigate=(value:Partial<CatalogueQuery>)=>startTransition(()=>{router.push(catalogueHref(forUrl(value),path)+resultAnchor);setOpen(false);});
  const chips=[query.q && `Search: ${query.q}`,!lockedCategory && query.category && categories.find(c=>c.slug===query.category)?.name,query.minPricePaise!==undefined && `From ₹${query.minPricePaise/100}`,query.maxPricePaise!==undefined && `To ₹${query.maxPricePaise/100}`,query.occasion,query.intent,query.inStock && 'In stock',query.onOffer && 'Demo offers'].filter(Boolean);
  const formProps={query,path,categories,metadata,lockedCategory,pending,onApply:(next:CatalogueQuery)=>{onFocusIntent('filters',next);navigate(next);}};
  return <>
    <div className="catalogue-toolbar" aria-busy={pending}><Button tone="secondary" className="filter-trigger" aria-label="Open product filters" onClick={()=>setOpen(true)}>Filters{chips.length ? ` (${chips.length})`:''}</Button><SelectField id="sort-products" label="Sort products" value={query.sort} disabled={pending} onChange={event=>{const next={...query,sort:event.target.value as CatalogueQuery['sort'],page:1};onFocusIntent('sort',next);navigate(next);}}><option value="featured">Featured</option><option value="name_asc">Name A–Z</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></SelectField><ActionLink href={resetHref} tone="quiet">Clear filters</ActionLink></div>
    {chips.length>0 && <ul className="filter-chips" aria-label="Applied filters">{chips.map((chip,index)=><li key={index}>{chip}</li>)}</ul>}
    <p role="status" className="filter-progress">{pending ? 'Updating products…':''}</p>
    <aside className="desktop-filters" aria-label="Product filters"><Filters {...formProps} suffix="desktop"/></aside>
    <Drawer open={open} onClose={()=>setOpen(false)} title="Filter products" closeLabel="Close product filters">{open && <Filters {...formProps} suffix="mobile"/>}</Drawer>
  </>;
}
function Filters({query,categories,metadata,lockedCategory,pending,onApply,suffix}:Props & {pending:boolean;onApply:(query:CatalogueQuery)=>void;suffix:string}) {
  const [error,setError]=useState('');
  return <form className="catalogue-filter-form" noValidate onSubmit={event=>{
    event.preventDefault(); setError(''); const form=new FormData(event.currentTarget);
    try {
      const min=priceDraftToPaise(String(form.get('minimum')??'')); const max=priceDraftToPaise(String(form.get('maximum')??''));
      if (min!==undefined && max!==undefined && min>max) throw new Error('Enter a minimum price no greater than the maximum price.');
      const values:Record<string,string>={q:String(form.get('q')??''),category:lockedCategory ? query.category ?? '':String(form.get('category')??''),occasion:String(form.get('occasion')??''),intent:String(form.get('intent')??''),inStock:String(form.has('inStock')),onOffer:String(form.has('onOffer')),sort:query.sort,page:'1',pageSize:String(query.pageSize)};
      if(min!==undefined) values.minPricePaise=String(min); if(max!==undefined) values.maxPricePaise=String(max); if(query.collection) values.collection=query.collection;
      onApply(parseCatalogueQuery(values));
    } catch {setError('Check your filters: enter valid INR amounts and a minimum price no greater than the maximum price.');}
  }}>
    <h2>Refine your choices</h2><FormField id={`catalogue-search-${suffix}`} name="q" label="Search this catalogue" type="search" maxLength={80} defaultValue={query.q}/>
    {!lockedCategory && <SelectField id={`category-${suffix}`} name="category" label="Category filter" defaultValue={query.category??''}><option value="">All categories</option>{categories.map(category=><option key={category.id} value={category.slug}>{category.name}</option>)}</SelectField>}
    <FormField id={`minimum-${suffix}`} name="minimum" label="Minimum price (INR)" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={query.minPricePaise===undefined ? '':query.minPricePaise/100}/>
    <FormField id={`maximum-${suffix}`} name="maximum" label="Maximum price (INR)" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={query.maxPricePaise===undefined ? '':query.maxPricePaise/100}/>
    <SelectField id={`occasion-${suffix}`} name="occasion" label="Occasion" defaultValue={query.occasion??''}><option value="">Any occasion</option>{metadata.occasions.map(value=><option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</SelectField>
    <SelectField id={`intent-${suffix}`} name="intent" label="Purchasing intent" defaultValue={query.intent??''}><option value="">Any intent</option>{metadata.intents.map(value=><option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</SelectField>
    <label className="check-option"><input name="inStock" type="checkbox" defaultChecked={query.inStock}/>In-stock products only</label><label className="check-option"><input name="onOffer" type="checkbox" defaultChecked={query.onOffer}/>Demo offers only</label>
    {error && <p role="alert" className="field-error">{error}</p>}<Button type="submit" pending={pending}>Apply filters</Button><p className="field-hint">Prices and availability come from our demo database. Reference prices are fictional demo comparisons.</p>
  </form>;
}
