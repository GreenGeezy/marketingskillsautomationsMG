import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignContext} from '../scripts/campaign.mjs';
test('campaign follows Mexico City dates and expires without a prompt',()=>{
  assert.match(campaignContext(new Date('2026-10-21T05:59:59Z')),/No temporary campaign/);
  assert.match(campaignContext(new Date('2026-10-21T06:00:00Z')),/Active owner-authorized campaign/);
  assert.match(campaignContext(new Date('2026-10-26T05:59:59Z')),/Active owner-authorized campaign/);
  assert.match(campaignContext(new Date('2026-10-26T06:00:00Z')),/No temporary campaign.*app-first/);
});
