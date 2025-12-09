#!/usr/bin/env python3
"""
Agrega superíndices a las referencias en los archivos Markdown.
"""

import re
from pathlib import Path

def add_superscripts_to_md(md_path):
    """Agrega superíndices ^[N] a las referencias (N) antes de la sección de notas."""
    
    print(f"\n📄 Procesando: {md_path.name}")
    
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar la sección de notas
    notas_match = re.search(r'\*\*NOTAS DEL CAPÍTULO', content)
    
    if not notas_match:
        print(f"   ℹ️  Sin sección de notas")
        return False
    
    notas_start = notas_match.start()
    texto_principal = content[:notas_start]
    seccion_notas = content[notas_start:]
    
    # Contar referencias actuales (sin superíndice)
    refs_sin_super = re.findall(r'(?<!\^)\((\d+)\)', texto_principal)
    refs_con_super = re.findall(r'\^\[(\d+)\]', texto_principal)
    
    print(f"   📌 Referencias sin superíndice: {len(refs_sin_super)}")
    print(f"   ✅ Referencias ya con superíndice: {len(refs_con_super)}")
    
    if len(refs_sin_super) == 0:
        print(f"   ✓ Ya tiene todos los superíndices")
        return False
    
    # Reemplazar (N) por ^[(N)] solo en el texto principal
    # Pero NO dentro de **(texto)** o en títulos
    
    def replacer(match):
        # Verificar contexto: no reemplazar si está dentro de ** **
        before = texto_principal[max(0, match.start()-10):match.start()]
        if '**' in before and '**' not in before[before.rfind('**')+2:]:
            return match.group(0)  # Dentro de negrita, no cambiar
        return f'^[{match.group(1)}]'
    
    texto_modificado = re.sub(r'\((\d+)\)', replacer, texto_principal)
    
    nuevo_contenido = texto_modificado + seccion_notas
    
    # Guardar
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(nuevo_contenido)
    
    print(f"   ✅ Agregados {len(refs_sin_super)} superíndices")
    return True

def main():
    print("="*70)
    print("🔄 AGREGANDO SUPERÍNDICES A MARKDOWN")
    print("="*70)
    
    md_dir = Path("capitulos_md")
    md_files = sorted(md_dir.glob("*.md"))
    
    modificados = 0
    
    for md_file in md_files:
        try:
            if add_superscripts_to_md(md_file):
                modificados += 1
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    print("\n" + "="*70)
    print(f"✅ COMPLETADO: {modificados} archivos modificados")
    print("="*70)

if __name__ == "__main__":
    main()
