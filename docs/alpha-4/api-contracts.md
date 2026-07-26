# Alpha 4 – Fachliche API-Verträge

Alle schreibenden Alpha-4-Hafenbefehle sind serverautoritativ, atomar und verwenden einen Idempotenzschlüssel. Sie prüfen die aktuelle Stadtreichweite, bevor sie Zustand verändern, und liefern anschließend den vollständigen serverbestätigten Hafen- und Spielzustand.

## Versionen, Idempotenz und Antworten

Schiffe, Flotten, Hafenmärkte und Werften besitzen `shipVersion`, `fleetVersion`, `shipMarketVersion` beziehungsweise `shipyardVersion`, jeweils mit Startwert 1. Jede erfolgreiche Änderung ihres Zustands erhöht die betroffene Version exakt um eins; abgeleitete Kapazität und Geschwindigkeit sind Teil derselben Flottenversion. Schreibbefehle senden die relevanten erwarteten Versionen. Veraltete Werte werden mit `SHIP_VERSION_CONFLICT`, `FLEET_VERSION_CONFLICT`, `SHIP_MARKET_VERSION_CONFLICT`, `SHIPYARD_VERSION_CONFLICT` oder `WORLD_STATE_CONFLICT` abgelehnt.

Jeder Schreibbefehl verlangt einen Idempotenzschlüssel. Derselbe Schlüssel mit derselben Nutzlast liefert das gespeicherte Ergebnis ohne erneute Buchung; bei abweichendem Befehl oder Nutzlast antwortet der Server `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_COMMAND`. Fehlende Schlüssel ergeben `IDEMPOTENCY_KEY_REQUIRED`.

Erfolgreiche lokale Aktionen liefern `HarborManagementState`: Spielergold, aktive Flotten-ID und lokale aktive Flotte, alle lokalen eigenen inaktiven Flotten und unzugeordneten Schiffe, neutrales Angebot, `shipMarketVersion`, lokale Werft samt Aufträgen und Warteschlange, Kontorbestand sowie alle betroffenen Versionen. Eine globale Umbenennung liefert das aktualisierte Objekt mit neuer Version.

## Verbindliche Routen

| Route | Zweck |
|---|---|
| `GET /api/player/fleets` | eigene Flottenübersicht, standortunabhängig lesbar |
| `GET /api/cities/:cityId/harbor` | lokale Flotten, Schiffe, Angebot, Werft und Aufträge |
| `GET /api/ships/:shipId` | eigenes oder neutral angebotenes Schiff lesen |
| `GET /api/cities/:cityId/ship-build-orders` | eigene Aufträge und sichtbare Warteschlange lesen |
| `POST /api/cities/:cityId/ships/:shipId/buy` | neutrales Schiff kaufen |
| `POST /api/cities/:cityId/ships/:shipId/sell` | lokales unzugeordnetes eigenes Schiff verkaufen |
| `PATCH /api/ships/:shipId/name` | eigenes Schiff umbenennen |
| `POST /api/cities/:cityId/ship-build-orders` | Bauauftrag anlegen |
| `POST /api/cities/:cityId/fleets` | inaktive Flotte mit erstem Schiff anlegen |
| `PATCH /api/fleets/:fleetId/name` | eigene Flotte umbenennen |
| `POST /api/cities/:cityId/fleets/:fleetId/ships` | Hafenschiff zuweisen |
| `DELETE /api/cities/:cityId/fleets/:fleetId/ships/:shipId` | Schiff im Hafen ablegen |
| `DELETE /api/cities/:cityId/fleets/:fleetId` | leere inaktive Flotte auflösen |
| `POST /api/cities/:cityId/fleets/:fleetId/activate` | lokale Flotte aktivieren |
| `POST /api/cities/:cityId/inventory/transfer` | lokale Inventare übertragen |

Hafenabrufe und lokale Befehle prüfen Reichweite; Fernverwaltung ist ausgeschlossen. Der Server leitet den handelnden Spieler aus dem Alpha-Testkontext ab, akzeptiert nie eine Client-Eigentümer-ID und gibt keine privaten Fremddetails aus.

## Hafenübersicht

Die Hafenübersicht liefert die Stadt-ID, `shipMarketVersion`, alle dort angebotenen konkreten Schiffe mit `shipId`, Typ, Name und Kaufpreis sowie die lokal verfügbaren eigenen unzugeordneten Schiffe. Ein Angebot enthält kein abstraktes Kontingent.

