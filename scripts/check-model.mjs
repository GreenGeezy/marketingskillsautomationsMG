import {readFile} from 'node:fs/promises';
import {validateConfig,requireFree} from './policy.mjs';
const c=JSON.parse((await readFile(process.argv[2],'utf8')).replace(/^\uFEFF/,''));
validateConfig(c);
if(process.argv[3])c.model=process.argv[3];
const r=await fetch('https://models.dev/api.json',{signal:AbortSignal.timeout(20000)});
if(!r.ok)throw new Error('Cannot verify current model price; no inference allowed.');
console.log(JSON.stringify(requireFree(await r.json(),c.model)));
