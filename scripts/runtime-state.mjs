import {readFile,writeFile,rename} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
export async function atomicJson(path,value){const temp=path+'.tmp-'+randomUUID();await writeFile(temp,JSON.stringify(value,null,2));await rename(temp,path);}
export async function updateState(path,change){const value=JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));await atomicJson(path+'.last-good',value);change(value);await atomicJson(path,value);}
export function quotaFromLog(text,now=Date.now()){for(const line of text.split(/\r?\n/)){try{const row=JSON.parse(line);if(row.type==='error'&&row.error?.type==='provider.free-limit'){const ms=Number(row.error.retryAfterMs);return {status:'quota-exhausted',observedAt:new Date(now).toISOString(),retryAt:new Date(now+(Number.isFinite(ms)&&ms>0?ms:86400000)).toISOString()};}}catch{}}return null;}
