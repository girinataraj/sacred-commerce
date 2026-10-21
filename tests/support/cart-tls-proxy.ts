import { createServer as createHttpsServer } from 'node:https';
import { request as upstreamRequest } from 'node:http';
import { execFile } from 'node:child_process';
import { readFile,access } from 'node:fs/promises';
import { resolve,relative,isAbsolute } from 'node:path';
export async function startCartTlsProxy(directory:string) {
  const root=resolve('.local/integration');const target=resolve(directory);const within=relative(root,target);
  if(!within||within.startsWith('..')||isAbsolute(within))throw Error('Owned TLS directory required');
  const executable=process.platform==='win32'?'C:/Program Files/Git/usr/bin/openssl.exe':'openssl';
  if(process.platform==='win32')await access(executable);
  const key=resolve(target,'cart-test.key'),cert=resolve(target,'cart-test.crt');
  await new Promise<void>((accept,reject)=>execFile(executable,['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost','-addext','subjectAltName=IP:127.0.0.1,DNS:localhost'],{windowsHide:true},error=>error?reject(Error('Test TLS certificate setup failed')):accept()));
  const server=createHttpsServer({key:await readFile(key),cert:await readFile(cert)},(incoming,outgoing)=>{
    const upstream=upstreamRequest({hostname:'127.0.0.1',port:3103,path:incoming.url,method:incoming.method,headers:{...incoming.headers,'x-forwarded-proto':'https','x-forwarded-host':incoming.headers.host}},response=>{outgoing.writeHead(response.statusCode??503,response.headers);response.pipe(outgoing);});
    upstream.on('error',()=>{outgoing.statusCode=503;outgoing.end('Local test app unavailable');});incoming.pipe(upstream);
  });
  await new Promise<void>(accept=>server.listen(0,'127.0.0.1',accept));const address=server.address();if(!address||typeof address==='string')throw Error('No TLS test port');
  return {origin:`https://127.0.0.1:${address.port}`,close:()=>new Promise<void>((accept,reject)=>{server.close(error=>error?reject(error):accept());server.closeAllConnections();})};
}
