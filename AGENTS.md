# Agent Workflow

## Ablage

- `docs/`: verbindliche fachliche und technische Dokumentation
- `apps/client/`: Vue-Client
- `apps/server/`: TypeScript-Server und REST API
- `packages/shared/`: gemeinsam genutzte Typen und Verträge
- `tests/e2e/`: Playwright-End-to-End-Tests

## Arbeitsablauf

1. Issue und relevante Dateien unter `docs/` vollständig lesen.
2. Für jedes Issue einen eigenen Branch vom aktuellen `main` erstellen: `agent/issue-<nummer>-<thema>`.
3. Ausschließlich den Umfang dieses Issues bearbeiten; keine direkten Änderungen auf `main`.
4. Dokumentation und Tests gemeinsam mit der Änderung aktualisieren.
5. Einen Pull Request gegen `main` erstellen und das Issue verknüpfen.
6. Alle GitHub-CI-Prüfungen abwarten und Fehler beheben.
7. Den Pull Request erst bei vollständig erfolgreicher CI mergen.
8. Nach dem Merge den gemergten Branch löschen.

Ein Issue gilt erst als abgeschlossen, wenn Dokumentation, Tests und Implementierung widerspruchsfrei sind und der Pull Request gemergt wurde.
