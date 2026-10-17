# Conditional website release checklist

Use a temporary `codex/` branch. Inspect repo instructions and protect unrelated changes. Select the smallest evidence-backed change; safe Markdown rendering lives in `src/components/GuideContent.tsx`. Do not restore a homepage canonical in the shared shell.

For content changes: clear answer-first H1, accurate sources, helpful sections, truthful app CTAs, correct Article/BreadcrumbList and genuine dateModified. Add relevant internal links and backlinks from existing pages where useful, without quotas or stuffing. Update sitemap lastmod only for meaningful content changes. llms.txt is optional discovery, never a ranking guarantee.

Run build, lint, and the applicable existing tests. Default SEO release suite: `npx playwright test tests/seo-release.spec.ts tests/grow-tech-testimonials.spec.ts --workers=1`. Additional tests should validate real new behavior, not mirror implementation. Run once and repeat only failed/affected checks after changes. For no-code monitoring do not run builds/tests.

Block only for failed build, material regression, wrong target canonical, broken page/rendering, accidental crawler/noindex blocking, material unsupported claims, or introduced serious security issue. Unrelated lint warnings, unavailable analytics, optional indexing buttons, CrUX, backlinks and unknown shipping timing do not block publication.

Check initial HTML content/canonical/metadata and page-appropriate schema, hydration/client navigation, internal links, mobile app CTAs and exactly one attributed event per click. Use the built static server and tests/crawlable-revenue.spec.ts alongside relevant existing regressions. Ensure private routes remain excluded and unknown paths return 404. Valid schema coverage matters alongside error counts. Commit intended files, push branch, safely merge/push main after checking concurrent changes. Existing GitHub-to-Vercel deployment is preferred; do not create another hosting project. Wait for actual production, verify HTTP 200 and the changed artifact/text. A successful push alone is not deployment verification.

Inspect the relevant production URL in Google Search Console browser, recording crawl/index/canonical details as shown. Request indexing only if applicable and publicly indexable; record UI acceptance separately from indexing status. If UI unavailable, report that and preserve discovery via sitemap/internal links. Follow `docs/search-discovery.md` for IndexNow/Brave. No submissions of unpublished URLs.

Save private performance data and receipts outside public files. Report no-code/no-publication cycles honestly; do not make a token commit just to claim release.
