# Daily operation

1. Keep the laptop awake, online and signed into Windows from 09:45 to 12:45 Mexico City time. Scheduled tasks use OpenCode Desktop's bundled engine; the desktop window does not need to remain open. Do not repeatedly paste the setup prompt or manually start duplicate jobs.
2. Jobs start at 09:45 (measurement, Search Console issues and URL queue), 10:45 (buyer-intent content and AI-answer visibility), and 11:45 (distribution). Existing lock, free-model checks and the 12:45 cutoff apply.
3. Afterward run `powershell -NoProfile -File scripts/status.ps1` from this repository to see task and receipt status. Completed execution is not proof of increased traffic or purchases. Investigate partial/blocked/timeout results; never delete locks or daily markers to force a repeat.

## One-time Google connection

Outside an active growth job, run `powershell -NoProfile -File scripts/connect-google.ps1`. Complete Google login yourself in the browser it opens. Verify Search Console property `sc-domain:mastergrowbot.com` and GA4 property `530340261` using an account with access, then close that browser. Scheduled jobs reuse this dedicated private profile. No API key, paid connector or separate OpenCode CLI installation is required. If Google signs out or requires CAPTCHA, repeat this owner step; autonomous authentication cannot be guaranteed.

## What gets verified

New/materially repaired live pages enter a private URL queue. The agent inspects priority URLs, requests indexing when eligible, and records Google's confirmation separately from actual indexing. It checks notifications, fixes verified technical defects, submits eligible Validate Fix requests and tracks Google's eventual result. Correct exclusions are left intact. See the acquisition skill's references/search-console.md.

DeepSeek V4.1 Flash free remains the configured model; every run requires fresh zero-cost catalog verification for both task and auxiliary models. If the promotion ends or verification fails, inference stops without switching to a paid model. There is no guaranteed best free model or guaranteed 10x outcome.
