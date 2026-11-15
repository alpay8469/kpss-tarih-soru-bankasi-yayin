import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {localAdminHash} from './local-admin.mjs';
import {createBackup} from './backups.mjs';
import {createDeletionStore,applyDeletionLedger} from './deletions.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(root,'.local');
await mkdir(dataDir,{recursive:true});
const ADMIN_KEY_HASH=process.env.ADMIN_KEY_HASH||await localAdminHash(dataDir);
const sqlite = new DatabaseSync(path.join(dataDir,'tarih.sqlite'));
sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
sqlite.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)');
for (const name of (await readdir(path.join(root,'drizzle'))).filter(x=>x.endsWith('.sql')).sort()) {
  if (sqlite.prepare('SELECT name FROM _migrations WHERE name=?').get(name)) continue;
  sqlite.exec('BEGIN');
  try {
    sqlite.exec(await readFile(path.join(root,'drizzle',name),'utf8'));
    sqlite.prepare('INSERT INTO _migrations VALUES (?)').run(name);
    sqlite.exec('COMMIT');
  } catch(e) { sqlite.exec('ROLLBACK'); throw e; }
}
const deletionStore=await createDeletionStore(dataDir,sqlite);
applyDeletionLedger(sqlite,await deletionStore.read());
let backupRunning=null,lastBackupChanges=-1;
async function takeBackup(){
 if(backupRunning)return backupRunning;
 const changes=sqlite.prepare('SELECT total_changes() n').get().n;if(changes===lastBackupChanges)return;
 backupRunning=createBackup(sqlite,dataDir).then(()=>{lastBackupChanges=changes;}).catch(e=>{console.error('Backup failed:',e.name||'Error');}).finally(()=>{backupRunning=null;});return backupRunning;
}
await takeBackup();
const backupTimer=setInterval(()=>void takeBackup(),3600000);backupTimer.unref();
function prepare(sql) {
  const stmt=sqlite.prepare(sql);
  let args=[];
  const query={bind(...values){args=values;return query;},
    first(){return stmt.get(...args)||null;}, all(){return {results:stmt.all(...args)};},
    run(){const r=stmt.run(...args);return {success:true,meta:{changes:Number(r.changes)}};}};
  return query;
}
const DB={prepare,batch(statements){sqlite.exec('BEGIN');try{const r=statements.map(s=>s.run());sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const {default:worker}=await import('../worker/index.js');
const port=Number(process.env.PORT||4173);
const server=createServer(async(req,res)=>{
  try {
    const chunks=[];let size=0;
    for await(const c of req){size+=c.length;if(size>16384){res.writeHead(413,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});res.end('İstek çok büyük.');return;}chunks.push(c);}
    const host=req.headers.host||`localhost:${port}`;
    const request=new Request(`http://${host}${req.url}`,{method:req.method,headers:req.headers,
      ...(req.method==='GET'||req.method==='HEAD'?{}:{body:Buffer.concat(chunks)})});
    const response=await worker.fetch(request,{DB,ADMIN_KEY_HASH,LOCAL_ADMIN:true,CLIENT_ADDRESS:req.socket.remoteAddress,RECORD_DELETION:deletionStore.record},{waitUntil(){}});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  }catch(e){console.error('Local request failed:',e.name||'Error');res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});res.end('Sunucuya ulaşılamıyor.');}
});
server.requestTimeout=15000;server.headersTimeout=15000;server.maxHeadersCount=50;
// Desktop pilot: never expose student data to the local network by configuration.
server.listen(port,'127.0.0.1',()=>{
  console.log(`Tarih soru bankası: http://localhost:${port}`);
});
let stopping=false;for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{if(stopping)return;stopping=true;clearInterval(backupTimer);server.close(async()=>{await takeBackup();sqlite.close();process.exit(0);});});

