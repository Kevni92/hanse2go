# Stadtmarkt, Nachfrage und Preisberechnung

> Historische Alpha-1-bis-Alpha-4-Regeln: Ab Alpha 5 ersetzt das lokale, vollständig gedeckte Limit-Orderbuch diese direkte Stadtmarkt-Abrechnung. Die Preisformel und der Spread bleiben nur Referenzwerte; verbindliche Konten- und Ledgerregeln stehen in [`alpha-5/money-and-ledger.md`](alpha-5/money-and-ledger.md).

Die Pflichtfelder, Reservierungen, Status und Lebenszyklus der Alpha-5-Orders stehen in [`alpha-5/orders.md`](alpha-5/orders.md).

## Alpha 5: verbindlicher Marktweg

Ab Alpha 5 ist das folgende Modell maßgeblich und überschreibt die historischen
Direktkauf-/Direktverkauf-Regeln dieser Datei:

- Jede Stadt und Ware besitzt ein lokales Orderbuch mit gedeckten Limit Orders.
- Preise entstehen ausschließlich durch das Preis-Zeit-Matching realer Buy- und Sell Orders.
- `POST /market/quote` und `POST /market/trade` sind kein Alpha-5-Spielweg und dürfen nicht für Buchungen verwendet werden.
- Basispreis, Zielbestand, alter Spread und Preisformel sind nur Referenz- beziehungsweise Migrationswerte.
- Spieler, Stadt und Bevölkerung nutzen dieselbe Order-, Matching- und Settlement-Logik.
- Keine Order darf Gold oder Ware erzeugen; alle Reservierungen werden in den vorhandenen Konten und Lagern geführt.

Die technischen Verträge und die atomaren Grenzen stehen in
[`alpha-5/api-contracts.md`](alpha-5/api-contracts.md) und
[`alpha-5/tick.md`](alpha-5/tick.md).

## Gemeinsamer Stadtmarkt

Jede Stadt besitzt einen eigenen gemeinsamen Markt. Alle Spieler sehen und verändern denselben Bestand.

- Verkauft ein Spieler Waren, erhöht sich der Stadtbestand sofort.
- Andere Spieler können diese Waren anschließend kaufen.
- Der Lagerbestand der Stadt ist zunächst unbegrenzt.
- Die Stadt besitzt in der Alpha unbegrenzt viel Geld und kann Waren immer ankaufen.
- Handel findet zunächst ausschließlich zwischen Spieler und Stadt statt.
- Direkter Spielerhandel sowie Buy- und Sell-Orders sind spätere Erweiterungen.

## Angebot und Nachfrage

Jede Ware besitzt einen Basispreis. Jede Stadt führt für die Ware:

- aktuellen Bestand,
- Zielbestand,
- aktuellen Marktwert,
- Kaufpreis des Spielers,
- Verkaufspreis des Spielers,
- Preis- und Handelsverlauf.

Langfristig entsteht der Zielbestand aus:

- Bedarf der Bevölkerung,
- Bedarf von KI- und anderen marktbasierten Betrieben,
- gewünschter Vorratsreichweite, beispielsweise sieben Tage.

Spielergebäude beziehen ihre Eingänge aus privaten Kontoren und erzeugen daher nicht automatisch direkten Marktbedarf. Ihre Nachfrage entsteht, wenn der Spieler Waren am Markt einkauft.

## Zielbestand

Grundform:

`Zielbestand = erwarteter Tagesbedarf × gewünschte Vorratstage`

Beim Zielbestand soll der Marktwert dem Basispreis entsprechen.

Für Alpha 1 sind Zielbestände statisch konfiguriert, da noch keine Bevölkerung oder Produktion simuliert wird.

## Preisformel

Verbindliches Alpha-Grundmodell:

`Preisfaktor = Zielbestand / max(aktueller Bestand, 1)`

`begrenzter Preisfaktor = clamp(Preisfaktor, 0,4, 4,0)`

`Marktwert = Basispreis × begrenzter Preisfaktor`

Sonderfälle:

- Bestand 0 führt durch `max(..., 1)` zum maximal begrenzten Preis statt zu einer Division durch null.
- Ein Zielbestand muss für Alpha 1 größer als 0 sein; ungültige Konfigurationen verhindern den Serverstart.
- Sehr große Überversorgung kann den Preis nicht unter 40 Prozent des Basispreises drücken.
- Extreme Knappheit kann den Preis nicht über 400 Prozent des Basispreises erhöhen.

## Spread

Der Marktwert ist ein interner Referenzwert. Die Stadt verwendet einen Spread:

- Spieler verkauft an Stadt: 95 Prozent des Marktwerts.
- Spieler kauft von Stadt: 105 Prozent des Marktwerts.

Dadurch kann dieselbe Ware nicht sofort ohne Verlust zurückgehandelt werden.

Für Alpha 1 werden ausschließlich ganzzahlige Goldmünzen verwendet:

