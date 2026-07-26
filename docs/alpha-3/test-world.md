# Alpha 3 – Start- und Referenzwelt

Der Testreset startet Lambrecht mit 1.000 Einwohnern, 1.100 Grundwohnraum und Wohlstand 40,0, Neustadt mit 2.500 / 2.750 / 50,0 und Mannheim mit 5.000 / 5.500 / 65,0. Alle Verbrauchs-, Produktions-, Wohlstands- und Wachstumsreste beginnen bei null.

Die reine Balancing-Simulation läuft 720 Stundenticks ohne Echtzeit und ohne zusätzliche Wohnhäuser. Mit konstanten Zielwohlständen 62,0 / 85,2 / 100,0 erwartet sie nach 30 Tagen:

| Stadt | Wohlstand | Bevölkerung |
|---|---:|---:|
| Lambrecht | 50,0 ± 0,1 | 1.004 ± 2 |
| Neustadt | 66,0 ± 0,1 | 2.533–2.534 ± 2 |
| Mannheim | 80,9–81,0 ± 0,1 | 5.112–5.113 ± 2 |

Zusätzliche Pflichtfälle: Wohlstand 40 bei freiem Wohnraum ergibt null Wachstum, Wohlstand 80 ohne freien Wohnraum null, bei fünf Prozent freiem Wohnraum ungefähr die halbe und ab zehn Prozent die volle Maximalrate. Wachstum darf die Wohnraumgrenze niemals überschreiten; ein gebautes `town_house` erhöht freien Wohnraum um 100.
