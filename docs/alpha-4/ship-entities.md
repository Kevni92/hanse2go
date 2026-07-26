# Alpha 4 – Schiffsentitäten

## Pflichtdaten und Standortinvariante

Jedes Schiff besitzt mindestens diese Felder:

| Feld | Bedeutung |
|---|---|
| `shipId` | weltweit eindeutige, unveränderliche ID |
| `shipTypeId` | Referenz auf einen konfigurierten Schiffstyp |
| `customName` | nichtleerer, vom Eigentümer änderbarer Eigenname |
| `ownerType` | `player` oder `system` |
| `ownerId` | ID des aktuellen Eigentümers |
| `locationType` | `fleet` oder `port` |
| `fleetId` | nur bei `locationType = fleet` gesetzt |
| `portCityId` | nur bei `locationType = port` gesetzt |
| `createdAtTick` | Entstehungstick; bei Weltinitialisierung `0` |
| `originType` | `world_seed` oder `shipyard_build` |
| `originCityId` | Hafen oder Werft der Entstehung |
| `buildOrderId` | nur bei `shipyard_build` gesetzt |

Die Standortfelder sind exklusiv: Ein Flottenschiff hat genau eine `fleetId` und keine `portCityId`; ein Hafenschiff hat genau eine `portCityId` und keine `fleetId`. Ein Schiff darf nie mehreren Flotten angehören oder ohne Hafen beziehungsweise Flotte existieren.

## Identität und Lebenszyklus

`shipId`, `originType`, `originCityId`, `createdAtTick` und `buildOrderId` sind nach der Entstehung unveränderlich. Eigentümer, Eigenname, Hafen und Flottenzuordnung dürfen sich ändern. Innerhalb einer laufenden Welt bleibt die Identität vollständig erhalten; ein Serverneustart setzt in Alpha 4 weiterhin auf den konfigurierten In-Memory-Startzustand zurück.

Neue Schiffsentitäten entstehen ausschließlich bei einer expliziten Welt- oder Testinitialisierung oder beim erfolgreichen Abschluss eines Schiffsbauauftrags. Kein anderer Fachbefehl darf die Schiffszahl erhöhen. Kauf und Verkauf sind Eigentumsübertragungen, keine Erzeugungs- oder Löschvorgänge. Beim Auflösen einer Flotte bleiben deren Schiffe als unzugeordnete Schiffe im Hafen bestehen.

## Namen und Umbenennung

Jedes Schiff hat immer einen Namen. Nach dem Trimmen enthält er 1 bis 40 Unicode-Zeichen und keine Zeilenumbrüche oder Steuerzeichen. Namen dürfen mehrfach vergeben werden; technische IDs und reservierte Wörter sind zulässig.

Ein Bauauftrag darf einen gültigen Namen enthalten. Fehlt er, setzt der Server deterministisch `Ship <kurze Schiff-ID>`. Kauf und Verkauf behalten den Namen. Der Eigentümer darf sein Schiff unabhängig davon umbenennen, ob seine aktive Flotte am selben Hafen liegt, sofern das Schiff ihm gehört und entweder unzugeordnet im Hafen liegt oder zu einer eigenen Flotte gehört. Umbenennen verändert weder Position noch Ladung noch Flottenzuordnung.

Fehlercodes für das Umbenennen sind `SHIP_NOT_FOUND`, `SHIP_NOT_OWNED`, `INVALID_SHIP_NAME` und `UNKNOWN_SHIP_TYPE`.

## Abgrenzung

Schiffszustand, Reparaturen, Module, Qualitätsstufen, Besatzung, Lohnkosten, Bewaffnung, Kampf, Kapern, zufällige Eigenschaften und Spieler-zu-Spieler-Eigentumsübertragungen gehören nicht zu Alpha 4. Diese späteren Erweiterungen ergänzen dieselbe stabile Schiffsentität statt sie auszutauschen.
