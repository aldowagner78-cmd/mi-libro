#!/usr/bin/env python3
"""
Convierte Markdown a HTML + JSON de notas para el lector web.
"""

import markdown
import re
import json
from pathlib import Path

def extract_notes_from_md(md_text):
    """Extrae las notas de un archivo Markdown."""
    
    # Buscar sección de notas (ambos formatos)
    if "**NOTAS DEL CAPÍTULO" not in md_text and "**NOTAS DE AUTOR**" not in md_text:
        return md_text, {}
    
    # Separar por cualquiera de los dos formatos
    if "**NOTAS DEL CAPÍTULO" in md_text:
        parts = md_text.split("**NOTAS DEL CAPÍTULO", maxsplit=1)
    else:
        parts = md_text.split("**NOTAS DE AUTOR**", maxsplit=1)
    
    content = parts[0].strip()
    
    if len(parts) < 2:
        return content, {}
    
    notes_section = parts[1]
    
    notes = {}
    
    # Formato 1: **(N) Título:** Contenido...
    pattern1 = r'\*\*\((\d+)\)\s+([^:*]+?):\*\*\s*(.*?)(?=\n\n\*\*\(|\n\n\^|\Z)'
    matches1 = re.finditer(pattern1, notes_section, re.DOTALL)
    
    for match in matches1:
        num = match.group(1)
        title = match.group(2).strip()
        content_text = match.group(3).strip()
        
        # Limpiar el contenido
        content_text = content_text.replace('\n', ' ')
        content_text = ' '.join(content_text.split())
        
        notes[num] = f"<strong>{title}:</strong> {content_text}"
    
    # Formato 2: ^[(N)] **Título:** Contenido...
    pattern2 = r'\^\[\((\d+)\)\]\s+\*\*([^:*]+?):\*\*\s*(.*?)(?=\n\n\^|\n\n\*\*|\Z)'
    matches2 = re.finditer(pattern2, notes_section, re.DOTALL)
    
    for match in matches2:
        num = match.group(1)
        title = match.group(2).strip()
        content_text = match.group(3).strip()
        
        # Limpiar el contenido
        content_text = content_text.replace('\n', ' ')
        content_text = ' '.join(content_text.split())
        content_text = content_text.replace('~', '')  # Limpiar subíndices
        
        notes[num] = f"<strong>{title}:</strong> {content_text}"
    
    return content, notes

def md_to_html_with_notes(md_path, html_path, json_path):
    """Convierte Markdown a HTML y extrae notas a JSON."""
    
    chapter_name = md_path.stem
    print(f"\n📄 Procesando: {chapter_name}")
    
    # Leer Markdown
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()
    
    # Extraer notas
    content_md, notes = extract_notes_from_md(md_text)
    
    # Limpiar ^[ ] sobrantes (espacios vacíos)
    content_md = re.sub(r'\^\[\s*\]', '', content_md)
    
    # Usar marcador HTML comment que Markdown no procesa
    content_md = re.sub(r'\^\[(\d+)\]', r'<!--SUPREF:\1-->', content_md)
    
    # Convertir Markdown a HTML
    md_converter = markdown.Markdown(extensions=['extra', 'nl2br'])
    html = md_converter.convert(content_md)
    
    # Reemplazar comentarios por <sup> tags
    html = re.sub(r'<!--SUPREF:(\d+)-->', r'<sup>(\1)</sup>', html)
    
    # Limpiar cualquier ^[ ] sobrante alrededor de los SUP
    html = re.sub(r'\^\s*\[\s*(<sup>\(\d+\)</sup>)\s*\]', r'\1', html)
    
    # Guardar HTML
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    # Guardar notas en JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
    
    print(f"   ✅ HTML: {len(html)} chars")
    print(f"   ✅ Notas: {len(notes)}")
    if notes:
        print(f"      Números: {', '.join(sorted(notes.keys(), key=int))}")
    
    return len(notes)

def main():
    print("="*70)
    print("🔄 CONVERSIÓN MARKDOWN → HTML + JSON")
    print("="*70)
    
    md_dir = Path("capitulos_md")
    html_dir = Path("capitulos_html")
    html_dir.mkdir(exist_ok=True)
    
    md_files = sorted(md_dir.glob("*.md"))
    total_notes = 0
    
    for md_file in md_files:
        html_file = html_dir / f"{md_file.stem}.html"
        json_file = html_dir / f"{md_file.stem}_notas.json"
        
        try:
            notes_count = md_to_html_with_notes(md_file, html_file, json_file)
            total_notes += notes_count
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    print("\n" + "="*70)
    print(f"✅ COMPLETADO: {len(md_files)} capítulos procesados")
    print(f"📝 Total de notas: {total_notes}")
    print(f"📂 Archivos en: {html_dir.absolute()}")
    print("="*70)

if __name__ == "__main__":
    main()
