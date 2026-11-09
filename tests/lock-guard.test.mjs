import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {classifyLock,reconcileDeadLock,LOCK_MAX_BUDGET_MS} from '../scripts/lock-guard.mjs';

const now=Date.parse('2026-11-04T16:00:00Z');
const minutesAgo=m=>new Date(now-m*60000).toISOString();
const lockOf=(over={})=>({owner:'2026-11-04-measurement-abc',startedAt:minutesAgo(5),pid:4242,processStartedAt:minutesAgo(5),...over});
const probes=(over={})=>({now,pidAlive:()=>false,pidStartedAt:()=>null,...over});

test('a lock whose recorded owner pid is gone is provably stale',()=>{
  assert.equal(classifyLock(lockOf(),probes()).reason,'owner-pid-gone');
  assert.equal(classifyLock(lockOf(),probes()).stale,true);
});

test('a live owner inside the longest possible run stays active without probing start time',()=>{
  let probed=false;
  const verdict=classifyLock(lockOf(),probes({pidAlive:()=>true,pidStartedAt:()=>{probed=true;return Date.parse(minutesAgo(5));}}));
  assert.deepEqual([verdict.stale,verdict.reason,probed],[false,'owner-active',false]);
});

test('a live pid outside the longest possible run is checked for reuse',()=>{
  const old=lockOf({startedAt:minutesAgo(LOCK_MAX_BUDGET_MS/60000+10)});
  assert.equal(classifyLock(old,probes({pidAlive:()=>true,pidStartedAt:()=>Date.parse(old.processStartedAt)})).stale,false);
  const reused=classifyLock(old,probes({pidAlive:()=>true,pidStartedAt:()=>now}));
  assert.deepEqual([reused.stale,reused.reason],[true,'owner-pid-reused']);
});

test('an unverifiable start time never expires a live owner',()=>{
  const old=lockOf({startedAt:minutesAgo(600)});
  assert.equal(classifyLock(old,probes({pidAlive:()=>true,pidStartedAt:()=>null})).stale,false);
  assert.equal(classifyLock(lockOf({processStartedAt:undefined}),probes({pidAlive:()=>true})).stale,false);
});

test('the current process always keeps its own lock',()=>{
  assert.equal(classifyLock(lockOf({pid:process.pid}),probes({pidAlive:()=>false})).reason,'owned-by-this-process');
});

test('unreadable lock contents always require reconciliation',()=>{
  assert.equal(classifyLock(null,probes({mtimeMs:now-5*60000})).stale,false);
  assert.equal(classifyLock(null,probes({mtimeMs:now-120*60000})).stale,false);
  assert.equal(classifyLock(null,probes({mtimeMs:null})).stale,false);
  assert.equal(classifyLock({pid:'4242'},probes({mtimeMs:now-5*60000})).stale,false);
});

test('reconciliation archives before removing, and only for a stale lock',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lock-guard-'));
  const lockPath=join(dir,'run-lock.json');
  await writeFile(lockPath,JSON.stringify(lockOf()));

  const active=await reconcileDeadLock({lockPath,archiveDir:dir,now:new Date(now),classify:(l)=>classifyLock(l,probes({pidAlive:()=>true,mtimeMs:now}))});
  assert.deepEqual([active.reconciled,await readdir(dir).then(r=>r.length)],[false,1]);

  const done=await reconcileDeadLock({lockPath,archiveDir:dir,now:new Date(now),classify:(l)=>classifyLock(l,probes({mtimeMs:now})),extra:{runId:'test-run'}});
  assert.equal(done.reconciled,true);
  assert.equal(done.reason,'owner-pid-gone');
  await assert.rejects(access(lockPath));
  const archived=JSON.parse(await readFile(done.archive,'utf8'));
  assert.equal(archived.owner,lockOf().owner);
  assert.equal(archived.runId,'test-run');
  assert.equal(archived.verdict.reason,'owner-pid-gone');
  assert.ok(archived.reconciledAt);

  const again=await reconcileDeadLock({lockPath,archiveDir:dir,now:new Date(now),classify:(l)=>classifyLock(l,probes())});
  assert.deepEqual([again.reconciled,again.reason],[false,'lock-already-gone']);
});

test('a second reconciliation of the same owner does not overwrite the first archive',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lock-guard-'));
  const lockPath=join(dir,'run-lock.json');
  await writeFile(lockPath,JSON.stringify(lockOf()));
  const stale={classify:(l)=>classifyLock(l,probes({mtimeMs:now}))};
  const first=await reconcileDeadLock({lockPath,archiveDir:dir,now:new Date(now),...stale});
  await writeFile(lockPath,JSON.stringify(lockOf({startedAt:minutesAgo(9)})));
  const second=await reconcileDeadLock({lockPath,archiveDir:dir,now:new Date(now+1000),...stale});
  assert.notEqual(first.archive,second.archive);
  assert.equal((await readdir(dir)).length,2);
});
