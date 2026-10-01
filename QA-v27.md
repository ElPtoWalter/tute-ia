# QA Sala Cero v27

## Base antes de modificar

Base `effbc4f644fb413ae879e4fae35c573a8df5a695`, árbol `29a3098093f65b155ebd519d934768fad7fd022b`, idéntico al checkout de partida. Reejecución de la base: [Actions 36858620776, intento 2](https://github.com/ElPtoWalter/tute-ia/actions/runs/36858620776/attempts/2), 159 passed / 56 skipped / 0 failed. Validación estática: 32 HTML, 27 juegos, 187 recursos, cero referencias ausentes, duplicados o errores de sintaxis.

## Matriz v27

PR: [Sala Cero v27](https://github.com/ElPtoWalter/tute-ia/pull/1). Primera ejecución: [Actions 36889997098](https://github.com/ElPtoWalter/tute-ia/actions/runs/36889997098). Resultados finales pendientes; esto no es una declaración de estabilidad.

| Motor | Alcance | Tamaños |
| --- | --- | --- |
| Chromium | Catálogo de 28, ruleta completa, dibujo; flujos profundos en móvil | 1440×900, 768×1024, 390×844, 360×800, 844×390 |
| Firefox | Catálogo, ruleta y flujos críticos/profundos | 390×844; rotación en flujos específicos |
| WebKit | Catálogo, ruleta y flujos críticos/profundos | 390×844; rotación en flujos específicos |
| Chromium PWA | Precarga, 28 juegos offline, ronda de ruleta y actualización | 390×844 |

Los skips en cuatro proyectos Chromium evitan repetir partidas profundas y algunos smoke; no ocultan juegos del catálogo ni apuestas de la ruleta. No hay skips en Firefox/WebKit por incompatibilidad. Lista actual: 534 casos registrados, pendiente de resultados definitivos.

## Motor

25 pruebas Node correctas localmente. Pagos netos + devolución, todas las geometrías, cero y externas, saldos atómicos, bloqueo, historial, reanudación, 2–6 jugadores y rechazo del extremo módulo. Muestra de 74000 resultados criptográficos: controla rango, presencia de 0/36 y sesgo grosero; no demuestra azar perfecto. El resultado fijo para UI solo se lee en 127.0.0.1 con navigator.webdriver; no existe selector de resultado en producción.

## Flujos y contratos

- Tute: mano hasta resultado, bazas, robo y suma de puntos.
- Brisca: 40 cartas, 20 bazas, manos y baceta vacías, 120 puntos.
- Cinquillo: apertura con cinco de oros, secuencias contiguas, 40 cartas conservadas, primera mano vacía; caso adicional de dos jugadores/20 cartas.
- Pocha: 19 rondas completas (cuatro personas), apuestas legales, asistencia, bazas, cálculo exacto de puntos y resultado.
- Blackjack: repartir, plantarse, banca y devolución calculada desde las cartas reales.
- Póker, Generala, Chinchón y Dibuja: iniciar, acción, presentación y regreso al catálogo, además de pruebas específicas de dibujo/orientación.
- Ruleta: 14 pagos/zonas deterministas, cero pierde todas las externas, insuficiencia, acumulación/deshacer/borrar/repetir/doblar, doble giro, recargar, nueva sesión, local, teclado, objetivos táctiles, rueda de 37 casillas, bola correcta, orientación y movimiento reducido.

Las partidas profundas usan temporizadores acelerados y semilla fija únicamente desde el test, sin modificar reglas del runtime. No equivalen a todas las variantes, todas las combinaciones de manos o una certificación de reglamentos.

## PWA y accesibilidad

191 recursos esperados en la caché v27; desconexión real mediante contexto offline; carga de los 28 juegos y giro completo. Actualización simulada de un trabajador con namespace v26 a v27: espera al usuario, conserva la apuesta y elimina cachés antiguas. Esto comprueba el nuevo mecanismo; el antiguo trabajador v26 realmente publicado activaba automáticamente y no puede cambiarse retroactivamente.

Etiquetas, teclado, foco, modales, regiones live, objetivos de 44 px, ausencia de desbordamiento horizontal. No se presenta como auditoría WCAG completa ni validación de lector de pantalla físico.

## Límites locales y comprobación física

El lanzamiento de procesos de navegador/runner local está limitado por EPERM; Node se ejecuta directamente y la validación web se realiza en Actions. La sesión de navegador local también se ha bloqueado. Las capturas se guardan en artefactos de CI; no se inventa una revisión manual que no se haya podido realizar.

Pendiente físico: iPhone Safari y PWA (safe areas, audio tras toque, rotación y reanudar), Android Chrome (instalación, vibración/offline/actualización), iPad Safari (lápiz, teclado y orientación). WebKit Linux no certifica Safari real.

## v28

Ampliar variantes y semillas de partidas completas; auditoría con lector de pantalla; retirada gradual de CSS por módulo con capturas comparadas. Mus y Dominó pendientes de reglas y diseño, no implementados aquí.
