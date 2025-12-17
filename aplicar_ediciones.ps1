# Script para aplicar ediciones desde el JSON exportado
param(
    [string]$JsonFile = "ediciones_libro_2025-12-17.json"
)

if (-not (Test-Path $JsonFile)) {
    Write-Host "Error: No se encuentra el archivo $JsonFile" -ForegroundColor Red
    exit 1
}

# Leer el JSON
$ediciones = Get-Content $JsonFile -Raw -Encoding UTF8 | ConvertFrom-Json

$cambiosAplicados = 0

# Procesar cada edición
foreach ($prop in $ediciones.PSObject.Properties) {
    $key = $prop.Name
    $nuevoContenido = $prop.Value
    
    Write-Host "`nProcesando: $key" -ForegroundColor Cyan
    
    # Parsear la clave (ej: "cap1_p1" o "sec_introduccion_p0")
    if ($key -match '^cap(\d+)_p(\d+)$') {
        $capNum = [int]$matches[1]
        $parrafoIndex = [int]$matches[2]
        $archivo = "capitulos_html\Capitulo $($capNum.ToString('00')).html"
    }
    elseif ($key -match '^sec_([^_]+)_p(\d+)$') {
        $seccion = $matches[1]
        $parrafoIndex = [int]$matches[2]
        # Mapear nombre de sección a archivo
        $secciones = @{
            'introduccion' = 'capitulos_html\Introducción.html'
            'epilogo' = 'capitulos_html\Epílogo.html'
            'agradecimientos' = 'capitulos_html\Agradecimientos.html'
        }
        $archivo = $secciones[$seccion]
    }
    else {
        Write-Host "  ⚠️ Clave no reconocida: $key" -ForegroundColor Yellow
        continue
    }
    
    if (-not (Test-Path $archivo)) {
        Write-Host "  ⚠️ Archivo no encontrado: $archivo" -ForegroundColor Yellow
        continue
    }
    
    # Leer el archivo HTML
    $html = Get-Content $archivo -Raw -Encoding UTF8
    
    # Limpiar el contenido nuevo (quitar botones de eliminar que se pudieron colar)
    $nuevoContenidoLimpio = $nuevoContenido -replace '<button class="delete-paragraph-btn"[^>]*>.*?</button>', ''
    
    if ($nuevoContenidoLimpio.Trim() -eq '') {
        Write-Host '  ℹ️ Contenido vacío, párrafo marcado para eliminar (no implementado)' -ForegroundColor Yellow
        continue
    }
    
    # Encontrar todos los <p>...</p> en el archivo
    $pattern = '<p>.*?</p>'
    $matches = [regex]::Matches($html, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    if ($parrafoIndex -ge $matches.Count) {
        Write-Host "  ⚠️ Índice $parrafoIndex fuera de rango (hay $($matches.Count) párrafos)" -ForegroundColor Yellow
        continue
    }
    
    $parrafoViejo = $matches[$parrafoIndex].Value
    $parrafoNuevo = '<p>' + $nuevoContenidoLimpio + '</p>'
    
    # Reemplazar
    $htmlNuevo = $html.Replace($parrafoViejo, $parrafoNuevo)
    
    if ($html -eq $htmlNuevo) {
        Write-Host "  ⚠️ No se detectaron cambios" -ForegroundColor Yellow
    }
    else {
        # Guardar
        $htmlNuevo | Set-Content $archivo -Encoding UTF8 -NoNewline
        Write-Host "  ✅ Aplicado en: $archivo (párrafo $parrafoIndex)" -ForegroundColor Green
        $cambiosAplicados++
    }
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Total de cambios aplicados: $cambiosAplicados" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
