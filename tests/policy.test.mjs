import test from 'node:test';
import assert from 'node:assert/strict';
import {pickModel,addCooldown,modelChain,requireCapped,earliestRetry} from '../scripts/policy.mjs';
import {timeBudget,completedToday,localClock,requireFree,validateConfig,selectFree,agentStalled,normalizeDistributionDue,retryAllowed,attemptState,MAX_ATTEMPTS_PER_DAY} from '../scripts/policy.mjs';
test('pre-inference pricing failure does not select another model',()=>{
  const preferred='opencode/deepseek-v4.1-flash-free';
  const fallback='opencode/glm-5.3-flash-free';
  const cat={opencode:{models:{'deepseek-v4.1-flash-free':{cost:{input:1,output:0}},'glm-5.3-flash-free':{cost:{input:0,output:0}}}}};
  assert.throws(()=>selectFree(cat,preferred));
  cat.opencode.models['deepseek-v4.1-flash-free'].cost.input=0;
  assert.equal(selectFree(cat,preferred).id,preferred);
  cat.opencode.models['deepseek-v4.1-flash-free'].cost.input=1;
  cat.opencode.models['glm-5.3-flash-free'].cost.output=1;
  assert.throws(()=>selectFree(cat,preferred));
  assert.throws(()=>selectFree({},'unknown/model'));
});
const at=x=>new Date(`2026-10-17T${x}-06:00`);
test('Mexico City hard boundaries and capped run duration',()=>{
  assert.equal(timeBudget(at('06:59:59')),0);
  assert.equal(timeBudget(at('07:00:00')),50*60000);
  assert.equal(timeBudget(at('09:45:00')),50*60000);
  assert.equal(timeBudget(at('15:10:00')),50*60000);
  assert.equal(timeBudget(at('20:45:00')),15*60000);
  assert.equal(timeBudget(at('20:59:59')),1000);
  assert.equal(timeBudget(at('21:00:00')),0);
  assert.equal(localClock(new Date('2026-10-18T01:00:00Z')).day,'2026-10-17');
});
test('unknown, paid, missing and nonzero cache prices fail closed',()=>{
  const model='opencode/deepseek-v4.1-flash-free';
  const cat=cost=>({opencode:{models:{'deepseek-v4.1-flash-free':{cost}}}});
  assert.equal(requireFree(cat({input:0,output:0,cache_read:0}),model).id,model);
  for(const cost of [{input:1,output:0},{input:0},{input:0,output:0,cache_write:1},{input:0,output:0,tiers:{}}]) assert.throws(()=>requireFree(cat(cost),model));
  assert.throws(()=>requireFree({},model));assert.throws(()=>requireFree(cat({input:0,output:0}),'opencode/paid-model'));
});
test('configuration disallows unlimited runs and timezone drift',()=>{
  const c={siteRepo:'x',stateDir:'y',opencodePath:'z',timezone:'America/Mexico_City',maxMinutes:50,model:'opencode/deepseek-v4.1-flash-free'};
  assert.doesNotThrow(()=>validateConfig(c));assert.throws(()=>validateConfig({...c,maxMinutes:51}));assert.throws(()=>validateConfig({...c,timezone:'UTC'}));
});
test('a zero-output agent session is stopped instead of holding the shared lock',()=>{
  assert.equal(agentStalled({elapsedMs:9*60*1000,logBytes:0}),true);
  assert.equal(agentStalled({elapsedMs:9*60*1000,logBytes:120}),false);
  assert.equal(agentStalled({elapsedMs:7*60*1000,logBytes:0}),false);
  assert.equal(agentStalled({elapsedMs:null,logBytes:0}),false);
});
test('distribution due ledger tolerates both the array and the derived object shape',()=>{
  assert.deepEqual(normalizeDistributionDue([{status:'due',dueAt:'2026-11-13'}]),[{status:'due',dueAt:'2026-11-13'}]);
  const ledger={dueNow:[{candidateId:'a',dueAt:'2026-11-13'}],nextDue:[{candidateId:'b',nextReviewAt:'2026-11-20'}]};
  const rows=normalizeDistributionDue(ledger);
  assert.equal(rows.length,2);
  assert.equal(rows[0].status,'due');
  assert.equal(rows[1].dueAt,'2026-11-20');
  assert.deepEqual(normalizeDistributionDue(undefined),[]);
});

test('one finished run per job per day, catch-up allowed after a failure',()=>{
  const r=(job,status,iso)=>({job,status,startedAt:iso});
  const day='2026-11-19';
  assert.equal(completedToday([r('content','completed','2026-11-19T16:50:00Z')],'content',day),true);
  assert.equal(completedToday([r('content','failed','2026-11-19T16:50:00Z')],'content',day),false);
  assert.equal(completedToday([r('content','outside-window','2026-11-19T13:10:00Z')],'content',day),false);
  assert.equal(completedToday([r('measurement','completed','2026-11-19T15:50:00Z')],'content',day),false);
  assert.equal(completedToday([r('content','completed','2026-11-18T16:50:00Z')],'content',day),false);
});

