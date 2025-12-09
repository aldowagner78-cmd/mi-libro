import re

capitulos = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]

def clean_encoding(text):
    """Elimina los caracteres de encoding extraños ?*? """
    # Eliminar ?*?*? y ?*? y ? al inicio/entre palabras
    cleaned = re.sub(r'\?+\*?\?*', '', text)
    return cleaned

for num in capitulos:
    md_path = f'capitulos_md/Capitulo {num}.md'
    
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Limpiar encoding
        content = clean_encoding(content)
        
        # Guardar limpio
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Capitulo {num} limpiado")
    except Exception as e:
        print(f"❌ Error en Capitulo {num}: {e}")

print("\n🎉 Limpieza completada")
