# Alpha 6: Unterversorgung, Marktanteil und Eingriffsgrenzen

## Zweck

Dieses Dokument legt fest, wann eine Stadt-Ware-Kombination als unterversorgt gilt, welche Maßnahmenklasse ein Handelshaus daraufhin überhaupt prüfen darf, wie stark die KI einen Markt besetzen darf und wann sie sich aus einem ausreichend spielerversorgten Markt zurückzieht.

Alle Größen stammen ausschließlich aus [`economic-observation.md`](economic-observation.md). Ein niedriger Preis allein ist niemals ein Eingriffsgrund.

## Versorgungsstatus

Je `cityId` und `goodId` existiert genau ein Status:

| Status | Bedeutung | erlaubte Maßnahmenklasse |
|---|---|---|
| `normal` | keine Auffälligkeit | regulärer rentabler Handel |
| `acute_shortage` | akut knapp | Handel und Logistik |
| `structural_shortage` | strukturell knapp | zusätzlich Investitionsprüfung |
| `critical_shortage` | kritisch knapp | zusätzlich Überschreitung des Marktanteilsziels |
| `player_supplied` | ausreichend durch Spieler versorgt | Rückzug |

### `acute_shortage`

Gilt, wenn für 12 aufeinanderfolgende Ticks mindestens eine Bedingung erfüllt ist:

- `averageCoverageBp(12) < 6.000`;
- in keinem dieser Ticks existierte eine Sell Order mit `limitPriceGoldPerTon <= populationLimitGoldPerTon`;
- `sum(expiredPopulationUnits über 12 Ticks) × 10.000 / sum(financeableQuantityUnits über 12 Ticks) >= 4.000`.

`populationLimitGoldPerTon` ist das Bevölkerungslimit aus [`../alpha-5/population-orders-and-consumption.md`](../alpha-5/population-orders-and-consumption.md), also `max(1, floor(basePrice × (0,5 + wealth / 100)))`.

Ist `sum(financeableQuantityUnits)` null, ist die dritte Bedingung nicht erfüllt.

Akute Unterversorgung erlaubt Handels- und Logistikmaßnahmen. Sie erlaubt **keinen** Gebäudebau.

### `structural_shortage`

Gilt, wenn für 72 aufeinanderfolgende Ticks **beide** Bedingungen erfüllt sind:

- `averageCoverageBp(72) < 7.000`;
- `humanTradeShareBp < 4.000` oder `totalSuppliedUnits72 = 0`.

Dieser Status erlaubt zusätzlich die Prüfung von Produktionsgebäude- und Transportkapazitätsinvestitionen. Er erzwingt keine Investition; die Wirtschaftlichkeits- und Liquiditätsprüfungen bleiben vollständig gültig.

### `critical_shortage`

Gilt, wenn mindestens eine Bedingung erfüllt ist:

- `averageCoverageBp(24) < 5.000` für mindestens 24 aufeinanderfolgende Ticks;
- in 24 aufeinanderfolgenden Ticks existierte bei `financeableQuantityUnits > 0` kein Angebot innerhalb des Bevölkerungslimits.

Bei kritischer Unterversorgung darf die KI das Marktanteilsziel von 60 % vorübergehend überschreiten. Alle übrigen Regeln bleiben unverändert bestehen: vollständige Deckung, reguläre Gebühren, Liquiditätsreserve, Lohndeckung und das Verbot des planmäßigen Verkaufs unter variablen Kosten.

### `player_supplied`

Gilt, wenn für 72 aufeinanderfolgende Ticks **alle** Bedingungen erfüllt sind:

- `averageCoverageBp(72) > 9.000`;
- `humanTradeShareBp > 7.000`;
- `distinctHumanSellers72 >= 2` **oder** `humanProductionCapacityUnits >= requiredQuantityUnits` des jeweiligen Ticks.

## Statusauflösung und Priorität

Treffen mehrere Bedingungen gleichzeitig zu, gilt genau ein Status in dieser absteigenden Priorität:

`critical_shortage` → `structural_shortage` → `acute_shortage` → `player_supplied` → `normal`

`critical_shortage` und `player_supplied` schließen sich fachlich aus; die Priorität legt den Ausgang trotzdem eindeutig fest. Der Status wird einmal je Tick nach der Fensterfortschreibung berechnet und gilt für alle Handelshäuser identisch.

Ein Status endet, sobald seine Bedingung in einem Tick nicht mehr gilt; der zugehörige Zähler beginnt danach wieder bei null. Es gibt keine Nachlauf- oder Karenzzeit. `shortageDurationTicks` zählt die Ticks seit dem Beginn des aktuellen Nicht-`normal`-Status.

## Folgen von `player_supplied`

- keine neuen KI-Produktions- oder Kontorinvestitionen für diese Stadt-Ware-Kombination;
- die KI ersetzt auslaufende eigene Handelsaktivität nicht automatisch durch neue Orders;
- bereits offene rentable Sell Orders dürfen regulär auslaufen oder ausgeführt werden und werden nicht vorzeitig storniert;
- frei werdende Flottenkapazität wird der nach `supportScore` nächsthöchsten Mangellage zugeteilt;
- bestehende Gebäude werden weder abgerissen noch verkauft; ihre Priorität darf auf 1 sinken;
- vorhandene Outputs werden weiterhin mindestens kostendeckend angeboten.

