# Alpha 4 – Fachliche API-Verträge

Alle schreibenden Alpha-4-Hafenbefehle sind serverautoritativ, atomar und verwenden einen Idempotenzschlüssel. Sie prüfen die aktuelle Stadtreichweite, bevor sie Zustand verändern, und liefern anschließend den vollständigen serverbestätigten Hafen- und Spielzustand.

## Hafenübersicht

Die Hafenübersicht liefert die Stadt-ID, `shipMarketVersion`, alle dort angebotenen konkreten Schiffe mit `shipId`, Typ, Name und Kaufpreis sowie die lokal verfügbaren eigenen unzugeordneten Schiffe. Ein Angebot enthält kein abstraktes Kontingent.

## Kauf und Verkauf

Der Kaufbefehl enthält mindestens `shipId`, `shipMarketVersion` und `idempotencyKey`. Er überträgt ein vorhandenes Systemschiff nur dann an den Spieler, wenn Marktversion, Eigentum, Standort, Preis, Gold und Reichweite noch gültig sind.

Der Verkaufsbefehl enthält mindestens `shipId` und `idempotencyKey`. Er überträgt ausschließlich ein eigenes, unzugeordnetes Schiff im aktuellen Hafen an den Systemmakler und schützt das letzte Spielerschiff.

`SHIP_MARKET_VERSION_CONFLICT` signalisiert eine veraltete Kaufansicht. `IDEMPOTENCY_KEY_REQUIRED` signalisiert einen fehlenden Schlüssel. Die übrigen Fehlercodes und ihre fachlichen Bedingungen stehen in [`ports-and-ship-market.md`](ports-and-ship-market.md).

## Schiffsbauauftrag

Der Schiffsbau-Befehl enthält mindestens `shipTypeId`, einen optionalen `requestedShipName` und `idempotencyKey`. Er prüft Reichweite, lokale Werft, eigenes Kontor, Typ, Name, vollständiges Gold und Material. Bei Erfolg zieht der Server alles atomar ab und liefert den angelegten `shipBuildOrder`; er erzeugt noch kein Schiff.

Fehlercodes sind `CITY_NOT_REACHABLE`, `SHIPYARD_NOT_AVAILABLE`, `KONTOR_REQUIRED`, `UNKNOWN_SHIP_TYPE`, `INSUFFICIENT_GOLD`, `INSUFFICIENT_SHIPBUILDING_MATERIALS`, `INVALID_SHIP_NAME`, `IDEMPOTENCY_KEY_REQUIRED`, `SHIP_BUILD_ORDER_NOT_FOUND` und `SHIP_BUILD_ORDER_STATE_CONFLICT`. Die Warteschlangen- und Ticksemantik steht in [`shipbuilding.md`](shipbuilding.md).
