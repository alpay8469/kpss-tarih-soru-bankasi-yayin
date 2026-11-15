const REQUEST_TIMEOUT_MS=15000;
async function requestJSON(path,body,{timeoutMs=REQUEST_TIMEOUT_MS}={}){
 const controller=new AbortController(),writing=body!==undefined;
 const timer=setTimeout(()=>controller.abort(),timeoutMs);let response;
 const failure=(message,kind,status=response?.status||0)=>Object.assign(Error(message),{kind,status,uncertain:writing&&(status<400||status>=500)});
 try{
  response=await fetch(path,{method:writing?'POST':'GET',credentials:'same-origin',signal:controller.signal,headers:{'Content-Type':'application/json'},...(writing?{body:JSON.stringify(body)}:{})});
  const type=(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
  let data;
  if(type==='application/json'){
   try{data=await response.json();}catch(e){if(controller.signal.aborted)throw e;throw failure('Sunucudan geçerli bir yanıt alınamadı. Biraz sonra yeniden kontrol et.','response');}
  }else throw failure(response.status>=500?'Sunucuya şu an ulaşılamıyor. Biraz sonra yeniden kontrol et.':'Sunucudan beklenen yanıt alınamadı. Sayfayı yenileyip yeniden kontrol et.','response');
  if(!data||typeof data!=='object'||Array.isArray(data))throw failure('Sunucudan geçerli bir yanıt alınamadı. Biraz sonra yeniden kontrol et.','response');
  if(!response.ok){
   const fallback=response.status===401?'Oturumun sona erdi. Yeniden giriş yap.':response.status===429?'Çok sık işlem yapıldı. Biraz bekleyip yeniden dene.':response.status>=500?'Kayıt servisine şu an ulaşılamıyor. Biraz sonra durumunu kontrol et.':'İşlem tamamlanamadı. Sayfayı yenileyip yeniden kontrol et.';
   throw failure(response.status<500&&typeof data.error==='string'&&data.error.length<=300?data.error:fallback,'http');
  }
  return data;
 }catch(e){
  if(controller.signal.aborted)throw failure(writing?'Bağlantı zaman aşımına uğradı. İşlemin kaydedilip kaydedilmediğini yeniden kontrol et.':'Bağlantı zaman aşımına uğradı. Yeniden deneyebilirsin.','timeout');
  if(e.kind)throw e;
  throw failure(writing?'Bağlantı kesildi. İşlemin kaydedilip kaydedilmediğini yeniden kontrol et.':'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.','network');
 }finally{clearTimeout(timer);}
}

