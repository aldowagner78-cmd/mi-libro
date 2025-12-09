# 📚 Secciones Especiales del Libro

Esta carpeta contiene las secciones adicionales del libro (introducción, sobre el autor, dedicatoria, etc.)

## 🎯 Cómo agregar una sección

### 1. Crear el archivo HTML

Crea un archivo en esta carpeta con el contenido de tu sección. Ejemplo:

**introduccion.html**
```html
<div class="book-section">
    <h2>Introducción</h2>
    <div class="section-divider"></div>
    
    <p>El Silencio de los Dioses nació de una pregunta que me persiguió durante años...</p>
    
    <p>Este libro explora los límites entre lo divino y lo humano...</p>
    
    <p class="signature">— Aldo Wagner, 2025</p>
</div>
```

**sobre-autor.html**
```html
<div class="book-section">
    <h2>Sobre el Autor</h2>
    <div class="section-divider"></div>
    
    <p><strong>Aldo Wagner</strong> es escritor, filósofo y narrador de historias...</p>
    
    <p>Su obra se caracteriza por explorar temas profundos...</p>
</div>
```

### 2. Activar la sección en index.html

Busca en `index.html` el objeto `SPECIAL_SECTIONS` y agrega la ruta del archivo:

```javascript
const SPECIAL_SECTIONS = {
    'introduccion': { title: 'Introducción', icon: 'book-open', file: 'secciones/introduccion.html' },
    'sobre-autor': { title: 'Sobre el Autor', icon: 'user', file: 'secciones/sobre-autor.html' },
    'dedicatoria': { title: 'Dedicatoria', icon: 'heart', file: 'secciones/dedicatoria.html' },
    'agradecimientos': { title: 'Agradecimientos', icon: 'users', file: null }, // null = no aparece
    'epilogo': { title: 'Epílogo', icon: 'bookmark', file: null }
};
```

### 3. ¡Listo!

La sección aparecerá automáticamente en el índice con su ícono correspondiente.

## 📝 Secciones Disponibles

| Sección | Clave | Ícono | Posición | Descripción |
|---------|-------|-------|----------|-------------|
| Introducción | `introduccion` | 📖 book-open | Antes de capítulos | Presentación del libro |
| Sobre el Autor | `sobre-autor` | 👤 user | Antes de capítulos | Biografía del autor |
| Dedicatoria | `dedicatoria` | ❤️ heart | Antes de capítulos | A quién va dedicado |
| Agradecimientos | `agradecimientos` | 👥 users | Después de capítulos | Agradecimientos |
| Epílogo | `epilogo` | 🔖 bookmark | Después de capítulos | Cierre del libro |

## 🎨 Estilos Disponibles

Usa estas clases CSS en tus secciones:

- `.book-section` - Contenedor principal con padding y estilo
- `.section-divider` - Línea decorativa horizontal
- `.signature` - Texto de firma (cursiva, alineado a la derecha)
- `<strong>` - Texto en negrita
- `<em>` - Texto en cursiva

## 💡 Ejemplo Completo

```html
<div class="book-section">
    <h2>Dedicatoria</h2>
    <div class="section-divider"></div>
    
    <p><em>A todos aquellos que alguna vez buscaron respuestas en el silencio...</em></p>
    
    <p>A mis padres, por enseñarme que las preguntas son tan importantes como las respuestas.</p>
    
    <p>A los lectores que se atreven a cuestionar lo establecido y a explorar nuevos horizontes.</p>
    
    <p class="signature">Con gratitud infinita,<br>Aldo Wagner</p>
</div>
```

## 🚀 Tips

- Las secciones con `file: null` NO aparecen en el índice
- Puedes cambiar el orden editando las funciones en `index.html`
- Los íconos son de Lucide Icons (puedes cambiarlos por otros paths SVG)
- El sistema se adapta automáticamente al tema activo
