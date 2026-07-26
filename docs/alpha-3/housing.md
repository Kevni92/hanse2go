# Alpha 3 – Wohnhäuser und städtischer Wohnraum

Für jede Stadt `c` gilt `totalHousing(c) = baseHousing(c) + sum(housingCapacity(h))` über alle vorhandenen spielereigenen Wohnhäuser `h`. Weiter gelten `freeHousing(c) = max(0, totalHousing(c) - population(c))` und `housingUtilization(c) = population(c) / max(totalHousing(c), 1)`.

Wohnraum ist eine gemeinsame stadtweite Kapazität. Ein Wohnhaus gehört einem Spieler, reserviert aber keine Einwohner; Häuser aller Spieler erhöhen denselben Pool. In Alpha 3 entstehen keine Mieten oder sonstigen direkten Einnahmen.

## Neutraler Grundwohnraum

| Stadt | Startbevölkerung | Grundwohnraum | freier Startwohnraum |
|---|---:|---:|---:|
| Lambrecht | 1.000 | 1.100 | 100 |
| Neustadt | 2.500 | 2.750 | 250 |
| Mannheim | 5.000 | 5.500 | 500 |

Grundwohnraum ist neutral und kann weder gekauft, verkauft, abgerissen noch verändert werden.

## `town_house`

| Feld | Wert |
|---|---|
| technische ID | `town_house` |
| Kapazität | 100 Einwohner |
| Grundstückspreis | 5.000 Gold |
| zusätzliche Baukosten | 5.000 Gold |
| Materialien | 30 Holz, 20 Bretter, 20 Ziegel, 10 Werkzeug |
| Bauzeit / Mehrfachbau | sofort / unbegrenzt |
| Arbeiter, Löhne, Produktion, Priorität | keine |

Ein Wohnhaus darf gebaut werden, wenn die aktive Flotte die Stadt erreicht, der Spieler dort Konzession und Kontor besitzt sowie Gold und sämtliche Materialien im Flottenladeraum hat. Der Server prüft und bucht wie beim Produktionsbau atomar: bei Fehler bleibt jeder Zustand unverändert; bei Erfolg sinken Gold und Flottenladung und der Wohnraum steigt unmittelbar um 100.

Wohnhäuser verwenden nur `buildable`, `requirements_missing` und `built`. Sie besitzen nie Produktions- oder Arbeitszustände. Fehlercodes sind `CITY_NOT_REACHABLE`, `CONCESSION_REQUIRED`, `KONTOR_REQUIRED`, `INSUFFICIENT_GOLD`, `INSUFFICIENT_BUILD_MATERIALS` und `UNKNOWN_BUILDING_TYPE`.

## Oberfläche

Die Stadtansicht zeigt Gesamtwohnraum, freien Wohnraum und Auslastung. Im Gebäude-Tab erscheint `town_house` nur nach Konzession und Kontor mit Kosten, Voraussetzungen und dem Hinweis auf die gemeinsame stadtweite Kapazität; es zeigt keine Arbeiter-, Lohn- oder Prioritätswerte. Die vollständigen Interaktions- und Responsive-Regeln stehen in [`user-interface.md`](user-interface.md).

Ausgeschlossen sind Hausklassen, Mieten, Bewohnerlisten, Leerstandskosten, Wohnhausarbeiter, Wartung, Abriss, Bauplätze, Kartenplatzierung und Obdachlosigkeitseffekte oberhalb der Kapazität.
