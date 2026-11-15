function renderAnswerState(test){if(!pendingHistory&&state.test===test){render();rememberRoute(true);}}
async function checkSavedAnswer(test,q){
 let fresh;
 try{fresh=await api('/tests/'+test.id);if(fresh.id!==test.id||!Array.isArray(fresh.questions))throw Error('Invalid test');}
 catch(e){if(e.status===401)throw e;renderAnswerState(test);throw Error('Cevabının kayıt durumu doğrulanamadı. Bağlantın düzelince “Kayıt durumunu kontrol et” düğmesini kullan.');}
 const saved=fresh.questions.find(item=>item.id===q.id);
 if(!saved){renderAnswerState(test);throw Error('Bu sorunun kayıt durumu doğrulanamadı. Sayfayı yenileyip yeniden kontrol et.');}
 const pending=q.pendingChoice;delete q.pendingChoice;
 if(state.test===test){
  state.test=fresh;
  if(fresh.finishedAt){state.view='result';state.reviewPage=1;}
  if(!pendingHistory){render();rememberRoute(true);}
 }
 if(saved.choice)toast(saved.choice===pending?'Cevabının kaydedildiği doğrulandı.':'Sunucuda kayıtlı olan cevabın korundu.');
 else toast(fresh.finishedAt?'Testin tamamlanmış. Sonucunu inceleyebilirsin.':'Bu cevap henüz kayıtlı görünmüyor. İstersen yeniden kaydedebilirsin.',true);
}
async function saveAnswer(){
 const test=state.test,q=test.questions[state.index];
 if(q.pendingChoice){await checkSavedAnswer(test,q);return;}
 const choice=state.selected;
 try{
  const saved=await api('/tests/'+test.id+'/answer',{questionId:q.id,choice,compact:true});
  if(saved.testId!==test.id||saved.questionId!==q.id||saved.choice!==choice)throw Object.assign(Error('Cevabın doğrulanamadı.'),{uncertain:true});
  const {testId,questionId,...answer}=saved;Object.assign(q,answer);renderAnswerState(test);
 }catch(e){
  if(!e.uncertain&&e.status!==409)throw e;
  q.pendingChoice=choice;await checkSavedAnswer(test,q);
 }
}

