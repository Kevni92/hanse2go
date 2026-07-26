# Spielerfortschritt, Beliebtheit und Kontore

## Spielstart

Für die deterministische Alpha-5-Welt gelten die konkreten Konten und das Startgold in [`alpha-5/money-and-ledger.md`](alpha-5/money-and-ledger.md). Historische Richtwerte dieses Abschnitts begründen keine zusätzliche Geldquelle.

Der spätere reguläre Spieler startet nach der Registrierung mit:

- einer kleinen aktiven Flotte, zunächst bestehend aus einer Pinasse,
- leerem Laderaum,
- einem festen, durch die Weltinitialisierung gedeckten Startkapital,
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

## Örtlicher Ruf und Baukonzession (Alpha 2)

Alpha 2 ersetzt die bisher unverbindliche Beliebtheitsnotiz durch einen serverautoritativen örtlichen Ruf. Jeder Spieler besitzt je Stadt einen ganzzahligen Ruf von 0 bis 100; ein neuer Spieler startet in jeder Stadt mit 0.

| Ruf | Status |
|---:|---|
| 0–19 | Fremder |
| 20–49 | Bekannter Händler |
| 50–79 | Angesehener Händler |
| 80–100 | Vertrauenswürdiger Bürger |

Nur nützlicher Handel kann Ruf erhöhen. Ein Rufverlust, globaler Ruf, Ruf durch Zeit, Gebäudebesitz oder bloße Anwesenheit existiert in Alpha 2 nicht. Ab 80 Ruf kann der Spieler genau für diese Stadt eine dauerhafte Baukonzession für 10.000 Gold kaufen. Die Konzession wird weder übertragen noch entzogen.

Die vollständige Berechnung, Missbrauchsschutz und Fehlerfälle stehen in [`alpha-2/reputation-and-concessions.md`](alpha-2/reputation-and-concessions.md).

## Kontore

Ein Kontor ist das persönliche Lager des Spielers in genau einer Stadt.

In Alpha 2 setzt der sofortige Kontorbau eine stadtbezogene Baukonzession voraus. Kosten und Materialien sind verbindlich in [`alpha-2/buildings-and-construction.md`](alpha-2/buildings-and-construction.md) festgelegt; die Konzession selbst kostet 10.000 Gold und ist keine Kontorbauzahlung.

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

## KI-Handelshäuser als gleichrangige Akteure (Alpha 6)

Ab Alpha 6 teilen sich Spieler und autonome Handelshäuser dieselben Fachregeln. Ein Handelshaus baut Ruf ausschließlich über nützliche, real ausgeführte Verkäufe auf, kauft seine Baukonzession ab 80 Ruf regulär für 10.000 Gold, baut sein Kontor als erstes Gebäude einer Stadt und bezahlt Grundstück, Bau, Material, Löhne, Werftgebühren und Schiffe vollständig gedeckt. Es erhält keine Sonderpreise, keine bevorzugte Orderpriorität, keine Sonderressourcen und keinen Zugriff auf private Spielerdaten.

Die einzige Abweichung ist der bilanzierte Startzustand: Die Heimatstadt überträgt einmalig 150.000 Gold aus ihrer Stadtkasse, und die Heimatkonzession wird gegen die reguläre Gebühr ohne die Rufschwelle vergeben – genau wie die im Alpha-Startzustand bereits enthaltene Spielerkonzession für Lambrecht. Für jede weitere Stadt gilt für Handelshäuser der unveränderte Spielerablauf.

Anders als der Spieler kann ein Handelshaus dauerhaft insolvent werden. Es erhält kein Rettungsgeld und keinen Reset; sein Eigentum bleibt bestehen. Die vollständigen Regeln stehen in [`alpha-6/ai-actors.md`](alpha-6/ai-actors.md), [`alpha-6/start-state.md`](alpha-6/start-state.md) und [`alpha-6/insolvency.md`](alpha-6/insolvency.md).

## Bankrott und Reset

Der Spieler kann wirtschaftlich handlungsunfähig werden. Sein persönlich gesteuertes Mindestschiff beziehungsweise seine grundlegende aktive Flotte soll jedoch nicht endgültig verschwinden. Kann der Spieler nicht mehr sinnvoll handeln, darf er seinen Spielstand zurücksetzen und erneut mit den Startbedingungen beginnen.

## Alpha 1

Alpha 1 verwendet nur einen Testspieler mit:

- 30.000 Goldmünzen Startkapital,
- einer vereinfachten aktiven Flotte mit 60 Tonnen Kapazität,
- leerem Laderaum,
- statischen Beliebtheits- und Kontor-Anzeigewerten.

Beliebtheitsfortschritt, Kontorbau, Rang, Erfahrung und Reset werden in Alpha 1 nicht implementiert.
