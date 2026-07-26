# Flotten und Schiffe

## Alpha 4: konkrete Schiffe und aktive Flotte

Ab Alpha 4 steuert der Spieler genau eine aktive Flotte aus konkreten, dauerhaft identifizierten Schiffen. Die aus Alpha 3 migrierte Startflotte enthält eine konkrete Pinasse. Kauf, Verkauf, Umbenennung und Flottenwechsel erhalten dieselbe Schiffsentität; nur Weltinitialisierung und erfolgreicher Schiffsbau erzeugen ein Schiff.

Die aktive Flotte verwendet in Alpha 4 und Alpha 5 die Debug-Position der Testwelt als lokalen Zugriffsnachweis. Langfristig hat sie eine serverseitige virtuelle Position auf der Karibikkarte; ihre Geschwindigkeit, Strecke und spätere Reiseeinflüsse bestimmen die Reisezeit. Alpha 5 führt diese Reise nicht ein.

## Alpha 6: virtuelle Reisen zwischen den Teststädten

Ab Alpha 6 bewegt sich eine Flotte real zwischen Städten. Eine Flotte ist entweder `in_port` in genau einem Hafen oder `traveling` auf genau einer Reise – niemals beides und niemals keines von beidem. Der Status `active` bleibt ausschließlich als Übergangsstatus der bisherigen Spieler-Debugflotte erhalten; beim Start einer Reise wird auch sie `traveling` und nach der Ankunft `in_port` der Zielstadt.

Die Fahrzeit ist `ceil(Distanz / Geschwindigkeit des langsamsten Schiffes)` auf einem statischen Drei-Städte-Graph mit 48 km Lambrecht–Neustadt, 96 km Neustadt–Mannheim und 120 km Lambrecht–Mannheim. Während der Reise sind Schiffszusammensetzung, Ladung und Eigentum gesperrt; Umleitung, Zwischenstopp und Abbruch existieren nicht. Eine Reise erzeugt und verbraucht weder Ware noch Gold, und Alpha 6 kennt keine Reisegebühr.

Spieler und KI-Handelshäuser verwenden denselben Abfahrtsbefehl und dieselben Voraussetzungen. Ein Handelshaus besitzt dabei keine aktive Flotte und keine Debug-Position; seine Lokalität ergibt sich aus dem eigenen Kontor beziehungsweise dem Hafen, in dem die Flotte liegt.

Der Spieler startet eine Reise über die Hafenansicht und sieht vorher Distanz, Flottengeschwindigkeit und berechnete Fahrzeit sowie die Warnung, dass Zusammensetzung und Ladung während der Reise gesperrt sind. Laufende Reisen aller sichtbaren Flotten – auch der Handelshäuser – erscheinen mit Start, Ziel, Restticks und erwarteter Ankunft. Die Oberflächendefinition steht in [`alpha-6/user-interface.md`](alpha-6/user-interface.md).

Die vollständigen Regeln stehen in [`alpha-6/virtual-voyages.md`](alpha-6/virtual-voyages.md), der Streckengraph mit allen Referenzfahrzeiten in [`alpha-6/test-world-routes.md`](alpha-6/test-world-routes.md) und der technische Vertrag in [`alpha-6/api-contracts.md`](alpha-6/api-contracts.md).

## Alpha 6: Warentransport zwischen Städten

Ab Alpha 6 ist eine Flotte der einzige Weg, Ware zwischen zwei Städten zu bewegen. Ein Transport besteht immer aus derselben Kette: Ware im Quellhafen über eine gedeckte Buy Order kaufen, aus dem Kontor in die Flotte laden, reisen, im Zielhafen in das Kontor entladen und dort über eine gedeckte Sell Order verkaufen. Ein direkter Transfer zwischen Kontoren verschiedener Städte existiert nicht, weder für Spieler noch für die KI.

