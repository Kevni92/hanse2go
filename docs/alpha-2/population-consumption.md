# Alpha 2 – Fester Bevölkerungsverbrauch

## Werte und Berechnung

In jedem Stundentick verbraucht eine Stadt ausschließlich aus ihrem gemeinsamen Markt folgende ganze Tonnen je angefangene 1.000 Einwohner. Die Zahl der Einwohner bleibt in Alpha 2 statisch.

| Ware | Verbrauch je 1.000 Einwohner und Stunde |
|---|---:|
| Brot | 4 |
| Kleidung | 2 |
| Fleisch | 2 |
| Käse | 2 |
| Keramik | 2 |
| Möbel | 2 |
| Rum | 2 |

`Sollverbrauch = ceil(Bevölkerung / 1.000) × Verbrauchswert`. Damit ergeben sich pro Tick:

| Stadt | Bevölkerung | Brot | jede übrige konsumierte Ware |
|---|---:|---:|---:|
| Lambrecht | 1.000 | 4 | 2 |
| Neustadt | 2.500 | 12 | 6 |
| Mannheim | 5.000 | 20 | 10 |

Getreide, Mehl, Vieh, Milch, Holz, Bretter, Lehm, Ziegel, Kohle, Eisen, Werkzeug, Baumwolle, Stoff, Zuckerrohr und Zucker werden von der Alpha-2-Bevölkerung nicht direkt verbraucht. Sie bleiben Markt- und Produktionswaren.

## Buchung und Knappheit

Der Server berechnet pro Stadt und Ware `tatsächlicherVerbrauch = min(Sollverbrauch, Marktbestand)` und zieht genau diese Menge atomar vom Markt ab. Ein Bestand wird daher nie negativ. Bei ausreichendem Bestand entspricht der tatsächliche dem Sollverbrauch; bei teilweiser Knappheit wird der vorhandene Rest verbraucht; bei Bestand null ist der Verbrauch null. Fehlende Waren haben keine weiteren Folgen: kein Wohlstandsverlust, keine Migration, kein Geldfluss und keine Nachbestellung.

Für jede betroffene Ware enthält der Tickbericht `{ cityId, goodId, requested, consumed, remainingStock }`. Die UI zeigt daraus Soll-, Istverbrauch und Fehlmenge `requested - consumed`. Nach der Buchung verwendet der Markt ohne Ausnahme den verbleibenden Bestand für die bestehende Preisformel.

## Abgrenzung

Der Verbrauch ist kein Kaufvorgang und verändert weder Stadt- noch Spielergold. Einkommen, Löhne, Kaufkraft, Wohlstand, Bevölkerungsschichten, Wohnraum und Bevölkerungsentwicklung sind nicht Bestandteil von Alpha 2.
