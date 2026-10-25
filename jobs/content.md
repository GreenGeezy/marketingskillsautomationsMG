# 10:45: comparison content and qualified traffic acquisition

## Priority order (owner-approved 2026-10-25)

Default action is repair, not publish. Work this order and stop at the first item that is not already done today:

1. One CTR rewrite on a page that already ranks. Source: the CTR queue in state `seoActionQueue`. Pick the highest projected-click page not already owned by an open task.
2. One index-recovery improvement on a URL from `indexCoverage.crawledNotIndexed`: add verified substance, then link it from at least one indexed page with a descriptive anchor.
3. Only if 1 and 2 are both genuinely complete, one new URL.

New URL rules, all binding:

- Maximum two new URLs per calendar week.
- Hard block: no new URL if `indexCoverage.indexed` has not risen above its last recorded value within the past 14 days.
- Hard block: no new URL while the indexed count is 31 or below.
- Demand evidence required: the query set must show intent that no existing page owns.
- Run `node scripts/release-gate.mjs` before publishing any new URL. A non-zero exit blocks the release.

Do not rewrite a head term without first recording what occupies the SERP for that head term in the state file.

Read `.opencode/skills/mastergrowbot-acquisition/references/content-quality.md` before selecting a topic. The standard is binding: zero em dashes, no AI-slop patterns, and a written bottom-of-funnel keyword and value brief before drafting. Quality outranks volume. A generic checklist, a thin keyword-swapped page, or a page that cannot lead the buyer to a product, app store or checkout is a release failure. One strong page beats three thin pages.

Before selecting a new topic, read the latest private `content-quality-audit-*.json`. A documented failure in a live page is a rewrite candidate, not permission to edit locked text. Keep the owner-authorization request in `nextActions` until the owner approves or the lock changes.

First read mastergrowbot-acquisition/references/competitor-acquisition.md. The October18 owner correction takes precedence over earlier candidate suggestions: discover and rank the largest relevant US iOS competitors by verified rating count, then select uncovered buyer-intent opportunities using GSC and actual search results. Use evergreen titles/slugs. Do not substitute repeated existing-article repairs for new competitor acquisition. Read the cached us-ios-competitor-census.json before research; keep the model context to the top relevant shortlist, not all descriptions.

Load mastergrowbot-acquisition and the measurement handoff. Advance the highest-value distinct software-selection opportunity through research, fact-check, draft, release and discovery as time allows. Start with a corpus/intent check; do not recreate existing bud, Jane or BudLabs comparisons. Candidates are hypotheses, not preapproved factual claims or proven search volume.

Before drafting, save a content brief in private state with: the primary keyword; five or more bottom-of-funnel modifiers and buyer questions; the live SERP review and its date; the existing-URL overlap and cannibalization decision; the value thesis; the evidence list with source dates; and the intended product, app-store or checkout path. Score purchase intent, product fit, evidence available, observed gap and checkout path. Reject broad informational topics, "what is" pages, growing tips, and pages that only restate a spec sheet. Do not create thin variants of the same intent. If the brief is weak, save the brief and stop instead of publishing filler.

A buying guide or comparison must include the required value blocks in content-quality.md. For a product guide: answer-first verdict, sourced fact and package table, fit and coverage, total cost, a real comparison, pre-order checks, red flags, who should buy and who should not, FAQ, one primary product or checkout CTA and one secondary path, and dated sources. For a software comparison: direct answer, who each app suits, sourced feature and price table, competitor strengths, our limitations, publisher disclosure, dated sources, and a genuine app-store CTA. Use verified facts only. Never invent tests, reviews, ratings, prices, specs, integrations or market size. Preserve owner-verified claims exactly. No cultivation, yield or potency instructions.

Spend the limited free-model window preparing reusable primary-source competitor evidence and up to three independently qualified new comparisons per week during the first 14 days. Publish only when evidence, distinct intent, factual quality, authentic assets/limitations, CTA and technical gates pass. If exact demand is unavailable, explicitly label a small owner-directed experiment supported by category demand; do not call it proven. Never publish a thin keyword-swapped article. Do not rewrite recent pages to produce activity.

Before release, run the no-ai-slop edit pass and the eval. Then run the automation repository's checker against every changed content file:

`node "<automationRepo>/scripts/check-content-quality.mjs" --changed --repo "<siteRepo>" --min-words 1200 --require-cta`

Use the `automationRepo` and `siteRepo` paths from the run context. Fix every error. Save the checker output, word count and completed scorecard in the result JSON. The automated check does not replace the read-aloud test or the portability test. If a live page fails this gate, record the exact defects in the private quality audit and request owner authorization before editing it. The October21 owner content lock still protects existing website text.

For each released comparison, add useful hub/internal links without broad article rewrites, verify mobile CTA event context, canonical and initial HTML, and perform changed-URL discovery once. Save baseline, recrawl status and +14/+28-day reviews. When no new page is justified, progress an existing ready draft, internal discovery repair or concrete source gap. Respect the weekly cap recorded across all receipts. Leave build/deployment status explicit if the deadline interrupts work.

Follow mastergrowbot-acquisition/references/search-console.md for every production-verified new or materially repaired URL, including grow-guides: queue it, inspect/request indexing when eligible and time permits, or hand off the durable queue to measurement. Record actual confirmation, never assume indexing from a submission.
