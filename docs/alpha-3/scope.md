# Alpha 3 – Verbindlicher Umfang

Alpha 3 erweitert die Alpha-2-Stadtwirtschaft um allgemeine Arbeitskräfte, tatsächliche Lohnzahlungen, Wohnraum, einen einzigen Wohlstandswert und langsames Bevölkerungswachstum. Der manuelle, serverautoritativ ausgeführte Stundentick bleibt der einzige Simulationsauslöser.

Die verbindliche Reihenfolge lautet:

`Wohnraum → Arbeitskräftepotenzial → faire Arbeiterzuteilung → Lohnzahlung → Produktion → Verbrauch → Wohlstand → Wachstum`

Beschäftigungsklasse und Bauklasse sind unabhängige technische Felder. Statische Spielwerte bleiben ausschließlich in `packages/config/game-config.json`; Datenmodell und API verwenden ausschließlich englische Bezeichner.

## Alpha-3-Einzelkonzepte

- [`building-workforce-classes.md`](building-workforce-classes.md) – Klassen, Arbeiterbedarf und Zuordnung
- [`workforce-and-wages.md`](workforce-and-wages.md) – finanzierbare Nachfrage, Lohnzahlung und Statusgründe
- [`workforce-allocation.md`](workforce-allocation.md) – faire Stadtverteilung und Prioritäten innerhalb eines Spielers

Weitere Alpha-3-Dokumente konkretisieren Verteilung, Teilproduktion, Wohnraum, Wohlstand, Wachstum, Tick, Oberfläche und Abnahme. Sie ersetzen Alpha-2-Regeln nur dort, wo sie dies ausdrücklich festlegen.

## Nicht Bestandteil

Nicht Bestandteil sind Berufe, Qualifikationen, individuelle Einwohner- oder Lohnkonten, Schulden, Stadtbudget, Steuern, Wartung, Verschleiß, Echtzeitticks, Offline-Fortschritt und Persistenz.
