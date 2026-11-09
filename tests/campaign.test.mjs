import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignContext} from '../scripts/campaign.mjs';
test('current campaign never injects the expired October lock',()=>{
  assert.match(campaignContext(),/November pilot/);
  assert.doesNotMatch(campaignContext(),/October21|app-first|October26/);
});
