# Alpha 6: Bauablauf und Kettenprüfung der Handelshäuser

Dieses Dokument ergänzt [`ai-production-and-investment.md`](ai-production-and-investment.md) um den konkreten Ablauf eines KI-Bauvorhabens, die Prüfung der Produktionskette und die deterministische Auswahl unter mehreren Investitionskandidaten.

## Schrittfolge eines Bauvorhabens

Ein Investitionsplan wird strikt in dieser Reihenfolge abgearbeitet. Jeder Schritt ist ein regulärer Fachbefehl mit eigenem deterministischen Idempotenzschlüssel `ai-<tick>-<actorId>-<planId>-<step>`.

| Schritt | Voraussetzung | Wirkung |
|---:|---|---|
| 1 | Ruf in der Zielstadt mindestens 80 | Konzession für 10.000,00 Gold kaufen |
| 2 | Konzession vorhanden, kein eigenes Kontor | Kontor für 10.000,00 Gold plus Material bauen |
| 3 | Kontor vorhanden | Baumaterialien des Zielgebäudes vollständig bereitstellen |
| 4 | Material unreserviert im Kontor | Gebäude bauen |
| 5 | Gebäude vorhanden | Priorität setzen und Inputversorgung aufnehmen |

Entfällt ein Schritt, weil seine Wirkung bereits besteht, wird er übersprungen. Ein Schritt wird nie teilweise ausgeführt: Scheitert er, bleibt der Plan im vorherigen Zustand und wird im nächsten strategischen Zyklus erneut bewertet.

Die Kosten der Schritte 1 und 2 werden erst gebucht, wenn der Plan `ready_to_build` erreichbar ist, also die Gesamtrentabilität einschließlich Konzession und Kontor nachgewiesen wurde. Ein Handelshaus kauft keine Konzession „auf Vorrat“.

## Prüfung der Produktionskette

Ein Endproduktgebäude ist nur sinnvoll, wenn seine Inputs real verfügbar sind. Vor der Investitionsentscheidung wird die Rezeptkette geprüft.

Für jeden Input des Zielrezepts gilt genau eine Einstufung:

| Einstufung | Bedingung |
|---|---|
| `available_by_trade` | Input ist am Zielort oder über eine bestehende Route zu einem Preis beschaffbar, der die Amortisation einhält |
| `available_by_own_production` | ein eigenes Gebäude erzeugt den Input bereits in ausreichender Menge |
| `requires_upstream_investment` | Input ist nur über ein zusätzliches vorgelagertes Gebäude verfügbar |
| `unavailable` | Input ist weder handelbar noch herstellbar |

Ein einziger Input mit `unavailable` führt zur Ablehnung des gesamten Plans mit `AI_BUILD_REQUIREMENTS_MISSING`.

Die Kettenprüfung betrachtet höchstens drei Rezeptstufen Tiefe. Eine tiefere Kette gilt als `unavailable`; damit ist die Kandidatensuche in jedem Fall endlich und es entsteht keine exponentielle Kombinatorik über beliebige Produktionsketten.

### Vorgelagerte Stufen

Ein Input mit `requires_upstream_investment` erzeugt keinen sofortigen zweiten Bau. Stattdessen gilt:

- die Amortisationsrechnung des Zielplans berücksichtigt die vollständigen Kosten der vorgelagerten Stufe;
- gebaut wird zuerst die **vorgelagerte** Stufe, weil das Endprodukt ohne sie nicht produzieren kann;
- jede Stufe ist eine eigene größere Investition und unterliegt damit einzeln der 24-Tick-Sperre;
- eine Kette wird also über mehrere strategische Zyklen hinweg errichtet, nie in einem Tick.

Damit ist ausgeschlossen, dass ein Handelshaus mehrere Gebäude gleichzeitig errichtet oder eine halbe Kette baut und dann liegen lässt: Der Zielplan bleibt bis zur Fertigstellung der Vorstufe in `evaluating` und wird in jedem Zyklus neu auf Rentabilität geprüft.

