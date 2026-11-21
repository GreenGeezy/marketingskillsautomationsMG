# SEO guardrails: read this first, every run

These rules override every other instruction in this repository, including older prompts, skills, jobs, campaigns and owner approvals dated before this file. If another file conflicts with a rule here, follow this file and record the conflict in the run log. Written for a small model: when unsure, do not change the page. Doing nothing to a ranking page is always allowed.

Why this exists: a page that ranked near position 12 (/vpd-calculator, 7,947 impressions in 3 months) was edited five times in six weeks, its title and H1 were rewritten, it collided with an existing guide, and it fell to position 40 with no clicks. Site-wide Google clicks fell from about 95 a week to 6. Change is the danger. Stability is the default.

Definitions. Run log: the `guardrailLog` object inside your resultFile. Owner approval: an entry in stateDir/owner-approvals.json written by the owner. A run never creates or edits that file. Website repo: siteRepo from the runner context.

## 1. Protected pages

Protected list: `/vpd-calculator` and `/` (the homepage). Only the owner adds or removes entries.

For every protected page:
- Never change its title tag, H1, URL, canonical, or meta robots.
- Never change the text, order or target of any nav or footer link that points to it. The nav label for `/vpd-calculator` is "VPD Calculator". Keep it exactly.
- Body additions only (new helpful text, accessibility labels, fixing a real broken link or a real factual error).
- At most one edit per protected page per 28 days. Check git log in the website repo for the page's last edit date. If it was edited in the last 28 days, do not touch it.
- Never add shop offers, hardware products, prices, upsells or promo boxes to a protected page or to any free calculator (/vpd-calculator, /grow-light-calculator).

## 2. Nav, footer, URLs, redirects

- Never rename, reorder, add or remove a nav or footer link. Never change a route, slug, canonical or redirect rule.
- Never consolidate, merge, redirect, noindex, unpublish or delete a page without owner approval. "Duplicate" is not approval. Do not write "consolidate" into a commit message as an action unless approval exists.

## 3. Changing the title or H1 of ANY existing page

Do it only if every line below is true. Otherwise leave title and H1 alone.
1. You have Search Console data for that exact page for the last 28 days (queries, impressions, clicks, average position), read in this run or saved in private state within the last 7 days.
2. You wrote that data into the run log: `guardrailLog.gscEvidence` with the page URL, the date range, the top queries, impressions and average position.
3. The page's average position is worse than 20 (a number above 20). If the position is 20 or better (for example 11.9), never change the title. Never change an H1 on such a page either.
4. The page was not edited in the last 28 days.
5. The one-page-per-phrase check in section 4 passed with the new wording.

No Search Console data means no change. "Improve CTR" is not a reason to change a title on a page that already ranks.

## 4. One page per search phrase

Before you create a page or retitle any page:
1. List every existing page title and H1 (from the site source and public/sitemap.xml) in the run log: `guardrailLog.existingTitles`.
2. Write the main phrase of the new or changed title. If any other page's title or H1 already uses that phrase, or a close variant, stop. Do not create or retitle. Link to the existing page instead.
3. Never use a title or H1 that is the same as, or a reordering of, another page's title or H1.

## 5. Calls to action