Ein Rückzug ist keine Preisunterbietung und kein Räumungsverkauf. Die KI verlässt den Markt durch Nichthandeln, nicht durch Verdrängung.

## KI-Marktanteilsziel

Über die letzten 72 Ticks gilt je Stadt und Ware:

`aiTradeShareBp = floor(aiSuppliedUnits72 × 10.000 / totalSuppliedUnits72)`

`aiSuppliedUnits72` ist die Summe des Versorgungsvolumens aller Handelshäuser. Bei `totalSuppliedUnits72 = 0` ist der Anteil 0.

- Das reguläre Ziel ist `aiTradeShareBp <= 6.000` für alle Handelshäuser zusammen.
- Derselbe Wert wird zusätzlich je einzelnem Handelshaus berechnet und ausgewiesen.
- Bei `critical_shortage` gilt die Grenze nicht; sie bleibt als Diagnosewert sichtbar und wird als bewusst überschritten gekennzeichnet.
- Eine einzelne neue Order wird in der Menge so begrenzt, dass die erwartbare Ausführung das Ziel nicht unnötig überschreitet.

Die maximal noch zielkonforme Menge ist:

`marketShareHeadroomUnits = max(0, floor(totalSuppliedUnits72 × 6.000 / 10.000) - aiSuppliedUnits72)`

Bei `totalSuppliedUnits72 = 0` ist das Headroom null; ohne jedes gemessene Volumen darf die KI nur bei `acute_shortage`, `structural_shortage` oder `critical_shortage` handeln, weil dann eine reale unerfüllte Nachfrage nachgewiesen ist. Das Marktanteilsziel ist eine Mengenobergrenze, keine Verpflichtung, es auszuschöpfen.

## Unterstützungswert `supportScore`

Für die deterministische Priorisierung erhält jede Stadt-Ware-Kombination einen ganzzahligen `supportScore` von 0 bis 1.000.

| Bestandteil | Formel | Maximum |
|---|---|---:|
| Versorgungslücke | `coveragePoints = floor((10.000 - averageCoverageBp(72)) × 500 / 10.000)` | 500 |
| Dauer der Mangellage | `durationPoints = min(shortageDurationTicks, 200)` | 200 |
| unerfüllte finanzierbare Nachfrage | `unfilledPoints = floor(unfilledFinanceableShareBp(72) × 150 / 10.000)` | 150 |
| geringer menschlicher Anteil | `humanPoints = floor((10.000 - humanTradeShareBp) × 100 / 10.000)` | 100 |
| sinkender Wohlstand | `wealthPoints = min(max(wealth72TicksAgo - currentWealth, 0), 50)` | 50 |

Dabei ist:

`unfilledFinanceableShareBp(72) = floor(sum(expiredPopulationUnits über 72 Ticks) × 10.000 / sum(financeableQuantityUnits über 72 Ticks))`

Bei einer Summe `financeableQuantityUnits` von null ist dieser Anteil 0.

`supportScore = min(1.000, coveragePoints + durationPoints + unfilledPoints + humanPoints + wealthPoints)`

Alle Divisionen sind abgerundete Ganzzahldivisionen; Gleitkomma wird weder berechnet noch gespeichert. Ein Wert außerhalb von 0 bis 1.000 ist ein technischer Fehler `AI_SUPPORT_SCORE_OUT_OF_RANGE` und rollt den Tick zurück.

### Reihenfolge

Kandidaten werden absteigend nach `supportScore` geprüft. Bei Gleichstand entscheidet `cityId` lexikografisch aufsteigend, danach `goodId` lexikografisch aufsteigend. Die Reihenfolge darf niemals von Map- oder Set-Iteration, Systemzeit oder Zufall abhängen.

Ein `supportScore` von 0 bedeutet keinen erkannten Unterstützungsbedarf. Solche Kandidaten werden vor jeder tieferen Rentabilitätsanalyse verworfen; regulärer rentabler Handel im Status `normal` bleibt davon unberührt.

## Historie jeder Klassifizierung

Jede Statusänderung speichert unveränderlich:

- `cityId`, `goodId`;
- Status vorher und nachher;
- Tick der Änderung;
- alle ausgewerteten Fensterwerte, die zur Änderung geführt haben;
- die konkret erfüllten beziehungsweise nicht mehr erfüllten Bedingungen;
- `supportScore` und seine fünf Bestandteile;
- `aiTradeShareBp`, `humanTradeShareBp` und `marketShareHeadroomUnits`.

Die Historie ist öffentlich auswertbar, enthält keine privaten Daten und ist die Grundlage der Erklärtexte in [`ai-transparency.md`](ai-transparency.md).

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `AI_ECONOMIC_METRIC_INVALID` | ungültiger Fensterwert |
| `AI_SHORTAGE_STATE_CONFLICT` | mehrdeutiger oder nicht auflösbarer Statuswechsel |
| `AI_SUPPORT_SCORE_OUT_OF_RANGE` | `supportScore` außerhalb 0–1.000 |

## Ausdrücklich ausgeschlossen

Private Vermögensanalyse einzelner Spieler, Vorhersage zukünftiger Orders, geheime Nachfrageboni, Eingriff allein wegen niedriger Preise, automatische Ressourcenbereitstellung bei Mangellage sowie jede Bevorzugung der KI im Matching.
