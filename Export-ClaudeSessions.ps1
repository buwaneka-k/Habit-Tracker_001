<#
.SYNOPSIS
    Exports the last N Claude Code sessions for a project to readable Markdown transcript files.

.DESCRIPTION
    Claude Code's interactive `/export` slash command cannot be driven headlessly — it only
    works inside an interactive TUI session. This script works around that by reading the
    session transcript files Claude Code already writes to disk
    (%USERPROFILE%\.claude\projects\<encoded-project-path>\<session-id>.jsonl) and rendering
    each one to a human-readable Markdown file, similar to what /export produces.

    It is project-agnostic: point it at any project directory (default: current directory)
    on any Windows machine, and it will compute that project's session folder the same way
    Claude Code does (every non-alphanumeric character in the absolute path becomes a dash).

.PARAMETER ProjectPath
    Path to the project whose sessions should be exported. Defaults to the current directory.

.PARAMETER Count
    Number of most-recent sessions to export. Defaults to 10.

.PARAMETER OutputDir
    Directory to write the exported .md files to. Defaults to ".\claude-session-exports"
    under the current directory.

.EXAMPLE
    .\Export-ClaudeSessions.ps1
    Exports the last 10 sessions for the current directory's project.

.EXAMPLE
    .\Export-ClaudeSessions.ps1 -ProjectPath C:\Projects\SomeOtherRepo -Count 5 -OutputDir .\exports

.NOTES
    Reads Claude Code's internal .jsonl transcript format directly. That format is undocumented
    and can change between Claude Code versions — if exports look empty or malformed after an
    update, this script may need adjusting.
#>

[CmdletBinding()]
param(
    [string]$ProjectPath = (Get-Location).Path,
    [int]$Count = 10,
    [string]$OutputDir = (Join-Path (Get-Location).Path "claude-session-exports")
)

$ErrorActionPreference = "Stop"

function ConvertTo-EncodedProjectDir {
    param([string]$Path)
    $full = (Resolve-Path -LiteralPath $Path).Path
    return ($full -replace '[^a-zA-Z0-9]', '-')
}

function Get-BlockText {
    param($Block)

    if ($null -eq $Block) { return "" }

    if ($Block -is [string]) { return $Block }

    switch ($Block.type) {
        "text" {
            return $Block.text
        }
        "thinking" {
            return $null  # internal reasoning trace, omitted from export
        }
        "tool_use" {
            $inputJson = ($Block.input | ConvertTo-Json -Depth 10 -Compress)
            if ($inputJson.Length -gt 2000) { $inputJson = $inputJson.Substring(0, 2000) + " ...(truncated)" }
            return "**Tool call:** ``$($Block.name)``" + [Environment]::NewLine + [Environment]::NewLine + '```json' + [Environment]::NewLine + $inputJson + [Environment]::NewLine + '```'
        }
        "tool_result" {
            $inner = $Block.content
            $text = ""
            if ($inner -is [string]) {
                $text = $inner
            } elseif ($inner -is [System.Collections.IEnumerable]) {
                $parts = @()
                foreach ($sub in $inner) {
                    if ($sub.type -eq "text") { $parts += $sub.text }
                }
                $text = ($parts -join [Environment]::NewLine)
            }
            if ($text.Length -gt 3000) { $text = $text.Substring(0, 3000) + [Environment]::NewLine + "...(truncated)" }
            $label = if ($Block.is_error) { "**Tool result (error):**" } else { "**Tool result:**" }
            return $label + [Environment]::NewLine + [Environment]::NewLine + '```' + [Environment]::NewLine + $text + [Environment]::NewLine + '```'
        }
        "image" {
            return "*[image omitted]*"
        }
        default {
            return $null
        }
    }
}

function ConvertTo-MessageMarkdown {
    param($Entry)

    $role = $Entry.message.role
    $content = $Entry.message.content

    $pieces = @()
    if ($content -is [string]) {
        $pieces += $content
    } elseif ($content -is [System.Collections.IEnumerable]) {
        foreach ($block in $content) {
            $t = Get-BlockText $block
            if ($null -ne $t -and $t -ne "") { $pieces += $t }
        }
    }

    if ($pieces.Count -eq 0) { return $null }

    $heading = if ($role -eq "user") { "## User" } else { "## Assistant" }
    return "$heading" + [Environment]::NewLine + [Environment]::NewLine + ($pieces -join ([Environment]::NewLine + [Environment]::NewLine))
}

