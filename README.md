# MasterGrowbot autonomous SEO + AI-answer acquisition

Goal: **10x website traffic from interested MasterGrowbot AI buyers**, then more paid subscriptions. This repository contains the strategy, audit, reusable skills, three daily jobs, Windows scheduler and a paste-ready OpenCode setup prompt. Growth is a target, not a guaranteed result.

## Start here in OpenCode Desktop

Open this local project folder in OpenCode Desktop, select **DeepSeek V4.1 Flash Free**, and paste [prompts/OPENCODE-SETUP.md](prompts/OPENCODE-SETUP.md). It explicitly instructs OpenCode to connect to this GitHub repository, analyze it and the website repository, finish setup and continue autonomously.

Repository: https://github.com/GreenGeezy/marketingskillsautomationsMG

The installed desktop app on this laptop includes `C:\Users\elidu\AppData\Local\Programs\@opencodedesktop\resources\opencode-cli.exe` (verified **v2.0.32**). You **do not need a separate CLI installation**. The scheduler calls this bundled engine; the desktop UI can be used to inspect work. After desktop updates, setup should rediscover/verify the executable and flags. The current npm V2 package is `@opencode/cli`; do not blindly install the V1 `opencode-ai` over V2.

## Daily schedule — America/Mexico_City

| Start | Job | Output |
|---|---|---|
| 09:45 | Measurement and technical protection | Dated evidence, verified repair or precise opportunity handoff |
| 10:45 | Buyer-intent comparison work | Sourced distinct comparison, tested release, or advanced draft/evidence artifact |
| 11:45 | Distribution and follow-through | Eligible submission/pitch, verified placement, or completed draft with exact blocker |

Maximum 50 minutes per job; all work stops by **12:45**. One shared lock prevents overlap with the old growth workflow. A daily attempt marker prevents duplicate jobs and blind retries. If a timed-out process may have performed an external action, retain its lock for reconciliation instead of resending. An existing unknown lock is never expired automatically.

Windows Task Scheduler is the scheduling layer; OpenCode `run --standalone --auto` is the execution layer. No native desktop cron feature is assumed. The desktop window need not remain open. The laptop must be awake, online and signed into Windows; a locked session is fine for noninteractive work. Shutdown/sleep prevents execution. Missed tasks can start when available within the window; a lock-busy task returns75 and Windows retries after five minutes, subject to the same hard cutoff. Completed/attempted jobs cannot be blindly rerun. If the laptop wakes too late for three useful cycles, some work necessarily carries to the next day. No system clock/timezone change is made: triggers carry `-06:00` and the runner checks Mexico City time independently.

## One-time setup

On this laptop the files may already be installed and tasks registered; inspect before recreating. All commands below run from this repository in PowerShell.

1. Use Node22+ and Git. Install the pinned local browser/audit tools with `npm ci`. Do not install paid plugins.
2. Copy `config.example.json` to **ignored** `config.local.json` only if no local config exists. Verify website repository, external private state directory and bundled engine path. Keep the existing historical state; never replace it with empty templates. Confirm `git status` and authenticated remote access to the website repo.
3. Verify `& $engine --version`, `& $engine run --help` and `& $engine models --standalone`, where `$engine` is the full bundled executable path. Choose `opencode/deepseek-v4.1-flash-free`; both main and auxiliary model are pinned in the launcher.
4. Run `npm test`, then `node scripts/run.mjs measurement --preflight`. Preflight performs **no inference**. It requires the selected model's input, output and all reported additional costs to be zero in a fresh models.dev catalog. Missing/network/nonzero metadata stops the run.
5. Test inference with `powershell.exe -NoProfile -NonInteractive -File scripts/invoke-opencode.ps1 -ConfigPath config.local.json -SmokeTest`. Expect `MGB_FREE_MODEL_OK`. Inspect provider setup for paid credentials/billing; do not add credit, enable auto-recharge or accept paid service terms. Free offerings are limited-time and capacity-limited; no zero-cost future availability is promised. A zero-price catalog is a preflight guard, not a contractual billing guarantee.
6. Browser setup: use the local `node_modules\.bin\playwright-cli.cmd` with the named `mastergrowbot-growth` session. Run `--help` for current persistence flags. Open GSC and GA4 once and sign in if necessary; store session state privately using supported state-save/state-load options. Browser credentials do not automatically transfer from Codex. Existing dated local evidence permits public research/technical jobs to begin while analytics login is pending. Record each source's actual availability; never fabricate fresh data. The old Gmail authorization does not magically provide OpenCode access to Gmail.
7. Verify the old Codex automation `mastergrowbot-grow-guides-publishing-sprint` remains paused. It was already PAUSED on October17. Set `oldAutomationPausedVerified=true` only after checking. Set `connectionsVerified=true` for verified **OpenCode + Git runtime** readiness; this flag does not assert GSC/GA4/Gmail availability. Record those individually in private state. Set `enabled=true` when runtime checks pass.
8. Register with `powershell.exe -NoProfile -File scripts/register-tasks.ps1`. This is already authorized by the owner; no extra routine approval is needed. Inspect `Get-ScheduledTask -TaskName 'MasterGrowbot-OpenCode-*'` and `Get-ScheduledTaskInfo` for each task. Check the first real result JSON after its scheduled run; registration and a connectivity test do not prove a full growth cycle succeeded.

