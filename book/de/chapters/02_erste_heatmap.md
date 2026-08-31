# Kapitel 2: Die erste Heatmap

Das Modell besteht aus zwei Teilen: einem Raster, das Werte hält, und einem
Aufruf, der daraus SVG macht.

```typescript
import { HeatmapGrid } from 'mlc-isometric-heatmap';

const grid = new HeatmapGrid(8, 8);

grid.setCell(0, 0, 15, 'Montagmorgen');
grid.setCell(1, 1, -10, 'Einbruch am Dienstag');
grid.setCell(2, 2, null, 'Keine Messung');

grid.colLabels = ['00', '03', '06', '09', '12', '15', '18', '21'];
grid.rowLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const svg = grid.render({ shape: 'prism', colorScheme: 'emerald' });
```

`setCell` nimmt drei Dinge: Spalte, Zeile, Wert — und optional einen Text, der
als Tooltip erscheint. Der Wert darf `null` sein, und das ist kein Sonderfall,
sondern ein eigener Zustand: siehe Kapitel 6.

## Die wichtigsten Optionen

`render()` nimmt ein Objekt. Keine Option ist Pflicht; die Voreinstellungen
ergeben ein brauchbares Bild.

| Option | Vorgabe | Wirkung |
| :--- | :--- | :--- |
| `shape` | `'prism'` | Form der Säulen: `prism`, `cylinder`, `ribbon`, `flatribbon`, `mesh` |
| `colorScheme` | `'github'` | `github`, `emerald`, `sky`, `coral`, `amber`, `purple`, `sunset`, `grayscale` — oder ein eigenes Schema |
| `dark` | `false` | Farbwerte für dunklen Untergrund |
| `maxHeight` | `40` | Höhe der höchsten Säule in Pixeln |
| `gridSize` | `16` | Kantenlänge einer Zelle |
| `gap` | `2` | Abstand zwischen benachbarten Säulen |
| `projectionAngle` | `30` | Blickwinkel in Grad, sinnvoll zwischen 10 und 60 |
| `opacity` | `1.0` | Deckkraft der Säulen |
| `showGrid` | `true` | Rasterlinien auf dem Boden |
| `labelPosition` | `'behind'` | Beschriftung hinter oder vor dem Raster |
| `interactive` | `true` | Tooltips und Hervorhebung beim Überfahren |
| `animated` | `true` | Gestaffelter Aufbau beim Laden |

## Der Blickwinkel entscheidet mit

`projectionAngle` ist die Option, die am meisten am Ergebnis ändert und am
leichtesten übersehen wird. Ein flacher Winkel betont die Fläche und das Muster,
ein steiler betont die Höhe und den einzelnen Ausschlag.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_low_profile.svg" style="width:100%;aspect-ratio:3.813;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Flaches Profil: die Verteilung über den Tag steht im Vordergrund.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_sky_front_45deg.svg" style="width:100%;aspect-ratio:1.127;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Steiler Winkel mit Beschriftung vorn: der einzelne Wert wird lesbar, das Gesamtmuster tritt zurück.</figcaption>
</figure>


Es gibt keinen richtigen Winkel — es gibt einen, der zur Frage passt. Wer nach
einem Ausreisser sucht, nimmt einen steilen; wer die Form des Tages zeigen will,
einen flachen.

## Beschriftung

Zeilenbeschriftungen lassen sich eigenständig gestalten: Schriftgrösse, Farbe,
und vor allem eine Hinterlegung, damit sie auf unruhigem Grund lesbar bleiben.

```typescript
grid.render({
  rowLabelStyle: {
    backgroundColor: '#2f3542',
    backgroundOpacity: 0.8,
    padding: 4,
    borderRadius: 2,
  },
});
```

Gibt man eine Hintergrundfarbe ohne Textfarbe an, wählt die Bibliothek den
Kontrast selbst — hell auf dunklem Grund, dunkel auf hellem.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_sky_styled_labels_slate_bg.svg" style="width:100%;aspect-ratio:1.592;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Hinterlegte Beschriftung: die Zeilennamen bleiben lesbar, wo Säulen dahinterstehen.</figcaption>
</figure>

