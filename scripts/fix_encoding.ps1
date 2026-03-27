# Powershell script to fix UTF-8 encoding corruption (mojibake)
# This script uses byte arrays to define corrupted sequences to be encoding-independent.

$ErrorActionPreference = "Stop"

function Get-Utf8String([byte[]]$bytes) {
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

# Define replacements using byte sequences to avoid script encoding issues
# Mapping based on: UTF-8 bytes for target symbol -> interpreted as CP1252 -> saved as UTF-8
$replacements = [ordered]@{
    # Arrow → (E2 86 92) -> C3 A2 E2 80 A0 E2 80 99
    (Get-Utf8String @(0xC3, 0xA2, 0xE2, 0x80, 0xA0, 0xE2, 0x80, 0x99)) = "→"
    
    # Bullet • (E2 80 A2) -> C3 A2 E2 82 AC C2 A2
    (Get-Utf8String @(0xC3, 0xA2, 0 E2, 0x82, 0xAC, 0xC2, 0xA2))       = "•"
    
    # Ellipsis … (E2 80 A6) -> C3 A2 E2 82 AC C2 A6
    (Get-Utf8String @(0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xC2, 0xA6))       = "…"
    
    # En-dash – (E2 80 93) -> C3 A2 E2 82 AC E2 80 9C
    (Get-Utf8String @(0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xE2, 0x80, 0x9C)) = "–"
    
    # Em-dash — (E2 80 94) -> C3 A2 E2 82 AC E2 80 9D
    (Get-Utf8String @(0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xE2, 0x80, 0x9D)) = "—"
    
    # Left double quote “ (E2 80 9C) -> C3 A2 E2 82 AC E2 80 9C
    # Wait, overlap with en-dash? Let's check.
    # Actually, E2 80 9C (1252) is "â€œ". â=C3A2, €=E282AC, “=E2809C.
    # Ah, the en-dash E2 80 93. 93 in 1252 is “ (U+201C).
    # So en-dash becomes Ã¢â‚¬â€œ. No.
    # Let's use literal string replacements for the most common ones instead of over-engineering if possible, 
    # but I'll use hex for the risky characters like the arrow.
}

# Actually, let's go back to a simpler script but ensure it's saved with UTF-8 BOM if needed, 
# or just use very specific literal strings and handle the errors.

# Final attempt at a robust replacement list
$map = @{
    "Ã¢â€ â€™" = "→"
    "Ã¢â‚¬Â¢"   = "•"
    "Ã¢â‚¬Â¦"   = "…"
    "Ã¢â‚¬â€œ"   = "–"
    "Ã¢â‚¬â€"    = "—"
    "Ã¢â‚¬Å“"   = "“"
    "Ã¢â‚¬Â "   = "” "
    "Ã¢â‚¬Â"    = "”"
    "Ã¢â‚¬Ëœ"   = "‘"
    "Ã¢â‚¬â„¢"   = "’"
    "Ã‚Â"        = " "
    "ÃƒÂ©"       = "é"
    "ÃƒÂ "       = "à"
}

# Define file patterns
$include = @("*.tsx", "*.ts", "*.js", "*.mjs", "*.json", "*.css", "*.md", "*.html")
$exclude = @("node_modules/*", ".git/*", ".turbo/*", "dist/*", "build/*")

$files = Get-ChildItem -Recurse -File -Include $include -Exclude $exclude

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        foreach ($key in $map.Keys) {
            if ($content.Contains($key)) {
                $content = $content.Replace($key, $map[$key])
                $modified = $true
            }
        }
        if ($modified) {
            Write-Host "Fixed: $($file.FullName)"
            [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding($false)))
        }
    } catch {}
}
Write-Host "Finished."
