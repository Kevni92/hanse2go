# Alpha 2 – Testwelt

Der Testreset startet mit 100.000 Gold, 0 Ruf, der Baukonzession für Lambrecht, keinem Kontor und leerer Flotte. Lambrecht ist der Hauptablauf: der Testzustand kann 80 Ruf sowie Flottenmaterial für Kontor, Forstbetrieb, Sägewerk und 10 Holz vorbereiten. Ein Tick ohne Holz im Kontor lässt das Sägewerk stillstehen; nach Einlagerung von 10 Holz erzeugt es 10 Bretter. Verbrauchswerte und erwartete Marktänderungen stehen in `population-consumption.md`.

## Startwerte ab Alpha 2

Diese Werte ersetzen die Startwerte aus [`../alpha-1/test-world.md`](../alpha-1/test-world.md); Städte, Waren, Basispreise und Bestände bleiben unverändert.

| Wert | Alpha 1 | ab Alpha 2 | Begründung |
|---|---:|---:|---|
| Startgold | 30.000 | 100.000 | Kontor und Produktionsgebäude kosten allein 25.000 Gold; weitere Konzessionen kosten je 10.000 Gold. |
| Baukonzessionen | keine | Lambrecht | Der Einstieg beginnt in Lambrecht sofort beim Kontorbau; Neustadt und Mannheim behalten den vollständigen Kaufablauf. |
| Laderaum der Flotte | 60 t | 150 t | Baumaterialien stammen ausschließlich aus dem Laderaum; allein das Kontor benötigt 125 Tonnen. |

Die Welt startet zusätzlich mit Ticknummer `0`, simulierter Stunde `0`, ohne Gebäude und ohne Kontorbestände. Die Start-Baukonzessionen stehen als `player.startingConcessions` in `packages/config/game-config.json`.

## Testbetrieb

`POST /test/reset` stellt diesen Startzustand vollständig wieder her. Nur im Testbetrieb bereitet `POST /test/seed` zusätzlich Gold, Flottenladung und Ruf je Stadt vor; eine Ladung über dem Laderaum wird abgelehnt. Beide Endpunkte stehen ausschließlich mit `HANSE2GO_E2E_TEST=1` bereit.
