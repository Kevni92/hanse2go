# Alpha 3 – Faire Arbeiterverteilung und Gebäudeprioritäten

## Verfügbarer Arbeiterpool und Nachfrage

Für jede Stadt `c` gilt `availableWorkers(c) = floor(population(c))`. Bevölkerung ist aggregiert, die Verteilung vergibt jedoch nur ganze Arbeiter. Wohnhäuser und Kontore beanspruchen keine Arbeiter. Nur vorhandene, nicht deaktivierte Produktionsgebäude melden ihre bereits durch das Lohnbudget begrenzte Nachfrage.

Für einen Spieler `p` ist die Stadtnachfrage `playerDemand(p, c) = sum(financeableWorkerDemand(b))` über seine Produktionsgebäude in `c`. Spieler mit Nachfrage null nehmen nicht an der Verteilung teil.

## Max-Min-Verteilung zwischen Spielern

Die Stadt verteilt ihre Arbeiter per iterativem Max-Min-Verfahren (Water-Filling):

1. Setze `remainingWorkers = availableWorkers(c)` und `activePlayers` auf alle Spieler mit ungedeckter Nachfrage.
2. Solange `remainingWorkers > 0` und `activePlayers` nicht leer ist, setze `equalShare = floor(remainingWorkers / activePlayers.length)`.
3. Jeder aktive Spieler erhält höchstens `equalShare`, aber nie mehr als seine offene Nachfrage.
4. Vollständig gedeckte Spieler verlassen die aktive Menge; nicht beanspruchte Anteile werden in der nächsten Runde erneut gleich verteilt.
5. Sind weniger Arbeiter als aktive Spieler übrig, werden sie einzeln nach der Restrotation vergeben.

Das Ziel ist `allocatedWorkers(p,c) = min(playerDemand(p,c), λ)` mit einem Schwellenwert `λ`, der alle verfügbaren Arbeiter verwendet, solange Nachfrage existiert.

Für verbleibende Einzelarbeiter werden Spieler-IDs lexikografisch sortiert. Der Startindex ist `playerRemainderStart = tickNumber mod eligiblePlayerCount`; ab dort erfolgt die zyklische Einzelvergabe. In einer Restverteilungsrunde erhält ein Spieler höchstens einen Arbeiter, bevor der nächste betrachtet wird. Damit ist das Ergebnis bei gleichem Zustand deterministisch und der Rundungsvorteil wechselt über die Ticks.

Beispiel mit 100 Arbeitern: Bei den Nachfragen A = 80, B = 40 und C = 10 erhalten A 50, B 40 und C 10. Kein Arbeiter bleibt ungenutzt.

## Prioritäten und Verteilung innerhalb eines Spielers

Jede Produktionsinstanz besitzt genau eine serverseitig gespeicherte Priorität. Neue Produktionsgebäude starten mit `normal`; Kontore und Wohnhäuser besitzen keine Priorität.

| ID | Rang | Bedeutung |
|---|---:|---|
| `very_high` | 5 | zuerst versorgen |
| `high` | 4 | danach versorgen |
| `normal` | 3 | Standardwert |
| `low` | 2 | bei verbleibenden Arbeitern |
| `very_low` | 1 | zuletzt versorgen |

Zunächst erhält der Spieler seinen fairen Stadtanteil. Danach werden Prioritätsgruppen von Rang 5 bis 1 verarbeitet:

1. Reicht der Rest für die gesamte Gruppenachfrage, werden alle Gruppeninstanzen vollständig versorgt.
2. Reicht er nicht, verteilt die Gruppe ihren Rest erneut nach Max-Min.
3. Restarbeiter werden über lexikografisch sortierte Gebäude-IDs rotiert, beginnend bei `tickNumber mod eligibleBuildingCount`; ein Gebäude erhält pro Runde höchstens einen Restarbeiter.
4. Erst danach wird die nächste Prioritätsgruppe verarbeitet.

Eine Prioritätsänderung ist erst im folgenden Tick wirksam. Ein laufender Tick verwendet einen unveränderlichen Prioritätssnapshot.

Beispiel: Bei einem Spieleranteil von 100 erhalten eine `very_high`-Bäckerei mit Bedarf 100 genau 100 Arbeiter, eine `high`-Windmühle und ein `normal`-Getreidehof erhalten null. Bei 150 Arbeitern erhält die Bäckerei 100 und die Windmühle 50.

## Beschäftigung, Arbeitslosigkeit und Fachschnittstelle

Für Stadt `c` gelten:

- `employedWorkers(c) = sum(assignedWorkers(b))`
- `unemployedWorkers(c) = max(0, availableWorkers(c) - employedWorkers(c))`
- `employmentRate(c) = employedWorkers(c) / max(availableWorkers(c), 1)`
- `unemploymentRate(c) = unemployedWorkers(c) / max(availableWorkers(c), 1)`

Arbeitslosigkeit wird angezeigt und im Tickbericht protokolliert. Sie beeinflusst Wohlstand ausschließlich indirekt über das niedrigere aggregierte Einkommen; ein separater Zufriedenheitsmalus existiert nicht.

Die Fachschnittstelle bietet mindestens das Setzen der Priorität einer eigenen Produktionsinstanz, die Arbeiterübersicht einer Stadt und die Zuteilung je eigener Instanz. Sie meldet bei ungültigen Befehlen `BUILDING_NOT_FOUND`, `BUILDING_NOT_OWNED`, `BUILDING_HAS_NO_WORKFORCE` oder `INVALID_WORKFORCE_PRIORITY`.

Ausgeschlossen sind Prioritäten gegenüber fremden Gebäuden, manuelle Einzelzuweisung, Reservierung oder dauerhafte Bindung von Arbeitern, globale Prioritäten über Städte, Berufe, Kündigungsfristen und ein zusätzlicher Zufriedenheitswert.
