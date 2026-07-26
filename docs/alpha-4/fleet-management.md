# Alpha 4 – Flottenmanagement

## Modell und abgeleitete Werte

Eine Flotte enthält `fleetId`, `ownerId`, `customName`, `status` (`active` oder `in_port`), eine nichtleere Menge `shipIds`, bei `in_port` `portCityId`, bei `active` die normalisierte serverseitige `position`, `cargoByGood` in Hundertstel-Tonnen sowie `createdAtTick`. Jedes Schiff gehört höchstens einer Flotte und hat denselben Eigentümer wie sie. Jeder Spieler besitzt genau eine aktive Flotte. Diese darf nie leer werden oder aufgelöst werden; jede inaktive Flotte liegt in genau einem Hafen.

`fleetCapacity = sum(shipType.capacity)`; `usedCargo = sum(cargoByGood)`; `freeCargo = fleetCapacity - usedCargo`. Die Ladung darf die Kapazität nie übersteigen. `fleetSpeed = min(shipType.virtualSpeed)`. Eine Pinasse hat damit 60,00 t und 12 km pro Spielstunde; Pinasse plus Flöte haben 310,00 t und 8 km pro Spielstunde. Geschwindigkeit wird nur angezeigt, die aktive Flotte folgt weiterhin der Spielerposition.

Ein Flottenname enthält nach Trim 1 bis 40 Unicode-Zeichen ohne Zeilenumbrüche oder Steuerzeichen und muss nicht eindeutig sein. Fehlt er bei der Neuanlage, setzt der Server `Fleet <kurze Flotten-ID>`. Eigene Flotten sind jederzeit umbenennbar. Fehlercodes sind `FLEET_NOT_FOUND`, `FLEET_NOT_OWNED` und `INVALID_FLEET_NAME`.

## Lokale Änderungen

Eine neue Flotte entsteht atomar mit ihrem ersten eigenen, unzugeordneten Schiff im aktuellen Hafen der aktiven Flotte. Sie erhält `in_port`, den Hafen, leere Ladung und mindestens ein Schiff; ein leerer Zwischenzustand ist ausgeschlossen.

Ein eigenes unzugeordnetes Schiff im gemeinsamen Hafen kann einer eigenen lokalen inaktiven Flotte oder der dort liegenden aktiven Flotte zugewiesen werden. Beim Entfernen muss das Schiff zur lokalen eigenen Quellflotte gehören, danach mindestens ein Schiff verbleiben und die Restkapazität für die unveränderte Ladung genügen. Das entfernte Schiff bleibt unverändert als eigenes, unzugeordnetes Hafenschiff bestehen. Jede Zuweisung leitet Kapazität und Geschwindigkeit neu ab.

Spezifische Fehlercodes sind `SHIP_NOT_FOUND`, `SHIP_NOT_OWNED`, `SHIP_NOT_IN_PORT`, `SHIP_ALREADY_ASSIGNED`, `SHIP_NOT_IN_FLEET`, `FLEET_MUST_KEEP_ONE_SHIP`, `FLEET_CAPACITY_BELOW_CARGO`, `FLEET_NOT_IN_PORT` und `CITY_NOT_REACHABLE`.

Eine eigene `in_port`-Flotte darf nur bei exakt leerer Ladung aufgelöst werden. Ihre Schiffe werden unzugeordnet im selben Hafen abgelegt, die Flottenentität wird entfernt. `ACTIVE_FLEET_CANNOT_BE_DISBANDED` schützt die aktive Flotte, `FLEET_CARGO_NOT_EMPTY` die Ladung.

## Aktive Flotte

Der Wechsel verlangt, dass die aktuelle aktive Flotte den Stadtradius erreicht und die Ziel-Flotte dem Spieler gehört, `in_port` ist und im selben Hafen liegt. Beide besitzen mindestens ein Schiff; der Befehl enthält einen Idempotenzschlüssel. Atomar wird die alte Flotte `in_port`, erhält den Hafen und verliert ihre Position; die Ziel-Flotte wird `active`, verliert ihren Hafen und übernimmt exakt die aktuelle normalisierte Position. Ladung und Schiffszuordnung beider Flotten bleiben unverändert. Außerhalb oder zwischen Häfen ist ein Wechsel ausgeschlossen.

Im erreichten Hafen sieht und verwaltet der Spieler nur eigene lokale unzugeordnete Schiffe und inaktive Flotten. Fremde Flottenzusammensetzungen und Schiffsnamen sind nicht öffentlich. Automatische Bewegung, Handelsrouten, mehrere GPS-gesteuerte Flotten, einzelne Schiffsladungen, Kampf, Eskorte und Ausspionieren gehören nicht zu Alpha 4.
