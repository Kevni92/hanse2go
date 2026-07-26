# Alpha 2 – Örtlicher Ruf und Baukonzession

## Rufmodell

Der Ruf ist ein ganzzahliger Wert `0..100` je Kombination aus Spieler und Stadt. Er beginnt bei `0`; Bruchteile werden nicht gespeichert. Nach jeder erfolgreichen Markttransaktion prüft ausschließlich der Server den Bestand der gehandelten Ware vor und nach der Buchung.

| Ruf | Status | Technische ID |
|---:|---|---|
| 0–19 | Fremder | `stranger` |
| 20–49 | Bekannter Händler | `known_trader` |
| 50–79 | Angesehener Händler | `respected_trader` |
| 80–100 | Vertrauenswürdiger Bürger | `trusted_citizen` |

## Nützlicher Handel und Berechnung

Für eine Ware mit Zielbestand `Z`, Bestand vor dem Handel `V` und Bestand danach `N` lautet die wirksame Verbesserung:

`Verbesserung = max(0, |V - Z| - |N - Z|)`

Ein Verkauf ist nur unterhalb des Zielbestands nützlich, ein Kauf nur oberhalb des Zielbestands. Ein Handel über den Zielbestand hinaus zählt daher höchstens bis zum Zielbestand: Überschreitet der Handel den Zielbestand, wird `N` für diese Berechnung auf `Z` begrenzt. Gleichwertig gilt mit der gehandelten Menge `M`:

`Verbesserung = max(0, min(M, Z - V))` beim Verkauf und `Verbesserung = max(0, min(M, V - Z))` beim Kauf. Eine Transaktion muss mindestens 10 Tonnen umfassen; kleinere Geschäfte können handeln, erzeugen aber keinen Ruf.

Je Stadt und Ware führt der Server für die laufende simulierte Stunde ein gemeinsames Verbesserungskontingent. Es wird beim ersten relevanten Handel dieser Stunde auf die dann bestehende Entfernung zum Zielbestand gesetzt und um jede gutgeschriebene Verbesserung vermindert. Dadurch kann dieselbe Marktbewegung nicht durch Rückkauf, Gegenverkauf oder wiederholte Teilbuchungen mehrfach Ruf erzeugen. Mit dem nächsten erfolgreichen Stundentick wird das Kontingent gelöscht und beim nächsten Handel aus dem dann tatsächlichen Marktbestand neu bestimmt.

Für jede vollen 10 Tonnen gutgeschriebener Verbesserung erhält der handelnde Spieler einen Rufpunkt. Die Restmenge wird je Spieler, Stadt und Ware innerhalb der laufenden Stunde gesammelt; sie verfällt mit dem Tick. Der Ruf wird bei 100 begrenzt. Die Mindestmenge, das Kontingent und die Tickgrenze verhindern Kleinsttransaktionen, sofortige Gegenbuchungen und künstliches Hochhandeln, ohne nützliche Großtransaktionen zu benachteiligen.

Beispiele bei Zielbestand 100:

- Bestand 70, Verkauf von 20: Verbesserung 20, zwei Rufpunkte; der Bestand endet bei 90.
- Bestand 70, Verkauf von 40: Verbesserung 30, drei Rufpunkte; nur der Weg bis 100 zählt.
- Bestand 130, Kauf von 10: Verbesserung 10, ein Rufpunkt.
- Bestand 70, Kauf oder Bestand 130, Verkauf: keine Verbesserung und kein Ruf.
- Nach dem Verkauf von 20 im ersten Beispiel kann ein Rückkauf keinen weiteren Ruf aus dem bereits verbrauchten Kontingent erhalten.

## Baukonzession

Der Kauf ist ein serverautoritatives, atomar gebuchtes Kommando für die aktuelle, erreichbare Stadt. Voraussetzungen sind mindestens 80 Ruf, 10.000 Gold und noch keine Konzession für diese Stadt. Bei Erfolg sinkt Gold um 10.000 und der dauerhafte lokale Konzessionsstatus wird gesetzt. Eine Konzession kann nicht verkauft, übertragen, verloren oder erneut gekauft werden.

| Fehlercode | Bedingung | Zustand nach Ablehnung |
|---|---|---|
| `CITY_NOT_REACHABLE` | Flotte ist nicht im Stadtradius | unverändert |
| `REPUTATION_TOO_LOW` | Ruf kleiner als 80 | unverändert |
| `INSUFFICIENT_GOLD` | weniger als 10.000 Gold | unverändert |
| `CONCESSION_ALREADY_OWNED` | lokale Konzession existiert bereits | unverändert |

Ruf durch Missionen, Zeit, Gebäudebesitz oder andere Städte sowie jeder Rufverlust sind in Alpha 2 ausgeschlossen.
