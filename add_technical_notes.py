import re

# Diccionario de términos técnicos y sus definiciones
TERMINOS = {
    # Cap 2 - Términos ya existentes en el texto
    "Savile Row": "Calle famosa en Londres, Reino Unido, mundialmente reconocida por albergar las mejores sastrerías tradicionales británicas. Un traje de Savile Row es símbolo de estatus, elegancia y artesanía excepcional, con precios que superan los $10,000 USD.",
    
    "nanosatélites": "Satélites miniaturizados con masa entre 1-10 kg. Su pequeño tamaño y bajo costo permiten lanzar constelaciones de cientos de unidades para crear redes de vigilancia global en tiempo real. La tecnología Argus mencionada es ficción, pero constelaciones reales como Starlink ya existen.",
    
    "cortisol": "Hormona del estrés producida por las glándulas suprarrenales. Niveles elevados indican ansiedad, miedo o esfuerzo físico extremo. Los dispositivos biométricos avanzados pueden detectarlo indirectamente mediante variabilidad del ritmo cardíaco y temperatura de la piel.",
    
    "Big Data": "Conjuntos masivos de información tan grandes y complejos que los métodos tradicionales no pueden procesarlos. Incluye datos de redes sociales, transacciones, sensores IoT, etc. Las empresas usan algoritmos de machine learning para extraer patrones y predicciones.",
    
    "conectoma": "Mapa completo de todas las conexiones neuronales en un cerebro. Similar al genoma (mapa del ADN), el conectoma busca entender cómo los 86 mil millones de neuronas humanas se conectan para crear consciencia. Aún no se ha mapeado un cerebro humano completo.",
    
    "fractal": "Patrón geométrico que se repite a diferentes escalas. Ejemplos naturales: coliflor romanesco, helechos, costas. En matemáticas, el fractal de Mandelbrot es famoso. La idea de que 'cada bit contiene el universo entero' sugiere información infinita en espacio finito.",
    
    "engramas": "Huellas físicas de la memoria en el cerebro. Cambios en las sinapsis y proteínas neuronales que codifican experiencias. Concepto propuesto por Richard Semon en 1904. La neurociencia moderna busca identificar y manipular estos 'archivos de memoria' físicos.",
    
    # Cap 8 - Términos de neurociencia y filosofía
    "teología cibernética": "Campo especulativo que explora cómo la tecnología, especialmente la inteligencia artificial y las redes neuronales, podría crear o simular experiencias divinas, consciencia colectiva o entidades que funcionen como 'dioses' emergentes.",
    
    "atmósfera controlada": "Ambiente artificial donde temperatura, humedad, presión y composición del aire se regulan con precisión. Usado en quirófanos, laboratorios de semiconductores, cámaras criogénicas y naves espaciales para proteger equipos sensibles o seres vivos.",
    
    "estasis": "Estado de inactividad metabólica donde las funciones biológicas se ralentizan casi hasta detenerse, preservando el organismo sin envejecimiento significativo. Común en ciencia ficción (hibernación espacial), pero algunos animales (tardigrados, osos) lo logran naturalmente.",
    
    # Cap 9 - Biología y sistemas complejos
    "superorganismo": "Colonia de organismos individuales que funciona como una sola entidad. Ejemplos: colmenas de abejas, hormigueros, colonias de coral. Cada individuo es simple, pero el sistema colectivo muestra inteligencia emergente y toma de decisiones complejas.",
    
    # Cap 10-19 - Términos filosóficos y tecnológicos
    "fenomenología": "Rama de la filosofía fundada por Edmund Husserl que estudia las estructuras de la experiencia y la consciencia. Hegel expandió esto en 'La Fenomenología del Espíritu', explorando cómo la mente humana evoluciona hacia la autoconciencia absoluta.",
    
    "criogénica": "Ciencia que estudia la producción y comportamiento de materiales a temperaturas extremadamente bajas (cerca del cero absoluto, -273°C). A estas temperaturas, algunos materiales se vuelven superconductores y las reacciones químicas se detienen casi por completo.",
    
    "superconductor": "Material que, al enfriarse por debajo de cierta temperatura crítica, pierde toda resistencia eléctrica. La corriente puede fluir eternamente sin pérdida de energía. Usado en imanes de alta potencia (MRI, aceleradores de partículas) y computación cuántica.",
    
    "durée": "Concepto del filósofo Henri Bergson que describe el tiempo tal como lo experimenta la consciencia: fluido, continuo e indivisible, opuesto al tiempo 'espacializado' y medible de los relojes. La durée es el flujo vivido de la experiencia subjetiva.",
    
    "panóptico": "Diseño arquitectónico de prisión ideado por Jeremy Bentham en 1791. Una torre central permite vigilar a todos los prisioneros sin que sepan cuándo son observados. Michel Foucault lo usó como metáfora del control social y la vigilancia en sociedades modernas.",
    
    "IoT (Internet de las Cosas)": "Red de dispositivos físicos (electrodomésticos, vehículos, sensores) conectados a internet, capaces de recopilar y compartir datos. Desde termostatos inteligentes hasta marcapasos conectados. Ofrece conveniencia pero plantea riesgos de privacidad masivos.",
    
    "implante coclear": "Dispositivo médico que se inserta quirúrgicamente en el oído interno para restaurar la audición en personas con sordera profunda. Convierte sonidos en señales eléctricas que estimulan directamente el nervio auditivo. Más de 700,000 personas usan implantes cocleares.",
    
    "código fuente": "Instrucciones escritas por programadores en lenguaje de programación (Python, C++, etc.) que definen cómo funciona un software. Es el 'ADN' de los programas. La analogía con la consciencia sugiere que la mente tiene un 'código' subyacente que puede ser leído.",
    
    "servidor raíz": "En redes de computadoras, el servidor principal que tiene autoridad máxima sobre todos los subsistemas. Controla permisos, configuraciones y puede anular cualquier comando inferior. Similar a 'privilegios de administrador' o 'acceso root' en Unix/Linux.",
}

