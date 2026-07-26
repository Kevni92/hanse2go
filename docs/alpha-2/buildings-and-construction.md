# Alpha 2 – Gebäude und Bau

## Voraussetzungen und Eigentum

Ein Gebäude gehört genau einem Spieler und genau einer Stadt. Jeder Bau ist ein serverautoritativer, atomarer Befehl; die aktive Flotte muss die Stadt erreichen können. Ohne lokale Baukonzession ist kein Gebäude baubar. Das Kontor ist stets das erste Gebäude: Ein Spieler darf pro Stadt genau ein Kontor bauen und erst danach Produktionsgebäude errichten. Mehrere gleiche Produktionsgebäude sind zulässig; Alpha 2 hat weder ein Gebäudelimit noch Bauplätze.

Der Bau beginnt und endet sofort. Gold und Baumaterialien werden ausschließlich aus Goldbeutel beziehungsweise Laderaum der aktiven Flotte abgebucht. Kontorbestände existieren vor dem Kontor nicht und werden beim Bau nicht als Materialquelle herangezogen. Der Stadtmarkt wird niemals automatisch belastet.

## Kosten

Jedes Gebäude enthält immer einen getrennt ausgewiesenen Grundstückspreis von 5.000 Gold. Hinzu kommen Klassenkosten und Baumaterialien. Alle Mengen sind ganze Tonnen.

| Klasse | Technische ID | zusätzliche Goldkosten | Holz | Bretter | Ziegel | Werkzeug |
|---|---|---:|---:|---:|---:|---:|
| einfach | `simple` | 2.500 | 20 | 10 | 10 | 5 |
| mittel | `medium` | 5.000 | 30 | 20 | 20 | 10 |
| hochwertig | `premium` | 7.500 | 40 | 30 | 30 | 20 |

Das Kontor hat keine Gebäudeklasse. Seine Kosten sind 5.000 Gold Grundstückspreis plus 5.000 Gold Baukosten sowie 50 Holz, 25 Bretter, 40 Ziegel und 10 Werkzeug. Damit kostet es insgesamt 10.000 Gold; die separat vorher erworbene Baukonzession kostet zusätzlich 10.000 Gold. Der spätere Gebäudekatalog ordnet jede Produktionsinstanz genau einer der drei Klassen zu und darf diese Klassenwerte nicht verändern.

## Bauablauf und Zustände

Der Server prüft in dieser Reihenfolge: gültiger Gebäudetyp, Stadtreichweite, Konzession, Einmaligkeit des Kontors beziehungsweise vorhandenes Kontor, ausreichendes Gold und alle Materialien. Er zieht dann alle Kosten ab und legt die Gebäudeinstanz an; schlägt eine Prüfung fehl, ändert sich kein Bestand.

| Zustand | Bedeutung |
|---|---|
| `buildable` | Konzession, Kontorvoraussetzung, Gold und Materialien sind erfüllt |
| `requirements_missing` | mindestens eine Bauvoraussetzung fehlt; der Server liefert die fehlenden Werte |
| `built` | Instanz existiert; beim Kontor ohne Produktion |
| `production_ready` | Produktionsinstanz hatte im letzten Tick alle Inputs und produzierte vollständig |
| `stalled` | Produktionsinstanz hatte im letzten Tick fehlende Inputs; kein Teilverbrauch |

`production_ready` und `stalled` werden erst durch einen Stundentick gesetzt. Es gibt keinen Arbeiter- oder Wartungszustand. `buildable` und `requirements_missing` beschreiben ein Katalogangebot, `built`, `production_ready` und `stalled` eine bestehende Instanz.

Der Alpha-1-Stadtwert `Kontor` der Stadtübersicht zeigt ab Alpha 2 das eigene Kontor des Spielers in dieser Stadt.

## Fehlerfälle

| Fehlercode | Bedingung |
|---|---|
| `CITY_NOT_REACHABLE` | aktive Flotte außerhalb des Stadtradius |
| `CONCESSION_REQUIRED` | keine Konzession in dieser Stadt |
| `KONTOR_REQUIRED` | Produktionsgebäude ohne eigenes Kontor |
| `KONTOR_ALREADY_EXISTS` | zweiter Kontorbau derselben Spieler-Stadt-Kombination |
| `UNKNOWN_BUILDING_TYPE` | nicht katalogisierter oder ausgeschlossener Gebäudetyp |
| `INSUFFICIENT_GOLD` | Grundstücks- und Baukosten nicht vollständig vorhanden |
| `INSUFFICIENT_BUILD_MATERIALS` | mindestens eine Materialmenge im Flottenladeraum fehlt |

Wohnhäuser, Wohnraum, Bauarbeiter, Bauzeiten, Aufwertungen, Abriss, Reparaturen und laufende Wartungskosten sind ausdrücklich nicht Teil von Alpha 2.
