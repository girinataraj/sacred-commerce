'use client';
import {useSyncExternalStore} from 'react';
import {appearanceKey,normalizeAppearance,type Appearance} from './appearance-model';
const event='demo-appearance';
function snapshot(){return normalizeAppearance(document.documentElement.dataset.demoTheme);}
function subscribe(change:()=>void){
 const storage=(e:StorageEvent)=>{if(e.key===appearanceKey||e.key===null){document.documentElement.dataset.demoTheme=normalizeAppearance(e.key===null?null:e.newValue);change();}};
 window.addEventListener(event,change);window.addEventListener('storage',storage);
 return()=>{window.removeEventListener(event,change);window.removeEventListener('storage',storage);};
}
function apply(mode:Appearance){document.documentElement.dataset.demoTheme=mode;try{localStorage.setItem(appearanceKey,mode);}catch{/* DOM keeps a usable in-memory preference for this page. */}window.dispatchEvent(new Event(event));}
export function AppearanceToggle(){
 const mode=useSyncExternalStore(subscribe,snapshot,()=>'light' as const);
 return <button type="button" className="sc-theme-toggle" role="switch" aria-label="Twilight appearance" aria-checked={mode==='twilight'} onClick={()=>apply(mode==='light'?'twilight':'light')}><span data-active={mode==='light'}>Light</span><span aria-hidden="true">/</span><span data-active={mode==='twilight'}>Twilight</span></button>;
}
