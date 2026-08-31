# Kapitel 1: Warum isometrisch?

Eine Heatmap in der Fläche kennt jeder: ein Raster aus Kacheln, die Farbe trägt
den Wert. Das funktioniert, solange die Werte weit auseinanderliegen. Sobald sie
das nicht tun, stösst die Darstellung an eine Grenze, die im Auge liegt und
nicht in den Daten — zwei benachbarte Grüntöne unterscheidet niemand zuverlässig,
und wer es versucht, liest die Legende statt der Grafik.

Diese Bibliothek gibt dem Wert eine zweite Ausdrucksform: **Höhe**. Farbe und
Höhe tragen dieselbe Zahl, und das Auge liest die eine, wo die andere versagt.
Ein Ausreisser ragt heraus, bevor man ihn sucht.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_ribbon.svg" style="width:100%;aspect-ratio:3.813;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Zwei Messreihen über 24 Stunden. Der Ausschlag am Nachmittag ist als Höhe sofort sichtbar — in der Fläche wäre er ein etwas kräftigeres Grün.</figcaption>
</figure>


## Was die Bibliothek ist

`mlc-isometric-heatmap` ist eine TypeScript-Bibliothek, die aus einem Zahlenraster
eine isometrische 3D-Ansicht als **SVG** erzeugt. Kein Canvas, kein WebGL, keine
Laufzeitabhängigkeit: heraus kommt eine Zeichenkette, die man in eine Seite
schreibt, in eine Datei legt oder per E-Mail verschickt.

Das hat Folgen, die über die Technik hinausgehen:

- **Auflösungsunabhängig.** Dieselbe Datei sieht auf einem Telefon und auf einem
  Plakat gleich scharf aus.
- **Durchsuchbar und zugänglich.** Jede Zelle trägt ein `<title>`, das
  Bildschirmleser vorlesen und Browser als Tooltip zeigen.
- **Interaktiv ohne JavaScript.** Hervorhebung beim Überfahren steckt als
  CSS-Regel im SVG selbst. Alle Beispiele in diesem Buch sind so eingebettet —
  fahre mit dem Zeiger über eine Säule und der Wert erscheint.
- **Serverseitig erzeugbar.** Die Bibliothek läuft in Node genauso wie im
  Browser. Ein Bericht kann sein Bild mitbringen, statt es beim Öffnen zu bauen.

## Installation

```bash
npm install mlc-isometric-heatmap
```

Ohne Bauwerkzeuge geht es direkt im Browser:

```html
<script type="module">
  import { HeatmapGrid } from 'https://unpkg.com/mlc-isometric-heatmap/dist/index.es.js';
</script>
```

Wer klassische `<script>`-Einbindung braucht, nimmt den UMD-Build; die Bibliothek
liegt dann unter `window.MlcIsometricHeatmap`, die Kalender-Aggregatoren unter
`window.MlcIsometricHeatmapPresets`.

## Wofür sie gedacht ist

Der Ursprung ist Sensorik: Messwerte über Zeit, mit einer natürlichen
Rasterung — Stunden gegen Wochentage, Tage gegen Wochen, Wochen gegen Monate.
Überall dort, wo ein Muster sich über zwei Achsen wiederholt, zeigt die
isometrische Ansicht mehr als eine Linie.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_sunset_greenzero_20deg.svg" style="width:100%;aspect-ratio:2.466;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein ganzes Jahr, 53 Wochen gegen 7 Wochentage. Das Muster der Wochenenden liegt offen, ohne dass es jemand hervorheben musste.</figcaption>
</figure>