If PowerShell execution policy prevents local script execution, use the organization's approved signing/policy process; do not disable machine-wide protections. If Windows denies Task Scheduler access, record the precise permission error and complete the repo/prompt handoff.

## How autonomy works

Routine research, eligible publishing, tests, safe commits/pushes and previously authorized distribution proceed without questions. Explicitly denied tools stay denied even under `--auto`. Free browser navigation/public fetches are available; paid web search and arbitrary package installs are denied during jobs. A new login, CAPTCHA, binding terms or payment blocks that action; the job records it and advances independent work. Do not promise that authentication will never expire.

The runner launches a **private standalone server** so per-job model/permission configuration is applied rather than inherited from an already-running desktop server. Its process tree can be terminated at the deadline. It does not expose a server port externally or alter the desktop's persistent settings. The command permission patterns are workflow guardrails, not a hardened OS sandbox; run under the normal non-admin user and keep secrets out of the project.

See [strategy](docs/STRATEGY.md), [public audit](docs/AUDIT.md), and [AI-answer visibility skill](.opencode/skills/ai-answer-visibility/SKILL.md). Three evidence-qualified pages/week is a short-sprint maximum, not a quota. Do not equate more model calls with more qualified traffic.

## Results, recovery and rollback

Private artifacts live at `<stateDir>/opencode-runs/`: attempt markers, context, model-price receipt, process logs and structured result JSON. `completed` requires a valid agent result; an exit0 alone is not enough. `partial`, `blocked`, `failed`, `missing-result` and `timed-out-reconcile-required` are distinct. Read current.json plus only relevant run records. Never commit this directory.

On a timeout/crash: confirm the recorded process tree is stopped, inspect the branch/deployment and pending send/submission receipts, reconcile ambiguous external outcomes, then remove **only the identified dead owner's lock**. Do not delete ledgers or remove a daily marker merely to rerun. Resume the specific next action in the next scheduled slot/day.

Disable tasks reversibly with `Get-ScheduledTask -TaskName 'MasterGrowbot-OpenCode-*' | Disable-ScheduledTask`. Remove only these three tasks with `powershell.exe -NoProfile -File scripts/register-tasks.ps1 -Remove`. Keep the old Codex automation paused unless deliberately rolling back after disabling these tasks. No parallel old/new automation.

## Free-model fallback

No automatic paid fallback. If DeepSeek becomes unavailable or nonzero-priced, jobs stop before inference. The code also permits `opencode/glm-5.3-flash-free`, but switching is explicit and requires its own current zero-price verification. If neither is free, keep state and completed research; do not buy credits. Routine web/audit tools need no paid APIs; ordinary electricity/internet costs remain.

## Validation scope

Policy tests cover Mexico City boundaries, duration limits and rejection of missing/paid model metadata. Windows scripts are parsed before release. Installed bundled v2.0.32, the DeepSeek free-model connectivity response, and an autonomous public-file-read/private-result-write smoke test were verified on October17. Reported smoke-test model cost was zero. Task activation and first live business-run status belong in private deployment receipts; do not infer them from this README. Upstream audit provenance/license: [docs/UPSTREAM.md](docs/UPSTREAM.md).
