# Sala Cero v26.1.2 — Reforma integral

## Nueva experiencia

- Portada reconstruida alrededor de **abrir → elegir → jugar**.
- Catálogo de 27 enlaces únicos con búsqueda, seis filtros compatibles entre sí, elección aleatoria y acceso reciente.
- Dirección visual verde oscuro, marfil y dorado, con tarjetas más limpias y controles táctiles de al menos 44 px.
- Cabeceras compactas y enlace de vuelta a Sala Cero en todos los juegos.

### Revisión de estabilidad 26.1.1

- La búsqueda encuentra juegos en todo el catálogo y restablece el filtro Todos.
- Chinchón y Culo mantienen la mano propia visible, sin permitir jugar durante el turno de la IA.
- El halo decorativo de Póker ya no desborda en tablet.
- Dibuja vuelve a ocultar la palabra cuando el dibujante cierra la entrega privada.
- Los recursos versionados recuperan el shell de su misma versión cuando no hay conexión.
- Se añade una prueba real de navegación offline por los 27 juegos.

### Revisión visual 26.1.2

- Todas las herramientas de Dibuja permanecen visibles en móvil, sin carrusel horizontal.
- El lienzo y las acciones se ajustan a la altura útil en vertical y horizontal.
- La suite comprueba también el encaje vertical de las manos y el lienzo activo en los cinco tamaños.

## Retirada del sistema de progresión

Se eliminan de interfaz, navegación, scripts y caché:

- carrera, experiencia y niveles;
- logros, trofeos, rachas competitivas y desbloqueos;
- clasificaciones, estadísticas globales e historial competitivo;
- autenticación y perfil social del Club.

Se retiraron los runtimes dedicados `career.*`, `club.*`, `auth.*` y `stats-v26.js`. El nombre del perfil antiguo se migra una sola vez como comodidad local; no se conserva su progreso.

## Juegos nuevos

### Cinquillo

- Baraja española, 2–6 participantes, IA o modo local.
- Inicio por el cinco de oros y cuatro secuencias legales del as al rey.
- Solo permite cartas válidas y solo deja pasar cuando no existe jugada.

### Pocha

- 3–6 participantes, IA o modo local.
- Rondas ascendentes y descendentes, triunfo, apuestas y bazas.
- Puntuación documentada: `10 + 5 por baza` al acertar; `−5 por baza de diferencia` al fallar.

### Burro

- 3–6 participantes, modo local o contra IA.
- Selección simultánea de una carta, paso a la izquierda y detección automática de cuatro valores iguales.

### Charadas

- Ocho categorías y rondas de 30, 60 o 90 segundos.
- Botones grandes de pasar y acertar siempre disponibles.
- Inclinación opcional mediante `DeviceOrientation`, con degradación segura si el dispositivo no la ofrece.

### Dibuja

- Palabra secreta por categorías y entrega privada al dibujante.
- Canvas táctil con lápiz, goma, grosor, deshacer y limpiar.
- Acciones para acertar u obtener otra palabra.

## Brisca

- Dificultades Casual, Normal y Difícil.
- La IA normal pondera puntos, triunfo y riesgo; la difícil añade memoria de cartas, salida segura y cálculo de captura.
- Partida contra IA y modo local de 2–4 participantes con pantalla privada.
- Mano completa y controles visibles en vertical y horizontal.

## Preferencias, PWA y accesibilidad

- Preferencias locales de nombre, efectos compatibles y vibración.
- Vibración opcional centralizada y degradación segura cuando `navigator.vibrate` no existe.
- Sonido y música de los juegos anteriores se conservan.
- Estados de foco visibles, etiquetas accesibles, avisos `aria-live` y diálogos nativos.
- Service worker `26.1.2`, manifiesto actualizado y 187 recursos precargados.

## Limpieza técnica

- La portada deja de cargar hojas de parche históricas.
- Se introduce `game-core` para evitar duplicar baraja, cartas, manos y pantallas privadas en los juegos nuevos.
- Se eliminan archivos completos obsoletos y referencias a ellos.
- Se conservan de forma deliberada algunas capas responsive antiguas dentro de juegos consolidados; retirarlas se abordará juego a juego con pruebas de partida completa.
