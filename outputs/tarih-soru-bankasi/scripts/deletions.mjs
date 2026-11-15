import {open,readFile,rename,realpath,unlink,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
const filename='profile-deletions.json';
export async function readDeletionLedger(file){
 if(path.basename(file)!==filename)throw Error('Invalid deletion ledger path');
 const info=await stat(file);if(!info.isFile()||info.size>10000000)throw Error('Invalid deletion ledger size');
 const resolved=await realpath(file),parent=await realpath(path.dirname(file));if(path.dirname(resolved)!==parent)throw Error('Unsafe deletion ledger link');
 const data=JSON.parse(await readFile(file,'utf8'));
 if(data.version!==1||!Array.isArray(data.entries)||data.entries.length>100000||data.entries.some(e=>!e||!/^[a-f0-9-]{36}$/.test(e.profileId)||!Number.isSafeInteger(e.deletedAt)||e.deletedAt<1)||new Set(data.entries.map(e=>e.profileId)).size!==data.entries.length)throw Error('Invalid deletion ledger');
 return{version:1,entries:data.entries.map(({profileId,deletedAt})=>({profileId,deletedAt}))};
}
async function writeLedger(file,data){
 const temp=file+'.'+randomBytes(8).toString('hex')+'.tmp';const handle=await open(temp,'wx',0o600);
 try{await handle.writeFile(JSON.stringify(data)+'\n');await handle.sync();}finally{await handle.close();}
 try{await rename(temp,file);}catch(e){await unlink(temp).catch(()=>{});throw e;}
}
async function locked(file,operation){
 const lock=file+'.lock';const handle=await open(lock,'wx',0o600);
 try{return await operation();}finally{await handle.close();await unlink(lock);}
}
export async function createDeletionStore(dataDir,db){
 const base=await realpath(path.resolve(dataDir)),file=path.join(base,filename);
 await locked(file,async()=>{try{const data=await readDeletionLedger(file);const ids=new Set(data.entries.map(e=>e.profileId));if(db.prepare('SELECT profile_id FROM profile_deletions').all().some(e=>!ids.has(e.profile_id)))throw Error('Deletion ledger outdated');}catch(e){if(e.code!=='ENOENT')throw e;if(db.prepare('SELECT COUNT(*) n FROM profile_deletions').get().n)throw Error('Deletion ledger missing; restore the latest ledger first');await writeLedger(file,{version:1,entries:[]});}});
 let pending=Promise.resolve();
 const record=(profileId,deletedAt)=>{
  const next=pending.catch(()=>{}).then(()=>locked(file,async()=>{
   const data=await readDeletionLedger(file);
   if(!/^[a-f0-9-]{36}$/.test(profileId)||!Number.isSafeInteger(deletedAt)||deletedAt<1)throw Error('Invalid deletion request');
   if(!data.entries.some(e=>e.profileId===profileId)){if(data.entries.length>=100000)throw Error('Deletion ledger capacity reached');data.entries.push({profileId,deletedAt});await writeLedger(file,data);}
  }));pending=next;return next;
 };
 return{file,record,read:()=>readDeletionLedger(file)};
}
export function applyDeletionLedger(db,data){
 db.exec('BEGIN');let removed=0;
 try{
  db.exec('CREATE TABLE IF NOT EXISTS profile_deletions(profile_id TEXT PRIMARY KEY NOT NULL,deleted_at INTEGER NOT NULL)');
  const present=name=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  for(const e of data.entries){
   db.prepare('INSERT OR IGNORE INTO profile_deletions VALUES(?,?)').run(e.profileId,e.deletedAt);
   if(present('report_events')&&present('question_reports'))db.prepare('DELETE FROM report_events WHERE report_id IN(SELECT id FROM question_reports WHERE profile_id=?)').run(e.profileId);
   for(const table of ['question_reports','answers','sessions','tests'])if(present(table))db.prepare('DELETE FROM '+table+' WHERE profile_id=?').run(e.profileId);
   if(present('profiles'))removed+=Number(db.prepare('DELETE FROM profiles WHERE id=?').run(e.profileId).changes);
  }
  db.exec('COMMIT');return removed;
 }catch(e){db.exec('ROLLBACK');throw e;}
}
export async function copyDeletionLedger(file,targetDir){
 const data=await readDeletionLedger(file);const output=path.join(targetDir,filename);
 const handle=await open(output,'wx',0o600);try{await handle.writeFile(JSON.stringify(data)+'\n');await handle.sync();}finally{await handle.close();}return data;
}

