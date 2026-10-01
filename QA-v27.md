# QA Sala Cero v27

## Base antes de modificar

Base `effbc4f644fb413ae879e4fae35c573a8df5a695`, árbol `29a3098093f65b155ebd519d934768fad7fd022b`, idéntico al checkout de partida. Reejecución de la base: [Actions 36858620776, intento 2](https://github.com/ElPtoWalter/tute-ia/actions/runs/36858620776/attempts/2), 159 passed / 56 skipped / 0 failed. Validación estática: 32 HTML, 27 juegos, 187 recursos, cero referencias ausentes, duplicados o errores de sintaxis.

## Matriz v27

PR: [Sala Cero v27](https://github.com/ElPtoWalter/tute-ia/pull/1). Ejecución de control completamente verde: [Actions 36909094811](https://github.com/ElPtoWalter/tute-ia/actions/runs/36909094811), commit `7e852bcca3b5e3c362845c8232d8894a9d34219a`. Cada revisión posterior repite toda la matriz; antes de publicar se exige que la última revisión de la PR esté también en verde. El workflow de main añade una comprobación independiente de GitHub Pages real.

| Trabajo | Aprobadas | Fallidas | Omitidas | Flaky |
| --- | ---: | ---: | ---: | ---: |
| Chromium, cinco tamaños | 301 | 0 | 84 | 0 |
| Firefox | 77 | 0 | 0 | 0 |
| WebKit | 77 | 0 | 0 | 0 |
| Chromium PWA/offline | 3 | 0 | 0 | 0 |
| Node, motor de ruleta | 26 | 0 | 0 | 0 |

458 pruebas web ejecutadas + 26 del motor = 484 aprobadas. Validación estática: 33 HTML, 28 juegos, 591 referencias, 191 recursos precargados, cero ausentes/duplicados/errores de sintaxis. El job `publication` se omite deliberadamente en una PR: solo comprueba la URL pública después de publicar en main; no es un test fallido ni una comprobación de producción ya realizada.

| Motor | Alcance | Tamaños |
| --- | --- | --- |
| Chromium | Catálogo de 28, ruleta completa, dibujo; flujos profundos en móvil | 1440×900, 768×1024, 390×844, 360×800, 844×390 |
| Firefox | Catálogo, ruleta y flujos críticos/profundos | 390×844; rotación en flujos específicos |
| WebKit | Catálogo, ruleta y flujos críticos/profundos | 390×844; rotación en flujos específicos |
| Chromium PWA | Precarga, 28 juegos offline, ronda de ruleta y actualización | 390×844 |

Los 84 skips en cuatro proyectos Chromium evitan repetir partidas profundas y algunos smoke; no ocultan juegos del catálogo ni apuestas de la ruleta. No hay skips en Firefox/WebKit por incompatibilidad. Lista actual: 542 casos web registrados, 458 ejecutados.

## Motor

26 pruebas Node correctas localmente. Pagos netos + devolución, todas las geometrías, cero y externas, saldos atómicos, bloqueo, historial, reanudación, 2–6 jugadores, rechazo del extremo módulo y fallback sin Web Crypto. Muestra de 74000 resultados criptográficos: controla rango, presencia de 0/36 y sesgo grosero; no demuestra azar perfecto. El resultado fijo para UI solo se lee en 127.0.0.1 con navigator.webdriver; una prueba verifica que se ignora fuera de ese host. No existe selector de resultado en producción.

## Flujos y contratos

- Tute: mano hasta resultado, bazas, robo y suma de puntos.
- Brisca: 40 cartas, 20 bazas, manos y baceta vacías, 120 puntos.
- Cinquillo: apertura con cinco de oros, secuencias contiguas, 40 cartas conservadas, primera mano vacía; caso adicional de dos jugadores/20 cartas.
- Pocha: 19 rondas completas (cuatro personas), apuestas legales, asistencia, bazas, cálculo exacto de puntos y resultado.
- Blackjack: repartir, plantarse, banca y devolución calculada desde las cartas reales.
- Póker, Generala, Chinchón y Dibuja: iniciar, acción, presentación y regreso al catálogo, además de pruebas específicas de dibujo/orientación. Dibuja genera un trazo real de ratón y toque táctil en los tres motores; Chromium añade arrastre táctil nativo. No se afirma haber probado arrastres físicos en Firefox/Safari móviles.
- Ruleta: 14 pagos/zonas deterministas, cero pierde todas las externas, insuficiencia, acumulación/deshacer/borrar/repetir/doblar, doble giro, recargar, nueva sesión, local, teclado, objetivos táctiles, rueda de 37 casillas, bola correcta, orientación y movimiento reducido.

Las partidas profundas usan temporizadores acelerados y semilla fija únicamente desde el test, sin modificar reglas del runtime. No equivalen a todas las variantes, todas las combinaciones de manos o una certificación de reglamentos.

## Fallos resueltos durante la ampliación

La [primera ejecución](https://github.com/ElPtoWalter/tute-ia/actions/runs/36889997098) detectó manos largas de Cinquillo y subtítulo de Chinchón fuera del ancho. Las siguientes descubrieron la ausencia real de enlaces visibles al catálogo en Tute móvil. Se corrigieron en las hojas/motor existentes y se mantuvieron pruebas de regresión; no se modificaron reglamentos. La revisión visual de ruleta corrigió el cero horizontal de una sola fila y el botón APP que podía cubrir el tapete al desplazarse. La geometría de ambos queda comprobada automáticamente.

Se corrigieron también condiciones de carrera del test al leer puntuaciones antes de terminar la baza o intentar seleccionar una carta mientras cambiaba el turno. La tolerancia angular 0.01° solo contempla el redondeo CSS de Firefox (<0.03 px de arco). El filtro de cancelación de red se limita al audio cancelado intencionalmente; los errores JS y 404 siguen produciendo fallo.

La primera repetición sobre main, [36912670593](https://github.com/ElPtoWalter/tute-ia/actions/runs/36912670593), detectó un reintento en el smoke de Chinchón/WebKit: el nodo de carta existía pero la primera muestra tenía ancho cero. El helper espera ahora una muestra visible (ancho >20, alto >30) y utiliza esa misma muestra para todos los límites. No se relajan los límites ni se cambia Chinchón. La corrección se valida mediante una PR de QA independiente antes de fusionarla.

## PWA y accesibilidad

191 recursos esperados en la caché v27; desconexión real mediante contexto offline; carga de los 28 juegos y giro completo. Actualización simulada de un trabajador con namespace v26 a v27: espera al usuario, conserva la apuesta y elimina cachés antiguas. Esto comprueba el nuevo mecanismo; el antiguo trabajador v26 realmente publicado activaba automáticamente y no puede cambiarse retroactivamente.

Etiquetas, teclado, foco, modales, regiones live, objetivos de 44 px, ausencia de desbordamiento horizontal. No se presenta como auditoría WCAG completa ni validación de lector de pantalla físico.

## Límites locales y comprobación física

El lanzamiento de procesos de navegador/runner local está limitado por EPERM; Node se ejecuta directamente y la validación web se realiza en Actions. La sesión de navegador local también se ha bloqueado. Se descargan e inspeccionan visualmente capturas reales de CI de la ruleta en los cinco tamaños y del regreso al menú de Tute; no se atribuyen esas capturas a dispositivos físicos.

Pendiente físico: iPhone Safari y PWA (safe areas, audio tras toque, rotación y reanudar), Android Chrome (instalación, vibración/offline/actualización), iPad Safari (lápiz, teclado y orientación). WebKit Linux no certifica Safari real.

## v28

Ampliar variantes y semillas de partidas completas; auditoría con lector de pantalla; retirada gradual de CSS por módulo con capturas comparadas. Mus y Dominó pendientes de reglas y diseño, no implementados aquí.
