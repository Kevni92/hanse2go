# Alpha 5: Matching und Settlement

## Preis-Zeit-Priorität

Jede Kombination aus Stadt und Ware hat ein eigenes Orderbuch. Sells sortieren aufsteigend nach Limitpreis, `createdSequence`, lexikografischer `orderId`; Buys absteigend nach Limitpreis, danach ebenso. Eigentümertyp und Ordergröße verändern diese Reihenfolge nicht.

Eine Buy und Sell Order kreuzen bei `buy.limitPriceGoldPerTon >= sell.limitPriceGoldPerTon`. Eigenorders werden übersprungen. Die neue Order trifft nacheinander die beste zulässige Gegenorder, bis sie gefüllt ist, kein Preis mehr kreuzt oder nur Eigenorders verbleiben. Die Menge einer Execution ist `min(buy.remainingQuantityUnits, sell.remainingQuantityUnits)`.

Es gilt stets der Preis der ruhenden Order: neuer Buy gegen ältere Sell zum Sell-Preis, neuer Sell gegen ältere Buy zum Buy-Preis. Gleichzeitig erzeugte Systemorders verwenden ihre deterministische Sequenz; Ersetzungen sind neue Orders.

## Ganzzahlige Werte und Gebühren

`tradeValueMoneyUnits = executionQuantityUnits × executionPriceGoldPerTon`.

Für jede einzelne Execution gelten `buyerFeeMoneyUnits = ceil(tradeValueMoneyUnits × 5 / 1000)` und `sellerFeeMoneyUnits = ceil(tradeValueMoneyUnits × 5 / 1000)`. Käufer zahlt Wert plus Gebühr, Verkäufer erhält Wert minus Gebühr, beide Gebühren gehen an die Stadtkasse. Eine positive externe Ausführung hat je Seite mindestens 0,01 Gold Gebühr; die Verkäufergebühr darf den Erlös nicht überschreiten.

Eine ruhende Sell Order über 10,00 t zu 90 Gold/t trifft eine neue Buy Order zu 100 Gold/t mit 900,00 Gold Bruttowert, 4,50 Gold Käufer- und Verkäufergebühr, 904,50 Gold Käuferbelastung, 895,50 Gold Verkäufergutschrift und 9,00 Gold Stadtkassenzuwachs. Eine Buy über 20 t trifft ruhende Sells 5 t/80, 10 t/85 und 5 t/90 genau in dieser Reihenfolge; jede Teilfüllung hat eigene Gebühren und Execution.

## Atomare Ausführung

Eine Execution entfernt reservierte Sell-Ware, schreibt sie dem Käuferziel gut oder konsumiert sie bei Bevölkerungskäufen unmittelbar, reduziert reserviertes Käufergeld um Wert und Käufergebühr, schreibt Nettoerlös und Stadtkassengebühren, aktualisiert Reste, Reservierungen, Status und Versionen und speichert Execution sowie Ledger. Schlägt eine Prüfung fehl, wird nichts gebucht.

Nach jeder Teilfüllung lautet die Buy-Restreservierung:

`remainingQuantityUnits × limitPriceGoldPerTon + ceil(remainingQuantityUnits × limitPriceGoldPerTon × 5 / 1000)`.

Nicht benötigtes Gold wird sofort freigegeben. Für Sells gilt stets `reservedGoodsUnits = remainingQuantityUnits`.

Eine Stadtseite folgt denselben Regeln; ihre eigene Gebühr ist als interne Buchung sichtbar, aber netto null. Die externe Seite zahlt ihre reguläre Gebühr. Jede Execution ist unveränderlich und enthält IDs beider Orders, Parteien, Stadt/Ware, Menge, Preis, Bruttowert, Gebühren, Tick/Befehlssequenz, ruhende Seite und resultierende Buchversion.

## Versionen und Parallelität

Jede sichtbare neue Order, Ausführung, Stornierung, Ersetzung oder Ablauf erhöht die Stadt-Ware-Orderbuchversion. Matching und Settlement werden pro Buch serialisiert. Idempotente Wiederholung liefert dieselben Executions, und ein Fehler rollt alle Ausführungen des auslösenden Befehls zurück.

Fehlercodes sind `ORDER_BOOK_STATE_CONFLICT`, `ORDER_SETTLEMENT_FAILED`, `ORDER_RESERVATION_MISMATCH`, `ORDER_SELF_TRADE_BLOCKED`, `TRADE_FEE_EXCEEDS_PROCEEDS`, `MONEY_SUPPLY_INVARIANT_VIOLATION` und `GOODS_SUPPLY_INVARIANT_VIOLATION`.
