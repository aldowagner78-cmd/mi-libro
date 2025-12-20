# Script para limpiar notas inline de los archivos HTML
# Las notas quedan como <sup>(N)</sup> y el contenido viene del JSON

param(
    [string]$ChapterDir = "capitulos_html"
)

$ErrorActionPreference = "Stop"

function Clean-InlineNotes {
    param([string]$FilePath)
    
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
    $originalLength = $content.Length
    
    # Patrón para encontrar <sup> con estilos y/o data-note
    # Ejemplo: <sup style="cursor: pointer; color: var(--accent);" title="Ver nota 1" data-note="...">(1)</sup>
    # Debe quedar como: <sup>(1)</sup>
    
    # Regex para capturar el número de la nota
    $pattern = '<sup[^>]*>(\(\d+\))</sup>'
    
    # Reemplazar con <sup> limpio
    $cleanContent = [regex]::Replace($content, $pattern, '<sup>$1</sup>')
    
    if ($cleanContent.Length -ne $originalLength) {
        Set-Content -Path $FilePath -Value $cleanContent -Encoding UTF8 -NoNewline
        $saved = $originalLength - $cleanContent.Length
        Write-Host "  [OK] $([System.IO.Path]::GetFileName($FilePath)) - $saved bytes limpiados" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "  [--] $([System.IO.Path]::GetFileName($FilePath)) - Sin cambios necesarios" -ForegroundColor Gray
        return $false
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LIMPIEZA DE NOTAS INLINE EN HTML" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$htmlFiles = Get-ChildItem -Path $ChapterDir -Filter "Capitulo*.html" | Sort-Object Name
$totalCleaned = 0

foreach ($file in $htmlFiles) {
    if (Clean-InlineNotes -FilePath $file.FullName) {
        $totalCleaned++
    }
}

Write-Host "`n----------------------------------------" -ForegroundColor Cyan
Write-Host "Total archivos limpiados: $totalCleaned de $($htmlFiles.Count)" -ForegroundColor Yellow
Write-Host "----------------------------------------`n" -ForegroundColor Cyan

if ($totalCleaned -gt 0) {
    Write-Host "Listo! Ahora puedes hacer commit de los cambios." -ForegroundColor Green
}
