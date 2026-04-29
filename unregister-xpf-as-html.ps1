$ErrorActionPreference = "Stop"

Remove-Item -Path "HKCU:\Software\Classes\.xpf" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKCU:\Software\Classes\SheetXPFHtmlFile" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Removed the .xpf browser HTML document association for the current user."
