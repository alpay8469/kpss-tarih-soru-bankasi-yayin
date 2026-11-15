const REPORT_CATEGORIES=['answer','multiple','unclear','explanation','typo','other'];
const REPORT_STATUSES=['new','reviewing','resolved','no_change'];
function reportPage(url){const n=Number(url.searchParams.get('page')||1);if(!Number.isInteger(n)||n<1||n>100000)fail(400,'Geçersiz sayfa.');return n;}
function reportSummary(r){const q=JSON.parse(r.question_snapshot);return {id:r.id,testId:r.test_id,questionId:q.id,revision:q.revision||1,stem:q.stem,category:r.category,detail:r.detail,status:r.status,decision:r.decision,version:r.version,createdAt:r.created_at,updatedAt:r.updated_at};}
async function studentReports(request,d,p,url){
 if(request.method==='GET'){
  const page=reportPage(url),rows=await d.all('SELECT r.*,t.mode,t.finished_at FROM question_reports r JOIN tests t ON t.id=r.test_id WHERE r.profile_id=? ORDER BY r.created_at DESC,r.id DESC LIMIT 20 OFFSET ?',p.id,(page-1)*20);
  const total=(await d.first('SELECT COUNT(*) AS n FROM question_reports WHERE profile_id=?',p.id)).n;
  return json({page,total,reports:rows.map(r=>({...reportSummary(r),decision:r.mode==='exam'&&!r.finished_at?'':r.decision,decisionHidden:r.mode==='exam'&&!r.finished_at&&!!r.decision}))});
 }
 const b=await body(request);
 if(typeof b.testId!=='string'||typeof b.questionId!=='string'||!REPORT_CATEGORIES.includes(b.category)||typeof b.detail!=='string')fail(400,'Bildirim alanlarını kontrol et.');
 const detail=b.detail.trim();if(detail.length>1500||(b.category==='other'&&detail.length<5))fail(400,'Açıklama en fazla 1500 karakter olmalı; diğer için kısa bir açıklama yaz.');
 const t=await testFor(d,b.testId,p.id),q=(await questionsForTest(d,t)).find(q=>q.id===b.questionId);
 if(!q)fail(400,'Soru bu testte bulunmuyor.');
 const find=()=>d.first('SELECT id FROM question_reports WHERE profile_id=? AND question_id=? AND question_revision=?',p.id,q.id,q.revision||1);
 const existing=await find();if(existing)return json({id:existing.id,duplicate:true},200);
 const today=await d.first('SELECT COUNT(*) AS n FROM question_reports WHERE profile_id=? AND created_at>?',p.id,Date.now()-86400000);
 if(today.n>=20)fail(429,'Bir günde en fazla 20 bildirim gönderebilirsin. Mevcut bildirimlerini profilinden takip edebilirsin.');
 const id=crypto.randomUUID(),now=Date.now();
 await d.run('INSERT OR IGNORE INTO question_reports(id,profile_id,test_id,question_id,question_revision,question_snapshot,category,detail,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM question_reports WHERE profile_id=? AND created_at>?)<20',id,p.id,t.id,q.id,q.revision||1,JSON.stringify(q),b.category,detail,now,now,p.id,now-86400000);
 const saved=await find();if(!saved)fail(429,'Günlük bildirim sınırına ulaştın.');return json({id:saved.id,duplicate:saved.id!==id},saved.id===id?201:200);
}
function adminCookie(value,request,clear=false){return `tarih_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:ADMIN_SESSION_SECONDS}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
function adminSecret(request){return(request.headers.get('Cookie')||'').match(/(?:^|;\s*)tarih_admin=([a-f0-9]{48})(?:;|$)/)?.[1];}
async function adminAuth(d,request,env){
 const secret=adminSecret(request),keyHash=env.ADMIN_KEY_HASH;
 if(!keyHash||!secret||!await d.first('SELECT hash FROM admin_sessions WHERE hash=? AND credential_hash=? AND expires_at>?',await hash(secret),keyHash,Date.now()))fail(401,'Yönetici oturumu gerekli.');
}
async function adminApi(request,env,d,url){
 const route=url.pathname;
 if(route==='/api/admin/login'&&request.method==='POST'){
  if(!/^[a-f0-9]{64}$/.test(env.ADMIN_KEY_HASH||''))fail(503,'Yönetici erişimi sunucuda henüz yapılandırılmadı.');
  const now=Date.now();
  await guardAttempts(request,env,d,'admin-login');
  const b=await body(request),key=typeof b.key==='string'?b.key.replace(/[\s-]/g,'').toLowerCase():'';
  if(!/^[a-f0-9]{48}$/.test(key)||await hash(key)!==env.ADMIN_KEY_HASH)fail(401,'Yönetici anahtarı geçerli değil.');
  const session=token();await d.run('DELETE FROM admin_sessions WHERE expires_at<=?',now);
  await d.run('INSERT INTO admin_sessions(hash,credential_hash,expires_at) VALUES(?,?,?)',await hash(session),env.ADMIN_KEY_HASH,now+ADMIN_SESSION_SECONDS*1000);
  return json({ok:true},200,{'Set-Cookie':adminCookie(session,request)});
 }
 await adminAuth(d,request,env);
 if(route==='/api/admin/me'&&request.method==='GET')return json({ok:true});
 if(route==='/api/admin/logout'&&request.method==='POST'){
  await d.run('DELETE FROM admin_sessions WHERE hash=?',await hash(adminSecret(request)));return json({ok:true},200,{'Set-Cookie':adminCookie('',request,true)});
 }
 if(route==='/api/admin/reports'&&request.method==='GET'){
  const page=reportPage(url),status=url.searchParams.get('status')||'all';
  if(status!=='all'&&!REPORT_STATUSES.includes(status))fail(400,'Geçersiz durum.');
  const where=status==='all'?'':' WHERE r.status=?',args=status==='all'?[]:[status];
  const rows=await d.all('SELECT r.*,p.nickname FROM question_reports r JOIN profiles p ON p.id=r.profile_id'+where+' ORDER BY r.created_at DESC,r.id DESC LIMIT 20 OFFSET ?',...args,(page-1)*20);
  const total=(await d.first('SELECT COUNT(*) AS n FROM question_reports r'+where,...args)).n;
  const counts=await d.all('SELECT status,COUNT(*) AS n FROM question_reports GROUP BY status');
  return json({page,total,counts:Object.fromEntries(REPORT_STATUSES.map(s=>[s,counts.find(c=>c.status===s)?.n||0])),reports:rows.map(r=>({...reportSummary(r),nickname:r.nickname}))});
 }
 const match=route.match(/^\/api\/admin\/reports\/([a-f0-9-]{36})$/);
 if(match){
  const row=await d.first('SELECT r.*,p.nickname FROM question_reports r JOIN profiles p ON p.id=r.profile_id WHERE r.id=?',match[1]);
  if(!row)fail(404,'Bildirim bulunamadı.');
  if(request.method==='GET')return json({...reportSummary(row),nickname:row.nickname,question:JSON.parse(row.question_snapshot),currentRevision:byId.get(row.question_id)?.revision||null,history:await d.all('SELECT status,decision,version,created_at FROM report_events WHERE report_id=? ORDER BY version',row.id)});
  const b=await body(request),decision=typeof b.decision==='string'?b.decision.trim():'';
  if(!['reviewing','resolved','no_change'].includes(b.status)||!Number.isInteger(b.version)||decision.length>1500)fail(400,'Durumu ve karar gerekçesini kontrol et.');
  if(['resolved','no_change'].includes(b.status)&&decision.length<8)fail(400,'Kararın nedenini en az 8 karakterle açıkla.');
  if(row.status==='new'&&b.status!=='reviewing')fail(409,'Önce bildirimi incelemeye al.');
  if(['resolved','no_change'].includes(row.status)&&b.status!=='reviewing')fail(409,'Kararı değiştirmek için önce yeniden incelemeye al.');
  if(row.version!==b.version)fail(409,'Bu bildirim başka bir oturumda değişti. Yenileyip tekrar incele.');
  const now=Date.now(),eventId=crypto.randomUUID();
  const note=decision||(b.status==='reviewing'?'İnceleme başladı.':'');
  // Insert the event against the expected version, then update in one transaction.
  await d.batch([
   d.stmt('INSERT INTO report_events(id,report_id,status,decision,version,created_at) SELECT ?,id,?,?,version+1,? FROM question_reports WHERE id=? AND version=?',eventId,b.status,note,now,row.id,b.version),
   d.stmt('UPDATE question_reports SET status=?,decision=?,version=version+1,updated_at=? WHERE id=? AND version=?',b.status,note,now,row.id,b.version)
  ]);
  if(!await d.first('SELECT id FROM report_events WHERE id=?',eventId))fail(409,'Bu bildirim değişti. Yenileyip tekrar incele.');
  return json({ok:true});
 }
 fail(404,'Yönetim işlemi bulunamadı.');
}