## Kauf und Verkauf

Der Kaufbefehl enthält mindestens `shipId`, `shipMarketVersion` und `idempotencyKey`. Er überträgt ein vorhandenes Systemschiff nur dann an den Spieler, wenn Marktversion, Eigentum, Standort, Preis, Gold und Reichweite noch gültig sind.

Der Verkaufsbefehl enthält mindestens `shipId` und `idempotencyKey`. Er überträgt ausschließlich ein eigenes, unzugeordnetes Schiff im aktuellen Hafen an den Systemmakler und schützt das letzte Spielerschiff.

`SHIP_MARKET_VERSION_CONFLICT` signalisiert eine veraltete Kaufansicht. `IDEMPOTENCY_KEY_REQUIRED` signalisiert einen fehlenden Schlüssel. Die übrigen Fehlercodes und ihre fachlichen Bedingungen stehen in [`ports-and-ship-market.md`](ports-and-ship-market.md).

## Schiffsbauauftrag

Der Schiffsbau-Befehl enthält mindestens `shipTypeId`, einen optionalen `requestedShipName` und `idempotencyKey`. Er prüft Reichweite, lokale Werft, eigenes Kontor, Typ, Name, vollständiges Gold und Material. Bei Erfolg zieht der Server alles atomar ab und liefert den angelegten `shipBuildOrder`; er erzeugt noch kein Schiff.

Fehlercodes sind `CITY_NOT_REACHABLE`, `SHIPYARD_NOT_AVAILABLE`, `KONTOR_REQUIRED`, `UNKNOWN_SHIP_TYPE`, `INSUFFICIENT_GOLD`, `INSUFFICIENT_SHIPBUILDING_MATERIALS`, `INVALID_SHIP_NAME`, `IDEMPOTENCY_KEY_REQUIRED`, `SHIP_BUILD_ORDER_NOT_FOUND` und `SHIP_BUILD_ORDER_STATE_CONFLICT`. Die Warteschlangen- und Ticksemantik steht in [`shipbuilding.md`](shipbuilding.md).

## Flottenverwaltung

Die Befehle zum Anlegen, Umbenennen, Zuweisen, Entfernen, Auflösen und Aktivieren einer Flotte enthalten jeweils die betroffenen stabilen IDs und bei jeder Zustandsänderung einen Idempotenzschlüssel. Sie prüfen lokale Hafenreichweite und Eigentum serverseitig und liefern die aktualisierten Flotten, Schiffe sowie abgeleitete Kapazität, Geschwindigkeit und Ladung zurück.

`FLEET_NOT_FOUND`, `FLEET_NOT_OWNED`, `INVALID_FLEET_NAME`, `SHIP_ALREADY_ASSIGNED`, `SHIP_NOT_IN_FLEET`, `FLEET_MUST_KEEP_ONE_SHIP`, `FLEET_CAPACITY_BELOW_CARGO`, `FLEET_NOT_IN_PORT`, `ACTIVE_FLEET_CANNOT_BE_DISBANDED` und `FLEET_CARGO_NOT_EMPTY` beschreiben die spezifischen Ablehnungen. Die vollständige Semantik steht in [`fleet-management.md`](fleet-management.md).

## Lokaler Inventartransfer

Ein Transfer verwendet explizite Referenzen `{ type: "fleet", fleetId }` oder `{ type: "kontor", cityId }`, `goodId`, positive Hundertstel-Tonnen und `idempotencyKey`. Der Server löst Eigentum, Ort, Bestand und Kapazität selbst auf. Er prüft Ware und Menge, Reichweite, Existenz und Eigentum, gemeinsame Stadt, verschiedene Quelle/Ziel, Quellbestand und Zielkapazität in dieser Reihenfolge. Erfolg bucht atomar und liefert alle lokalen eigenen Flotten, Kontor, aktive Flotte und aktualisierte Inventarversionen; bei Fehler ändert sich nichts.

Fehlercodes sind `CITY_NOT_REACHABLE`, `INVENTORY_NOT_FOUND`, `INVENTORY_NOT_OWNED`, `INVENTORY_NOT_IN_CITY`, `TRANSFER_SOURCE_EQUALS_TARGET`, `INVALID_GOOD`, `INVALID_QUANTITY`, `INSUFFICIENT_SOURCE_STOCK`, `INSUFFICIENT_FLEET_CAPACITY`, `KONTOR_REQUIRED` und `IDEMPOTENCY_KEY_REQUIRED`.
