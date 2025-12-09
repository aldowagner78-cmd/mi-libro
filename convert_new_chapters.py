import mammoth
import re

capitulos = [20, 21, 22, 23, 24]

for num in capitulos:
    docx_path = f'capitulos/Capitulo {num:02d}.docx'
    md_path = f'capitulos_md/Capitulo {num:02d}.md'
    
    # Convertir DOCX a Markdown
    with open(docx_path, 'rb') as docx_file:
        result = mammoth.convert_to_markdown(docx_file)
        content = result.value
    
    # Limpiar formato
    # Cambiar __ a **
    content = content.replace('__', '**')
    
    # Eliminar escapes de puntos
    content = re.sub(r'\\\.', '.', content)
    
    # Eliminar otros escapes comunes
    content = re.sub(r'\\,', ',', content)
    content = re.sub(r'\\!', '!', content)
    content = re.sub(r'\\?', '?', content)
    content = re.sub(r'\\;', ';', content)
    content = re.sub(r'\\:', ':', content)
    content = re.sub(r'\\\(', '(', content)
    content = re.sub(r'\\\)', ')', content)
    
    # Guardar
    with open(md_path, 'w', encoding='utf-8') as md_file:
        md_file.write(content)
    
    print(f'✅ Capitulo {num:02d} convertido')

print(f'\n🎉 Convertidos {len(capitulos)} capítulos')
