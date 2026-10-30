param([Parameter(Mandatory)][ValidateSet('measurement','content','distribution')][string]$Job,[Parameter(Mandatory)][string]$NodePath)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $root
$logDir=Join-Path $root 'output\scheduler'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$day=[TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow,'Central Standard Time (Mexico)').ToString('yyyy-MM-dd')
$log=Join-Path $logDir ($day+'-'+$Job+'.log')
"[$([DateTime]::UtcNow.ToString('o'))] start job=$Job" | Out-File $log -Append -Encoding utf8
$code=1
try {
 $info=New-Object System.Diagnostics.ProcessStartInfo
 $info.FileName=$NodePath
 $info.Arguments='"'+(Join-Path $PSScriptRoot 'run.mjs')+'" '+$Job
 $info.WorkingDirectory=$root
 $info.UseShellExecute=$false
 $info.CreateNoWindow=$true
 $info.RedirectStandardOutput=$true
 $info.RedirectStandardError=$true
 $process=New-Object System.Diagnostics.Process
 $process.StartInfo=$info
 [void]$process.Start()
 $stdout=$process.StandardOutput.ReadToEndAsync()
 $stderr=$process.StandardError.ReadToEndAsync()
 $process.WaitForExit()
 $stdout.Result | Out-File $log -Append -Encoding utf8
 $stderr.Result | Out-File $log -Append -Encoding utf8
 $code=$process.ExitCode
} catch { $_.Exception.Message | Out-File $log -Append -Encoding utf8 }
"[$([DateTime]::UtcNow.ToString('o'))] end job=$Job exit=$code" | Out-File $log -Append -Encoding utf8
exit $code
