# Script para limpiar notas de los archivos MD
# Elimina referencias [^N] y ^[N] del texto, y secciones de notas al final

param(
    [string]$MDDir = "capitulos_md"
)

$ErrorActionPreference = "Stop"

function Remove-NotesFromMD {
    param([string]$FilePath)
    
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
    $originalLength = $content.Length
    
    # 1. Eliminar referencias inline: [^N] o ^[N]
    $cleaned = $content -replace '\[\^\d+\]', ''
    $cleaned = $cleaned -replace '\^\[\d+\]', ''
    
    # 2. Eliminar definiciones de notas: [^N]: texto...
    $cleaned = $cleaned -replace '\[\^\d+\]:\s*[^\r\n]+[\r\n]*', ''
    
    # 3. Eliminar secciones de "NOTAS DEL CAPÍTULO" hasta el final del archivo
    $cleaned = $cleaned -replace '\*\*NOTAS DEL CAPÍTULO[^\*]+\*\*[\s\S]*$', ''
    
    # 4. Eliminar líneas con formato **(N) Término:** definición
    $cleaned = $cleaned -replace '\*\*\(\d+\)[^\*]+\*\*:[^\r\n]+[\r\n]*', ''
    
    # 5. Limpiar múltiples líneas vacías al final
    $cleaned = $cleaned -replace '[\r\n]{3,}$', "`r`n"
    
    if ($cleaned.Length -ne $originalLength) {
        Set-Content -Path $FilePath -Value $cleaned -Encoding UTF8 -NoNewline
        $saved = $originalLength - $cleaned.Length
        Write-Host "  [OK] $([System.IO.Path]::GetFileName($FilePath)) - $saved bytes limpiados" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "  [--] $([System.IO.Path]::GetFileName($FilePath)) - Sin cambios" -ForegroundColor Gray
        return $false
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LIMPIEZA DE NOTAS EN ARCHIVOS MD" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$mdFiles = Get-ChildItem -Path $MDDir -Filter "Capitulo*.md" | Sort-Object Name
$totalCleaned = 0

foreach ($file in $mdFiles) {
    if (Remove-NotesFromMD -FilePath $file.FullName) {
        $totalCleaned++
    }
}

Write-Host "`n----------------------------------------" -ForegroundColor Cyan
Write-Host "Total archivos limpiados: $totalCleaned de $($mdFiles.Count)" -ForegroundColor Yellow
Write-Host "----------------------------------------`n" -ForegroundColor Cyan
