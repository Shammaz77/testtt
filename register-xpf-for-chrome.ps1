$ErrorActionPreference = "Stop"

$extensionKey = "HKCU:\Software\Classes\.xpf"
$fileTypeKey = "HKCU:\Software\Classes\SheetXPFFile"
$commandKey = "$fileTypeKey\shell\open\command"
$openerScript = Join-Path $PSScriptRoot "open-xpf.ps1"

if (-not (Test-Path $openerScript)) {
  throw "The XPF opener script was not found: $openerScript"
}

New-Item -Path $extensionKey -Force | Out-Null
Set-Item -Path $extensionKey -Value "SheetXPFFile"
New-ItemProperty -Path $extensionKey -Name "Content Type" -Value "application/xpf" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $extensionKey -Name "PerceivedType" -Value "text" -PropertyType String -Force | Out-Null

New-Item -Path $fileTypeKey -Force | Out-Null
Set-Item -Path $fileTypeKey -Value "Sheet XPF Document"

New-Item -Path $commandKey -Force | Out-Null
Set-Item -Path $commandKey -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$openerScript`" `"%1`""

Write-Host "Registered .xpf files to open through the Sheet XPF local browser viewer."
