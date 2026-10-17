param([string]$ConfigPath=(Join-Path (Split-Path $PSScriptRoot -Parent) 'config.local.json'))
$ErrorActionPreference='Stop'
$cfg=Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$root=Split-Path $PSScriptRoot -Parent
$testId='setup-smoke-'+[guid]::NewGuid().ToString()
$folder=Join-Path $cfg.stateDir 'opencode-runs'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$result=Join-Path $folder ($testId+'.result.json')
$context=Join-Path $folder ($testId+'.context.md')
$body=@"
This is a setup tool smoke test, not a growth job. The migration owner holds the growth lock; do not change it or current.json. Do not inspect analytics or send/publish anything.
Read exactly $root/package.json and report the package name. Then use the edit/write tool to create $result containing JSON with runId '$testId', job 'smoke', status 'completed', actions ['read-package','write-result'], blockers [], packageName matching the actual read file.
Do not run shell commands, research, load more skills or edit any other file. Finish immediately after writing this JSON.
"@
Set-Content -LiteralPath $context -Value $body -Encoding UTF8
& (Join-Path $PSScriptRoot 'invoke-opencode.ps1') -ConfigPath $ConfigPath -ContextPath $context
if($LASTEXITCODE -ne 0){throw 'OpenCode smoke failed'}
$r=Get-Content -LiteralPath $result -Raw | ConvertFrom-Json
if($r.runId -ne $testId -or $r.status -ne 'completed' -or $r.packageName -ne 'mastergrowbot-organic-acquisition'){throw 'Smoke result contract failed'}
Write-Output 'MGB_TOOLS_SMOKE_OK'
