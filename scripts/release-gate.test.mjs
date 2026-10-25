import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateGate, MIN_INDEXED, WEEKLY_CAP} from './release-gate.mjs';

const now = new Date('2026-10-25T12:00:00Z');
const daysAgo = n => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

function stateWith({indexed = 38, history, publishedUrls = [], newUrlsThisWeek} = {}) {
  return {
    indexCoverage: {
      indexed,
      observedAt: daysAgo(0),
      history: history ?? [
        {observedAt: daysAgo(0), indexed},
        {observedAt: daysAgo(10), indexed: indexed - 3},
      ],
    },
    publishedUrls,
    newUrlsThisWeek,
  };
}

test('passes when indexed count rose and the weekly cap allows another URL', () => {
  const result = evaluateGate(stateWith({indexed: 38}), now);
  assert.equal(result.blocks.length, 0);
  assert.equal(result.ok, true);
  assert.equal(result.indexed, 38);
});

test('blocks when indexed count is at or below the floor', () => {
  const result = evaluateGate(stateWith({indexed: MIN_INDEXED}), now);
  assert.equal(result.ok, false);
  assert.match(result.blocks.join(' '), /no new url is allowed/i);
});

test('blocks when index coverage is unmeasured', () => {
  const result = evaluateGate({indexCoverage: {indexed: null}}, now);
  assert.equal(result.ok, false);
  assert.match(result.blocks.join(' '), /unmeasured/i);
  assert.equal(result.indexed, null);
});

test('blocks when the indexed count is flat across the 14-day window', () => {
  const result = evaluateGate(stateWith({indexed: 37, history: [
    {observedAt: daysAgo(1), indexed: 37},
    {observedAt: daysAgo(12), indexed: 37},
  ]}), now);
  assert.equal(result.ok, false);
  assert.match(result.blocks.join(' '), /flat/i);
});

test('blocks when the last reading is older than the window', () => {
  const state = stateWith({indexed: 40});
  state.indexCoverage.observedAt = daysAgo(20);
  state.indexCoverage.history = [{observedAt: daysAgo(20), indexed: 40}];
  const result = evaluateGate(state, now);
  assert.equal(result.ok, false);
  assert.match(result.blocks.join(' '), /no index-coverage reading/i);
});

test('blocks when the weekly new-URL cap is reached', () => {
  const result = evaluateGate(stateWith({indexed: 40, newUrlsThisWeek: WEEKLY_CAP}), now);
  assert.equal(result.ok, false);
  assert.match(result.blocks.join(' '), /weekly cap/i);
});

test('counts published URLs inside the current week', () => {
  const result = evaluateGate(stateWith({indexed: 40, publishedUrls: [
    {url: '/a', publishedDate: daysAgo(0)},
    {url: '/b', publishedDate: daysAgo(1)},
    {url: '/c', publishedDate: daysAgo(30)},
  ]}), now);
  assert.equal(result.releasedThisWeek, 2);
  assert.equal(result.ok, false);
});

test('warns rather than blocks when the weekly count is unknown', () => {
  const state = stateWith({indexed: 40});
  delete state.publishedUrls;
  const result = evaluateGate(state, now);
  assert.equal(result.ok, true);
  assert.equal(result.releasedThisWeek, null);
  assert.match(result.warnings.join(' '), /weekly new-url count is unknown/i);
});
