# Alpha 4 – Verbindlicher Umfang

Alpha 4 ersetzt die abstrakte 60-Tonnen-Flotte aus Alpha 1 bis Alpha 3 durch dauerhaft existierende Schiffsentitäten. Ein Schiff wird nur durch Weltinitialisierung oder durch den erfolgreichen Abschluss eines Bauauftrags erzeugt. Kauf, Verkauf, Umbenennung, Hafenwechsel und Flottenzuweisung verändern ausschließlich den Zustand derselben Entität.

Der Kernablauf lautet:

`vorhandenes Schiff kaufen oder Bauauftrag erteilen → Schiff im Hafen verwalten → Flotte anlegen → Schiffe zuweisen → aktive Flotte wählen → gemeinsame Kapazität für Handel und Kontortransfers nutzen`

Alpha 4 bleibt serverautoritativ, deterministisch und In-Memory-basiert. Der manuelle Debug-Stundentick aus Alpha 3 treibt später den Schiffsbau an. Statische Schiffseigenschaften stehen ausschließlich in `packages/config/game-config.json`; technische IDs und API-Werte sind Englisch, Anzeigenamen kommen aus den Sprachdateien.

## Einzelkonzepte

- [`ship-entities.md`](ship-entities.md) – dauerhafte Identität, Eigentum, Standort und Namen
- [`ship-catalog.md`](ship-catalog.md) – Schiffstypen, Preise, Geschwindigkeit und Kapazität
- [`ports-and-ship-market.md`](ports-and-ship-market.md) – Hafenbindung, neutraler Makler und Eigentumsübertragung
- [`shipbuilding.md`](shipbuilding.md) – Werften, Kosten, FIFO-Bauaufträge und Fertigstellung
- [`fleet-management.md`](fleet-management.md) – Flotten, Schiffszuweisung, Aktivwechsel und Auflösung
- [`fleet-cargo-and-transfers.md`](fleet-cargo-and-transfers.md) – Flottenladung, Kapazität und lokale Transfers
- [`user-interface.md`](user-interface.md) – mobile und Desktop-Hafenverwaltung
- [`migration.md`](migration.md) – Migration der abstrakten Alpha-3-Startflotte
- [`balancing.md`](balancing.md) – Referenzkosten für Schiffsbau und Maklerpreise
- [`tick.md`](tick.md) – Werftphase im atomaren Stundentick
- [`api-contracts.md`](api-contracts.md) – fachliche Befehle und Fehlercodes
- [`test-world.md`](test-world.md) – feste Alpha-4-Startschiffe und Hafenmarktstände

Die folgenden Konzepte ergänzen diesen Scope in der Reihenfolge des Tracking-Issues #81: Häfen und Markt, Werften, Flottenmanagement, Ladung und lokale Transfers, Befehle und Tickintegration, Oberfläche sowie Testwelt und Abnahme.

## Alpha-4-Grundsätze

- Jedes Schiff besitzt eine weltweit eindeutige, unveränderliche ID und Herkunft.
- Ein Kauf oder Verkauf erzeugt und löscht nie ein Schiff.
- Ein Schiff ist entweder einer einzigen Flotte zugeordnet oder unzugeordnet in genau einem Hafen.
- Die bestehende Alpha-3-Startflotte wird zu einer Flotte mit einer konkreten Pinasse migriert.
- Flottenkapazität ist die Summe ihrer Schiffe; ihre virtuelle Geschwindigkeit ist die Geschwindigkeit des langsamsten Schiffs.
- Die virtuelle Geschwindigkeit wird angezeigt, bewegt die aktive Flotte in Alpha 4 aber nicht. Diese folgt weiterhin der Debug- beziehungsweise späteren GPS-Position.

## Nicht Bestandteil

Nicht Bestandteil sind KI-Akteure, automatische Handelsrouten und virtuelle Fahrten, PostgreSQL-Persistenz, Echtzeitticks, Spieler-zu-Spieler-Schiffshandel, Marktorders, Reparaturen, Zustand, Module, Besatzung, Bewaffnung, Kampf, Piraterie und Schiffsverlust.
