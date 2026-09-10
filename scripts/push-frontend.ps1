<#
.SYNOPSIS
    Publica la carpeta frontend/ en el repositorio del colaborador
    (ecominds04-design/ecominds-frontend).

.DESCRIPTION
    `git subtree split` no soporta exclusiones, por lo que este script:
      1. Genera la rama temporal `frontend-only` con el contenido de frontend/.
      2. Empuja la rama al remoto del colaborador.
      3. Borra la rama temporal.

.PARAMETER Remote
    Remoto destino. Por defecto: frontend-origin

.PARAMETER Branch
    Rama destino en el remoto. Por defecto: main

.PARAMETER DryRun
    Muestra lo que se haria sin empujar nada.

.EXAMPLE
    pwsh -File scripts/push-frontend.ps1
    pwsh -File scripts/push-frontend.ps1 -DryRun
#>
[CmdletBinding()]
param(
    [string]$Remote = 'frontend-origin',
    [string]$Branch = 'main',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$splitBranch = 'frontend-only'

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    # Se ejecuta via cmd para que el progreso de git (stderr) no se convierta
    # en NativeCommandError bajo PowerShell 5.1.
    $quoted = ($Args | ForEach-Object { if ($_ -match '[\s"]') { '"' + ($_ -replace '"', '\"') + '"' } else { $_ } }) -join ' '
    & cmd /c "git $quoted 2>&1"
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Args -join ' ') fallo con codigo $LASTEXITCODE"
    }
}

function Remove-SplitBranch {
    & cmd /c "git branch -D $splitBranch >nul 2>&1"
}

function Assert-CleanWorktree {
    $dirty = & cmd /c "git status --porcelain 2>nul"
    if ($dirty) {
        Write-Warning "Hay cambios sin confirmar en el arbol de trabajo:"
        $dirty | ForEach-Object { Write-Warning "  $_" }
        throw "Confirme o guarde sus cambios (git stash) antes de publicar: el script cambia de rama."
    }
}

Write-Host "==> Verificando que el arbol de trabajo este limpio ..." -ForegroundColor Cyan
Assert-CleanWorktree
Write-Host "    OK: sin cambios pendientes." -ForegroundColor Green

Write-Host "==> Limpiando rama temporal previa (si existe) ..." -ForegroundColor Cyan
Remove-SplitBranch

Write-Host "==> Generando rama '$splitBranch' desde frontend/ ..." -ForegroundColor Cyan
Invoke-Git subtree split --prefix=frontend -b $splitBranch

Invoke-Git checkout $splitBranch
try {
    Write-Host "    Archivos en la raiz de la rama:" -ForegroundColor DarkGray
    & git ls-tree --name-only $splitBranch | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }

    if ($DryRun) {
        Write-Host "==> DryRun: no se empuja nada." -ForegroundColor Yellow
    }
    else {
        Write-Host "==> Empujando a $Remote ($Branch) ..." -ForegroundColor Cyan
        Invoke-Git push $Remote "${splitBranch}:${Branch}" --force
        Write-Host "    Publicado en $Remote/$Branch." -ForegroundColor Green
    }
}
finally {
    Invoke-Git checkout main
    Remove-SplitBranch
    Write-Host "==> Rama temporal '$splitBranch' eliminada." -ForegroundColor Cyan
}
