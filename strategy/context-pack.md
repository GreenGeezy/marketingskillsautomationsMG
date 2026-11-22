# MasterGrowbot context pack (as of Nov 22, 2026)

Attach this repo to every Antigravity conversation about growth or revenue; start with this file.

## Founder and constraints
- Solo founder (Eli), travels often, old laptop, hectic schedule. No sales calls, no meetings.
- About 5 hours a week for marketing. Very little cash for ads or partners.
- Tools paid for: Google AI Pro (Gemini 4 Neon, Antigravity, Flow/Veo video), 2× Claude Pro, Muse (manages 3 Instagram accounts), Codex (free until about Dec 22).

## Who does what
| Tool | Job |
|---|---|
| Claude Pro (both plans, Opus) | **Everything users see:** the three apps, mastergrowbot.com, design, and the Cannabis AI Lab YouTube videos. Not automations. |
| Google AI Pro (Gemini 4 Neon in Antigravity + Chrome) | **Automations and growth operations.** Takes over the newsletter and LinkedIn jobs from Codex, and runs analytics, SEO decisions and any other recurring growth work. Usage is generous, so it should also take on one more high-value recurring job. |
| Codex (free until about Dec 22) | Keeps running the newsletter (Tuesdays) and LinkedIn (Thursdays) jobs until Antigravity takes them over |
| Muse | Instagram posting and replies (3 accounts) |
| OpenCode free models (this repo's cron) | Daily SEO content, distribution and measurement jobs |

## YouTube: Cannabis AI Lab (made with Claude Pro)
- Channel ID UCdu8adY6F6TmpBgUKmN3xHg, "made by the team behind MasterGrowbot AI". Format: "You vs. AI" tests with real plant photos, motion graphics, an AI narrator, no founder on camera. New episode on Thursdays.
- Episode 1 is live (youtu.be/INIJjZNU1r0); there are also live Shorts. Episodes 2 to 4 are in production. The Nov 22 research on the next 3 videos found that story-with-stakes formats win.
- Local project folder (not a GitHub repo): `C:\Users\elidu\.claudecodevids`. Key files: `Cannabis-AI-Lab-HANDOFF.md`, `growth/Next-3-Videos.md`, `growth/PLAYBOOK.md`, `video-*/YouTube-Upload-Copy.md`.
- Already made: 28 to 25 second LinkedIn cut-downs of episode 1 (MasterGrowbotMarketing/linkedin-authority/cannabis-ai-lab-launch).
- Implication: the channel already produces real, on-brand video. Reusing it as Shorts, Reels (through Muse) and LinkedIn clips is cheaper than starting a separate AI-host account.

## Repos
- This repo (marketing automations): https://github.com/GreenGeezy/marketingskillsautomationsMG
- Website: https://github.com/GreenGeezy/mastergrowbot
- MasterGrowbot AI app: https://github.com/GreenGeezy/Vone-MasterGrowbot-AI
- InfuseKit and Don't Go Missing: Eli's own repos (attach when relevant)

## Amazon KDP
Eli already sells *The Master Cannabis IPM Playbook* on Amazon (https://a.co/d/07dQFaw0). More KDP books written with Gemini are an option; judge them by expected revenue per hour like any other action.

## Products (no new products; these three apps only)
1. **MasterGrowbot AI**: iOS and Android cannabis grow assistant. AI plant photo diagnosis, grow journal. Plans: weekly $7.99, monthly $29.99, annual $199.99 (Pro), plus Premium. A new iOS update is in App Store review. Website: https://www.mastergrowbot.com
2. **InfuseKit Edibles Made Easy**: cannabis edibles app, waiting for Apple approval. It goes on mastergrowbot.com when approved.
3. **Don't Go Missing**: not cannabis related, about to be submitted. Being non-cannabis, it can use normal ads and reach.

## Current numbers
- RevenueCat (all projects): $254 MRR; $430 revenue in the last 28 days; 19 active subscriptions, mostly Weekly Pro; 3 active trials; 109 new customers in 28 days.
- Supabase: 3,299 app users, about 100 new per month, almost all anonymous (only 4 have emails). There is no user email list.
- Google Search Console, 28 days ending about Nov 15: 56 clicks against 244 the previous period (−77%). Impressions 3,282 against 6,740 (−51%). Average position 24.6 against 8.8. Biggest losses: homepage and three app-comparison guides. High-impression queries with no clicks: "vpd calculator", "vpd chart", "cannabis cultivation software".
- GrowTech shop (AG1000 light $199, lens kit, Playbook): **$0 revenue so far.**
- Newsletter (Cannabis AI News & Tools): 4 subscribers. Goal: 10 by Dec 7.

## What is already running
| System | What it does | Status |
|---|---|---|
| OpenCode SEO/AEO cron (repo marketingskillsautomationsMG, free models) | Daily jobs: **content** (writes or refreshes grow guides on mastergrowbot.com), **distribution**, **measurement** (reads Search Console Tue/Fri) | Runs daily. Several recent runs failed (Nov 17 timeout, Nov 19 quota exhausted, Nov 20 setup failed); Nov 21 and 22 completed. Traffic fell while it ran. Whether it caused the drop is **unknown**. |
| Codex: newsletter (Tuesdays 10:00 Mexico City) | Researches and builds the weekly email; sends Eli a preview; schedules delivery 48 hours later. Instructions: this repo's newsletter skill plus MasterGrowbotMarketing/linkedin-authority/launches/newsletter-runbook.md and newsletter-scorecard.md | Active; moves to Antigravity by about Dec 22 |
| Codex: LinkedIn (Thursdays 10:00) | Organic posts for Eli, Master Grow Bud AI and the newsletter Page, via Buffer. Thursday afternoons are reserved for YouTube episode launches. | Active; moves to Antigravity by about Dec 22. LinkedIn message limits are already used for app promotion. |
| Muse | Runs 3 Instagram accounts; performs better than Codex did | Active. Cannabis accounts have reach restrictions. |

## Website (mastergrowbot.com)
Homepage sells the app; one newsletter signup band at the bottom. Also: grow guides, free tools (VPD calculator, light calculator, symptom checker, Grow Week calendar), GrowTech shop, newsletter page.

## Already tried and failed (don't repeat)
- A $900 AI strategy/setup offer with an agent build at /ai-strategy: abandoned checkouts, 0 purchases.
- Cold email to partners: low opens, and there's nothing to offer them.

## Advice received so far (may conflict)
- **Fable 5.2:** don't touch the shop (it has $0 revenue); focus on SEO.
- **Claude (Opus):** the main bottleneck is traffic (about 100 new users a month). Short-form video is the best free traffic channel: first reuse Cannabis AI Lab clips across Instagram (Muse), Shorts and LinkedIn. A separate, **openly labeled** AI host account ("Sage", strategy/ai-ugc-playbook.md) is optional. Claude rejected an AI person presented as real, because a fake endorser can get the Instagram account cluster banned.
- Both agree: keep the newsletter and LinkedIn jobs running (Codex now, Antigravity later).

## Where things live in this repo
- strategy/context-pack.md: this file
- strategy/ai-ugc-playbook.md: AI host video plan, scripts and Flow prompt
- strategy/antigravity-prompt.md: the growth-lead prompt
- jobs/content.md, jobs/distribution.md, jobs/measurement.md: what the daily SEO cron does
- docs/STRATEGY.md, docs/SEO-GUARDRAILS.md: SEO rules
- output/scheduler/*.log: cron run results (local machine only)
- Search Console reports from the cron: `C:\Users\elidu\OneDrive\Documents\MasterGrowbot Landing Page SEO + Web Design\organic-growth-state\` (files named *-measurement-report.md; read the 2026-11-13, 11-17 and 11-22 ones)
