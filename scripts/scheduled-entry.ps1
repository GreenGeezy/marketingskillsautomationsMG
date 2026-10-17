param([Parameter(Mandatory)][ValidateSet('measurement','content','distribution')][string]$Job,[Parameter(Mandatory)][string]$NodePath)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $root
& $NodePath (Join-Path $PSScriptRoot 'run.mjs') $Job
exit $LASTEXITCODE
