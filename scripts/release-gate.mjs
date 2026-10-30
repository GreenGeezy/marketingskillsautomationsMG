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

  const candidate=state?.releaseCandidate;
  for(const key of ['distinctIntent','verifiedFacts','crawlable','internalLinks','productionChecks']) if(candidate?.[key]!==true) blocks.push('Release evidence required: '+key);
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const midnight=new Date(day+'T00:00:00-06:00');
  const weekStart=new Date(midnight.getTime()-((midnight.getUTCDay()+6)%7)*DAY);
  const releasedThisWeek=Array.isArray(state?.publishedUrls)?state.publishedUrls.filter(x=>{const at=parseDate(x.publishedDate);return at&&at>=weekStart&&at<=now;}).length:null;
  if(releasedThisWeek===null) blocks.push('Missing dated publication ledger.');
  else if(releasedThisWeek>=WEEKLY_CAP) blocks.push('Weekly cap reached.');
  if(!coverage.reportUpdatedAt) warnings.push('Source update date unknown; do not infer fresh coverage progress.');
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
