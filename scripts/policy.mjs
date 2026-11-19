export const jobs = ['measurement', 'content', 'distribution'];
export const freeModels = ['opencode/deepseek-v4.1-flash-free'];
export function selectFree(catalog,preferred) {
  return requireFree(catalog, preferred);
}
export function localClock(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'America/Mexico_City', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
  return {day:`${p.year}-${p.month}-${p.day}`, minutes:Number(p.hour)*60+Number(p.minute), seconds:Number(p.second)};
}
// Scheduled starts stay at 09:45/10:45/11:45. Windows starts a missed task as soon as the
// laptop is back on, so the runner accepts work from 07:00 to 21:00 Mexico City time and
// a day missed at 09:45 is caught up later the same day. completedToday() keeps it to one
// finished run per job per day.
export const WINDOW_START = 420; // 07:00
export const WINDOW_END = 1260; // 21:00
export function timeBudget(date, maxMinutes = 50) {
  const p=localClock(date);
  if(p.minutes<WINDOW_START || p.minutes>=WINDOW_END) return 0;
  return Math.min(maxMinutes*60000, (WINDOW_END-p.minutes)*60000-p.seconds*1000);
}
// True when this job already finished today (completed, partial or blocked). Pure: pass receipts in.
export function completedToday(receipts, job, day) {
  return receipts.some(r => r && r.job===job && ['completed','partial','blocked'].includes(r.status) &&
    localClock(new Date(r.startedAt||r.at||0)).day===day);
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

/** A session that writes nothing for this long has not started any work at all. */
export const AGENT_STALL_MS = 8 * 60 * 1000;
export function agentStalled({elapsedMs, logBytes, limit = AGENT_STALL_MS}) {
  return Number.isFinite(elapsedMs) && logBytes === 0 && elapsedMs >= limit;
}

/** distribution-due.json is either a flat array or a {dueNow,nextDue} ledger. */
export function normalizeDistributionDue(ledger) {
  if (Array.isArray(ledger)) return ledger;
  const rows = [...(ledger?.dueNow || []), ...(ledger?.nextDue || [])];
  return rows.map(row => ({...row, status: row.status || 'due', dueAt: row.dueAt || row.nextReviewAt}));
}
