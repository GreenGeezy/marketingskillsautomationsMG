# Run once interactively, outside an active scheduled job. The owner completes Google authentication.
$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$cfgPath=Join-Path $repoRoot 'config.local.json'
$cfg=Get-Content -LiteralPath $cfgPath -Raw | ConvertFrom-Json
if(Test-Path -LiteralPath (Join-Path $cfg.stateDir 'run-lock.json')){
  throw 'A growth job owns the shared lock. Let it finish before connecting Google; do not delete the lock.'
}
. (Join-Path $PSScriptRoot 'browser-config.ps1') -ConfigPath $cfgPath
Set-Location -LiteralPath $cfg.siteRepo
& (Join-Path $repoRoot 'node_modules\.bin\playwright-cli.cmd') open 'https://search.google.com/search-console?resource_id=sc-domain%3Amastergrowbot.com' --config $env:PLAYWRIGHT_MCP_CONFIG --persistent --profile (Join-Path $cfg.stateDir 'playwright-profile') --headed
if($LASTEXITCODE -ne 0){throw 'Could not open dedicated browser; inspect CLI output.'}
Write-Host 'Complete Google login yourself using the account with access to mastergrowbot.com. Verify the property dashboard loads. In this browser, also open analytics.google.com and verify property 530340261. Close the browser when finished so scheduled jobs can reuse its saved profile. Never paste credentials into OpenCode.'
