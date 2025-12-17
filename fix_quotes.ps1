$files = Get-ChildItem "capitulos_html\Capitulo*.html"
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $newContent = $content -replace '<div class="epigraph"><p>(<em>"[^"]+?"</em>)<br>\r?\n( [^<]+)</p></div>', '<div class="epigraph"><p>$1</p><p class="author">$2</p></div>'
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        $count++
        Write-Host "OK: $($file.Name)" -ForegroundColor Green
    }
}
Write-Host "Archivos actualizados: $count" -ForegroundColor Green
