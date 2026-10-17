---
name: playwright
description: Use Playwright CLI on Windows for authenticated browser inspection and bounded verified software-listing actions.
---

Use the installed `playwright-cli` command, not @playwright/test for browsing. Setup installs it once from the official @playwright/cli npm package. Check `playwright-cli --help` before assuming flags. The automation sets PLAYWRIGHT_CLI_SESSION=mastergrowbot-growth; never reuse unrelated personal browser profiles or extract cookies.

Use `playwright-cli open URL --headed`, `snapshot`, `click eN`, `fill eN text`, `press Enter`, `tab-list`, `tab-select N`, `screenshot`. Snapshot before using element references and after navigation or meaningful changes. References are ephemeral. Do not invent them or bypass stale refs with eval. Read only the compact relevant results. Save screenshots to output/playwright in the working website repository and private receipts outside public Git.

One-time setup: open GSC and GA4 in this named browser session; let the owner complete login. Persist session through the documented state-save/state-load features when supported by installed CLI; keep auth state outside Git and never print it. Codex's in-app-browser session is not automatically shared. At each run inspect session state once. If signed out, record the access blocker and continue independent eligible work. No repeated login retries, CAPTCHA solving, new binding terms, permission grants or password handling unattended.

Before a listing/email final submission, verify the sender, exact destination, eligibility, suppression and pending-attempt ledger. After submitting, capture confirmation. Never retry an ambiguous submission blindly. Do not click payments, paid upgrades, reciprocal links or unsafe redirects. Routine owner-authorized work does not require new approval; blocked exceptional work must be logged without stalling other jobs.

Use ?mgb_analytics=off on deliberate website QA visits to avoid polluting acquisition measurements. Do not use it on customer links. Verify mobile app CTAs without real purchases. A screenshot or HTTP204 is not proof of paid conversion.
