# QA v21.3

## Comprobaciones estáticas
- Todos los JavaScript analizados con `node -c`.
- 15 páginas HTML sin identificadores duplicados.
- Recursos locales de `script`, `link` e `img` comprobados.
- JSON del manifiesto validado.
- Recursos del service worker comprobados contra el sistema de archivos.

## Pruebas renderizadas
- Portada: accesos a Blackjack e Impostor presentes en móvil y ordenador.
- Sin desbordamiento horizontal en 390 × 844 y 1440 × 1000.
- Blackjack móvil: mesa local de seis jugadores cargada.
- Blackjack: ronda completada hasta el diálogo de resultados.
- Blackjack ordenador: mesa individual cargada sin desbordamiento.
- Impostor móvil: flujo completo de seis jugadores hasta debate y revelación.
- Impostor: prueba adicional de ocho jugadores, dos impostores y palabra personalizada.
- Impostor ordenador: portada cargada sin desbordamiento.

## Limitaciones de la prueba
Las pruebas del navegador se hicieron cargando HTML, CSS y JavaScript localmente en un navegador sin navegación HTTP, porque el entorno bloquea las URL locales. El service worker se comprobó de forma estática; su instalación final debe probarse al publicar por HTTPS.
