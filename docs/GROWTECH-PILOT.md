# GrowTech pilot operating notes

The 09:45 Mexico City task reconciles releases and handles due Search Console work. Full performance review runs Tuesday and Friday. The 10:45 task advances one draft or releases one eligible guide. The 11:45 task handles due discovery every day and other due distribution work on Tuesday and Friday. The shared lock and 12:45 cutoff apply. Use only the configured free DeepSeek model.

The runner selects from the candidate list in scripts/growtech-pilot.mjs. Read only the selected draft and evidence. Campaign release conditions are a 48-hour gap between all new editorial URLs, at most three during a Mexico City Monday-Sunday week, and at most ten campaign URLs. The ceiling was raised from five to ten once the first releases were production-verified, because five would have ended the campaign in a week while the spacing, weekly and evidence gates already bound the pace. The private legacy new-page-ledger.json and GrowTech release ledger are combined by URL. A pending or ambiguous push blocks the next release until reconciled.

## Product and draft handoff

The operator maintains growtech-product-evidence.json in stateDir, keyed by checkout-map slug. Each entry needs verified, verifiedAt, sku, dimensions, contents, supplierSource, fulfillmentTerms, inStock, saleEnabled (false), priceUsd, supplierDeliveredUsd, merchantFeesUsd, checkoutVerified, planId, checkoutPath and hostedUrl. Kits also need ventilationContents and lightingDetails. For a ventilation-only kit record the explicit exclusion. Verify the matched Whop offer and use actual delivered costs and fees. Evidence expires after seven days. Deduct the $5 reserve and require $40 contribution.

Draft contract is in jobs/content.md. Research and review can be done privately. Set review.eligible true only after confirming the intent, facts, buyer copy and CTA. Draft status never overrides product or cadence checks. When a blocked draft is resolved, update the existing draft and evidence files. An eligible draft is then picked up by the scheduled runner.

## Release and discovery

The release helper generates the article module, registry entry, sitemap entry and route rewrite in an isolated worktree. It checks rendered prose, builds the site and checks the new output. It checks remote main again and pushes only a normal fast-forward. If main changes, retain the draft and rebuild from current main on the next eligible run. Preserve the release receipt and revert reference. Inspect an ambiguous push before retrying. The runner records the release as published only after live HTML, canonical, exact hub link and sitemap verification.

Check the existing issue ledger against the affected URLs. Missing image has passed and should stay closed. The country warning concerns /playbooks. Confirm markup coverage before attributing a change to a repair. Add deliveryTime only with independently supported handling and transit ranges. Free Shopping listings require verified and eligible offers, accurate feed/landing/checkout details and destination compliance. Preserve the storefront integration and record any larger prerequisite for the storefront owner.

Keep supplier costs, Whop identifiers, analytics and payment receipts in private state. Use qualified organic visits and product/checkout click sessions by article and SKU. Reconcile orders, refunds and receipts against Whop, deduct fees and delivered cost, and separate unknown attribution. Review discovery after 14 days and conversion after 28 days following recrawl.

## Operation

Use scripts/status.ps1 to read receipts and missing slots without model usage. The capability check runs through scripts/scheduled-entry.ps1 with -Job measurement, -NodePath and -CapabilityCheck. It acquires the shared lock without claiming a daily slot. Inspect individual tool receipts in its private log. A finished smoke invocation does not establish browser authentication. Check lock owner, descendants and pending actions before manually reconciling an abandoned lock.

Rollback the runner with a revert of the pilot automation commit. Reapply the previous Windows retry settings only if specifically needed. Site receipts record a separate article commit to revert.