test('an attempt stopped by quota, a crash or a stale lock may retry until the daily cap',()=>{
  // Nothing recorded yet.
  assert.deepEqual(attemptState(null),{attempts:0,retry:true});
  // Marker from a run that started but never reached a finished outcome.
  for(let used=1;used<MAX_ATTEMPTS_PER_DAY;used++){
    assert.deepEqual(attemptState({status:'attempted',attempts:used}),{attempts:used,retry:true});
    assert.equal(attemptState({status:'failed',attempts:used}).retry,true);
  }
  assert.deepEqual(attemptState({status:'attempted',attempts:MAX_ATTEMPTS_PER_DAY}),{attempts:MAX_ATTEMPTS_PER_DAY,retry:false});
  // Legacy markers written before attempts were counted still allow a retry, but only once.
  assert.deepEqual(attemptState({status:'attempted'}),{attempts:1,retry:true});
  assert.equal(retryAllowed(undefined,MAX_ATTEMPTS_PER_DAY),false);
  // A job that already produced its one change set must never run again that day.
  for(const status of ['completed','partial','blocked']){
    assert.equal(attemptState({status,attempts:1}).retry,false);
    assert.equal(retryAllowed(status,1),false);
  }
});

test('a fully missed day leaves no marker for the next day',()=>{
  // Markers are keyed by the Mexico City day, so yesterday's exhausted attempts cannot block today.
  const markerName=(day,job)=>day+'-'+job+'.json';
  assert.equal(markerName('2026-11-19','content'),'2026-11-19-content.json');
  assert.notEqual(markerName('2026-11-19','content'),markerName('2026-11-20','content'));
  // No receipts for today: the job is due again.
  const yesterday={job:'content',status:'attempted',startedAt:'2026-11-19T22:00:00Z'};
  assert.equal(completedToday([yesterday],'content',localClock(new Date('2026-11-20T16:00:00Z')).day),false);
  // A run started at 20:59 Mexico City still belongs to that Mexico City day.
  assert.equal(localClock(new Date('2026-11-20T02:59:00Z')).day,'2026-11-19');
  assert.equal(timeBudget(new Date('2026-11-20T02:59:00Z')),60000);
  assert.equal(timeBudget(new Date('2026-11-20T03:00:00Z')),0);
});

test('free-limit on one model falls through to the next free model, never to a paid one by default',()=>{
  const free={input:0,output:0};
  const catalog={opencode:{models:{'deepseek-v4.1-flash-free':{cost:free},'glm-5.3-flash-free':{cost:free},'minimax-m3.1-flash-free':{cost:{input:1,output:2}}}},
    openrouter:{models:{'z-ai/glm-5.3-flash':{cost:{input:0.04,output:0.08},tool_call:true},'big/expensive':{cost:{input:3,output:15},tool_call:true}}}};
  const config={model:'opencode/deepseek-v4.1-flash-free'};
  assert.equal(pickModel(catalog,config,{}).id,'opencode/deepseek-v4.1-flash-free');
  const now=Date.parse('2026-11-21T18:00:00Z');
  let cd=addCooldown({},'opencode/deepseek-v4.1-flash-free',{retryAt:'2026-11-22T00:00:00Z',observedAt:'2026-11-21T18:00:00Z'});
  assert.equal(pickModel(catalog,config,cd,now).id,'opencode/glm-5.3-flash-free');
  cd=addCooldown(cd,'opencode/glm-5.3-flash-free',{retryAt:'2026-11-22T01:00:00Z'});
  assert.equal(pickModel(catalog,config,cd,now),null,'a model that is no longer free is skipped, and no paid fallback is configured');
  assert.equal(earliestRetry(cd,config,now),'2026-11-22T00:00:00Z');
  assert.equal(pickModel(catalog,{...config,paidFallback:{model:'openrouter/z-ai/glm-5.3-flash'}},cd,now).id,'openrouter/z-ai/glm-5.3-flash');
  assert.throws(()=>requireCapped(catalog,'openrouter/big/expensive'));
  assert.equal(pickModel(catalog,config,{retryAt:'2026-11-22T00:00:00Z'},now).id,'opencode/glm-5.3-flash-free','old single-model cooldown file still works');
  assert.deepEqual(modelChain({model:'opencode/glm-5.3-flash-free',fallbackModels:['opencode/glm-5.3-flash-free','opencode/deepseek-v4.1-flash-free']}),['opencode/glm-5.3-flash-free','opencode/deepseek-v4.1-flash-free']);
});
