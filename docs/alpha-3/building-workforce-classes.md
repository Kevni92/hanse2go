# Alpha 3 – Beschäftigungsklassen der Produktionsgebäude

Jede der 21 Produktionsgebäudearten besitzt genau eine Beschäftigungsklasse. Die technische ID der Beschäftigungsklasse ist unabhängig von der bereits vorhandenen technischen Bauklasse. Kontor und Wohngebäude haben keine Beschäftigungsklasse, benötigen keine Arbeiter und verursachen keine Lohnkosten.

| Beschäftigungsklasse | Arbeiterbedarf je Instanz | Lohn je Arbeiter und Tick | Lohnsumme bei Vollbesetzung |
|---|---:|---:|---:|
| `simple` | 200 | 1 Gold | 200 Gold |
| `medium` | 100 | 2 Gold | 200 Gold |
| `premium` | 50 | 4 Gold | 200 Gold |

Ein Tick entspricht einer simulierten Stunde. Der Bedarf, der Lohnsatz und die maximale Lohnsumme sind für jede Instanz derselben Beschäftigungsklasse gleich.

## Verbindliche Zuordnung

| Beschäftigungsklasse | Gebäudetypen |
|---|---|
| `simple` | `grain_farm`, `cattle_farm`, `forestry`, `clay_pit`, `iron_mine`, `cotton_plantation`, `sugarcane_plantation` |
| `medium` | `windmill`, `bakery`, `butchery`, `sawmill`, `brickyard`, `pottery`, `charcoal_kiln`, `weavery`, `sugar_refinery` |
| `premium` | `dairy`, `smithy`, `tailor`, `carpentry`, `distillery` |

Die Tabelle enthält alle 21 Produktionsgebäudetypen genau einmal. Anzeigenamen werden ausschließlich im Client über die Sprachdateien aufgelöst.
