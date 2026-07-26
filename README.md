# Tute IA — Mesa Cero

Primera versión jugable de una web de Tute Habanero contra una IA.

## Qué incluye

- Baraja española completa de 40 cartas, dibujada con HTML y SVG.
- Partidas de dos jugadores con 8 cartas por mano y baceta.
- Pinte, robo por orden de baza y diez de últimas.
- Juego libre mientras queda baceta.
- Asistir, montar y fallar automáticamente al agotarse la baceta.
- Cantes de 20 y 40.
- Tute de reyes y de caballos configurable.
- Cambio del pinte por el 7 o el 2.
- Tres dificultades.
- Diseño adaptable a ordenador y móvil.
- Sonidos sin archivos externos.
- Funciona sin conexión después de la primera carga.
- Estadísticas básicas guardadas en el navegador.

## Cómo probarlo en tu ordenador

La forma más fiable es abrir una terminal dentro de esta carpeta y ejecutar:

```bash
python -m http.server 8000
```

Después abre:

```text
http://localhost:8000
```

También puedes abrir `index.html` directamente, aunque el modo sin conexión no se activará con `file://`.

## Cómo subirlo a GitHub Pages

1. Crea un repositorio nuevo o usa uno vacío.
2. Sube **el contenido de esta carpeta** a la raíz del repositorio:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.webmanifest`
   - `sw.js`
   - carpeta `assets`
3. En GitHub entra en **Settings → Pages**.
4. En **Build and deployment**, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Guarda.

No hace falta subir ninguna carpeta `.github`.

## Reglamento fijado para esta versión

Esta versión usa Tute Habanero:

- 8 cartas para cada jugador.
- La carta visible determina el triunfo y se roba la última.
- Mientras haya baceta no existe obligación de asistir.
- Al agotarse la baceta se obliga a asistir, montar y fallar.
- Los cantes se realizan tras ganar una baza y antes de robar.
- La última baza vale 10 puntos adicionales.
- La mano la gana quien suma más puntos.
- En empate, gana quien consiguió las diez de últimas.

El Tute tiene muchas reglas locales. El motor está organizado para poder añadir posteriormente un selector de variantes.

## Próxima ampliación recomendada

La siguiente versión debería incluir:

- Tutorial interactivo.
- IA con simulación Monte Carlo real.
- Partidas privadas online mediante código.
- Servidor autoritativo para impedir trampas.
- Reconexión de jugadores.
- Modo de cuatro jugadores por parejas.
