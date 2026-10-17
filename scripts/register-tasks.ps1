param([switch]$Remove)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$names=@('measurement','content','distribution')
if($Remove){foreach($job in $names){Unregister-ScheduledTask -TaskName "MasterGrowbot-OpenCode-$job" -Confirm:$false -ErrorAction SilentlyContinue};exit}
$cfg=Get-Content (Join-Path $root 'config.local.json') -Raw | ConvertFrom-Json
if(-not ($cfg.enabled -and $cfg.connectionsVerified -and $cfg.oldAutomationPausedVerified)){throw 'Complete setup and smoke run before activating tasks.'}
$node=(Get-Command node.exe -ErrorAction Stop).Source
& $node (Join-Path $PSScriptRoot 'run.mjs') measurement --preflight
if($LASTEXITCODE -ne 0){throw 'Preflight failed; no tasks registered.'}
$principal=New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 55)
$hours=@(9,10,11)
for($i=0;$i -lt $names.Count;$i++){
  $job=$names[$i]
  $taskArgs='-NoProfile -NonInteractive -WindowStyle Hidden -File "'+(Join-Path $PSScriptRoot 'scheduled-entry.ps1')+'" -Job '+$job+' -NodePath "'+$node+'"'
  $action=New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -Argument $taskArgs -WorkingDirectory $root
  $trigger=New-ScheduledTaskTrigger -Daily -At ('{0}:45' -f $hours[$i])
  # Explicit UTC offset preserves Mexico City wall time independently of the laptop's timezone.
  $trigger.StartBoundary=('2026-10-17T{0:00}:45:00-06:00' -f $hours[$i])
  Register-ScheduledTask -TaskName "MasterGrowbot-OpenCode-$job" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Free-model gated MasterGrowbot acquisition, Mexico City 09:45–12:45; no routine approval prompts.' -Force | Out-Null
}
Get-ScheduledTask -TaskName 'MasterGrowbot-OpenCode-*' | Select-Object TaskName,State
