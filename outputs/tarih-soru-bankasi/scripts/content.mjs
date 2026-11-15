import {readFile} from 'node:fs/promises';

// Add future subject banks here; old question IDs and persisted test references stay intact.
const files=['kpss-tarih-ilk-konu-soru-bankasi.json','kpss-tarih-asya-hun-kavimler-soru-bankasi.json','kpss-tarih-yorum-soru-bankasi.json','kpss-tarih-avrupa-hun-soru-bankasi.json','kpss-tarih-gokturk-soru-bankasi.json','kpss-tarih-uygur-soru-bankasi.json','kpss-tarih-avar-soru-bankasi.json','kpss-tarih-avrupa-topluluklari-soru-bankasi.json','kpss-tarih-hazar-soru-bankasi.json','kpss-tarih-kirgiz-karluk-diger-soru-bankasi.json','kpss-tarih-sabar-kipcak-soru-bankasi.json','kpss-tarih-kultur-uygarlik-soru-bankasi.json','kpss-tarih-kultur-tahta-ek-soru-bankasi.json','kpss-tarih-yazi-edebiyat-ek-soru-bankasi.json','kpss-tarih-ordu-yargi-ek-soru-bankasi.json','kpss-tarih-turk-islam-ilk-soru-bankasi.json','kpss-tarih-elci-ek-soru-bankasi.json','kpss-tarih-yeni-devletler-soru-bankasi.json','kpss-tarih-islam-medeniyet-soru-bankasi.json','kpss-tarih-islam-kapsam-ek-soru-bankasi.json','kpss-tarih-islam-tamamlama-soru-bankasi.json'];
export async function loadContent(){
  const banks=await Promise.all(files.map(file=>readFile(new URL('../../'+file,import.meta.url),'utf8').then(JSON.parse)));
  const questions=banks.flatMap(b=>b.questions);
  if(!questions.length||new Set(questions.map(q=>q.id)).size!==questions.length)throw new Error('Boş banka veya yinelenen soru kimliği.');
  const sources={};
  for(const bank of banks){
    if(bank.question_count!==bank.questions.length)throw new Error('Banka soru sayısı tutarsız: '+bank.title);
    for(const [id,source]of Object.entries(bank.sources)){
      if(sources[id]&&JSON.stringify(sources[id])!==JSON.stringify(source))throw new Error('Kaynak kimliği çakışıyor: '+id);
      sources[id]=source;
    }
  }
  for(const q of questions){
    if(q.options.length!==5||new Set(q.options).size!==5||!/^[A-E]$/.test(q.answer))throw new Error('Geçersiz soru: '+q.id);
    if(!q.stem?.trim()||!q.explanation?.trim())throw new Error('Eksik soru veya açıklama: '+q.id);
    if(!['Kolay','Orta','Zor'].includes(q.difficulty))throw new Error('Eksik güçlük etiketi: '+q.id);
    if(!Array.isArray(q.sources)||!q.sources.length)throw new Error('Kaynağı olmayan aktif soru: '+q.id);
    if(!Number.isInteger(q.revision)||q.revision<1)throw new Error('Geçersiz soru sürümü: '+q.id);
    if(/ders\s+(not|kaynak|materyal|çerçeve|sınıflandır)|derslerde|notlardaki|kullanıcının tercih/i.test(q.stem+' '+q.explanation))throw new Error('Öğrenci metninde editör ifadesi: '+q.id);
    for(const id of q.sources)if(!sources[id])throw new Error('Eksik kaynak: '+id);
  }
  if(new Set(questions.map(q=>q.stem.trim())).size!==questions.length)throw new Error('Yinelenen soru kökü.');
  return {questions,sources,banks};
}

