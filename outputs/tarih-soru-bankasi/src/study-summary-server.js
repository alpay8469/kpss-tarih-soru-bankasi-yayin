function studyPeriods(now){
 const dayMs=86400000,offset=10800000,local=new Date(now+offset);
 const start=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-offset;
 const weekStart=start-((local.getUTCDay()+6)%7)*dayMs;
 return {daily:{from:start,until:start+dayMs},weekly:{from:weekStart,until:weekStart+7*dayMs}};
}
async function studySummary(d,profileId,now=Date.now()){
 const periods=studyPeriods(now);
 const totals=await d.first(`WITH completed AS (
   SELECT t.id,t.finished_at>=? AS today,json_array_length(t.question_ids) AS total,COUNT(a.id) AS answered,COALESCE(SUM(a.correct),0) AS correct
   FROM tests t LEFT JOIN answers a ON a.test_id=t.id AND a.profile_id=t.profile_id
   WHERE t.profile_id=? AND t.finished_at>=? AND t.finished_at<?
   GROUP BY t.id
  ) SELECT COUNT(*) AS tests,COALESCE(SUM(total),0) AS questions,COALESCE(SUM(correct),0) AS correct,
   COALESCE(SUM(answered-correct),0) AS wrong,COALESCE(SUM(total-answered),0) AS empty,
   COALESCE(SUM(today),0) AS daily_tests,COALESCE(SUM(total*today),0) AS daily_questions,
   COALESCE(SUM(correct*today),0) AS daily_correct,COALESCE(SUM((answered-correct)*today),0) AS daily_wrong,
   COALESCE(SUM((total-answered)*today),0) AS daily_empty FROM completed`,periods.daily.from,profileId,periods.weekly.from,Math.min(periods.weekly.until,now+1));
 const fields=['tests','questions','correct','wrong','empty'];
 return {generatedAt:now,timeZone:'Europe/Istanbul',
  daily:{...periods.daily,...Object.fromEntries(fields.map(key=>[key,totals['daily_'+key]]))},
  weekly:{...periods.weekly,...Object.fromEntries(fields.map(key=>[key,totals[key]]))}};
}

