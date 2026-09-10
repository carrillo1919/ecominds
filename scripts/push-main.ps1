<#
.SYNOPSIS
    Publica los cambios locales en el repositorio principal (origin).

.DESCRIPTION
    Ejecuta el flujo completo de publicacion:
      1. git status
      2. git add .
      3. git commit -m "<mensaje>"
      4. git push origin <rama>

    El mensaje de commit se pasa con -Message. Si se omite, el script lo pide
    de forma interactiva. Si no hay cambios que confirmar, el script lo informa
    y omite el commit (pero igual puede empujar commits pendientes).

.PARAMETER Message
    Mensaje del commit. Si se omite, se solicita por consola.

.PARAMETER Branch
    Rama a empujar. Por defecto: la rama actual.

.PARAMETER Remote
    Remoto destino. Por defecto: origin

.PARAMETER NoPush
    Hace status, add y commit, pero no empuja.

.PARAMETER DryRun
    Muestra que se haria sin ejecutar add, commit ni push.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/push-main.ps1 -Message "feat: nueva funcionalidad"

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/push-main.ps1
    # pide el mensaje de forma interactiva

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/push-main.ps1 -Message "wip" -NoPush
#>
[CmdletBinding()]
param(
    [string]$Message,
    [string]$Branch,
    [string]$Remote = 'origin',
    [switch]$NoPush,
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

function Get-GitOutput {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    $quoted = ($Args | ForEach-Object { if ($_ -match '[\s"]') { '"' + ($_ -replace '"', '\"') + '"' } else { $_ } }) -join ' '
    return (& cmd /c "git $quoted 2>nul")
}

# --- Validaciones previas -------------------------------------------------

$currentBranch = (Get-GitOutput rev-parse --abbrev-ref HEAD | Select-Object -First 1)
if (-not $currentBranch) {
    throw "No se pudo determinar la rama actual. Esta dentro de un repositorio git?"
}
if (-not $Branch) { $Branch = $currentBranch }

$remoteUrl = (Get-GitOutput remote get-url $Remote | Select-Object -First 1)
if (-not $remoteUrl) {
    throw "El remoto '$Remote' no existe. Remotos disponibles:`n$((Get-GitOutput remote) -join "`n")"
}

Write-Host "==> Repositorio : $repoRoot" -ForegroundColor Cyan
Write-Host "==> Remoto      : $Remote ($remoteUrl)" -ForegroundColor Cyan
Write-Host "==> Rama        : $currentBranch -> $Remote/$Branch" -ForegroundColor Cyan
Write-Host ""

# --- 1. git status --------------------------------------------------------

Write-Host "==> git status" -ForegroundColor Cyan
Invoke-Git status --short --branch
Write-Host ""

$changes = Get-GitOutput status --porcelain
$hasChanges = [bool]$changes

# --- 2. git add . ---------------------------------------------------------

if ($hasChanges) {
    if ($DryRun) {
        Write-Host "==> DryRun: se agregarian estos archivos con 'git add .':" -ForegroundColor Yellow
        $changes | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }
    }
    else {
        Write-Host "==> git add ." -ForegroundColor Cyan
        Invoke-Git add .
        Write-Host "    Cambios preparados." -ForegroundColor Green
    }
}
else {
    Write-Host "==> Sin cambios locales que agregar." -ForegroundColor Yellow
}
Write-Host ""

# --- 3. git commit -m -----------------------------------------------------

if ($hasChanges) {
    if (-not $Message) {
        if ($DryRun) {
            $Message = '<mensaje solicitado al usuario>'
        }
        else {
            Write-Host "==> Mensaje del commit" -ForegroundColor Cyan
            $Message = Read-Host "    Escriba el mensaje del commit"
            if (-not $Message -or -not $Message.Trim()) {
                throw "El mensaje del commit no puede estar vacio."
            }
        }
    }

    if ($DryRun) {
        Write-Host "==> DryRun: git commit -m `"$Message`"" -ForegroundColor Yellow
    }
    else {
        Write-Host "==> git commit -m `"$Message`"" -ForegroundColor Cyan
        Invoke-Git commit -m $Message
        Write-Host "    Commit creado." -ForegroundColor Green
    }
}
else {
    Write-Host "==> Nada que confirmar." -ForegroundColor Yellow
}
Write-Host ""

# --- 4. git push origin ---------------------------------------------------

if ($NoPush) {
    Write-Host "==> -NoPush: no se empuja nada." -ForegroundColor Yellow
    return
}

$ahead = Get-GitOutput rev-list --count "$Remote/$Branch..HEAD"
if ($ahead -eq '0') {
    Write-Host "==> Nada que empujar: '$Branch' esta al dia con $Remote/$Branch." -ForegroundColor Yellow
    return
}

if ($DryRun) {
    Write-Host "==> DryRun: git push $Remote $Branch ($ahead commit(s) pendiente(s))" -ForegroundColor Yellow
    return
}

Write-Host "==> git push $Remote $Branch ($ahead commit(s) pendiente(s))" -ForegroundColor Cyan
Invoke-Git push $Remote $Branch
Write-Host ""
Write-Host "==> Publicado en $Remote/$Branch." -ForegroundColor Green
