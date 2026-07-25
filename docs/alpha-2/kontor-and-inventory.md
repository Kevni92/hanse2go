# Alpha 2 – Kontor und Warenfluss

## Lager und Eigentum

Ein gebautes Kontor gehört genau einem Spieler in genau einer Stadt. Es besitzt ein separates, in Alpha 2 unbegrenztes Lager mit ganzzahligen Tonnen je Ware. Kontore verschiedener Städte, anderer Spieler und der Stadtmarkt sind stets getrennte Bestände. Ohne eigenes Kontor existiert kein privates Lager und keine Produktion.

## Manuelle Transfers

Ein Transfer ist nur für die aktuelle, serverseitig erreichbare Stadt möglich und verbucht genau eine positive ganze Menge einer Ware atomar.

| Richtung | Quelle | Ziel | zusätzliche Prüfung |
|---|---|---|---|
| Einlagern | aktive Flotte | eigenes Kontor der Stadt | Flotte besitzt die gesamte Menge |
| Auslagern | eigenes Kontor der Stadt | aktive Flotte | Kontor besitzt die Menge und Flotte hat freien Raum |

`Max` bedeutet beim Einlagern den Flottenbestand und beim Auslagern das Minimum aus Kontorbestand und freiem Flottenraum. Transfers erzeugen keinen Marktpreis, Ruf oder Produktionsfortschritt.

| Fehlercode | Bedingung |
|---|---|
| `CITY_NOT_REACHABLE` | Stadt außerhalb des Flottenradius |
| `KONTOR_REQUIRED` | kein eigenes Kontor in der Stadt |
| `INVALID_TRANSFER_QUANTITY` | Menge nicht ganzzahlig oder kleiner als 1 |
| `INSUFFICIENT_FLEET_GOODS` | Einlagerungsmenge über Flottenbestand |
| `INSUFFICIENT_KONTOR_GOODS` | Auslagerungsmenge über Kontorbestand |
| `INSUFFICIENT_FLEET_CAPACITY` | Auslagerung über freien Laderaum |

Bei jeder Ablehnung bleiben Flotten- und Kontorbestände unverändert. Ein Transfer zwischen Städten, gemeinsames Lager, Lagerkosten, Verderb sowie automatischer Marktankauf oder -verkauf existieren nicht.

## Produktion

Produktionsgebäude lesen ausschließlich ihr eigenes Kontor. Der Tick verarbeitet Gebäudeinstanzen in stabiler Erstellungsreihenfolge. Für jede Instanz prüft und entnimmt er sämtliche Inputs als eine atomare Buchung; fehlt eine Menge, bleibt die Instanz mit `stalled` und dem Grund `missing_inputs` unverändert. Erfolgreiche Outputs werden in einem Puffer gesammelt und erst nach der vollständigen Produktionsphase in die jeweiligen Kontore eingelagert. Kein Output kann daher einen späteren Betrieb desselben Ticks versorgen.

Der letzte Status je Instanz enthält mindestens `buildingId`, `status`, `reason` bei Stillstand, verbrauchte Inputs und erzeugte Outputs.
