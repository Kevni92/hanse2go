# Alpha 4 – Schiffsbau

## Neutrale Stadtwerften

Lambrecht, Neustadt und Mannheim besitzen jeweils eine neutrale Stadtwerft. Jede hat genau einen zentral konfigurierten aktiven Bauplatz und eine unbegrenzte FIFO-Warteschlange. Werften gehören keinem Spieler, benötigen keine Arbeiter und keine Löhne. Ihr Fortschritt wird ausschließlich durch den manuellen Alpha-3-Stundentick weitergeschaltet.

## Kosten und Bauzeit

| Schiffstyp | Werftgebühr | Holz | Bretter | Stoff | Werkzeug | Eisen | Bauzeit |
|---|---:|---:|---:|---:|---:|---:|---:|
| Pinasse | 5.000 Gold | 40,00 t | 20,00 t | 10,00 t | 5,00 t | 0,00 t | 6 Ticks |
| Schnigge | 8.000 Gold | 70,00 t | 40,00 t | 15,00 t | 8,00 t | 0,00 t | 12 Ticks |
| Flöte | 15.000 Gold | 130,00 t | 80,00 t | 30,00 t | 15,00 t | 0,00 t | 24 Ticks |
| Kraweel | 25.000 Gold | 200,00 t | 120,00 t | 40,00 t | 25,00 t | 20,00 t | 36 Ticks |

Alle Warenmengen sind Hundertstel-Tonnen. Die Werftgebühr stammt aus dem Spielergold; sämtliche Materialien ausschließlich aus seinem Kontor in der Werftstadt. Aktive Flotte, andere Kontore, Stadtmarkt und fremde Bestände werden nie automatisch verwendet.

## Auftragserteilung und Modell

Voraussetzung sind aktuelle Stadtreichweite, konfigurierte Werft, eigenes Kontor, bekannter baubarer Schiffstyp, vollständiges Gold und vollständige lokale Materialien, ein gültiger optionaler Name sowie ein Idempotenzschlüssel. Eine zusätzliche Schiffsbaukonzession gibt es nicht; die für das Kontor nötige Baukonzession wirkt nur indirekt.

Bei Erfolg zieht der Server Gebühr und alle Materialien atomar ab, legt einen Auftrag an und reiht ihn am Ende ein. Abhängig vom freien Bauplatz erhält er `building` oder `queued`. Bei jedem Fehler bleiben Gold, Kontor, Warteschlange und Schiffszahl unverändert; ein Auftrag erzeugt nie bereits ein Schiff.

Ein `shipBuildOrder` enthält mindestens `buildOrderId`, `ownerType = player`, `ownerId`, `cityId`, `shipTypeId`, `requestedShipName`, `status` (`queued`, `building`, `completed`), `queuePosition`, `createdAtTick`, optionales `startedAtTick` und `completedAtTick`, `totalBuildTicks`, `remainingBuildTicks`, die vollständig abgebuchten Gold- und Materialwerte sowie nach Abschluss `resultShipId`.

## FIFO und Tickabschluss

Die Reihenfolge ist aufsteigend nach `createdAtTick`, danach `buildOrderId`. Freie Plätze belegen unverzüglich die ersten Wartenden. Ein aktivierter Auftrag startet mit voller Restzeit; Wartende verlieren keine Bauzeit. Priorität, Beschleunigung und Zahlungen für die Warteschlangenposition existieren nicht.

Nach der Alpha-3-Wirtschafts- und Bevölkerungsberechnung verarbeitet der Tick Städte nach `cityId`. Für jeden zu Tickbeginn aktiven Auftrag reduziert er die Restzeit exakt um eins. Bei Restzeit null wird der Auftrag im selben Tick abgeschlossen: Der Server erzeugt genau ein neues, unzugeordnetes Schiff im Werfthafen mit neuem `shipId`, Auftragseigentümer, gewünschtem oder deterministisch generiertem Namen, `originType = shipyard_build`, `originCityId`, `buildOrderId` und der aktuellen Ticknummer als `createdAtTick`. Der Auftrag erhält `completed`, `completedAtTick` und einmalig `resultShipId`.

Der nächste wartende Auftrag wird noch im Abschluss-Tick `building` und erhält `startedAtTick`, verliert aber erst im folgenden Tick Bauzeit. Wiederholte Auftragsanfragen oder Ticks dürfen weder Gold und Material doppelt belasten noch ein zweites Schiff erzeugen. Alpha 4 erlaubt keinen Abbruch und keine Rückerstattung.

Spätere Buy Orders dürfen einen vorgeschalteten Status `awaiting_materials` ergänzen. In Alpha 4 sind unvollständige Materialbereitstellung, automatische Beschaffung und andere Spielerlieferungen ausgeschlossen.

## Alpha 6: Bauaufträge autonomer Handelshäuser

Ab Alpha 6 dürfen auch KI-Handelshäuser Bauaufträge erteilen. Für sie gilt dieses Dokument vollständig unverändert: dieselben Gebühren, dieselben Materialmengen, dieselben Bauzeiten, dieselbe FIFO-Warteschlange und dieselbe Fertigstellung von genau einem Schiff im Tick. `ownerType` eines Bauauftrags ist dann `ai` statt `player`.

Ein Handelshaus erhält **keine** bevorzugte Warteschlangenposition und kann sie nicht erkaufen. Steht ein Spielerauftrag vor einem KI-Auftrag, bleibt das so. Die Werftgebühr stammt aus dem Gold des Handelshauses, sämtliche Materialien ausschließlich aus seinem eigenen Kontor in der Werftstadt. Die für Handelshäuser geltende Lokalitätsprüfung ersetzt die Stadtreichweite der aktiven Flotte durch das eigene Kontor in dieser Stadt.

Eine ungedeckte Teilbeauftragung bleibt ausgeschlossen: Der Auftrag wird erst erteilt, wenn Gebühr und alle Materialien vollständig und unreserviert vorliegen. Die Beschaffungs-, Amortisations- und Ratenregeln der KI stehen in [`../alpha-6/ai-ships-and-fleets.md`](../alpha-6/ai-ships-and-fleets.md).
