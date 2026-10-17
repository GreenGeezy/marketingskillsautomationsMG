param([Parameter(Mandatory)][string]$ConfigPath)
$ErrorActionPreference='Stop'
$browserCfg=Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$profilePath=Join-Path $browserCfg.stateDir 'playwright-profile'
$browserConfigPath=Join-Path $browserCfg.stateDir 'playwright-browser.json'
New-Item -ItemType Directory -Path $profilePath -Force | Out-Null
$browserSettings=@{browser=@{browserName='chromium';userDataDir=$profilePath;launchOptions=@{channel='chrome';headless=$false}}} | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText($browserConfigPath,$browserSettings,(New-Object Text.UTF8Encoding($false)))
$env:PLAYWRIGHT_MCP_CONFIG=$browserConfigPath
$env:PLAYWRIGHT_CLI_SESSION='mastergrowbot-growth'
