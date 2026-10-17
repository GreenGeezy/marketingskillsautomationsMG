$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$cfg=Get-Content -LiteralPath (Join-Path $repoRoot 'config.local.json') -Raw | ConvertFrom-Json
Get-ScheduledTask -TaskName 'MasterGrowbot-OpenCode-*' | ForEach-Object {
  $info=$_ | Get-ScheduledTaskInfo
  [pscustomobject]@{Task=$_.TaskName;State=$_.State;LastRun=$info.LastRunTime;NextRun=$info.NextRunTime;SchedulerResult=$info.LastTaskResult}
} | Format-Table -AutoSize
$lockPath=Join-Path $cfg.stateDir 'run-lock.json'
if(Test-Path -LiteralPath $lockPath){
  $lock=Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
  Write-Host "Shared lock: $($lock.owner) since $($lock.startedAt). Reconcile before any manual retry."
}
Get-ChildItem -LiteralPath (Join-Path $cfg.stateDir 'opencode-runs') -Filter '*.json' |
  Where-Object {$_.Name -notlike '*.result.json' -and $_.Name -notmatch '^\d{4}-\d{2}-\d{2}-(measurement|content|distribution)\.json$'} | Sort-Object LastWriteTime -Descending | Select-Object -First 6 |
  ForEach-Object {
    $receipt=Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
    $blockers=@()
    if($receipt.resultFile -and (Test-Path -LiteralPath $receipt.resultFile)){
      $result=Get-Content -LiteralPath $receipt.resultFile -Raw | ConvertFrom-Json
      $blockers=@($result.blockers | ForEach-Object {if($_ -is [string]){$_}else{$_.id}})
      if($result.accessBlocker){$blockers+= $result.accessBlocker.id}
    }
    [pscustomobject]@{Run=$receipt.runId;Status=$receipt.status;Blockers=($blockers -join ', ');Error=$receipt.error}
  } | Format-Table -Wrap
