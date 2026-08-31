# Kapitel 4: Farbe, Verlauf und Kontrast

Acht Schemata sind eingebaut: `github`, `emerald`, `sky`, `coral`, `amber`,
`purple`, `sunset` und `grayscale`. Jedes bringt eine helle und eine dunkle
Fassung mit; `dark: true` schaltet um.

```typescript
grid.render({ colorScheme: 'sunset', dark: true });
```

## Die Wahl ist keine Dekoration

Ein Farbschema entscheidet mit, welche Unterschiede sichtbar werden. `grayscale`
klingt nach Verzicht, ist aber die ehrlichste Wahl, wenn die Grafik gedruckt
wird oder wenn Farbe bereits eine andere Bedeutung trägt.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_grayscale_front_35deg.svg" style="width:100%;aspect-ratio:1.441;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Ein Jahr in Graustufen. Die Höhe trägt die Aussage allein — und trägt sie.</figcaption>
</figure>


<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_coral_behind.svg" style="width:100%;aspect-ratio:1.52;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Dasselbe Prinzip in Coral: die Farbe verstärkt, was die Höhe schon sagt.</figcaption>
</figure>


## Verläufe zwischen den Zellen

Standardmässig bekommt jede Zelle ihre eigene Farbe. Bei `ribbon` und
`flatribbon` kann die Farbe stattdessen stetig zwischen den Stützpunkten
übergehen. Das Ergebnis liest sich wie ein Verlauf und nicht wie eine Folge von
Stufen — richtig für Grössen, die sich tatsächlich stetig ändern.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_split_smooth_gradient.svg" style="width:100%;aspect-ratio:1.627;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Sechs Monate mit stetigem Farbverlauf. Die Übergänge sind so glatt wie die Grösse, die sie zeigen.</figcaption>
</figure>


## Die Null ist eine Farbe wert

`zeroColor` färbt Zellen mit dem Wert null gesondert ein. Das ist wichtiger, als
es klingt: eine Null ist ein gemessener Wert, kein fehlender. Wer beide gleich
darstellt, verliert die Unterscheidung — und trifft Entscheidungen auf einer
Grafik, die eine Lücke als Ruhe ausgibt.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_sunset_greenzero_20deg.svg" style="width:100%;aspect-ratio:2.466;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Die Nullwerte sind grün eingefärbt und dadurch als gemessen erkennbar.</figcaption>
</figure>


## Deckkraft und Untergrund

`opacity` unter 1.0 lässt Rasterlinien und dahinterliegende Reihen durchscheinen.
Bei dicht gestellten Reihen ist das oft der Unterschied zwischen Tiefe und Brei.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_emerald_transparent.svg" style="width:100%;aspect-ratio:1.666;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Teiltransparente Säulen: das Raster darunter bleibt sichtbar und gibt Orientierung.</figcaption>
</figure>