Eine Flotte gehört zu jedem Zeitpunkt höchstens einem aktiven Transportauftrag. Nach der Ankunft bleibt sie im Zielhafen und wird nicht automatisch leer zurückgeschickt; eine rentable Rückfracht hat Vorrang vor einer Leerfahrt.

Für die wirtschaftliche Bewertung tragen transportierte Waren kalkulatorische Transportkosten von einem `moneyUnit` je Kilometer und Tonne. Diese Größe bewegt kein Gold und erzeugt keine Ledgerbuchung; sie erhöht nur die Kostenbasis und damit den Mindestverkaufspreis. Die vollständigen Regeln stehen in [`alpha-6/ai-logistics.md`](alpha-6/ai-logistics.md).

## Auswirkungen mehrerer Schiffe

- Der gesamte Laderaum ist die Summe der Kapazitäten aller Schiffe der Flotte.
- Die Flottengeschwindigkeit ist die Geschwindigkeit ihres langsamsten Schiffs.
- Eine Flotte kann unterschiedliche Schiffstypen enthalten.
- Der verbindliche Katalog steht in [`alpha-4/ship-catalog.md`](alpha-4/ship-catalog.md); Identität und Standortregeln in [`alpha-4/ship-entities.md`](alpha-4/ship-entities.md).

## Hafenbindung

Flottenzusammenstellung, Kauf und Verkauf erfolgen lokal in einem Hafen. Ein Schiff gehört dabei entweder einer einzigen Flotte an oder liegt unzugeordnet in genau diesem Hafen.

In einem Hafen kann der Spieler ab Alpha 4:

- vorhandene Schiffe kaufen oder verkaufen,
- eigene Schiffe umbenennen,
- Schiffe einer Flotte hinzufügen oder aus ihr entfernen,
- weitere Flotten zusammenstellen und eine lokale Flotte aktivieren,
- Waren zwischen lokalen eigenen Flotten und seinem Kontor bewegen.

Von einem anderen Hafen aus kann der Spieler nicht auf ein dort nicht vorhandenes Schiff zugreifen.

## Neutraler Schiffsmarkt

Ab Alpha 5 ersetzt die Stadtkasse den historischen unbegrenzt liquiden Makler: Kaufpreise gehen an sie, Verkäufe werden nur bei ausreichender Stadtkasse bezahlt und erhalten Ledger-Einträge gemäß [`alpha-5/money-and-ledger.md`](alpha-5/money-and-ledger.md).

Jede Alpha-4-Stadt besitzt einen neutralen Hafen und Schiffsmakler. Dessen Angebot ist endlich und enthält nur konkrete, unzugeordnete Schiffsentitäten. Ein Kauf überträgt exakt dieses Schiff an den Spieler; ein Verkauf überträgt ein unzugeordnetes eigenes Schiff im selben Hafen zurück an den Makler. Beide Vorgänge erhalten ID, Name und Herkunft und ändern die lokale Marktversion. Regeln, Preise und feste Testschiffe stehen in [`alpha-4/ports-and-ship-market.md`](alpha-4/ports-and-ship-market.md).

## Schiffsbau

Jede Alpha-4-Stadt besitzt eine neutrale Werft mit einem aktiven Bauplatz und einer unbegrenzten FIFO-Warteschlange. Ein vollständig finanzierter Auftrag verbraucht Gold und Material im lokalen Kontor sofort, erzeugt aber erst beim Abschluss im manuellen Stundentick ein neues Schiff. Der Bau ist damit der einzige reguläre Entstehungsweg außerhalb der Weltinitialisierung. Kosten, Reihenfolge und Fehlerfälle stehen in [`alpha-4/shipbuilding.md`](alpha-4/shipbuilding.md).

## Mehrere Flotten

