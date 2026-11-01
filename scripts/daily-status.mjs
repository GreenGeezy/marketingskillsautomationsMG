import {readdir,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {localClock} from './policy.mjs';
export function classifyDay(entries){
 const sorted=[...entries].sort((a,b)=>String(a.at||a.startedAt||'').localeCompare(String(b.at||b.startedAt||'')));
 const substantive=sorted.filter(e=>['completed','partial','blocked','failed','quota-exhausted','missing-result','timed-out-reconcile-required','running'].includes(e.status));
 const last=substantive.at(-1)||sorted.at(-1);
 if(!last)return {status:'no-receipt'};
 return {status:last.status,at:last.at||last.startedAt||null,finishedAt:last.finishedAt||null,runId:last.runId||null,error:last.error||null,changedUrls:last.result?.changedUrls||[],commits:last.result?.commits||[],productionVerified:last.result?.productionVerified??null};
}
export async function dailyReport(root,days=7,now=new Date()){
 const cfg=JSON.parse((await readFile(join(root,'config.local.json'),'utf8')).replace(/^\uFEFF/,''));
 const folders=[join(cfg.stateDir,'opencode-runs'),join(root,'output/scheduler')];const all=[];
 for(const folder of folders){for(const name of await readdir(folder).catch(()=>[])){
 if(!name.endsWith('.json')||name.endsWith('.result.json')||/^\d{4}-\d{2}-\d{2}-(measurement|content|distribution)\.json$/.test(name))continue;
 try{const e=JSON.parse((await readFile(join(folder,name),'utf8')).replace(/^\uFEFF/,''));if(!e.job||!e.status)continue;
 if(e.resultFile)try{e.result=JSON.parse((await readFile(e.resultFile,'utf8')).replace(/^\uFEFF/,''));}catch{}
 all.push(e);}catch{}
 }}
 const today=localClock(now).day;const midnight=new Date(today+'T12:00:00-06:00');const rows=[];
 for(let d=0;d<days;d++){const day=localClock(new Date(midnight.getTime()-d*86400000)).day;
 for(const [index,job] of ['measurement','content','distribution'].entries()){
 const outcome=classifyDay(all.filter(e=>e.job===job&&localClock(new Date(e.at||e.startedAt)).day===day));
 if(outcome.status==='no-receipt'&&day===today&&localClock(now).minutes<585+index*60)outcome.status='not-due-yet';
 rows.push({day,job,...outcome});
 }}
 return {generatedAt:now.toISOString(),timezone:'America/Mexico_City',note:'Scheduler exit 0 is not proof of work or publication. Today may still be in progress.',rows};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(fileURLToPath(new URL('..',import.meta.url)));console.log(JSON.stringify(await dailyReport(root),null,2));
}
