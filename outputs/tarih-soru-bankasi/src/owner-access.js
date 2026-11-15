// The local adapter is trusted code. Client headers/Host alone never enable this exception.
function localOwnerAccess(request,env){
 return env.LOCAL_ADMIN===true&&!request.cf&&['localhost','127.0.0.1','[::1]'].includes(new URL(request.url).hostname)&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(env.CLIENT_ADDRESS);
}
const ownerKeyCache=new Map();
function accessBytes(value){
 if(typeof value!=='string'||!value||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error('Invalid JWT encoding');
 return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
}
function accessObject(value){const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(accessBytes(value)));if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid JWT object');return data;}
async function ownerKeys(issuer,kid){
 let state=ownerKeyCache.get(issuer);const now=Date.now();
 if(!state){state={keys:[],expires:0,nextFetch:0,pending:null};ownerKeyCache.set(issuer,state);}
 let key=state.keys.find(k=>k.kid===kid);
 if(state.expires>now&&key)return key;
 if(!state.pending&&now>=state.nextFetch){
  state.nextFetch=now+30000;
  state.pending=(async()=>{
   const response=await fetch(issuer+'/cdn-cgi/access/certs',{redirect:'error',signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw new Error('Access key service unavailable');
   // Bounded streaming parser, shared with API input; no token is sent to this endpoint.
   const data=await limitedBody(response);
   if(!Array.isArray(data.keys)||data.keys.length<1||data.keys.length>10)throw new Error('Invalid Access keys');
   const keys=data.keys.filter(k=>k&&k.kty==='RSA'&&k.alg==='RS256'&&k.use==='sig'&&typeof k.kid==='string'&&typeof k.n==='string'&&typeof k.e==='string');
   if(!keys.length||new Set(keys.map(k=>k.kid)).size!==keys.length)throw new Error('Invalid Access keys');
   state.keys=keys;state.expires=Date.now()+300000;
  })().finally(()=>{state.pending=null;});
 }
 if(state.pending)await state.pending;
 key=state.keys.find(k=>k.kid===kid);
 if(state.expires<=Date.now()||!key)throw new Error('Access key missing');
 return key;
}
async function requireOwnerAccess(request,env){
 if(localOwnerAccess(request,env))return;
 const issuer=env.ACCESS_TEAM_DOMAIN,audience=env.ACCESS_AUD,owner=env.ADMIN_OWNER_EMAIL;
 if(typeof issuer!=='string'||!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/.test(issuer)||typeof audience!=='string'||!/^[a-f0-9]{64}$/.test(audience)||typeof owner!=='string'||!/^\S+@\S+\.\S+$/.test(owner)||owner.length>254)fail(503,'Yönetici hesap doğrulaması henüz yapılandırılmadı.');
 try{
  const jwt=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!jwt||jwt.length>8192)throw new Error('Missing Access token');
  const parts=jwt.split('.');if(parts.length!==3)throw new Error('Invalid Access token');
  const header=accessObject(parts[0]),claims=accessObject(parts[1]),now=Math.floor(Date.now()/1000);
  if(header.alg!=='RS256'||typeof header.kid!=='string'||!header.kid||header.kid.length>128||header.crit!==undefined)throw new Error('Invalid Access header');
  if(claims.iss!==issuer||!Array.isArray(claims.aud)||!claims.aud.includes(audience)||claims.type!=='app'||typeof claims.sub!=='string'||!claims.sub||typeof claims.email!=='string'||claims.email.toLowerCase()!==owner.toLowerCase())throw new Error('Invalid owner claims');
  if(!Number.isInteger(claims.exp)||claims.exp<=now||!Number.isInteger(claims.iat)||claims.iat>now+30||claims.iat>=claims.exp||(claims.nbf!==undefined&&(!Number.isInteger(claims.nbf)||claims.nbf>now)))throw new Error('Invalid Access time');
  const jwk=await ownerKeys(issuer,header.kid);
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,accessBytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw new Error('Invalid Access signature');
 }catch{fail(403,'Bu yönetici alanına erişim yetkin yok.');}
}

