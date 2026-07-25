# Alpha 2 – Produktionsrezepte

Ein Rezept wird genau einmal je Stundentick ausgeführt. Mengen sind ganze Tonnen. Alle Eingänge stammen aus dem eigenen Kontor; alle Ausgänge gehen in dasselbe Kontor. Fehlt auch nur eine Eingangsmengen vollständig, steht die Instanz still: Sie verbraucht nichts und erzeugt nichts.

| Gebäudetyp | Eingang je Tick | Ausgang je Tick |
|---|---|---|
| `grain_farm` | – | 20 Getreide |
| `windmill` | 10 Getreide | 10 Mehl |
| `bakery` | 10 Mehl | 10 Brot |
| `cattle_farm` | 10 Getreide | 5 Vieh, 10 Milch |
| `butchery` | 5 Vieh | 5 Fleisch |
| `dairy` | 10 Milch | 5 Käse |
| `forestry` | – | 20 Holz |
| `sawmill` | 10 Holz | 10 Bretter |
| `clay_pit` | – | 20 Lehm |
| `brickyard` | 10 Lehm | 10 Ziegel |
| `pottery` | 10 Lehm | 10 Keramik |
| `charcoal_kiln` | 10 Holz | 10 Kohle |
| `iron_mine` | – | 15 Eisen |
| `smithy` | 10 Eisen, 10 Kohle | 10 Werkzeug |
| `cotton_plantation` | – | 20 Baumwolle |
| `weavery` | 10 Baumwolle | 10 Stoff |
| `tailor` | 10 Stoff | 10 Kleidung |
| `carpentry` | 10 Bretter | 10 Möbel |
| `sugarcane_plantation` | – | 20 Zuckerrohr |
| `sugar_refinery` | 10 Zuckerrohr | 10 Zucker |
| `distillery` | 10 Zucker | 10 Rum |

Die Ketten sind damit vollständig: Getreide → Mehl → Brot, Getreide → Vieh/Milch → Fleisch/Käse, Holz → Bretter → Möbel sowie Holz → Kohle und Eisen + Kohle → Werkzeug, Lehm → Ziegel oder Keramik, Baumwolle → Stoff → Kleidung und Zuckerrohr → Zucker → Rum. Outputs desselben Ticks sind erst im folgenden Tick als Inputs verwendbar; die genaue Ausführungsreihenfolge regelt das Tickkonzept.
