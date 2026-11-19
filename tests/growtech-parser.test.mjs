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

test('draft validation accepts the documented prose and structured review evidence',()=>{
  const task={slug:'test',productIds:['grow-light']};
  const article={slug:'test',title:'Test',h1:'Test',metaTitle:'Test',shortDescription:'Test',metaDescription:'Test',
    intro:'A buyer introduction with specific verified information. '.repeat(3),
    sections:[{heading:'One',body:'[Buy](/grow-tech/checkout/grow-light)'},{heading:'Two'},{heading:'Three'}],
    faqs:[],relatedSlugs:[]};
  const review={eligible:true,
    distinctIntent:'A budget question about the first tent setup, kept separate from the size and sensor guides already live.',
    demandEvidence:{searchConsole:'No query-level record',purchaseEvidence:'Live checkout verified today'},
    sources:[{url:'https://example.com/a',checkedAt:'2026-11-19'},{url:'https://example.com/b',checkedAt:'2026-11-19'}]};
  assert.doesNotThrow(()=>validDraft({review,article},task,{'grow-light':{checkoutPath:'/grow-tech/checkout/grow-light'}}));
  assert.doesNotThrow(()=>validDraft({review:{...review,demandEvidence:'A short evidence sentence.'},article},task,{'grow-light':{checkoutPath:'/grow-tech/checkout/grow-light'}}));
  assert.throws(()=>validDraft({review:{...review,distinctIntent:'too short'},article},task,{'grow-light':{checkoutPath:'/grow-tech/checkout/grow-light'}}));
  assert.throws(()=>validDraft({review:{...review,demandEvidence:{}},article},task,{'grow-light':{checkoutPath:'/grow-tech/checkout/grow-light'}}));
});

test('campaign tags are allowed on app links but never on a checkout CTA',()=>{
  const task={slug:'test',productIds:['grow-light']};
  const article={slug:'test',title:'Test',h1:'Test',metaTitle:'Test',shortDescription:'Test',metaDescription:'Test',
    intro:'A buyer introduction with specific verified information. '.repeat(3),
    sections:[{heading:'One',body:'[App](https://apps.apple.com/us/app/x?utm_source=website&utm_medium=organic&utm_campaign=test) and [Buy](/grow-tech/checkout/grow-light)'},{heading:'Two'},{heading:'Three'}],
    faqs:[],relatedSlugs:[]};
  const review={eligible:true,distinctIntent:'A distinct budget intent kept separate from every page already live.',
    demandEvidence:'Live storefront and checkout verified today.',
    sources:[{url:'https://example.com/a',checkedAt:'2026-11-19'},{url:'https://example.com/b',checkedAt:'2026-11-19'}]};
  const evidence={'grow-light':{checkoutPath:'/grow-tech/checkout/grow-light'}};
  assert.doesNotThrow(()=>validDraft({review,article},task,evidence));
  const tagged={...article,sections:[{heading:'One',body:'[Buy](/grow-tech/checkout/grow-light?utm_source=website)'},{heading:'Two'},{heading:'Three'}]};
  assert.throws(()=>validDraft({review,article:tagged},task,evidence));
});
