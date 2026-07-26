# Alpha 6: Welt-Tick mit Reisen und KI-Entscheidungen

## Grundsatz

Alpha 6 erweitert den bestehenden atomaren Welt-Tick um eine Reisephase und um die KI-Entscheidungsphasen. Es gibt weiterhin keinen Scheduler, keinen Hintergrundthread, keinen Echtzeittick und keine nebenläufige KI außerhalb der Simulation.

Der gesamte Tick ist eine einzige Welttransaktion. Ein technischer Fehler in irgendeiner Phase – auch in der KI-Phase – verwirft sämtliche Änderungen aller Phasen gemeinsam. Eine idempotente Wiederholung derselben Tick-ID liefert exakt denselben gespeicherten Bericht ohne zweite Wirkung.

## Entscheidungsintervalle

| Zyklus | Frequenz | Umfang |
|---|---|---|
| operativ | jeder Tick | Reisefortschritt, Ankunft, Laden und Entladen, laufende Logistikpläne, bestehende Orders, Inputversorgung, Lohn- und Liquiditätsschutz |
| taktisch | alle 6 Ticks | offene Orders neu bewerten, Handelschancen vergleichen, Flotten disponieren, Gebäudeprioritäten prüfen |
| strategisch | alle 24 Ticks | strukturelle Unterversorgung, Gebäude, Kontore, Wohnhäuser, Schiffe, Insolvenz und Rückzug prüfen |

Ein Tick mit der Nummer `n` führt die taktische Planung aus, wenn `n mod 6 = 0`, und die strategische Planung, wenn `n mod 24 = 0`. Bei `n mod 24 = 0` laufen beide, weil 24 durch 6 teilbar ist; die taktische Phase läuft dabei immer vor der strategischen.

Tick 0 ist die Initialisierung und führt keine KI-Planung aus.

## Verbindliche Tickreihenfolge

1. Welt sperren, Tick-Idempotenz prüfen und einen vollständigen Weltsnapshot erstellen.
2. Reisen aller Flotten in aufsteigender `voyageId`-Reihenfolge fortschreiben und Ankünfte verbuchen.
3. Fällige operative KI-Schritte aus **bestehenden** Plänen durchführen: Entladen, Laden, Abfahrt und Orderpflege ohne neue Analyse.
4. Arbeitskräfte, Löhne, Produktion und die übrige Alpha-3-Wirtschaft ausführen; KI-Gebäude folgen denselben Regeln.
5. Alpha-4-Werftphase ausführen und fertige Spieler- und KI-Schiffe erzeugen.
6. Laufende Alpha-5-Konsumperiode abschließen, Wohlstand und Wachstum aktualisieren.
7. Stadtorders und Bevölkerungorders für die nächste Periode erzeugen und jeweils sofort matchen.
8. Öffentliche Wirtschaftsmetriken und Beobachtungsfenster fortschreiben und Versorgungsstatus neu bestimmen.
9. Bei `n mod 6 = 0` die taktische KI-Planung je Handelshaus ausführen.
10. Bei `n mod 24 = 0` die strategische KI-Planung je Handelshaus ausführen.
11. Aus neuen Plänen resultierende, sofort mögliche Fachbefehle in derselben Transaktion ausführen – jedoch keine Reise um einen zusätzlichen Tick fortschreiben.
12. Gold-, Waren-, Eigentums-, Order-, Schiffs-, Flotten- und Reiseinvarianten über den vollständigen Snapshot prüfen.
13. Ticknummer und simulierte Zeit erhöhen, vollständigen Bericht speichern und atomar committen.

Die Schritte 4 bis 7 sind die unveränderte Alpha-3-bis-Alpha-5-Reihenfolge. Alpha 6 ergänzt ausschließlich die Schritte 2, 3, 8, 9, 10 und 11.

### Zwei bewusste Festlegungen

- **Neue Orders dürfen im selben Tick matchen.** Eine in Schritt 11 erzeugte KI-Order geht sofort in das Matching, genau wie eine Spielerorder.
- **Eine neu gestartete Reise macht ihren ersten Fortschritt erst im folgenden Tick.** Schritt 2 hat sie noch nicht gesehen, und Schritt 11 schreibt sie nicht nachträglich fort. Eine in Tick `n` gestartete Reise über 8 Ticks kommt damit in Tick `n + 8` an.

## Akteursreihenfolge

Handelshäuser werden in **jeder** KI-Phase aufsteigend nach `actorId` verarbeitet:

`ai-house-lambrecht` → `ai-house-mannheim` → `ai-house-neustadt`

Innerhalb eines Handelshauses gilt strikt:

