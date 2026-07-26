# Alpha 3 – Arbeitsnachfrage und Lohnzahlung

## Begriffe

Für eine Produktionsgebäudeinstanz `b` gelten:

- `requiredWorkers(b)`: 200, 100 oder 50 gemäß Beschäftigungsklasse,
- `assignedWorkers(b)`: tatsächlich zugewiesene ganzzahlige Arbeiter,
- `wagePerWorker(b)`: 1, 2 oder 4 Gold gemäß Beschäftigungsklasse,
- `wageCost(b) = assignedWorkers(b) × wagePerWorker(b)`,
- `utilization(b) = assignedWorkers(b) / requiredWorkers(b)`.

Stets gilt `0 ≤ assignedWorkers(b) ≤ requiredWorkers(b)`. Arbeiter und Gold sind ganzzahlig. Bei Teilbesetzung sind Lohnkosten streng proportional; bei null zugewiesenen Arbeitern fallen keine Löhne an.

## Finanzierbare Arbeitsnachfrage

Ein Spieler kann keine Schulden erzeugen. Vor der stadtweiten Verteilung wird deshalb seine finanzierbare Nachfrage bestimmt:

1. Der Spieler verarbeitet seine Gebäude absteigend nach Priorität; innerhalb derselben Priorität gilt die faire Verteilung aus dem Arbeiterverteilungskonzept.
2. Sein aktuelles Gold ist ein gemeinsames Lohnbudget für alle Gebäude und Städte dieses Ticks.
3. In der gleichzeitig simulierten Testwelt werden Städte nach `cityId` aufsteigend verarbeitet.
4. Für ein Gebäude ist `affordableWorkers = floor(remainingWageBudget / wagePerWorker)`.
5. Seine Nachfrage wird auf `min(requiredWorkers, affordableWorkers)` begrenzt.
6. Das benötigte Budget wird nur reserviert. Erst die endgültige Zuteilung bestimmt die tatsächliche Lohnsumme.

Die auf diese Weise begrenzte Nachfrage wird anschließend mit der verbindlichen Max-Min-Verteilung aus [`workforce-allocation.md`](workforce-allocation.md) auf die Stadt und die priorisierten Gebäude verteilt.

## Tatsächlicher Geldfluss und Atomarität

Nach der finalen Arbeiterzuteilung wird die Summe aller `wageCost` eines Spielers erneut gegen seinen Goldbestand geprüft und dann einmalig atomar abgezogen. Reicht sie wegen einer parallelen Zustandsänderung nicht aus, wird der gesamte Tick ohne Zustandsänderung abgelehnt oder auf einem frischen Zustandsstand wiederholt. Teilweise Lohnbuchungen sind ausgeschlossen.

Die Summe der gezahlten Löhne je Stadt ist das aggregierte Bevölkerungseinkommen des Ticks. Sie wird nur für Kaufkraft und Wohlstand dieses Ticks ausgewertet; weder Einwohner noch Stadt besitzen ein dauerhaftes Lohnkonto oder Budget.

Löhne werden gezahlt, sobald Arbeiter dem Tick zugewiesen sind – auch wenn das Gebäude anschließend wegen fehlender Eingangswaren nicht produziert.

## Status und Fehlergründe

Eine Gebäudeinstanz kann zusätzlich zu ihrem Produktionsstatus folgende Beschäftigungszustände melden:

- `fully_staffed`
- `partially_staffed`
- `unstaffed`
- `wage_budget_limited`
- `no_workers_available`

Ein Produktionsbericht kann mehrere Stillstandsgründe enthalten, mindestens `NO_WORKERS_ASSIGNED`, `INSUFFICIENT_WAGE_BUDGET` und `MISSING_INPUTS`.

Ausgeschlossen sind individuelle Verträge, Lohnverhandlungen, Lohnsteuern, Sozialabgaben, Kreditfinanzierung, Berufe, Arbeitswege, Schichten, Krankheit sowie Wartungs- und Zustandskosten.
