import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {quotaFromLog,updateState} from '../scripts/runtime-state.mjs';
import {evaluateGate} from '../scripts/release-gate.mjs';
test('provider quota creates cooldown without treating ordinary failures as quota',()=>{
 const q=quotaFromLog(JSON.stringify({type:'error',error:{type:'provider.free-limit',retryAfterMs:5000}}),0);
 assert.equal(q.retryAt,'1970-01-01T00:00:05.000Z');assert.equal(quotaFromLog('network error'),null);
});
test('malformed state is preserved, valid state keeps backup and unknown keys',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mgb-state-'));const file=join(dir,'current.json');
 try{await writeFile(file,'broken');await assert.rejects(updateState(file,c=>{c.activeRun=null}));assert.equal(await readFile(file,'utf8'),'broken');
 await writeFile(file,JSON.stringify({unknown:42}));await updateState(file,c=>{c.activeRun=null});assert.equal(JSON.parse(await readFile(file,'utf8')).unknown,42);assert.equal(JSON.parse(await readFile(file+'.last-good','utf8')).unknown,42);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('flat/stale index count does not block evidenced candidate; missing evidence and cap block',()=>{
 const releaseCandidate={distinctIntent:true,verifiedFacts:true,crawlable:true,internalLinks:true,productionChecks:true};
 const s={releaseCandidate,publishedUrls:[],indexCoverage:{indexed:31,reportUpdatedAt:'2026-10-22'}};
 const now=new Date('2026-10-30T18:00:00Z');assert.equal(evaluateGate(s,now).ok,true);
 assert.equal(evaluateGate({...s,releaseCandidate:{}},now).ok,false);
 assert.equal(evaluateGate({...s,publishedUrls:[{publishedDate:'2026-10-29'},{publishedDate:'2026-10-30'}]},now).ok,false);
});
import {execFileSync} from 'node:child_process';
test('a long guide cannot hide a thin neighbor in growGuides.ts',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mgb-guides-'));const file=join(dir,'growGuides.ts');
 try{await writeFile(file,'export const growGuides = '+JSON.stringify([{slug:'thin',intro:'Brief text'},{slug:'long',intro:'Useful detail '.repeat(200)}]));
 let output='';try{execFileSync(process.execPath,['scripts/check-content-quality.mjs','--min-words','100',file],{encoding:'utf8'});}catch(e){output=e.stdout;}
 assert.match(output,/#thin/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
