import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {validDraft} from '../scripts/growtech-release.mjs';

test('TypeScript parser isolates unquoted slugs and counts prose without HTML or code',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'growtech-parser-'));
  const file=join(dir,'growGuides.ts');
  await writeFile(file,"export const guides=[{slug:'thin',intro:'Short.',sections:[{heading:'Facts',bodyHtml:'<p><a href=\"/grow-tech\">Buy</a></p>'}]},{slug:\"long\",intro:"+JSON.stringify('Useful buyer facts '.repeat(100))+"}];");
  let output;
  try {
    execFileSync(process.execPath,['scripts/check-content-quality.mjs','--min-words','100',file],{encoding:'utf8'});
    assert.fail('Thin article should fail');
  } catch(error) { output=error.stdout; }
  assert.match(output,/#thin/);
  assert.doesNotMatch(output,/Individual guide below minimum: 3\d\d/);
});
test('draft validation rejects absent evidence and foreign checkout paths',()=>{
  const task={slug:'test',productIds:['grow-light']};
  assert.throws(()=>validDraft({},task,{}));
  const draft={review:{eligible:true,distinctIntent:true,demandEvidence:'Observed intent',sources:[
    {url:'https://example.com/a',checkedAt:'2026-11-09'},{url:'https://example.com/b',checkedAt:'2026-11-09'}]},
    article:{slug:'test',title:'Test',h1:'Test',metaTitle:'Test',shortDescription:'Test',metaDescription:'Test',
      intro:'A buyer introduction with specific verified information. '.repeat(3),
      sections:[{heading:'One',body:'[Buy](/grow-tech/checkout/wrong)'},{heading:'Two'},{heading:'Three'}],
      faqs:[],relatedSlugs:[]}};
  assert.throws(()=>validDraft(draft,task,{'grow-light':{checkoutPath:'/grow-tech/checkout/grow-light'}}));
});
