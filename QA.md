# QA v13

## Verificaciones realizadas

- Sintaxis validada en `app.js`, `multi.js`, `local.js` y `sw.js`.
- 40 cartas `.webp` y el reverso presentes.
- Menú principal cargado en Chromium sin errores y enlazado con `local.html`.
- Configuraciones locales de 2, 3 y 4 jugadores incluidas.
- Modalidad de cuatro individual y por parejas incluida.
- Regla de tres jugadores actualizada: no existe triunfo inicial y el primer cante fija el pinte.
- Seis casos críticos de legalidad comprobados: montar, asistir tras fallo, pisar, descarte libre, juego sin triunfo y salida de triunfo.
- Caché offline actualizada a `v13.0.0`, incluyendo `local.html`, `local.css` y `local.js`.

## Pruebas reales en Chromium

- Mesa local de 3: 13 cartas por jugador, triunfo «POR DECIDIR», baceta oculta, reordenación de mano mediante arrastre y entrega automática al siguiente jugador.
- Mesa local de 2: 8 cartas iniciales, baceta de 24, dos jugadas legales, robo privado por ambos jugadores y baceta reducida a 22.
- Mesa local de 4 por parejas en viewport móvil: 10 cartas, equipos 1+3 y 2+4, mano privada y adaptación responsive.
- No se registraron errores de consola ni excepciones en estos recorridos.
