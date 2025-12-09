#!/usr/bin/env python3
"""
Genera instrucciones específicas de dónde agregar superíndices.
"""

import mammoth
import re
from pathlib import Path

def find_note_keywords(docx_path):
    """Encuentra las palabras clave de cada nota para ubicarlas en el texto."""
    
    chapter_name = Path(docx_path).stem
    
    # Convertir con Mammoth
    with open(docx_path, "rb") as f:
        result = mammoth.convert_to_html(f)
        html = result.value
    
    # Buscar notas
    if "NOTAS DEL" not in html:
        return None
    
    parts = re.split(r'<p><strong>NOTAS DEL[^<]*</strong></p>', html, maxsplit=1)
    if len(parts) != 2:
        return None
    
    content_html = parts[0]
    notes_html = parts[1]
    
    # Extraer notas
    pattern = r'<p><strong>\((\d+)\)\s+([^:]+?):</strong>'
    matches = re.finditer(pattern, notes_html)
    
    notas = {}
    for match in matches:
        num = match.group(1)
        keyword = match.group(2).strip()
        notas[num] = keyword
    
    if not notas:
        return None
    
    # Convertir HTML a texto plano para buscar
    content_text = re.sub(r'<[^>]+>', '', content_html)
    content_text = content_text.replace('&quot;', '"').replace('&amp;', '&')
    
    return {
        'chapter': chapter_name,
        'notas': notas,
        'content': content_text
    }

def generate_instructions():
    """Genera instrucciones para cada capítulo."""
    
    print("="*80)
    print("📝 INSTRUCCIONES PARA AGREGAR SUPERÍNDICES")
    print("="*80)
    
    capitulos_dir = Path("capitulos")
    
    for num in [3, 4, 5]:
        docx_file = capitulos_dir / f"Capitulo 0{num}.docx"
        
        if not docx_file.exists():
            continue
        
        data = find_note_keywords(docx_file)
        
        if not data:
            continue
        
        print(f"\n{'='*80}")
        print(f"📄 CAPÍTULO {num}")
        print('='*80)
        
        notas = data['notas']
        content = data['content']
        
        print(f"\n✅ Este capítulo tiene {len(notas)} notas")
        print(f"\n📍 INSTRUCCIONES:")
        print(f"   1. Abre: capitulos/Capitulo 0{num}.docx")
        print(f"   2. Usa Ctrl+F (Buscar) para encontrar cada palabra clave")
        print(f"   3. Después de la palabra clave, agrega (N) en SUPERÍNDICE")
        print(f"   4. Para superíndice: selecciona (N) y presiona Ctrl+Shift+=")
        
        print(f"\n🔍 BUSCA Y AGREGA:")
        
        for num_nota in sorted(notas.keys(), key=int):
            keyword = notas[num_nota]
            
            # Buscar la palabra clave en el contenido
            if keyword.lower() in content.lower():
                # Encontrar contexto (50 chars antes y después)
                idx = content.lower().find(keyword.lower())
                start = max(0, idx - 50)
                end = min(len(content), idx + len(keyword) + 50)
                contexto = content[start:end].strip()
                
                # Limpiar
                contexto = ' '.join(contexto.split())
                
                print(f"\n   ({num_nota}) Busca: \"{keyword}\"")
                print(f"       Contexto: ...{contexto}...")
                print(f"       👉 Después de \"{keyword}\" agregar: ^({num_nota}) en superíndice")
            else:
                print(f"\n   ({num_nota}) Busca manualmente: \"{keyword}\"")
                print(f"       👉 Agregar: ^({num_nota}) en superíndice")
        
        print(f"\n" + "-"*80)

def main():
    generate_instructions()
    
    print("\n" + "="*80)
    print("💡 TIPS:")
    print("="*80)
    print("• Usa Ctrl+F en Word para buscar las palabras clave")
    print("• Selecciona el número (1) y presiona Ctrl+Shift+= para hacerlo superíndice")
    print("• Guarda cada archivo después de editarlo")
    print("• Luego ejecuta: python convert_chapters.py")
    print("="*80)

if __name__ == "__main__":
    main()
