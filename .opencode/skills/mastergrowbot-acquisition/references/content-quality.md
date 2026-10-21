# Content quality standard: no AI slop and bottom-of-funnel value

Binding for every new or materially updated article, buying guide, comparison, landing page, meta description, CTA, FAQ, alt text, and outreach message. Read this before selecting a topic and again before release.

Source rules: https://github.com/petergyang/no-ai-slop, commit `000650b156983f5159695b441477f4e63b25dc85`. The owner has adopted the no-ai-slop editing principles and eval as binding, with one stricter rule: zero em dashes.

## Hard bans

- Em dash (U+2014) and the HTML entity `&mdash;`: never use them in any article, heading, title, meta description, CTA, FAQ, alt text, or outreach copy. Use a period, comma, colon, semicolon, or parentheses. An en dash (U+2013) is allowed only inside a numeric range such as 20–100%.
- Banned words, never use them: delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge, paradigm shift, game changer, this is huge, this changes everything, tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge, harness, ever-evolving.
- Empty phrases to cut unless quoted as an example: it's worth noting, it's important to note, at the end of the day, when it comes to, at its core, in today's world, in the age of, in the world of, the reality is, the truth is, in terms of, with regard to, in order to, going forward, in this article, let's dive in.
- Empty adverbs to cut unless they carry real emphasis or uncertainty: just, literally, honestly, simply, actually, truly, fundamentally, importantly, crucially, inherently, inevitably.
- Never invent a test, review, rating, price, specification, integration, market size, search volume, or customer quote. If a fact is not in an owner-verified source or a named primary source, leave it out or mark it "not published."

## Slop patterns to remove

- Binary contrasts. "This is not X. It's Y." State Y directly.
- Throat-clearing openers. "Here's the thing," "Let me be clear," "I'll be honest." Cut the setup and state the point.
- Faux-insight setups. "What most people get wrong," "Here's what nobody tells you." Make the claim stand on its own.
- Colon reveals. A noun phrase, a colon, then a lowercase dramatic reveal. Use colons for lists, labels, and quotes only.
- Superficial analysis. Trailing `-ing` clauses such as "highlighting," "underscoring," "reflecting," and "showcasing." Replace them with a consequence or a fact.
- Importance puffery. "Stands as a testament," "marks a pivotal moment," "plays a vital role," "solidifies its position." State the fact.
- Interpretive metadiscourse. "The key point is," "That last part matters," "As you can see," "This distinction matters." Delete it or replace it with support.
- Weasel attribution. "Experts agree," "industry reports suggest," "many argue," "studies show." Name the source or cut the claim.
- Fake-strong verbs. "Serves as a centralized hub for" becomes "tracks X, Y, and Z in one place."
- Synonym cycling. Repeat the clear word instead of rotating terms for style.
- Negative listing. "Not X. Not Y. Z." Just say Z.
- Dramatic fragmentation. "X. And Y. And Z." Use complete sentences.
- Robotic rhythm. Avoid repeated sentence shapes and identical paragraph structures.
- Rhetorical setups. "What if I told you," "Think about it," "Plot twist." Drop them.
- Fake-profound kickers. Delete the cute final metaphor or mic-drop line. End on the clearest concrete sentence or next action.
- Summary-recap endings. "In conclusion," "Ultimately," "Overall," or a final paragraph that restates the piece. End on the last concrete point or next action.
- Formatting slop. Emoji headings, bold sprinkled mid-sentence, bullet lists where two sentences of prose would read better, and headers over two-sentence sections.

## The editing test

Apply the no-ai-slop principles and eval:

1. Preserve the point and the brand voice. Add no claims, examples, stats, quotes, or opinions.
2. Leave strong sentences alone. Make the minimum effective edit.
3. Lead with what the buyer needs. Cut generic throat-clearing.
4. Make every sentence earn its place. Cut empty qualifiers and filler.
5. Use active voice and human subjects where possible.
6. Be concrete. Names, numbers, dates, mechanisms, and examples beat abstractions.
7. Protect the specific fact. Do not smooth a useful detail into generic importance.
8. Apply the portability test. If a sentence could move unchanged to another product, cut it or make it specific.
9. Show, don't tell. Make facts, actions, examples, and consequences carry the emphasis.
10. Read it aloud. If it sounds like a generic AI summary, rewrite it.

## Bottom-of-funnel brief, required before drafting

Save this in the private content brief and repeat the essentials in the result JSON:

1. Primary keyword. One commercial-intent phrase the page should own.
2. Secondary keyword cluster. Five or more modifiers the buyer actually types, such as price, cost, size, coverage, wattage, dimming, plug, voltage, warranty, shipping, returns, comparison, alternatives, review, bundle, or brand plus model.
3. Question keywords. The buyer questions the page answers, including the money question: which one should I buy, what does it cost, what is included, and what should I check before checkout.
4. SERP review. The top three to five ranking pages, their angle, their gaps, and the date of the review.
5. Cannibalization check. The existing URLs that serve the intent and why this page is distinct.
6. Value thesis. One sentence naming what this page does that no ranking page does. Examples: original cost math, owner-verified checkout facts, measured data, a decision table, or a documented comparison.
7. Evidence list. Each source, date, and the exact fact it supports.

Score each candidate keyword from 0 to 3 on purchase intent, product fit, evidence available, observed gap, and path to checkout. Reject broad informational topics, "what is" pages, growing tips, and anything that cannot lead a buyer to the product or checkout. Do not create thin keyword variants of the same intent.

Example for the AG1000 light guide:

- Primary: 100W LED grow light buying guide.
- Secondary: best 100W LED grow light, 100W LED grow light coverage, 100W LED grow light true wattage, dimmable 100W LED grow light, 100W LED grow light for a 2x2 tent, 100W LED grow light price, 100W LED grow light with US plug, AG1000 review.
- Questions: How many watts does a 100W LED grow light draw? What area does a 100W light cover? Do I need a dimmer? What is included at $199? What should I check before ordering? How does it compare with a cheaper 100W light?
- Value thesis: The page shows the real package math and the checkout facts a buyer cannot see in a spec table, then tells the buyer which questions to settle before paying.
- Excluded: yield, potency, cultivation schedules, and any claim the owner has not verified.

## Required blocks for a bottom-of-funnel buying guide

- Answer-first verdict. What the product is, the price, who it fits, and who should skip it.
- Sourced fact and package table. Model name, wattage, dimming, plug, controls, included items, shipping, returns, and warranty. Mark unknown fields "not published."
- Fit and coverage. The buyer's space scenario with sourced numbers. If coverage is not published, say what the buyer must verify instead of inventing a number.
- Total cost. Product plus required accessories, shipping, tax, and subscription. Show what is included and what is separate.
- Comparison. Two or three real alternatives in the same price band and use case, with sourced differences.
- Pre-order checks. Plug and voltage, dimming, mounting, delivery, returns, support, and the exact checkout terms.
- Red flags and common mistakes. Specific to this product category, not generic advice.
- Who should buy and who should not.
- FAQ. Real buyer questions, answer-first, no filler.
- One primary CTA to the product or checkout and one secondary path.
- Sources and dates. Owner-verified claims stay exactly as supplied.

## Quality gate

All must pass before release:

- [ ] Zero em dashes and zero `&mdash;`.
- [ ] No banned words or empty phrases.
- [ ] No slop patterns from the list above.
- [ ] Primary keyword appears naturally in the title, H1, first 100 words, one H2, and meta description.
- [ ] At least five secondary or question keywords are answered naturally.
- [ ] At least 1,200 words of substantive copy for a bottom-of-funnel guide, or a written reason why a shorter page is stronger.
- [ ] At least one comparison table or structured decision table.
- [ ] At least one original value element: cost math, verified checkout facts, owner photos, measured data, or a decision framework competitors do not provide.
- [ ] Every factual claim is sourced or owner-verified. No invented tests, reviews, ratings, prices, or specifications.
- [ ] One clear CTA to the product or checkout and one secondary CTA.
- [ ] Headings every 150 to 250 words. No wall of text.
- [ ] Read-aloud test passed. No sentence that sounds like a generic AI summary.

Run `node scripts/check-content-quality.mjs --changed <siteRepo>` for the automated portion. Fix every error. The automated check does not replace the scorecard.

## Workflow

1. Research the keyword cluster and review the live SERP.
2. Write the brief and the value thesis.
3. Outline the required blocks.
4. Draft with verified facts only.
5. Run the no-ai-slop edit pass and the eval.
6. Run the automated quality check on the changed files.
7. Fix every failure.
8. Release only after the normal build, test, canonical, and production gates.

## Existing content

The October 21 owner content lock still protects existing website text, reviews, ratings, product claims, prices, headings, metadata, and design. Report defects in existing pages instead of rewriting them. A rewrite needs explicit owner authorization. Do not use this standard as permission to edit locked text.
