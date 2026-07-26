# Alpha 6: statischer Testwelt-Städtegraph

## Zweck

Alpha 6 benötigt genau so viel Geografie, wie für reale Warentransporte zwischen den drei Teststädten nötig ist. Der Graph ist bewusst minimal und ersetzt die spätere Karibikkarte nicht.

Alle Distanzen sind statische Konfigurationswerte in `packages/config/game-config.json` und keine aus Koordinaten berechneten Größen. Die bestehenden WGS84-Koordinaten und Stadtradien der Testwelt bleiben ausschließlich Zugriffsmechanik der Debugposition und beeinflussen keine Reise.

## Strecken

| Strecke | Distanz |
|---|---:|
| Lambrecht ↔ Neustadt | 48 km |
| Neustadt ↔ Mannheim | 96 km |
| Lambrecht ↔ Mannheim | 120 km |

Alle drei Strecken sind bidirektional und in beide Richtungen exakt gleich lang. Der Graph ist vollständig verbunden: Jede Stadt erreicht jede andere direkt.

Alpha 6 besitzt keine Zwischenknoten, keine alternativen Routen, keine Wegfindung und keine mehrteiligen Reisen. Eine Reise verwendet immer genau die direkte Strecke zwischen Start- und Zielstadt.

Dieselben Distanzen sind zugleich die Nachbarschaftsreihenfolge für die Materialzuteilung der Initialisierung in [`start-state.md`](start-state.md) und die Grundlage der kalkulatorischen Transportkosten der KI-Logistik.

## Referenzfahrzeiten

`travelTicks = ceil(routeDistanceKm / fleetVirtualSpeedKmPerTick)`

Für eine Flotte mit genau einem Schiff des jeweiligen Typs:

| Schiffstyp | Geschwindigkeit | Lambrecht–Neustadt (48 km) | Neustadt–Mannheim (96 km) | Lambrecht–Mannheim (120 km) |
|---|---:|---:|---:|---:|
| Pinasse | 12 km/Tick | 4 Ticks | 8 Ticks | 10 Ticks |
| Schnigge | 10 km/Tick | 5 Ticks | 10 Ticks | 12 Ticks |
| Flöte | 8 km/Tick | 6 Ticks | 12 Ticks | 15 Ticks |
| Kraweel | 7 km/Tick | 7 Ticks | 14 Ticks | 18 Ticks |

Bei mehreren Schiffen zählt die Geschwindigkeit des langsamsten Schiffes. Eine Flotte aus Pinasse und Flöte fährt daher mit 8 km/Tick und benötigt Neustadt–Mannheim 12 Ticks bei 310,00 t Kapazität.

## Startflotten der Handelshäuser

| Handelshaus | Flotte | Schiff | Geschwindigkeit | Kapazität |
|---|---|---|---:|---:|
| Westwind-Handelshaus | `fleet-ai-house-lambrecht-01` | Waldwind (Schnigge) | 10 km/Tick | 100,00 t |
| Haardt-Kompanie | `fleet-ai-house-neustadt-01` | Rebenläufer (Pinasse) | 12 km/Tick | 60,00 t |
| Rheinhandel-Kontor | `fleet-ai-house-mannheim-01` | Rheingold (Flöte) | 8 km/Tick | 250,00 t |

Die für die Abnahme aus #136 verbindliche Referenzreise ist die Fahrt der Haardt-Kompanie mit der Pinasse `Rebenläufer` von Neustadt nach Mannheim über 96 km in exakt 8 Ticks.

## Konfigurationsvertrag

Der Streckengraph wird in `packages/config/game-config.json` als Liste ungerichteter Kanten mit `fromCityId`, `toCityId` und `distanceKm` geführt. Der Serverstart prüft und verweigert bei Verstoß:

- alle referenzierten `cityId` existieren;
- `distanceKm` ist eine positive ganze Zahl;
- keine Kante verbindet eine Stadt mit sich selbst;
- keine Kante ist doppelt oder in beiden Richtungen getrennt konfiguriert;
- der Graph ist zusammenhängend.

Eine neue Stadt erfordert damit immer auch neue Kanten. Die spätere Karibikkarte ersetzt ausschließlich diese Kantenliste; Reiseentität, Flottenstatus, Fahrzeitformel und Tickphase bleiben unverändert.