1. bestehende Verpflichtungen erfüllen;
2. Liquidität und Insolvenz prüfen;
3. laufende Logistikpläne aufsteigend nach `logisticsPlanId`;
4. offene Investitions- und Schiffspläne aufsteigend nach `investmentPlanId` beziehungsweise `shipAcquisitionPlanId`;
5. neue Chancen nach `supportScore`, danach erwarteter Rentabilität, danach stabilen IDs.

Die Reihenfolge darf niemals von Map- oder Set-Iterationsreihenfolge, Systemzeit, Zufallszahlen oder Speicheradressen abhängen. Jede Sortierung erfolgt über explizit definierte, stabile Schlüssel.

## Entscheidungsbudget

Je Handelshaus und Planungszyklus:

| Budget | Grenze |
|---|---:|
| neue strategische Investitionsentscheidungen | 1 |
| neue Logistikpläne je taktischem Zyklus | 3 |
| Ordererstellungen, -ersetzungen und -stornierungen je Zyklus | 10 |

Bestehende notwendige operative Schritte – Entladen, Laden, Abfahrt, Erfüllung bereits eingegangener Verpflichtungen und erzwungene Stornierungen im Status `conserving` oder `insolvent` – zählen **nicht** gegen dieses Budget. Andernfalls könnte ein Handelshaus seine eigenen Verpflichtungen nicht erfüllen.

Weitere Kandidaten werden mit dem Grund `decision_budget_exhausted` protokolliert und im nächsten Zyklus erneut vollständig bewertet. Eine verworfene Bewertung wird nicht zwischengespeichert.

## Fachbefehle statt Direktmutation

Jede KI-Entscheidung erzeugt genau dieselben internen Fachbefehle wie eine Spieleraktion:

- Order erstellen, stornieren oder ersetzen;
- Waren zwischen eigenen lokalen Inventaren transferieren;
- Reise starten;
- Konzession kaufen;
- Kontor, Produktionsgebäude oder Wohnhaus bauen;
- Gebäudepriorität setzen;
- Schiff kaufen oder verkaufen;
- Schiffsbauauftrag erteilen;
- Flotte erstellen und Schiffe zuweisen oder entfernen;
- Schiff oder Flotte umbenennen.

Die KI besitzt **keinen** eigenen Schreibpfad in den Domänenzustand. Sie darf Konten, Inventare, Gebäude, Schiffe, Flotten, Orders und Reservierungen niemals direkt verändern. Jeder interne Befehl trägt einen deterministischen Idempotenzschlüssel `ai-<tick>-<actorId>-<planId>-<step>`.

Ein von einem Fachbefehl abgelehnter KI-Wunsch ist eine reguläre Ablehnung mit protokolliertem Grund und kein technischer Fehler.

## Snapshotregeln

- Jede Planungsphase liest den Zustand **nach** den vorangegangenen Tickphasen desselben Ticks.
- Entscheidungen eines früher sortierten Handelshauses dürfen den Zustand für später sortierte Handelshäuser verändern; das ist gewollt und entspricht der Serialisierung realer Befehle.
- Ein später verarbeitetes Handelshaus sieht ausschließlich bereits gebuchte Änderungen desselben Ticks, niemals geplante oder verworfene Absichten anderer Akteure.
- Eine Entscheidung darf niemals auf einem zukünftigen Tickzustand beruhen.
- Die strategische Planung berücksichtigt die in Schritt 7 neu erzeugten Stadt- und Bevölkerungorders desselben Ticks.
- Die Beobachtungsfenster aus Schritt 8 sind für alle Handelshäuser desselben Ticks identisch und werden während der KI-Phasen nicht mehr verändert.

## Deterministische IDs

| Objekt | Format |
|---|---|
| KI-Entscheidung | `decision-<tick>-<actorId>-<sequence>` |
| Logistikplan | `logistics-<tick>-<actorId>-<sequence>` |
| Investitionsplan | `investment-<tick>-<actorId>-<sequence>` |
| Schiffsplan | `ship-plan-<tick>-<actorId>-<sequence>` |
| Reise | `voyage-<tick>-<fleetId>-<sequence>` |
| interne Idempotenz | `ai-<tick>-<actorId>-<planId>-<step>` |

`sequence` ist ein je Tick und Akteur bei 1 beginnender, monoton steigender Zähler in Verarbeitungsreihenfolge. Ein Reset und eine Wiederholung mit demselben Seed erzeugen dieselben IDs und dieselben Entscheidungen.

## Fehler und Rollback

Es wird strikt zwischen zwei Klassen unterschieden:

**Reguläre fachliche Ablehnung** – der Tick läuft normal weiter, die Entscheidung wird mit `outcome = rejected` und einem `reasonCode` protokolliert:

