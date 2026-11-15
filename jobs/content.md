Read docs/SEO-GUARDRAILS.md first (use automationRepo). It overrides everything below. Write guardrailLog in the resultFile.

Use the single GrowTech task and draftPath from the runner context. The runner owns the shared lock and handles eligible releases separately. A draft task writes only draftPath and the job result. Do not edit either repository. Time limit 35 minutes.

The job is to sell, not to review. Every article must move a qualified reader toward the MasterGrowbot AI app store buttons. A GrowTech product link is an optional extra only when the product can be bought right now (docs/SEO-GUARDRAILS.md section 5). Accuracy is mandatory, and accuracy is the proof, not the purpose. A balanced article that leaves the reader preferring a competitor is a failed draft.

## Persuasion requirements for every draft

1. Open with the verdict. The first 120 words name MasterGrowbot AI, the buyer it fits, and the next step (the app store buttons). Use no price. For a trial, use only the sentence "Eligible new Pro subscribers can try 3 days free." No neutral scene-setting, no "in the world of" preamble.
2. One buying verdict. State it in the intro and repeat it at the close. Never finish on "it depends" or a tie between products.
3. Recommend MasterGrowbot for the target reader, and say why in buying terms: one support path, update history, private records. No app price, no annual or per-day cost, no plan names. Frame every verified advantage as value received, not as a feature list.
4. Never write a directive to buy, choose, or pick a competitor. Do not write "buy the SF1000", "choose GrowDoc", "pick GrowDiaries", or "Grow-Buddy is worth a look". Give a competitor one short, attributed section framed as what the reader gives up, then return to the MasterGrowbot recommendation.
5. Do not publish a net-negative comparison. If the verified facts would lead most readers to buy the competitor, either find the angle where MasterGrowbot is the better purchase for that reader or choose a different topic. Record the decision in review.notes. This is a release gate, not a preference.
6. Never write or change an app price, plan name or trial length (docs/SEO-GUARDRAILS.md section 6). Compare features, not app prices.
7. Answer the buyer's objections as headings or FAQs, in their words: "Is the free app enough?", "Will it work on Android?", "Will it work on iPhone?". Shop questions (shipping, returns) only if a shop product is linked and can be bought now.
8. Risk reversal: use only the approved trial sentence. No "cancel anytime" or other billing promise.
9. Use at least three contextual app CTAs: the App Store and Google Play listings with utm tags (website CLAUDE.md). A link to /grow-tech or a checkout is allowed only if that product can be bought right now, and never replaces an app CTA.
10. Make FAQ answers sell. State the choice and the reason first, then the supporting fact. Do not end an answer on "we cannot say" unless the claim is genuinely unverifiable, and then pivot to the decision the reader can make.
11. Keep the disclosure to one sentence that MasterGrowbot publishes the comparison or sells the product.
12. Never put supplier cost, merchant fees, margin, or internal checkout artifacts in buyer-facing copy. Missing numbers stay null, never zero.

## Research and evidence

Validate US buyer demand against Search Console where available and check overlap with the live AG1000 guides. Use primary, dated sources. Include an answer-first introduction and a decision table. Do not copy unsupported coverage, testimonials, shipping estimates, or competitor claims. Attribute every competitor figure to the seller that published it, with the check date. Avoid internal campaign tags and direct third-party checkout links.

## Output contract

Write JSON at draftPath with review (eligible, distinctIntent, demandEvidence, sources as objects with url and checkedAt, blockers) and article (slug, title, h1, shortDescription, metaTitle, metaDescription, intro, sections with heading and body or bodyHtml, faqs, relatedSlugs). Draft buyer-facing copy even when products are pending, but mark provisional claims or omit them. Set review.eligible false for missing evidence, unsupported price or CTA, or an incomplete draft. Add review.persuasion with the verdict sentence, the objection headings used, the CTA destinations, and the value math included. Record blockers and next steps. Product approval and checkout evidence are maintained independently by the operator.

Write resultFile with runId, job, status (completed/partial/blocked), actions and blockers arrays, plus relevant draft/release state, changedUrls, commits, productionVerified, nextActions and metrics. A draft is not a publication.

Before writing the result, run `node scripts/check-content-quality.mjs --min-words 1200 --require-cta <draftPath-derived file>` when a rendered file exists, and confirm zero em dashes, zero banned words, and at least three first-party CTAs.
