# ============================================
# Code Index Manager v1.2
# ============================================
# Purpose: Manage files with 500 +-200 lines
# Run: .\scripts\code-index-manager.ps1
# ============================================

param(
    [switch]$Generate,    # Generate index
    [switch]$Analyze,     # Analyze only
    [switch]$Optimize     # Optimization suggestions
)

# Fix console encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

$srcPath = "C:\05_SDD_FMEA\fmea-smart-system\src"
$docsPath = "C:\05_SDD_FMEA\fmea-smart-system\docs"

# Line count criteria (500 +-200, flexible)
$MIN_LINES = 50      # Below = merge required
$SMALL_LINES = 150   # Below = merge review
$OPTIMAL_MIN = 150   # Optimal min
$OPTIMAL_MAX = 500   # Optimal max
$ALLOW_LINES = 700   # Allowed if cohesive
$WARN_LINES = 900    # Split review
$MAX_LINES = 900     # Max allowed

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Code Index Manager v1.1" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# File analysis
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.tsx","*.ts" | Where-Object { $_.Name -notmatch "\.d\.ts$" }

$stats = @{
    TooSmall = @()      # 50 lines or less (merge required)
    Small = @()         # 50-150 lines (merge review)
    Optimal = @()       # 150-500 lines (optimal)
    Allowed = @()       # 500-700 lines (allowed if cohesive)
    NeedSplit = @()     # 700-900 lines (split review)
    Critical = @()      # 900+ lines (split now)
}

$totalLines = 0
$totalFiles = 0

foreach ($file in $files) {
    $lines = (Get-Content $file.FullName).Count
    $relativePath = $file.FullName.Replace($srcPath, "src")
    $totalLines += $lines
    $totalFiles++
    
    $fileInfo = @{
        Path = $relativePath
        Lines = $lines
        Name = $file.Name
    }
    
    if ($lines -le $MIN_LINES) {
        $stats.TooSmall += $fileInfo
    }
    elseif ($lines -le $OPTIMAL_MAX) {
        $stats.Optimal += $fileInfo
    }
    elseif ($lines -le $WARN_LINES) {
        $stats.Warning += $fileInfo
    }
    elseif ($lines -le $MAX_LINES) {
        $stats.NeedSplit += $fileInfo
    }
    else {
        $stats.Critical += $fileInfo
    }
}

# Output results
Write-Host "[File Statistics]" -ForegroundColor Yellow
Write-Host "  Total Files: $totalFiles"
Write-Host "  Total Lines: $totalLines"
Write-Host "  Average: $([math]::Round($totalLines / $totalFiles)) lines"
Write-Host ""

# Category output
Write-Host "[Category Classification]" -ForegroundColor Yellow

if ($stats.Critical.Count -gt 0) {
    Write-Host ""
    Write-Host "[X] SPLIT NOW (600+ lines):" -ForegroundColor Red
    foreach ($f in $stats.Critical) {
        Write-Host "   $($f.Path) : $($f.Lines) lines" -ForegroundColor Red
    }
}

if ($stats.NeedSplit.Count -gt 0) {
    Write-Host ""
    Write-Host "[!] SPLIT REVIEW (500-600 lines):" -ForegroundColor Yellow
    foreach ($f in $stats.NeedSplit) {
        Write-Host "   $($f.Path) : $($f.Lines) lines" -ForegroundColor Yellow
    }
}

if ($stats.Warning.Count -gt 0) {
    Write-Host ""
    Write-Host "[*] WARNING (400-500 lines):" -ForegroundColor DarkYellow
    foreach ($f in $stats.Warning) {
        Write-Host "   $($f.Path) : $($f.Lines) lines"
    }
}

Write-Host ""
Write-Host "[OK] OPTIMAL (100-400 lines): $($stats.Optimal.Count) files" -ForegroundColor Green

if ($stats.TooSmall.Count -gt 0) {
    Write-Host ""
    Write-Host "[?] MERGE REVIEW (50 lines or less):" -ForegroundColor Cyan
    foreach ($f in $stats.TooSmall) {
        Write-Host "   $($f.Path) : $($f.Lines) lines"
    }
}

# Optimization suggestions
if ($Optimize) {
    Write-Host ""
    Write-Host "[Optimization Suggestions]" -ForegroundColor Magenta
    
    # Merge suggestions
    if ($stats.TooSmall.Count -ge 2) {
        Write-Host ""
        Write-Host "[MERGE] Mergeable file groups:" -ForegroundColor Cyan
        $groups = $stats.TooSmall | Group-Object { Split-Path (Split-Path $_.Path) -Leaf }
        foreach ($group in $groups) {
            if ($group.Count -ge 2) {
                $totalGroupLines = ($group.Group | Measure-Object -Property Lines -Sum).Sum
                Write-Host "   Folder: $($group.Name) ($($group.Count) files, total $totalGroupLines lines)"
                foreach ($f in $group.Group) {
                    Write-Host "      - $($f.Name): $($f.Lines) lines"
                }
            }
        }
    }
    
    # Split suggestions
    if ($stats.NeedSplit.Count -gt 0 -or $stats.Critical.Count -gt 0) {
        Write-Host ""
        Write-Host "[SPLIT] Files need splitting:" -ForegroundColor Yellow
        foreach ($f in ($stats.NeedSplit + $stats.Critical)) {
            Write-Host "   $($f.Path) -> Split into 2-3 files"
        }
    }
}

# Generate index document
if ($Generate) {
    Write-Host ""
    Write-Host "[Generating index document...]" -ForegroundColor Cyan
    
    $indexContent = @"
# Code Index (Auto Generated)

> Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm")
> Total Files: $totalFiles
> Total Lines: $totalLines

## Summary

| Category | Count | Description |
|----------|-------|-------------|
| OK Optimal | $($stats.Optimal.Count) | 100-400 lines |
| Warning | $($stats.Warning.Count) | 400-500 lines |
| Split Review | $($stats.NeedSplit.Count) | 500-600 lines |
| Split Now | $($stats.Critical.Count) | 600+ lines |
| Merge Review | $($stats.TooSmall.Count) | 50 lines or less |

## All Files

| File | Lines | Status |
|------|-------|--------|
"@

    # Add file list (sorted by lines desc)
    $allFiles = $stats.Optimal + $stats.Warning + $stats.NeedSplit + $stats.Critical + $stats.TooSmall
    $allFiles = $allFiles | Sort-Object -Property Lines -Descending
    
    foreach ($f in $allFiles) {
        $status = if ($f.Lines -gt 600) { "X SPLIT" }
                  elseif ($f.Lines -gt 500) { "! REVIEW" }
                  elseif ($f.Lines -gt 400) { "* WARN" }
                  elseif ($f.Lines -lt 50) { "? MERGE" }
                  else { "OK" }
        $indexContent += "| ``$($f.Path)`` | $($f.Lines) | $status |`n"
    }

    $indexContent += @"

---

## Line Count Criteria

| Range | Status | Action |
|-------|--------|--------|
| 0-50 | Merge Review | Consider merging with related files |
| 50-100 | Small | Merge if needed |
| 100-400 | Optimal | Keep as is |
| 400-500 | Warning | Monitor |
| 500-600 | Split Review | Plan splitting |
| 600+ | Split Now | Split immediately |

---

*Auto generated: code-index-manager.ps1*
"@

    $indexPath = Join-Path $docsPath "CODE_INDEX_AUTO.md"
    $indexContent | Out-File -FilePath $indexPath -Encoding UTF8
    Write-Host "[OK] Index generated: $indexPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
