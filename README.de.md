# MLC Isometrische 3D-Heatmap-Bibliothek

[English Version / Englische Version](README.md)

Eine leichtgewichtige, wiederverwendbare TypeScript-Bibliothek zur Erstellung hochwertiger, interaktiver isometrischer 3D-Heatmaps als reine Vektorgrafiken (SVG).

Im Gegensatz zu klassischen flachen 2D-Heatmaps projiziert diese Bibliothek Datenpunkte in den isometrischen Raum. Dabei werden anpassbare 3D-Formen (Quader, Zylinder und fließende Bänder) verwendet. Sie unterstützt Ladeanimationen, divergierende Farbschemata, absinkende negative Werte sowie die transparente Darstellung von Null-Werten (fehlenden Messdaten).

---

## Warum 3D-Isometrie?

Herkömmliche 2D-Heatmaps codieren Zahlenwerte **ausschließlich über Farbschemata**. Auf digitalen Bildschirmen funktioniert das hervorragend, im echten Leben stößt es jedoch an Grenzen:

1.  **Druck & Graustufen-Konvertierung**: Werden Berichte oder Dashboards in Schwarz-Weiß ausgedruckt oder kopiert, verschwimmen feine Farbnuancen zu identischen Grautönen. Die Daten sind auf Papier kaum noch unterscheidbar.
2.  **Farbenblindheit-Barrierefreiheit**: Für Personen mit Farbsehschwächen (z. B. Roter- oder Grüner-Sehschwäche) ist das Ablesen reiner Farbskalen oft sehr schwer.

Durch **3D-Höhe und Perspektive**:
*   Werden Werte doppelt codiert: über die **Farbnuance** und über die **physische Säulenhöhe**.
*   Bleiben relative Unterschiede auch in Graustufen oder im Schwarz-Weiß-Druck **sofort lesbar und unterscheidbar**.
*   Wird Barrierefreiheit sichergestellt, da das Ablesen nicht allein von der Farbwahrnehmung abhängt.

---

## Features

*   **Reine Vektorgrafik (SVG)**: Wird direkt als SVG-String generiert. Extrem leichtgewichtig, unendlich skalierbar und einfach in HTML einzubetten oder per CSS zu stylen.
*   **Fünf 3D-Formen**:
    *   `prism`: Kantige, dreidimensionale Quadersäulen.
    *   `cylinder`: Runde 3D-Zylinder mit feinen Verläufen und Schattierungen.
    *   `ribbon`: Fließende, kontinuierliche 3D-Bänder (Kurven) mittels kubischer Splines.
    *   `flatribbon`: Ein schwebendes 3D-Band mit konstanter Stärke, das parallel zur Datenkurve verläuft.
    *   `mesh`: Ein zusammenhängendes 3D-Netz (Terrain) mit Lambert-Schattierung.
*   **Kompakte Daten-Struktur**: Klares MVC-Design mit einem eigenen Koordinaten-Datenmodell (`HeatmapGrid`) getrennt vom Rendering-Prozess.
*   **Flexible Achsenbeschriftungen**: Automatische Zentrierung, Ausrichtung und Abstände für Zeilen-/Spaltenbeschriftungen (vorne oder hinten positionierbar).
*   **Negative Werte (Täler & Gräben)**: Volle Unterstützung für negative Werte, die sich unter den Grid-Boden absenken, inklusive kontrastierender Divergenzfarben.
*   **Null-Wert-Transparenz**: Zellen mit `null` (fehlende Messdaten) werden als leerer Raum (nur Gitterlinien) dargestellt. Bänder sinken davor sanft ab und enden sauber.
*   **Interaktivität**: CSS-Load-Animationen mit staggered Delay (zeitlich versetzt nach Koordinaten) und integrierte Mouseover-Title-Tags für Tooltips.

---

## Installation & CDNs

### 1. Über npm
Installiere die Bibliothek lokal in deinem Projekt:

```bash
npm install mlc-isometric-heatmap
```

### 2. Über CDN (Browser-native ES6-Module)
Lade die Rendering-Engine direkt in modernen Browsern ohne Build-Tools:

```html
<script type="module">
  import { HeatmapGrid } from 'https://unpkg.com/mlc-isometric-heatmap@1.2.1/dist/index.es.js';

  const grid = new HeatmapGrid(5, 5);
  // ...
</script>
```

### 3. Über CDN (Klassische UMD-Globals)
Lade die Skripte synchron über Standard-HTML-Tags:

```html
<!-- Core Visuals Renderer -->
<script src="https://unpkg.com/mlc-isometric-heatmap@1.2.1/dist/index.umd.js"></script>

<!-- Optional Calendar Aggregators -->
<script src="https://unpkg.com/mlc-isometric-heatmap@1.2.1/dist/presets.umd.js"></script>

<script>
  // Zugriff über globale Variablen:
  const grid = new MlcIsometricHeatmap.HeatmapGrid(5, 5);
  const presets = MlcIsometricHeatmapPresets.presets;
</script>
```

