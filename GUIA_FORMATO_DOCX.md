# 📘 GUÍA DE FORMATO PARA ARCHIVOS DOCX

## ✅ FORMATO ESTÁNDAR OBLIGATORIO

Para que **TODAS las notas funcionen correctamente**, cada archivo DOCX debe seguir esta estructura exacta:

---

## 1️⃣ ESTRUCTURA DEL DOCUMENTO

```
[TÍTULO DEL CAPÍTULO]
[Subtítulos si aplican]

[TEXTO PRINCIPAL CON REFERENCIAS]
Ejemplo: "La privacidad no murió con un disparo(1), sino con un clic."

[MÁS TEXTO...]

--- (Separador opcional) ---

NOTAS DEL CAPÍTULO X

(1) Título de la nota: Contenido explicativo de la nota...

(2) Otra nota: Más contenido...

(3) Tercera nota: Etc...
```

---

## 2️⃣ REFERENCIAS EN EL TEXTO

### ✅ FORMATO CORRECTO:
En el texto principal, las referencias deben ser:
- **Superíndice** (formato SUP en Word)
- Con paréntesis: `(1)`, `(2)`, `(3)`, etc.
- Sin espacio entre el texto y la referencia

**Ejemplo en Word:**
```
"La privacidad no murió con un disparo^(1), sino con un clic."
         ^ = formato superíndice
```

### ❌ FORMATOS QUE NO FUNCIONAN:
- `[1]` - Corchetes NO
- `¹` - Número volado sin paréntesis NO
- `(1)` sin superíndice - NO (debe estar elevado)
- Hipervínculos automáticos - NO

---

## 3️⃣ SECCIÓN DE NOTAS

### ✅ TÍTULO DE LA SECCIÓN:
```
NOTAS DEL CAPÍTULO X
```
- **Debe contener exactamente "NOTAS DEL CAPÍTULO"** (puede variar el número)
- En **negrita** (Bold)
- Estilo: Título 2 o Título 3 (recomendado)

### ✅ CADA NOTA:
```
(1) Título: Contenido de la nota...

(2) Otro título: Más contenido...
```

**Formato:**
- Empieza con `(número)` normal o en superíndice
- Seguido de un **espacio**
- Luego el **título en negrita** con **dos puntos (:)**
- Luego el contenido explicativo

**Ejemplo completo:**
```
(1) Savile Row: Famosa calle en Mayfair, Londres, conocida mundialmente por sus sastrerías tradicionales de alta costura para hombres.

(2) Nanosatélites: Satélites artificiales de masa baja (generalmente entre 1 y 10 kg).
```

---

## 4️⃣ FUENTES Y ESTILOS

### RECOMENDACIONES:
- **Fuente principal:** Calibri, Arial, o Times New Roman (cualquiera funciona)
- **Tamaño:** 11pt o 12pt para texto normal
- **Títulos:** Usar estilos de Word "Título 1", "Título 2", etc.
- **Notas:** Mismo tamaño que el texto principal

### IMPORTANTE:
- **NO uses cuadros de texto** para las notas
- **NO uses tablas** para las notas
- **NO uses notas al pie automáticas de Word** (Insert > Footnote)
- TODO debe ser texto plano con formato manual

---

## 5️⃣ CHECKLIST POR CAPÍTULO

Antes de guardar cada DOCX, verifica:

- [ ] Referencias en el texto están en **superíndice (1), (2), (3)**
- [ ] Hay una sección **"NOTAS DEL CAPÍTULO X"** al final
- [ ] Cada nota empieza con **(N)** seguido de **Título:** en negrita
- [ ] Los números de las referencias coinciden con los números de las notas
- [ ] No hay notas automáticas de Word (pie de página)
- [ ] Todo está en texto plano (no cuadros, no tablas)

---

## 6️⃣ EJEMPLO COMPLETO

```
EL SILENCIO DE LOS DIOSES
CAPÍTULO 2: EL OJO DE DIOS EN EL CIELO

[Texto del capítulo...]

El traje de Savile Row(1) contrastaba con la tecnología de punta.
Los nanosatélites(2) cubrían cada centímetro del planeta.

[Más texto...]

---

NOTAS DEL CAPÍTULO 2

(1) Savile Row: Famosa calle en Mayfair, Londres, conocida mundialmente por sus sastrerías tradicionales de alta costura para hombres. Un traje hecho aquí simboliza el máximo estatus de poder clásico y riqueza.

(2) Nanosatélites: Satélites artificiales de masa baja (generalmente entre 1 y 10 kg). Al ser más baratos y fáciles de producir, se pueden lanzar en "constelaciones" o enjambres para cubrir áreas completas de la Tierra en tiempo real.

(3) Cortisol: La principal hormona del estrés del cuerpo humano. Un nivel "crítico" indica que el sujeto está en una situación de lucha o huida extrema, al borde del colapso físico o mental.
```

---

## 🔄 DESPUÉS DE CORREGIR LOS DOCX

1. Guarda todos los archivos corregidos
2. Ejecuta el script de conversión:
   ```powershell
   C:/Python313/python.exe convert_chapters.py
   ```
3. Verás cuántas notas se detectaron en cada capítulo
4. Sube los cambios:
   ```powershell
   git add capitulos_html/
   git commit -m "Capítulos con formato estandarizado"
   git push
   ```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Puedo usar estilos personalizados de Word?**
R: Sí, pero las notas deben seguir el formato `(N) Título: contenido`

**P: ¿Qué pasa si no tengo notas en un capítulo?**
R: No pasa nada, simplemente no agregues la sección "NOTAS DEL CAPÍTULO"

**P: ¿Puedo tener subnumeración como (1a), (1b)?**
R: NO, solo números enteros: (1), (2), (3), etc.

---

## 🎯 RESULTADO ESPERADO

Cuando todos los DOCX tengan el formato correcto, el script `convert_chapters.py` mostrará:

```
📄 Procesando: Capitulo 01
  ✅ Notas encontradas: 11
     Números: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11

📄 Procesando: Capitulo 02
  ✅ Notas encontradas: 9
     Números: 1, 2, 3, 4, 5, 6, 7, 8, 9

[... etc para TODOS los capítulos ...]
```

Y **TODAS las notas funcionarán** en el lector web.
