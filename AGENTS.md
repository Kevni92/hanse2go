# Agent Workflow

## Ablage

- `docs/`: verbindliche fachliche und technische Dokumentation
- `apps/client/`: Vue-Client
- `apps/server/`: TypeScript-Server und REST API
- `packages/config/`: zentrale Spielkonfiguration; alle statischen Spieleigenschaften stehen in `game-config.json`
- `packages/shared/`: gemeinsam genutzte Typen und Verträge
- `tests/e2e/`: Playwright-End-to-End-Tests

## Arbeitsablauf

1. Issue und relevante Dateien unter `docs/` vollständig lesen.
2. Für jedes Issue einen eigenen Branch vom aktuellen `main` erstellen: `agent/issue-<nummer>-<thema>`.
3. Ausschließlich den Umfang dieses Issues bearbeiten; keine direkten Änderungen auf `main`.
4. Dokumentation und Tests gemeinsam mit der Änderung aktualisieren.
5. Einen Pull Request gegen `main` erstellen.
6. Jede Pull-Request-Beschreibung muss exakt `Closes #<Issue-Nummer>` enthalten und damit das bearbeitete Issue verknüpfen.
7. Ausschließlich das englische GitHub-Keyword `Closes` verwenden. Deutsche Varianten wie `Schließt`, `Behebt` oder `Erledigt` sowie eine bloße Issue-Verlinkung erfüllen diese Pflicht nicht.
8. Ein Pull Request ohne korrektes `Closes #<Issue-Nummer>` ist unvollständig und darf nicht gemergt werden.
9. Alle GitHub-CI-Prüfungen abwarten und Fehler beheben.
10. Den Pull Request erst bei vollständig erfolgreicher CI mergen.
11. Nach dem Merge den gemergten Branch löschen.

Ein Issue gilt erst als abgeschlossen, wenn Dokumentation, Tests und Implementierung widerspruchsfrei sind, der Pull Request das verpflichtende `Closes #<Issue-Nummer>` enthält und gemergt wurde.
