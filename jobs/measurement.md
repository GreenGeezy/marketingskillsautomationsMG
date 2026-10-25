# 09:45: protect revenue and measure the 10x target

## Priority order (owner-approved 2026-10-25)

Run these in order and write the output as a ranked action queue, not a report:

1. Week-over-week alert. Compare trailing 7-day clicks and impressions with the prior 7 days. If either is down 15% or more, record an alert with the delta and the pages that lost the most. Never write 0 for an unmeasured metric; write null.
2. CTR queue. Pages with 300 or more impressions in 90 days and CTR under 3%, plus queries with 100 or more impressions and zero clicks. Rank by projected click gain, not impression volume alone. Store in state `seoActionQueue`.
3. Index coverage delta. Record indexed, not indexed and each reason count. Diff against the previous reading and name the URLs that changed state. Flag any GSC-listed URL that now returns 404.
4. Release reconciliation and the blocking-defect check described below.

## Sunday only: index and prune report

On Sundays, after step 4, also produce:

- indexed count against the 50 target, with the delta since last Sunday
- URLs with zero impressions in 90 days, as consolidation or noindex candidates
- internal links added this week from indexed pages into unindexed priority URLs
- sitemap diff: sitemap URLs against public routes, flagging 404s, trailing slashes and routes missing from the sitemap

Do not create a new scheduled task for this. It runs inside this existing 09:45 job.

Load mastergrowbot-acquisition and references/content-quality.md. First reconcile yesterday's release stages and pending actions. Check the homepage, successful AI guide and one changed comparison's initial HTML, canonical, indexability, schemas and genuine app destinations. Use cached full-audit findings; no full crawl daily. Fix a verified blocking revenue/SEO defect before optional content work, following release.md.

Read references/search-console.md from that skill. Check Search Console notifications and current reports, triage new issues, drain due changed-URL inspections and eligible indexing requests, and follow up due validations. Maintain private issue/URL ledgers and distinguish repaired-in-production, validation-pending and Google-confirmed resolution. Authentication failure blocks these browser actions, not independent technical work.

On Tuesday/Friday refresh one settled 28-day GSC comparison and at most two focused drilldowns, plus matched GA4 organic landing/store-click-session metrics when accessible. Other days reuse it and inspect only real alerts/recrawls. AI-search reports are separate. On/after monthly due date perform the broader review once and advance the due date. Maintain denominator, date windows and source for every metric. Zero is never a substitute for missing access.

Rank the three best buyer-intent opportunities and save a specific content task for the 10:45 job. Each handoff must include the primary keyword, at least five bottom-of-funnel modifiers or buyer questions, the observed SERP gap and its date, the value thesis, the evidence list and the intended product, app-store or checkout path. Reject generic topics and thin keyword variants. Preserve recent articles. Once a week, audit one live page against content-quality.md and record the exact defects in the private quality audit; report defects in locked text instead of rewriting it. If no repair is warranted, improve one measured conversion path only when mature and supported, or resolve the precise measurement/access gap and prepare a reviewable artifact. Do not simply rerun audits until time expires. Record a result JSON even if blocked.
