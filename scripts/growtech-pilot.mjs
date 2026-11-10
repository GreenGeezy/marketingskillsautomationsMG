import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {localClock} from './policy.mjs';

export const campaignId = 'growtech-2026-11';
export const baseUrl = 'https://www.mastergrowbot.com';
const DAY = 86400000;
export const products = {
  'grow-light': 199, 'alphagrow-tent-2x2': 119, 'alphagrow-tent-4x2': 149, 'alphagrow-kit-2x2': 299, 'alphagrow-kit-4x2': 349,
};
export const queue = [
  {slug:'ag1000-vs-spider-farmer-sf1000', intent:'AG1000 vs SF1000', productIds:['grow-light']},
  {slug:'2x2-vs-4x2-grow-tent', intent:'2x2 vs 4x2 grow tent', productIds:['alphagrow-tent-2x2','alphagrow-tent-4x2']},
  {slug:'2x2-grow-tent-kits-under-300', intent:'2x2 grow tent kit under 300', productIds:['alphagrow-kit-2x2']},
  {slug:'grow-tent-kit-vs-buying-separately', intent:'grow tent kit vs buying separately', productIds:['alphagrow-kit-2x2','alphagrow-tent-2x2','grow-light']},
  {slug:'4x2-grow-tent-ventilation-kit', intent:'4x2 grow tent ventilation kit vs complete kit', productIds:['alphagrow-kit-4x2']},
];

export async function readJson(file, fallback) {
  try { return JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,'')); }
  catch (error) {
    if (error.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw error;
  }
}

export function cadence(editorial, releases, now = new Date()) {
  const day = localClock(now).day;
  const midnight = new Date(day + 'T00:00:00-06:00');
  const weekStart = new Date(+midnight - ((midnight.getUTCDay() + 6) % 7) * DAY);
  const entries = new Map();
  for (const row of [...editorial, ...releases]) {
    const raw = row.publishedAt ?? row.publishedDate ?? row.pushAttemptedAt;
    // A legacy date without a time conservatively counts through the end of that day.
    const at = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw+'T23:59:59-06:00' : raw);
    if (!row.url || !Number.isFinite(at)) throw new Error('Invalid publication ledger entry');
    const url = row.url.replace(/\/$/, '');
    entries.set(url, Math.max(entries.get(url) ?? 0, at));
  }
  const dates = [...entries.values()];
  const next = Math.max(0, ...dates) + 2 * DAY;
  const blocks = [];
  if (dates.filter(at => at >= +weekStart && at < +weekStart + 7 * DAY).length >= 3) blocks.push('weekly-cap');
  if (+now < next) blocks.push('48-hour-spacing');
  if (new Set(releases.map(row => row.url)).size >= 5) blocks.push('campaign-cap');
  if (releases.some(row => row.status !== 'production-verified')) blocks.push('pending-deployment');
  return {blocks, nextEligibleAt: new Date(next).toISOString()};
}

// Editorial publication and commercial margin are separate concerns. A guide can ship
// once the product facts, live offer and checkout are verified. Supplier cost, merchant
// fees and the $40 contribution test stay a private accounting follow-up: they are only
// enforced when the operator has supplied real numbers, never guessed or zero-filled.
export function productReady(id, evidence, now = new Date()) {
  const cost = evidence?.supplierDeliveredUsd;
  const fees = evidence?.merchantFeesUsd;
  const checked = Date.parse(evidence?.verifiedAt);
  const marginKnown = Number.isFinite(cost) && cost > 0 && Number.isFinite(fees) && fees >= 0;
  const marginPasses = !marginKnown || products[id] - cost - fees - 5 >= 40;
  return evidence?.verified === true && evidence?.saleEnabled === false &&
    Number.isFinite(checked) && checked <= +now && +now - checked <= 7 * DAY &&
    evidence.priceUsd === products[id] && evidence.inStock === true && evidence.checkoutVerified === true &&
    /^plan_[a-zA-Z0-9]+$/.test(evidence.planId) &&
    evidence.hostedUrl === 'https://whop.com/checkout/' + evidence.planId &&
    evidence.checkoutPath === '/grow-tech/checkout/' + id &&
    ['sku','dimensions','contents','supplierSource','fulfillmentTerms'].every(key =>
      typeof evidence[key] === 'string' && evidence[key].trim()) &&
    (!id.startsWith('alphagrow-kit-') || ['ventilationContents','lightingDetails'].every(key =>
      typeof evidence[key] === 'string' && evidence[key].trim())) &&
    marginPasses;
}

export async function pilotState(dir, now = new Date()) {
  const ledger = await readJson(join(dir,'new-page-ledger.json'));
  const releases = await readJson(join(dir,'growtech-releases.json'), []);
  const evidence = await readJson(join(dir,'growtech-product-evidence.json'), {});
  const schedule = cadence(ledger.weeks.flatMap(week => week.published), releases, now);
  for (const item of queue) {
    if (releases.some(row => row.slug === item.slug)) continue;
    const draftPath = join(dir, 'growtech-drafts', item.slug + '.json');
    const draft = await readJson(draftPath, null);
    const productBlocks = item.productIds.filter(id => !productReady(id, evidence[id], now));
    if (draft?.review?.eligible === true && !productBlocks.length && !schedule.blocks.length)
      return {item, draftPath, action:'publish', schedule};
    if (!draft || (draft.review?.nextReviewAt && Date.parse(draft.review.nextReviewAt) <= +now))
      return {item, draftPath, action:'draft', productBlocks, schedule};
    if (draft.review?.eligible !== true && !productBlocks.length &&
        item.productIds.some(id=>Date.parse(evidence[id]?.verifiedAt)>Date.parse(draft.review?.checkedAt)))
      return {item, draftPath, action:'draft', productBlocks, schedule};
  }
  return {action:'no-due-work', schedule};
}

export function discoveryDue(ledger, now = new Date()) {
  return (ledger.queue ?? []).some(entry =>
    entry.requestStatus === 'queued' &&
    /^https:\/\/www\.mastergrowbot\.com\//.test(entry.url) &&
    (!entry.nextCheckAt || Date.parse(entry.nextCheckAt) <= +now));
}
