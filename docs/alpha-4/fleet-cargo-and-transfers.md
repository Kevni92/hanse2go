# Alpha 4 – Flottenladung und lokale Transfers

Jede Flotte besitzt `cargoByGood` in ganzzahligen Hundertstel-Tonnen. Waren gehören zur Flotte, nie zu einzelnen Schiffen; unzugeordnete Hafenschiffe haben keine Ladung. Beim Aktivwechsel bleibt jede Ladung in ihrer bisherigen Flotte; eine Flotte darf nur leer aufgelöst werden.

Für Flotte `f` gilt `capacityUnits(f) = sum(shipType.capacityTons × 100)`, `usedUnits(f) = sum(cargoByGoodUnits)` und `freeUnits(f) = capacityUnits - usedUnits`. Immer gilt `capacityUnits > 0` und `0 ≤ usedUnits ≤ capacityUnits`. Jede schreibende Aktion prüft dies auf dem aktuellen serverautoritativen Zustand. Das Hinzufügen eines Schiffs erhöht nur die Kapazität; das Entfernen ist nur bei `remainingCapacity ≥ usedCargo` zulässig.

Marktkäufe laden ausschließlich die aktive Flotte, Marktverkäufe entnehmen ausschließlich ihr. Preisvorschau, Marktversion, Reichweite und Idempotenz bleiben unverändert. Ihre freie Kapazität wird jetzt aus konkreten Schiffen abgeleitet.

Bei Anwesenheit der aktiven Flotte in einer Stadt dürfen eigene lokale Inventare atomar übertragen: aktive Flotte ↔ Kontor, inaktive lokale Flotte ↔ Kontor, aktive ↔ inaktive lokale Flotte sowie zwischen zwei inaktiven lokalen Flotten. Die aktive Flotte muss nicht Quelle oder Ziel sein. Transfers zwischen Städten, Fernzugriff, automatische Umladung beim Aktivwechsel, direkter Handel inaktiver Flotten und Einzelschiffsladung sind ausgeschlossen.

Quell- und Zielinventar müssen dem Spieler gehören und in derselben erreichten Stadt verfügbar sein. Der Client liefert nur Inventarreferenzen, Ware, Menge und Idempotenzschlüssel; der Server ermittelt keinen vom Client behaupteten Bestand, Eigentümer oder Kapazität. Eine erfolgreiche Antwort enthält serverbestätigte lokale Flotten, Schiffe, Ladung, Kapazität, Geschwindigkeit, Kontorbestand, aktive Flotten-ID und Inventarversionen.
