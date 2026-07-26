# Alpha 4 – Hafenoberfläche

Die Stadtansicht ergänzt nach `Markt` und `Gebäude` den Tab `Hafen` (`harbor-tab`). Außerhalb des Stadtradius zeigt er Stadtname, vorhandenen Hafen und den Hinweis `Fahre in den Stadtradius, um Schiffe und Flotten zu verwalten.`; private lokale Daten und schreibende Aktionen sind dann nicht sichtbar. Im erreichbaren Zustand folgen aktive Flotte, lokale Flotten, unzugeordnete Schiffe, Kaufangebot, Werft und lokale Transfers. Jede Änderung erscheint erst nach Serverbestätigung; bei Fehler bleibt der zuletzt bestätigte Zustand sichtbar.

Die globale Flottenübersicht im HUD zeigt lesend alle eigenen Flotten mit Name, Status, Schiffszahl, Kapazität/belegt/frei und Geschwindigkeit. Fernverwaltung ist auf Umbenennen beschränkt. Die aktive Flottenkarte zeigt Name, Schiffe, Kapazität, Ladung, freien Raum, Geschwindigkeit mit Hinweis `Für spätere automatische Fahrten`, Position/Hafen und Umbenennen. Das feste 60‑t-HUD entfällt.

Schiffskarten zeigen Name, lokalisierten Typ, kurze ID, Kapazität, Geschwindigkeit, Eigentum, Standort und Herkunft. Eigene Schiffe bieten zustandsabhängig Umbenennen, Zuweisen, Entfernen, Flotte bilden und zulässigen Verkauf; neutrale Karten zeigen Preis, `Kaufen` und den Hinweis, dass dieses konkrete vorhandene Schiff gekauft wird. Kauf- und Verkaufsdialoge zeigen Schiff, ID, Preis und den Erhalt der Identität. Version- oder Verfügbarkeitskonflikte laden das Angebot neu.

Lokale inaktive Flotten zeigen Schiffe, Kapazität, Ladung, Geschwindigkeit sowie Aktivieren, Umbenennen, Zuweisen, Entfernen, Umladen und bei leerer Ladung Auflösen. Entfernen unter Ladekapazität, letztes Schiff und Auflösen mit Ladung erklären den jeweiligen Grund. Das Bilden einer Flotte aus einem Hafenschiff bestätigt Name, Schiff, Kapazität und Geschwindigkeit. Vor Aktivwechsel bestätigt der Client, dass Ladung in der bisherigen Flotte bleibt und keine Waren umgeladen werden.

Die Werft zeigt aktiven Bauplatz, Auftrag mit Restticks und Fortschritt, Warteschlange und eigene Aufträge. Jede Typkarte enthält Kapazität, Geschwindigkeit, Bauzeit, Gebühr, Materialien, eigenen Kontorbestand/Fehlmenge und Vergleichspreis. Der Bestätigungsdialog zeigt optionalen Schiffsnamen, Kosten, Status und nicht stornierbaren Charakter. Nach Tickabschluss erscheint `Schiff <Name> wurde fertiggestellt und liegt im Hafen <Stadt>.`, das Schiff unter unzugeordneten Schiffen und die Ergebnis-ID am Auftrag. Der Tickbericht hat `Werften und Schiffsbau`.

Der Transferdialog erlaubt lokale Kontore und Flotten als Quelle/Ziel, Ware und Menge mit zwei Nachkommastellen und zeigt Bestand sowie Zielfreiraum. Gleiche oder nicht lokale Inventare sind nicht auswählbar.

## Responsivität und Barrierefreiheit

Mobil verwendet einspaltige Karten, Akkordeons, sticky Flotten-/Goldzusammenfassung, mindestens 44×44‑Pixel-Aktionen und Bottom-Sheets/Vollbilddialoge ohne horizontales Scrollen. Desktop nutzt einen breiten aktiven Bereich und zweispaltige lokale Flotten/Schiffe; Tabellen oder Drag-and-drop sind nur ergänzend. Alle Aktionen haben zugängliche Namen, Status nutzt `aria-live`, Fortschritt besitzt ARIA-Werte und Text, Dialoge verwalten Fokus, und alle Aktionen funktionieren per Tastatur.

## Test-IDs

`active-fleet-name`, `active-fleet-capacity`, `active-fleet-speed`, `fleet-card-<fleetId>`, `ship-card-<shipId>`, `rename-ship-<shipId>`, `rename-fleet-<fleetId>`, `buy-ship-<shipId>`, `sell-ship-<shipId>`, `create-fleet-with-<shipId>`, `assign-ship-<shipId>-to-<fleetId>`, `remove-ship-<shipId>-from-<fleetId>`, `activate-fleet-<fleetId>`, `disband-fleet-<fleetId>`, `shipyard-build-<shipTypeId>`, `build-order-<buildOrderId>`, `shipyard-active-order`, `harbor-transfer-submit` und `tick-report-shipyards` ergänzen zugängliche Selektoren.
