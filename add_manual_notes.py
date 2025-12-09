"""
Script para agregar notas de autor manuales a los capítulos 20-24
"""

# Diccionario de notas por capítulo
notes = {
    21: {
        "terms": [
            {
                "term": "miembro fantasma",
                "marker": "^[1]",
                "definition": "**(1) Miembro fantasma (o Síndrome del miembro fantasma):** Fenómeno neurológico donde una persona continúa sintiendo la presencia de una extremidad amputada. El cerebro mantiene el mapa cortical de la extremidad perdida, generando sensaciones, picazón o dolor en un miembro que ya no existe físicamente. Este síndrome revela cómo la representación mental del cuerpo puede persistir independientemente de su realidad física."
            },
            {
                "term": "Escala de Kardashev",
                "marker": "^[2]",
                "definition": "**(2) Escala de Kardashev:** Método de clasificación de civilizaciones propuesto por el astrofísico Nikolái Kardashev en 1964, basado en la cantidad de energía que pueden utilizar. Tipo I: aprovecha toda la energía de su planeta. Tipo II: captura toda la energía de su estrella (Esfera de Dyson). Tipo III: domina la energía de toda su galaxia. La humanidad actual está en aproximadamente 0.73 en esta escala."
            }
        ],
        "replacements": [
            {
                "old": "Existe una condición neurológica conocida como 'miembro fantasma'.",
                "new": "Existe una condición neurológica conocida como 'miembro fantasma'^[1]."
            },
            {
                "old": "Era datos brutos de una civilización tipo II en la escala de Kardashev,",
                "new": "Era datos brutos de una civilización tipo II en la escala de Kardashev^[2],"
            }
        ]
    },
    22: {
        "terms": [
            {
                "term": "UAP",
                "marker": "^[1]",
                "definition": "**(1) UAP (Unidentified Aerial Phenomena - Fenómenos Aéreos No Identificados):** Término técnico adoptado por el Pentágono para reemplazar 'OVNI', designando objetos voladores que desafían explicaciones convencionales. Incluye fenómenos con características imposibles según la física conocida: aceleración instantánea, ausencia de propulsión visible, velocidades hipersónicas sin estela de calor."
            },
            {
                "term": "F-35 Lightning II",
                "marker": "^[2]",
                "definition": "**(2) F-35 Lightning II:** Caza polivalente stealth de quinta generación fabricado por Lockheed Martin. Diseñado para superioridad aérea, ataque terrestre y reconocimiento. Incorpora sistemas de guerra electrónica avanzados, radar AESA, y capacidad de operar en red con otros sistemas. Velocidad máxima: Mach 1.6. Costo unitario: ~$80-100 millones."
            },
            {
                "term": "AWACS",
                "marker": "^[3]",
                "definition": "**(3) AWACS (Airborne Warning and Control System):** Plataforma aérea de alerta temprana y control. Aviones modificados (generalmente Boeing E-3 Sentry) con radar de largo alcance montado sobre el fuselaje. Coordinan operaciones aéreas en tiempo real, detectan amenazas a cientos de kilómetros, y dirigen cazas interceptores."
            },
            {
                "term": "JDAM",
                "marker": "^[4]",
                "definition": "**(4) JDAM (Joint Direct Attack Munition):** Kit de guía que convierte bombas de caída libre en munición guiada por GPS/INS. Permite ataques de precisión en cualquier condición meteorológica. Precisión: dentro de 5 metros. Utilizado masivamente desde la Guerra del Golfo para strikes quirúrgicos contra objetivos de alto valor."
            },
            {
                "term": "EMP",
                "marker": "^[5]",
                "definition": "**(5) EMP (Pulso Electromagnético):** Ráfaga de radiación electromagnética capaz de destruir o dañar equipos electrónicos. Puede generarse mediante explosiones nucleares a gran altitud o dispositivos dedicados. Induce sobretensiones masivas en circuitos, friendo microchips instantáneamente. Un EMP estratégico podría colapsar la infraestructura tecnológica de una nación entera."
            },
            {
                "term": "radiación Cherenkov",
                "marker": "^[6]",
                "definition": "**(6) Radiación Cherenkov:** Luz azul característica emitida cuando partículas cargadas viajan a través de un medio dieléctrico a velocidades superiores a la velocidad de la luz en ese medio. Observable en reactores nucleares y experimentos de física de partículas. Su presencia indica procesos de altísima energía."
            },
            {
                "term": "QBRN",
                "marker": "^[7]",
                "definition": "**(7) QBRN (Químico, Biológico, Radiológico, Nuclear):** Clasificación de amenazas de destrucción masiva que requieren protocolos especiales de contención. Los equipos QBRN están entrenados para responder a incidentes con agentes químicos (gas sarín), biológicos (ántrax), material radiactivo o armas nucleares. Requieren trajes de protección nivel 4 y procedimientos de descontaminación rigurosos."
            }
        ],
        "replacements": [
            {
                "old": "Durante décadas, la comunidad científica ridiculizó el fenómeno OVNI (ahora UAP - Fenómenos Anómalos No Identificados)",
                "new": "Durante décadas, la comunidad científica ridiculizó el fenómeno OVNI (ahora UAP^[1] - Fenómenos Anómalos No Identificados)"
            },
            {
                "old": "Dos cazas F-35 Lightning II de la Fuerza Aérea de los Estados Unidos,",
                "new": "Dos cazas F-35 Lightning II^[2] de la Fuerza Aérea de los Estados Unidos,"
            },
            {
                "old": "—Águila Uno, defina "extraño" —respondió el AWACS (Sistema de Alerta y Control Aéreo)",
                "new": "—Águila Uno, defina "extraño" —respondió el AWACS^[3] (Sistema de Alerta y Control Aéreo)"
            },
            {
                "old": "—Entendido. Armando JDAMs.",
                "new": "—Entendido. Armando JDAMs^[4]."
            },
            {
                "old": "—¿Puede detenerlos —preguntó Helena.\n\n—Puede derribarlos —corrigió James—. Puede freír sus sistemas electrónicos con un pulso EMP dirigido.",
                "new": "—¿Puede detenerlos —preguntó Helena.\n\n—Puede derribarlos —corrigió James—. Puede freír sus sistemas electrónicos con un pulso EMP^[5] dirigido."
            },
            {
                "old": "—Gordon, aquí Control —intervino una nueva voz, más grave, desde el AWACS—. Sus lecturas de energía no coinciden con un laboratorio biológico. Tenemos firmas de radiación Cherenkov.",
                "new": "—Gordon, aquí Control —intervino una nueva voz, más grave, desde el AWACS—. Sus lecturas de energía no coinciden con un laboratorio biológico. Tenemos firmas de radiación Cherenkov^[6]."
            },
            {
                "old": "—Soy el investigador principal de la Instalación Quelccaya —mintió James, imbuyendo su voz de una autoridad desesperada—. Estamos en situación de contención crítica. Tenemos una brecha en el sarcófago. Si bombardean, matarán a medio Perú en dos semanas. Necesitamos un equipo de extracción QBRN (Químico, Biológico, Radiológico, Nuclear),",
                "new": "—Soy el investigador principal de la Instalación Quelccaya —mintió James, imbuyendo su voz de una autoridad desesperada—. Estamos en situación de contención crítica. Tenemos una brecha en el sarcófago. Si bombardean, matarán a medio Perú en dos semanas. Necesitamos un equipo de extracción QBRN^[7] (Químico, Biológico, Radiológico, Nuclear),"
            }
        ]
    },
    23: {
        "terms": [
            {
                "term": "exoesqueletos",
                "marker": "^[1]",
                "definition": "**(1) Exoesqueletos (o trajes de combate exoesqueléticos):** Estructuras mecánicas portátiles que amplifican la fuerza, resistencia y capacidad de carga del usuario. Los modelos militares incorporan servomotores, actuadores hidráulicos y sistemas de estabilización que permiten a un soldado cargar hasta 100 kg de equipo mientras corre a velocidades superiores. También proporcionan blindaje balístico integrado y conectividad con redes tácticas."
            },
            {
                "term": "cargas de plasma",
                "marker": "^[2]",
                "definition": "**(2) Cargas de plasma:** Dispositivos explosivos experimentales que generan un arco de plasma direccional de altísima temperatura (>10,000°C) para cortar o vaporizar materiales. A diferencia de explosivos químicos, las cargas de plasma utilizan campos electromagnéticos para confinar gas ionizado que se expande violentamente al liberarse. Aplicaciones militares incluyen penetración de bunkers y demolición silenciosa."
            },
            {
                "term": "Warhounds",
                "marker": "^[3]",
                "definition": "**(3) Warhounds:** Drones de combate cuadrúpedos diseñados para reconocimiento y ataque en terreno irregular. Similares a los robots Boston Dynamics pero armados y blindados. Equipados con visión térmica, sensores químicos y torretas automáticas. Capaces de operar en enjambre coordinado mediante IA. Su movilidad cuadrúpeda les permite acceder a espacios inaccesibles para vehículos tradicionales."
            }
        ],
        "replacements": [
            {
                "old": "Detrás de ellos, figuras humanas en trajes de combate exoesqueléticos de camuflaje ártico.",
                "new": "Detrás de ellos, figuras humanas en trajes de combate exoesqueléticos^[1] de camuflaje ártico."
            },
            {
                "old": "No fue una explosión convencional; fue una carga de plasma dirigida,",
                "new": "No fue una explosión convencional; fue una carga de plasma^[2] dirigida,"
            },
            {
                "old": "Drones cuadrúpedos, similares a los Warhounds de Omni-Core pero pintados de gris mate sin insignias.",
                "new": "Drones cuadrúpedos, similares a los *Warhounds*^[3] de Omni-Core pero pintados de gris mate sin insignias."
            }
        ]
    },
    24: {
        "terms": [
            {
                "term": "nanotecnología",
                "marker": "^[1]",
                "definition": "**(1) Nanotecnología:** Manipulación de la materia a escala molecular y atómica (1-100 nanómetros). En lugar de construir mecánicamente, se 'cultivan' estructuras siguiendo instrucciones genéticas o químicas, similar al crecimiento de cristales. Las aplicaciones incluyen materiales autorreparables, medicina dirigida a nivel celular, y estructuras que responden dinámicamente a estímulos. El Santuario representa nanotecnología biomimética que fusiona biología y tecnología a nivel fundamental."
            },
            {
                "term": "Wiper virus",
                "marker": "^[2]",
                "definition": "**(2) Wiper virus:** Tipo de malware destructivo diseñado para borrar permanentemente datos de sistemas infectados, sobrescribiendo múltiples veces para impedir recuperación forense. A diferencia de ransomware (que secuestra datos), los wipers destruyen irreversiblemente la información. Variantes militares (usadas en ataques como Stuxnet o contra Sony Pictures) pueden borrar firmware, haciendo los dispositivos físicamente inoperables."
            },
            {
                "term": "mercenarios corporativos",
                "marker": "^[3]",
                "definition": "**(3) Mercenarios corporativos:** Fuerzas privadas contratadas por corporaciones para operaciones de extracción de activos, seguridad de instalaciones o adquisiciones hostiles. Operan en zonas grises legales, sin insignias nacionales, con equipamiento militar de última generación. Compañías como Wagner Group, Executive Outcomes o Blackwater (renombrada Academi) representan esta privatización de la guerra donde el profit motive reemplaza la lealtad nacional."
            }
        ],
        "replacements": [
            {
                "old": "La nanotecnología no es mecánica; es biológica.",
                "new": "La nanotecnología^[1] no es mecánica; es biológica."
            },
            {
                "old": "Rodolfo sacó una unidad de memoria portátil de su bolsillo. Un virus destructor de datos, un "Wiper" de grado militar",
                "new": "Rodolfo sacó una unidad de memoria portátil de su bolsillo. Un virus destructor de datos, un *Wiper*^[2] de grado militar"
            },
            {
                "old": "—Mercenarios corporativos —dijo Dos Santos, reconociendo el patrón de vibración—.",
                "new": "—Mercenarios corporativos^[3] —dijo Dos Santos, reconociendo el patrón de vibración—."
            }
        ]
    }
}

def add_notes_to_chapter(chapter_num):
    """Agrega notas de autor al capítulo especificado"""
    if chapter_num not in notes:
        print(f"⚠️  No hay notas para el capítulo {chapter_num}")
        return
    
    md_path = f'capitulos_md/Capitulo {chapter_num}.md'
    
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Aplicar reemplazos para agregar marcadores
        for replacement in notes[chapter_num]["replacements"]:
            content = content.replace(replacement["old"], replacement["new"])
        
        # Agregar sección de notas al final
        notes_section = f"\n\n---\n\n**NOTAS DE AUTOR - CAPÍTULO {chapter_num}:**\n\n"
        for term in notes[chapter_num]["terms"]:
            notes_section += f"{term['definition']}\n\n"
        
        content += notes_section
        
        # Guardar
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Capítulo {chapter_num}: {len(notes[chapter_num]['terms'])} notas agregadas")
        
    except Exception as e:
        print(f"❌ Error en Capítulo {chapter_num}: {e}")

# Procesar capítulos 21-24 (20 ya fue procesado manualmente)
for cap in [21, 22, 23, 24]:
    add_notes_to_chapter(cap)

print("\n🎉 Notas agregadas a capítulos 21-24")
