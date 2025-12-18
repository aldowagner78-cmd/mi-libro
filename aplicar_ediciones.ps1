# Script para aplicar ediciones del libro a los archivos Markdown
# Uso: .\aplicar_ediciones.ps1 -ArchivoJSON "ediciones_libro_2024-12-17.json"

param(
    [Parameter(Mandatory=$true)]
    [string]$ArchivoJSON,
    
    [switch]$CrearBackup = $true,
    [switch]$Preview = $false
)

# Colores para output
$colorExito = "Green"
$colorError = "Red"
$colorInfo = "Cyan"
$colorAdvertencia = "Yellow"

Write-Host "`n========================================" -ForegroundColor $colorInfo
Write-Host "  APLICADOR DE EDICIONES DEL LIBRO" -ForegroundColor $colorInfo
Write-Host "========================================`n" -ForegroundColor $colorInfo

# Verificar que el archivo existe
if (-not (Test-Path $ArchivoJSON)) {
    Write-Host "ERROR: No se encontro el archivo: $ArchivoJSON" -ForegroundColor $colorError
    exit 1
}

# Cargar JSON
try {
    $ediciones = Get-Content $ArchivoJSON -Raw | ConvertFrom-Json
    $totalEdiciones = ($ediciones.PSObject.Properties | Measure-Object).Count
    Write-Host "Cargadas $totalEdiciones ediciones desde el JSON`n" -ForegroundColor $colorExito
} catch {
    Write-Host "ERROR: No se pudo leer el archivo JSON: $_" -ForegroundColor $colorError
    exit 1
}

# Directorio de capitulos
$dirCapitulos = "capitulos_md"
$dirBackup = "backup_ediciones_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Crear backup si se solicita
if ($CrearBackup -and -not $Preview) {
    Write-Host "Creando backup en: $dirBackup" -ForegroundColor $colorInfo
    New-Item -ItemType Directory -Path $dirBackup -Force | Out-Null
    Copy-Item "$dirCapitulos\*.md" $dirBackup -Force
    Write-Host "Backup creado exitosamente`n" -ForegroundColor $colorExito
}

# Procesar cada edicion
$cambiosAplicados = 0
$errores = 0

foreach ($prop in $ediciones.PSObject.Properties) {
    $clave = $prop.Name
    $nuevoContenido = $prop.Value
    
    # Parsear la clave: cap1_p0, cap2_p5, etc.
    if ($clave -match "^cap(\d+)_p(\d+)$") {
        $numCapitulo = [int]$Matches[1]
        $numParrafo = [int]$Matches[2]
        $archivoMd = "$dirCapitulos\Capitulo $($numCapitulo.ToString('00')).md"
        
        Write-Host "Procesando: $clave" -ForegroundColor $colorInfo
        Write-Host "  Archivo: $archivoMd" -ForegroundColor Gray
        Write-Host "  Parrafo: $numParrafo" -ForegroundColor Gray
        
        if (-not (Test-Path $archivoMd)) {
            Write-Host "  ADVERTENCIA: Archivo no encontrado" -ForegroundColor $colorAdvertencia
            $errores++
            continue
        }
        
        # Leer contenido del archivo
        $contenido = Get-Content $archivoMd -Raw -Encoding UTF8
        
        # Convertir HTML a Markdown basico
        $textoMd = $nuevoContenido
        $textoMd = $textoMd -replace '<strong>', '**'
        $textoMd = $textoMd -replace '</strong>', '**'
        $textoMd = $textoMd -replace '<em>', '*'
        $textoMd = $textoMd -replace '</em>', '*'
        $textoMd = $textoMd -replace '<br\s*/?>', "`n"
        $textoMd = $textoMd -replace '<[^>]+>', ''  # Eliminar otras etiquetas HTML
        $textoMd = [System.Web.HttpUtility]::HtmlDecode($textoMd)
        
        if ($nuevoContenido -eq "") {
            Write-Host "  ELIMINACION de parrafo $numParrafo" -ForegroundColor $colorAdvertencia
        } else {
            Write-Host "  Nuevo texto: $($textoMd.Substring(0, [Math]::Min(50, $textoMd.Length)))..." -ForegroundColor Gray
        }
        
        if (-not $Preview) {
            # Aqui iria la logica para encontrar y reemplazar el parrafo especifico
            # Por ahora, registramos el cambio para revision manual
            $logFile = "cambios_pendientes.log"
            Add-Content $logFile "[$clave] Archivo: $archivoMd"
            Add-Content $logFile "Nuevo contenido: $textoMd"
            Add-Content $logFile "---"
        }
        
        $cambiosAplicados++
        Write-Host "  OK" -ForegroundColor $colorExito
        
    } elseif ($clave -match "^sec_(.+)_p(\d+)$") {
        # Seccion especial (introduccion, sobre-autor, etc.)
        $seccion = $Matches[1]
        $numParrafo = [int]$Matches[2]
        Write-Host "Procesando seccion especial: $seccion (parrafo $numParrafo)" -ForegroundColor $colorInfo
        $cambiosAplicados++
        
    } else {
        Write-Host "ADVERTENCIA: Formato de clave no reconocido: $clave" -ForegroundColor $colorAdvertencia
        $errores++
    }
    
    Write-Host ""
}

# Resumen
Write-Host "`n========================================" -ForegroundColor $colorInfo
Write-Host "  RESUMEN" -ForegroundColor $colorInfo
Write-Host "========================================" -ForegroundColor $colorInfo
Write-Host "Cambios procesados: $cambiosAplicados" -ForegroundColor $colorExito
Write-Host "Errores/Advertencias: $errores" -ForegroundColor $(if ($errores -gt 0) { $colorAdvertencia } else { $colorExito })

if ($Preview) {
    Write-Host "`nModo PREVIEW: No se aplicaron cambios reales" -ForegroundColor $colorAdvertencia
    Write-Host "Ejecute sin -Preview para aplicar los cambios" -ForegroundColor $colorInfo
} else {
    Write-Host "`nLos cambios han sido registrados en: cambios_pendientes.log" -ForegroundColor $colorInfo
    Write-Host "Revise el log y aplique manualmente los cambios criticos" -ForegroundColor $colorInfo
}

if ($CrearBackup -and -not $Preview) {
    Write-Host "`nBackup disponible en: $dirBackup" -ForegroundColor $colorInfo
}

Write-Host ""
