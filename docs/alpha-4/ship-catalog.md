# Alpha 4 – Schiffskatalog

Alle Schiffstypwerte stammen ausschließlich aus der zentralen Spielkonfiguration. Eine Schiffsentität speichert weder Kapazität noch Geschwindigkeit als veränderbare Kopie. Der neutrale Ankaufspreis beträgt für jeden Typ exakt 60 % des neutralen Kaufpreises; alle Goldwerte sind ganzzahlig.

| technische ID | deutsche Anzeige | Kapazität | virtuelle Geschwindigkeit | Bauzeit | neutraler Kaufpreis | neutraler Ankaufspreis |
|---|---|---:|---:|---:|---:|---:|
| `pinnace` | Pinasse | 60,00 t | 12 km/Spielstunde | 6 Ticks | 20.000 Gold | 12.000 Gold |
| `schnigge` | Schnigge | 100,00 t | 10 km/Spielstunde | 12 Ticks | 32.000 Gold | 19.200 Gold |
| `fluyt` | Flöte | 250,00 t | 8 km/Spielstunde | 24 Ticks | 60.000 Gold | 36.000 Gold |
| `caravel` | Kraweel | 400,00 t | 7 km/Spielstunde | 36 Ticks | 95.000 Gold | 57.000 Gold |

Es gibt in Alpha 4 genau diese vier Typen und keine Qualitätsstufen oder zufälligen Abweichungen. Eine Flottenkapazität ist die Summe der Kapazitäten ihrer zugeordneten Schiffe. Ihre virtuelle Geschwindigkeit ist der niedrigste Geschwindigkeitswert dieser Schiffe. Sie dient in Alpha 4 nur der Anzeige und Vorbereitung späterer automatischer Fahrt; die aktive Flotte wird noch nicht durch sie bewegt.
