# Alpha 3 – Bevölkerungswachstum und Stadtstartwerte

| Stadt | Bevölkerung | Grundwohnraum | freier Wohnraum | Startwohlstand |
|---|---:|---:|---:|---:|
| Lambrecht | 1.000 | 1.100 | 100 | 40,0 |
| Neustadt | 2.500 | 2.750 | 250 | 50,0 |
| Mannheim | 5.000 | 5.500 | 500 | 65,0 |

Marktbestände, Basispreise, Zielbestände und Koordinaten aus Alpha 2 bleiben unverändert.

`freeHousing = max(0, totalHousing - population)`, `desiredBuffer = 0,10 × population` und `housingFactor = clamp(freeHousing / max(desiredBuffer, epsilon), 0, 1)`. Kein freier Wohnraum ergibt 0, fünf Prozent freien Wohnraum ungefähr 0,5 und mindestens zehn Prozent 1.

`wealthFactor = clamp((wealth - 40) / 40, 0, 1)`. Bei Wohlstand 40 oder weniger gibt es kein Wachstum; 50 / 60 / 70 / mindestens 80 entsprechen 25 / 50 / 75 / 100 Prozent der Maximalrate.

Die maximale Wachstumsrate ist 0,1 Prozent pro Spieltag, also `maxGrowthRatePerHour = 0,001 / 24`. `rawGrowth = population × maxGrowthRatePerHour × housingFactor × wealthFactor`. Bevölkerung bleibt ganzzahlig; der Bruchteil wird je Stadt mindestens mit 1/1.000.000 Genauigkeit akkumuliert. Je Tick wird nur der ganze Anteil gebucht. Wachstum ist `min(totalHousing, population + accumulatedWholeGrowth)`; ein die Kapazität überschreitender Rest wird verworfen.

Bei schlechtem Wohlstand oder fehlendem Wohnraum ist Wachstum null, niemals negativ. Neue Einwohner beeinflussen Arbeiterpool und Verbrauch erst im Folgetick; der aktuelle Tick verwendet stets die Anfangsbevölkerung. Der Tickbericht enthält `populationBefore`, `populationAfter`, `populationGrowth`, `growthRemainder`, `totalHousing`, `freeHousing`, `housingFactor`, `wealthFactor` und `growthRateApplied`.

Die verbindliche 720-Tick-Referenzsimulation steht in [`test-world.md`](test-world.md). Sie prüft für die konstanten Zielwohlstände 62,0 / 85,2 / 100,0 die Zielwerte von etwa 1.004 / 2.533–2.534 / 5.112–5.113 Einwohnern bei ±2 Toleranz sowie Wohlstand bei ±0,1.
