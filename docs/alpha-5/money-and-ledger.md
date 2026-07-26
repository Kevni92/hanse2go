# Alpha 5: Geldkonten und Gold-Ledger

## Geldgenauigkeit und Konten

Die kleinste autoritative Einheit ist ein ganzzahliges `moneyUnit` von 0,01 Gold. Ein Gold entspricht 100 `moneyUnits`; bestehende ganzzahlige Alpha-Goldwerte werden bei der Migration exakt mit 100 multipliziert. Gleitkommazahlen werden weder autoritativ gespeichert noch gebucht. API und UI formatieren Geld im Format `de-DE` mit zwei Nachkommastellen.

Jeder Spieler, jede Stadtkasse und jede Bevölkerungskasse besitzt ein Goldkonto. Ab Alpha 6 besitzt zusätzlich jedes KI-Handelshaus ein gleichwertiges reales Goldkonto ohne Sonderrechte; die Regeln dieses Dokuments gelten für es unverändert. Für jedes Konto gilt jederzeit:

`availableMoney + reservedMoney = totalAccountMoney`

Buy-Order-Reservierungen sind ein Unterbestand des Käuferkontos und werden in der Geldmenge nicht doppelt gezählt.

Ihre maximale Höhe ergibt sich aus `maximumTradeValueMoneyUnits + ceil(maximumTradeValueMoneyUnits × 5 / 1000)`. Teilfüllung, Stornierung und Ersetzung passen ausschließlich die verbleibende Reservierung an oder geben sie frei; sie verändern nie die Gesamtgeldmenge. Die zugehörigen Waren- und Orderregeln stehen in [`orders.md`](orders.md).

## Alpha-5-Startkonten

| Konto | Gold | moneyUnits |
|---|---:|---:|
| Spieler `player-alpha` | 100.000,00 | 10.000.000 |
| Stadtkasse Lambrecht | 204.900,00 | 20.490.000 |
| Stadtkasse Neustadt | 267.450,00 | 26.745.000 |
| Stadtkasse Mannheim | 302.500,00 | 30.250.000 |
| Bevölkerung Lambrecht | 97.920,00 | 9.792.000 |
| Bevölkerung Neustadt | 244.800,00 | 24.480.000 |
| Bevölkerung Mannheim | 489.600,00 | 48.960.000 |

Die Weltinitialisierung oder ein deterministischer Testreset sind die einzige Alpha-5-Geldquelle. Die konstante Geldmenge beträgt exakt `170.717.000 moneyUnits` beziehungsweise `1.707.170,00 Gold`.

## Gedeckte Geldflüsse

Eine Marktausführung belastet das Käuferkonto um Transaktionswert und Käufergebühr. Der Verkäufer erhält den Transaktionswert abzüglich Verkäufergebühr; beide Gebühren gehen an die Stadtkasse des lokalen Orderbuchs. Handelt die Stadt selbst, nutzt sie dieselbe Stadtkasse: ihre eigene Gebühr ist eine interne Buchung und verändert deren Nettobestand nicht, die externe Gegenpartei zahlt ihre normale Gebühr.

Löhne fließen vom Gebäudeeigentümer in die Bevölkerungskasse der Gebäudestadt. Sie werden nur vollständig finanziert gezahlt und dort angespart. Bevölkerungskäufe reservieren und belasten ausschließlich dieses Konto; abgelaufene oder ersetzte Restorders geben ihre Reservierung frei.

Folgende Zahlungen gehen künftig an die Stadtkasse der jeweiligen Stadt: Baukonzession, Grundstückspreis, zusätzliche Gebäudebaugebühr, Kontorbaugebühr, Wohnhausbaugebühr, Werftgebühr und Kaufpreis eines neutral angebotenen Schiffs. Baumaterialien werden beim Bauen als reale Warensenke verbraucht und erzeugen kein Gold. Beim Schiffsverkauf zahlt die Stadtkasse des Hafens den Verkäufer; fehlt ihr der vollständige Ankaufspreis, wird die Aktion atomar abgelehnt.

## Unveränderliches Ledger

Jede Goldbewegung erzeugt unveränderliche Ledger-Einträge mit `ledgerEntryId`, Ticknummer oder Befehlszeitpunkt, `reason`, Quellkonto, Zielkonto, Betrag in `moneyUnits`, Referenztyp und -ID sowie Idempotenz-ID oder Tick-ID. Eine wirtschaftliche Aktion darf mehrere Einträge erzeugen; ihre Belastungen und Gutschriften sind insgesamt ausgeglichen.

Verbindliche Gründe sind `market_trade`, `market_buyer_fee`, `market_seller_fee`, `wage_payment`, `population_purchase`, `concession_fee`, `land_purchase_fee`, `building_construction_fee`, `shipyard_fee`, `ship_purchase` und `ship_sale`.

Ab Alpha 6 kommt ausschließlich der Grund `ai_endowment` hinzu. Er überträgt in der Weltinitialisierung beziehungsweise im deterministischen Testreset einmalig 150.000,00 Gold aus einer bestehenden Stadtkasse an das Konto ihres KI-Handelshauses. Er ist keine laufende Zahlung, kein Kredit und keine Geldquelle: Er verschiebt nur vorhandenes Gold zwischen zwei realen Konten und ist außerhalb der Initialisierung unzulässig. Alle übrigen KI-Goldbewegungen verwenden ausnahmslos die bereits bestehenden Gründe. Die vollständige bilanzierte Abfolge steht in [`../alpha-6/start-state.md`](../alpha-6/start-state.md).

## Bilanzinvariante und Fehler

Vor und nach jedem normalen Befehl und jedem Tick gilt:

`sum(all available balances + all reserved balances) = constantMoneySupply`

Ein Fehler oder Rollback ändert weder Konten noch Ledger teilweise. Nicht erlaubt sind unbegrenzte Systemkonten, automatische Kassenauffüllungen, negative Konten oder Kredit, nicht belastete Belohnungen und Rundungsdifferenzen. Goldware, Goldminen und Münzprägung sind außerhalb von Alpha 5.

Fachliche Fehlercodes sind `INSUFFICIENT_AVAILABLE_GOLD`, `INSUFFICIENT_CITY_TREASURY`, `MONEY_RESERVATION_CONFLICT`, `MONEY_LEDGER_IMBALANCE` und `MONEY_SUPPLY_INVARIANT_VIOLATION`.
