import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { testActors } from './actors';
export async function startCartAuthProvider() {
  const password=randomBytes(24).toString('hex');
  const tokens=new Map<string,string>();
  const users=new Map(testActors.map((actor,index)=>[index===2?'admin@example.test':`customer-${index===0?'a':'b'}@example.test`,{id:actor.id,email:index===2?'admin@example.test':`customer-${index===0?'a':'b'}@example.test`,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{role:'ADMIN'},created_at:'2026-10-15T00:00:00Z'}]));
  const server=createServer(async(request,response)=>{
    response.setHeader('Content-Type','application/json');
    const send=(status:number,body:unknown)=>{response.statusCode=status;response.end(JSON.stringify(body));};
    const token=request.headers.authorization?.replace(/^Bearer /,'');
    const email=token?tokens.get(token):undefined;
    if(request.url?.startsWith('/auth/v1/token')) {
      const chunks:Buffer[]=[];for await(const chunk of request)chunks.push(Buffer.from(chunk));
      const body=JSON.parse(Buffer.concat(chunks).toString());
      const user=users.get(body.email);
      if(!user||body.password!==password)return send(400,{code:'invalid_credentials',message:'Synthetic credentials rejected'});
      const access=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),randomBytes(24).toString('base64url')].join('.');
      tokens.set(access,user.email);return send(200,{user,access_token:access,refresh_token:randomBytes(24).toString('hex'),expires_in:3600,token_type:'bearer'});
    }
    if(request.url?.startsWith('/auth/v1/logout')) {if(token)tokens.delete(token);response.statusCode=204;return response.end();}
    if(request.url==='/auth/v1/user'&&email)return send(200,users.get(email));
    return send(401,{code:'bad_jwt',message:'Synthetic session unavailable'});
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();if(!address||typeof address==='string')throw Error('No provider port');
  return {url:`http://127.0.0.1:${address.port}`,password,close:()=>new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}
