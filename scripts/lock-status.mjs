/**
 * Read-only lock diagnosis: prints the shared lock, the owner liveness verdict and
 * what the runner would do next. Never edits or removes the lock.
 *
 *   node scripts/lock-status.mjs
 */
import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {classifyLock} from './lock-guard.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse((await readFile(join(root,'config.local.json'),'utf8')).replace(/^\uFEFF/,''));
const lockPath=join(resolve(config.stateDir),'run-lock.json');

let raw, mtimeMs=null;
try{raw=await readFile(lockPath,'utf8');mtimeMs=(await stat(lockPath)).mtimeMs;}
catch(e){if(e.code==='ENOENT'){console.log('No shared lock: the next scheduled job can start.');process.exit(0);}throw e;}

let lock=null;
try{lock=JSON.parse(raw.replace(/^\uFEFF/,''));}catch{}

const pidAlive=pid=>{try{process.kill(pid,0);return true;}catch(e){return e.code==='EPERM';}};
const pidStartedAt=pid=>{
  if(process.platform!=='win32')return null;
  try{
    const out=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
      `$p=Get-Process -Id ${Number(pid)} -ErrorAction SilentlyContinue; if($p){$p.StartTime.ToUniversalTime().ToString('o')}`],
      {encoding:'utf8',timeout:8000,windowsHide:true}).trim();
    const t=Date.parse(out);return Number.isFinite(t)?t:null;
  }catch{return null;}
};

const verdict=classifyLock(lock,{mtimeMs,pidAlive,pidStartedAt});
console.log(JSON.stringify({
  lockPath,
  lock,
  verdict,
  runnerAction:verdict.stale
    ? 'The next job archives this lock and starts; this diagnosis does not remove it.'
    : 'The next job defers with exit 75 until this owner finishes or is reconciled.',
},null,2));