- Kaufpreis des Spielers wird je Einheit aufgerundet.
- Verkaufserlös des Spielers wird je Einheit abgerundet.

## Große Handelsmengen

Der Preis einer größeren Transaktion wird nicht einmalig aus dem Ausgangsbestand berechnet. Stattdessen simuliert der Server die Menge deterministisch Einheit für Einheit:

- Beim Kauf sinkt der Stadtbestand nach jeder Einheit; folgende Einheiten können teurer werden.
- Beim Verkauf steigt der Stadtbestand nach jeder Einheit; folgende Einheiten können günstiger vergütet werden.
- Der Gesamtpreis ist die Summe der einzelnen ganzzahligen Einheitspreise.
- Die Preisvorschau zeigt Menge, Gesamtpreis, durchschnittlichen Preis, Preisspanne und resultierende Bestände.

Die tatsächliche Transaktion wird atomar ausgeführt. Schlägt eine Prüfung fehl, ändern sich weder Geld noch Stadt- oder Flottenbestände.

## Preisvorschau und Parallelität

Eine Preisvorschau ist nur für einen konkreten Marktstand gültig. Der Server versieht den Markt beziehungsweise das Angebot mit einer Version.

Beim Abschluss prüft er mindestens:

- Stadt und Ware,
- Handelsrichtung und Menge,
- Marktversion beziehungsweise Angebots-ID,
- aktuellen Stadtradius,
- Stadtbestand,
- Flottenbestand,
- Geld,
- freien Laderaum.

Ist das Angebot veraltet, wird es abgelehnt und der Client fordert eine neue Vorschau an. Doppelt gesendete Abschlussanfragen dürfen nicht doppelt verbucht werden; eine Idempotenz-ID ist eine sinnvolle technische Standardentscheidung.

## Preis- und Handelsverlauf

Für Alpha 1 wird im Arbeitsspeicher protokolliert:

- Zeitstempel,
- Preis vor und nach einer Transaktion,
- Kauf- oder Verkaufsrichtung,
- gehandelte Menge,
- Gesamtwert.

Der Verlauf beginnt bei Serverstart neu. Die UI kann daraus Preislinie und Handelsvolumen der aktuellen Sitzung darstellen.

## Historische KI-Stabilisierungsidee

Die folgende frühere Idee ist keine zulässige Alpha-5-Regel. Spätere KI-Akteure müssen dieselben gedeckten Konten, Waren und Orders wie Spieler verwenden:

- Waren aus stark überversorgten Städten abtransportieren,
- dauerhaft knappe Städte beliefern,
- bei Bedarf Waren erzeugen oder entfernen, wenn dies für Spielbarkeit nötig ist.

KI-Produktion und KI-Handel werden zurückgefahren, wenn genügend Spieleraktivität vorhanden ist.

## Alpha 1

In Alpha 1 verändern ausschließlich Spielertransaktionen die Bestände und Preise. Es gibt keine laufende Produktion, keinen Verbrauch, keine KI-Händler, keine Marktaufträge und kein Stadtbudget.

## Alpha 2: Rufrelevanter Handel

Alpha 2 behält Preisformel, Spread und atomare Handelsprüfung unverändert bei. Zusätzlich wertet der Server nach einer erfolgreichen Buchung den tatsächlichen Marktbestand vor und nach der Buchung für den örtlichen Ruf aus. Ruf entsteht ausschließlich, wenn ein Verkauf eine knappe Ware zum Zielbestand hin bewegt oder ein Kauf eine überschüssige Ware zum Zielbestand hin bewegt. Preis oder Gewinn eines Geschäfts ändern den Ruf nicht.

Die konkrete Formel und der Schutz gegen Teilmengen- und Gegenbuchungen stehen in [`alpha-2/reputation-and-concessions.md`](alpha-2/reputation-and-concessions.md). Produktion und Bevölkerungsverbrauch bleiben im Alpha-1-Abschnitt ausdrücklich ausgeschlossen und beginnen erst mit Alpha 2.

Im Alpha-2-Stundentick verringert der feste Bevölkerungsverbrauch ausschließlich die gemeinsamen Stadtmarktbestände. Der neue Bestand fließt ohne Sonderpreis direkt in die bestehende Preisformel ein. Der Verbrauch kann einen Bestand höchstens bis null reduzieren und verändert weder Gold, Wohlstand noch Bevölkerungszahl.

## Alpha 3: Verbraucherpreis und Versorgung

Alpha 3 verwendet für den Kaufkraftindex den bestehenden Spieler-Kaufpreis unmittelbar vor dem Bevölkerungsverbrauch. Der Preis enthält damit weiter den 105-Prozent-Spread und die ganzzahlige Rundung. Verbrauch entfernt Waren weiter ohne Goldfluss und darf den Bestand nie unter null senken; die genaue Festkomma-, Deckungs- und Wohlstandsregel steht in [`alpha-3/consumption-and-wealth.md`](alpha-3/consumption-and-wealth.md).
