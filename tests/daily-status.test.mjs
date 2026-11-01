import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyDay} from '../scripts/daily-status.mjs';
test('late exit-zero skip is not completed work',()=>assert.equal(classifyDay([{status:'outside-window',at:'2026-10-31T19:09:07Z'}]).status,'outside-window'));
test('duplicate attempt cannot hide real result',()=>assert.equal(classifyDay([{status:'partial',startedAt:'2026-10-30T17:45:00Z'},{status:'already-attempted',startedAt:'2026-10-30T18:00:00Z'}]).status,'partial'));
test('missing receipt is explicit',()=>assert.equal(classifyDay([]).status,'no-receipt'));
test('publication evidence remains distinct',()=>{const r=classifyDay([{status:'completed',result:{changedUrls:['https://example.com/a'],commits:['abc'],productionVerified:false}}]);assert.equal(r.productionVerified,false);assert.deepEqual(r.commits,['abc']);});
