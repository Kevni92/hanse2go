# Alpha 3 – Warenversorgung, Kaufkraft und Wohlstand

`wealth` ist der einzige soziale Stadtwert von 0 bis 100. Arbeitslosigkeit wirkt nur über fehlendes Lohneinkommen, Versorgung nur über Warenabdeckung; eine separate Zufriedenheit existiert nicht.

## Verbrauch und Versorgung

| Ware | ID | Tonnen je 1.000 Einwohner und Tick | Gewicht |
|---|---|---:|---:|
| Brot | `bread` | 4 | 25 % |
| Fleisch | `meat` | 2 | 15 % |
| Käse | `cheese` | 2 | 15 % |
| Kleidung | `clothing` | 2 | 15 % |
| Keramik | `ceramics` | 2 | 10 % |
| Möbel | `furniture` | 2 | 10 % |
| Rum | `rum` | 2 | 10 % |

Für Ware `g` und Stadt `c` gilt mit Hundertstel-Tonnen: `rateUnits = tonsPer1000 × 100`, `raw = rateUnits × population + previousConsumptionRemainder`, `requestedUnits = floor(raw / 1000)` und `newConsumptionRemainder = raw mod 1000`. Der Rest wird auch bei Knappheit fortgeführt. Für 1.000 / 2.500 / 5.000 Einwohner betragen Brotverbrauch 4,00 / 10,00 / 20,00 Tonnen und alle übrigen Waren je 2,00 / 5,00 / 10,00 Tonnen.

`consumedUnits = min(requestedUnits, marketStockUnits)`, `missingUnits = requestedUnits - consumedUnits`. Bei positiver Nachfrage ist `coverage = consumedUnits / requestedUnits`, sonst 1. `overallCoverage = sum(coverage(g) × weight(g))` und liegt in `[0,1]`.

## Einkommen und Kaufkraft

`totalIncome(c) = sum(wageCost(b))` enthält nur tatsächlich atomar abgezogene Löhne. `incomePerCapita = totalIncome / max(population, 1)`. Einkommen wird nicht angespart.

Der Grundwarenkorb enthält je 1.000 Einwohner 4 Brot, 2 Fleisch, 2 Käse und 2 Kleidung: `basicBasketCostPer1000 = 4 × consumerPrice(bread) + 2 × consumerPrice(meat) + 2 × consumerPrice(cheese) + 2 × consumerPrice(clothing)`. `consumerPrice` ist der Spieler-Kaufpreis unmittelbar vor Verbrauch. `basicBasketCostPerCapita = basicBasketCostPer1000 / 1000`; Keramik, Möbel und Rum zählen zur Versorgung, nicht zum Korb.

`purchasingPower = clamp(incomePerCapita / max(basicBasketCostPerCapita, epsilon), 0, 1)`.

## Ziel und Anpassung

`targetWealth = 100 × overallCoverage × (0,4 + 0,6 × purchasingPower)`. Deshalb ergeben volle Versorgung mit Kaufkraft 0 / 0,5 / 1 die Zielwerte 40 / 70 / 100; halbe Versorgung bei voller Kaufkraft ergibt 50, fehlende Versorgung 0.

Der Wohlstand schließt je Spieltag 2 Prozent der Differenz. Pro Stunde gilt verbindlich `newWealth = oldWealth + (targetWealth - oldWealth) × 842 / 1.000.000`; Rechenreste werden je Stadt akkumuliert. Der autoritative Wert hat mindestens vier Nachkommastellen, wird auf 0 bis 100 begrenzt und in API/UI mit einer Nachkommastelle angezeigt.

Der Tickbericht enthält `incomeTotal`, `incomePerCapita`, `basicBasketCostPerCapita`, `purchasingPower`, `coverageByGood[]`, `overallCoverage`, `wealthBefore`, `targetWealth`, `wealthAfter` sowie angeforderte, verbrauchte und fehlende Mengen je Ware.

Die Wohlstandskarte und die fest sortierte Versorgungsliste zeigen diese serverbestätigten Werte mit Textalternativen zu Farbzuständen. Darstellung, Trends und zugängliche Bedienung stehen in [`user-interface.md`](user-interface.md).
