# Script para comprimir imágenes PNG optimizando calidad y tamaño
Add-Type -AssemblyName System.Drawing

$inputFolder = "imagenes"
$outputFolder = "imagenes_comprimidas"
$maxWidth = 800  # Ancho máximo para optimizar carga web

# Crear carpeta de salida si no existe
if (-not (Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder | Out-Null
}

# Codec para PNG con compresión
$codecInfo = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/png' }

# Procesar cada imagen PNG
Get-ChildItem $inputFolder -Filter *.png | ForEach-Object {
    $inputPath = $_.FullName
    $outputPath = Join-Path $outputFolder $_.Name
    
    Write-Host "Comprimiendo: $($_.Name)" -ForegroundColor Cyan
    
    try {
        # Cargar imagen original
        $img = [System.Drawing.Image]::FromFile($inputPath)
        $originalSize = (Get-Item $inputPath).Length / 1MB
        
        # Calcular nuevas dimensiones manteniendo aspecto
        $ratio = $img.Height / $img.Width
        $newWidth = [Math]::Min($maxWidth, $img.Width)
        $newHeight = [int]($newWidth * $ratio)
        
        # Crear nueva imagen redimensionada
        $bitmap = New-Object System.Drawing.Bitmap $newWidth, $newHeight
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # Configurar calidad de redimensionado
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        # Dibujar imagen redimensionada
        $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        # Guardar con compresión
        $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Limpiar recursos
        $graphics.Dispose()
        $bitmap.Dispose()
        $img.Dispose()
        
        $newSize = (Get-Item $outputPath).Length / 1MB
        $reduction = [Math]::Round((1 - ($newSize / $originalSize)) * 100, 2)
        
        Write-Host "  Original: $([Math]::Round($originalSize, 2)) MB → Comprimida: $([Math]::Round($newSize, 2)) MB (Reducción: $reduction%)" -ForegroundColor Green
        
    } catch {
        Write-Host "  Error procesando $($_.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`nProceso completado. Revisa la carpeta '$outputFolder' para ver las imágenes comprimidas." -ForegroundColor Yellow
Write-Host "Si estás satisfecho con los resultados, ejecuta:" -ForegroundColor Yellow
Write-Host "  Remove-Item imagenes\*.png; Move-Item imagenes_comprimidas\*.png imagenes\" -ForegroundColor Cyan
