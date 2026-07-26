# Alpha 5: gedeckte Limit Orders

## Modell und Genauigkeit

Alpha 5 kennt ausschließlich lokale Limit Orders: `buy` bietet einen Höchstpreis, `sell` einen Mindestpreis. Market, Stop und stadtübergreifende Orders, Leerverkäufe und Kredit sind ausgeschlossen. Diese Beschränkung gilt ab Alpha 6 unverändert auch für KI-Handelshäuser. Eine Warenmengeneinheit entspricht 0,01 Tonnen; `quantityUnits` ist positiv und die Mindestmenge beträgt eine Einheit. `limitPriceGoldPerTon` ist eine positive ganze Goldzahl. Für Menge `quantityUnits` und Limitpreis gilt exakt:

`maximumTradeValueMoneyUnits = quantityUnits × limitPriceGoldPerTon`

Beispiel: 1,25 Tonnen sind 125 Einheiten. Bei 80 Gold pro Tonne beträgt der Maximalwert 10.000 `moneyUnits` beziehungsweise 100,00 Gold.

## Pflichtfelder

Jede Order enthält mindestens `orderId`, `cityId`, `goodId`, `side`, `ownerType` (`player`, `population`, `city` oder ab Alpha 6 `ai`), `ownerId`, `sourceInventoryRef` oder `destinationInventoryRef`, `originalQuantityUnits`, `remainingQuantityUnits`, `limitPriceGoldPerTon`, `status`, weltweit monotonen `createdSequence`, `createdAtTick`, `updatedAtTick`, bei Buy Orders `reservedMoneyUnits`, bei Sell Orders `reservedGoodsUnits`, Ersetzungsreferenzen und `orderVersion`.

Status sind `open`, `partially_filled`, `filled`, `cancelled`, `expired` und `replaced`. `filled`, `cancelled`, `expired` und `replaced` sind abgeschlossen und unveränderlich.

## Deckung und Erstellung

Spielerorders erfordern erreichte Stadt, ein eigenes Kontor in dieser Stadt, bekannte Ware, gültige Menge und Preis sowie einen Idempotenzschlüssel. Eine Sell Order reserviert ausschließlich freien lokalen Kontorbestand als `reservedForSellOrders`. Diese Ware bleibt Eigentum des Spielers, kann aber weder produziert, transferiert, gebaut, verkauft noch erneut reserviert werden.

Eine Buy Order reserviert ausschließlich verfügbares Spielergold. Die maximale Käufergebühr ist:

`maximumBuyerFee = ceil(maximumTradeValueMoneyUnits × 5 / 1000)`

`requiredReservation = maximumTradeValueMoneyUnits + maximumBuyerFee`

Bei Ausführung wird gekaufte Ware im lokalen Kontor gutgeschrieben. Beide Orderseiten gehen nach erfolgreicher Reservierung sofort in das Matching.

Stadt-Sell-Orders reservieren städtische Lagerware, Stadt-Buy-Orders Stadtkassengeld. Die Bevölkerung besitzt nur Buy Orders und reserviert ihre Bevölkerungskasse. Diese Systemorders dürfen ausschließlich durch Ticklogik erstellt, ersetzt, storniert oder ablaufen gelassen werden; Spieler können sie nicht ändern.

Orders eines KI-Handelshauses sind ab Alpha 6 **keine** Systemorders. Sie verlangen dieselbe Deckung, dasselbe eigene Kontor in der Stadt, dieselben Reservierungen, dieselbe Preis-Zeit-Priorität und dieselben Gebühren wie Spielerorders und erhalten keine bevorzugte Behandlung. Sie werden ausschließlich durch die KI-Entscheidungslogik erstellt, ersetzt und storniert; Spieler können sie nicht ändern. Die Eigenhandelssperre gilt je Kombination aus `ownerType` und `ownerId`, sodass zwei verschiedene Handelshäuser regulär miteinander handeln dürfen. Preisgrenzen und Mengenbegrenzungen der KI stehen in [`../alpha-6/ai-order-strategy.md`](../alpha-6/ai-order-strategy.md).

## Stornierung und Ersetzung

Spieler dürfen nur eigene `open` oder `partially_filled` Orders mit erwarteter Version stornieren. Das Storno gibt ausschließlich die Restreservierung frei; ausgeführte Teilmengen, Gebühren und Executions bleiben erhalten.

Preis- und Mengenänderungen sind atomare Cancel-and-Replace-Aktionen: Version prüfen, alte Restorder auf `replaced` setzen, ihre Reservierung freigeben, neue vollständig gedeckte Order mit neuer ID und neuer `createdSequence` anlegen und sofort matchen. Sie verliert immer Zeitpriorität. Schlägt irgendein Teil der Ersetzung fehl, insbesondere die Deckung der neuen Order, rollt die gesamte Aktion zurück und die alte Order bleibt unverändert.

## Eigentümer, Version und Idempotenz

Gegenorders desselben wirtschaftlichen Eigentümers (`ownerType` und `ownerId`) werden übersprungen. Stadt und Bevölkerung sind verschiedene Eigentümer. Das verhindert Wash Trading sowie künstliche Gebühren und Ruf.

Jede Order beginnt mit Version 1; Teilfüllungen, Stornierung und Statuswechsel erhöhen sie. Wiederholung derselben Idempotenz-ID mit identischer Nutzlast gibt das ursprüngliche Ergebnis ohne Doppelbuchung zurück. Dieselbe ID mit anderer Nutzlast ist ein Konflikt.

Fehlercodes sind `ORDER_NOT_FOUND`, `ORDER_NOT_OWNED`, `ORDER_NOT_MODIFIABLE`, `ORDER_VERSION_CONFLICT`, `INVALID_ORDER_SIDE`, `INVALID_ORDER_QUANTITY`, `INVALID_ORDER_PRICE`, `KONTOR_REQUIRED`, `INSUFFICIENT_UNRESERVED_GOODS`, `INSUFFICIENT_AVAILABLE_GOLD`, `ORDER_RESERVATION_CONFLICT`, `SYSTEM_ORDER_NOT_MODIFIABLE` und `IDEMPOTENCY_KEY_REQUIRED`.
