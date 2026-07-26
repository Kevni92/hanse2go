# Alpha 5: Startzustand und Resetvertrag

Der Reset `alpha5-baseline` baut auf dem abgeschlossenen Alpha-4-Startzustand auf. Er legt exakt die sieben Konten aus [`money-and-ledger.md`](money-and-ledger.md) an, mit insgesamt `170.717.000 moneyUnits` beziehungsweise `1.707.170,00 Gold`. Reservierungen starten vor der Systemordergenerierung bei null und werden nicht zusätzlich gezählt.

Die Migration multipliziert bestehende ganzzahlige Alpha-Goldstände exakt mit 100, überträgt jeden bisherigen Stadt-Warenbestand ohne Mengenänderung in ein städtisches Lager und ordnet bisher verschwindende Gebühren einer realen Stadtkasse zu. Es gibt kein neutrales, unbegrenztes oder negatives Konto.

Nach der Mengen- und Geldprüfung erzeugt Tick 0 stabile Stadtorders. Danach wird die erste Bevölkerungskonsumperiode deterministisch eröffnet. Jeder Reset prüft:

- alle Kontostände verfügbar/reserviert/gesamt;
- die konstante Geldmenge;
- jede Warenmenge vor/nach Migration;
- Order-, Execution-, Ledger- und Buchsequenzen;
- keine offene Order ohne vollständige Deckung.

Die Testpresets `alpha5-order-ready` und `alpha5-two-players` dürfen Geld ausschließlich innerhalb der bestehenden Konten übertragen. Jeder Reset ist idempotent und stellt bei identischer Eingabe denselben Snapshot her.