function Export-SessionTranscript {
    param([string]$JsonlPath, [string]$OutFile)

    $lines = Get-Content -LiteralPath $JsonlPath -Encoding UTF8
    $entries = foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try { $line | ConvertFrom-Json } catch { $null }
    }
    $entries = $entries | Where-Object { $_ }

    $sessionId = ($entries | Where-Object { $_.sessionId } | Select-Object -First 1).sessionId
    $cwd = ($entries | Where-Object { $_.cwd } | Select-Object -First 1).cwd
    $branch = ($entries | Where-Object { $_.gitBranch } | Select-Object -First 1).gitBranch
    $version = ($entries | Where-Object { $_.version } | Select-Object -First 1).version
    $firstTs = ($entries | Where-Object { $_.timestamp } | Select-Object -First 1).timestamp
    $lastTs = ($entries | Where-Object { $_.timestamp } | Select-Object -Last 1).timestamp

    $out = New-Object System.Text.StringBuilder
    [void]$out.AppendLine("# Claude Code session export")
    [void]$out.AppendLine()
    [void]$out.AppendLine("- Session ID: $sessionId")
    [void]$out.AppendLine("- Project: $cwd")
    [void]$out.AppendLine("- Git branch: $branch")
    [void]$out.AppendLine("- Claude Code version: $version")
    [void]$out.AppendLine("- Start: $firstTs")
    [void]$out.AppendLine("- End: $lastTs")
    [void]$out.AppendLine()
    [void]$out.AppendLine("---")
    [void]$out.AppendLine()

    foreach ($entry in $entries) {
        switch ($entry.type) {
            "user" {
                $md = ConvertTo-MessageMarkdown $entry
                if ($md) { [void]$out.AppendLine($md); [void]$out.AppendLine(); [void]$out.AppendLine("---"); [void]$out.AppendLine() }
            }
            "assistant" {
                $md = ConvertTo-MessageMarkdown $entry
                if ($md) { [void]$out.AppendLine($md); [void]$out.AppendLine(); [void]$out.AppendLine("---"); [void]$out.AppendLine() }
            }
            "system" {
                if ($entry.subtype -eq "local_command" -and $entry.content) {
                    [void]$out.AppendLine("## System (local command)")
                    [void]$out.AppendLine()
                    [void]$out.AppendLine($entry.content)
                    [void]$out.AppendLine()
                    [void]$out.AppendLine("---")
                    [void]$out.AppendLine()
                }
            }
            default {
                # skip queue-operation, summary, and other internal bookkeeping entries
            }
        }
    }

    Set-Content -LiteralPath $OutFile -Value $out.ToString() -Encoding UTF8
}

# --- main ---

$encodedDir = ConvertTo-EncodedProjectDir -Path $ProjectPath
$sessionsDir = Join-Path $HOME ".claude\projects\$encodedDir"

if (-not (Test-Path -LiteralPath $sessionsDir)) {
    Write-Error "No Claude Code session folder found at:`n  $sessionsDir`nHas Claude Code been run in this project before?"
    exit 1
}

$sessionFiles = Get-ChildItem -LiteralPath $sessionsDir -Filter "*.jsonl" -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First $Count

if ($sessionFiles.Count -eq 0) {
    Write-Warning "No session files found in $sessionsDir"
    exit 0
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "Project sessions dir: $sessionsDir"
Write-Host "Exporting $($sessionFiles.Count) session(s) to: $OutputDir"
Write-Host ""

foreach ($file in $sessionFiles) {
    $shortId = $file.BaseName.Substring(0, 8)
    $stamp = $file.LastWriteTime.ToString("yyyy-MM-dd-HHmmss")
    $outFile = Join-Path $OutputDir "$stamp-$shortId.md"

    try {
        Export-SessionTranscript -JsonlPath $file.FullName -OutFile $outFile
        Write-Host "  OK   $($file.Name) -> $outFile"
    } catch {
        Write-Host "  FAIL $($file.Name): $($_.Exception.Message)"
    }
}
