param([Parameter(Mandatory)][ValidateSet('measurement','content','distribution')][string]$Job,[Parameter(Mandatory)][string]$NodePath)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $root

# Keep a per-day transcript. A failure before run.mjs writes its receipt
# (config, model catalog, lock path) otherwise leaves only a Task Scheduler
# exit code and no diagnostic artifact. output/ is gitignored.
$logDir=Join-Path $root 'output\scheduler'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log=Join-Path $logDir ("{0}-{1}.log" -f (Get-Date -Format 'yyyy-MM-dd'),$Job)
"[{0}] start job={1} node={2}" -f (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK'),$Job,$NodePath | Out-File -FilePath $log -Append -Encoding utf8

$out=@()
try {
  $out = & $NodePath (Join-Path $PSScriptRoot 'run.mjs') $Job *>&1
  $code = $LASTEXITCODE
} catch {
  $out = @("scheduler-entry error: $($_.Exception.Message)")
  $code = 1
}

$out | Out-File -FilePath $log -Append -Encoding utf8
$out | Write-Output
"[{0}] end job={1} exit={2}" -f (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK'),$Job,$code | Out-File -FilePath $log -Append -Encoding utf8
exit $code
