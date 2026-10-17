import {readFile,writeFile,mkdir,open,unlink,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {jobs,localClock,timeBudget,requireFree,validateConfig} from './policy.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [job,...flags]=process.argv.slice(2);
const preflight=flags.includes('--preflight');
if(!jobs.includes(job)) throw new Error('Usage: node scripts/run.mjs measurement|content|distribution [--preflight]');
const configPath=resolve(root,'config.local.json');
const config=JSON.parse(await readFile(configPath,'utf8'));
validateConfig(config);
for(const path of [config.siteRepo,config.stateDir,config.opencodePath]) await access(path);
const catalog=await fetch('https://models.dev/api.json',{signal:AbortSignal.timeout(20000)}).then(r=>{if(!r.ok)throw new Error('Model catalog unavailable');return r.json();});
const modelReceipt=requireFree(catalog,config.model);
if(preflight){ console.log(JSON.stringify({status:'preflight-passed',modelReceipt,window:'09:45–12:45 America/Mexico_City',note:'No inference, authentication, publication or scheduler activation tested.'},null,2)); process.exit(0); }
if(!config.enabled||!config.oldAutomationPausedVerified||!config.connectionsVerified) throw new Error('Setup incomplete: enabled, oldAutomationPausedVerified and connectionsVerified must be true after setup checks.');
const start=new Date(), budget=timeBudget(start,config.maxMinutes);
if(budget<60000){console.log('Skipped: outside 09:45–12:45 Mexico City or less than one minute remains.');process.exit(0);}
const runId=`${localClock(start).day}-${job}-${randomUUID()}`;
const state=resolve(config.stateDir), runs=join(state,'opencode-runs');
await mkdir(runs,{recursive:true});
const lock=join(state,'run-lock.json'), marker=join(runs,`${localClock(start).day}-${job}.json`);
let owned=false, retainLock=false, child, timer;
const receipt={runId,job,startedAt:start.toISOString(),status:'starting',modelReceipt};
async function saveReceipt(){await writeFile(join(runs,`${runId}.json`),JSON.stringify(receipt,null,2));}
async function currentUpdate(active){
  const path=join(state,'current.json');
  let c;try{c=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;c={schemaVersion:1};}
  if(active)c.activeRun={id:runId,owner:runId,job,startedAt:start.toISOString()};
  else if(c.activeRun?.id===runId||c.activeRun?.owner===runId)c.activeRun=null;
  await writeFile(path,JSON.stringify(c,null,2));
}
try {
  try{const h=await open(lock,'wx');owned=true;await h.writeFile(JSON.stringify({owner:runId,startedAt:start.toISOString(),pid:process.pid}));await h.close();}
  catch(e){if(e.code==='EEXIST'){console.log('Skipped: shared growth lock exists; reconcile its owner, never auto-expire.');process.exitCode=0;}else throw e;}
  if(owned){
    // The daily marker is written BEFORE invoking the agent: ambiguous actions cannot be retried blindly.
    let reserved=false;
    try{const h=await open(marker,'wx');await h.writeFile(JSON.stringify({runId,status:'attempted',startedAt:start.toISOString()}));await h.close();reserved=true;}
    catch(e){if(e.code==='EEXIST')console.log('Skipped: this job already attempted today. Read receipt before any manual reconciliation.');else throw e;}
    if(reserved){
      await currentUpdate(true);
      const resultFile=join(runs,`${runId}.result.json`), contextFile=join(runs,`${runId}.context.md`);
      const instructions=await readFile(join(root,'jobs',`${job}.md`),'utf8');
      const deadline=new Date(start.getTime()+budget);
      await writeFile(contextFile,`# Scheduled run context\nrunId: ${runId}\njob: ${job}\nstateDir: ${state}\nsiteRepo: ${config.siteRepo}\nautomationRepo: ${root}\nresultFile: ${resultFile}\ndeadlineUTC: ${deadline.toISOString()}\nThe runner owns the shared lock. Do not reacquire it. Complete routine authorized work without questions. Read ${root.replaceAll('\\','/')}/AGENTS.md and the mastergrowbot-acquisition skill.\n\n${instructions}`);
      receipt.status='running';await saveReceipt();
      const log=await open(join(runs,`${runId}.log`),'wx');
      child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-File',join(root,'scripts','invoke-opencode.ps1'),'-ConfigPath',configPath,'-ContextPath',contextFile],{cwd:config.siteRepo,windowsHide:true,stdio:['ignore',log.fd,log.fd],env:{...process.env,OPENCODE_CONFIG_DIR:join(root,'.opencode'),MGB_AUTOMATION_ROOT:root}});
      let timedOut=false;
      timer=setTimeout(()=>{
        timedOut=true;retainLock=true;
        if(child.pid){const killer=spawn('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true});killer.on('error',()=>{});}
      },budget);
      const exit=await new Promise((res,rej)=>{child.on('error',rej);child.on('exit',(code,signal)=>res({code,signal}));});
      clearTimeout(timer);await log.close();receipt.exit=exit;
      if(timedOut){receipt.status='timed-out-reconcile-required';throw new Error('Deadline reached; process tree termination requested. Lock retained until reconciliation.');}
      if(exit.code!==0){receipt.status='failed';throw new Error(`OpenCode exited ${exit.code}; inspect private log.`);}
      let result;try{result=JSON.parse(await readFile(resultFile,'utf8'));}catch{receipt.status='missing-result';throw new Error('CLI exit alone is not success: required result JSON missing or invalid.');}
      if(result.runId!==runId||result.job!==job||!['completed','partial','blocked'].includes(result.status)||!Array.isArray(result.actions)||!Array.isArray(result.blockers)) throw new Error('Invalid result contract; inspect logs before retry.');
      receipt.status=result.status;receipt.resultFile=resultFile;
      await writeFile(marker,JSON.stringify({runId,status:receipt.status,finishedAt:new Date().toISOString()},null,2));
    }
  }
} catch(e){receipt.error=e.message;if(receipt.status==='running'||receipt.status==='starting')receipt.status='failed';process.exitCode=1;console.error(e.message);}
finally {
  clearTimeout(timer);
  if(owned){
    receipt.finishedAt=new Date().toISOString();await saveReceipt();
    if(!retainLock){
      await currentUpdate(false);
      const existing=JSON.parse(await readFile(lock,'utf8'));
      if(existing.owner===runId)await unlink(lock);
    }
  }
}
