# Alpha 1 – Verbindlicher Umfang

## Ziel

Alpha 1 beweist den vollständigen serverautoritativen Handelsablauf zwischen drei statischen Inselstädten. Der Nutzer bewegt eine vereinfachte Flotte per Debug-Klick, betritt nur erreichbare Städte, kauft Waren, reist zu einer anderen Stadt und verkauft sie dort gewinnbringend.

Alpha 1 soll bereits sauber strukturiert und später erweiterbar sein. Sie ist kein Wegwerfprototyp, verzichtet aber bewusst auf alle Systeme, die zum Testen des Handels noch nicht nötig sind.

## Verbindlicher Tech Stack

- TypeScript-Monorepo mit pnpm Workspaces
- `apps/client`: Vue 3, TypeScript, Vite, MapLibre GL JS, Mobile-First-CSS
- `apps/server`: Node.js LTS, TypeScript, Fastify, REST API
- `packages/shared`: gemeinsame API-Verträge und DTOs
- `tests/e2e`: Playwright
- Vitest für Unit-, Komponenten- und API-Integrationstests
- OpenAPI-Dokumentation der REST API
- In-Memory-Repositories; keine Datenbank

Details: [`../technical-architecture.md`](../technical-architecture.md).

## Spielzustand

Alpha 1 verwendet:

- genau einen Testspieler,
- 30.000 Goldmünzen Startkapital,
- eine aktive Flotte mit 60 Tonnen Kapazität,
- leeren Startladeraum,
- genau drei konfigurierte Städte,
- alle 22 Waren aus [`../goods-and-production-chains.md`](../goods-and-production-chains.md),
- statische Stadtwerte und Marktstartbestände,
- dynamische Preise ausschließlich durch Spielerhandel,
- vollständigen Reset bei jedem Serverneustart.

## Enthaltene Funktionen

### Server

- deterministische Initialisierung des Testzustands
- lesender Spieler-, Flotten-, Waren-, Stadt- und Marktzustand
- Setzen einer Debug-Position
- serverseitige Distanz- und Radiusprüfung
- erneute Radiusprüfung bei jeder Stadt- und Handelsaktion
- Marktwert, Spread und mengenabhängige Preisberechnung
- Preisvorschau mit Marktversion
- atomarer Kauf und Verkauf
- Preis- und Handelsverlauf im Arbeitsspeicher
- verständliche fachliche Fehlercodes

### Client

- MapLibre als zentrale Kartenansicht
- ozeanartige Karte mit drei einfachen Inseln
- sichtbare Flottenposition
- Debug-Modus per Kartenklick
- serverbestätigte Anzeige erreichbarer Städte
- dezent pulsierender Button `Stadt betreten`
- Fullscreen-Stadtansicht mit Übersicht, Produktion und Markt
- kategorisierte Marktübersicht aller 22 Waren
- Warendetails mit Preis- und Handelsverlauf
- Kauf und Verkauf mit Slider, Schrittbuttons und Serverangebot
- Topbar mit Gold sowie Spieler- und Flottenübersicht
- Mobile-First und Desktop-bedienbar

### Tests

- Unit-Tests für Preis, Distanz, Laderaum und Handelsregeln
- API-Integrationstests für Startzustand, Position und Handel
- Vue-Komponententests für zentrale Zustände
- Playwright-Abnahme auf mobilem und Desktop-Viewport

## Ausdrücklich ausgeschlossen

- PostgreSQL und sonstige Persistenz
- Registrierung, Login und mehrere Spieler
- echtes GPS, Browser-Geolocation und Anti-Cheat
- OpenStreetMap-Import und reale Ortsgenerierung
- dynamische Inseln und sichtbare Gebäude
- Kontore, Gebäude, Bauplätze und Produktion
- Bevölkerungssimulation, Bedürfnisse, Löhne und Wohlstandsänderung
- individuelle Schiffe, Häfen und Flottenverwaltung
- automatische Handelsrouten
- Kartenereignisse wie Fässer oder Schiffbrüchige
- Stadtgründung
- Piraterie, Kapern und Kämpfe
- Buy-/Sell-Orders und direkter Spielerhandel

## Entscheidungsfreiheit für Codex

Codex soll Alpha 1 vollständig anhand der Issues und dieser Dokumentation umsetzen.

Reihenfolge der Autorität:

1. explizite Regeln in `docs/`,
2. Akzeptanzkriterien des aktuellen Issues,
3. vorhandene Architektur und etablierte Projektmuster,
4. einfachste sinnvolle eigene Entscheidung.

Fehlt ein rein technisches Detail, soll Codex nicht unnötig stoppen. Es wählt eine Lösung, die:

- serverautoritativ,
- deterministisch,
- typisiert,
- gut testbar,
- möglichst einfach,
- später austauschbar,
- Mobile First ist.

Die Entscheidung wird im PR beschrieben und bei dauerhafter Bedeutung dokumentiert. Codex darf keine ausdrücklich ausgeschlossenen Funktionen vorziehen und keine fachliche Entscheidung aus `docs/` überschreiben. Nur echte Widersprüche oder Änderungen am Produktumfang erfordern eine Rückfrage.

## Definition of Done

Alpha 1 ist abgeschlossen, wenn alle zugeordneten Issues gemergt sind, die Dokumentation dem tatsächlichen Stand entspricht und der Playwright-Abnahmetest den vollständigen Handel von Stadt A nach Stadt B auf Mobil- und Desktop-Viewport erfolgreich ausführt.