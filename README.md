# Tute IA — Mesa Cero · v5

Juego de tute habanero para dos jugadores contra una inteligencia artificial.

## Cambios principales de esta versión

- Baraja fotográfica tradicional completa de 40 cartas.
- Cartas enderezadas, limpiadas y optimizadas en WebP.
- Reverso propio de Tute IA.
- Reparto inicial manual y animado.
- Robo manual después de cada baza.
- La partida espera a que el jugador toque la baceta para robar.
- La IA también roba con una animación visible.
- Tres niveles de dificultad.
- Cantes de 20, 40 y tute.
- Cambio del pinte mediante el siete o el dos.
- Interfaz adaptable a ordenador y móvil.
- Caché PWA renovada a la versión 5.

## Cómo probarla

Abre una terminal dentro de la carpeta y ejecuta:

```bash
python -m http.server 8000
```

Después visita:

```text
http://localhost:8000
```

## Cómo actualizar GitHub Pages

1. Sube todos los archivos de esta carpeta a la raíz del repositorio.
2. Confirma que la carpeta `assets/cards` contiene 41 archivos WebP.
3. Reemplaza los archivos antiguos cuando GitHub lo solicite.
4. Haz el commit.
5. Espera unos minutos y recarga con `Ctrl + Shift + R`.

No hace falta usar una carpeta `.github`.

## Reglamento fijado

Esta versión utiliza tute habanero para dos jugadores:

- Ocho cartas iniciales para cada jugador.
- Una carta visible determina el triunfo.
- Mientras existe baceta se juega libremente.
- Al agotarse la baceta se obliga a asistir, montar y fallar.
- Tras cada baza roba primero quien la ha ganado.
- Los cantes se realizan después de ganar una baza y antes del robo.
- La última baza añade diez tantos.
- En empate gana quien consiguió las diez de últimas.

## Créditos

Consulta `CREDITOS.md` para conocer la procedencia y la licencia de la baraja.
