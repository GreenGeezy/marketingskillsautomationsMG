# MasterGrowbot public-site audit — October 17, 2026

Requested upstream: https://github.com/seo-skills/seo-audit-skill, commit `fac4b75f2059b6d74bb05a865fe1b0ca5de3ba66`. Executed npm `@seomator/seo-audit@7.0.0`, after `seomator init -y`:

```powershell
seomator audit https://www.mastergrowbot.com --crawl -m 12 --format llm --no-cwv --no-save -o mastergrowbot-audit.xml
```

Bounded crawl result: **93/A**, 12 pages, 3,552 passed checks, 464 warnings, 73 failures, 387 unmeasured checks; 114 grouped issue entries. These are tool rule counts, not 73 independently proven business problems. Browser-rendered Core Web Vitals, hydration, mobile parity and JS diagnostics were not measured in this run. Full report remains local; this public report contains reviewed findings only.

| Finding | Evidence and disposition |
|---|---|
| Homepage, successful AI-app guide, new BudLabs comparison | Direct production fetches: HTTP200, one self-canonical, one H1 and meaningful initial HTML. Preserve these releases. |
| Contact/privacy/terms initial HTML | Audit and independent fetch confirm HTTP200 app shell with no initial H1 or canonical on `/contact`, `/privacy-policy`, `/terms-of-service`. Investigate intended route/indexing policy, then render meaningful public trust pages where appropriate. Do not add homepage canonicals or sitemap entries blindly. |
| VPD inputs lack labels/main landmark | Tool identifies four inputs and absent landmark. Candidate accessibility repair; verify rendered semantics before implementing. No cultivation-content rewrite needed. |
| Four allegedly broken links on the VPD guide | Audit warning requires per-destination live verification; the report abbreviates destinations. Do not delete links from the score alone. |
| Source Android CTA contains second question mark | Production renderer normalizes the URL correctly to `id=com.mastergrowbot.app&...`; direct live HTML verified. Not a confirmed production defect. |
| Canonical `data-rh` attributes, description pixel widths | Low-priority heuristic warnings; not evidence of ranking loss. Do not churn titles/descriptions solely to improve score. |
| Missing llms.txt/Markdown/public AGENTS/MCP manifests | Not a verified Google AI requirement. Defer unless a concrete consumer/benefit exists. No public API required. |
| Claimed mobile overflow | Static heuristic only; requires actual viewport verification. Previous passed release tests are historical evidence, not a fresh mobile measurement. |

The source catalogue audit also ran once: 66 guides; three sitemap omissions and fourteen guide-source inbound-link warnings. These do not prove live orphaning: hubs/navigation/non-guide links are excluded from that warning. Keep quality exclusions; do not add instructional pages to the sitemap to meet a count. New BudLabs page is already linked from the hub.

Git reconciliation: local website checkout was clean and matched remote HEAD `135cdef5aefb3d40dc81a892f3a5bb67ab41abdf` (BudLabs comparison). This migration did not claim a new website deployment. Current analytics/indexing findings and their exact dated baselines are private. A source/rendering audit cannot establish the cause of a traffic change.

First technical actions: investigate public trust-page rendering, verify VPD accessibility, and inspect exact broken-link candidates. Urgent proven revenue-page failures outrank these; avoid broad speculative refactors.
