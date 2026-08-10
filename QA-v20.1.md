# Comprobaciones de Sala Cero v20.1

## Código

- Sintaxis validada con `node --check` para todos los archivos JavaScript.
- Los 11 documentos HTML no contienen identificadores duplicados.
- Todos los enlaces locales, hojas de estilo, scripts, imágenes y audios referenciados existen.
- `manifest.webmanifest` se analiza correctamente como JSON.

## PWA y funcionamiento offline

- Caché actualizada a `20.1.0`.
- 88 recursos esenciales comprobados.
- Se incluyen `culo.html`, `culo.css`, `culo.js`, `tutorials.css` y `tutorials.js`.
- Fallback de navegación añadido para Culo / Presidente.

## Tutoriales

- Tutorial de Chinchón: 6 etapas y 2 ejercicios interactivos.
- Tutorial de Escoba: 6 etapas y 2 ejercicios interactivos.
- Tutorial de Culo: 6 etapas y 1 ejercicio interactivo.
- 42 referencias visuales de cartas verificadas sin recursos ausentes.
- Maquetación adaptable a escritorio y móvil.

## Culo / Presidente

- Baraja española de 40 cartas comprobada.
- Orden normal comprobado: 3 bajo y 2 alto.
- Respuesta con la misma cantidad de cartas.
- Rechazo de combinaciones con distinto número de cartas o rangos mezclados.
- Comparación invertida comprobada durante la revolución.
- Modos contra IA y local de 3 a 6 jugadores.
- Guardado, continuación, cargos e intercambio entre rondas incluidos.
- Variantes del 2, la sota y la revolución incluidas.

## Integración

- Registro de partidas de Culo en el perfil comprobado.
- Estadísticas de partidas, victorias, prestigio y presidencias comprobadas.
- Historial, experiencia, retos y logros actualizados.
- Culo incluido en la Copa de Juegos de Salón y en el Campeonato final.
- Definiciones de carrera y enrutamiento comprobados.

## Limitación del entorno

Se intentó iniciar Chromium sin interfaz para una revisión visual automatizada, pero el proceso se bloqueó por errores internos de D-Bus y zygote del contenedor. Por ese motivo no se presenta esa prueba visual como completada. Las comprobaciones de sintaxis, recursos, reglas e integración sí se ejecutaron directamente.
