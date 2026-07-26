# Alpha 3 – Produktionsrezepte

Jedes Rezept wird einmal je Stundentick bei voller Besetzung ausgeführt. Die Teilproduktionsregel aus [`production-and-fractions.md`](production-and-fractions.md) skaliert jede Position proportional. Diese Tabelle ersetzt für Alpha 3 die Mengen aus Alpha 2.

| Gebäudetyp | Input je Volltick | Output je Volltick |
|---|---|---|
| `grain_farm` | – | 20 Getreide |
| `windmill` | 10 Getreide | 14 Mehl |
| `bakery` | 10 Mehl | 13 Brot |
| `cattle_farm` | 10 Getreide | 5 Vieh, 10 Milch |
| `butchery` | 5 Vieh | 6 Fleisch |
| `dairy` | 10 Milch | 9 Käse |
| `forestry` | – | 20 Holz |
| `sawmill` | 10 Holz | 13 Bretter |
| `clay_pit` | – | 20 Lehm |
| `brickyard` | 10 Lehm | 13 Ziegel |
| `pottery` | 10 Lehm | 10 Keramik |
| `charcoal_kiln` | 10 Holz | 15 Kohle |
| `iron_mine` | – | 15 Eisen |
| `smithy` | 10 Eisen, 10 Kohle | 15 Werkzeug |
| `cotton_plantation` | – | 20 Baumwolle |
| `weavery` | 10 Baumwolle | 10 Stoff |
| `tailor` | 10 Stoff | 10 Kleidung |
| `carpentry` | 10 Bretter | 10 Möbel |
| `sugarcane_plantation` | – | 20 Zuckerrohr |
| `sugar_refinery` | 10 Zuckerrohr | 11 Zucker |
| `distillery` | 10 Zucker | 10 Rum |

Die neun gegenüber Alpha 2 angepassten Verarbeiter sind `windmill`, `bakery`, `butchery`, `dairy`, `sawmill`, `brickyard`, `charcoal_kiln`, `smithy` und `sugar_refinery`. Alternative Methoden, Qualitätsstufen, Zufallserträge und Teilproduktion bei nur teilweise vorhandenen Inputs sind ausgeschlossen.
