param(
    [string]$BaseBranch = 'integration/github-migration'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$workspaceRoot = Split-Path -Parent $repoRoot
$worktreesRoot = Join-Path $workspaceRoot 'worktrees'
$sparsePaths = @(
    '/battle.html', '/README.md', '/AGENTS.md', '/CLAUDE.md', '/.gitattributes', '/.gitignore',
    '/.claude/', '/.github/', '/battle-dev/', '/docs/', '/scripts/'
)

function Invoke-Git {
    param([string]$Directory, [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    & git -C $Directory @Arguments
    if ($LASTEXITCODE -ne 0) { throw "git command failed in ${Directory}: git $($Arguments -join ' ')" }
}

Invoke-Git $repoRoot config extensions.worktreeConfig true
Invoke-Git $repoRoot config fetch.prune true
Invoke-Git $repoRoot config pull.ff only
Invoke-Git $repoRoot config push.autoSetupRemote true

if (-not (Test-Path -LiteralPath $worktreesRoot)) {
    New-Item -ItemType Directory -Path $worktreesRoot | Out-Null
}

$definitions = @(
    @{ Name = 'codex'; Branch = 'codex/work' },
    @{ Name = 'claude'; Branch = 'claude/work' }
)

foreach ($definition in $definitions) {
    $path = Join-Path $worktreesRoot $definition.Name
    $branch = $definition.Branch

    if (Test-Path -LiteralPath $path) {
        $registered = (& git -C $repoRoot worktree list --porcelain) -contains "worktree $path"
        if (-not $registered) { throw "Existing path is not the expected Git worktree: $path" }
        Write-Output "Keeping existing worktree: $path ($branch)"
        continue
    }

    & git -C $repoRoot show-ref --verify --quiet "refs/heads/$branch"
    if ($LASTEXITCODE -eq 0) {
        Invoke-Git $repoRoot worktree add --no-checkout $path $branch
    }
    else {
        Invoke-Git $repoRoot worktree add --no-checkout -b $branch $path $BaseBranch
    }

    Invoke-Git $path sparse-checkout set --no-cone @sparsePaths
    Invoke-Git $path checkout $branch
    Write-Output "Created worktree: $path ($branch)"
}

Invoke-Git $repoRoot worktree list
