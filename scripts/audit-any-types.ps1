# PowerShell script to audit 'any' type usage in TypeScript codebase
# Part of Kiro-Lovable Coordination System - Task 14.1

$ErrorActionPreference = "Stop"

Write-Host "🔍 Scanning TypeScript files for 'any' type usage..." -ForegroundColor Cyan
Write-Host ""

# File ownership patterns
$kiroPatterns = @(
    "^src[/\\]server[/\\]",
    "^src[/\\]lib[/\\]",
    "^src[/\\]modules[/\\].*[/\\]types\.ts$",
    "^src[/\\]integrations[/\\]supabase[/\\]",
    "^src[/\\]__tests__[/\\]",
    "^src[/\\]tests[/\\]"
)

$lovablePatterns = @(
    "^src[/\\]components[/\\]ui[/\\]",
    "^src[/\\]components[/\\]templates[/\\]",
    "^src[/\\]components[/\\].*\.tsx$"
)

$sharedPatterns = @(
    "^src[/\\]routes[/\\].*\.tsx$",
    "^src[/\\]hooks[/\\]"
)

function Get-Ownership {
    param([string]$path)
    
    $normalizedPath = $path -replace '\\', '/'
    
    foreach ($pattern in $kiroPatterns) {
        if ($normalizedPath -match $pattern) { return "kiro" }
    }
    
    foreach ($pattern in $lovablePatterns) {
        if ($normalizedPath -match $pattern) { return "lovable" }
    }
    
    foreach ($pattern in $sharedPatterns) {
        if ($normalizedPath -match $pattern) { return "shared" }
    }
    
    return "unassigned"
}

function Get-Category {
    param([string]$line)
    
    if ($line -match '\([^)]*:\s*any' -or $line -match '\.\.\.[^:]*:\s*any') {
        return "parameter"
    }
    if ($line -match '\):\s*any\b' -or $line -match 'Promise<any>') {
        return "return-type"
    }
    if ($line -match 'as\s+any\b') {
        return "type-assertion"
    }
    if ($line -match '<any>' -or $line -match 'Array<any>' -or $line -match 'Record<[^,]+,\s*any>') {
        return "generic"
    }
    if ($line -match '(?:const|let|var)\s+[^:]+:\s*any') {
        return "variable"
    }
    return "other"
}

function Get-Complexity {
    param([string]$line, [string]$category)
    
    if ($category -eq "type-assertion" -and $line -match 'as\s+any\s*[;,\)]') {
        return "simple"
    }
    if ($category -eq "variable" -and $line -match ':\s*any\[\]') {
        return "simple"
    }
    if ($line -match 'catch' -and $line -match 'err.*:\s*any') {
        return "simple"
    }
    if ($category -eq "return-type" -and $line -match 'Promise<any>') {
        return "medium"
    }
    if ($category -eq "generic" -and $line -match 'Record<.*,\s*any>') {
        return "medium"
    }
    return "medium"
}

# Scan all TypeScript files
$files = Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse
$results = @()
$totalCount = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
    $ownership = Get-Ownership $relativePath
    
    $content = Get-Content $file.FullName -Raw
    $lines = $content -split "`n"
    
    $fileOccurrences = @()
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $matches = [regex]::Matches($line, '\bany\b')
        
        foreach ($match in $matches) {
            $category = Get-Category $line
            $complexity = Get-Complexity $line $category
            
            $fileOccurrences += [PSCustomObject]@{
                Line = $i + 1
                Column = $match.Index + 1
                Context = $line.Trim()
                Category = $category
                Complexity = $complexity
            }
            $totalCount++
        }
    }
    
    if ($fileOccurrences.Count -gt 0) {
        $results += [PSCustomObject]@{
            File = $relativePath
            Ownership = $ownership
            Occurrences = $fileOccurrences
            TotalCount = $fileOccurrences.Count
        }
    }
}

# Group by ownership
$byOwnership = $results | Group-Object -Property Ownership

# Calculate complexity totals
$allOccurrences = $results | ForEach-Object { $_.Occurrences } | ForEach-Object { $_ }
$simpleCount = ($allOccurrences | Where-Object { $_.Complexity -eq "simple" }).Count
$mediumCount = ($allOccurrences | Where-Object { $_.Complexity -eq "medium" }).Count
$complexCount = ($allOccurrences | Where-Object { $_.Complexity -eq "complex" }).Count

Write-Host "✅ Scan complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Found $totalCount occurrences of 'any' across $($results.Count) files" -ForegroundColor Yellow
Write-Host ""

# Generate markdown report
$outputDir = ".kiro\coordination\audits"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$outputPath = Join-Path $outputDir "any-type-audit.md"
$md = @()

$md += "# TypeScript ``any`` Type Audit Report"
$md += ""
$md += "**Generated**: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')"
$md += "**Task**: 14.1 Audit codebase for 'any' usage"
$md += "**Spec**: Kiro-Lovable Coordination System"
$md += ""

# Executive Summary
$md += "## Executive Summary"
$md += ""
$md += "- **Total ``any`` occurrences**: $totalCount"
$md += "- **Files affected**: $($results.Count)"

