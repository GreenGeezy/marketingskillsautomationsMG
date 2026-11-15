import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p) => readFileSync(join(root, p), 'utf8');

test('guardrail file keeps its protected pages and key rules', () => {
  const g = read('docs/SEO-GUARDRAILS.md');
  for (const needle of ['/vpd-calculator', 'one edit per protected page per 28 days', 'average position is worse than 20', 'Eligible new Pro subscribers can try 3 days free.', 'Ordering opens soon', 'lastmod', 'do not push', 'consolidate']) {
    assert.ok(g.toLowerCase().includes(needle.toLowerCase()), 'missing: ' + needle);
  }
});

test('every job, skill, prompt and AGENTS.md reads the guardrails first', () => {
  const files = ['AGENTS.md', 'jobs/content.md', 'jobs/measurement.md', 'jobs/distribution.md',
    '.opencode/skills/mastergrowbot-acquisition/SKILL.md', '.opencode/skills/ai-answer-visibility/SKILL.md',
    '.opencode/skills/playwright/SKILL.md', '.opencode/skills/seo-audit/SKILL.md',
    ...readdirSync(join(root, 'prompts')).map((f) => 'prompts/' + f)];
  for (const f of files) assert.ok(read(f).includes('SEO-GUARDRAILS.md'), f + ' must reference docs/SEO-GUARDRAILS.md');
});

test('the runner puts the guardrails in the context file', () => {
  assert.ok(read('scripts/run.mjs').includes('SEO-GUARDRAILS.md'));
});

test('no instruction file tells the model to rewrite CTR or consolidate pages', () => {
  const files = ['jobs/content.md', 'jobs/measurement.md', 'jobs/distribution.md', 'AGENTS.md'];
  for (const f of files) {
    const t = read(f);
    assert.doesNotMatch(t, /CTR rewrite|consolidate duplicate/i, f);
  }
});
