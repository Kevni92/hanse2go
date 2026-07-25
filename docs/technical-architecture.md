# Technische Architektur

## Zweck

Diese Datei beschreibt ausschließlich die technische Leitlinie. Fachliche Regeln stehen in den verlinkten Einzelkonzepten unter [`README.md`](README.md). Der verbindliche Arbeitsablauf steht in [`../AGENTS.md`](../AGENTS.md).

## Repository-Struktur

Hanse2Go wird als TypeScript-Monorepo mit pnpm Workspaces aufgebaut.

```text
apps/
  client/       Vue-Anwendung
  server/       REST-Server und Spiellogik
packages/
  shared/       gemeinsame API-Verträge und DTOs
docs/           verbindliche Dokumentation
tests/
  e2e/          Playwright-Abnahmetests
```

## Client

- Vue 3
- TypeScript
- Vite
- MapLibre GL JS
- komponentenbezogenes CSS ohne verpflichtendes UI-Framework
- Mobile First mit Desktop-Unterstützung
- Vitest für Komponenten- und Clientlogiktests

Der Client stellt serverseitig gelieferte Zustände dar und sendet Spielerabsichten. Er entscheidet nicht verbindlich über Position, Reichweite, Preise, Geld, Bestände oder Handel.
Nach einem erfolgreichen Handel lädt der Client den vollständigen Spielzustand
neu und aktualisiert damit Markt und HUD gemeinsam. Bei einer abgelehnten
Transaktion bleibt der zuletzt serverbestätigte HUD-Zustand sichtbar.

## Server

- Node.js LTS
- TypeScript
- Fastify
- REST API
- JSON-Schema-Validierung
- OpenAPI-Dokumentation
- Vitest für Unit- und API-Integrationstests
- In-Memory-Repositories in Alpha 1
- PostgreSQL in einer späteren Stufe

## Serverautorität

Der Server ist die einzige verbindliche Autorität. Er validiert mindestens:

- Position und Zeitstempel der aktiven Flotte,
- Entfernung und Interaktionsradius,
- Stadtzugriff,
- Markt- und Flottenbestände,
- Geld und Laderaum,
- Preisangebote,
- vollständige Kauf- und Verkaufstransaktionen.

Der Client darf Werte zur flüssigen Bedienung voranzeigen. Der endgültige Zustand kommt immer vom Server.

## Austauschbare Positionsquelle

Die Spiellogik erhält eine normalisierte Position und kennt deren Eingabegerät nicht.

- Alpha 1: Debug-Position per Kartenklick
- später: GPS-Position
- spätere Alpha: serverseitige Plausibilitäts- und Geschwindigkeitsprüfung

Kartenklick und Browser-Geolocation dürfen nicht direkt mit Stadt- oder Handelslogik gekoppelt werden.

## REST-Kommunikation

Alle schreibenden Aktionen sind Befehle an den Server. Der Server validiert sie, verändert den Zustand atomar und liefert entweder den neuen Zustand oder einen eindeutigen fachlichen Fehlercode.

Für Alpha 1 sind keine WebSockets erforderlich, da keine laufende Simulation stattfindet. Die konkrete URL-Struktur darf Codex konsistent und REST-orientiert festlegen. API-Verträge werden in `packages/shared` verwendet und über OpenAPI beschrieben.

Für die Alpha-Debugposition akzeptiert `PUT /api/fleet/position` ausschließlich
Längen- und Breitengrad. Der Server validiert die WGS84-Grenzen und setzt den
Zeitstempel selbst. `GET /api/cities/reachable` liefert die serverseitig
berechneten Distanzen; der Abruf einer einzelnen Stadt prüft den Radius erneut.

## Zustandsmodell Alpha 1

Alpha 1 verwendet einen vollständig deterministischen In-Memory-Zustand. Ein Serverneustart erzeugt wieder die Werte aus [`alpha-1/test-world.md`](alpha-1/test-world.md).

Repository-Schnittstellen kapseln die Speicherung, damit PostgreSQL später ohne Neuschreiben der fachlichen Anwendungsdienste ergänzt werden kann.

## Preise und Handel

Verbindliche Regeln stehen in [`market-and-pricing.md`](market-and-pricing.md). Preisvorschau und Abschluss müssen dieselbe serverseitige Regel verwenden. Transaktionen sind atomar und gegen doppelte beziehungsweise veraltete Anfragen abzusichern.

Die Alpha-API stellt Preisangebote unter
`POST /api/cities/:cityId/market/quote` bereit und schließt sie über
`POST /api/cities/:cityId/market/trade` mit Marktversion und Idempotenzschlüssel
ab. Nur der Server verändert dadurch Gold, Stadtbestand und Flottenladung.
Der Client lädt die Preis- und Handelsereignisse einer Ware über
`GET /api/cities/:cityId/market/:goodId/history`; auch dieser Abruf prüft den
Stadtradius serverseitig. Preisindikatoren und Mengenangebote im Client werden
aus Preisangeboten des Servers abgeleitet und sind niemals eine lokale
Preisberechnung.

Für die Playwright-Abnahme startet der Server mit der ausschließlich dafür
gesetzten Umgebungsvariable `HANSE2GO_E2E_TEST=1`. Nur dann steht
`POST /test/reset` bereit; der Endpunkt stellt den deterministischen
Startzustand einschließlich Marktversionen und Verlauf wieder her und ist im
normalen Serverbetrieb nicht verfügbar.

## Fehlerformat

Fehlerantworten besitzen mindestens:

- stabilen fachlichen Fehlercode,
- verständliche Meldung,
- optional strukturierte Details,
- passende HTTP-Semantik.

Der Client übersetzt beziehungsweise präsentiert Fehler auf Deutsch. Technische Interna oder Stacktraces werden nicht an den Client ausgegeben.

## Tests

- Vitest Unit-Tests für Fachlogik
- Fastify-Integrationstests für REST-Endpunkte
- Vue-Komponententests
- Playwright gegen echten Client und echten Server

Die verbindliche Abnahme steht in [`alpha-1/acceptance.md`](alpha-1/acceptance.md).

## Arbeitsablauf

Für jedes Issue wird ein neuer Branch vom aktuellen `main` erstellt. Es gibt genau einen Pull Request pro Issue gegen `main`. Alle GitHub-CI-Prüfungen müssen erfolgreich sein. Danach merged der Agent den PR und löscht den gemergten Branch. Details stehen in [`../AGENTS.md`](../AGENTS.md).

## Entscheidungsregel für Alpha 1

Explizite fachliche Entscheidungen dürfen nicht verändert werden. Fehlt nur ein technisches Detail, wählt Codex die einfachste deterministische, serverautoritative, typisierte und testbare Lösung, dokumentiert sie im PR und ergänzt bei dauerhafter Bedeutung die Dokumentation. Nur echte fachliche Widersprüche oder Änderungen am Produktumfang erfordern eine Rückfrage.
