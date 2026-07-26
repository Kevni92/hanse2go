# Alpha 2 – Gebäudekatalog

Jede technische ID bezeichnet einen baubaren Produktionsgebäudetyp. Verbindlich sind die englischen IDs; die Anzeigenamen stehen ausschließlich in den Sprachdateien von `@hanse2go/config`. Die Klassen verwenden unverändert die zusätzlichen Gold- und Materialwerte aus [`buildings-and-construction.md`](buildings-and-construction.md); zu jedem Typ kommen immer 5.000 Gold Grundstückspreis hinzu. Rohstoffgebäude haben keine Wareninputs, alle übrigen sind Verarbeitung. Mehrere Instanzen einer ID arbeiten unabhängig und vervielfachen die Rezeptmenge.

| ID | Anzeigename | Art | Klasse | Klassen-ID | erzeugt |
|---|---|---|---|---|---|
| `grain_farm` | Getreidehof | Rohstoff | einfach | `simple` | Getreide |
| `windmill` | Windmühle | Verarbeitung | einfach | `simple` | Mehl |
| `bakery` | Bäckerei | Verarbeitung | mittel | `medium` | Brot |
| `cattle_farm` | Rinderhof | Verarbeitung | mittel | `medium` | Vieh, Milch |
| `butchery` | Metzgerei | Verarbeitung | mittel | `medium` | Fleisch |
| `dairy` | Käserei | Verarbeitung | hochwertig | `premium` | Käse |
| `forestry` | Forstbetrieb | Rohstoff | einfach | `simple` | Holz |
| `sawmill` | Sägewerk | Verarbeitung | einfach | `simple` | Bretter |
| `clay_pit` | Lehmgrube | Rohstoff | einfach | `simple` | Lehm |
| `brickyard` | Ziegelei | Verarbeitung | mittel | `medium` | Ziegel |
| `pottery` | Töpferei | Verarbeitung | mittel | `medium` | Keramik |
| `charcoal_kiln` | Köhlerei | Verarbeitung | mittel | `medium` | Kohle |
| `iron_mine` | Eisenmine | Rohstoff | hochwertig | `premium` | Eisen |
| `smithy` | Schmiede | Verarbeitung | hochwertig | `premium` | Werkzeug |
| `cotton_plantation` | Baumwollplantage | Rohstoff | einfach | `simple` | Baumwolle |
| `weavery` | Weberei | Verarbeitung | mittel | `medium` | Stoff |
| `tailor` | Schneiderei | Verarbeitung | mittel | `medium` | Kleidung |
| `carpentry` | Tischlerei | Verarbeitung | hochwertig | `premium` | Möbel |
| `sugarcane_plantation` | Zuckerrohrplantage | Rohstoff | mittel | `medium` | Zuckerrohr |
| `sugar_refinery` | Zuckerraffinerie | Verarbeitung | mittel | `medium` | Zucker |
| `distillery` | Brennerei | Verarbeitung | hochwertig | `premium` | Rum |

Die Eisenmine ist in Alpha 2 in jeder der drei Teststädte baubar; regionale Vorkommen werden erst später simuliert. Wohngebäude, alternative Produktionsmethoden, Qualitätsstufen, Ausbauten und zusätzliche Nebenprodukte sind ausgeschlossen.
