# Kapitel 5: Zeitreihen ohne Handarbeit

Ein Raster von Hand zu füllen ist bei acht mal acht Zellen zumutbar. Bei einem
Jahr sind es 371, und die Zuordnung von Zeitstempel zu Zelle ist genau die Art
Rechnung, bei der Sommerzeit und Wochenanfang Fehler erzeugen, die niemand sieht.

Dafür gibt es die Aggregatoren. Sie liegen in einem eigenen Einstiegspunkt, damit
niemand sie mitlädt, der sie nicht braucht:

```typescript
import { presets } from 'mlc-isometric-heatmap/presets';

const events = [
  { timestamp: new Date('2026-06-09T10:15:00Z'), value: 5 },
  { timestamp: new Date('2026-06-09T15:30:00Z'), value: 20 },
];
```

## 24 Stunden gegen Wochentage

```typescript
const grid = presets.aggregate24h(events, { startOfWeek: 1 });
```

24 Spalten, 7 Zeilen. `startOfWeek: 1` beginnt am Montag — die Vorgabe des
Sonntags stammt aus dem amerikanischen Kalender und ist hierzulande fast immer
falsch.

Das ist die Ansicht für Tagesrhythmen: wann läuft die Anlage, wann ist es still,
und unterscheidet sich das Wochenende.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_row_timeline.svg" style="width:100%;aspect-ratio:1.858;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Zwei Messreihen als Tageszeitleiste.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_single_day_4points.svg" style="width:100%;aspect-ratio:1.815;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein einzelner Tag mit vier Messpunkten — auch dünne Daten ergeben ein lesbares Bild.</figcaption>
</figure>


## Ein Monat

```typescript
const grid = presets.aggregateMonth(events, { year: 2026, month: 5 });
```

Wochen als Spalten, Wochentage als Zeilen. Der Monat ist die Ansicht, in der ein
Mensch noch jeden einzelnen Tag wiederfindet.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_emerald_cylinder_height_grid_solid.svg" style="width:100%;aspect-ratio:1.464;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein Monat mit Höhenraster als Massstabswand im Rücken.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_workweek_mon_fri_calendar.svg" style="width:100%;aspect-ratio:1.374;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Nur Montag bis Freitag: wo das Wochenende nichts beiträgt, kostet es nur Platz.</figcaption>
</figure>


## Ein halbes Jahr

Zwischen Monat und Jahr klafft eine Lücke: 26 Wochen sind zu viel für die
Monatsansicht und zu wenig, um im Jahresraster als Muster zu erscheinen. Dafür
gibt es die Sechsmonatsvorlagen, wahlweise mit monatlichen Trennern.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_split_sunset.svg" style="width:100%;aspect-ratio:1.602;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Sechs Monate mit Monatstrennern: die Grenzen bleiben ablesbar.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_double_sunset_height_grid.svg" style="width:100%;aspect-ratio:1.65;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Zwei Reihen über sechs Monate, mit Höhenraster.</figcaption>
</figure>


## Ein Jahr

```typescript
const grid = presets.aggregateYear(events, { year: 2026 });
```

53 Wochen gegen 7 Wochentage — die Form, die man von Beitragsgrafiken kennt, hier
mit Höhe. Bei dieser Dichte sind Beschriftungen oft mehr Störung als Hilfe;
`showRowLabels: false` nimmt sie weg.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_sunset_no_row_labels.svg" style="width:100%;aspect-ratio:1.924;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein Jahr ohne Zeilenbeschriftung: das Muster trägt allein.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_emerald_mesh_terrain.svg" style="width:100%;aspect-ratio:2.003;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Dasselbe Jahr als Höhenrelief statt als Säulen.</figcaption>
</figure>


## Mehrere Gruppen nebeneinander

Vergleicht man Zeiträume oder Standorte, lassen sich mehrere Raster zu einer
Grafik zusammensetzen, statt sie nebeneinanderzulegen. Der Vorteil ist ein
gemeinsamer Massstab — getrennte Grafiken haben getrennte Maxima, und der
Vergleich täuscht.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/multimonth_combined_groups.svg" style="width:100%;aspect-ratio:1.528;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Mehrere Monatsgruppen in einer Grafik, mit gemeinsamem Massstab.</figcaption>
</figure>

