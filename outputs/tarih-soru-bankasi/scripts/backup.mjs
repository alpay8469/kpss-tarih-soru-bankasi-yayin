import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createBackup} from './backups.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));const dir=path.resolve(process.env.DATA_DIR||path.join(root,'.local'));
const db=new DatabaseSync(path.join(dir,'tarih.sqlite'),{readOnly:true});try{const result=await createBackup(db,dir);console.log('Yedek doğrulandı: '+path.basename(result.file));}finally{db.close();}

