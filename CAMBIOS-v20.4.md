# Sala Cero v20.4 — Póker offline

## Nuevo juego: Texas Hold’em No Limit

- Mesa limitada a cuatro plazas para mantener a Anton crupier visible y conservar una interfaz legible.
- Modo contra IA: un jugador humano y entre uno y tres rivales.
- Multijugador local: de dos a cuatro personas con pantalla privada para pasar el dispositivo.
- Flujo completo de mano: ciegas, preflop, flop, turn, river y showdown.
- Acciones: retirarse, pasar, igualar, subir y all-in.
- Rotación de dealer, ciega pequeña y ciega grande, incluido el funcionamiento heads-up.
- Botes secundarios, reparto de empates y gestión de fichas impares.
- Evaluación completa de manos desde carta alta hasta escalera real.
- Tres estilos de IA: conservador, agresivo e imprevisible.
- Torneos con stacks y ciegas configurables, y subida opcional de ciegas cada ocho manos.
- Guardado y continuación de partida por usuario local.

## Diseño y dispositivos

- Mesa de casino propia con Anton como crupier provisional en la parte superior central.
- Cuatro asientos que se redistribuyen sin invadir al crupier.
- Controles de apuesta específicos para pantalla táctil.
- Mano privada destacada y rivales compactos en móvil.
- Diseño comprobado en 390 × 844 y 1440 × 900 sin desbordamiento horizontal.
- Pantalla de privacidad en multijugador local antes de mostrar las cartas del siguiente jugador.

## Integración con Sala Cero

- Póker añadido a la portada, al manifiesto y a la caché offline.
- Estadísticas, experiencia, historial, logros y retos diarios de Póker.
- Datos separados mediante el sistema de usuarios locales de Sala Cero.
- Versión de recursos y service worker actualizada a 20.4.0.

## Recursos personalizables preparados

La versión incluye recursos provisionales y rutas preparadas para sustituirlos después por:

- 52 cartas personalizadas.
- Reverso personalizado.
- Fichas de apuesta por valor.
- Fichas de dealer, ciega pequeña y ciega grande.
- Imagen definitiva de Anton vestido de crupier.

La convención de nombres y las carpetas se documentan en `assets/poker/README-ASSETS.md`.
