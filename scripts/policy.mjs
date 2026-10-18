export const jobs = ['measurement', 'content', 'distribution'];
export const freeModels = ['opencode/deepseek-v4.1-flash-free', 'opencode/glm-5.3-flash-free'];
export function selectFree(catalog,preferred) {
  if(!freeModels.includes(preferred))throw new Error('Preferred model not allowlisted');
  for(const candidate of [preferred,...freeModels.filter(x=>x!==preferred)]){
    try{return requireFree(catalog,candidate);}catch{}
  }
  throw new Error('No allowlisted model has verified zero pricing; no inference started.');
}
export function localClock(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'America/Mexico_City', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
  return {day:`${p.year}-${p.month}-${p.day}`, minutes:Number(p.hour)*60+Number(p.minute), seconds:Number(p.second)};
}
export function timeBudget(date, maxMinutes = 50) {
  const p=localClock(date);
  if(p.minutes<585 || p.minutes>=765) return 0;
  return Math.min(maxMinutes*60000, (765-p.minutes)*60000-p.seconds*1000);
}
export function requireFree(catalog, model) {
  if(!freeModels.includes(model)) throw new Error('Model not explicitly allowlisted; no paid or automatic fallback.');
  const [provider,id]=model.split('/');
  const m=catalog[provider]?.models?.[id];
  if(!m || !m.cost || m.cost.input!==0 || m.cost.output!==0) throw new Error('Missing or nonzero model cost; stopped before inference.');
  for(const [key,value] of Object.entries(m.cost)) {
    if(typeof value!=='number' || value!==0) throw new Error(`Unverified cost field ${key}; stopped.`);
  }
  return {id:model,cost:m.cost,checkedAt:new Date().toISOString()};
}
export function validateConfig(c) {
  for(const k of ['siteRepo','stateDir','opencodePath']) if(typeof c[k]!=='string'||!c[k]) throw new Error(`Missing ${k}`);
  if(c.timezone!=='America/Mexico_City') throw new Error('Timezone must be America/Mexico_City.');
  if(!Number.isFinite(c.maxMinutes)||c.maxMinutes<1||c.maxMinutes>50) throw new Error('maxMinutes must be 1–50.');
  if(!freeModels.includes(c.model)) throw new Error('Unsupported model; choose an allowlisted free model.');
}