---

## Erste Schritte

### 1. Nutzung des OOP Grid-Modells (Standard)
Instanziere ein Grid, fülle Koordinaten aus und rendere das SVG:

```typescript
// ES6-Modul-Import (Node/Bundler):
import { HeatmapGrid } from 'mlc-isometric-heatmap';

// Oder Browser-native ES6-Modul-CDN-Import:
// import { HeatmapGrid } from 'https://unpkg.com/mlc-isometric-heatmap@1.2.1/dist/index.es.js';

// 1. Grid erstellen (8 Spalten x 8 Zeilen)
const grid = new HeatmapGrid(8, 8);

// 2. Werte eintragen (Spalte, Zeile, Wert, Label)
grid.setCell(0, 0, 15, 'Montag Vormittag');
grid.setCell(1, 1, -10, 'Dienstag Tiefpunkt');
grid.setCell(2, 2, null, 'Keine Daten (wird transparent)');

// 3. Achsenbeschriftungen definieren
grid.colLabels = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];
grid.rowLabels = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];

// 4. In SVG-String rendern
const svg = grid.render({
  shape: 'prism',          // 'prism' | 'cylinder' | 'ribbon' | 'flatribbon'
  colorScheme: 'emerald',  // Farbschema wählen
  dark: false,             // Dark Mode aktivieren
  showGrid: true,          // Gitterlinien anzeigen
  opacity: 1.0,            // Opazität (0.1 bis 1.0)
});
```

### 2. Nutzung vordefinierter Kalender-Presets
Verwende Aggregations-Presets, um zeitbasierte Listen automatisch in Kalender-Layouts zu überführen. Diese werden aus einem eigenen npm-Subpfad geladen:

```typescript
// ES6-Modul-Imports (Node/Bundler):
import { renderHeatmap } from 'mlc-isometric-heatmap';
import { presets } from 'mlc-isometric-heatmap/presets';

// Oder Browser-native ES6-Modul-CDN-Imports:
// import { renderHeatmap } from 'https://unpkg.com/mlc-isometric-heatmap@1.2.1/dist/index.es.js';
// import { presets } from 'https://unpkg.com/mlc-isometric-heatmap@1.2.1/dist/presets.es.js';

// 1. Wöchentliche 24h-Ansicht (24 Spalten für Stunden x 7 Zeilen für Tage)
const events = [
  { timestamp: new Date('2026-06-09T10:15:00Z'), value: 5 },
  { timestamp: new Date('2026-06-09T15:30:00Z'), value: 20 }
];
const weeklyGrid = presets.aggregate24h(events, { startOfWeek: 1 });
const weeklySvg = weeklyGrid.render({ colorScheme: 'sky' });

// 2. Monatskalender (5 Wochen-Spalten x 7 Wochentage)
const monthlyGrid = presets.aggregateMonth(events, { year: 2026, month: 5 }); // Juni

// 3. Jahresbeitrags-Grid (53 Wochen-Spalten x 7 Wochentage)
const yearlyGrid = presets.aggregateYear(events, { year: 2026 });
```

---

## Visualisierungsoptionen

Du kannst die Darstellung anpassen, indem du diese Einstellungen an `.render()` oder `renderHeatmap()` übergibst:

| Option | Typ | Standard | Beschreibung |
| :--- | :--- | :--- | :--- |
| `gridSize` | `number` | `16` | Seitenlänge jeder Grid-Zelle in Pixeln. |
| `gap` | `number` | `2` | Abstand zwischen benachbarten 3D-Elementen. |
| `maxHeight` | `number` | `40` | Maximale Höhe eines 3D-Balkens (für den Höchstwert) in Pixeln. |
| `colorScheme`| `string \| CustomColorScheme` | `'github'` | Presets: `'github'`, `'emerald'`, `'sky'`, `'coral'`, `'amber'`, `'purple'`, `'sunset'`, `'grayscale'`. |
| `dark` | `boolean` | `false` | Aktiviert die Dark-Mode-Farbvarianten. |
| `shape` | `'prism' \| 'cylinder' \| 'ribbon' \| 'flatribbon' \| 'mesh'` | `'prism'` | Layout-Form. |
| `opacity` | `number` | `1.0` | Deckkraft der 3D-Objektkörper (0.1 bis 1.0). |
| `showGrid` | `boolean` | `true` | Zeigt die Boden-Gitterlinien im isometrischen Raum. |
| `zeroColor` | `string` | `undefined` | Eigene Farbe für Elemente mit dem Wert 0. |
| `renderFlatZero` | `boolean` | `true` | Rendert eine flache 2D-Fliese für Nullwerte anstelle einer leeren Stelle. |
| `interactive` | `boolean` | `true` | Bettet mouseover Title-Tags für Tooltips ein. |
| `animated` | `boolean` | `true` | Aktiviert die zeitlich versetzten Lade-Animationen. |
| `projectionAngle` | `number` | `30` | Isometrischer Kamerawinkel in Grad (10° bis 60°). |
| `labelPosition` | `'behind' \| 'front'` | `'behind'` | Position der Achsenbeschriftungen relativ zum Gitter. |
| `interpolateColors` | `boolean` | `false` | Aktiviert stufenlose Farbverläufe (RGB-Farbinterpolation). |
| `showRowLabels` | `boolean` | `true` | Schaltet die Sichtbarkeit der Zeilenbeschriftungen (Serientext) ein/aus. |
| `rowLabelStyle` | `RowLabelStyle` | `undefined` | Eigene Formatierung der Zeilenbeschriftungen (Hintergrund-Boxen, Farben, Padding, Schriftgröße). |

