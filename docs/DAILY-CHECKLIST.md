# Daily operation

1. Keep the laptop awake, online and signed into Windows from 09:45 to 12:45 Mexico City time. Scheduled tasks use OpenCode Desktop's bundled engine; the desktop window does not need to remain open. Do not repeatedly paste the setup prompt or manually start duplicate jobs.
2. Jobs start at 09:45 (measurement, Search Console issues and URL queue), 10:45 (buyer-intent content and AI-answer visibility), and 11:45 (distribution). Existing lock, free-model checks and the 12:45 cutoff apply.
3. Afterward run `powershell -NoProfile -File scripts/status.ps1` from this repository to see task and receipt status. Completed execution is not proof of increased traffic or purchases. Investigate partial/blocked/timeout results; never delete locks or daily markers to force a repeat.

## One-time Google connection

Outside an active growth job, run `powershell -NoProfile -File scripts/connect-google.ps1`. Complete Google login yourself in the browser it opens. Verify Search Console property `sc-domain:mastergrowbot.com` and GA4 property `530340261` using an account with access, then close that browser. Scheduled jobs reuse this dedicated private profile. No API key, paid connector or separate OpenCode CLI installation is required. If Google signs out or requires CAPTCHA, repeat this owner step; autonomous authentication cannot be guaranteed.

## What gets verified

New/materially repaired live pages enter a private URL queue. The agent inspects priority URLs, requests indexing when eligible, and records Google's confirmation separately from actual indexing. It checks notifications, fixes verified technical defects, submits eligible Validate Fix requests and tracks Google's eventual result. Correct exclusions are left intact. See the acquisition skill's references/search-console.md.

DeepSeek V4.1 Flash free remains the configured model; every run requires fresh zero-cost catalog verification for both task and auxiliary models. If the promotion ends or verification fails, inference stops without switching to a paid model. There is no guaranteed best free model or guaranteed 10x outcome.

October18 update: the runner can select verified-free GLM 5.3 Flash before a job starts if DeepSeek's catalog entry no longer qualifies. It never replays partially executed work merely to switch models. All three jobs start fresh sessions, so the desktop setup chat's 100k context is not a daily allowance and does not need resetting. Provider usage limits remain outside our control. Content now prioritizes evergreen, bottom-of-funnel comparisons selected from US iPhone competitor popularity and actual query opportunity; see the acquisition skill's competitor-acquisition reference.


## November 1 stability update

All three daily triggers remain 09:45/10:45/11:45 Mexico City. WakeToRun is enabled per task; Windows power policy, battery state and hardware can still prevent wake. Keep laptop powered, online and signed into Windows; shutdown prevents execution. No global power/security settings were changed. October31 woke at 13:03, invoked tasks at 13:09 and skipped outside the 12:45 cutoff. Exit0 on a skip does not mean a business job completed.

Run powershell.exe -NoProfile -File scripts/status.ps1 for a no-model status check; daily-status.mjs distinguishes not-due, outside-window, deferred-lock, quota, partial and completed work. Do not ask the model to repeat this audit daily. The same configured free provider can reject scheduled work after manual usage; avoid long manual DeepSeek sessions during 09:45-12:45. Fresh standalone sessions do not grant new provider quota. No paid fallback or quota evasion.

Work budgets: measurement15, content35, distribution25 minutes, all bounded by 12:45. Full matched analytics Tuesday/Friday. Distribution off those days runs only when explicitly due. A daily trigger does not imply a new article daily; two evidence-qualified new pages per week maximum.

Publication reports must distinguish metadata refreshes from new pages and provide URL, commit, live hub-card verification and actual indexing-request outcome. Existing metadata changes may not change the hub title.

Git dry-run push was successful for both owner repositories November1. OpenCode scheduled permissions allow git add/commit and ordinary push in both, with external-directory scope for both configured paths. The active scheduled agent read authenticated Search Console November1; do not reopen its browser profile concurrently. Request Indexing and Validate Fix are authorized when eligible, with private receipts and Google limits honored. API inspection alone cannot request indexing.
