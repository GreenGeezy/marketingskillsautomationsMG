# Hand off LinkedIn and Cannabis AI News & Tools

Use this as the first prompt in a project-aware agent. It applies to these two weekly jobs only. Checked against the active Codex definitions and upstream sources on 2026-11-22. An agent with repository access alone can rehearse both workflows. External writes require the owner's existing accounts and a single designated publisher.

> Read this file, SYSTEMS.md, REVENUE.md, then LINKEDIN.md or NEWSLETTER.md in this directory. Use the website brief for placement and design decisions. Identify the active writer, private scorecard, next local trigger and last remote receipt for the selected job. Run the offline rehearsal. In standby, produce a private plan and reconcile existing state read-only. In a verified takeover, execute the selected runbook from the first unverified step. End with what actually ran, evidence, attributable revenue or unknown, one experiment, and the next check. Never invent a successful action from a draft, tool response or elapsed time.

| Job | Trigger in America/Mexico_City | Current primary | Write boundary |
|---|---|---|---|
| Newsletter | Tuesday 10:00, cron `0 10 * * 2` | Codex heartbeat `prepare-the-private-monthly-cannabis-ai-news-tools-email-draft-for-eli-search` | Owner preview and one eligible Resend customer edition. Timer begins with actual preview delivery. |
| LinkedIn | Thursday 10:00, cron `0 10 * * 4` | Codex cron `eli-linkedin-authority-weekly-batch` | Organic posts for three approved bylines. Reconcile the customer archive when due. |

The old newsletter ID contains “monthly”. Its current trigger is weekly. The LinkedIn batch time is distinct from individual post slots. Use a timezone-aware scheduler with the named zone. Verify the next two occurrences in local time and UTC after installation. Use one invocation per job and local cycle date. The LinkedIn primary used gpt-6.2-astra/high at inspection; use the strongest already-available editorial/reasoning model on the chosen platform for judgment. Keep deterministic bookkeeping outside the model. Reuse source notes and original media across channels. Use an existing free allocation. Enable no paid service.

## Bind privately before takeover

Use a private operating workspace shared with the successor or securely transferred to it. The primary uses `linkedin-authority/launches/newsletter-scorecard.md`, the dated launch record in that directory, and `linkedin-authority/{history.jsonl,state.json,learning.jsonl,ideas.jsonl,research.jsonl,batches/}`. Load the most recent receipts, pending actions, holds, verified blackout/reserved slots, editorial assets and last experiment. Historical strategy files may name a superseded Friday trigger. Read current provider state first. Restore the existing ledger even if the new machine starts empty.

| Bind to an authenticated role | Verify privately |
|---|---|
| Primary and standby scheduler operators | Job IDs, timezone, next triggers, ability to pause/resume and inspect in-flight work, named writer for each channel |
| Buffer and LinkedIn Page admin | Three bylines mapped to exact accounts, queue timezone, media and permalink access, native publication Page fallback |
| Formspree, receipt/reply Gmail, Resend | Correct form, authenticated inbox, brand domain, owner-only QA recipient, owner preview mailbox, verified segments per cadence, suppression access, approved postal footer, edit/hold access |
| Google/Vercel/site repo | Relevant GA4 property, optional private lead sheet/deployment, correct production alias, site source, build and archive deploy permissions |
| Revenue reports | Read-only RevenueCat/app stores, Whop and KDP reports as applicable, currencies and reporting delays. Aggregates suffice. |
| State | Private persistent ledger, clock, designated controller, access to previous provider IDs, content versions, preview delivery time and suppression/reply reconciliation |

Sessions do not transfer with Git. Use the platform's authenticated connector first or an existing signed-in browser profile. Confirm active workspace/account and effective scope with a read. Ask for a sign-in only for the specific missing account. Use a credential manager for secrets. Keep addresses, dashboard/edit URLs, tokens, private DNS values, customer data, analytics IDs, receipts and unpublished material out of Git and prompts sent to public systems.

## Single-writer takeover and recovery

**On a different platform.** Open this checkout and the read-only website checkout in the agent workspace. Bind the required provider roles privately. Give each weekly job its row's schedule and the bootstrap prompt above, appending either “Run LINKEDIN.md” or “Run NEWSLETTER.md”. Use the host scheduler only if it supports unattended runs, durable state, the IANA timezone and access to the authorized accounts while unattended. If the model interface only supports interactive chats, use it for drafting or rehearsal and keep the current scheduler in control. Test a cold start with read-only provider access and compare the proposed next action with the current writer's last receipt. Verify the first real run and next trigger after exclusive cutover. A passing offline rehearsal covers policy decisions; provider authentication, audience evidence and production receipts require separate verification.

1. Default the replacement to standby with triggers disabled and write tools disconnected. Run `node --test tests/communications.test.mjs` from the repo root. Compare its proposed next slot, edition, cohorts, latest preview version and outstanding receipts to the primary privately.
2. At cutover record UTC time, channel, cycle, owner and new writer. Pause the old trigger through its scheduler. Confirm any in-flight run has finished or is fenced from provider writes. Pausing future runs alone cannot cancel an already queued post or broadcast. Inventory remote drafts, schedules, published/sent items, pending holds and archive work.
3. Transfer a **single** authority to write. Across hosts use a private durable store with atomic compare-and-set ownership/generation and one executor routing writes, or perform a manual exclusive cutover that disables the old executor's publishing access before enabling the new one. A local lock file, timeout or shared spreadsheet alone cannot fence two live agents. If exclusivity is uncertain, continue research and reconciliation read-only.
4. Before each mutation persist a private intent with channel, logical key, generation, version, proposed destination/time and remote ID if known. Use a stable key per edition or byline/slot. An edit or retry retains that key. Recheck ownership, holds and remote state just before the write. Store acknowledgment and independently read the provider state. A timeout is an unknown outcome. Search the provider by ID or destination/slot/title/content and reconcile the matching object before any new submission. Ambiguous matches stay pending.
5. For rollback use the same handoff in reverse. Preserve scheduled provider objects, keys and history. Resume the previous writer only after the replacement is fenced. Keep the archive idempotent by broadcast ID across both jobs. Never register either job with the SEO runner.
6. On an outage, finish independent work, save drafts privately, record failure type and next check, and retry transient reads with bounded backoff. For an unknown write, auth loss, quota, mismatch, opt-out, hold or missing proof, protect the affected write and record the recovery action. Check again at the next authorized opportunity. Never send a batch twice to meet a deadline.

**Private run receipt template** (one per cycle; update from both channels when needed):

```text
job / local cycle / writer generation / run time UTC
previous experiment → evidence window / numerator / denominator / unknowns
before-write intent → stable key / content version / destination / planned time
provider → object ID / fetched state / verified at / permalink or delivered proof
audience → eligible counts by cadence / exclusions verified / latest opt-out check
revenue → currency / paid evidence / fees or refunds known / attribution confidence
experiment → bottleneck / one change / baseline / success measure / next check date
pending → owner or provider dependency / safe next action / due date
```

Record addresses and individual consent in the restricted audience system only. The operating scorecard uses counts and references. One shared issue/post/placement ledger lets Tuesday and Thursday observe the same result without counting two wins.
