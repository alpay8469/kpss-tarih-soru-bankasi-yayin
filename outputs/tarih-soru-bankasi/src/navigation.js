// Only navigation and unsaved UI choices go into browser history. Saved answers stay on the server.
const routeNames={home:'sorular',wrong:'yanlislar',progress:'ilerleme',profile:'profil',reports:'bildirimler',setup:'test-hazirla',test:'test',result:'sonuc',welcome:'giris',recover:'kurtarma'};
let pendingHistory=false;
function routeUrl(){
  const p=new URLSearchParams();
  p.set('sayfa',state.me?routeNames[state.view]:state.recover?'kurtarma':'giris');
  if(state.me&&['test','result'].includes(state.view)&&state.test){
    p.set('test',state.test.id);
    if(state.view==='test')p.set('soru',String(state.index+1));
    if(state.view==='result'&&state.reviewPage>1)p.set('inceleme',String(state.reviewPage));
  }
  if(state.me&&state.view==='setup'){
    p.set('konu',state.group);p.set('adet',String(state.count));p.set('mod',state.mode);
  }
  return '/?'+p.toString();
}
function savedTestIndex(test){
 try{const raw=localStorage.getItem('tarih-test-position:'+test.id);const i=raw===null?NaN:Number(raw);if(Number.isInteger(i)&&i>=0&&i<test.questions.length)return i;}catch{}
 return Math.max(0,test.questions.findIndex(q=>!q.choice));
}
function rememberRoute(replace=false){
  // A Back/Forward click during a request wins over that request's navigation.
  if(pendingHistory)return;
  if(state.me&&state.view==='test'&&state.test&&!state.test.finishedAt){try{localStorage.setItem('tarih-test-position:'+state.test.id,String(state.index));}catch{}}
  const url=routeUrl();
  const entry={tarih:true,testId:state.test?.id,index:state.index,selected:state.selected};
  history[replace||location.pathname+location.search===url?'replaceState':'pushState'](entry,'',url);
}
function showPage({replace=false,focus=true}={}){
  if(pendingHistory)return;
  render();rememberRoute(replace);window.scrollTo(0,0);
  if(focus)$('h1')?.focus({preventScroll:true});
}
async function go(view){
  const me=await api('/me');
  const wrongs=view==='wrong'?(await api('/wrongs')).questions:[];
  const reports=view==='reports'?await api('/reports'):state.reports;
  const studySummary=view==='progress'?await api('/study-summary'):null;
  if(pendingHistory)return;
  state.me=me;state.wrongs=wrongs;state.reports=reports;state.studySummary=studySummary;state.view=view;showPage();
}
async function openTest(id){
  const test=await api('/tests/'+id);
  if(pendingHistory)return;
  state.test=test;state.view=test.finishedAt?'result':'test';state.reviewPage=1;
  state.index=savedTestIndex(test);state.selected=null;showPage();
}
async function startSetup(group){
  await reloadMe();if(pendingHistory)return;
  if(state.me.active){await openTest(state.me.active);return;}
  state.group=group;state.view='setup';showPage();
}
async function restoreRoute(){
  const params=new URLSearchParams(location.search);
  let view=Object.keys(routeNames).find(v=>routeNames[v]===params.get('sayfa'))||'home';
  const entry=history.state;
  try{
    const me=await api('/me');
    let test=null,wrongs=[],index=0;
    const reports=view==='reports'?await api('/reports'):state.reports;
    const studySummary=view==='progress'?await api('/study-summary'):null;
    if(view==='welcome'||view==='recover')view='home';
    if(view==='wrong')wrongs=(await api('/wrongs')).questions;
    if(view==='test'||view==='result'){
      const id=params.get('test');
      if(!/^[a-f0-9-]{36}$/.test(id||''))view='home';
      else{
        try{test=await api('/tests/'+id);}catch(e){if(e.status===404){view='home';toast('Bu test bulunamadı veya bu profile ait değil.',true);}else throw e;}
        if(test){
          view=test.finishedAt?'result':'test';
          const requested=Number(params.get('soru'));
          index=Number.isSafeInteger(requested)&&requested>0?Math.min(requested-1,test.questions.length-1):savedTestIndex(test);
        }
      }
    }
    if(pendingHistory)return;
    state.me=me;state.view=view;state.test=test;state.wrongs=wrongs;state.index=index;
    state.reviewPage=view==='result'&&test?reviewPageFor(test,params.get('inceleme')):1;
    state.reports=reports;
    state.studySummary=studySummary;
    state.selected=test&&!test.questions[index].choice&&entry?.testId===test.id&&entry.index===index&&/^[A-E]$/.test(entry.selected||'')?entry.selected:null;
    if(view==='setup'){
      const group=params.get('konu');
      state.group=['all',...me.groups.map(g=>g.id),...(me.stats.wrong?['wrong']:[])].includes(group)?group:'all';
      const count=params.get('adet');state.count=count==='all'?'all':[5,10,20].includes(Number(count))?Number(count):10;
      state.mode=params.get('mod')==='exam'?'exam':'practice';
    }
    showPage({replace:true});
  }catch(e){
    if(pendingHistory)return;
    if(e.status===401){
      state.me=null;state.test=null;state.code=null;state.selected=null;
      state.recover=view==='recover';showPage({replace:true});
    }else{
      $('#app').innerHTML='<main id="main" class="loading"><div class="card pad"><h2>Bu sayfayı açamadık.</h2><p class="lead">Bağlantını kontrol edip yeniden deneyebilirsin. Kaydedilmiş cevapların korunur.</p><button class="btn" style="margin-top:20px" data-action="retry-route">Yeniden dene</button></div></main>';
      toast(e.message,true);
    }
  }
}
async function flushHistory(){
  if(busy||!pendingHistory)return;
  pendingHistory=false;
  await run(restoreRoute);
}
window.addEventListener('popstate',()=>{
  pendingHistory=true;
  // Cancel an unfinished confirmation when the user navigates away.
  if($('#confirm').open)$('#cancel').click();
  void flushHistory();
});

