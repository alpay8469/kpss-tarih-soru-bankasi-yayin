const STUDENT_SESSION_SECONDS=30*86400;
const ADMIN_SESSION_SECONDS=3600;
const MAX_BODY_BYTES=16000;
function sessionSecret(request){return(request.headers.get('Cookie')||'').match(/(?:^|;\s*)tarih_session=([a-f0-9]{48})(?:;|$)/)?.[1];}
function requireTransport(request){const url=new URL(request.url);if(url.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))fail(403,'Bu bağlantı HTTPS üzerinden açılmalı.');}
async function limitedBody(request){
 const length=request.headers.get('Content-Length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY_BYTES))fail(413,'İstek çok büyük.');
 const reader=request.body?.getReader();if(!reader)fail(400,'İstek okunamadı.');let bytes=0,chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_BODY_BYTES){await reader.cancel();fail(413,'İstek çok büyük.');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const data=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
 try{const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'JSON nesnesi bekleniyor.');return value;}
 catch(e){if(e.status)throw e;fail(400,'İstek okunamadı.');}
}
async function guardAttempts(request,env,d,scope,limit=10){
 const now=Date.now();await d.run('DELETE FROM security_rate_limits WHERE reset_at<=?',now);
 await d.run("INSERT OR IGNORE INTO security_settings(id,value) VALUES('rate-salt',?)",token());
 const salt=(await d.first("SELECT value FROM security_settings WHERE id='rate-salt'")).value;
 // Trust only the socket peer supplied by dev.mjs or the Cloudflare platform metadata/header.
 const address=env.CLIENT_ADDRESS||(request.cf?request.headers.get('CF-Connecting-IP'):null)||'unavailable';
 const key=await hash(salt+'|'+Math.floor(now/86400000)+'|'+scope+'|'+address);
 const row=await d.first('INSERT INTO security_rate_limits(id,scope,attempts,reset_at) VALUES(?,?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts,reset_at',key,scope,now+60000);
 if(row.attempts>limit)throw Object.assign(new Error('Çok fazla deneme. Bir dakika sonra yeniden dene.'),{status:429,retryAfter:Math.max(1,Math.ceil((row.reset_at-now)/1000))});
}
function secureResponse(response,request){
 const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('X-Frame-Options','DENY');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 const scriptHashes=new URL(request.url).pathname==='/yonetim'?ADMIN_SCRIPT_HASHES:PAGE_SCRIPT_HASHES;
 headers.set('Content-Security-Policy',"default-src 'self'; script-src "+scriptHashes.map(h=>"'sha256-"+h+"'").join(' ')+"; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
 if(new URL(request.url).protocol==='https:')headers.set('Strict-Transport-Security','max-age=31536000');
 headers.set('Cache-Control','no-store');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

