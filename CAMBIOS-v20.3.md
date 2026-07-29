# Sala Cero v20.3 — Optimización móvil integral

Esta versión parte de la v20.2 y mantiene los motores y reglas de los cinco juegos. La mejora se concentra en la presentación, la ergonomía táctil y el aprovechamiento del espacio disponible en móviles.

## Cambios generales

- Nueva hoja `mobile-final.css`, cargada en todas las páginas después de los estilos existentes.
- Nuevo controlador `mobile-layout.js` para adaptar la altura útil cuando aparecen o desaparecen las barras del navegador móvil.
- Áreas táctiles ampliadas y formularios protegidos frente al zoom automático de iOS.
- Compatibilidad con márgenes seguros de móviles con notch y con la instalación como PWA.
- Eliminación de desplazamientos horizontales accidentales.
- Adaptación específica para 320, 360, 390, 430 y 768 píxeles de ancho.
- Diseño horizontal revisado para teléfonos con poca altura.

## Portada, usuarios y Carrera

- Portada más compacta, legible y ordenada.
- Tarjetas de los cinco juegos redimensionadas sin perder su identidad visual.
- Estadísticas, retos, logros y personalización reorganizados para lectura móvil.
- Selector de usuarios convertido en una hoja inferior cómoda para usar con una mano.
- PIN, creación de perfil, avatares y gestión de cuentas redimensionados.
- Carrera corregida para no superar el ancho de pantalla.
- Clasificación de liga desplazable sin deformar el resto de la página.

## Tute

- Menú principal y tarjetas de modos más legibles.
- Mesa individual adaptada a la altura real del navegador.
- Mano inferior desplazable y centrada, con cartas de mayor tamaño.
- Acciones colocadas por encima de la mano sin tapar las cartas.
- Marcador móvil y panel informativo reforzados.
- Mesas local y contra varias IA revisadas.
- Corrección de las traslaciones de escritorio que desplazaban elementos en móvil.

## Generala

- Cinco dados visibles simultáneamente en pantallas estrechas.
- Cubilete, botón de tirada y categorías reorganizados verticalmente.
- Planilla convertida en panel inferior ampliable.
- Tipografía y botones aumentados.
- Mesa con desplazamiento interno controlado para evitar que el marcador tape contenido.

## Chinchón y Escoba

- Manos convertidas en carruseles táctiles con solapamiento controlado.
- Pilas, cartas centrales y controles redimensionados.
- Botones de acción siempre accesibles.
- Marcadores inferiores ampliables y modales más cómodos.
- Tutoriales adaptados a móvil con cartas desplazables.

## Culo / Presidente

- Rivales y escala de rangos desplazables horizontalmente.
- Mesa central y montón de jugadas compactados.
- Mano larga optimizada para muchas cartas.
- Acciones, variantes y tutorial redimensionados.

## PWA

- Caché offline actualizada a `20.3.0`.
- Los nuevos recursos móviles se incluyen en la instalación offline.
