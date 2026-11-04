# Kapitel 5: Zeitreihen ohne Handarbeit

Ein Raster von Hand zu füllen ist bei acht mal acht Zellen zumutbar. Bei einem
Jahr sind es 371, und die Zuordnung von Zeitstempel zu Zelle ist genau die Art
Rechnung, bei der Sommerzeit und Wochenanfang Fehler erzeugen, die niemand sieht.

Die Presets nehmen diese Arbeit ab: Spalten und Zeilen kommen gar nicht mehr vor.
Es genügt zu sagen, wann etwas war und wie viel, den Platz im Raster findet das
Preset selbst.

## Vom Datum zum Kalender

Presets liegen in einem eigenen Einstiegspunkt, damit niemand sie mitlädt, der sie
nicht braucht:

```typescript
import { presets } from 'mlc-isometric-heatmap/presets';

const days = [
  { date: '2026-09-01', value: 12 },
  { date: '2026-09-02', value: 7 },
  { date: '2026-09-02', value: 3 },
  { date: '2026-09-14', value: 18 },
];

const svg = presets
  .aggregateCalendarMonth(days, { year: 2026, month: 8 }) // Monate zählen ab 0: September
  .render({ colorScheme: 'emerald' });
```

In diesem Code steht keine einzige Koordinate. Den Rest übernimmt das Preset:

- **Position:** Jedes Ereignis landet auf seinem Wochentag und in seiner Woche, samt dem Versatz des Monatsersten.
- **Summe:** Ereignisse am selben Tag werden addiert, der 2. September zeigt hier also 10.
- **Auswahl:** Was außerhalb des Zeitraums liegt, fällt weg. Eine lange Liste kann so mehrere Diagramme versorgen.
- **Beschriftung:** Achsen und Tooltips füllt das Preset aus, `locale` und `weekLabel` passen sie an die Sprache an.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/calendar_month_september.svg" style="width:100%;aspect-ratio:1.665;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Der September als Wandkalender, nur aus Datum und Wert. <a href="https://play.mlcgo.eu/isometric-heatmap/calendar-month">Im Playground ausprobieren</a>.</figcaption>
</figure>

Datumswerte dürfen in der Form kommen, in der sie schon vorliegen:

| Form | Beispiel | Bedeutung |
|---|---|---|
| Reines Datum | `'2026-09-01'` | Dieser Kalendertag, in jeder Zeitzone |
| Zeitstempel mit Zeitzone | `'2026-09-01T22:30:00Z'` | Wird in Ortszeit umgerechnet und kann dadurch auf eine andere Stunde oder einen anderen Tag fallen |
| `Date`-Objekt | `new Date(2026, 8, 1)` | Wie es ist |
| Millisekunden | `1788220800000` | Seit 1970, so liefern es viele Schnittstellen |

Die Zellen folgen immer der Ortszeit dort, wo der Code läuft. Ein unlesbares Datum wird ohne Fehler übersprungen.

## 24 Stunden gegen Wochentage

Dieses Preset liest `timestamp` statt `date`, weil es auf die Stunde ankommt:

```typescript
const events = [
  { timestamp: '2026-06-09T10:15:00', value: 5 },
  { timestamp: '2026-06-09T15:30:00', value: 20 },
];

const grid = presets.aggregate24h(events, { startOfWeek: 1 });
```

24 Spalten, 7 Zeilen. Wochen beginnen standardmäßig am Montag, `startOfWeek: 0` lässt sie am Sonntag beginnen, wie es in US-Kalendern üblich ist.

Das ist die richtige Ansicht für Tagesrhythmen: wann Maschinen laufen, wann Ruhe herrscht und wie sich das Wochenende vom Werktag unterscheidet.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_row_timeline.svg" style="width:100%;aspect-ratio:1.674;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Zwei Messreihen als Tageszeitleiste.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_single_day_4points.svg" style="width:100%;aspect-ratio:1.674;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein einzelner Tag mit vier Messpunkten — auch dünne Daten ergeben ein lesbares Bild.</figcaption>
</figure>


## Ein Monat

```typescript
const grid = presets.aggregateMonth(days, { year: 2026, month: 8 });
```

Wochen als Spalten, Wochentage als Zeilen. Der Monat ist die Ansicht, in der ein
Mensch noch jeden einzelnen Tag wiederfindet.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_emerald_cylinder_height_grid_solid.svg" style="width:100%;aspect-ratio:1.445;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein Monat mit Höhenraster als Massstabswand im Rücken.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_workweek_mon_fri_calendar.svg" style="width:100%;aspect-ratio:1.372;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Nur Montag bis Freitag: wo das Wochenende nichts beiträgt, kostet es nur Platz.</figcaption>
</figure>


## Ein halbes Jahr

Zwischen Monat und Jahr klafft eine Lücke: 26 Wochen sind zu viel für die
Monatsansicht und zu wenig, um im Jahresraster als Muster zu erscheinen. Dafür
gibt es die Sechsmonatsvorlagen, wahlweise mit monatlichen Trennern.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_split_sunset.svg" style="width:100%;aspect-ratio:1.491;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Sechs Monate mit Monatstrennern: die Grenzen bleiben ablesbar.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_double_sunset_height_grid.svg" style="width:100%;aspect-ratio:1.494;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Zwei Reihen über sechs Monate, mit Höhenraster.</figcaption>
</figure>


## Ein Jahr

```typescript
const grid = presets.aggregateYear(days, { year: 2026 });
```

53 Wochen gegen 7 Wochentage — die Form, die man von Beitragsgrafiken kennt, hier
mit Höhe. Bei dieser Dichte sind Beschriftungen oft mehr Störung als Hilfe;
`showRowLabels: false` nimmt sie weg.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_sunset_no_row_labels.svg" style="width:100%;aspect-ratio:1.980;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein Jahr ohne Zeilenbeschriftung: das Muster trägt allein.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_emerald_mesh_terrain.svg" style="width:100%;aspect-ratio:1.976;display:block"></object>
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
<object type="image/svg+xml" data="/books/mlcheatmap/images/multimonth_combined_groups.svg" style="width:100%;aspect-ratio:1.283;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Mehrere Monatsgruppen in einer Grafik, mit gemeinsamem Massstab.</figcaption>
</figure>

