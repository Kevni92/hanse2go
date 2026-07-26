# Hanse2Go – Dokumentation

`docs/` ist die verbindliche fachliche und technische Single Source of Truth. Issues beschreiben die Arbeit; dauerhafte Regeln und Entscheidungen stehen hier.

## Lesereihenfolge für Agenten

1. [`../AGENTS.md`](../AGENTS.md) – verbindlicher Issue-, Branch-, PR- und CI-Workflow
2. [`game-vision.md`](game-vision.md) – Spielidee, Core Loop und langfristige Grenzen
3. [`alpha-1/scope.md`](alpha-1/scope.md) – verbindlicher Umfang der ersten Alpha
4. Die zum Issue gehörenden Fachdateien
5. [`technical-architecture.md`](technical-architecture.md) – Tech Stack, Serverautorität und technische Leitlinien
6. [`alpha-1/acceptance.md`](alpha-1/acceptance.md) – abschließende Abnahme

## Fachliche Konzepte

- [`game-vision.md`](game-vision.md) – gemeinsame GPS-Handelswelt und Core Loop
- [`player-progression.md`](player-progression.md) – Einstieg, Vermögen, Rang, Beliebtheit und Kontore
- [`fleets-and-ships.md`](fleets-and-ships.md) – aktive Flotte, Schiffe, Häfen und spätere Handelsrouten
- [`world-map-gps-and-events.md`](world-map-gps-and-events.md) – Karte, Inseln, GPS, Debug-Position und Kartenereignisse
- [`cities-and-growth.md`](cities-and-growth.md) – neutrale Städte, Bauplätze, Wachstum und Stadtgründung
- [`goods-and-production-chains.md`](goods-and-production-chains.md) – alle 22 Alpha-Waren und ihre Ketten
- [`production-buildings-and-workers.md`](production-buildings-and-workers.md) – Produktionszyklen, Kontore, Gebäudezustand und Arbeiter
- [`population-prosperity-and-housing.md`](population-prosperity-and-housing.md) – Wohlstand, Bedürfnisse, Arbeitslosigkeit und Wohnraum
- [`market-and-pricing.md`](market-and-pricing.md) – gemeinsamer Stadtmarkt, Bestände und Preisformel

## Alpha 1

- [`alpha-1/scope.md`](alpha-1/scope.md) – Ziel, Umfang und Nicht-Ziele
- [`alpha-1/test-world.md`](alpha-1/test-world.md) – drei Städte, Startwerte und reproduzierbarer Handelsweg
- [`alpha-1/user-interface.md`](alpha-1/user-interface.md) – Karte, Stadtansicht, Markt und HUD
- [`alpha-1/acceptance.md`](alpha-1/acceptance.md) – Playwright-Abnahme
- [`technical-architecture.md`](technical-architecture.md) – technische Umsetzung

## Alpha 2

- [`alpha-2/scope.md`](alpha-2/scope.md) – verbindlicher Umfang und Abgrenzung
- [`alpha-2/reputation-and-concessions.md`](alpha-2/reputation-and-concessions.md) – örtlicher Ruf und Baukonzession
- [`alpha-2/buildings-and-construction.md`](alpha-2/buildings-and-construction.md) – Kontor, Gebäudeklassen, Kosten und Bauablauf
- [`alpha-2/building-catalog.md`](alpha-2/building-catalog.md) – alle baubaren Produktionsgebäude
- [`alpha-2/production-recipes.md`](alpha-2/production-recipes.md) – Eingänge und Ausgänge je Stundentick
- [`alpha-2/kontor-and-inventory.md`](alpha-2/kontor-and-inventory.md) – privates Kontorlager und manuelle Transfers
- [`alpha-2/population-consumption.md`](alpha-2/population-consumption.md) – fester Bevölkerungsverbrauch
- [`alpha-2/production-tick.md`](alpha-2/production-tick.md) – manueller Stundentick und Tickbericht
- [`alpha-2/user-interface.md`](alpha-2/user-interface.md) – Stadt-Tab `Gebäude`
- [`alpha-2/test-world.md`](alpha-2/test-world.md) – Startwerte und Testbetrieb
- [`alpha-2/acceptance.md`](alpha-2/acceptance.md) – Abnahme mit realem Client und Server

## Alpha 3

- [`alpha-3/scope.md`](alpha-3/scope.md) – verbindlicher Umfang für Arbeitskräfte, Löhne, Wohnraum, Wohlstand und Wachstum
- [`alpha-3/building-workforce-classes.md`](alpha-3/building-workforce-classes.md) – Beschäftigungsklassen aller Produktionsgebäude
- [`alpha-3/workforce-and-wages.md`](alpha-3/workforce-and-wages.md) – Arbeitsnachfrage, Lohnbudget und atomare Lohnzahlung
- [`alpha-3/workforce-allocation.md`](alpha-3/workforce-allocation.md) – faire Verteilung, Prioritäten und Arbeitslosigkeit
- [`alpha-3/production-and-fractions.md`](alpha-3/production-and-fractions.md) – Teilproduktion, Hundertstel-Tonnen und atomare Buchung
- [`alpha-3/production-recipes.md`](alpha-3/production-recipes.md) – verbindliche Alpha-3-Rezepte
- [`alpha-3/balancing.md`](alpha-3/balancing.md) – Referenzmargen der Produktionsrezepte
- [`alpha-3/housing.md`](alpha-3/housing.md) – Grundwohnraum, Wohnhäuser und gemeinsame Kapazität
- [`alpha-3/building-catalog.md`](alpha-3/building-catalog.md) – Alpha-3-Ergänzungen zum Gebäudekatalog
- [`alpha-3/consumption-and-wealth.md`](alpha-3/consumption-and-wealth.md) – Verbrauch, Kaufkraft und Wohlstand

## Umgang mit Lücken

Explizite Entscheidungen in `docs/` dürfen nicht verändert oder stillschweigend ersetzt werden. Für Alpha 1 gilt zusätzlich: Fehlt nur ein technisches Detail, das die fachliche Absicht nicht verändert, wählt der Agent die einfachste deterministische, serverautoritative und testbare Lösung. Die Entscheidung wird im Pull Request begründet und bei dauerhafter Bedeutung in `docs/` ergänzt. Nur echte fachliche Widersprüche oder Änderungen am Produktumfang erfordern eine Rückfrage.
