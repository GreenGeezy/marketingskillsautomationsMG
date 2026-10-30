import {atomicJson,updateState,quotaFromLog} from './runtime-state.mjs';
import {readFile,writeFile,mkdir,open,unlink,access,rename} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {jobs,localClock,timeBudget,selectFree,validateConfig} from './policy.mjs';
import {campaignContext} from './campaign.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [job,...flags]=process.argv.slice(2);
const preflight=flags.includes('--preflight');
if(!jobs.includes(job)) throw new Error('Usage: node scripts/run.mjs measurement|content|distribution [--preflight]');
const configPath=resolve(root,'config.local.json');
process.on('uncaughtException',async error=>{
 try{const folder=join(root,'output','scheduler');await mkdir(folder,{recursive:true});await atomicJson(join(folder,Date.now()+'-'+job+'-setup.json'),{job,status:'setup-failed',error:error.message,at:new Date().toISOString()});}finally{console.error(error.message);process.exitCode=1;}
});
const config=JSON.parse((await readFile(configPath,'utf8')).replace(/^\uFEFF/,''));
validateConfig(config);
if(!preflight && timeBudget(new Date(),config.maxMinutes)<60000){console.log('Skipped: outside the allowed window or less than one minute remains.');process.exit(0);}
for(const path of [config.siteRepo,config.stateDir,config.opencodePath]) await access(path);
if(!preflight){
 let cooldown;try{cooldown=JSON.parse(await readFile(join(config.stateDir,'quota-cooldown.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(cooldown&&new Date(cooldown.retryAt)>new Date()){console.log('Deferred: provider cooldown until '+cooldown.retryAt);process.exit(0);}
 const weekday=new Intl.DateTimeFormat('en-US',{timeZone:'America/Mexico_City',weekday:'short'}).format(new Date());
 if(job==='distribution'&&!['Tue','Fri'].includes(weekday)){
 let due=[];try{due=JSON.parse(await readFile(join(config.stateDir,'distribution-due.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(!Array.isArray(due)||!due.some(x=>x.status==='due'&&new Date(x.dueAt)<=new Date())){console.log('Skipped: no due distribution work; no inference.');process.exit(0);}
 }
}

const catalog=await fetch('https://models.dev/api.json',{signal:AbortSignal.timeout(20000)}).then(r=>{if(!r.ok)throw new Error('Model catalog unavailable');return r.json();});
const modelReceipt=selectFree(catalog,config.model);
if(preflight){ console.log(JSON.stringify({status:'preflight-passed',modelReceipt,window:'09:45–12:45 America/Mexico_City',note:'No inference, authentication, publication or scheduler activation tested.'},null,2)); process.exit(0); }
if(!config.enabled||!config.oldAutomationPausedVerified||!config.connectionsVerified) throw new Error('Setup incomplete: enabled, oldAutomationPausedVerified and connectionsVerified must be true after setup checks.');
const start=new Date(), budget=timeBudget(start,job==='content'?Math.min(35,config.maxMinutes):config.maxMinutes);
if(budget<60000){console.log('Skipped: outside 09:45–12:45 Mexico City or less than one minute remains.');process.exit(0);}
const runId=`${localClock(start).day}-${job}-${randomUUID()}`;
const state=resolve(config.stateDir), runs=join(state,'opencode-runs');
await mkdir(runs,{recursive:true});
const lock=join(state,'run-lock.json'), marker=join(runs,`${localClock(start).day}-${job}.json`);
let owned=false, retainLock=false, child, timer;
const receipt={runId,job,startedAt:start.toISOString(),status:'starting',modelReceipt};
async function saveReceipt(){await atomicJson(join(runs,`${runId}.json`),receipt);}
async function currentUpdate(active){await updateState(join(state,'current.json'),c=>{if(active)c.activeRun={id:runId,owner:runId,job,startedAt:start.toISOString()};else if(c.activeRun?.id===runId||c.activeRun?.owner===runId)c.activeRun=null;});}

try {
  try{const h=await open(lock,'wx');owned=true;await h.writeFile(JSON.stringify({owner:runId,startedAt:start.toISOString(),pid:process.pid,processStartedAt:new Date(Date.now()-process.uptime()*1000).toISOString(),executable:process.execPath}));await h.close();}
  catch(e){if(e.code==='EEXIST'){receipt.status='deferred-lock';console.log('Deferred: shared growth lock exists; retry within the window, never auto-expire its owner.');process.exitCode=75;}else throw e;}
  if(owned){
    // The daily marker is written BEFORE invoking the agent: ambiguous actions cannot be retried blindly.
    let reserved=false;
    try{const h=await open(marker,'wx');await h.writeFile(JSON.stringify({runId,status:'attempted',startedAt:start.toISOString()}));await h.close();reserved=true;}
    catch(e){if(e.code==='EEXIST'){receipt.status='already-attempted';console.log('Skipped: this job already attempted today. Read receipt before any manual reconciliation.');}else throw e;}
    if(reserved){
      await currentUpdate(true);
      const resultFile=join(runs,`${runId}.result.json`), contextFile=join(runs,`${runId}.context.md`);
      const instructions=await readFile(join(root,'docs/RECOVERY-POLICY.md'),'utf8')+'\n'+campaignContext(start)+'\n\n'+await readFile(join(root,'jobs',`${job}.md`),'utf8');
      const deadline=new Date(start.getTime()+budget);
      await writeFile(contextFile,`# Scheduled run context\nrunId: ${runId}\njob: ${job}\nstateDir: ${state}\nsiteRepo: ${config.siteRepo}\nautomationRepo: ${root}\nresultFile: ${resultFile}\ndeadlineUTC: ${deadline.toISOString()}\nThe runner owns the shared lock. Do not reacquire it. Complete routine authorized work without questions. Read ${root.replaceAll('\\','/')}/AGENTS.md and the mastergrowbot-acquisition skill.\n\n${instructions}`);
      receipt.status='running';await saveReceipt();
      const remaining=deadline.getTime()-Date.now();
      if(remaining<60000){receipt.status='partial';throw new Error('Preparation consumed the remaining window; no inference started.');}
      const log=await open(join(runs,`${runId}.log`),'wx');
      child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-File',join(root,'scripts','invoke-opencode.ps1'),'-ConfigPath',configPath,'-ContextPath',contextFile,'-SelectedModel',modelReceipt.id],{cwd:config.siteRepo,windowsHide:true,stdio:['ignore',log.fd,log.fd],env:{...process.env,OPENCODE_CONFIG_DIR:join(root,'.opencode'),MGB_AUTOMATION_ROOT:root}});
      let timedOut=false;
      timer=setTimeout(()=>{
        timedOut=true;retainLock=true;
        if(child.pid){const killer=spawn('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true});killer.on('error',()=>{});}
      },Math.max(0,deadline.getTime()-Date.now()));
      const exit=await new Promise((res,rej)=>{child.on('error',rej);child.on('exit',(code,signal)=>res({code,signal}));});
      clearTimeout(timer);await log.close();receipt.exit=exit;
      if(timedOut){receipt.status='timed-out-reconcile-required';throw new Error('Deadline reached; process tree termination requested. Lock retained until reconciliation.');}
      const quota=quotaFromLog(await readFile(join(runs,`${runId}.log`),'utf8'));
      if(quota){await atomicJson(join(state,'quota-cooldown.json'),quota);receipt.status='quota-exhausted';throw new Error('Free usage exhausted; cooldown saved, no replay.');}
      if(exit.code!==0){receipt.status='failed';throw new Error(`OpenCode exited ${exit.code}; inspect private log.`);}
      let result;try{result=JSON.parse((await readFile(resultFile,'utf8')).replace(/^\uFEFF/,''));}catch{receipt.status='missing-result';throw new Error('CLI exit alone is not success: required result JSON missing or invalid.');}
      if(result.runId!==runId||result.job!==job||!['completed','partial','blocked'].includes(result.status)||!Array.isArray(result.actions)||!Array.isArray(result.blockers)) throw new Error('Invalid result contract; inspect logs before retry.');
      receipt.status=result.status;receipt.resultFile=resultFile;
      await writeFile(marker,JSON.stringify({runId,status:receipt.status,finishedAt:new Date().toISOString()},null,2));
    }
  }
} catch(e){receipt.error=e.message;if(receipt.status==='running'||receipt.status==='starting')receipt.status='failed';process.exitCode=1;console.error(e.message);}
finally {
  clearTimeout(timer);
  {
    try{receipt.finishedAt=new Date().toISOString();await saveReceipt();}
    catch(e){console.error(`receipt write failed: ${e.message}`);}
    if(owned&&!retainLock){
      try{await currentUpdate(false);}catch(e){console.error(`current.json update failed: ${e.message}`);}
      try{
        const existing=JSON.parse(await readFile(lock,'utf8'));
        if(existing.owner===runId)await unlink(lock);
      }catch(e){console.error(`lock release failed: ${e.message}`);}
    }
  }
}
