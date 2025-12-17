# Script para arreglar las citas en todos los archivos HTML
Write-Host "Arreglando formato de citas..." -ForegroundColor Cyan

$files = Get-ChildItem "capitulos_html\Capitulo*.html"
$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Eliminar las lineas con ***
    $newContent = $content -replace '<p>\*\*\*</p>\r?\n?', ''
    
    # Aplicar clase CSS a las citas
    $newContent = $newContent -replace '(<p><em>"[^"]+?"</em><br>\r?\n— [^<]+</p>)', '<div class="epigraph">$1</div>'
    
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        $count++
        Write-Host "OK: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Archivos actualizados: $count" -ForegroundColor Green
