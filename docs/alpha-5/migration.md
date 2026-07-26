# Alpha 5: Marktbestandsmigration

Der Reset überträgt jeden bisherigen Stadtmarktbestand ohne Änderung in das Warenlager derselben Stadt: eine Tonne wird zu 100 Mengeneinheiten. Alle 22 Waren behalten ihre Gesamtmenge; die alte parallele Marktbestandsstruktur wird anschließend nicht weitergeführt. `targetStock` bleibt Reserveziel und historischer Referenzwert, bestimmt aber keinen Ausführungspreis.

Die Stadtkassen starten reproduzierbar mit Lambrecht 204.900,00, Neustadt 267.450,00 und Mannheim 302.500,00 Gold. Nach Lager- und Geldmigration erzeugt Tick 0 die Stadtorders gemäß [`city-market-actor.md`](city-market-actor.md). Die Migration darf weder Ware noch Gold erzeugen oder entfernen.
