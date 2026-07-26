# Alpha 5: städtischer Marktakteur

Jede Stadt besitzt Stadtkasse, Warenlager je Ware in Hundertstel-Tonnen, reservierte Sell-Ware, reserviertes Buy-Gold und systemverwaltete Orders unter ihrer Stadt-ID. Sie ist keine KI und verwendet keine Sonderliquidität.

Am Ende jedes Stundenticks, nach Wirtschaft, Bevölkerung und Werft, storniert die Stadt zunächst ihre offene Order je Stadt-Ware und gibt nur deren Restreservierung frei. Anschließend bewertet sie den gesamten Besitz `availableCityWarehouseUnits + reservedCitySellUnits`; offene Buy Orders sind kein Bestand.

Bei Bestand unter `reserveTargetUnits = configuredTargetStockTons × 100` erstellt sie eine gedeckte Buy Order bis zur Differenz, zu `max(1, floor(basePrice × 0,90))` Gold/t. Die Menge wird soweit reduziert, dass Wert und Käufergebühr vollständig reserviert werden; unter 0,01 t entsteht keine Order. Bei Bestand über Ziel erstellt sie eine Sell Order über exakt den Überschuss zu `ceil(basePrice × 1,10)` Gold/t. Am Ziel gibt es keine Order; Buy und Sell derselben Stadt-Ware existieren nie gleichzeitig.

Startorders werden nach Migration für Tick 0 mit `order-city-<cityId>-<goodId>-<side>-tick-0` erzeugt. Beispielsweise ergibt 200 t Holz bei Ziel 100 t in Lambrecht eine Sell Order über 100 t zu 88 Gold/t; 65 t Brot bei Ziel 80 t ergibt eine finanzierbare Buy Order über 15 t zu 171 Gold/t.

Stadtorders verwenden normales Matching, Ausführung und Gebühren. Stadtkauf lagert Ware ein, Stadtverkauf liefert reservierte Ware aus. Das Stadtlager dient ausschließlich Lager, Reserveziel und Orderquelle/-ziel; die Stadt verbraucht und überträgt Waren nie ohne Order. Gebühren, Bauzahlungen und neutrale Schiffskäufe erhöhen die betroffene Stadtkasse; Schiffsankäufe benötigen ihre volle Liquidität.

Ruf entsteht nur aus tatsächlich ausgeführten Spielerverkäufen an Stadt- oder Bevölkerung-Buy-Orders nach bestehender Mindestmenge und Tonnen-pro-Punkt-Regel. Execution zählt höchstens einmal; Spielerhandel, Käufe und Eigenhandel erzeugen keinen Ruf. Handelshistorie enthält nur reale Executions, letzten Preis, Volumen, besten Bid/Ask und Tiefe.

Fehlercodes: `INSUFFICIENT_CITY_TREASURY`, `CITY_ORDER_RESERVATION_CONFLICT`, `CITY_WAREHOUSE_INVARIANT_VIOLATION`, `CITY_ORDER_CONFIGURATION_INVALID`.
