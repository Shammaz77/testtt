$ErrorActionPreference = "Stop"

Remove-Item -Path "HKCU:\Software\Classes\.xpf" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKCU:\Software\Classes\SheetXPFFile" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Removed the Sheet XPF file association from the current Windows user."
