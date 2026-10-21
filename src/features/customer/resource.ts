'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

import {subscribeAuthChanges} from '../../lib/auth-events';
import {CustomerRequestError} from './api';
export function usePrivateResource<T>(read:(signal?:AbortSignal)=>Promise<T>){
  const [data,setData]=useState<T|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<CustomerRequestError|null>(null);const epoch=useRef(0);
  const load=useCallback((signal?:AbortSignal)=>{const generation=epoch.current;return read(signal).then(value=>{if(generation===epoch.current&&!signal?.aborted)setData(value);},cause=>{if(generation===epoch.current&&!signal?.aborted){setData(null);setError(cause instanceof CustomerRequestError?cause:new CustomerRequestError(503,'SERVICE_UNAVAILABLE','Your private data could not be loaded. Please retry.'));}}).finally(()=>{if(generation===epoch.current&&!signal?.aborted)setLoading(false);});},[read]);
  const reload=useCallback(()=>{epoch.current++;setData(null);setError(null);setLoading(true);void load();},[load]);
  useEffect(()=>{const lifecycle=epoch;const controller=new AbortController();void load(controller.signal);const unsubscribe=subscribeAuthChanges(()=>{epoch.current++;controller.abort();setData(null);setLoading(false);setError(new CustomerRequestError(401,'ACCOUNT_CHANGED','Your sign-in changed. Sign in or reload this private view.'));});const restored=(event:PageTransitionEvent)=>{if(event.persisted)reload();};window.addEventListener('pageshow',restored);window.addEventListener('focus',reload);return()=>{lifecycle.current++;controller.abort();unsubscribe();window.removeEventListener('pageshow',restored);window.removeEventListener('focus',reload);};},[load,reload]);
  return {data,loading,error,reload};
}
