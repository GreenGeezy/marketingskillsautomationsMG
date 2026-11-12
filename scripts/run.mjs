import {atomicJson, updateState, quotaFromLog} from './runtime-state.mjs';
import {readFile, writeFile, mkdir, open, unlink, access} from 'node:fs/promises';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn, execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {jobs, localClock, timeBudget, selectFree, validateConfig, agentStalled} from './policy.mjs';
import {classifyLock, reconcileDeadLock} from './lock-guard.mjs';
import {discoveryDue, pilotState, readJson} from './growtech-pilot.mjs';
import {publishDraft, verifyReleases} from './growtech-release.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [job, ...flags] = process.argv.slice(2);
const preflight = flags.includes('--preflight');
const smoke = flags.includes('--capability-check');
const configPath = join(root, 'config.local.json');
const start = new Date();
const day = localClock(start).day;
const runId = day + '-' + job + '-' + randomUUID();
const receipt = {job,runId,startedAt:start.toISOString(),status:'setup-failed'};
let receiptPath = join(root,'output','scheduler',runId+'.json');
let lock, owned = false, retainLock = false, currentFile, active = false;

async function checkedModel(config) {
  const response = await fetch('https://models.dev/api.json',{signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error('Model catalog unavailable');
  return selectFree(await response.json(),config.model);
}

async function killTree(pid) {
  // taskkill can report success while grandchildren survive, so verify and escalate.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 2000));
    try { execFileSync('taskkill.exe',['/PID',String(pid),'/T','/F'],{windowsHide:true,timeout:15000}); } catch {}
    try { process.kill(pid, 0); } catch { return true; }
  }
  try { process.kill(pid, 'SIGKILL'); } catch {}
  try { process.kill(pid, 0); return false; } catch { return true; }
}

async function runAgent(config, contextFile, deadline, logPath) {
  const log = await open(logPath,'wx');
  let timer, watchdog, stalledRun = false;
  const spawnedAt = Date.now();
  try {
    const args = ['-NoProfile','-NonInteractive','-File',join(root,'scripts','invoke-opencode.ps1'),
      '-ConfigPath',configPath,'-SelectedModel',receipt.modelReceipt.id,
      ...(smoke ? ['-ShellSmokeTest'] : ['-ContextPath',contextFile])];
    const child = spawn('powershell.exe',args,{
      cwd:config.siteRepo,windowsHide:true,stdio:['ignore',log.fd,log.fd],
      env:{...process.env,OPENCODE_CONFIG_DIR:join(root,'.opencode'),MGB_AUTOMATION_ROOT:root},
    });
    let finish;
    const exitPromise = new Promise((done,reject)=>{
      finish = done;
      child.once('error',reject);
      child.once('close',(code,signal)=>done({code,signal}));
    });
    timer = setTimeout(async ()=>{
      retainLock=true;
      await killTree(child.pid);
      try { process.kill(child.pid, 0); finish({code:null,signal:'kill-failed'}); } catch {}
    },Math.max(0,+deadline-Date.now()));
    // A provider connection can stall before the first byte. An empty log after
    // AGENT_STALL_MS means no tool call ran, so the lock must not be held hostage.
    watchdog = setInterval(async ()=>{
      try {
        const {size} = await log.stat();
        if (size > 0) { clearInterval(watchdog); return; }
        if (agentStalled({elapsedMs:Date.now()-spawnedAt,logBytes:size})) {
          clearInterval(watchdog);
          stalledRun = true;
          await killTree(child.pid);
        }
      } catch {}
    },30000);
    const exit = await exitPromise;
    return stalledRun ? {...exit,stalled:true} : exit;
  } finally {
    clearTimeout(timer);
    clearInterval(watchdog);
    await log.close();
  }
}

async function run() {
  if (!jobs.includes(job)) throw new Error('Expected measurement, content or distribution');
  const config = await readJson(configPath);
  validateConfig(config);
  if (preflight) {
    console.log(JSON.stringify({status:'preflight-passed',modelReceipt:await checkedModel(config)},null,2));
    return;
  }
  const limit = {measurement:15,content:35,distribution:25}[job];
  const budget = smoke ? 180000 : timeBudget(start,Math.min(limit,config.maxMinutes));
  if (budget<60000) { receipt.status='outside-window'; return; }
  if (!config.enabled || !config.oldAutomationPausedVerified || !config.connectionsVerified)
    throw new Error('Setup incomplete');
  for (const path of [config.siteRepo,config.stateDir,config.opencodePath]) await access(path);
  const state = config.stateDir;
  const runs = join(state,'opencode-runs');
  await mkdir(runs,{recursive:true});
  receiptPath = join(runs,runId+'.json');
  lock = join(state,'run-lock.json');
  const identity = {owner:runId,pid:process.pid,startedAt:start.toISOString(),
    processStartedAt:new Date(Date.now()-process.uptime()*1000).toISOString(),phase:'preparing'};
  try {
    const handle = await open(lock,'wx');
    owned=true;
    try { await handle.writeFile(JSON.stringify(identity)); } finally { await handle.close(); }
  } catch(error) {
    if (error.code!=='EEXIST') throw error;
    const archiveDir = join(state,'lock-archive');
    await mkdir(archiveDir,{recursive:true});
    const recon = await reconcileDeadLock({
      lockPath: lock,
      archiveDir,
      classify: (value, probes) => classifyLock(value, {
        ...probes,
        pidAlive: (pid) => {
          try { process.kill(pid,0); return true; }
          catch (probe) { return probe.code==='EPERM'; }
        },
        pidStartedAt: (pid) => {
          if (process.platform!=='win32') return null;
          try {
            const out = execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
              `$p=Get-Process -Id ${Number(pid)} -ErrorAction SilentlyContinue; if($p){$p.StartTime.ToUniversalTime().ToString('o')}`],
              {encoding:'utf8',timeout:8000,windowsHide:true}).trim();
            const t = Date.parse(out);
            return Number.isFinite(t) ? t : null;
          } catch { return null; }
        },
      }),
      extra: {reconciledBy:'run.mjs',job,runId},
    });
    if (!recon.reconciled) {
      receipt.status='deferred-lock';
      receipt.error='Shared lock present. Check owner, descendants and pending external actions before manual reconciliation.';
      receipt.lockVerdict=recon;
      process.exitCode=75;
      return;
    }
    receipt.lockReconciled=recon;
    try {
      const handle = await open(lock,'wx');
      owned=true;
      try { await handle.writeFile(JSON.stringify(identity)); } finally { await handle.close(); }
    } catch(retry) {
      if (retry.code!=='EEXIST') throw retry;
      receipt.status='deferred-lock';
      receipt.error='Shared lock reappeared after reconciliation. Another job started first.';
      process.exitCode=75;
      return;
    }
  }

  const deadline = new Date(+start+budget);
  const marker = join(runs,day+'-'+job+'.json');
  if (!smoke && await readJson(marker,null)) { receipt.status='already-attempted'; return; }
  const task = !smoke && job==='content' ? await pilotState(state) : null;
  if (task?.action==='no-due-work') {
    receipt.status='no-due-work';
    receipt.schedule=task.schedule;
    return;
  }
  if (!smoke && job!=='content') {
    const release = await verifyReleases(state);
    if (release) receipt.release=release;
    const queue = await readJson(join(state,'gsc-url-queue.json'),{queue:[]});
    const issues = await readJson(join(state,'gsc-issues.json'),{issues:[]});
    const due = await readJson(join(state,'distribution-due.json'),[]);
    const weekday = new Intl.DateTimeFormat('en-US',{timeZone:config.timezone,weekday:'short'}).format(start);
    const issueDue = job==='measurement' && issues.issues.some(issue=>
      issue.nextCheckAt && Date.parse(issue.nextCheckAt)<=Date.now() &&
      !['resolved','passed'].includes(issue.status));
    if (!['Tue','Fri'].includes(weekday) && !discoveryDue(queue) && !issueDue &&
        !(job==='distribution' && due.some(item=>item.status==='due' && Date.parse(item.dueAt)<=Date.now()))) {
      receipt.status='no-due-work';
      return;
    }
  }
  if (task?.action!=='publish') {
    const cooldown = await readJson(join(state,'quota-cooldown.json'),{});
    if (Date.parse(cooldown.retryAt)>Date.now()) {
      receipt.status='quota-cooldown';
      receipt.retryAt=cooldown.retryAt;
      return;
    }
    receipt.modelReceipt=await checkedModel(config);
  }

  if (+deadline-Date.now()<60000) { receipt.status='outside-window'; return; }
  receipt.status='running';
  await atomicJson(receiptPath,receipt);
  if (!smoke) {
    await writeFile(marker,JSON.stringify({runId,status:'attempted',startedAt:start.toISOString()}),{flag:'wx'});
    currentFile=join(state,'current.json');
    await updateState(currentFile,value=>{value.activeRun={id:runId,owner:runId,job,startedAt:start.toISOString()};});
    active=true;
  }
  if (task?.action==='publish') {
    await atomicJson(lock,{...identity,phase:'release-started'});
    receipt.release=await publishDraft(config,root,task,deadline);
    receipt.status='completed';
  } else {
    const resultFile = join(runs,runId+'.result.json');
    const contextFile = join(runs,runId+'.context.md');
    if (!smoke) {
      if (task) await mkdir(dirname(task.draftPath),{recursive:true});
      const policy = await readFile(join(root,'docs','RECOVERY-POLICY.md'),'utf8');
      const instructions = await readFile(join(root,'jobs',job+'.md'),'utf8');
      const context = {runId,job,stateDir:state,siteRepo:config.siteRepo,automationRepo:root,resultFile,
        deadlineUTC:deadline.toISOString(),weekday:new Intl.DateTimeFormat('en-US',{timeZone:config.timezone,weekday:'short'}).format(start),task};
      await writeFile(contextFile,JSON.stringify(context,null,2)+'\n\n'+policy+'\n\n'+instructions);
    }
    const logPath = join(runs,runId+'.log');
    await atomicJson(lock,{...identity,phase:'agent-started'});
    receipt.exit = await runAgent(config,contextFile,deadline,logPath);
    if (receipt.exit.stalled) {
      retainLock=false;
      receipt.status='agent-stalled-no-output';
      receipt.error='opencode-cli wrote no output for eight minutes, so the run was stopped and the lock released. No tool call had run.';
      return;
    }
    if (retainLock) {
      receipt.status='timed-out-reconcile-required';
      throw new Error('Deadline reached. Reconcile child processes and external actions.');
    }
    const quota = quotaFromLog(await readFile(logPath,'utf8'));
    if (quota) {
      await atomicJson(join(state,'quota-cooldown.json'),quota);
      receipt.status='quota-exhausted';
      return;
    }
    if (receipt.exit.code!==0) throw new Error('OpenCode exited '+receipt.exit.code);
    if (smoke) {
      receipt.status='capability-check-finished';
      receipt.logPath=logPath;
      return;
    }
    const result = await readJson(resultFile,null).catch(()=>null);
    if (result?.runId!==runId || result.job!==job || !['completed','partial','blocked'].includes(result.status) ||
        !Array.isArray(result.actions) || !Array.isArray(result.blockers)) {
      receipt.status='missing-result';
      throw new Error('Missing or invalid result contract');
    }
    if (task?.action === 'draft') {
      const draft = await readJson(task.draftPath,null);
      if (draft) {
        draft.review ??= {};
        draft.review.checkedAt=new Date().toISOString();
        draft.review.nextReviewAt=new Date(Date.now()+7*86400000).toISOString();
        await atomicJson(task.draftPath,draft);
      }
    }
    receipt.status=result.status;
    receipt.resultFile=resultFile;
  }
  await atomicJson(marker,{runId,status:receipt.status,finishedAt:new Date().toISOString()});
}

try {
  await run();
} catch(error) {
  if (receipt.status==='running') receipt.status='failed';
  receipt.error=error.message;
  process.exitCode=receipt.status==='setup-failed' ? 75 : 1;
  console.error(error.message);
} finally {
  if (!preflight) {
    receipt.finishedAt=new Date().toISOString();
    await mkdir(dirname(receiptPath),{recursive:true});
    await atomicJson(receiptPath,receipt);
    console.log(JSON.stringify({status:receipt.status,receiptPath}));
  }
  if (owned && !retainLock) {
    try {
      if (active) await updateState(currentFile,value=>{
        if (value.activeRun?.owner===runId) value.activeRun=null;
      });
    } finally {
      if ((await readJson(lock,null))?.owner===runId) await unlink(lock);
    }
  }
}
