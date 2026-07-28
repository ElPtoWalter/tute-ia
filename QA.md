# QA v14

## Validación estática

- Sintaxis validada con Node en `app.js`, `local.js`, `multi.js`, `pwa.js` y `sw.js`.
- CSS analizado sin errores de sintaxis en los cinco archivos de estilos.
- Manifest validado como JSON.
- 40 cartas `.webp`, reverso, iconos, capturas y pistas de audio presentes.
- Los 62 recursos de instalación básica declarados en el service worker existen.
- Referencias locales de los tres documentos HTML comprobadas.
- No existen identificadores HTML duplicados.

## Pruebas interactivas en Chromium

Las páginas se ejecutaron mediante un documento autocontenido en Chromium, debido al bloqueo del entorno de pruebas sobre direcciones locales.

- Menú móvil: cuatro modos principales, ocho variantes y panel PWA abiertos correctamente.
- Partida contra IA: reparto completo de 8 cartas por jugador, baceta de 24 y fase de arrastre activa.
- Multijugador local a tres: 13 cartas por jugador, triunfo «POR DECIDIR», pantalla privada de entrega y ocultación inmediata mediante el evento de privacidad.
- Mesa contra dos IA: 13 cartas por jugador, sin triunfo inicial, carta jugada correctamente y respuesta de la IA.
- `TutePWA` y `TuteDB` disponibles durante la ejecución.
- No se registraron excepciones de JavaScript en esos recorridos.

## Limitación de la prueba

El entorno no permitió servir la aplicación desde un origen HTTP local, por lo que no se realizó una instalación real del service worker dentro de Chromium. La lógica del service worker, sus rutas y todos los recursos de precarga sí fueron validados de forma estática. La instalación PWA debe confirmarse una vez desplegada en GitHub Pages.
