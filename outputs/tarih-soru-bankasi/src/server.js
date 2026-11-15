const LETTERS='ABCDE';
const byId=new Map(BANK.map(q=>[q.id,q]));
const legacyById=new Map(LEGACY_BANK.map(q=>[q.id,q]));
const GROUPS=[
  {id:'ad',name:'Ana yurt ve Türk adı',description:'Coğrafya, adın anlamları ve ilk kaynaklar',match:q=>q.topic==='Ana yurt'||(q.topic.startsWith('Türk')&&q.topic!=='Türkiye Selçuklu Devleti')},
  {id:'kultur',name:'Orta Asya kültür merkezleri',description:'Kültür bölgeleri ve ayırt edici özellikler',match:q=>q.topic==='Orta Asya kültür merkezleri'},
  {id:'goc',name:'Türk göçleri',description:'Göçlerin nedenleri, sonuçları ve etkileşim',match:q=>q.topic.startsWith('Göç')},
  {id:'iskit',name:'İskitler ve kültürel yaşam',description:'Sanat, destan, askerî yaşam ve gelenekler',match:q=>q.topic.startsWith('İskit')||['İnanç ve anma gelenekleri','Askerî kültür ve etkileşim'].includes(q.topic)},
  {id:'hun',name:'Asya Hun Devleti',description:'Teoman, Mete Han, Ötüken ve bağımsızlık',match:q=>q.topic==='Asya Hun Devleti'},
  {id:'kavimler',name:'Kavimler Göçü',description:'Balamir, Avrupa’da değişim ve göçün sonuçları',match:q=>q.topic==='Kavimler Göçü'},
  {id:'avrupa-hun',name:'Avrupa Hun Devleti',description:'Balamir, Uldız, Attila, antlaşmalar ve Roma ilişkileri',match:q=>q.topic==='Avrupa Hun Devleti'},
  {id:'gokturk',name:'Göktürk Devletleri ve Orhun Yazıtları',description:'Bumin, İstemi, Kutluk, yönetim, diplomasi ve yazıtlar',match:q=>q.topic==='Göktürk Devletleri ve Orhun Yazıtları'},
  {id:'uygur',name:'Uygur Devleti ve Uygur kültürü',description:'Kağanlar, yerleşik yaşam, inanç, sanat, eğitim ve hukuk',match:q=>q.topic==='Uygur Devleti ve Uygur kültürü'},
  {id:'avar',name:'Avarlar',description:'Bayan Han, Avrupa, İstanbul kuşatması ve kültürel etkileşim',match:q=>q.topic==='Avarlar'},
  {id:'uz',name:'Uzlar',description:'Oğuz bağlantısı, Bizans hizmeti, Malazgirt ve Gagauzlar',match:q=>q.topic==='Uzlar'},
  {id:'pecenek',name:'Peçenekler',description:'Rus ve Bizans ilişkileri, boy teşkilatı ve değişen ittifaklar',match:q=>q.topic==='Peçenekler'},
  {id:'macar',name:'Macarlar',description:'Arpad, yurt edinme, Hristiyanlaşma ve Türkoloji',match:q=>q.topic==='Macarlar'},
  {id:'bulgar',name:'Bulgarlar',description:'Büyük Bulgar, Tuna ve İdil kolları; hükümdarlar ve dinî dönüşüm',match:q=>q.topic==='Bulgarlar'},
  {id:'sabar',name:'Sibirler (Sabarlar)',description:'Ad, coğrafya, Anadolu akınları ve siyasi ilişkiler',match:q=>q.topic==='Sibirler (Sabarlar)'},
  {id:'kipcak',name:'Kıpçaklar (Kumanlar)',description:'Dil, destanlar, bozkır coğrafyası ve siyasi ilişkiler',match:q=>q.topic==='Kıpçaklar (Kumanlar)'},
  {id:'hazar',name:'Hazarlar',description:'Kafkasya, ticaret, dinî çeşitlilik, yönetim ve dış ilişkiler',match:q=>q.topic==='Hazarlar'},
  {id:'kirgiz',name:'Kırgızlar',description:'Uygurlar, Moğol ilişkileri, Manas ve Yenisey mirası',match:q=>q.topic==='Kırgızlar'},
  {id:'karluk',name:'Karluklar',description:'Talas, Türgişler, Karahanlılar ve siyasi ilişkiler',match:q=>q.topic==='Karluklar'},
  {id:'diger',name:'Diğer Türk devlet ve toplulukları',description:'Türgişler, Tabgaçlar, Akhunlar, Oğuzlar ve Başkurtlar',match:q=>q.topic==='Diğer Türk devlet ve toplulukları'},
  {id:'medeniyet',name:'İslamiyet Öncesi Türklerde Kültür ve Uygarlık',description:'Devlet, töre, toplum, ekonomi, ordu, inanış ve kültür',match:q=>q.topic==='İslamiyet Öncesi Türklerde Kültür ve Uygarlık'},
  {id:'talas',name:'Talas ve Türklerin İslamiyet’i Kabulü',description:'İttifak, İslamlaşma, Abbasiler ve kültürel etkileşim',match:q=>q.topic==='Talas ve Türklerin İslamiyet’i Kabulü'},
  {id:'karahanli',name:'Karahanlılar',description:'Hükümdarlar, Türkçe, yönetim, kurumlar ve mimari',match:q=>q.topic==='Karahanlılar'},
  {id:'gazneli',name:'Gazneliler',description:'Mahmut, Hindistan, Dandanakan, bilim ve kültür',match:q=>q.topic==='Gazneliler'},
  {id:'selcuklu',name:'Büyük Selçuklu Devleti',description:'Kuruluş, hükümdarlar, savaşlar, otorite ve atabeylikler',match:q=>q.topic==='Büyük Selçuklu Devleti'},
  {id:'misir',name:'Mısır’da Kurulan Devletler',description:'Kurucular, Hicaz, Haçlılar, Moğollar ve yönetim',match:q=>q.topic==='Mısır’da Kurulan Devletler'},
  {id:'beylikler',name:'Anadolu’da İlk Türk Beylikleri',description:'Coğrafya, mimari, bilim, denizcilik ve siyasi ilişkiler',match:q=>q.topic==='Anadolu’da İlk Türk Beylikleri'},
  {id:'turkmen',name:'Akkoyunlular ve Karakoyunlular',description:'Hükümdarlar, kültür ve siyasi güç dengeleri',match:q=>q.topic==='Akkoyunlular ve Karakoyunlular'},
  {id:'safevi',name:'Safeviler',description:'Şah İsmail, İran ve Çaldıran',match:q=>q.topic==='Safeviler'},
  {id:'babur',name:'Babürler',description:'Hindistan, hükümdarlar ve Tac Mahal',match:q=>q.topic==='Babürler'},
  {id:'harzem',name:'Harzemşahlar',description:'Selçuklu mirası, Otrar ve Yassıçemen',match:q=>q.topic==='Harzemşahlar'},
  {id:'timur-mogol',name:'Timur ve Moğol Siyasi Mirası',description:'Savaşlar, bilim, kültür ve ardıl devletler',match:q=>q.topic==='Timur ve Moğol Siyasi Mirası'},
  {id:'islam-medeniyet',name:'İlk Türk-İslam Devletlerinde Kültür ve Uygarlık',description:'Devlet, hukuk, toprak, sosyal hayat, ordu ve eğitim',match:q=>q.topic==='İlk Türk-İslam Devletlerinde Kültür ve Uygarlık'},
  {id:'turkiye-selcuklu',name:'Türkiye Selçuklu Devleti',description:'Kuruluş, Haçlılar, Bizans, limanlar, ticaret ve Moğol baskısı',match:q=>q.topic==='Türkiye Selçuklu Devleti'}
];
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const db=env=>({
  stmt:(sql,...args)=>env.DB.prepare(sql).bind(...args),
  first:(sql,...args)=>env.DB.prepare(sql).bind(...args).first(),
  all:async(sql,...args)=>(await env.DB.prepare(sql).bind(...args).all()).results,
  run:(sql,...args)=>env.DB.prepare(sql).bind(...args).run(),
  batch:statements=>env.DB.batch(statements)
});
function cookie(value,request,clear=false){return `tarih_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear?0:STUDENT_SESSION_SECONDS}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
async function body(request){return limitedBody(request);}
async function issueSession(d,profileId,request,recoveryHash=null){
 const secret=token(),sessionHash=await hash(secret),expires=Date.now()+STUDENT_SESSION_SECONDS*1000;
 await d.run('DELETE FROM sessions WHERE expires_at<=?',Date.now());
 if(recoveryHash){
  await d.batch([
   d.stmt('DELETE FROM sessions WHERE profile_id=? AND EXISTS(SELECT 1 FROM profiles WHERE id=? AND recovery_hash=?)',profileId,profileId,recoveryHash),
   d.stmt('INSERT INTO sessions(hash,profile_id,expires_at) SELECT ?,id,? FROM profiles WHERE id=? AND recovery_hash=?',sessionHash,expires,profileId,recoveryHash)
  ]);
  if(!await d.first('SELECT hash FROM sessions WHERE hash=?',sessionHash))fail(400,'Kurtarma kodu geçerli değil.');
 }else await d.run('INSERT INTO sessions(hash,profile_id,expires_at) VALUES(?,?,?)',sessionHash,profileId,expires);
 return cookie(secret,request);
}

async function auth(d,request){const secret=sessionSecret(request);if(!secret)fail(401,'Devam etmek için bir profil aç.');const p=await d.first('SELECT p.id,p.nickname,p.recovery_hash FROM profiles p JOIN sessions s ON s.profile_id=p.id WHERE s.hash=? AND s.expires_at>?',await hash(secret),Date.now());if(!p)fail(401,'Oturumun sona erdi. Kurtarma kodunla geri dönebilirsin.');return p;}
async function latest(d,profileId){return d.all(`SELECT question_id,correct FROM (
  SELECT question_id,correct,ROW_NUMBER() OVER(PARTITION BY question_id ORDER BY created_at DESC,id DESC) AS n
  FROM answers WHERE profile_id=?) WHERE n=1`,profileId);}
async function testFor(d,id,profileId){const t=await d.first('SELECT * FROM tests WHERE id=? AND profile_id=?',id,profileId);if(!t)fail(404,'Test bulunamadı.');return t;}
function publicQuestion(q){return {id:q.id,revision:q.revision||1,topic:q.topic,subtopic:q.subtopic||null,skill:q.skill,stem:q.stem,options:q.options,...(q.difficulty?{difficulty:q.difficulty}:{})};}
function solution(q){return {answer:q.answer,explanation:q.explanation,sources:q.sources};}
async function questionsForTest(d,t){
  if(t.question_snapshot)return JSON.parse(t.question_snapshot);
  const questions=JSON.parse(t.question_ids).map(id=>legacyById.get(id));
  if(questions.some(q=>!q))throw new Error('Historical question snapshot is unavailable.');
  const snapshot=JSON.stringify(questions);
  await d.run('UPDATE tests SET question_snapshot=? WHERE id=? AND question_snapshot IS NULL',snapshot,t.id);
  t.question_snapshot=snapshot;
  return questions;
}
async function serializeTest(d,t){const answers=await d.all('SELECT question_id,choice,correct FROM answers WHERE test_id=?',t.id);const reveal=t.mode==='practice'||!!t.finished_at;return {id:t.id,topic:t.topic,mode:t.mode,createdAt:t.created_at,finishedAt:t.finished_at,
  questions:(await questionsForTest(d,t)).map(q=>{const a=answers.find(a=>a.question_id===q.id);return {...publicQuestion(q),...(a?{choice:a.choice}:{}),...(reveal&&(a||t.finished_at)?{...solution(q),correct:!!a?.correct}: {})};})};}
function shuffle(values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
async function api(request,env){const d=db(env),url=new URL(request.url),route=url.pathname;
  if(request.method==='POST'){
    if(request.headers.get('Sec-Fetch-Site')==='cross-site'||request.headers.get('Origin')!==url.origin)fail(403,'İsteğin kaynağı doğrulanamadı. Sayfayı yenileyip tekrar dene.');
    if((request.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase()!=='application/json')fail(415,'JSON bekleniyor.');
  }else if(request.method!=='GET')fail(405,'Bu işlem desteklenmiyor.');
  if(route.startsWith('/api/admin/'))return adminApi(request,env,d,url);
  if(route==='/api/profile'&&request.method==='POST'){
    await guardAttempts(request,env,d,'profile');
    const {nickname}=await body(request);const name=typeof nickname==='string'?nickname.normalize('NFC').trim():'';
    if(!/^[\p{L}\p{N}_ -]{3,20}$/u.test(name))fail(400,'Takma ad 3–20 harf, rakam, boşluk, tire veya alt çizgi içermeli.');
    const key=name.toLocaleLowerCase('tr-TR').replace(/\s+/g,' ');
    if(await d.first('SELECT id FROM profiles WHERE nickname_key=?',key))fail(409,'Bu takma ad alınmış. Başka bir ad seç veya kurtarma kodunla giriş yap.');
    const id=crypto.randomUUID();await d.run('INSERT INTO profiles(id,nickname,nickname_key,created_at) VALUES(?,?,?,?)',id,name,key,Date.now());
    return json({ok:true},201,{'Set-Cookie':await issueSession(d,id,request)});
  }
  if(route==='/api/recover'&&request.method==='POST'){
    await guardAttempts(request,env,d,'recover');
    const {code}=await body(request);const normalized=String(code||'').toLowerCase().replace(/[\s-]/g,'');
    if(!/^[a-f0-9]{48}$/.test(normalized))fail(400,'Kurtarma kodu geçerli değil.');
    const p=await d.first('SELECT id FROM profiles WHERE recovery_hash=?',await hash(normalized));if(!p)fail(400,'Kurtarma kodu geçerli değil.');
    return json({ok:true},200,{'Set-Cookie':await issueSession(d,p.id,request,await hash(normalized))});
  }
  const p=await auth(d,request);
  if(route==='/api/delete-profile'&&request.method==='POST'){
    await guardAttempts(request,env,d,'delete-profile');
    const b=await body(request),normalized=String(b.code||'').toLowerCase().replace(/[\s-]/g,'');
    if(b.confirmation!=='SİL')fail(400,'Silme işlemini SİL yazarak onayla.');
    if(!/^[a-f0-9]{48}$/.test(normalized)||!p.recovery_hash||await hash(normalized)!==p.recovery_hash)fail(403,'Bu profile ait güncel kurtarma kodunu gir.');
    if(!await d.first('SELECT p.id FROM profiles p JOIN sessions s ON s.profile_id=p.id WHERE p.id=? AND p.recovery_hash=? AND s.hash=? AND s.expires_at>?',p.id,p.recovery_hash,await hash(sessionSecret(request)),Date.now()))fail(401,'Oturumun veya kurtarma kodun değişti. Yeniden giriş yap.');
    if(typeof env.RECORD_DELETION!=='function')fail(503,'Güvenli silme kaydı servisi henüz hazır değil.');
    const deletedAt=Date.now();
    // Persist the accepted deletion request outside the database before erasing any rows.
    // A failed database transaction is reconciled from this intent at the next local start.
    await env.RECORD_DELETION(p.id,deletedAt);
    try{await d.batch([
     d.stmt('INSERT OR IGNORE INTO profile_deletions(profile_id,deleted_at) VALUES(?,?)',p.id,deletedAt),
     d.stmt('DELETE FROM report_events WHERE report_id IN (SELECT id FROM question_reports WHERE profile_id=?)',p.id),
     d.stmt('DELETE FROM question_reports WHERE profile_id=?',p.id),
     d.stmt('DELETE FROM answers WHERE profile_id=?',p.id),
     d.stmt('DELETE FROM sessions WHERE profile_id=?',p.id),
     d.stmt('DELETE FROM tests WHERE profile_id=?',p.id),
     d.stmt('DELETE FROM profiles WHERE id=?',p.id)
    ]);}catch{fail(503,'Silme isteğin kaydedildi; kayıt servisi yeniden başladığında işlem tamamlanacak.');}
    return json({ok:true},200,{'Set-Cookie':cookie('',request,true)});
  }
  if(route==='/api/reports')return studentReports(request,d,p,url);
  if(route==='/api/study-summary'&&request.method==='GET')return json(await studySummary(d,p.id));
  if(route==='/api/me'&&request.method==='GET'){
    const last=await latest(d,p.id);const totals=await d.first('SELECT COUNT(*) AS attempted,COALESCE(SUM(correct),0) AS correct FROM answers WHERE profile_id=?',p.id);
    const today=await d.first("SELECT COUNT(*) AS n FROM answers WHERE profile_id=? AND date(created_at/1000,'unixepoch','+3 hours')=date(?/1000,'unixepoch','+3 hours')",p.id,Date.now());
    const active=await d.first('SELECT id,topic,mode,question_ids FROM tests WHERE profile_id=? AND finished_at IS NULL',p.id);
    const activeAnswers=active?await d.first('SELECT COUNT(*) AS n FROM answers WHERE test_id=?',active.id):null;
    const recent=await d.all('SELECT t.id,t.topic,t.mode,t.created_at,t.finished_at,COUNT(a.id) AS answered,COALESCE(SUM(a.correct),0) AS correct FROM tests t LEFT JOIN answers a ON a.test_id=t.id WHERE t.profile_id=? AND t.finished_at IS NOT NULL GROUP BY t.id ORDER BY t.created_at DESC LIMIT 8',p.id);
    return json({profile:{nickname:p.nickname,hasRecovery:!!p.recovery_hash},total:BANK.length,stats:{...totals,today:today.n,seen:last.length,mastered:last.filter(a=>a.correct).length,wrong:last.filter(a=>!a.correct).length},active:active?.id||null,activeSummary:active?{id:active.id,topic:active.topic,mode:active.mode,total:JSON.parse(active.question_ids).length,answered:activeAnswers.n}:null,recent,
      groups:GROUPS.map(g=>{const ids=BANK.filter(g.match).map(q=>q.id);return {id:g.id,name:g.name,description:g.description,count:ids.length,seen:last.filter(a=>ids.includes(a.question_id)).length,mastered:last.filter(a=>ids.includes(a.question_id)&&a.correct).length};})});
  }
  if(route==='/api/recovery'&&request.method==='POST'){
    await guardAttempts(request,env,d,'recovery');
    const code=token(),codeHash=await hash(code),currentHash=await hash(sessionSecret(request)),now=Date.now();
    await d.batch([
     d.stmt('UPDATE profiles SET recovery_hash=? WHERE id=? AND EXISTS(SELECT 1 FROM sessions WHERE profile_id=? AND hash=? AND expires_at>?)',codeHash,p.id,p.id,currentHash,now),
     d.stmt('DELETE FROM sessions WHERE profile_id=? AND hash<>? AND EXISTS(SELECT 1 FROM sessions WHERE profile_id=? AND hash=? AND expires_at>?)',p.id,currentHash,p.id,currentHash,now)
    ]);
    if(!await d.first('SELECT id FROM profiles WHERE id=? AND recovery_hash=?',p.id,codeHash))fail(401,'Oturumun sona erdi. Kurtarma kodunla geri dönebilirsin.');
    return json({code:code.match(/.{1,8}/g).join('-')});
  }
  if(route==='/api/logout-all'&&request.method==='POST'){
    await d.run('DELETE FROM sessions WHERE profile_id=? AND EXISTS(SELECT 1 FROM sessions WHERE profile_id=? AND hash=? AND expires_at>?)',p.id,p.id,await hash(sessionSecret(request)),Date.now());return json({ok:true},200,{'Set-Cookie':cookie('',request,true)});
  }
  if(route==='/api/logout'&&request.method==='POST'){
    const secret=sessionSecret(request);
    if(secret)await d.run('DELETE FROM sessions WHERE hash=?',await hash(secret));return json({ok:true},200,{'Set-Cookie':cookie('',request,true)});
  }
  if(route==='/api/wrongs'&&request.method==='GET'){
    const last=await latest(d,p.id);return json({questions:last.filter(a=>!a.correct).map(a=>({...publicQuestion(byId.get(a.question_id))}))});
  }
  if(route==='/api/tests'&&request.method==='POST'){
    const existing=await d.first('SELECT id FROM tests WHERE profile_id=? AND finished_at IS NULL',p.id);if(existing)return json({id:existing.id,resumed:true});
    const b=await body(request);if(!['practice','exam'].includes(b.mode))fail(400,'Çalışma biçimini seç.');
    if(![5,10,20,'all'].includes(b.count))fail(400,'Geçerli bir soru sayısı seç.');
    let pool=BANK,topic='Karma test';
    if(b.group==='review'){
      if(!/^[a-f0-9-]{36}$/.test(b.sourceTest||''))fail(400,'Tekrar edilecek testi seç.');
      const source=await testFor(d,b.sourceTest,p.id);if(!source.finished_at)fail(400,'Önce kaynak testi tamamla.');
      const answers=await d.all('SELECT question_id,correct FROM answers WHERE test_id=?',source.id);
      const correct=new Set(answers.filter(a=>a.correct).map(a=>a.question_id));
      pool=(await questionsForTest(d,source)).filter(q=>!correct.has(q.id));topic='Yanlış ve boşları tekrar';
    }
    else if(b.group==='wrong'){const ids=(await latest(d,p.id)).filter(a=>!a.correct).map(a=>a.question_id);pool=BANK.filter(q=>ids.includes(q.id));topic='Yanlışları tekrar';}
    else if(b.group&&b.group!=='all'){const g=GROUPS.find(x=>x.id===b.group);if(!g)fail(400,'Konu bulunamadı.');pool=BANK.filter(g.match);topic=g.name;}
    if(!pool.length)fail(400,'Bu bölümde çözülecek soru yok.');
    if(b.count!=='all'&&b.count>pool.length)fail(400,`Bu başlıkta ${pool.length} soru var. Soru sayısını güncelle veya tamamını seç.`);
    const selected=shuffle(pool).slice(0,b.count==='all'?pool.length:b.count);
    const id=crypto.randomUUID();await d.run('INSERT INTO tests(id,profile_id,topic,mode,question_ids,question_snapshot,created_at) VALUES(?,?,?,?,?,?,?)',id,p.id,topic,b.mode,JSON.stringify(selected.map(q=>q.id)),JSON.stringify(selected),Date.now());
    return json({id},201);
  }
  const match=route.match(/^\/api\/tests\/([a-f0-9-]{36})(?:\/(answer|finish))?$/);
  if(match){const t=await testFor(d,match[1],p.id);
    if(request.method==='GET'&&!match[2])return json(await serializeTest(d,t));
    if(request.method==='POST'&&match[2]==='answer'){
      if(t.finished_at)fail(409,'Bu test tamamlandı.');const b=await body(request);
      if(!JSON.parse(t.question_ids).includes(b.questionId)||!LETTERS.includes(b.choice)||String(b.choice).length!==1)fail(400,'Soru veya seçenek geçersiz.');
      const q=(await questionsForTest(d,t)).find(q=>q.id===b.questionId);
      const existing=await d.first('SELECT choice FROM answers WHERE test_id=? AND question_id=?',t.id,q.id);
      if(existing&&existing.choice!==b.choice)fail(409,'Bu sorunun cevabı zaten kaydedildi.');
      await d.run('INSERT OR IGNORE INTO answers(id,test_id,profile_id,question_id,choice,correct,created_at) VALUES(?,?,?,?,?,?,?)',crypto.randomUUID(),t.id,p.id,q.id,b.choice,Number(q.answer===b.choice),Date.now());
      if(b.compact===true){
        const saved=await d.first('SELECT choice,correct FROM answers WHERE test_id=? AND question_id=?',t.id,q.id);
        if(saved.choice!==b.choice)fail(409,'Bu sorunun cevabı zaten kaydedildi.');
        return json({testId:t.id,questionId:q.id,choice:saved.choice,...(t.mode==='practice'?{...solution(q),correct:!!saved.correct}:{})});
      }
      return json(await serializeTest(d,t));
    }
    if(request.method==='POST'&&match[2]==='finish'){
      await d.run('UPDATE tests SET finished_at=COALESCE(finished_at,?) WHERE id=? AND profile_id=?',Date.now(),t.id,p.id);
      return json(await serializeTest(d,await testFor(d,t.id,p.id)));
    }
  }
  fail(404,'İşlem bulunamadı.');
}
export default {async fetch(request,env){
  let response;
  try {
    requireTransport(request);
    const url=new URL(request.url);
    if(url.pathname==='/yonetim'||url.pathname.startsWith('/api/admin/'))await requireOwnerAccess(request,env);
    if(url.pathname.startsWith('/api/'))response=await api(request,env);
    else if(url.pathname==='/yonetim'&&request.method==='GET')response=new Response(ADMIN_PAGE,{headers:{'Content-Type':'text/html; charset=utf-8'}});
    else if(url.pathname==='/'&&request.method==='GET')response=new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8'}});
    else response=new Response('Bulunamadı',{status:404});
  }catch(e){
    if(!e.status)console.error('Request failed:',e.name||'Error');
    response=json({error:e.status?e.message:'Kayıt servisine şu an ulaşılamıyor. Bilgilerini değiştirmeden tekrar dene.'},e.status||503,e.retryAfter?{'Retry-After':String(e.retryAfter)}:{});
  }
  return secureResponse(response,request);
}};

