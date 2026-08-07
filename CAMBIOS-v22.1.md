# Sala Cero v22.1 — Hotfix móvil real

- Corregido el marcador de Tute que se estiraba verticalmente en iPhone por una colisión `top + bottom`.
- El marcador vuelve a ser una píldora compacta y abre el detalle como bottom sheet.
- Eliminada la superposición de la barra de acciones sobre la mano del jugador.
- La mesa de Tute móvil usa ahora una única geometría: rival / centro de mesa / mano.
- Ocho cartas caben visualmente en una pantalla móvil estándar sin que el marcador las tape.
- Rival, estado, baceta, triunfo y baza se han compactado para priorizar el área jugable.
- El panel lateral permanece oculto hasta que el jugador pulsa Marcador.
- Cache busting y Service Worker actualizados a 22.1.0 para evitar que Safari conserve el CSS defectuoso de v22.0.
