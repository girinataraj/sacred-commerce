// Presentation invalidation only. No identity, tokens or cart contents cross tabs.
export type AuthChange='SIGNED_IN'|'SIGNED_OUT';
const channelName='sacred-commerce-auth';
export function notifyAuthChange(change:AuthChange):void {
  if(typeof BroadcastChannel==='undefined')return;
  const channel=new BroadcastChannel(channelName);channel.postMessage(change);channel.close();
}
export function subscribeAuthChanges(receive:(change:AuthChange)=>void):()=>void {
  if(typeof BroadcastChannel==='undefined')return()=>{};
  const channel=new BroadcastChannel(channelName);
  channel.onmessage=event=>{if(event.data==='SIGNED_IN'||event.data==='SIGNED_OUT')receive(event.data);};
  return()=>channel.close();
}
