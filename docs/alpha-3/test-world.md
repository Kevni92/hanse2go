# Alpha 3 – Start- und Referenzwelt

Der Testreset `alpha3-baseline` startet Lambrecht mit 1.000 Einwohnern, 1.100 Grundwohnraum und Wohlstand 40,0, Neustadt mit 2.500 / 2.750 / 50,0 und Mannheim mit 5.000 / 5.500 / 65,0. Marktpreise, Zielbestände und Marktbestände entsprechen Alpha 2; Ticknummer und Zeit entsprechen dessen Resetwert. Alle Verbrauchs-, Produktions-, Wohlstands- und Wachstumsreste beginnen bei null. Der Hauptspieler `player-alpha` hat 100.000 Gold, 0 Ruf, keine Konzession, kein Kontor, keine Gebäude, die bestehende Testflotte und leere Ladung.

## Ausschließliche Testpresets

`alpha3-building-ready` bereitet Lambrecht für den UI-Happy-Path vor: `player-alpha` hat 80 Ruf, Konzession, Kontor und 100.000 Gold, die aktive Flotte steht in Lambrecht und trägt mindestens 200 Holz, 100 Bretter, 100 Ziegel und 50 Werkzeug. Das Kontor enthält mindestens 100 Getreide und 100 Holz; es gibt keine Wohn- oder Produktionsgebäude.

`alpha3-fairness-equal` enthält in Lambrecht je vier voll finanzierbare einfache Gebäude von Spieler A und B mit Nachfrage 800, ausreichendem Gold und Inputs sowie Priorität `normal`. `alpha3-fairness-redistribution` enthält die finanzierbaren Nachfragen A = 800, B = 200, C = 50. `alpha3-priority-and-wages` enthält Bäckerei sehr hoch (100), Windmühle hoch (100), Getreidehof normal (200) und begrenzt das verfügbare Budget auf 150 Arbeiter.

`alpha3-partial-production` bereitet eine mittelklassige Windmühle mit 60 Arbeitern und 6,00 Getreide im Kontor vor; die Negativvariante hält 5,99 Getreide vor. `alpha3-wage-limited` bereitet ein hochwertiges Gebäude mit Bedarf 50, Lohn 4, genügend Inputs und genau 75 Gold vor.

Alle zusätzlichen Presets sind ausschließlich über den Testreset aktivierbar und im Produktionsbetrieb nicht erreichbar.

Die reine Balancing-Simulation läuft 720 Stundenticks ohne Echtzeit und ohne zusätzliche Wohnhäuser. Mit konstanten Zielwohlständen 62,0 / 85,2 / 100,0 erwartet sie nach 30 Tagen:

| Stadt | Wohlstand | Bevölkerung |
|---|---:|---:|
| Lambrecht | 50,0 ± 0,1 | 1.004 ± 2 |
| Neustadt | 66,0 ± 0,1 | 2.533–2.534 ± 2 |
| Mannheim | 80,9–81,0 ± 0,1 | 5.112–5.113 ± 2 |

Zusätzliche Pflichtfälle: Wohlstand 40 bei freiem Wohnraum ergibt null Wachstum, Wohlstand 80 ohne freien Wohnraum null, bei fünf Prozent freiem Wohnraum ungefähr die halbe und ab zehn Prozent die volle Maximalrate. Wachstum darf die Wohnraumgrenze niemals überschreiten; ein gebautes `town_house` erhöht freien Wohnraum um 100. Der Wohnhaustest aus `alpha3-building-ready` verringert Gold um 10.000 und die Ladung um 30 Holz, 20 Bretter, 20 Ziegel und 10 Werkzeug; Gesamt- und freier Wohnraum steigen von 1.100/100 auf 1.200/200. Ohne Konzession, Kontor, Gold, Material oder Reichweite bleibt jeder Wert unverändert.
