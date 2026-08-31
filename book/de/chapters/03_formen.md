# Kapitel 3: Die fünf Formen

`shape` bestimmt, wie ein Wert zu Geometrie wird. Die Wahl ist keine
Geschmacksfrage — jede Form beantwortet eine andere Frage gut und eine andere
schlecht.

## prism — der Standard

Ein Quader je Wert, klar abgegrenzt. Die Vorgabe, und für den Normalfall die
richtige: einzelne Werte bleiben unterscheidbar, das Raster bleibt lesbar.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_triple_prism_mixed.svg" style="width:100%;aspect-ratio:1.824;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Drei Messreihen als Quader. Jeder Wert ist ein eigener Körper und als solcher ablesbar.</figcaption>
</figure>


## cylinder — weicher, gleiches Prinzip

Dieselbe Aussage, rundere Form. Nützlich, wenn die Grafik neben Fliesstext steht
und die harten Kanten des Quaders zu technisch wirken.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_cylinder.svg" style="width:100%;aspect-ratio:1.858;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Zylinder statt Quader — dieselben Daten, ruhigeres Bild.</figcaption>
</figure>


## ribbon — der Verlauf

Statt getrennter Körper eine durchgehende Fläche entlang der Reihe. Der Blick
folgt dem Verlauf, nicht dem Einzelwert. Genau richtig, wenn die Frage lautet
„wie entwickelt sich das", und falsch, wenn sie lautet „wie hoch war Dienstag".

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_triple_ribbon.svg" style="width:100%;aspect-ratio:3.963;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Drei Bänder. Der Vergleich der Verläufe untereinander ist die Stärke dieser Form.</figcaption>
</figure>


## flatribbon — das schwebende Band

Ein `ribbon` reicht bis zum Boden hinunter und wirkt dadurch massiv. Der
`flatribbon` ist ein Band gleichbleibender Dicke, das der Datenlinie folgt und
in der Luft steht. Bei mehreren übereinanderliegenden Reihen ist das der
Unterschied zwischen Lesbarkeit und einem Block.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_triple_flatribbon.svg" style="width:100%;aspect-ratio:3.963;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Drei schwebende Bänder. Weil sie nicht bis zum Boden reichen, verdecken sie einander nicht.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_gradient_sky_flatribbon.svg" style="width:100%;aspect-ratio:3.255;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Flatribbon mit durchgehendem Farbverlauf — Höhe und Farbe tragen dieselbe Aussage.</figcaption>
</figure>


## mesh — das Gelände

Alle anderen Formen behandeln Werte als getrennte Körper. `mesh` behandelt das
gesamte Raster als eine zusammenhängende Oberfläche: benachbarte Punkte werden
direkt durch Polygone verbunden, es entsteht ein Höhenrelief.

Das ist die Form für Daten, die tatsächlich stetig sind — Temperatur über Fläche
und Zeit, Auslastung über ein Netz. Für gezählte Ereignisse ist sie irreführend,
weil sie eine Stetigkeit behauptet, die die Daten nicht haben.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/mesh_terrain_sunset_hills.svg" style="width:100%;aspect-ratio:1.637;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein Höhenrelief. Das runde Loch in der Mitte ist kein Fehler, sondern ein See aus null-Werten — siehe Kapitel 6.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/mesh_terrain_emerald_hills.svg" style="width:100%;aspect-ratio:2.306;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Dasselbe Gelände in einem anderen Farbschema.</figcaption>
</figure>


## Formen mischen

Die Form lässt sich je Reihe setzen. Das ist selten die richtige Wahl — aber
wenn zwei Messreihen wesensverschieden sind, etwa eine gezählte und eine
gemessene, macht der Formunterschied das sichtbar, bevor jemand die Legende
liest.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_mixed_shapes_per_row.svg" style="width:100%;aspect-ratio:1.395;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Verschiedene Formen je Reihe innerhalb einer Grafik.</figcaption>
</figure>

