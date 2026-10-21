# Search Console operations

The owner authorizes inspection of MasterGrowbot URLs, eligible Request Indexing submissions, and verified repairs of Search Console issues without routine approval. Use only the authenticated property `sc-domain:mastergrowbot.com` in the dedicated persistent browser. Credentials, browser profiles, reports and receipts stay outside Git. Never read cookies or tokens into model context.

## Daily triage and repair

At measurement start, inspect the property's notifications/messages and Overview for new actionable issues. Follow report links and confirm the current report, affected URLs and dates: an old notification is not proof of a current defect. Prioritize security/manual-action alerts for explicit investigation and escalation, then revenue-page availability, accidental indexability/canonical errors, sitemap failures and supported structured-data errors. Check existing private issue records before repeating work.

Record each issue in `stateDir/gsc-issues.json`: stable issue key/report URL, first/last observed dates, report update date, affected examples, severity, evidence, intended exclusions, diagnosis, repair commit/deployment, live verification, validation state and nextCheckAt. Preserve unknown existing fields. Intentional redirects, private/noindex pages, correct duplicate canonicals and optional schema fields are not automatically errors. Never invent schema values or make excluded private pages public to reduce a warning count.

Repair verified source defects using release.md, then confirm the production fix on representative affected URLs. Where Search Console offers Validate Fix, submit once only after checking that the reported issue class is actually repaired, and record confirmation. Pending Google validation remains pending; do not claim resolved until Google confirms it. Don't dismiss/delete messages as a substitute for fixing their causes. Investigate manual actions/security issues but do not submit unsupported reconsideration claims, remove verification owners, weaken security, or use removals to hide defects. Record any required account-owner action precisely.

## Changed URL inspection and indexing

Content/release jobs add each production-verified new or materially repaired canonical URL (including grow-guides routes) to `stateDir/gsc-url-queue.json`; reuse existing entries keyed by canonical URL and deployed revision. Exclude drafts, redirects, noindex/private URLs, tracking variants and unchanged pages. The measurement job drains due work; a content job may handle its own release before the deadline. Across jobs, cap at three priority URL inspections/indexing attempts per day as an internal effort limit, not a claimed Google quota.

1. Check live HTTP success, indexable robots/meta, correct canonical, initial HTML and internal/sitemap discovery. Fix a blocking live defect before requesting indexing.
2. Enter the exact canonical URL in Search Console's URL Inspection. Record indexed state, reason, Google/user canonical and last crawl when available. An indexed result can describe an older crawl.
3. For a new URL or a meaningful deployed repair requiring recrawl, use Test Live URL when needed and Request Indexing when offered and eligible. Record `pending-attempt` before clicking and the actual confirmation afterward. Do not resubmit an unchanged URL or an ambiguous attempt blindly. Reconcile its receipt first.
4. If signed out, permission denied, CAPTCHA, quota or transient failure occurs, record the blocker and defer. Never bypass CAPTCHA or Google's limits. Queued entries with no request attempt are eligible at the next scheduled run after production/access verification, even if an old nextCheckAt mistakenly applied a post-submission delay. Authentication-blocked entries become eligible after access is restored. Honor explicit Google quota backoff; never reinterpret pending-attempt or ambiguous submissions as unsent. The seven-day observation delay applies to accepted submissions, not unsent work. Inspect submitted URLs after at least seven days unless a real alert justifies earlier investigation. Request acceptance is not indexing, ranking or traffic success.

Queue fields: url, deployedRevision, reason, priority, queuedAt, inspectedAt, indexStatus, lastCrawl, requestStatus (queued/pending-attempt/accepted/ambiguous/blocked/not-needed), requestAttemptedAt, requestConfirmedAt, evidence, nextCheckAt. No fixed daily quota is assumed; stop requests when Google's UI says to stop. Use compact private receipts and include queue/issue counts in the run result.

The URL Inspection API reads Google's indexed state; it cannot request indexing or run live tests. Ordinary articles are not eligible for the restricted Google Indexing API. Use the authenticated Search Console UI for Request Indexing; sitemaps support discovery but do not guarantee indexing. Google controls crawl/validation timing and some warnings cannot be resolved immediately.

Official references: https://support.google.com/webmasters/answer/9012289 and https://developers.google.com/search/blog/2022/01/url-inspection-api