---

### RowLabelStyle-Optionen (Zeilenbeschriftungen)

Passe die Zeilentexte mithilfe des Konfigurationsobjekts `rowLabelStyle` detailliert an:

*   `show?: boolean`: Einfaches Ein- und Ausschalten der Beschriftung (Standard: `true`).
*   `fontSize?: number`: Schriftgröße in Pixeln (Standard: `9`).
*   `fontFamily?: string`: Schriftart (Standard: `'sans-serif'`).
*   `color?: string`: Textfarbe (Standard: Standardbeschriftungsfarbe des gewählten Themas).
*   `backgroundColor?: string`: Hintergrundfarbe des Textfelds (z. B. `'#2f3542'`). Wird dies ohne Textfarbe angegeben, wird automatisch eine kontraststarke Textfarbe (weiß auf dunklem Hintergrund, anthrazit auf hellem Hintergrund) ermittelt.
*   `backgroundOpacity?: number`: Deckkraft der Hintergrundbox (Standard: `0.8`).
*   `padding?: number`: Innenabstand (Padding) der Hintergrundbox in Pixeln (Standard: `4`).
*   `borderRadius?: number`: Eckenradius (Border Radius) der Hintergrundbox in Pixeln (Standard: `2`).

---

## Visuelle Beispiele

Hier sind einige im Ordner `demo/output` vorgenerierte SVG-Grafiken, die die Features der Bibliothek demonstrieren:

*   **24h Timeline Gradient Demo (4 Shapes & Continuous Gradient)**:
    ![24h Timeline Gradient Demo](demo/output/24h_gradient_sky_flatribbon.svg)
*   **6-Month Split Timeline (Smooth Gradients)**:
    ![6-Month Split Timeline (Smooth Gradients)](demo/output/sixmonths_split_smooth_gradient.svg)
*   **24h Double-Row Timeline**:
    *   ![24h Double-Row Timeline](demo/output/24h_double_row_timeline.svg)
*   **3D-Oberflächennetz-Gelände (Hügellandschaft)** *(Hinweis: Das kreisförmige Loch in der Mitte stellt einen "See" aus absichtlichen `null`-Werten dar und demonstriert, wie fehlende Messdaten/Ausfälle als saubere Lücke im Gelände gerendert werden)*:
    *   ![3D Surface Mesh Terrain](demo/output/mesh_terrain_sunset_hills.svg)

---

## KI-Unterstützte Entwicklung (Claude, Cursor, Antigravity)

Diese Bibliothek enthält die Datei [skills.md](skills.md), die speziell dafür konzipiert wurde, KI-Assistenten (wie Claude, Cursor, ChatGPT oder Antigravity/Agy) dabei zu helfen, fehlerfreien Integrationscode zu schreiben.

### Kurzanleitung für KI-Tools:
1.  **Für Antigravity (Agy) / Claude**: Weise den Assistenten im Prompt an, zuerst die Datei `skills.md` zu lesen:
    > "Lies bitte die Datei `skills.md` im Projekt-Root-Verzeichnis, um das API-Design und die Code-Rezepte dieser Library zu verstehen."
2.  **Für Cursor**: Referenziere die Datei in deinem Chat oder Composer einfach mittels `@skills.md`.
3.  **Für Custom GPTs/Claude Projects**: Lade die `skills.md` als Referenz-Dokument in deine Wissensdatenbank (Knowledge Base) hoch.

---

## Lizenz & Urheberrecht (License & Attribution)

Dieses Projekt ist unter den Bedingungen der **MIT-Lizenz** lizenziert.

Copyright (c) 2026 Michael Lechner

Die freie Verwendung, Modifikation und Weiterverbreitung dieser Software ist gestattet, vorausgesetzt, dass der obige Urheberrechtshinweis und dieser Erlaubnishinweis in allen Kopien oder wesentlichen Teilen der Software enthalten sind. Weitere Details findest du in der vollständigen Datei [LICENSE](LICENSE).
