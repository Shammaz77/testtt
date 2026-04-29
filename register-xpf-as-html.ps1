$ErrorActionPreference = "Stop"

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)

$browserPath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browserPath) {
  throw "Chrome or Edge was not found in the standard install locations."
}

$extensionKey = "HKCU:\Software\Classes\.xpf"
$fileTypeKey = "HKCU:\Software\Classes\SheetXPFHtmlFile"
$commandKey = "$fileTypeKey\shell\open\command"

New-Item -Path $extensionKey -Force | Out-Null
Set-Item -Path $extensionKey -Value "SheetXPFHtmlFile"
New-ItemProperty -Path $extensionKey -Name "Content Type" -Value "text/html" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $extensionKey -Name "PerceivedType" -Value "text" -PropertyType String -Force | Out-Null

New-Item -Path $fileTypeKey -Force | Out-Null
Set-Item -Path $fileTypeKey -Value "Sheet XPF HTML Document"
New-Item -Path $commandKey -Force | Out-Null
Set-Item -Path $commandKey -Value "`"$browserPath`" `"%1`""

Write-Host "Registered .xpf as a browser HTML document type for the current user."