- fachlich nicht rentable oder nicht finanzierbare Aktion;
- fehlendes Angebot, fehlende Nachfrage, fehlende Kapazität oder fehlende Flotte;
- Versionskonflikt eines KI-Fachbefehls; die Option wird im nächsten Zyklus neu bewertet;
- ausgeschöpftes Entscheidungsbudget.

**Technischer Fehler** – der gesamte Tick wird zurückgerollt:

- Verletzung einer Gold-, Waren-, Eigentums-, Order-, Schiffs-, Flotten- oder Reiseinvariante;
- ungedeckte Order;
- Doppelbesitz eines Objekts oder eine Flotte an zwei Orten;
- doppelte Reise oder doppelte Ankunft;
- jeder unerwartete technische Fehler.

Bei einem Rollback bleiben Ticknummer, Ledger, Konten, Orders, Reisen, Pläne, Entscheidungen und sämtliche Bestände exakt unverändert. Es wird kein Teilbericht und kein Teilprotokoll gespeichert. Eine Wiederholung derselben Tick-ID erzeugt keine doppelten Aktionen.

## Performancegrenzen

Alpha 6 testet drei Handelshäuser und drei Städte.

- Je strategischem Zyklus werden höchstens 3 Städte × 22 Waren × 3 Handelshäuser als Primärkandidaten bewertet, also 198 Kombinationen.
- Kandidaten werden **vor** jeder tieferen Rentabilitätsanalyse auf `supportScore > 0` gefiltert.
- Es gibt keine exponentielle Kombination beliebiger Produktionsketten.
- Die Produktionsplanung betrachtet ausschließlich direkte Rezeptketten bis maximal drei Stufen Tiefe.

Damit ist der Rechenaufwand je Tick durch eine feste Obergrenze beschränkt und wächst nicht mit der Laufzeit der Welt.

## Erweiterter Tickbericht

Der Bericht ergänzt die bestehenden Alpha-3-bis-Alpha-5-Abschnitte um mindestens:

- fortgeschriebene, gestartete und angekommene Reisen mit IDs, Start, Ziel und Restticks;
- ausgeführte operative, taktische und strategische Zyklen;
- Entscheidungen je Handelshaus mit Ergebnis und Grund;
- erstellte, stornierte und ersetzte KI-Orders sowie deren Executions;
- Logistikpläne mit Status und tatsächlich transportierten Mengen;
- neue Gebäude-, Schiffs- und Werftpläne;
- Statuswechsel `active` / `conserving` / `insolvent` je Handelshaus;
- Versorgungsstatus je Stadt und Ware mit `supportScore` und Marktanteilen;
- Gold-, Waren-, Schiffs-, Eigentums- und Reiseinvarianten mit Status;
- abgelehnte Optionen gruppiert nach `reasonCode`.

## Fehlercodes

| Fehlercode | Klasse |
|---|---|
| `AI_DECISION_STATE_CONFLICT` | technisch |
| `AI_DECISION_BUDGET_EXCEEDED` | fachlich |
| `AI_DETERMINISM_VIOLATION` | technisch |
| `AI_COMMAND_EXECUTION_FAILED` | technisch |
| `AI_TICK_INVARIANT_FAILED` | technisch |

Die bestehenden Tickfehlercodes `TICK_IN_PROGRESS`, `TICK_ORDER_MARKET_INVARIANT_FAILED`, `MONEY_SUPPLY_INVARIANT_VIOLATION`, `GOODS_SUPPLY_INVARIANT_VIOLATION`, `MONEY_LEDGER_IMBALANCE` und `ORDER_ATOMIC_COMMIT_FAILED` bleiben unverändert gültig.

## Abnahme des Ticks

Die verbindlichen Prüfungen der Tickreihenfolge, der Invarianten nach jedem Tick, der 720- und 4.320-Tick-Langzeitsimulationen und der Determinismuswiederholung stehen in [`acceptance.md`](acceptance.md). Insbesondere gilt: Eine in Tick `n` gestartete Reise über 8 Ticks kommt exakt in Tick `n + 8` an, und zwei Läufe derselben Ausgangswelt liefern identische Zustände, IDs und Entscheidungsprotokolle.

## Ausdrücklich ausgeschlossen

Hintergrundthreads, asynchrone KI außerhalb des Ticks, zufällige oder zeitabhängige Entscheidungen, LLM- oder sonstige generative Aufrufe, direkte Zustandsmutation durch die KI, unbegrenzte Kandidatensuche sowie parallele Verarbeitung derselben Welt ohne deterministische Serialisierung.
