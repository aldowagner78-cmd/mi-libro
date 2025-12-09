#!/usr/bin/env python3
"""
Convierte archivos DOCX a HTML y extrae las notas al pie
estructuradas en formato JSON para el lector web.
"""

import mammoth
import json
import os
import re
from pathlib import Path

def extract_notes_from_html(html):
    """
    Extrae las notas del HTML generado por Mammoth.
    Busca la sección que contiene "NOTAS DEL CAPÍTULO" y parsea cada nota.
    Maneja múltiples formatos:
    - <p><sup>(1)</sup> <strong>Título:</strong> contenido...</p>
    - <p><strong>(1) Título:</strong> contenido...</p>
    """
    notes = {}
    
    # Buscar sección de notas
    if "NOTAS DEL CAPÍTULO" in html or "NOTAS DEL" in html:
        # Separar por la sección de notas
        parts = re.split(r'<p><strong>NOTAS DEL[^<]*</strong></p>', html, maxsplit=1)
        
        if len(parts) == 2:
            content_html = parts[0]
            notes_html = parts[1]
            
            # Formato 1: <p><sup>(N)</sup> <strong>...</strong> contenido</p>
            pattern1 = r'<p><sup>\((\d+)\)</sup>\s*(.*?)</p>'
            matches1 = re.finditer(pattern1, notes_html, re.DOTALL)
            
            for match in matches1:
                note_num = match.group(1)
                note_content = match.group(2).strip()
                notes[note_num] = note_content
            
            # Formato 2: <p><strong>(N) Título:</strong> contenido</p>
            pattern2 = r'<p><strong>\((\d+)\)\s+([^<]+?):</strong>\s*(.*?)</p>'
            matches2 = re.finditer(pattern2, notes_html, re.DOTALL)
            
            for match in matches2:
                note_num = match.group(1)
                title = match.group(2).strip()
                content = match.group(3).strip()
                # Reconstruir con formato consistente
                note_content = f"<strong>{title}:</strong> {content}"
                notes[note_num] = note_content
                
            return content_html, notes
    
    return html, notes

def convert_chapter(docx_path, output_dir):
    """Convierte un capítulo DOCX a HTML + JSON con notas."""
    
    chapter_name = Path(docx_path).stem
    print(f"\n📄 Procesando: {chapter_name}")
    
    # Convertir DOCX a HTML con Mammoth
    with open(docx_path, "rb") as docx_file:
        result = mammoth.convert_to_html(
            docx_file,
            style_map="""
                p[style-name='Footnote Text'] => p.footnote
                p[style-name='Note'] => p.footnote
            """
        )
        html = result.value
        
        # Reportar warnings
        if result.messages:
            print(f"  ⚠️  Warnings: {len(result.messages)}")
    
    # Extraer contenido y notas
    content_html, notes = extract_notes_from_html(html)
    
    print(f"  ✅ Notas encontradas: {len(notes)}")
    if notes:
        print(f"     Números: {', '.join(sorted(notes.keys(), key=int))}")
    
    # Guardar HTML del contenido (sin notas)
    html_file = output_dir / f"{chapter_name}.html"
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content_html)
    
    # Guardar notas en JSON
    json_file = output_dir / f"{chapter_name}_notas.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
    
    return len(notes)

def main():
    """Convierte todos los capítulos."""
    
    print("=" * 60)
    print("🔄 CONVERSIÓN DE CAPÍTULOS DOCX → HTML + JSON")
    print("=" * 60)
    
    # Directorios
    capitulos_dir = Path("capitulos")
    output_dir = Path("capitulos_html")
    output_dir.mkdir(exist_ok=True)
    
    # Procesar cada archivo DOCX
    docx_files = sorted(capitulos_dir.glob("*.docx"))
    total_notes = 0
    
    for docx_file in docx_files:
        try:
            notes_count = convert_chapter(docx_file, output_dir)
            total_notes += notes_count
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
    
    print("\n" + "=" * 60)
    print(f"✅ COMPLETADO: {len(docx_files)} capítulos procesados")
    print(f"📝 Total de notas extraídas: {total_notes}")
    print(f"📂 Archivos guardados en: {output_dir.absolute()}")
    print("=" * 60)

if __name__ == "__main__":
    main()
