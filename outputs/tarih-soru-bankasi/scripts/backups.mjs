import {DatabaseSync,backup} from 'node:sqlite';
import {mkdir,open,readFile,writeFile,copyFile,chmod,readdir,realpath,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {readDeletionLedger,copyDeletionLedger,applyDeletionLedger} from './deletions.mjs';
const tables=['profiles','tests','answers','question_reports','report_events'];
const digest=b=>createHash('sha256').update(b).digest('hex');
function check(db){if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw Error('Backup integrity check failed');if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Backup foreign keys failed');}
function recordHashes(db){const result={};for(const name of tables)if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name))result[name]=digest(JSON.stringify(db.prepare('SELECT * FROM '+name+' ORDER BY id').all()));return result;}
function summary(db){const counts={};for(const name of tables)if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name))counts[name]=db.prepare('SELECT COUNT(*) n FROM '+name).get().n;return counts;}
export async function createBackup(sourceDb,dataDir){
 const folder=path.resolve(dataDir,'backups');await mkdir(folder,{recursive:true});
 const base=await realpath(path.resolve(dataDir)),resolvedFolder=await realpath(folder);if(path.dirname(resolvedFolder)!==base||path.basename(resolvedFolder)!=='backups')throw Error('Unsafe backup directory');
 const file='tarih-'+Date.now()+'-'+randomBytes(4).toString('hex')+'.sqlite';const output=path.resolve(folder,file);
 if(path.dirname(output)!==folder)throw Error('Invalid backup target');
 const reserved=await open(output,'wx',0o600);await reserved.close();await backup(sourceDb,output);await chmod(output,0o600);
 const copy=new DatabaseSync(output,{readOnly:true});let counts,recordHash;try{check(copy);counts=summary(copy);recordHash=recordHashes(copy);}finally{copy.close();}
 const manifest={version:1,file,createdAt:new Date().toISOString(),sha256:digest(await readFile(output)),counts,recordHashes:recordHash};const manifestPath=output+'.json';
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});await pruneBackups(dataDir);return{file:output,manifestPath,manifest};
}
export async function restoreToNewDirectory(manifestPath,targetDir,{deletionLedgerPath}={}){
 if(!deletionLedgerPath)throw Error('Latest deletion ledger is required for restore');
 await readDeletionLedger(deletionLedgerPath);
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 if(manifest.version!==1||!/^tarih-\d+-[a-f0-9]{8}\.sqlite$/.test(manifest.file))throw Error('Invalid backup manifest');
 const folder=path.dirname(path.resolve(manifestPath)),source=path.resolve(folder,manifest.file);if(path.dirname(source)!==folder)throw Error('Invalid backup source');
 if(digest(await readFile(source))!==manifest.sha256)throw Error('Backup checksum mismatch');
 const target=path.resolve(targetDir);await mkdir(target,{recursive:false});const output=path.join(target,'tarih.sqlite');await copyFile(source,output,constants.COPYFILE_EXCL);await chmod(output,0o600);
 const copy=new DatabaseSync(output);try{
 check(copy);if(JSON.stringify(summary(copy))!==JSON.stringify(manifest.counts))throw Error('Restored counts mismatch');
 if(JSON.stringify(recordHashes(copy))!==JSON.stringify(manifest.recordHashes))throw Error('Restored records mismatch');
 const ledger=await copyDeletionLedger(deletionLedgerPath,target);
 const removedProfiles=applyDeletionLedger(copy,ledger);
 // A restored backup must never reactivate old login sessions or stale login throttles.
 for(const table of ['sessions','admin_sessions','security_rate_limits','admin_login_guard'])if(copy.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table))copy.exec('DELETE FROM '+table);
 check(copy);return{file:output,counts:summary(copy),sessionsCleared:true,deletionsApplied:true,removedProfiles};
 }finally{copy.close();}
}

export async function pruneBackups(dataDir,now=Date.now()){
 const base=await realpath(path.resolve(dataDir)),folder=await realpath(path.resolve(dataDir,'backups'));
 const rel=path.relative(base,folder);if(!rel||rel.startsWith('..')||path.isAbsolute(rel))throw Error('Unsafe backup directory');
 for(const name of await readdir(folder)){
  const match=name.match(/^tarih-(\d+)-[a-f0-9]{8}\.sqlite$/);if(!match||now-Number(match[1])<=30*86400000)continue;
  for(const file of [name+'.json',name]){const target=path.resolve(folder,file);if(path.dirname(target)!==folder)throw Error('Unsafe backup path');
   try{const resolved=await realpath(target);if(path.dirname(resolved)!==folder)throw Error('Unsafe backup symlink');await unlink(target);}catch(e){if(e.code!=='ENOENT')throw e;}
  }
 }
}

