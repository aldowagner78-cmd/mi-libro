#!/usr/bin/env python3
"""
Estandariza el formato de las notas en los archivos Markdown.
"""

import re
from pathlib import Path

def fix_notes_format(md_path):
    """Arregla el formato de las notas para que sea consistente."""
    
    print(f"\n📄 Procesando: {md_path.name}")
    
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar sección de notas
    if "**NOTAS DEL CAPÍTULO" not in content:
        print(f"   ℹ️  Sin notas")
        return False
    
    parts = content.split("**NOTAS DEL CAPÍTULO", maxsplit=1)
    texto_principal = parts[0]
    titulo_y_notas = parts[1]
    
    # Separar título de notas
    lines = titulo_y_notas.split('\n', maxsplit=2)
    titulo_nota = lines[0] if len(lines) > 0 else ""
    notas_text = lines[2] if len(lines) > 2 else lines[1] if len(lines) > 1 else ""
    
    # Arreglar formato de cada nota
    # Cambiar ^[(N)] o ^[ (N)] por formato estándar
    notas_text = re.sub(r'\^\s*\[\s*\((\d+)\)\s*\]', r'**(\1)**', notas_text)
    
    # Arreglar espacios antes del ** final en títulos
    notas_text = re.sub(r':\s+\*\*\s*([A-Za-z])', r':** \1', notas_text)
    notas_text = re.sub(r'([a-z])\s+\*\*\s*([A-Z])', r'\1** \2', notas_text)
    
    # Asegurar saltos de línea entre notas
    notas_text = re.sub(r'(\.)(\s*)\*\*\(', r'.\n\n**(',  notas_text)
    
    # Limpiar subíndices ~X~
    notas_text = notas_text.replace('~', '')
    
    # Reconstruir
    nuevo_content = texto_principal + "**NOTAS DEL CAPÍTULO" + titulo_nota + "\n\n" + notas_text.strip()
    
    # Guardar
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(nuevo_content)
    
    print(f"   ✅ Formato de notas estandarizado")
    return True

def main():
    print("="*70)
    print("🔧 ESTANDARIZANDO FORMATO DE NOTAS")
    print("="*70)
    
    md_dir = Path("capitulos_md")
    md_files = sorted(md_dir.glob("*.md"))
    
    modificados = 0
    
    for md_file in md_files:
        try:
            if fix_notes_format(md_file):
                modificados += 1
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    print("\n" + "="*70)
    print(f"✅ COMPLETADO: {modificados} archivos modificados")
    print("="*70)

if __name__ == "__main__":
    main()
