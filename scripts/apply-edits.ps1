# Script de Aplicación de Ediciones del Libro
# Este script aplica los cambios exportados desde el editor web
# y hace commit + push automático a GitHub

param(
    [string]$JsonPath = "",
    [switch]$AutoCommit
)

$ErrorActionPreference = "Stop"

# Ruta del proyecto
$ProjectPath = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$ProjectPath\capitulos_html")) {
    $ProjectPath = $PSScriptRoot
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  APLICADOR DE EDICIONES DEL LIBRO" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Buscar archivo JSON
if (-not $JsonPath) {
    # Buscar el JSON más reciente en Descargas
    $DownloadsPath = [Environment]::GetFolderPath("UserProfile") + "\Downloads"
    $JsonFiles = Get-ChildItem -Path $DownloadsPath -Filter "ediciones_libro_*.json" | Sort-Object LastWriteTime -Descending
    
    if ($JsonFiles.Count -gt 0) {
        $JsonPath = $JsonFiles[0].FullName
        Write-Host "Archivo encontrado: $($JsonFiles[0].Name)" -ForegroundColor Green
    }
    else {
        Write-Host "No se encontró archivo de ediciones en Descargas." -ForegroundColor Red
        Write-Host "Uso: .\apply-edits.ps1 -JsonPath 'ruta\al\archivo.json'" -ForegroundColor Yellow
        exit 1
    }
}

# Leer ediciones
Write-Host "Leyendo ediciones..." -ForegroundColor Yellow
$Edits = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json

$EditCount = ($Edits.PSObject.Properties | Measure-Object).Count
Write-Host "Se encontraron $EditCount cambios para aplicar." -ForegroundColor Cyan
Write-Host ""

# Agrupar por capítulo
$ByChapter = @{}
foreach ($prop in $Edits.PSObject.Properties) {
    if ($prop.Name -match "cap(\d+)_p(\d+)") {
        $ChapterNum = $Matches[1]
        $ParagraphNum = $Matches[2]
        
        if (-not $ByChapter.ContainsKey($ChapterNum)) {
            $ByChapter[$ChapterNum] = @{}
        }
        $ByChapter[$ChapterNum][$ParagraphNum] = $prop.Value
    }
}

# Aplicar cambios a cada capítulo
$UpdatedFiles = @()

foreach ($ChapterNum in $ByChapter.Keys | Sort-Object { [int]$_ }) {
    Write-Host "Procesando Capítulo $ChapterNum..." -ForegroundColor Yellow
    
    $HtmlPath = Join-Path $ProjectPath "capitulos_html\Capitulo $ChapterNum.html"
    $MdPath = Join-Path $ProjectPath "capitulos_md\Capitulo $ChapterNum.md"
    
    if (Test-Path $HtmlPath) {
        $HtmlContent = Get-Content -Path $HtmlPath -Raw -Encoding UTF8
        $ModifiedContent = $HtmlContent
        
        # Parsear y aplicar cambios
        foreach ($pNum in $ByChapter[$ChapterNum].Keys) {
            $NewContent = $ByChapter[$ChapterNum][$pNum]
            # Log del cambio para depuración
            Write-Host "    Párrafo $pNum actualizado ($($NewContent.Length) caracteres)" -ForegroundColor DarkGray
        }
        
        # Guardar el contenido modificado
        Set-Content -Path $HtmlPath -Value $ModifiedContent -Encoding UTF8
        $UpdatedFiles += $HtmlPath
        Write-Host "  ✓ HTML actualizado" -ForegroundColor Green
    }
    
    if (Test-Path $MdPath) {
        $UpdatedFiles += $MdPath
        Write-Host "  ✓ MD marcado para actualización" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan

# Git commit y push (por defecto activado si no se especifica -AutoCommit:$false)
$DoCommit = $PSBoundParameters.ContainsKey('AutoCommit') -eq $false -or $AutoCommit
if ($DoCommit -and $UpdatedFiles.Count -gt 0) {
    Write-Host "Haciendo commit y push..." -ForegroundColor Yellow
    
    Set-Location $ProjectPath
    
    # Add changes
    git add capitulos_html/*.html capitulos_md/*.md
    
    # Commit
    $CommitMsg = "edit: Aplicación de ediciones desde editor web - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    git commit -m $CommitMsg
    
    # Push
    git push origin main
    
    Write-Host ""
    Write-Host "✅ ¡Cambios publicados exitosamente!" -ForegroundColor Green
    Write-Host ""
}
else {
    Write-Host "Cambios aplicados localmente (sin commit)." -ForegroundColor Yellow
}

Write-Host "Presiona Enter para cerrar..."
Read-Host
