# Flotten und Schiffe

## Alpha 4: konkrete Schiffe und aktive Flotte

Ab Alpha 4 steuert der Spieler genau eine aktive Flotte aus konkreten, dauerhaft identifizierten Schiffen. Die aus Alpha 3 migrierte Startflotte enthält eine konkrete Pinasse. Kauf, Verkauf, Umbenennung und Flottenwechsel erhalten dieselbe Schiffsentität; nur Weltinitialisierung und erfolgreicher Schiffsbau erzeugen ein Schiff.

Die aktive Flotte repräsentiert die GPS-Position des Spielers. Sie bewegt sich direkt mit seiner realen beziehungsweise in Alpha 1 simulierten Position. Ihre virtuelle Geschwindigkeit wird in Alpha 4 angezeigt, bewegt sie aber noch nicht automatisch.

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

Jede Alpha-4-Stadt besitzt einen neutralen Hafen und Schiffsmakler. Dessen Angebot ist endlich und enthält nur konkrete, unzugeordnete Schiffsentitäten. Ein Kauf überträgt exakt dieses Schiff an den Spieler; ein Verkauf überträgt ein unzugeordnetes eigenes Schiff im selben Hafen zurück an den Makler. Beide Vorgänge erhalten ID, Name und Herkunft und ändern die lokale Marktversion. Regeln, Preise und feste Testschiffe stehen in [`alpha-4/ports-and-ship-market.md`](alpha-4/ports-and-ship-market.md).

## Schiffsbau

Jede Alpha-4-Stadt besitzt eine neutrale Werft mit einem aktiven Bauplatz und einer unbegrenzten FIFO-Warteschlange. Ein vollständig finanzierter Auftrag verbraucht Gold und Material im lokalen Kontor sofort, erzeugt aber erst beim Abschluss im manuellen Stundentick ein neues Schiff. Der Bau ist damit der einzige reguläre Entstehungsweg außerhalb der Weltinitialisierung. Kosten, Reihenfolge und Fehlerfälle stehen in [`alpha-4/shipbuilding.md`](alpha-4/shipbuilding.md).

## Laderaum

Jede Wareneinheit entspricht einer Tonne. Ist der Laderaum voll, können keine weiteren Waren aufgenommen werden; Verkaufen und Entladen bleiben möglich. Die konkrete Alpha-4-Kapazität ist nicht mehr fest 60 Tonnen, sondern wird aus den der aktiven Flotte zugeordneten Schifftypen abgeleitet.

## Spätere automatische Handelsrouten

Zusätzliche Flotten und automatische Handelsrouten werden nach Alpha 4 ergänzt. Solche Flotten bewegen sich später mit virtueller Geschwindigkeit, die sich nach dem langsamsten Schiff richtet. Sie benötigen eigene Schiffe, Kapital und Routenkonfiguration; echte Bewegung bleibt die schnellste direkte Handelsform.

## Verlust und Bankrott

Das vom Spieler persönlich gesteuerte Mindestschiff beziehungsweise die grundlegende aktive Flotte soll nicht endgültig zerstört werden. Reparatur, Kampf, Piraterie, Kapern und konkrete Verlustregeln liegen außerhalb von Alpha 4.

## Alpha 1 bis Alpha 3

Vor Alpha 4 modelliert die Anwendung keine einzelnen Schiffe. Sie verwendet ausschließlich eine abstrakte aktive Flotte mit fester 60-Tonnen-Kapazität, Warenbestand sowie belegtem und freiem Laderaum. Alpha 4 migriert diese Startflotte in eine Flotte mit einer Pinasse.