- The primary call to action on every guide and comparison is the MasterGrowbot AI app store buttons (iOS and Google Play, with the UTM links and gtag events in the website repo's CLAUDE.md).
- Never replace or remove the app call to action with a GrowTech or shop product, a kit, a lens, a hardware tool or any other offer.
- Never link to a product that cannot be bought right now. Before any shop link, open the product page. If it says "Ordering opens soon", "Coming soon", "Sold out" or has no working checkout, do not link to it.
- Shop links are optional extras, never the primary call to action, and never on a free calculator page.

## 6. Prices, plans and trials

- Never write or change an app price, plan name (weekly, monthly, annual, Pro, Premium), discount, or trial length.
- If a page needs a trial statement, use only this sentence, exactly: "Eligible new Pro subscribers can try 3 days free."
- Never write "cancel anytime", "no credit card", "7-day", "free forever" or any other trial or billing promise.
- If you find a page with a different price or trial claim, do not fix it yourself. Record it in `guardrailLog.ownerFlags`.

## 7. Sitemap

When a page's visible content changes (not only code), set that page's `<lastmod>` in public/sitemap.xml in the website repo to that day (YYYY-MM-DD). A new page gets a sitemap entry with today's date. Never change lastmod for a page you did not change.

## 8. Writing rules

Follow the website repo's CLAUDE.md. No em dashes (U+2014 or &mdash;) in any visible copy. No AI vendor or model names (no Gemini, GPT, ChatGPT, Claude, OpenAI, DeepSeek or similar) in any visible copy. Use "our proprietary cannabis cultivation AI" if you need to describe the AI.

## 9. One change set per run

- One run makes one change set: one new page, or one edit to one existing page. Not both.
- Work on a branch in the website repo (the `codex/` branch rule in release.md). Never commit unrelated files in the same change set.
- Write a run-log entry in `guardrailLog`: `changed` (exact files and what), `why` (the evidence), `protectedPagesTouched` (list, normally empty), `checks` (which sections of this file you checked and the result).
- Run the site build (`npm run build` in the website repo) and the content-quality check. If the build fails, do not push. Leave the branch, write the failure in the run log, and stop.
- Push only after the build passes. Then verify the live page.

## 10. What to do instead of editing ranking pages: new pages

New pages are preferred over edits to existing ranking pages. A new page still needs a section 4 check. Priority order for new pages. Take the first topic with no existing page:
- (a) Symptom pages: yellow leaves, leaf curl, leaf spots, overwatered vs underwatered, trichomes vs mold.
- (b) Comparison pages against other grow apps. Use only facts visible on the public App Store and Google Play listings of that app (name, price shown, rating count, listed features). No guessed or tested claims.
- (c) Pages that link into the free tools at /vpd-calculator and /grow-light-calculator. Add the link from the new page. Do not edit the tool pages to do it.

Every new page: app store buttons as the primary call to action (section 5), within the first 300 words, plus a link to the /grow-guides/ hub and to the homepage. The symptom pages in (a) explain what the symptom looks like and what usually causes it. No yield, potency or drug-preparation instructions.

## 11. Stop conditions

Stop the run, write the reason in the run log, and make no change when: Search Console data is missing for a title or H1 change; a protected page is involved beyond a body addition; the phrase is already used; the build fails; you cannot tell whether a product can be bought.

## 12. Yearly refresh of pages with a year in the title (owner-approved, 2026 to 2027)

This is the only case where a title or H1 on a ranking page may change without the section 3 position rule. The owner approved it on 2026-11-15. It overrides section 3 item 3 for the pages listed here and for nothing else.

When: start on 2026-12-15, not before. Finish by 2027-01-15. One page per run, one run per day at most.

Which pages, in this order (highest clicks first):
1. /grow-guides/best-ai-cannabis-growing-apps-2026
2. /grow-guides/best-cannabis-growing-apps-2026
3. /grow-guides/best-ai-plant-cameras-cannabis-growers-2026
4. /grow-guides/cannabis-plant-identifier-apps-2026
5. Any other guide whose title contains "2026". List it in the run log before changing it.

What to change on each page:
- In the title tag, H1, meta description and body text, change the year 2026 to 2027. Change nothing else in the title or H1. Keep every other word and the word order.
- Keep the URL exactly as it is, even though it contains 2026. Never create a second page for 2027. Never add a redirect.
- Update the facts: re-check each app's public store listing (price shown, rating count, last update) and correct what changed. Set dateModified and the sitemap lastmod to that day.
- Keep the app store buttons as the primary call to action. You may add one link to a free tool: /cannabis-symptom-checker, /vpd-calculator or /grow-light-calculator.
- Photos you may use: /images/grow/cannabis-leaf-yellowing-brown-spots.webp, /images/grow/flowering-cannabis-plant-led-tent.webp, /images/grow/cannabis-trichomes-macro.webp, each with width 1448, height 1086 and descriptive alt text.

Write in the run log: the page, the old and new title, and each fact you corrected with its source URL. If the build fails, do not push.

The free tools /cannabis-symptom-checker and /grow-light-calculator follow the same no-shop rule as /vpd-calculator in section 1. Do not edit the tool pages. Link to them from new pages.

## 13. Seasonal and yearly pages (owner-approved 2026-11-21)

- /grow-guides/gifts-for-cannabis-growers is an evergreen holiday page. Never create a second gift guide or a dated copy. Each year between November 1 and November 15, change the year in its title, H1 and meta description, re-check that every linked product can still be bought, and set modifiedDate and the sitemap lastmod. Leave it untouched otherwise.
- Never add seeds, clones or live plants as gifts or products on any page.
- The 2026 to 2027 refresh in section 12 still starts on 2026-12-15.
