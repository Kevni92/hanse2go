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
  config/       zentrale Spielkonfiguration und Spieleigenschaften
  shared/       gemeinsame API-Verträge und DTOs
docs/           verbindliche Dokumentation
tests/
  e2e/          Playwright-Abnahmetests
```

## Client

- Vue 3
- TypeScript
- Vite
- MapLibre GL JS für die aktuelle Alpha-Testkarte; eine virtuelle Karibikkarte erhält einen späteren eigenen Slice
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

- Alpha 1 bis Alpha 5: Debug-Position per Kartenklick in der deterministischen Testwelt
- später: serverseitig verwaltete virtuelle Flottenpositionen und Reisen auf der Karibikkarte
- mögliche spätere Positions- oder Reisevalidierung bleibt von Markt und Wirtschaft getrennt

Kartenklick, Browser-Geolocation und spätere virtuelle Reisen dürfen nicht direkt mit Stadt- oder Handelslogik gekoppelt werden.

## REST-Kommunikation

Alle schreibenden Aktionen sind Befehle an den Server. Der Server validiert sie, verändert den Zustand atomar und liefert entweder den neuen Zustand oder einen eindeutigen fachlichen Fehlercode.

Für Alpha 1 sind keine WebSockets erforderlich, da keine laufende Simulation stattfindet. Die konkrete URL-Struktur darf Codex konsistent und REST-orientiert festlegen. API-Verträge werden in `packages/shared` verwendet und über OpenAPI beschrieben.

Für die Alpha-Debugposition akzeptiert `PUT /api/fleet/position` ausschließlich
Längen- und Breitengrad. Der Server validiert die WGS84-Grenzen und setzt den
Zeitstempel selbst. `GET /api/cities/reachable` liefert die serverseitig
berechneten Distanzen; der Abruf einer einzelnen Stadt prüft den Radius erneut.

## Zentrale Spielkonfiguration

Alle statischen Spieleigenschaften stehen ausschließlich in `packages/config/game-config.json`. Dazu gehören Startwerte für Spieler, Flotte und Welt einschließlich der Start-Baukonzessionen des Spielers, der Warenkatalog, die Städte mit Startbeständen, die Preisformelgrenzen und der Spread, die Rufregeln mit ihren Statusschwellen, der feste Bevölkerungsverbrauch sowie Grundstückspreis, Baukonzession, Gebäudeklassen, Kontorkosten und alle Produktionsrezepte.

Rechnende Module kennen keinen dieser Werte. Sie erhalten die für sie zuständige Teilkonfiguration von außen über Konstruktor oder Parameter; `buildApp()` lädt die Konfiguration einmal und verdrahtet die Dienste. Eine Änderung einer Spieleigenschaft ist damit eine Änderung an genau einer Datei.

`loadGameConfig()` liefert je Aufruf eine eigene Kopie und validiert sie strukturell: eindeutige Waren-, Stadt- und Gebäudetyp-IDs, positive Basispreise und Zielbestände, ein Startbestand je Stadt und Ware, aufsteigende Rufstatus sowie ausschließlich bekannte Warenreferenzen in Verbrauch, Baumaterialien und Rezepten. Eine ungültige Konfiguration verhindert den Serverstart.

Rein technische Konstanten bleiben im Code, weil sie keine Spieleigenschaften sind: der Erdradius der Entfernungsberechnung und das Rundungs-Epsilon der Radiusprüfung.

## Bezeichner und Sprachdateien

Daten-Definitionen, Domänentypen und API verwenden ausschließlich englische Bezeichner. Das gilt für Waren-, Stadt- und Gebäudetyp-IDs ebenso wie für die Aufzählungen `GoodCategory` (`food`, `building_materials`, `crafts`, `clothing`, `household`, `luxury`), `BuildingClass` (`simple`, `medium`, `premium`) und `ReputationStatus` (`stranger`, `known_trader`, `respected_trader`, `trusted_citizen`). `City.productionFocus` enthält Waren-IDs.

Anzeigenamen sind kein Bestandteil des Datenmodells. Sie stehen in den Sprachdateien unter `packages/config/locales/` und werden über den Unterpfad `@hanse2go/config/locale` bereitgestellt. Der Server liefert deshalb weder Waren-, Stadt- noch Gebäudenamen; `Good`, `City`, `Building` und `BuildingCatalogEntry` besitzen kein Feld `name`. Ausschließlich der Client löst Bezeichner in Anzeigenamen auf, in `apps/client/src/i18n.ts`; fehlt eine Übersetzung, zeigt er den technischen Bezeichner. Fehlermeldungen des Servers bleiben davon unberührt und sind weiterhin deutsche Klartexte.

`validateLocale()` stellt sicher, dass eine Sprachdatei jeden Bezeichner der Spielkonfiguration benennt. Eine neue Ware, Stadt oder ein neuer Gebäudetyp erfordert damit immer auch einen Eintrag in jeder Sprachdatei.

## Zustandsmodell Alpha 1

Alpha 1 verwendet einen vollständig deterministischen In-Memory-Zustand. Der Startzustand entsteht ausschließlich aus der zentralen Spielkonfiguration; ein Serverneustart erzeugt wieder die Werte aus [`alpha-1/test-world.md`](alpha-1/test-world.md).

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

## Alpha 2: manueller Wirtschaftstick

Der Alpha-2-Stundentick ist ein einzelnes serverautoritäres, atomar ausgeführtes Kommando mit Welt-Sperre und Idempotenz. Er ist nur in Debug- oder Testkonfiguration verfügbar; ein Scheduler oder Hintergrundjob wird nicht gestartet. Die Reihenfolge, Berichtsdaten und fachlichen Sonderfälle stehen in [`alpha-2/production-tick.md`](alpha-2/production-tick.md).

Der Alpha-Server läuft wie die Debug-Position ausschließlich als Debug-Build. `POST /api/debug/tick` ist deshalb standardmäßig registriert und lässt sich mit `HANSE2GO_DEBUG=0` abschalten. Der Tick arbeitet bis zum Abschluss auf Kopien von Gebäuden, Kontorbeständen und Stadtmärkten und schreibt sie erst gemeinsam zurück; ein unerwarteter Fehler lässt den Weltzustand damit vollständig unverändert.

## Alpha-2-Endpunkte

| Endpunkt | Zweck |
|---|---|
| `GET /api/world` | Ticknummer, simulierte Stunde und letzter Tickbericht |
| `GET /api/cities/:cityId/buildings` | Ruf, Konzession, Kontorlager, eigene Gebäude und Katalogangebote |
| `POST /api/cities/:cityId/concession` | Kauf der Baukonzession |
| `POST /api/cities/:cityId/buildings` | Bau eines Kontors oder Produktionsgebäudes |
| `POST /api/cities/:cityId/kontor/transfer` | Ein- und Auslagern ganzer Tonnen |
| `POST /api/debug/tick` | genau ein Stundentick mit Idempotenzschlüssel |

Alle Alpha-2-Endpunkte prüfen den Stadtradius serverseitig und melden eine unerreichbare Stadt mit dem Alpha-2-Fehlercode `CITY_NOT_REACHABLE`; die Alpha-1-Endpunkte behalten `CITY_OUT_OF_RANGE`. Jede schreibende Antwort liefert die vollständige Stadtübersicht einschließlich Gold, Flotte und Kontorbestand, damit der Client ausschließlich serverbestätigte Werte anzeigt. Ein erfolgreicher Tick erhöht die Marktversion jeder Stadt mit verändertem Bestand, sodass vor dem Tick geholte Preisangebote als veraltet abgelehnt werden.

## Alpha 3: atomare Stadtwirtschaft

Der bestehende Debug-Stundentick wird erweitert, nicht dupliziert. Er arbeitet auf einem vollständigen Weltsnapshot und schreibt alle Phasen nur gemeinsam zurück. Bauen, Handeln, Umlagern und Prioritätsänderungen können einen laufenden Tick nicht teilweise verändern. Die verbindliche Phasenfolge und die Alpha-3-Fachverträge stehen in [`alpha-3/tick.md`](alpha-3/tick.md) und [`alpha-3/api-contracts.md`](alpha-3/api-contracts.md).

Zusätzlich zu `POST /test/reset` bereitet `POST /test/seed` im Testbetrieb Gold, Flottenladung und Ruf gemäß [`alpha-2/test-world.md`](alpha-2/test-world.md) vor. Alpha-3-Presets sind ebenfalls ausschließlich im Testbetrieb verfügbar. Die CI bewahrt bei End-to-End-Fehlern Trace, Screenshot, Browserkonsole, Serverlog, Preset/Seed und den letzten erfolgreichen sowie fehlgeschlagenen Tickbericht auf; der Testvertrag steht in [`alpha-3/acceptance.md`](alpha-3/acceptance.md).

## Alpha 4: Hafen- und Werfttransaktionen

Alpha 4 ergänzt die Welt um versionsgesicherte Schiffsentitäten, Flotten, Hafenmärkte, Werften und Bauaufträge. Jeder schreibende Hafenbefehl arbeitet auf einem konsistenten Snapshot, ist idempotent und schreibt Gold, Eigentum, Inventare, Zuordnungen, Aufträge und Versionen nur gemeinsam zurück. Der manuelle Tick erweitert den Alpha-3-Snapshot um die Werftphase; ein Fehler in dieser Phase rollt auch alle Alpha-3-Änderungen zurück. Die verbindlichen Routen, Versionen und Fehlerverträge stehen in [`alpha-4/api-contracts.md`](alpha-4/api-contracts.md) und [`alpha-4/tick.md`](alpha-4/tick.md).

Die Alpha-4-CI bewahrt bei End-to-End-Fehlern zusätzlich vollständigen Hafen-, Flotten-, Werft- und Schiffszustand, Testpreset/Seed, Tickbericht sowie Schiffszahl und IDs vor/nach dem Fehler auf. Die konkrete Abnahme steht in [`alpha-4/acceptance.md`](alpha-4/acceptance.md).

## Arbeitsablauf

Für jedes Issue wird ein neuer Branch vom aktuellen `main` erstellt. Es gibt genau einen Pull Request pro Issue gegen `main`. Alle GitHub-CI-Prüfungen müssen erfolgreich sein. Danach merged der Agent den PR und löscht den gemergten Branch. Details stehen in [`../AGENTS.md`](../AGENTS.md).

## Entscheidungsregel für Alpha 1

Explizite fachliche Entscheidungen dürfen nicht verändert werden. Fehlt nur ein technisches Detail, wählt Codex die einfachste deterministische, serverautoritative, typisierte und testbare Lösung, dokumentiert sie im PR und ergänzt bei dauerhafter Bedeutung die Dokumentation. Nur echte fachliche Widersprüche oder Änderungen am Produktumfang erfordern eine Rückfrage.
