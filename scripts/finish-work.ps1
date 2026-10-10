param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Message,

    [string]$PythonExecutable,

    [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$battleRoot = Join-Path $repoRoot 'battle-dev'
$publicBattle = Join-Path $repoRoot 'battle.html'
$generatedBattle = Join-Path $battleRoot 'dist\battle.html'
$gateLog = Join-Path ([System.IO.Path]::GetTempPath()) ("1103_gate_{0}.log" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))

if ([string]::IsNullOrWhiteSpace($PythonExecutable)) {
    $bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
    if (Test-Path -LiteralPath $bundledPython) {
        $PythonExecutable = $bundledPython
    }
    else {
        $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
        if ($null -eq $pythonCommand) { throw 'Python was not found. Pass -PythonExecutable with a valid Python 3 path.' }
        $PythonExecutable = $pythonCommand.Source
    }
}

$bundledNodeDirectory = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
if (Test-Path -LiteralPath (Join-Path $bundledNodeDirectory 'node.exe')) {
    $env:PATH = "$bundledNodeDirectory;$env:PATH"
}

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    & git -C $repoRoot @Arguments
    if ($LASTEXITCODE -ne 0) { throw "git command failed: git $($Arguments -join ' ')" }
}

function Invoke-PythonChecked {
    param([string[]]$Arguments)
    & $PythonExecutable @Arguments
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) { throw "python command failed ($exitCode): $PythonExecutable $($Arguments -join ' ')" }
}

$branch = (& git -C $repoRoot branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branch)) { throw 'Cannot determine the current branch.' }
if ($branch -in @('main', 'master')) { throw 'Direct commits to the protected integration branch are not allowed.' }
if ($branch -notmatch '^(codex|claude|integration)/') {
    throw "Unexpected branch '$branch'. Use codex/*, claude/*, or integration/*."
}

$pendingChanges = @(& git -C $repoRoot status --porcelain --untracked-files=normal)
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect the current working tree.' }
if ($pendingChanges.Count -eq 0) {
    Write-Output 'No changes to verify, commit, or push.'
    return
}

Push-Location $repoRoot
try {
    Invoke-PythonChecked @('scripts/check_repo_safety.py', '--mode', 'working-tree')

    Push-Location $battleRoot
    try {
        Invoke-PythonChecked @('tools/build.py')

        # Windows PowerShell 5.1 turns native stderr (the recorded cycle32 caught-error output) into a terminating error under Stop; the exit code below is the verdict.
        $previousEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & $PythonExecutable tools/check.py *> $gateLog
        $gateExit = $LASTEXITCODE
        $ErrorActionPreference = $previousEap
        Add-Content -LiteralPath $gateLog -Value "GATE_EXIT=$gateExit"
        if ($gateExit -ne 0) {
            Get-Content -LiteralPath $gateLog -Tail 120
            throw "Full gate failed ($gateExit). Log retained at $gateLog"
        }

        Invoke-PythonChecked @('tools/build_acode.py', 'data/carddata.json')
    }
    finally {
        Pop-Location
    }

    Copy-Item -LiteralPath $generatedBattle -Destination $publicBattle -Force
    Invoke-PythonChecked @('scripts/check_repo_safety.py', '--mode', 'working-tree')

    Invoke-Git add -- '.gitattributes' '.gitignore' 'AGENTS.md' 'CLAUDE.md' '.github' 'battle.html' 'battle-dev' 'docs' 'scripts'
    Invoke-PythonChecked @('scripts/check_repo_safety.py', '--mode', 'staged')
    # the generated artifacts keep their Windows CRLF line endings (.gitattributes: -text -eol), so a CR at end of line is not a whitespace error here
    Invoke-Git -c core.whitespace=cr-at-eol diff --cached --check

    & git -C $repoRoot diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Output 'No changes to commit.'
        return
    }

    Invoke-Git commit -m $Message
    $commit = (& git -C $repoRoot rev-parse HEAD).Trim()

    $passCount = (Select-String -LiteralPath $gateLog -Pattern '\bPASS\b').Count
    $failCount = (Select-String -LiteralPath $gateLog -Pattern '\bFAIL\b').Count
    Write-Output "Committed $commit on $branch (PASS lines: $passCount; FAIL lines: $failCount; GATE_EXIT=0)."

    if ($NoPush) {
        Write-Output 'Push skipped by -NoPush; the commit remains local.'
        return
    }

    & git -C $repoRoot push --set-upstream origin HEAD
    $pushExit = $LASTEXITCODE
    if ($pushExit -ne 0) {
        Write-Warning "Push failed with exit $pushExit. Local commit $commit has been retained; no reset was performed."
        exit $pushExit
    }
    Write-Output "Pushed $commit to origin/$branch."
}
finally {
    Pop-Location
}
