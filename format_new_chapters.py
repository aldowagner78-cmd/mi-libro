import re

capitulos = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]

for num in capitulos:
    md_path = f'capitulos_md/Capitulo {num:02d}.md'
    
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Eliminar escapes
    content = re.sub(r'\\([.,!?;:()\[\]])', r'\1', content)
    
    # Cambiar INTERLUDIO de * o ** a ***
    content = re.sub(r'\*+INTERLUDIO ([XVI]+): ([^\*]+)\*+', r'***INTERLUDIO \1: \2***', content)
    
    # Buscar línea del autor (— **Nombre.**)
    # Cambiar la línea siguiente (cita) para que esté en cursiva si no lo está
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        
        # Si la línea es el autor (— **...**)
        if re.match(r'^— \*\*[^*]+\*\*', line):
            # La siguiente línea debería ser la cita en cursiva
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                # Si no está vacía y no empieza con *, agregarla con *
                if next_line.strip() and not next_line.strip().startswith('*'):
                    # Si no termina con *, es la cita sin formato
                    new_lines.append(f'*{next_line.strip()}*')
                    i += 2  # Saltar la línea original
                    continue
        i += 1
    
    content = '\n'.join(new_lines)
    
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'✅ Capitulo {num:02d} formateado')

print(f'\n🎉 {len(capitulos)} capítulos listos con formato correcto')
