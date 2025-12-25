# ============================================
# Full Set Backup Script v1.0
# ============================================
# 5-Item Backup Set:
#   1. HTML screens (including modals)
#   2. Snapshots (PNG)
#   3. Documentation updates
#   4. Final modified code
#   5. Detailed commit content
# ============================================

param(
    [string]$Message = "Backup",    # Commit message
    [switch]$Force                   # Force backup
)

# Fix console encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# Paths
$projectPath = "C:\05_SDD_FMEA\fmea-smart-system"
$backupRoot = "C:\05_SDD_FMEA_BACKUP"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$backupName = "$timestamp"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Full Set Backup v1.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Timestamp: $timestamp" -ForegroundColor Yellow
Write-Host "Message: $Message" -ForegroundColor Yellow
Write-Host ""

# Create backup folders
$folders = @(
    "$backupRoot\snapshots\$backupName",
    "$backupRoot\html-screens\$backupName",
    "$backupRoot\docs\$backupName",
    "$backupRoot\code\$backupName",
    "$backupRoot\commits"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

# ============================================
# 1. HTML Screens (including modals)
# ============================================
Write-Host "[1/5] Backing up HTML screens..." -ForegroundColor Cyan

$htmlSource = "$projectPath\src"
$htmlDest = "$backupRoot\html-screens\$backupName"

# Copy all TSX files (React components = screens)
Get-ChildItem -Path $htmlSource -Recurse -Include "*.tsx" | ForEach-Object {
    $relativePath = $_.FullName.Replace($htmlSource, "")
    $destPath = Join-Path $htmlDest $relativePath
    $destDir = Split-Path $destPath -Parent
    
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    Copy-Item $_.FullName -Destination $destPath -Force
}

$htmlCount = (Get-ChildItem -Path $htmlDest -Recurse -File).Count
Write-Host "   [OK] $htmlCount files copied" -ForegroundColor Green

# ============================================
# 2. Snapshots (PNG)
# ============================================
Write-Host "[2/5] Backing up snapshots..." -ForegroundColor Cyan

$snapshotSource = "$projectPath\tests\snapshots"
$snapshotDest = "$backupRoot\snapshots\$backupName"

if (Test-Path $snapshotSource) {
    Copy-Item -Path "$snapshotSource\*" -Destination $snapshotDest -Recurse -Force
    $snapCount = (Get-ChildItem -Path $snapshotDest -Recurse -File -Include "*.png").Count
    Write-Host "   [OK] $snapCount snapshots copied" -ForegroundColor Green
} else {
    # Create snapshot folder in project
    New-Item -ItemType Directory -Force -Path $snapshotSource | Out-Null
    Write-Host "   [!] No snapshots found. Folder created: tests/snapshots/" -ForegroundColor Yellow
}

# ============================================
# 3. Documentation Updates
# ============================================
Write-Host "[3/5] Backing up documentation..." -ForegroundColor Cyan

$docsSource = "$projectPath\docs"
$docsDest = "$backupRoot\docs\$backupName"

if (Test-Path $docsSource) {
    Copy-Item -Path "$docsSource\*" -Destination $docsDest -Recurse -Force
    $docsCount = (Get-ChildItem -Path $docsDest -Recurse -File).Count
    Write-Host "   [OK] $docsCount documents copied" -ForegroundColor Green
} else {
    Write-Host "   [!] No docs folder found" -ForegroundColor Yellow
}

# ============================================
# 4. Final Modified Code
# ============================================
Write-Host "[4/5] Backing up code..." -ForegroundColor Cyan

$codeDest = "$backupRoot\code\$backupName"

# Copy src folder
Copy-Item -Path "$projectPath\src" -Destination "$codeDest\src" -Recurse -Force

# Copy config files
$configFiles = @(
    "package.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "next.config.ts"
)

foreach ($config in $configFiles) {
    $configPath = Join-Path $projectPath $config
    if (Test-Path $configPath) {
        Copy-Item -Path $configPath -Destination $codeDest -Force
    }
}

$codeCount = (Get-ChildItem -Path $codeDest -Recurse -File).Count
Write-Host "   [OK] $codeCount files copied" -ForegroundColor Green

# ============================================
# 5. Detailed Commit Content
# ============================================
Write-Host "[5/5] Creating commit log..." -ForegroundColor Cyan

$commitLogPath = "$backupRoot\commits\$backupName.md"

# Generate file list
$allFiles = Get-ChildItem -Path "$projectPath\src" -Recurse -Include "*.tsx","*.ts" | 
    Where-Object { $_.Name -notmatch "\.d\.ts$" }

$fileStats = $allFiles | ForEach-Object {
    $lines = (Get-Content $_.FullName).Count
    [PSCustomObject]@{
        Path = $_.FullName.Replace($projectPath, "")
        Lines = $lines
        Modified = $_.LastWriteTime
    }
} | Sort-Object -Property Modified -Descending

$commitContent = @"
# Backup Commit Log

## Info

| Item | Value |
|------|-------|
| **Timestamp** | $timestamp |
| **Message** | $Message |
| **Date** | $(Get-Date -Format "yyyy-MM-dd HH:mm:ss") |
| **Total Files** | $($fileStats.Count) |

## Changed Files (Recent First)

| File | Lines | Last Modified |
|------|-------|---------------|
"@

foreach ($file in $fileStats | Select-Object -First 20) {
    $commitContent += "| ``$($file.Path)`` | $($file.Lines) | $($file.Modified.ToString('yyyy-MM-dd HH:mm')) |`n"
}

$commitContent += @"

## Backup Locations

| Item | Path |
|------|------|
| HTML Screens | ``$backupRoot\html-screens\$backupName`` |
| Snapshots | ``$backupRoot\snapshots\$backupName`` |
| Documents | ``$backupRoot\docs\$backupName`` |
| Code | ``$backupRoot\code\$backupName`` |
| This Log | ``$commitLogPath`` |

---

*Generated by backup-full-set.ps1*
"@

$commitContent | Out-File -FilePath $commitLogPath -Encoding UTF8
Write-Host "   [OK] Commit log created: $commitLogPath" -ForegroundColor Green

# ============================================
# Summary
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BACKUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup Location: $backupRoot" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] HTML Screens: html-screens\$backupName\" -ForegroundColor White
Write-Host "[2] Snapshots:    snapshots\$backupName\" -ForegroundColor White
Write-Host "[3] Documents:    docs\$backupName\" -ForegroundColor White
Write-Host "[4] Code:         code\$backupName\" -ForegroundColor White
Write-Host "[5] Commit Log:   commits\$backupName.md" -ForegroundColor White
Write-Host ""

# Update latest backup info
$latestInfo = @"
LATEST BACKUP
=============
Timestamp: $timestamp
Message: $Message
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Location: $backupRoot
"@

$latestInfo | Out-File -FilePath "$backupRoot\LATEST.txt" -Encoding UTF8
Write-Host "[OK] Latest backup info: $backupRoot\LATEST.txt" -ForegroundColor Green

