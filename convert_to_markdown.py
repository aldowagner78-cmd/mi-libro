#!/usr/bin/env python3
"""
Convierte todos los DOCX a Markdown editable.
"""

import mammoth
import re
from pathlib import Path

def docx_to_markdown(docx_path, md_path):
    """Convierte un DOCX a Markdown limpio."""
    
    print(f"📄 Convirtiendo: {docx_path.name}")
    
    # Convertir con Mammoth
    with open(docx_path, "rb") as f:
        result = mammoth.convert_to_html(f)
        html = result.value
    
    # Convertir HTML a Markdown
    markdown = html_to_markdown(html)
    
    # Guardar
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(markdown)
    
    print(f"   ✅ Guardado: {md_path.name}")
    
    return len(markdown)

def html_to_markdown(html):
    """Convierte HTML simple a Markdown."""
    
    md = html
    
    # Títulos
    md = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1\n', md, flags=re.DOTALL)
    md = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1\n', md, flags=re.DOTALL)
    md = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1\n', md, flags=re.DOTALL)
    
    # Negrita
    md = re.sub(r'<strong>(.*?)</strong>', r'**\1**', md, flags=re.DOTALL)
    md = re.sub(r'<b>(.*?)</b>', r'**\1**', md, flags=re.DOTALL)
    
    # Cursiva
    md = re.sub(r'<em>(.*?)</em>', r'*\1*', md, flags=re.DOTALL)
    md = re.sub(r'<i>(.*?)</i>', r'*\1*', md, flags=re.DOTALL)
    
    # Superíndice - IMPORTANTE para las referencias
    md = re.sub(r'<sup>(.*?)</sup>', r'^[\1]', md, flags=re.DOTALL)
    
    # Subíndice
    md = re.sub(r'<sub>(.*?)</sub>', r'~\1~', md, flags=re.DOTALL)
    
    # Párrafos
    md = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n\n', md, flags=re.DOTALL)
    
    # Limpiar otros tags HTML
    md = re.sub(r'<[^>]+>', '', md)
    
    # Limpiar entidades HTML
    md = md.replace('&quot;', '"')
    md = md.replace('&amp;', '&')
    md = md.replace('&lt;', '<')
    md = md.replace('&gt;', '>')
    md = md.replace('&nbsp;', ' ')
    
    # Limpiar espacios múltiples
    md = re.sub(r'\n\n\n+', '\n\n', md)
    md = md.strip()
    
    return md

def main():
    print("="*70)
    print("🔄 CONVERSIÓN DOCX → MARKDOWN")
    print("="*70)
    
    # Crear carpeta para Markdown
    md_dir = Path("capitulos_md")
    md_dir.mkdir(exist_ok=True)
    
    # Convertir todos los DOCX
    capitulos_dir = Path("capitulos")
    docx_files = sorted(capitulos_dir.glob("*.docx"))
    
    total_chars = 0
    
    for docx_file in docx_files:
        md_file = md_dir / f"{docx_file.stem}.md"
        try:
            chars = docx_to_markdown(docx_file, md_file)
            total_chars += chars
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    print("\n" + "="*70)
    print(f"✅ COMPLETADO: {len(docx_files)} archivos convertidos")
    print(f"📝 Total caracteres: {total_chars:,}")
    print(f"📂 Archivos en: {md_dir.absolute()}")
    print("="*70)
    print("\n💡 Ahora puedes editar los archivos .md con cualquier editor")
    print("   y yo puedo modificarlos directamente!")

if __name__ == "__main__":
    main()
