# Alpha 2 – Verbindlicher Umfang

## Ziel

Alpha 2 erweitert den serverautoritativen Handel aus Alpha 1 um örtlichen Ruf, Baukonzessionen, private Kontore, Produktionsgebäude, einen manuellen Stundentick und festen Bevölkerungsverbrauch. Alle Zustände bleiben deterministisch, in-memory und über einen Testreset reproduzierbar.

## Enthalten

- örtlicher Ruf von 0 bis 100 je Spieler und Stadt sowie die Baukonzession ab 80 Ruf für 10.000 Gold,
- ein verpflichtendes Kontor als erstes Gebäude, private Kontorlager und Produktionsgebäude für alle 22 Waren,
- feste Produktionsrezepte und ein manuell ausgelöster, serverseitiger Stundentick,
- fixer, einkommensunabhängiger Marktverbrauch der Stadtbevölkerung,
- ein Stadt-Tab `Gebäude` für Ruf, Konzession, Bau, Lager und Tickbericht,
- mobile und Desktop-Abnahme mit realem Client und Server.

## Nicht enthalten

- Wohnhäuser, Wohnraum, Arbeiter, Löhne, Einkommen, Wohlstand, Bevölkerungswachstum oder Missionen,
- laufende Kosten, Bauzeiten, Abriss, Ausbau, automatische Ticks, Scheduler oder Offline-Fortschritt,
- echtes GPS, Echtdaten, Persistenz, PostgreSQL, Handelsrouten und automatischen Warenhandel.

## Leitprinzipien

Der Server validiert und bucht jede Aktion atomar. Der Client zeigt ausschließlich serverbestätigte Zustände. Mengen sind ganze Tonnen, Goldbeträge ganze Goldmünzen. Ein Tick entspricht genau einer simulierten Stunde.

## Abhängigkeiten

Dieses Dokument wird durch die Alpha-2-Einzelkonzepte konkretisiert. Alpha-1-Regeln bleiben gültig, soweit ein Alpha-2-Dokument sie nicht ausdrücklich ersetzt.

## Verbindliche Einzelkonzepte

- [`reputation-and-concessions.md`](reputation-and-concessions.md) – Ruf und Konzession
- [`buildings-and-construction.md`](buildings-and-construction.md) – Kontor, Kosten und Bau
- [`building-catalog.md`](building-catalog.md) und [`production-recipes.md`](production-recipes.md) – Produktionsgebäude und Rezepte
