# Alpha 4 – Häfen und vorhandener Schiffsmarkt

## Hafenbindung

Lambrecht, Neustadt und Mannheim besitzen jeweils einen neutralen Hafen. Ein unzugeordnetes Schiff liegt über `portCityId` in genau einem dieser Häfen; eine inaktive Flotte liegt ebenfalls in genau einem Hafen. Die aktive Flotte gilt während lokaler Hafenaktionen als im Hafen der Stadt, deren serverautoritativ geprüften Stadtradius sie erreicht.

Jede schreibende Hafenaktion prüft die Reichweite neu. Eine geöffnete Hafenansicht berechtigt nicht dauerhaft.

## Neutraler Schiffsmakler

Der neutrale Systemakteur besitzt vorhandene Schiffe und bietet sie im jeweiligen Hafen zum konfigurierten Kaufpreis ihres Typs an. Er hat unbegrenztes Gold, erzeugt aber nie neue Schiffsentitäten. Sein Angebot besteht ausschließlich aus konkreten `shipId`-Einträgen.

Beim Kauf verschwindet ein Schiff aus dem Angebot, weil sein Eigentümer wechselt. Beim Verkauf erscheint dasselbe Schiff im selben Hafen wieder im Angebot. Der Makler verändert dabei nie Name, Herkunft oder ID und transportiert keine Schiffe zwischen Häfen.

## Kauf

Ein Kauf setzt voraus, dass die aktive Flotte den Zielhafen erreicht, das Schiff dort unzugeordnet liegt, dem Systemmakler gehört, zum angezeigten Preis verfügbar ist und der Spieler ausreichend Gold besitzt. Die Anfrage enthält einen Idempotenzschlüssel und die aktuelle `shipMarketVersion` des Hafens.

Der Vorgang ist atomar: Der Kaufpreis wird vollständig abgezogen, `ownerType` und `ownerId` werden auf den Spieler gesetzt und das Schiff bleibt unzugeordnet im selben Hafen. Name, ID, Typ, Herkunft und Entstehungszeitpunkt ändern sich nicht. Die Marktversion steigt um eins. Das gekaufte Schiff wird nie automatisch einer Flotte zugewiesen.

## Verkauf

Ein Verkauf setzt voraus, dass die aktive Flotte im selben Hafen ist, das Schiff dem Spieler gehört, unzugeordnet in diesem Hafen liegt und keiner Flotte angehört. Unzugeordnete Schiffe tragen in Alpha 4 keine eigene Ladung. Nach dem Verkauf muss dem Spieler mindestens ein Schiff und eine nichtleere aktive Flotte bleiben; das letzte Spielerschiff ist geschützt. Die Anfrage enthält einen Idempotenzschlüssel.

Der Vorgang ist atomar: Der Spieler erhält den Ankaufspreis, Eigentümer wird der Systemmakler und das Schiff bleibt unverändert im selben Hafen. Name und Identität bleiben erhalten, das Schiff erscheint zum normalen neutralen Kaufpreis wieder im Angebot und die Marktversion steigt um eins.

## Preise

| Schiffstyp | neutraler Kaufpreis | Ankauf durch Makler |
|---|---:|---:|
| Pinasse | 20.000 Gold | 12.000 Gold |
| Schnigge | 32.000 Gold | 19.200 Gold |
| Flöte | 60.000 Gold | 36.000 Gold |
| Kraweel | 95.000 Gold | 57.000 Gold |

Der Ankaufspreis ist exakt 60 % des neutralen Kaufpreises. Preise ändern sich in Alpha 4 nicht durch Angebot, Nachfrage, Alter, Zustand oder Namen. Kaufen und sofortiges Zurückverkaufen erzeugt 40 % Verlust. Spieler können keine Preise festlegen.

## Version, Parallelität und Fehler

Jeder Hafen besitzt eine ganzzahlige `shipMarketVersion`; Übersicht und Kaufvorschau liefern `shipId`, Preis und diese Version. Jede Eigentumsübertragung eines neutral angebotenen Schiffs erhöht sie. Veraltete Kaufanfragen werden mit `SHIP_MARKET_VERSION_CONFLICT` abgelehnt. Von zwei parallelen Kaufanfragen für dasselbe Schiff kann höchstens eine erfolgreich sein. Die Wiederholung derselben Anfrage mit identischer Idempotenz-ID liefert den ursprünglichen Erfolg ohne weitere Buchung.

Fachliche Fehlercodes sind `CITY_NOT_REACHABLE`, `SHIP_NOT_FOUND`, `SHIP_NOT_FOR_SALE`, `SHIP_NOT_OWNED`, `SHIP_NOT_IN_PORT`, `SHIP_ASSIGNED_TO_FLEET`, `INSUFFICIENT_GOLD`, `LAST_PLAYER_SHIP_PROTECTED`, `SHIP_MARKET_VERSION_CONFLICT` und `IDEMPOTENCY_KEY_REQUIRED`.

Nicht Bestandteil sind unbegrenzte Angebote, Schifferzeugung beim Kauf, Löschung beim Verkauf, Spieler-zu-Spieler-Handel, Auktionen, Orders, freie Preise, zustandsabhängige Preise und der Direktverkauf eines Flottenschiffs.