def agregar_notas_capitulo(num_cap):
    md_path = f'capitulos_md/Capitulo {num_cap:02d}.md'
    
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        print(f'❌ No se pudo leer Capitulo {num_cap:02d}')
        return False
    
    # Verificar si ya tiene notas
    if '**NOTAS' in content:
        print(f'⏭️  Capitulo {num_cap:02d} ya tiene notas')
        return False
    
    # Buscar términos que necesiten notas en este capítulo
    terminos_encontrados = []
    nota_num = 1
    
    for termino, definicion in TERMINOS.items():
        # Buscar el término en el texto (case-insensitive)
        pattern = re.compile(r'\b' + re.escape(termino) + r'\b', re.IGNORECASE)
        match = pattern.search(content)
        
        if match:
            # Marcar solo la primera aparición con ^[N]
            termino_original = match.group()
            content = pattern.sub(f'{termino_original}^[{nota_num}]', content, count=1)
            terminos_encontrados.append((nota_num, termino, definicion))
            nota_num += 1
    
    if not terminos_encontrados:
        print(f'ℹ️  Capitulo {num_cap:02d}: No se encontraron términos técnicos del diccionario')
        return False
    
    # Agregar sección de notas al final
    notas_texto = f'\n\n**NOTAS DEL CAPÍTULO {num_cap}**\n\n'
    for num, termino, definicion in terminos_encontrados:
        notas_texto += f'**({num}) {termino.title()}:** {definicion}\n\n'
    
    content += notas_texto
    
    # Guardar
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'✅ Capitulo {num_cap:02d}: Agregadas {len(terminos_encontrados)} notas')
    return True

# Procesar capítulos 8-19
print('🔍 Buscando términos técnicos y agregando notas...\n')
total_modificados = 0

for cap in range(8, 20):
    if agregar_notas_capitulo(cap):
        total_modificados += 1

print(f'\n🎉 Proceso completado: {total_modificados} capítulos modificados')
