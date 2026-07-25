# Hanse2Go

Hanse2Go ist ein serverautoritatives Handelsspiel. Die verbindliche fachliche
und technische Dokumentation liegt in [docs/](docs/README.md).

## Voraussetzungen

- Node.js LTS
- pnpm 11 oder neuer

## Entwicklung und Prüfungen

```sh
pnpm install
pnpm dev
```

Der Client läuft auf `http://localhost:5173`, der Server auf
`http://localhost:3000`. Der Health-Endpunkt lautet `/health`; die interaktive
OpenAPI-Dokumentation ist unter `/documentation` verfügbar.
Der Alpha-Startzustand ist über `/api/state` lesbar; getrennte lesende
Endpunkte stehen für Spieler, Flotte, Waren und Städte bereit.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Die E2E-Suite setzt einen gestarteten Client und Server voraus. Sie wird mit
dem Alpha-1-Handelsablauf erweitert.
