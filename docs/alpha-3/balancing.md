# Alpha 3 – Referenz-Balancing der Produktion

Die Referenzmarge bewertet einen Volltick bei Marktbeständen exakt am Zielbestand. Inputs werden zum Spieler-Kaufpreis von 105 Prozent des Basiswerts, Outputs zum Spieler-Verkaufspreis von 95 Prozent bewertet. Ein voll besetztes Gebäude verursacht 200 Gold Lohn; Baukosten und Marktbewegungen großer Transaktionen bleiben unberücksichtigt.

`referenceMargin = outputValue × 0,95 - inputValue × 1,05 - 200`

| Gebäude | Referenzmarge je Volltick |
|---|---:|
| `grain_farm` | 1.700 Gold |
| `windmill` | 612 Gold |
| `bakery` | 676,50 Gold |
| `cattle_farm` | 745 Gold |
| `butchery` | 451 Gold |
| `dairy` | 592 Gold |
| `forestry` | 1.320 Gold |
| `sawmill` | 565,50 Gold |
| `clay_pit` | 1.130 Gold |
| `brickyard` | 547 Gold |
| `pottery` | 775 Gold |
| `charcoal_kiln` | 527,50 Gold |
| `iron_mine` | 2.365 Gold |
| `smithy` | 1.315 Gold |
| `cotton_plantation` | 2.080 Gold |
| `weavery` | 535 Gold |
| `tailor` | 1.015 Gold |
| `carpentry` | 1.285 Gold |
| `sugarcane_plantation` | 1.510 Gold |
| `sugar_refinery` | 527 Gold |
| `distillery` | 970 Gold |

Alle Margen sind verbindliche Test- und Plausibilitätswerte, aber keine Gewinnzusage: reale Marktpreise ändern sich mit Bestand und Handel.
