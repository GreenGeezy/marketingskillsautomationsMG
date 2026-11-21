export const jobs = ['measurement', 'content', 'distribution'];
// Zero-cost models, tried in this order. When one hits its free limit the runner moves to the
// next one in the same run instead of losing the day. Every model is re-checked against the
// live catalog before use: a model that stops being free is skipped, never billed.
export const freeModels = [
  'opencode/deepseek-v4.1-flash-free',
  'opencode/glm-5.3-flash-free',
  'opencode/minimax-m3.1-flash-free',
  'opencode/kimi-k2.5-free',
  'opencode/deepseek-v4-flash-free',
];
// Optional last resort, off unless config.paidFallback.model is set. Only very cheap OpenRouter
// models qualify (USD per 1M tokens). The monthly ceiling is enforced by the credit limit on the
// OpenRouter key itself; set that limit to $1 in the OpenRouter dashboard.
export const PAID_CAP = {input: 0.1, output: 0.5};
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
// A day marker alone must not burn the whole day. The marker is written when an agent starts,
// so an attempt stopped by provider quota, a stale lock or a crash used to block every later
// trigger. Retry only while the job has no finished outcome and the day still has attempts left.
export const MAX_ATTEMPTS_PER_DAY = 3;
export function retryAllowed(markerStatus, attemptsToday, maxAttempts = MAX_ATTEMPTS_PER_DAY) {
  if (['completed','partial','blocked'].includes(markerStatus)) return false;
  return Number(attemptsToday) < maxAttempts;
}
// The marker file is named <day>-<job>.json, so a marker from another day can never be read as
// today's. Older markers have no attempt counter; print them as one attempt used.
export function attemptState(marker) {
  const attempts = Number(marker?.attempts) || (marker ? 1 : 0);
  return {attempts, retry: retryAllowed(marker?.status, attempts)};
}
function splitModel(model) {
  const i = String(model).indexOf('/');
  return [String(model).slice(0, i), String(model).slice(i + 1)];
}
export function requireCapped(catalog, model) {
  if (!String(model).startsWith('openrouter/')) throw new Error('Paid fallback must be an OpenRouter model.');
  const [provider, id] = splitModel(model);
  const m = catalog[provider]?.models?.[id];
  const cost = m?.cost;
  if (!cost || !Number.isFinite(cost.input) || !Number.isFinite(cost.output)) throw new Error('Paid fallback price unknown; stopped.');
  if (cost.input > PAID_CAP.input || cost.output > PAID_CAP.output) throw new Error('Paid fallback is above the price cap; stopped.');
  if (m.tool_call === false) throw new Error('Paid fallback cannot use tools.');
  return {id: model, cost, paid: true, checkedAt: new Date().toISOString()};
}
/** Free models in order, starting with config.model. */
export function modelChain(config) {
  return [...new Set([config.model, ...(config.fallbackModels || freeModels)])].filter(m => freeModels.includes(m));
}
/** Models still cooling down. Reads the old single-model shape too. */
export function cooledModels(cooldown, config, now = Date.now()) {
  const out = {};
  for (const [model, v] of Object.entries(cooldown?.models || {})) if (Date.parse(v?.retryAt) > now) out[model] = v.retryAt;
  if (!cooldown?.models && Date.parse(cooldown?.retryAt) > now) out[config.model] = cooldown.retryAt;
  return out;
}
/** First usable model: free models in order, then the optional capped paid fallback. Null when none. */
export function pickModel(catalog, config, cooldown, now = Date.now()) {
  const cooled = cooledModels(cooldown, config, now);
  for (const model of modelChain(config)) {
    if (cooled[model]) continue;
    try { return requireFree(catalog, model); } catch {}
  }
  const paid = config.paidFallback?.model;
  if (paid && !cooled[paid]) { try { return requireCapped(catalog, paid); } catch {} }
  return null;
}
export function addCooldown(cooldown, model, quota) {
  const models = {...(cooldown?.models || {})};
  models[model] = {retryAt: quota.retryAt, observedAt: quota.observedAt};
  return {status: 'quota-exhausted', models};
}
export function earliestRetry(cooldown, config, now = Date.now()) {
  const times = Object.values(cooledModels(cooldown, config, now)).sort();
  return times[0] || null;
}
export function requireFree(catalog, model) {
  if(!freeModels.includes(model)) throw new Error('Model not explicitly allowlisted; no paid or automatic fallback.');
  const [provider,id]=splitModel(model);
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
  if(c.fallbackModels!==undefined && (!Array.isArray(c.fallbackModels) || c.fallbackModels.some(m=>!freeModels.includes(m)))) throw new Error('fallbackModels may only list allowlisted free models.');
  if(c.paidFallback!==undefined && c.paidFallback!==null && !String(c.paidFallback?.model||'').startsWith('openrouter/')) throw new Error('paidFallback.model must be an OpenRouter model.');
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
