#!/usr/bin/env node
// Deterministic release gate for new URLs.
// Blocks a new-URL release unless index coverage has moved and the weekly cap allows it.
// Usage: node scripts/release-gate.mjs [--state <path>] [--json]

import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const MIN_INDEXED = 31;
export const WINDOW_DAYS = 14;
export const WEEKLY_CAP = 2;

const DAY = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfWeek(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const offset = day === 0 ? 6 : day - 1; // Monday start
  d.setDate(d.getDate() - offset);
  return d;
}

export function evaluateGate(state, now = new Date()) {
  const blocks = [];
  const warnings = [];
  const coverage = state?.indexCoverage ?? {};
  const indexed = coverage.indexed;

  if (!Number.isFinite(indexed)) {
    blocks.push('Index coverage is unmeasured: indexCoverage.indexed is null. Record a GSC reading before releasing a new URL.');
  } else if (indexed <= MIN_INDEXED) {
    blocks.push(`Indexed count is ${indexed}. No new URL is allowed until it rises above ${MIN_INDEXED}.`);
  }

  // Build the reading history, falling back to the single observed reading.
  const history = [];
  if (Array.isArray(coverage.history)) {
    for (const entry of coverage.history) {
      const at = parseDate(entry?.observedAt);
      if (at && Number.isFinite(entry?.indexed)) history.push({at, indexed: entry.indexed});
    }
  }
  const latest = parseDate(coverage.observedAt);
  if (latest && Number.isFinite(indexed) && !history.some(h => h.at.getTime() === latest.getTime())) {
    history.push({at: latest, indexed});
  }
  history.sort((a, b) => a.at - b.at);

  const windowStart = new Date(now.getTime() - WINDOW_DAYS * DAY);
  const inWindow = history.filter(h => h.at >= windowStart && h.at <= now);

  if (!inWindow.length) {
    blocks.push(`No index-coverage reading within the last ${WINDOW_DAYS} days. Re-read GSC and record it in indexCoverage.`);
  } else if (inWindow.length === 1) {
    blocks.push(`Only one index-coverage reading in the last ${WINDOW_DAYS} days. Two readings are required to prove movement.`);
  } else {
    const first = inWindow[0];
    const last = inWindow[inWindow.length - 1];
    if (last.indexed <= first.indexed) {
      blocks.push(`Indexed count has been flat for ${WINDOW_DAYS} days (${first.indexed} to ${last.indexed}). New URLs stay blocked.`);
    }
  }

  // Weekly cap.
  const weekStart = startOfWeek(now);
  let releasedThisWeek = null;
  if (Number.isFinite(state?.newUrlsThisWeek)) {
    releasedThisWeek = state.newUrlsThisWeek;
  } else if (Array.isArray(state?.publishedUrls)) {
    releasedThisWeek = state.publishedUrls.filter(entry => {
      const at = parseDate(entry?.publishedDate);
      return at && at >= weekStart && at <= now;
    }).length;
  }

  if (releasedThisWeek === null) {
    warnings.push('Weekly new-URL count is unknown: record publishedUrls with publishedDate, or newUrlsThisWeek.');
  } else if (releasedThisWeek >= WEEKLY_CAP) {
    blocks.push(`Weekly cap reached: ${releasedThisWeek} of ${WEEKLY_CAP} new URLs already released this week.`);
  }

  if (indexed > MIN_INDEXED && state?.indexTarget && indexed < state.indexTarget) {
    warnings.push(`Indexed count ${indexed} is still below the ${state.indexTarget} target. Keep recovery work ahead of new pages.`);
  }

  return {
    ok: blocks.length === 0,
    checkedAt: now.toISOString(),
    indexed: Number.isFinite(indexed) ? indexed : null,
    minIndexed: MIN_INDEXED,
    releasedThisWeek,
    weeklyCap: WEEKLY_CAP,
    blocks,
    warnings,
  };
}

function resolveStatePath(argv) {
  const flag = argv.indexOf('--state');
  if (flag >= 0 && argv[flag + 1]) return resolve(argv[flag + 1]);
  if (process.env.MGB_STATE) return resolve(process.env.MGB_STATE);

  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const configPath = join(root, 'config.local.json');
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
      if (config.stateDir) return join(config.stateDir, 'current.json');
    } catch {
      // fall through to the error below
    }
  }
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  const statePath = resolveStatePath(argv);
  if (!statePath || !existsSync(statePath)) {
    console.error('release-gate: cannot find state file. Pass --state <path> or set MGB_STATE.');
    process.exit(2);
  }
  const state = JSON.parse(readFileSync(statePath, 'utf8').replace(/^\uFEFF/, ''));
  const result = evaluateGate(state);
  console.log(JSON.stringify({...result, statePath}, null, 2));
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
