# 폰트 완전 수정 스크립트
$files = @(
    "src\app\pfmea\worksheet\tabs\function\FunctionL2Tab.tsx",
    "src\app\pfmea\worksheet\tabs\function\FunctionL3Tab.tsx",
    "src\app\pfmea\worksheet\tabs\failure\FailureL1Tab.tsx",
    "src\app\pfmea\worksheet\tabs\failure\FailureL2Tab.tsx",
    "src\app\pfmea\worksheet\tabs\failure\FailureL3Tab.tsx",
    "src\app\pfmea\worksheet\tabs\failure\FailureLinkTab.tsx",
    "src\app\pfmea\worksheet\tabs\StructureTab.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # fontSize 변경 (정확한 매칭)
        $content = $content -replace "fontSize:\s*'13px'", "fontSize: FONT_SIZES.pageHeader"
        $content = $content -replace "fontSize:\s*'12px'", "fontSize: FONT_SIZES.header1"
        $content = $content -replace "fontSize:\s*'11px'", "fontSize: FONT_SIZES.header1"
        $content = $content -replace "fontSize:\s*'10px'", "fontSize: FONT_SIZES.cell"
        $content = $content -replace "fontSize:\s*'9px'", "fontSize: FONT_SIZES.small"
        $content = $content -replace "fontSize:\s*'8px'", "fontSize: FONT_SIZES.small"
        $content = $content -replace "fontSize:\s*'7px'", "fontSize: FONT_SIZES.small"
        
        # fontWeight 변경
        $content = $content -replace "fontWeight:\s*900", "fontWeight: FONT_WEIGHTS.semibold"
        $content = $content -replace "fontWeight:\s*700", "fontWeight: FONT_WEIGHTS.semibold"
        $content = $content -replace "fontWeight:\s*600", "fontWeight: FONT_WEIGHTS.semibold"
        
        # height 변경
        $content = $content -replace "height:\s*'25px'", "height: HEIGHTS.header"
        $content = $content -replace "height:\s*'22px'", "height: HEIGHTS.header"
        
        $content | Set-Content $file -NoNewline -Encoding UTF8
        Write-Host "✅ $(Split-Path $file -Leaf)" -ForegroundColor Green
    }
}

Write-Host "`n✨ 폰트 수정 완료!" -ForegroundColor Cyan