Ein Spieler steuert genau eine aktive Flotte; weitere eigene Flotten liegen in einem Hafen. Jede Flotte hat mindestens ein konkretes Schiff, einen gemeinsamen Warenbestand und aus ihren Schiffen abgeleitete Kapazität und Geschwindigkeit. Neue Flotten entstehen mit ihrem ersten unzugeordneten Schiff, und der Aktivwechsel ist nur mit einer lokalen inaktiven Flotte im selben Hafen möglich. Vollständige Regeln stehen in [`alpha-4/fleet-management.md`](alpha-4/fleet-management.md).

## Ladung und lokale Transfers

Jede Flotte führt einen eigenen gemeinsamen Bestand, nicht die einzelnen Schiffe. Der Markt handelt weiter nur mit der aktiven Flotte. Bei Anwesenheit im Hafen kann der Spieler Waren kostenlos und atomar zwischen seinen lokalen aktiven oder inaktiven Flotten und seinem Kontor verschieben. Regeln und Kapazitätsprüfung stehen in [`alpha-4/fleet-cargo-and-transfers.md`](alpha-4/fleet-cargo-and-transfers.md).

## Laderaum

Jede Wareneinheit entspricht einer Tonne. Ist der Laderaum voll, können keine weiteren Waren aufgenommen werden; Verkaufen und Entladen bleiben möglich. Die konkrete Alpha-4-Kapazität ist nicht mehr fest 60 Tonnen, sondern wird aus den der aktiven Flotte zugeordneten Schifftypen abgeleitet.

## Spätere automatische Handelsrouten

Alpha 6 liefert die einzelne virtuelle Reise, aber noch keine dauerhaft wiederholte Handelsroute. Fest konfigurierte Rundrouten mit automatischer Wiederholung werden in einem späteren Slice ergänzt. Sie benötigen eigene Schiffe, Kapital und Routenkonfiguration und bewegen sich mit derselben virtuellen Geschwindigkeit des langsamsten Schiffs.

## Alpha 6: Schiffe und Flotten der Handelshäuser

Ab Alpha 6 besitzen autonome Handelshäuser eigene konkrete Schiffe und Flotten nach denselben Regeln wie Spieler. Ein Handelshaus kauft ein vorhandenes Schiff zum regulären neutralen Preis oder erteilt einen regulären Werftauftrag mit voller Gebühr und vollständigen Materialien aus seinem Kontor; es erhält keine bevorzugte Warteschlangenposition. Ein Kauf erzeugt kein Schiff, ein Verkauf löscht keines, und das letzte Schiff eines Handelshauses ist geschützt.

Zusätzliche Transportkapazität ist keine freie Entscheidung: Sie setzt einen über 72 Ticks gemessenen Engpass von mindestens 80 % Auslastung und mindestens 60,00 t abgelehnter rentabler Transporte voraus, muss innerhalb von 1.440 Ticks amortisieren und ist auf höchstens ein Schiff je Handelshaus und 72 Ticks begrenzt. Ein dauerhaft ungenutztes Schiff wird frühestens nach 240 Ticks für einen regulären Verkauf geprüft.

Anders als ein Spieler besitzt ein Handelshaus keine aktive Flotte; seine Flotten sind immer `in_port` oder `traveling`. Die vollständigen Regeln stehen in [`alpha-6/ai-ships-and-fleets.md`](alpha-6/ai-ships-and-fleets.md) und [`alpha-6/ai-investment.md`](alpha-6/ai-investment.md).

## Verlust und Bankrott

Das vom Spieler persönlich gesteuerte Mindestschiff beziehungsweise die grundlegende aktive Flotte soll nicht endgültig zerstört werden. Reparatur, Kampf, Piraterie, Kapern und konkrete Verlustregeln liegen außerhalb von Alpha 4.

## Alpha 1 bis Alpha 3

Vor Alpha 4 modelliert die Anwendung keine einzelnen Schiffe. Sie verwendet ausschließlich eine abstrakte aktive Flotte mit fester 60-Tonnen-Kapazität, Warenbestand sowie belegtem und freiem Laderaum. Alpha 4 migriert diese Startflotte in eine Flotte mit einer Pinasse.
