param(
    [string]$Root = (Get-Location).Path,
    [switch]$WhatIfOnly,
    [int]$DecodePasses = 2
)

$ErrorActionPreference = "Stop"

$allowedExtensions = @(
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".mdx", ".txt",
    ".yml", ".yaml", ".html", ".css", ".scss", ".less", ".env", ".graphql", ".sql",
    ".prisma", ".sh", ".ps1", ".xml", ".csv"
)

$skipSegments = @(
    "\.git\",
    "\node_modules\",
    "\dist\",
    "\build\",
    "\.next\",
    "\coverage\",
    "\out\",
    "\bin\",
    "\obj\",
    "\.turbo\",
    "\previous_codebase\"
)

function U([int]$codePoint) {
    return [string][char]$codePoint
}

function J([int[]]$cps) {
    return -join ($cps | ForEach-Object { U $_ })
}

$suspectTokens = @(
    (U 0x00C3), # ?
    (U 0x00C2), # ?
    (U 0x00E2), # ?
    (U 0x00EF), # ?
    (U 0x00F0)  # ?
)

$manualMap = [ordered]@{
    (J @(0x00E2,0x20AC,0x2122)) = (U 0x2019)
    (J @(0x00E2,0x20AC,0x0153)) = (U 0x201C)
    (J @(0x00E2,0x20AC,0x009D)) = (U 0x201D)
    (J @(0x00E2,0x20AC,0x201C)) = (U 0x2013)
    (J @(0x00E2,0x20AC,0x201D)) = (U 0x2014)
    (J @(0x00E2,0x20AC,0x00A6)) = (U 0x2026)
    (J @(0x00E2,0x20AC,0x00A2)) = (U 0x2022)
    (J @(0x00E2,0x201E,0x00A2)) = (U 0x2122)
    ((U 0x00C2) + " ") = " "
    (U 0x00C2)         = ""
}

$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Should-SkipPath {
    param([string]$Path)
    foreach ($segment in $skipSegments) {
        if ($Path -like "*$segment*") {
            return $true
        }
    }
    return $false
}

function Repair-Mojibake {
    param([string]$Text)

    $fixed = $Text
    for ($i = 0; $i -lt $DecodePasses; $i++) {
        $candidate = [System.Text.Encoding]::UTF8.GetString($cp1252.GetBytes($fixed))
        if ($candidate -eq $fixed) {
            break
        }
        $fixed = $candidate
    }

    foreach ($k in $manualMap.Keys) {
        $fixed = $fixed.Replace($k, $manualMap[$k])
    }

    return $fixed
}

function Is-SuspectContent {
    param([string]$Text)
    foreach ($t in $suspectTokens) {
        if ($Text.Contains($t)) {
            return $true
        }
    }
    return $false
}

$filesScanned = 0
$filesChanged = 0
$filesErrored = 0

Write-Host "Scanning: $Root"

Get-ChildItem -Path $Root -Recurse -File | ForEach-Object {
    $file = $_
    $filesScanned++

    if (Should-SkipPath -Path $file.FullName) { return }
    if (-not ($allowedExtensions -contains $file.Extension.ToLowerInvariant())) { return }

    try {
        $original = [System.IO.File]::ReadAllText($file.FullName)
        if (-not (Is-SuspectContent -Text $original)) { return }

        $fixed = Repair-Mojibake -Text $original
        if ($fixed -eq $original) { return }

        if ($WhatIfOnly) {
            Write-Host "[DRY-RUN] Would fix: $($file.FullName)"
        } else {
            [System.IO.File]::WriteAllText($file.FullName, $fixed, $utf8NoBom)
            Write-Host "Fixed: $($file.FullName)"
        }

        $filesChanged++
    } catch {
        $filesErrored++
        Write-Warning "Failed: $($file.FullName) :: $($_.Exception.Message)"
    }
}

if ($WhatIfOnly) {
    Write-Host "Dry run complete. Scanned: $filesScanned | Would change: $filesChanged | Errors: $filesErrored"
} else {
    Write-Host "Done. Scanned: $filesScanned | Changed: $filesChanged | Errors: $filesErrored"
}
