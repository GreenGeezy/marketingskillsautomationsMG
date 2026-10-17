---
name: mastergrowbot-acquisition
description: Execute MasterGrowbot's autonomous evidence-led buyer-intent SEO and AEO acquisition sprint using free models, shared receipts and verified releases.
---

# Objective and allocation

10x website traffic from interested app buyers as quickly as defensible work permits. Optimize for organic landing sessions containing canonical iOS/Android store-click events, and supported paid attribution. Never substitute impressions, raw events or total app revenue for attributed purchases.

80% of effort: demand-backed software comparisons, proven app landing-page conversion paths, indexing/technical recovery and measurement. 20%: relevant free distribution and competitor discovery. During the initial 14-day sprint, prepare up to three distinct comparison resources weekly and publish at most three if each independently clears the evidence gates. This replaces the old one-page weekly cap under the owner's explicit acceleration instruction. It is a ceiling, not a quota. Review on day14; return to one/week if evidence is weak, indexing stalled or pages duplicate intent. Never manufacture query volume to meet a quota.

# Run contract

The Node runner has already acquired the old shared run-lock.json and written activeRun; use the supplied stateDir, runId and resultFile. Do not manage that lock yourself. Read current.json, opportunities.json and distribution.json; read only relevant experiment, issue and outreach entries. Reconcile latest main, production and receipts before acting. Preserve unrelated work. If dirty changes prevent a safe release, save a patch/brief in private state; never reset or discard them.

Use a maximum of three ranked opportunities with priority = buyer relevance (0–3) × observed demand confidence (0–3) × likely impact (0–3) / estimated hours. Scores are editorial prioritization, not traffic forecasts. Exact competitor-query volume unavailable is null; vendor audience/review activity is only a proxy and must be labelled. Build once from the existing competitor table; recheck public facts before publishing.

Every job must produce a concrete outcome, eligible work artifact or precise blocker with an independent next action. Do not repeat no-change audits. Respect the deadline; if a build cannot finish before it, leave a resumable branch and release-stage receipt. No pushes in the final ten minutes unless all validation is complete and production verification can finish.

# Content and AEO gates

Load the sibling ai-answer-visibility skill for each content/release cycle and AI visibility review. It is an explicit owner priority, not an optional audit-score exercise.

Map query intent to existing URLs before selecting a slug. Keep successful AI guide and recently changed pages stable for 28 days after confirmed recrawl; 14-day review is observational. Real factual or technical errors can be repaired immediately. Favor distinct comparisons over cosmetic rewrites. Current candidates: GrowDoc vs MasterGrowbot (photo-report software decision), HiGrade vs MasterGrowbot (hardware requirement/subscription decision, no potency-performance claims), and a platform-specific software buying gap only if distinct from existing app guides. Check actual corpus before creating any URL.

For each candidate: record audience, buyer question, GSC evidence or explicitly weaker demand proxy, overlap check, vendor sources/dates, truthful differentiators, authentic screenshot availability, app CTA plan and baseline. Use an answer-first introduction, publisher ownership disclosure, sourced feature table including competitor strengths, limitations, platform-specific availability and genuine store links. No invented testing, prices, reviews, ratings, accuracy, market size or integrations. Check live App Store/Google Play terms by platform. Do not automatically rank our app first.

Conventional crawlable HTML, clear headings, cited facts, author/update details, relevant internal links and appropriate Article/Breadcrumb/SoftwareApplication schema support discovery. There is no special AEO schema or guaranteed citation. FAQ content can help users without guaranteeing rich results. No hidden content, duplicated Markdown websites, mass translations or keyword variants. No copied competitor prose.

# Measurement

Use authenticated GSC for sc-domain:mastergrowbot.com; never GSC Wizard. One settled 28-day comparison at most twice weekly; use cached evidence between. Daily checks inspect only new alerts, new recrawls or changed artifacts. At most two focused drilldowns. Monthly on/after Oct26: 90-day trends, devices/countries, branded/nonbranded, overlap, indexing and funnel. Mark not-indexed reasons individually: correct exclusions are not errors.

GA4: organic landing sessions, sessions containing ios_app_click or android_app_click, and matched periods. A session conversion rate uses distinct compatible sessions, not event count divided by sessions. Keep one event per click with page/article/CTA context. App-store clicks are not installs or revenue. Use RevenueCat/App Store/Play Console attribution only when connected and supported; lack of attribution remains null. Separate Grow-Tech checkout from verified purchase. Record Google AI impressions, AI referrals and citations separately.

GSC/Codex connectors and browser sessions do not automatically transfer to OpenCode. Use the configured, locally authenticated Playwright session or recent manual exports. If inaccessible, write an access blocker once, reuse dated evidence for up to seven days and continue public research/technical work. Older evidence can support a labelled draft, not an invented fresh performance finding.

# Technical audit and release

Read references/release.md. Run existing node scripts/seo-catalog-audit.mjs only when source fingerprint changes. Use the bundled seo-audit skill monthly or for a material alert; no daily full crawl. Check selected revenue pages for HTTP status, initial content, one correct canonical, robots/indexability and page-appropriate schema. Browser-rendered performance is unmeasured when --no-cwv is used. A source-only malformed Android link was normalized by production renderer on Oct17; do not repair it again without a live failure.

# Distribution

Read references/outreach.md and the private submission kit. Verify one due placement or advance one eligible free listing/editorial pitch each distribution run. Maximum three new prospect researches per run; five new emails per week total across all jobs. Existing SaaSHub and Tool Directory submissions are pending: verify rather than resubmit. Ignlab is blocked for unsafe redirects; do not retry. Follow suppression and ambiguous-attempt reconciliation. No paid/reciprocal links, purchased contacts, fake reviews, bulk Reddit or anchor-text quotas. Browser CAPTCHA/new terms/auth requiring user action: mark blocked and choose another action without halting the whole cycle.

# Output

Write a valid JSON result to resultFile using {runId, job, status, actions, blockers, changedUrls, commits, productionVerified, nextActions, metrics}. status is completed, blocked or partial. Include evidence and precise release stage; missing metrics null. Save pending external actions before submission and receipts afterward. Maintain opportunity/issue/experiment/distribution ledgers and concise current.json changes. The runner writes final execution receipts and clears activeRun only for its own ID. Preserve unknown fields. Never claim a push proves production deployment, or an indexing request proves indexing.
