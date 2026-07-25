# Alpha 2 – Gebäudekatalog

Jede technische ID bezeichnet einen baubaren Produktionsgebäudetyp. Die Klassen verwenden unverändert die zusätzlichen Gold- und Materialwerte aus [`buildings-and-construction.md`](buildings-and-construction.md); zu jedem Typ kommen immer 5.000 Gold Grundstückspreis hinzu. Rohstoffgebäude haben keine Wareninputs, alle übrigen sind Verarbeitung. Mehrere Instanzen einer ID arbeiten unabhängig und vervielfachen die Rezeptmenge.

| ID | Anzeigename | Art | Klasse | erzeugt |
|---|---|---|---|---|
| `grain_farm` | Getreidehof | Rohstoff | einfach | Getreide |
| `windmill` | Windmühle | Verarbeitung | einfach | Mehl |
| `bakery` | Bäckerei | Verarbeitung | mittel | Brot |
| `cattle_farm` | Rinderhof | Verarbeitung | mittel | Vieh, Milch |
| `butchery` | Metzgerei | Verarbeitung | mittel | Fleisch |
| `dairy` | Käserei | Verarbeitung | hochwertig | Käse |
| `forestry` | Forstbetrieb | Rohstoff | einfach | Holz |
| `sawmill` | Sägewerk | Verarbeitung | einfach | Bretter |
| `clay_pit` | Lehmgrube | Rohstoff | einfach | Lehm |
| `brickyard` | Ziegelei | Verarbeitung | mittel | Ziegel |
| `pottery` | Töpferei | Verarbeitung | mittel | Keramik |
| `charcoal_kiln` | Köhlerei | Verarbeitung | mittel | Kohle |
| `iron_mine` | Eisenmine | Rohstoff | hochwertig | Eisen |
| `smithy` | Schmiede | Verarbeitung | hochwertig | Werkzeug |
| `cotton_plantation` | Baumwollplantage | Rohstoff | einfach | Baumwolle |
| `weavery` | Weberei | Verarbeitung | mittel | Stoff |
| `tailor` | Schneiderei | Verarbeitung | mittel | Kleidung |
| `carpentry` | Tischlerei | Verarbeitung | hochwertig | Möbel |
| `sugarcane_plantation` | Zuckerrohrplantage | Rohstoff | mittel | Zuckerrohr |
| `sugar_refinery` | Zuckerraffinerie | Verarbeitung | mittel | Zucker |
| `distillery` | Brennerei | Verarbeitung | hochwertig | Rum |

Die Eisenmine ist in Alpha 2 in jeder der drei Teststädte baubar; regionale Vorkommen werden erst später simuliert. Wohngebäude, alternative Produktionsmethoden, Qualitätsstufen, Ausbauten und zusätzliche Nebenprodukte sind ausgeschlossen.
