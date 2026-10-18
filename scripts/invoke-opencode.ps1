param([Parameter(Mandatory)][string]$ConfigPath,[string]$ContextPath,[switch]$SmokeTest,[string]$SelectedModel)
$ErrorActionPreference = 'Stop'
$cfg = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
if($SelectedModel){$cfg.model=$SelectedModel}
$repoRoot = Split-Path $PSScriptRoot -Parent
$env:PATH = (Join-Path $repoRoot 'node_modules\.bin') + ';' + $env:PATH
$env:OPENCODE_CONFIG_DIR = Join-Path $repoRoot '.opencode'
& node (Join-Path $PSScriptRoot 'check-model.mjs') $ConfigPath $cfg.model
if($LASTEXITCODE -ne 0){throw 'Fresh zero-cost model check failed; no inference started.'}
# Explicitly pin BOTH task and auxiliary models. No paid automatic fallback.
$external = [ordered]@{'*'='deny'}
foreach($directory in @($cfg.stateDir,$repoRoot,(Join-Path $cfg.stateDir 'opencode-runs'))){
  foreach($variant in @($directory.Replace('\','/'),$directory.Replace('/','\'))){
    $external[$variant]='allow'; $external[$variant+'/*']='allow'; $external[$variant+'/**']='allow'; $external[$variant+'\*']='allow'
  }
}
$permission = [ordered]@{
  '*'='deny'; read='allow'; glob='allow'; grep='allow'; list='allow'; edit='allow'; write='allow'; skill='allow'; webfetch='allow';
  websearch='deny'; task='deny'; question='deny'; external_directory=$external;
  bash=[ordered]@{
    '*'='deny'; 'git status*'='allow'; 'git diff*'='allow'; 'git log*'='allow'; 'git show*'='allow'; 'git fetch*'='allow'; 'git switch*'='allow'; 'git branch*'='allow'; 'git add*'='allow'; 'git commit*'='allow'; 'git merge --ff-only*'='allow'; 'git pull --ff-only*'='allow'; 'git push origin*'='allow';
    'node scripts/*'='allow'; 'node *research-ios-competitors.mjs*'='allow'; 'npm run build*'='allow'; 'npm run lint*'='allow'; 'npx playwright test*'='allow'; 'playwright-cli *'='allow'; 'seomator *'='allow'; 'rg *'='allow';
    'git push *--force*'='deny'; 'git reset*'='deny'; 'git clean*'='deny'; 'git push *--delete*'='deny'; '*run.mjs*'='deny'; '*register-tasks*'='deny'; '*npm install*'='deny'; '*curl*'='deny'; '*Invoke-WebRequest*'='deny'
  }
}
$env:OPENCODE_CONFIG_CONTENT = @{
  model=$cfg.model; small_model=$cfg.model; enabled_providers=@('opencode'); share='disabled'; autoupdate=$false;
  compaction=@{auto=$true;keep=@{tokens=15000};buffer=20000};
  permission=$permission; agent=@{build=@{model=$cfg.model;permission=$permission}};
  instructions=@((Join-Path $repoRoot 'AGENTS.md'))
} | ConvertTo-Json -Depth 12 -Compress
. (Join-Path $PSScriptRoot 'browser-config.ps1') -ConfigPath $ConfigPath
Set-Location -LiteralPath $cfg.siteRepo
if($SmokeTest){
  & $cfg.opencodePath run --standalone --auto --model $cfg.model --agent build --format json 'This is a connectivity check only. Do not call any tools or read any files. Reply exactly MGB_FREE_MODEL_OK.'
} else {
  if(-not $ContextPath){throw 'ContextPath required'}
  & $cfg.opencodePath run --standalone --auto --model $cfg.model --agent build --format json --file $ContextPath 'Execute the attached scheduled job now. Follow its result contract and deadline. Do not ask routine approval questions. Use only free configured tools and preserve release checks.'
}
exit $LASTEXITCODE
