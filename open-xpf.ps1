param(
  [Parameter(Mandatory = $true)]
  [string]$Path
)

$ErrorActionPreference = "Stop"

$viewer = Join-Path $PSScriptRoot "xpf-local-viewer.mjs"

if (-not (Test-Path $viewer)) {
  throw "The XPF local viewer was not found: $viewer"
}

Start-Process `
  -FilePath "node" `
  -ArgumentList @($viewer, $Path) `
  -WindowStyle Hidden
