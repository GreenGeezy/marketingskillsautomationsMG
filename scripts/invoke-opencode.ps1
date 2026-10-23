param([Parameter(Mandatory)][string]$ConfigPath,[string]$ContextPath,[switch]$SmokeTest,[switch]$ShellSmokeTest,[string]$SelectedModel)
$ErrorActionPreference = 'Stop'
$cfg = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
if($SelectedModel){$cfg.model=$SelectedModel}
$repoRoot = Split-Path $PSScriptRoot -Parent
$env:PATH = (Join-Path $repoRoot 'node_modules\.bin') + ';' + $env:PATH
$env:OPENCODE_CONFIG_DIR = Join-Path $repoRoot '.opencode'
& node (Join-Path $PSScriptRoot 'check-model.mjs') $ConfigPath $cfg.model
if($LASTEXITCODE -ne 0){throw 'Fresh zero-cost model check failed; no inference started.'}
# Explicitly pin BOTH task and auxiliary models. No paid automatic fallback.
# V2 permission schema (engine v2.1.1+): ordered action/resource/effect rules.
# V1 fields (permission/bash/task) are ignored by V2, which silently denied the shell tool.
$permissions = @(
  @{action='*'; resource='*'; effect='deny'},
  @{action='read'; resource='*'; effect='allow'},
  @{action='glob'; resource='*'; effect='allow'},
  @{action='grep'; resource='*'; effect='allow'},
  @{action='edit'; resource='*'; effect='allow'},
  @{action='skill'; resource='*'; effect='allow'},
  @{action='webfetch'; resource='*'; effect='allow'},
  @{action='websearch'; resource='*'; effect='deny'},
  @{action='subagent'; resource='*'; effect='deny'},
  @{action='question'; resource='*'; effect='deny'},
  @{action='external_directory'; resource='*'; effect='deny'}
)
foreach($directory in @($cfg.stateDir,$repoRoot,(Join-Path $cfg.stateDir 'opencode-runs'))){
  foreach($variant in @($directory.Replace('\','/'),$directory.Replace('/','\'))){
    $permissions += @{action='external_directory'; resource=$variant; effect='allow'}
    $permissions += @{action='external_directory'; resource=($variant+'/*'); effect='allow'}
  }
}
$permissions += @(
  @{action='shell'; resource='*'; effect='deny'},
  @{action='shell'; resource='git status'; effect='allow'},
  @{action='shell'; resource='npm run build'; effect='allow'},
  @{action='shell'; resource='npm run lint'; effect='allow'},
  @{action='shell'; resource='git status *'; effect='allow'},
  @{action='shell'; resource='git diff *'; effect='allow'},
  @{action='shell'; resource='git log *'; effect='allow'},
  @{action='shell'; resource='git show *'; effect='allow'},
  @{action='shell'; resource='git fetch *'; effect='allow'},
  @{action='shell'; resource='git switch *'; effect='allow'},
  @{action='shell'; resource='git branch *'; effect='allow'},
  @{action='shell'; resource='git add *'; effect='allow'},
  @{action='shell'; resource='git commit *'; effect='allow'},
  @{action='shell'; resource='git merge --ff-only *'; effect='allow'},
  @{action='shell'; resource='git pull --ff-only *'; effect='allow'},
  @{action='shell'; resource='git push origin *'; effect='allow'},
  @{action='shell'; resource='node scripts/*'; effect='allow'},
  @{action='shell'; resource='node *check-content-quality.mjs*'; effect='allow'},
  @{action='shell'; resource='node *research-ios-competitors.mjs*'; effect='allow'},
  @{action='shell'; resource='npm run build *'; effect='allow'},
  @{action='shell'; resource='npm run lint *'; effect='allow'},
  @{action='shell'; resource='npx playwright test *'; effect='allow'},
  @{action='shell'; resource='playwright-cli *'; effect='allow'},
  @{action='shell'; resource='seomator *'; effect='allow'},
  @{action='shell'; resource='rg *'; effect='allow'},
  @{action='shell'; resource='Get-ChildItem *'; effect='allow'},
  @{action='shell'; resource='Get-Content *'; effect='allow'},
  @{action='shell'; resource='Get-Item *'; effect='allow'},
  @{action='shell'; resource='Get-Date *'; effect='allow'},
  @{action='shell'; resource='Get-Location *'; effect='allow'},
  @{action='shell'; resource='Get-Command *'; effect='allow'},
  @{action='shell'; resource='Get-Process *'; effect='allow'},
  @{action='shell'; resource='Get-ScheduledTask *'; effect='allow'},
  @{action='shell'; resource='Get-ScheduledTaskInfo *'; effect='allow'},
  @{action='shell'; resource='Select-String *'; effect='allow'},
  @{action='shell'; resource='Select-Object *'; effect='allow'},
  @{action='shell'; resource='Sort-Object *'; effect='allow'},
  @{action='shell'; resource='Where-Object *'; effect='allow'},
  @{action='shell'; resource='Format-Table *'; effect='allow'},
  @{action='shell'; resource='Format-List *'; effect='allow'},
  @{action='shell'; resource='Measure-Object *'; effect='allow'},
  @{action='shell'; resource='ConvertFrom-Json *'; effect='allow'},
  @{action='shell'; resource='ConvertTo-Json *'; effect='allow'},
  @{action='shell'; resource='Resolve-Path *'; effect='allow'},
  @{action='shell'; resource='Join-Path *'; effect='allow'},
  @{action='shell'; resource='echo *'; effect='allow'},
  @{action='shell'; resource='Write-Output *'; effect='allow'},
  @{action='shell'; resource='Test-Path *'; effect='allow'},
  @{action='shell'; resource='Copy-Item *'; effect='allow'},
  @{action='shell'; resource='git -C * status *'; effect='allow'},
  @{action='shell'; resource='git -C * diff *'; effect='allow'},
  @{action='shell'; resource='git -C * log *'; effect='allow'},
  @{action='shell'; resource='git -C * show *'; effect='allow'},
  @{action='shell'; resource='git -C * fetch *'; effect='allow'},
  @{action='shell'; resource='git -C * switch *'; effect='allow'},
  @{action='shell'; resource='git -C * branch *'; effect='allow'},
  @{action='shell'; resource='git -C * add *'; effect='allow'},
  @{action='shell'; resource='git -C * commit *'; effect='allow'},
  @{action='shell'; resource='git -C * merge --ff-only *'; effect='allow'},
  @{action='shell'; resource='git -C * pull --ff-only *'; effect='allow'},
  @{action='shell'; resource='git -C * push origin *'; effect='allow'},
  @{action='shell'; resource='node -e *'; effect='allow'},
  @{action='shell'; resource='node --test *'; effect='allow'},
  @{action='shell'; resource='npm test *'; effect='allow'},
  @{action='shell'; resource='node_modules\\.bin\\playwright-cli*'; effect='allow'},
  @{action='shell'; resource='node_modules/.bin/playwright-cli*'; effect='allow'},
  @{action='shell'; resource='git push *--force*'; effect='deny'},
  @{action='shell'; resource='git reset *'; effect='deny'},
  @{action='shell'; resource='git clean *'; effect='deny'},
  @{action='shell'; resource='git push *--delete*'; effect='deny'},
  @{action='shell'; resource='*run.mjs*'; effect='deny'},
  @{action='shell'; resource='*register-tasks*'; effect='deny'},
  @{action='shell'; resource='*npm install*'; effect='deny'},
  @{action='shell'; resource='*curl*'; effect='deny'},
  @{action='shell'; resource='*Invoke-WebRequest*'; effect='deny'}
)
$env:OPENCODE_CONFIG_CONTENT = @{
  model=$cfg.model; small_model=$cfg.model; enabled_providers=@('opencode'); share='disabled';
  compaction=@{auto=$true;keep=@{tokens=15000};buffer=20000};
  permissions=$permissions; agents=@{build=@{model=$cfg.model; permissions=$permissions}};
  instructions=@((Join-Path $repoRoot 'AGENTS.md'))
} | ConvertTo-Json -Depth 12 -Compress
. (Join-Path $PSScriptRoot 'browser-config.ps1') -ConfigPath $ConfigPath
Set-Location -LiteralPath $cfg.siteRepo
if($SmokeTest){
  & $cfg.opencodePath run --standalone --auto --model $cfg.model --agent build --format json 'This is a connectivity check only. Do not call any tools or read any files. Reply exactly MGB_FREE_MODEL_OK.'
} elseif($ShellSmokeTest){
  & $cfg.opencodePath run --standalone --auto --model $cfg.model --agent build --format json 'Use the shell tool to run exactly two separate commands: git status --short . and playwright-cli --help . Report their exit status briefly. Do not open a browser, read files, edit anything or run any other command.'
} else {
  if(-not $ContextPath){throw 'ContextPath required'}
  & $cfg.opencodePath run --standalone --auto --model $cfg.model --agent build --format json --file $ContextPath 'Execute the attached scheduled job now. Follow its result contract and deadline. Do not ask routine approval questions. Use only free configured tools and preserve release checks.'
}
exit $LASTEXITCODE
