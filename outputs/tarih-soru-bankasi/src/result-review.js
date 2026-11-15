const REVIEW_PAGE_SIZE=20;
function reviewPageFor(t,value){const page=Number(value);return Math.min(Math.max(1,Math.ceil(t.questions.length/REVIEW_PAGE_SIZE)),Number.isSafeInteger(page)&&page>0?page:1);}
function reviewPagination(t,bottom=false){
 const pages=Math.ceil(t.questions.length/REVIEW_PAGE_SIZE);if(pages<=1)return '';
 return `<nav class="review-pagination" aria-label="${bottom?'Alt cevap inceleme sayfaları':'Cevap inceleme sayfaları'}"><button class="btn secondary" data-action="review-page" data-page="${state.reviewPage-1}" ${state.reviewPage<=1?'disabled':''}>Önceki sayfa</button>${bottom?`<span class="small muted">Sayfa ${state.reviewPage} / ${pages}</span>`:`<label class="field">İnceleme sayfası<select data-review-select>${Array.from({length:pages},(_,i)=>`<option value="${i+1}" ${state.reviewPage===i+1?'selected':''}>${i+1} / ${pages}</option>`).join('')}</select></label>`}<button class="btn secondary" data-action="review-page" data-page="${state.reviewPage+1}" ${state.reviewPage>=pages?'disabled':''}>Sonraki sayfa</button></nav>`;
}
function resultReview(t){
 state.reviewPage=reviewPageFor(t,state.reviewPage);const start=(state.reviewPage-1)*REVIEW_PAGE_SIZE,end=Math.min(start+REVIEW_PAGE_SIZE,t.questions.length);
 return `<div class="section-head" style="margin-top:30px"><h2 id="review-heading" tabindex="-1">Cevaplarını incele</h2></div><p class="small muted" role="status">${start+1}–${end} / ${t.questions.length} soru</p>${reviewPagination(t)}<section class="card" aria-labelledby="review-heading">${t.questions.slice(start,end).map((q,i)=>`<article class="review-item"><div class="row between"><span class="small muted">Soru ${start+i+1} · ${esc(q.topic)}</span><span class="small ${q.correct?'feedback-good':q.choice?'feedback-bad':'muted'}">${q.correct?'Doğru':q.choice?'Yanlış':'Boş'}</span></div><p class="stem">${esc(q.stem)}</p><p class="small"><b>Doğru cevap ${q.answer}:</b> ${esc(q.options['ABCDE'.indexOf(q.answer)])}</p>${q.choice&&!q.correct?`<p class="small muted">Senin cevabın ${q.choice}: ${esc(q.options['ABCDE'.indexOf(q.choice)])}</p>`:''}<details><summary>Seçenekler ve açıklama</summary><ol type="A">${q.options.map(o=>`<li>${esc(o)}</li>`).join('')}</ol><p>${esc(q.explanation)}</p>${sources(q)}</details>${reportButton(q)}</article>`).join('')}</section>${reviewPagination(t,true)}`;
}
function setReviewPage(value){
 if(busy||pendingHistory||state.view!=='result'||!state.test?.finishedAt)return;
 const page=reviewPageFor(state.test,value);if(page===state.reviewPage)return;
 state.reviewPage=page;$('#result-review').innerHTML=resultReview(state.test);rememberRoute();
 $('#review-heading').focus({preventScroll:true});$('#review-heading').scrollIntoView({block:'start'});
}
document.addEventListener('change',e=>{if(e.target.matches('[data-review-select]'))setReviewPage(e.target.value);});

