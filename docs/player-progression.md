# Spielerfortschritt, Beliebtheit und Kontore

## Spielstart

Der spätere reguläre Spieler startet nach der Registrierung mit:

- einer kleinen aktiven Flotte, zunächst bestehend aus einer Pinasse,
- leerem Laderaum,
- einem festen Startkapital; als bisheriger Richtwert wurden 30.000 Goldmünzen genannt,
- keinem Kontor und keinem Produktionsgebäude.

Die konkrete Geschichte, warum der Spieler das Startschiff besitzt, ist nicht entschieden und für die Alpha nicht relevant.

## Erstes Spielziel und Tutorial

Das Tutorial soll den Spieler nicht sofort mit Kontoren oder Gebäuden überfordern. Der vorgesehene Einstieg ist:

1. Ein nahegelegenes schwimmendes Fass wird auf der Karte angezeigt.
2. Der Spieler bewegt sich in den kleinen Interaktionsradius und sammelt es ein.
3. Das Fass enthält beispielsweise zehn Tonnen Holz.
4. Eine nahe Stadt benötigt diese Ware.
5. Der Spieler verkauft die Ware und verdient sein erstes Geld.
6. Anschließend führt das Tutorial einen ersten Handel zwischen zwei Städten ein.

Später können auch Schiffbrüchige oder Reisende erscheinen, die zu einer bestimmten Stadt gebracht werden möchten. Größere Entfernung bedeutet grundsätzlich eine höhere Belohnung.

## Beliebtheit je Stadt

Jeder Spieler besitzt für jede Stadt einen eigenen Beliebtheitswert.

- Handel mit einer Stadt erhöht die Beliebtheit.
- Die genaue Berechnung und Begrenzung ist Balancing.
- Ein Kontor darf erst ab einem definierten Schwellwert errichtet werden.
- Als bisheriges Beispiel wurde eine Beliebtheit von 80 Prozent genannt.

## Kontore

Ein Kontor ist das persönliche Lager des Spielers in genau einer Stadt.

Für den Bau werden benötigt:

- ausreichende lokale Beliebtheit,
- eine Geldzahlung; bisheriges Beispiel: 10.000 Goldmünzen,
- Baumaterialien; bisheriges Beispiel: 100 Holz und 100 Lehm,
- eine Bauzeit von mehreren Stunden oder Tagen.

Alle Zahlen sind Balancingwerte und außerhalb der Alpha noch nicht final.

### Lokale Lagerung

- Waren im Kontor einer Stadt sind nur in dieser Stadt verfügbar.
- 100 Tonnen Getreide im Kontor von Lambrecht können nicht direkt in Neustadt verwendet werden.
- Produktionsgebäude beziehen Eingänge aus dem Kontor ihres Eigentümers und legen Ausgänge dort ab.
- Ein späterer Verkauf direkt aus dem Kontor ist denkbar, aber nicht entschieden.

## Vermögen, Erfahrung und Rang

Der Fortschritt soll sich ähnlich wie in Port Royale 2 aus dem Gesamtvermögen ableiten.

Zum Vermögen zählen mindestens:

- Bargeld,
- Wert aller Schiffe,
- Wert aller Gebäude.

Das Vermögen bestimmt Erfahrung beziehungsweise Rang. Der Rang schaltet langfristig Möglichkeiten frei, darunter:

- maximale Anzahl von Kontoren in verschiedenen Städten,
- größere wirtschaftliche Handlungsmöglichkeiten,
- später die Berechtigung, neue Städte zu gründen.

Die konkrete Rangliste und alle Schwellenwerte werden später gebalanced.

## Bankrott und Reset

Der Spieler kann wirtschaftlich handlungsunfähig werden. Sein persönlich gesteuertes Mindestschiff beziehungsweise seine grundlegende aktive Flotte soll jedoch nicht endgültig verschwinden. Kann der Spieler nicht mehr sinnvoll handeln, darf er seinen Spielstand zurücksetzen und erneut mit den Startbedingungen beginnen.

## Alpha 1

Alpha 1 verwendet nur einen Testspieler mit:

- 30.000 Goldmünzen Startkapital,
- einer vereinfachten aktiven Flotte mit 60 Tonnen Kapazität,
- leerem Laderaum,
- statischen Beliebtheits- und Kontor-Anzeigewerten.

Beliebtheitsfortschritt, Kontorbau, Rang, Erfahrung und Reset werden in Alpha 1 nicht implementiert.