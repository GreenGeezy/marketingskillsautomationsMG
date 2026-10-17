import test from 'node:test';
import assert from 'node:assert/strict';
import {timeBudget,localClock,requireFree,validateConfig} from '../scripts/policy.mjs';
const at=x=>new Date(`2026-10-17T${x}-06:00`);
test('Mexico City hard boundaries and capped run duration',()=>{
  assert.equal(timeBudget(at('09:44:59')),0);
  assert.equal(timeBudget(at('09:45:00')),50*60000);
  assert.equal(timeBudget(at('12:30:00')),15*60000);
  assert.equal(timeBudget(at('12:44:59')),1000);
  assert.equal(timeBudget(at('12:45:00')),0);
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
