# Flotten und Schiffe

## Aktive Flotte

Der Spieler steuert nicht ein einzelnes Schiff, sondern immer eine aktive Flotte. Zu Spielbeginn enthält diese Flotte nur eine Pinasse. Weitere Schiffe können später gekauft oder gekapert und der Flotte hinzugefügt werden.

Die aktive Flotte repräsentiert die GPS-Position des Spielers. Sie bewegt sich direkt mit seiner realen beziehungsweise in Alpha 1 simulierten Position.

## Auswirkungen mehrerer Schiffe

- Der gesamte Laderaum ist die Summe der Kapazitäten aller Schiffe der Flotte.
- Für spätere Seeschlachten zählt die konkrete Zusammensetzung der Flotte.
- Die Flotte kann aus unterschiedlichen Schiffstypen bestehen.
- Als Ausgangsbasis für die spätere Schiffsliste dienen zunächst die Schiffstypen aus Port Royale 2; eine eigene endgültige Liste wird separat dokumentiert.

## Hafenbindung

Die Flottenzusammenstellung darf nur in einer Stadt beziehungsweise einem Hafen verändert werden.

Beispiel:

1. Der Spieler erreicht Neustadt und kauft dort eine Flöte.
2. Er fügt sie seiner aktiven Flotte hinzu.
3. In Lambrecht kauft er eine Galeone und entfernt gleichzeitig die Pinasse aus der aktiven Flotte.
4. Die Pinasse bleibt im Hafen von Lambrecht.
5. Von Neustadt aus kann nicht auf die in Lambrecht liegende Pinasse zugegriffen werden.

In einem Hafen kann der Spieler später:

- Schiffe kaufen,
- Schiffe verkaufen,
- Schiffe zur aktiven Flotte hinzufügen,
- Schiffe aus der aktiven Flotte entfernen,
- weitere Flotten zusammenstellen.

## Laderaum

Für den ersten Umfang gilt ein einfaches Tonnenmodell:

- Jede Wareneinheit entspricht einer Tonne.
- Waren haben keine unterschiedlichen Größen- oder Gewichtsfaktoren.
- Ist der Laderaum voll, können keine weiteren Waren gekauft oder aufgenommen werden.
- Verkaufen und Entladen bleiben möglich.

Beispiel: Eine Flotte mit 60 Tonnen Kapazität kann drei Tonnen Getreide und 57 Tonnen einer anderen Ware transportieren.

## Automatische Flotten und Handelsrouten

Später kann der Spieler zusätzliche Flotten anlegen und ihnen automatische Handelsrouten zuweisen.

- Eine automatische Flotte bewegt sich mit virtueller Geschwindigkeit.
- Die Geschwindigkeit richtet sich nach dem langsamsten Schiff.
- Automatische Routen sind deutlich langsamer als reale Bewegung mit Auto, Bahn oder Fahrrad.
- Sie benötigen eigene Schiffe, Kapital und spätere Routenkonfiguration.
- Die Kosten und Einschränkungen müssen echte Bewegung weiterhin attraktiv halten.

## Verlust und Bankrott

Das vom Spieler persönlich gesteuerte Mindestschiff beziehungsweise die grundlegende aktive Flotte soll nicht endgültig zerstört werden. Weitere Schiffe können in späteren Kampfsystemen Risiken unterliegen; konkrete Verlustregeln sind noch nicht entschieden.

## Alpha 1

Alpha 1 modelliert noch keine einzelnen Schiffe. Sie verwendet ausschließlich:

- eine aktive Flotte,
- 60 Tonnen feste Gesamtkapazität,
- einen Warenbestand je Ware,
- belegten und freien Laderaum,
- keine Häfen, Schiffskäufe, Flottenverwaltung, Geschwindigkeit oder Kämpfe.