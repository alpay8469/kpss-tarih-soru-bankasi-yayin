import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import path from 'node:path';
export async function localAdminHash(dataDir){
 const file=path.join(dataDir,'yonetici-anahtari.txt');
 let key;
 try{key=await readFile(file,'utf8');}catch(e){
  if(e.code!=='ENOENT')throw e;
  const generated=randomBytes(24).toString('hex');
  try{await writeFile(file,generated.match(/.{8}/g).join('-')+'\n',{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}
  key=await readFile(file,'utf8');
 }
 key=key.replace(/[\s-]/g,'').toLowerCase();
 if(!/^[a-f0-9]{48}$/.test(key))throw Error('Yerel yönetici anahtarı geçersiz; dosya otomatik olarak değiştirilmeyecek.');
 return createHash('sha256').update(key).digest('hex');
}

