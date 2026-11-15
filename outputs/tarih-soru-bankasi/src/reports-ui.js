const reportCategories={answer:'Bilgi / cevap hatası',multiple:'Birden fazla doğru cevap',unclear:'Belirsiz soru kökü',explanation:'Açıklama sorunu',typo:'Yazım hatası',other:'Diğer'};
const reportStatuses={new:'Yeni',reviewing:'İnceleniyor',resolved:'Düzeltildi',no_change:'Değişiklik gerekmiyor'};
state.reports={reports:[],page:1,total:0};
function reportButton(q){return `<button type="button" class="text-btn small" data-report="${esc(q.id)}" style="margin-top:18px">Soruda hata bildir</button>`;}
function reportsView(){const data=state.reports;return `${head('Geri bildirimlerin','Bildirimlerim','İlettiğin soru hatalarını ve inceleme durumlarını buradan takip edebilirsin.')}<button class="btn secondary" data-report-page="${data.page}">Bildirimleri yenile</button><div class="stack" style="margin-top:22px">${data.reports.length?data.reports.map(r=>`<article class="card pad"><div class="row between wrap"><h2>${esc(reportCategories[r.category])}</h2><span class="pill">${esc(reportStatuses[r.status])}</span></div><p class="small muted" style="margin-top:10px">${esc(r.questionId)} · Sürüm ${r.revision} · ${new Date(r.createdAt).toLocaleDateString('tr-TR')}</p><p style="white-space:pre-line;margin-top:15px">${esc(r.stem)}</p>${r.detail?`<p class="small report-text" style="margin-top:12px"><b>Açıklaman:</b> ${esc(r.detail)}</p>`:''}<p class="small report-text" style="margin-top:15px"><b>İnceleme:</b> ${r.decisionHidden?'Karar gerekçesini testini tamamladıktan sonra görebilirsin.':esc(r.decision||'Bildirimin alındı. İnceleme sırasını bekliyor.')}</p><button class="text-btn" style="margin-top:15px" data-action="open-result" data-id="${esc(r.testId)}">İlgili testi aç →</button></article>`).join(''):'<section class="card empty"><h2>Henüz bildirimin yok.</h2><p>Soru veya çözüm ekranındaki “Soruda hata bildir” düğmesini kullanabilirsin.</p></section>'}</div><div class="row wrap" style="margin-top:20px"><button class="btn secondary" data-report-page="${data.page-1}" ${data.page<=1?'disabled':''}>Önceki sayfa</button><span class="small muted">${data.total} bildirim · Sayfa ${data.page}</span><button class="btn secondary" data-report-page="${data.page+1}" ${data.page*20>=data.total?'disabled':''}>Sonraki sayfa</button></div>`;}
document.body.insertAdjacentHTML('beforeend',`<dialog id="report-dialog" aria-labelledby="report-title"><h2 id="report-title">Soruda hata bildir</h2><p id="report-question" class="small"></p><form id="report-form" class="stack"><label class="field">Bildirim nedeni<select name="category" required>${Object.entries(reportCategories).map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><label class="field">Açıklaman <span class="small muted">İsteğe bağlı; “Diğer” seçersen gerekli. En fazla 1500 karakter.</span><textarea name="detail" maxlength="1500" rows="4" placeholder="Hangi kısımda sorun gördüğünü yazabilirsin."></textarea></label><p id="report-feedback" role="status" aria-live="polite" class="small" style="margin:0"></p><div class="row"><button type="button" class="btn secondary" data-report-close>Vazgeç</button><button class="btn" type="submit">Bildirimi gönder</button></div></form><div id="report-success" hidden><p role="status"></p><div class="row"><button class="btn secondary" data-report-close>Kapat</button><button class="btn" data-report-follow>Bildirimlerime git</button></div></div></dialog>`);
let reportTarget=null,reportSending=false;
function closeReport(){if(reportSending)return;$('#report-dialog').close();reportTarget=null;}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-report')){
  e.stopImmediatePropagation();const q=state.test?.questions.find(q=>q.id===b.dataset.report);if(!q||busy)return;
  reportTarget={testId:state.test.id,questionId:q.id};$('#report-form').reset();$('#report-form').hidden=false;$('#report-success').hidden=true;$('#report-feedback').textContent='';$('#report-question').textContent=q.id+' · Sürüm '+q.revision+' — '+q.stem.slice(0,170);$('#report-dialog').showModal();return;
 }
 if(b.hasAttribute('data-report-close')){e.stopImmediatePropagation();closeReport();return;}
 if(b.hasAttribute('data-report-follow')){e.stopImmediatePropagation();closeReport();void run(()=>go('reports'));return;}
 if(b.hasAttribute('data-report-page')){e.stopImmediatePropagation();void run(async()=>{const data=await api('/reports?page='+Number(b.dataset.reportPage));if(pendingHistory)return;state.reports=data;render();});}
});
$('#report-dialog').addEventListener('cancel',e=>{if(reportSending)e.preventDefault();else reportTarget=null;});
$('#report-form').addEventListener('submit',async e=>{
 e.preventDefault();if(reportSending||!reportTarget)return;
 const form=e.currentTarget,data=Object.fromEntries(new FormData(form));reportSending=true;
 form.querySelectorAll('button').forEach(b=>b.disabled=true);$('#report-feedback').textContent='Gönderiliyor…';
 try{
  const result=await api('/reports',{...reportTarget,...data});
  form.hidden=true;$('#report-success').hidden=false;$('#report-success p').textContent=result.duplicate?'Bu soru sürümü için bildirimin zaten kayıtlı. Durumunu Bildirimlerim ekranından takip edebilirsin.':'Bildirimin alındı. Testin ve cevabın değişmedi. İnceleme durumunu Bildirimlerim ekranından takip edebilirsin.';
  $('#report-success button').focus();
 }catch(error){$('#report-feedback').textContent=error.message;}
 finally{reportSending=false;form.querySelectorAll('button').forEach(b=>b.disabled=false);}
});
window.addEventListener('popstate',()=>{if($('#report-dialog').open){$('#report-dialog').close();reportTarget=null;}});

