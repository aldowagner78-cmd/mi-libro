#!/usr/bin/env python3
"""
Encuentra y corrige referencias a notas que no tienen formato ^[N].
"""

import re
from pathlib import Path

def find_and_fix_references(md_path):
    """Encuentra referencias (N) sin ^[ y las corrige."""
    
    print(f"\n📄 {md_path.name}")
    
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar sección de notas
    if "**NOTAS DEL CAPÍTULO" not in content:
        print(f"   ℹ️  Sin notas")
        return False
    
    parts = content.split("**NOTAS DEL CAPÍTULO", maxsplit=1)
    texto_principal = parts[0]
    notas_seccion = "**NOTAS DEL CAPÍTULO" + parts[1]
    
    # Buscar todas las referencias (N) en el texto principal que NO tengan ^[ antes
    # Patrones problemáticos:
    # 1. **texto (N)** - dentro de negritas
    # 2. texto (N) - sin formato alguno
    # 3. texto(N) - pegado sin espacio
    
    problemas = []
    
    # Patrón 1: **texto (N)**
    pattern1 = r'\*\*([^*]+?)\s+\((\d+)\)\*\*'
    matches1 = list(re.finditer(pattern1, texto_principal))
    for m in matches1:
        problemas.append({
            'tipo': 'dentro de negrita',
            'original': m.group(0),
            'texto': m.group(1),
            'num': m.group(2),
            'nuevo': f'**{m.group(1)}**^[{m.group(2)}]'
        })
    
    # Patrón 2: texto (N) sin ^[ antes (no dentro de ** ni después de ^)
    pattern2 = r'(?<!\^)(?<!\*)\b(\w+)\s+\((\d+)\)(?!\*)'
    matches2 = list(re.finditer(pattern2, texto_principal))
    for m in matches2:
        # Verificar que no sea parte de una nota ya formateada
        before = texto_principal[max(0, m.start()-5):m.start()]
        if '^[' not in before:
            problemas.append({
                'tipo': 'sin formato',
                'original': m.group(0),
                'texto': m.group(1),
                'num': m.group(2),
                'nuevo': f'{m.group(1)}^[{m.group(2)}]'
            })
    
    # Patrón 3: texto(N) pegado
    pattern3 = r'(?<!\^)(?<!\*)\b(\w+)\((\d+)\)(?!\*)'
    matches3 = list(re.finditer(pattern3, texto_principal))
    for m in matches3:
        before = texto_principal[max(0, m.start()-5):m.start()]
        if '^[' not in before:
            problemas.append({
                'tipo': 'pegado',
                'original': m.group(0),
                'texto': m.group(1),
                'num': m.group(2),
                'nuevo': f'{m.group(1)}^[{m.group(2)}]'
            })
    
    if not problemas:
        print(f"   ✅ Todas las referencias tienen formato correcto")
        return False
    
    print(f"   ⚠️  Encontrados {len(problemas)} problemas:")
    
    # Aplicar correcciones
    texto_corregido = texto_principal
    
    for p in problemas:
        print(f"      • {p['tipo']}: '{p['original']}' → '{p['nuevo']}'")
        texto_corregido = texto_corregido.replace(p['original'], p['nuevo'], 1)
    
    # Guardar
    nuevo_content = texto_corregido + notas_seccion
    
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(nuevo_content)
    
    print(f"   ✅ Corregido")
    return True

def main():
    print("="*70)
    print("🔍 BUSCANDO Y CORRIGIENDO REFERENCIAS MAL FORMATEADAS")
    print("="*70)
    
    md_dir = Path("capitulos_md")
    md_files = sorted(md_dir.glob("*.md"))
    
    corregidos = 0
    
    for md_file in md_files:
        try:
            if find_and_fix_references(md_file):
                corregidos += 1
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*70)
    print(f"✅ COMPLETADO: {corregidos} archivos corregidos")
    print("="*70)

if __name__ == "__main__":
    main()
