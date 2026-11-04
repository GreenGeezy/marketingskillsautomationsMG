/**
 * Shared lock guard.
 *
 * The runner deliberately keeps its lock when it times out, so a human can inspect
 * whatever external side effects may have happened. The failure mode that recap
 * exposed on 2026-11-02 is different: the owning process ended without releasing
 * the lock, and every later job deferred until the lock was removed by hand.
 *
 * Rule: never expire a lock whose owner can still be running. Only archive a lock
 * when the recorded owner pid is provably gone, or when the pid is alive but its
 * real start time cannot be the one recorded in the lock (pid reuse).
 */
import {readFile,writeFile,unlink,access} from 'node:fs/promises';

/** Longest scheduled run (35 min content) plus preparation, agent teardown and slack. */
export const LOCK_MAX_BUDGET_MS = 45 * 60 * 1000;
/** Allowed drift between the recorded process start and the real one before we call it pid reuse. */
export const START_TOLERANCE_MS = 2 * 60 * 1000;

function parseStartedAt(value) {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

/**
 * Decide whether a shared lock is still owned by a live run.
 * Pure function: callers inject pid liveness and start-time probes.
 *
 * @param {object|null} lock parsed lock contents, or null when unreadable
 * @param {object} probes
 * @param {number} [probes.now]
 * @param {number|null} [probes.mtimeMs] lock file mtime, used when contents are unusable
 * @param {(pid:number)=>boolean} probes.pidAlive
 * @param {(pid:number)=>number|null} [probes.pidStartedAt]
 * @param {number} [probes.ageCheckMs] verify start time only once a lock is older than this
 * @returns {{stale:boolean,reason:string,detail?:string}}
 */
export function classifyLock(lock, {
  now = Date.now(),
  mtimeMs = null,
  pidAlive,
  pidStartedAt = () => null,
  ageCheckMs = LOCK_MAX_BUDGET_MS,
} = {}) {
  const ageMs = lock && Number.isFinite(Date.parse(lock.startedAt))
    ? now - Date.parse(lock.startedAt)
    : (Number.isFinite(mtimeMs) ? now - mtimeMs : null);

  const pid = lock && Number.isInteger(lock.pid) ? lock.pid : null;
  if (!lock || !lock.owner || !pid) {
    // Unusable contents cannot prove an active owner. Expire only once the file is
    // older than any possible run, otherwise keep deferring.
    if (ageMs === null) return {stale: false, reason: 'unreadable-lock-unknown-age'};
    if (ageMs < ageCheckMs) return {stale: false, reason: 'unreadable-lock-within-budget', detail: `${Math.round(ageMs / 60000)} min old`};
    return {stale: true, reason: 'unreadable-lock-beyond-budget', detail: `${Math.round(ageMs / 60000)} min old`};
  }

  if (pid === process.pid) return {stale: false, reason: 'owned-by-this-process'};

  let alive = false;
  try { alive = pidAlive(pid); } catch { alive = false; }
  if (!alive) return {stale: true, reason: 'owner-pid-gone', detail: `pid ${pid} is not running`};

  const recorded = parseStartedAt(lock.processStartedAt);
  if (recorded === null) {
    // Older locks carry no process start time. A live pid is enough to stay active
    // until the lock is older than any possible run; then the start time is unknown
    // and we still refuse to expire it.
    return ageMs !== null && ageMs > ageCheckMs
      ? {stale: false, reason: 'live-pid-without-start-time', detail: `pid ${pid} alive, ${Math.round(ageMs / 60000)} min old`}
      : {stale: false, reason: 'live-pid-without-start-time', detail: `pid ${pid} alive`};
  }

  if (ageMs !== null && ageMs < ageCheckMs) return {stale: false, reason: 'owner-active', detail: `pid ${pid} alive`};

  const actual = pidStartedAt(pid);
  if (!Number.isFinite(actual)) {
    return {stale: false, reason: 'owner-active-start-time-unverified', detail: `pid ${pid} alive, start time probe unavailable`};
  }
  const drift = Math.abs(actual - recorded);
  if (drift > START_TOLERANCE_MS) {
    return {
      stale: true,
      reason: 'owner-pid-reused',
      detail: `pid ${pid} now started ${new Date(actual).toISOString()} but the lock recorded ${new Date(recorded).toISOString()}`,
    };
  }
  return {stale: false, reason: 'owner-active', detail: `pid ${pid} alive and matches recorded start time`};
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

/**
 * Archive a provably dead lock and remove it.
 * Returns {reconciled, archive, reason, detail} and never deletes without an archive.
 */
export async function reconcileDeadLock({lockPath, archiveDir, now = new Date(), classify, extra = {}}) {
  let raw;
  try { raw = await readFile(lockPath, 'utf8'); } catch (e) {
    if (e.code === 'ENOENT') return {reconciled: false, reason: 'lock-already-gone'};
    throw e;
  }
  let lock = null;
  try { lock = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch {}
  const verdict = classify(lock, {now: now.getTime(), raw});
  if (!verdict.stale) return {reconciled: false, ...verdict};

  const owner = (lock && lock.owner) || 'unknown-owner';
  let archive = `${archiveDir}/reconciled-lock-${owner}.json`;
  if (await exists(archive)) {
    archive = `${archiveDir}/reconciled-lock-${owner}-${now.toISOString().replace(/[:.]/g, '-')}.json`;
  }
  const record = {
    ...(lock || {raw}),
    reconciledAt: now.toISOString(),
    reconciliation: 'Automated liveness reconciliation: the recorded owner process is provably gone, so the lock could not belong to an active run. Archived before removal; no job state, marker or ledger was cleared.',
    verdict,
    ...extra,
  };
  await writeFile(archive, JSON.stringify(record, null, 2) + '\n');
  await unlink(lockPath);
  return {reconciled: true, archive, reason: verdict.reason, detail: verdict.detail, owner};
}
