# Kapitel 6: Null ist nicht nichts

Der Unterschied zwischen einer gemessenen Null und einer fehlenden Messung ist
der wichtigste in dieser Bibliothek — und der, den Visualisierungen am
häufigsten verwischen.

| Wert | Darstellung |
| :--- | :--- |
| Zahl | Säule in Höhe und Farbe des Werts |
| `0` | flache Platte auf dem Boden, in `zeroColor` oder der Themenfarbe |
| `null` | **nichts** — nur die Rasterlinien, kein Körper, kein Tooltip |

Eine Null heisst: die Anlage lief und hat nichts produziert. Ein `null` heisst:
wir wissen es nicht. Wer beides gleich darstellt, macht aus einem Ausfall eine
ruhige Nacht.

Dass ein `null` auch **keinen Tooltip** bekommt, ist Absicht: es gibt nichts zu
berichten, und ein leerer Tooltip wäre eine Aussage, wo keine ist.

## Wie die vier Formen mit Lücken umgehen

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/null_test_8x8_prism.svg" style="width:100%;aspect-ratio:1.399;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">prism: die Lücke ist ein Loch im Raster, unverwechselbar.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/null_test_8x8_cylinder.svg" style="width:100%;aspect-ratio:1.399;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">cylinder: dasselbe Verhalten, rundere Körper.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/null_test_8x8_ribbon.svg" style="width:100%;aspect-ratio:1.423;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">ribbon: das Band bricht ab und setzt danach neu an, statt über die Lücke zu interpolieren.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/null_test_8x8_flatribbon.svg" style="width:100%;aspect-ratio:1.404;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">flatribbon: auch das schwebende Band unterbricht — eine durchgezogene Linie würde Daten behaupten.</figcaption>
</figure>


Der letzte Punkt ist der wesentliche: bei durchgehenden Formen wäre es technisch
einfach, über eine Lücke hinwegzuzeichnen. Das Ergebnis sähe besser aus und wäre
gelogen.

## Lücken im Gelände

Beim Höhenrelief wird aus der Lücke ein Loch in der Oberfläche. Das ist die
sichtbarste Form der Aussage „hier fehlt etwas".

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/mesh_terrain_sunset_hills_flat.svg" style="width:100%;aspect-ratio:1.593;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein Relief mit einer Aussparung. Der Rand des Lochs ist sauber, weil keine Polygone über fehlende Punkte gespannt werden.</figcaption>
</figure>

