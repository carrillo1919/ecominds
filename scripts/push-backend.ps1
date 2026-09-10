<#
.SYNOPSIS
    Publica la carpeta backend/ en el repositorio del colaborador
    (ecominds04-design/ecominds-banckend) EXCLUYENDO backend/tools/.

.DESCRIPTION
    `git subtree split` no soporta exclusiones, por lo que este script:
      1. Genera la rama temporal `backend-only` con el contenido de backend/.
      2. Elimina `tools/` de esa rama (queda solo en el repositorio principal).
      3. Empuja la rama al remoto del colaborador.
      4. Borra la rama temporal.

    El repositorio principal (carrillo1919/ecominds) conserva backend/tools/
    con migraciones, seeders y pruebas.

.PARAMETER Remote
    Remoto destino. Por defecto: backend-origin

.PARAMETER Branch
    Rama destino en el remoto. Por defecto: main

.PARAMETER DryRun
    Muestra lo que se haria sin empujar nada.

.EXAMPLE
    pwsh -File scripts/push-backend.ps1
    pwsh -File scripts/push-backend.ps1 -DryRun
#>
[CmdletBinding()]
param(
    [string]$Remote = 'backend-origin',
    [string]$Branch = 'main',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# git escribe progreso y avisos en stderr; PowerShell 5.1 los trata como errores
# nativos. Se desactiva esa conversion para que el script no aborte ni ensucie la salida.
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$splitBranch = 'backend-only'
$excludedPath = 'tools'

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
    # git escribe en stderr cuando la rama no existe; se silencia a proposito.
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

Write-Host "==> Verificando que '$excludedPath/' no sea importado por src/ ..." -ForegroundColor Cyan
$leaks = & cmd /c "git grep -n -E ""from ['""].*tools/|require\(['""].*tools/"" -- backend/src 2>nul"
if ($leaks) {
    Write-Warning "Se encontraron referencias a tools/ dentro de src/:"
    $leaks | ForEach-Object { Write-Warning "  $_" }
    throw "El runtime no debe depender de tools/. Corrija las referencias antes de publicar."
}
Write-Host "    OK: src/ es independiente de tools/." -ForegroundColor Green

Write-Host "==> Limpiando rama temporal previa (si existe) ..." -ForegroundColor Cyan
Remove-SplitBranch

Write-Host "==> Generando rama '$splitBranch' desde backend/ ..." -ForegroundColor Cyan
Invoke-Git subtree split --prefix=backend -b $splitBranch

Write-Host "==> Eliminando '$excludedPath/' de la rama '$splitBranch' ..." -ForegroundColor Cyan
Invoke-Git checkout $splitBranch
try {
    $tracked = & git ls-files -- $excludedPath
    if ($tracked) {
        Invoke-Git rm -r -q --ignore-unmatch -- $excludedPath
        Invoke-Git commit -q -m "chore: excluir tools/ del repositorio de despliegue"
        Write-Host "    Eliminados $($tracked.Count) archivos de $excludedPath/." -ForegroundColor Green
    }
    else {
        Write-Host "    '$excludedPath/' no estaba presente; nada que eliminar." -ForegroundColor Yellow
    }

    Write-Host "==> Verificando contenido de la rama ..." -ForegroundColor Cyan
    $remaining = & git ls-files -- $excludedPath
    if ($remaining) { throw "Aun quedan archivos en $excludedPath/ dentro de $splitBranch." }
    Write-Host "    OK: '$excludedPath/' ausente." -ForegroundColor Green
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