## Auswahl unter mehreren Kandidaten

Je strategischem Zyklus darf ein Handelshaus höchstens **eine** neue Investitionsentscheidung treffen. Konkurrierende Kandidaten werden deterministisch sortiert:

1. höherer `supportScore` der Zielstadt und Ware;
2. kürzere `paybackTicks`;
3. geringere `investmentCost`;
4. `cityId`, dann `goodId`, dann `buildingTypeId` lexikografisch aufsteigend.

Alle nicht gewählten Kandidaten werden mit `decision_budget_exhausted` protokolliert und im nächsten Zyklus erneut bewertet. Ihre Bewertung wird nicht zwischengespeichert, sondern jeweils neu aus dem aktuellen Snapshot gebildet.

## Materialbedarf je Bauvorhaben

Die Mengen entsprechen unverändert den bestehenden Regeln:

| Bauvorhaben | Gold | Holz | Bretter | Ziegel | Werkzeug |
|---|---:|---:|---:|---:|---:|
| Kontor | 10.000 | 50,00 t | 25,00 t | 40,00 t | 10,00 t |
| Produktionsgebäude `simple` | 7.500 | 20,00 t | 10,00 t | 10,00 t | 5,00 t |
| Produktionsgebäude `medium` | 10.000 | 30,00 t | 20,00 t | 20,00 t | 10,00 t |
| Produktionsgebäude `premium` | 12.500 | 40,00 t | 30,00 t | 30,00 t | 20,00 t |
| Wohnhaus `town_house` | 10.000 | 30,00 t | 20,00 t | 20,00 t | 10,00 t |

Die Goldbeträge enthalten jeweils den Grundstückspreis von 5.000 Gold. Die verbindlichen Quellen sind [`../alpha-2/buildings-and-construction.md`](../alpha-2/buildings-and-construction.md) und [`../alpha-3/housing.md`](../alpha-3/housing.md); Alpha 6 verändert keinen dieser Werte.

`expectedMaterialAcquisitionCost` bewertet fehlende Mengen mit dem erwarteten Einkaufspreis einschließlich Käufergebühr und gegebenenfalls kalkulatorischen Transportkosten. Bereits vorhandenes eigenes Material wird mit seiner realen Kostenbasis bewertet, nicht mit dem Basispreis.

## Protokollpflicht je Investitionsentscheidung

Zusätzlich zu den Pflichtfeldern aus [`ai-transparency.md`](ai-transparency.md) speichert jeder Investitionsplan:

- den Versorgungsstatus und `supportScore` der Zielstadt und Ware;
- die geprüften früheren Maßnahmenstufen 1 bis 5 und den Grund, warum sie die Lücke nicht schließen;
- die Einstufung jedes Rezeptinputs;
- `investmentCost` mit allen fünf Bestandteilen;
- `expectedContributionPer24Ticks` mit allen vier Bestandteilen;
- `paybackTicks`;
- verfügbare Liquidität vor und nach der geplanten Investition;
- den Tick der letzten größeren Investition dieses Handelshauses;
- alle konkurrierenden Kandidaten mit ihrer Sortierposition;
- den gewählten Kandidaten oder den `reasonCode` der Ablehnung.

Damit ist im Debugbetrieb ohne Nachrechnen erkennbar, warum ein Handelshaus gebaut oder gerade nicht gebaut hat.

## Invarianten

- Ein Plan bucht Kosten erst, wenn seine Gesamtrentabilität einschließlich Konzession und Kontor nachgewiesen ist.
- Eine Produktionskette wird über mehrere Zyklen errichtet, nie mehrere Gebäude in einem Tick.
- Die Kettenprüfung betrachtet höchstens drei Stufen und terminiert immer.
- Höchstens ein neuer Investitionsplan je Handelshaus und strategischem Zyklus.
- Kein Bauvorhaben verändert die Gold- oder Warenbilanz der Welt; es verschiebt ausschließlich vorhandene Bestände und verbraucht Material als reale Warensenke.