foreach ($group in $byOwnership) {
    $count = ($group.Group | ForEach-Object { $_.TotalCount } | Measure-Object -Sum).Sum
    $md += "- **$($group.Name)-owned files**: $($group.Count) ($count occurrences)"
}

$md += ""

# Complexity Assessment
$md += "## Complexity Assessment"
$md += ""
$md += "- **Simple** (easy to fix): $simpleCount occurrences"
$md += "- **Medium** (moderate effort): $mediumCount occurrences"
$md += "- **Complex** (significant refactoring): $complexCount occurrences"
$md += ""

# Priority Order
$md += "## Recommended Fix Priority"
$md += ""
$md += "Based on file ownership and complexity, the recommended order is:"
$md += ""
$md += "1. **Kiro-owned files** (Kiro has full control, no coordination needed)"
$md += "2. **Shared files** (requires coordination between Kiro and Lovable)"
$md += "3. **Lovable-owned files** (Lovable should fix with type definitions from Kiro)"
$md += "4. **Unassigned files** (determine ownership first)"
$md += ""

# Detailed breakdown by ownership
$ownerships = @("kiro", "lovable", "shared", "unassigned")

foreach ($ownership in $ownerships) {
    $files = $results | Where-Object { $_.Ownership -eq $ownership }
    if ($files.Count -eq 0) { continue }
    
    $totalOcc = ($files | ForEach-Object { $_.TotalCount } | Measure-Object -Sum).Sum
    
    $md += "## $($ownership.Substring(0,1).ToUpper())$($ownership.Substring(1))-Owned Files"
    $md += ""
    $md += "**Total occurrences**: $totalOcc across $($files.Count) files"
    $md += ""
    
    # Sort by occurrence count
    $sortedFiles = $files | Sort-Object -Property TotalCount -Descending
    
    foreach ($fileAudit in $sortedFiles) {
        $md += "### ``$($fileAudit.File)``"
        $md += ""
        $md += "**Occurrences**: $($fileAudit.TotalCount)"
        $md += ""
        
        # Group by category
        $byCategory = $fileAudit.Occurrences | Group-Object -Property Category
        
        foreach ($catGroup in $byCategory) {
            $catName = $catGroup.Name -replace '-', ' '
            $catName = (Get-Culture).TextInfo.ToTitleCase($catName)
            $md += "#### $catName ($($catGroup.Count))"
            $md += ""
            
            foreach ($occ in $catGroup.Group) {
                $md += "- **Line $($occ.Line):$($occ.Column)** [$($occ.Complexity)]"
                $md += "  ````typescript"
                $md += "  $($occ.Context)"
                $md += "  ````"
                $md += ""
            }
        }
    }
}

# Recommendations
$md += "## Recommendations"
$md += ""
$md += "### Immediate Actions (Task 14.2)"
$md += ""
$md += "1. Create comprehensive type definitions in ``src/modules/*/types.ts``"
$md += "2. Define interfaces for:"
$md += "   - API response types"
$md += "   - Database entity types"
$md += "   - Component prop types"
$md += "   - Store state types"
$md += "   - Server function parameter and return types"
$md += ""

$md += "### Type Replacement Strategy (Task 14.3)"
$md += ""
$md += "1. **Phase 1**: Replace simple cases (type assertions, error catches)"
$md += "2. **Phase 2**: Replace function parameters and return types"
$md += "3. **Phase 3**: Replace complex generic types and nested structures"
$md += "4. **Phase 4**: Update shared files with coordination"
$md += ""

$md += "### Common Patterns to Address"
$md += ""
$md += "- **Error handling**: Replace ``catch (err: any)`` with ``catch (err: unknown)`` and type guards"
$md += "- **API responses**: Create specific response types instead of ``any``"
$md += "- **JSON parsing**: Use type guards and validation instead of ``as any``"
$md += "- **External library types**: Import proper types or create declaration files"
$md += "- **Dynamic objects**: Use ``Record<string, unknown>`` or specific interfaces"
$md += ""

$md += "## Next Steps"
$md += ""
$md += "1. Review this audit report"
$md += "2. Proceed to Task 14.2: Create missing type definitions"
$md += "3. Proceed to Task 14.3: Replace ``any`` types with proper types"
$md += "4. Run TypeScript compiler in strict mode to verify"
$md += "5. Update ESLint configuration to enforce no-explicit-any rule"
$md += ""

# Write report
$md -join "`n" | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "📝 Report saved to: $outputPath" -ForegroundColor Green
Write-Host ""
Write-Host "Breakdown by ownership:" -ForegroundColor Cyan
foreach ($group in $byOwnership) {
    $count = ($group.Group | ForEach-Object { $_.TotalCount } | Measure-Object -Sum).Sum
    Write-Host "  - $($group.Name): $count occurrences in $($group.Count) files" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the audit report" -ForegroundColor White
Write-Host "  2. Proceed to Task 14.2: Create missing type definitions" -ForegroundColor White
Write-Host "  3. Proceed to Task 14.3: Replace any types with proper types" -ForegroundColor White
