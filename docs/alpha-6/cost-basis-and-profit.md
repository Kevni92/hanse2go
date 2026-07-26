# Alpha 6: Warenkostenbasis und Rentabilitätsrechnung

## Zweck

Ein Handelshaus darf nur dann verkaufen, wenn es weiß, was seine Ware tatsächlich gekostet hat. Dieses Dokument legt die verbindliche, verlustfreie und ganzzahlige Kostenbasis fest, auf der alle Preis-, Logistik- und Investitionsentscheidungen der Alpha-6-KI aufbauen.

Alle Beträge sind ganzzahlige `moneyUnits` zu 0,01 Gold. Gleitkomma wird weder berechnet noch gespeichert.

## Einheitenidentität

Eine Warenmengeneinheit ist 0,01 Tonnen, ein `moneyUnit` ist 0,01 Gold. Daraus folgt exakt:

`Kosten von 1 Mengeneinheit in moneyUnits = Kosten von 1 Tonne in Gold`

Ein `costPerUnitMoneyUnits` von 190 bedeutet damit zugleich 190 Gold je Tonne. Die Kostenbasis ist deshalb ohne Umrechnung direkt mit `limitPriceGoldPerTon` vergleichbar. Diese Identität wird in allen folgenden Formeln verwendet.

## Führung der Kostenbasis

Jedes KI-Kontor führt je Ware:

| Feld | Bedeutung |
|---|---|
| `costPerUnitMoneyUnits` | gewichtete durchschnittliche Stückkosten |
| `costRemainderMoneyUnits` | nicht auf ganze Stückkosten verteilbarer Rest |
| `totalUnits` | Bestand in Mengeneinheiten |

Für den Bestand gilt jederzeit exakt:

`gebundene Gesamtkosten = totalUnits × costPerUnitMoneyUnits + costRemainderMoneyUnits`

### Enthaltene Kosten

- tatsächlich gezahlter Einkaufspreis der Execution;
- tatsächlich gezahlte Käufergebühr;
- zuordenbare Produktionsinputkosten zur Kostenbasis der verbrauchten Inputs;
- tatsächlich gezahlte Löhne der erzeugenden Produktion;
- zuordenbare kalkulatorische Transportkosten nach dem Alpha-6-Logistikmodell.

### Nicht enthaltene Kosten

- Grundstücks- und Gebäudeanschaffungskosten;
- Konzessions- und Kontorbaukosten;
- Schiffskauf, Schiffsbau und Werftgebühren.

Diese Investitionen sind keine laufenden Stückkosten. Sie werden ausschließlich über die Amortisationsprüfungen der Investitions- und Schiffsplanung bewertet. Andernfalls würde eine einmalige Investition den Verkaufspreis dauerhaft verzerren.

## Zugang von Ware

Bei jedem Zugang mit `addedUnits` und `addedTotalCostMoneyUnits`:

```
totalCost      = totalUnits × costPerUnitMoneyUnits
                 + costRemainderMoneyUnits
                 + addedTotalCostMoneyUnits
newTotalUnits  = totalUnits + addedUnits
newCostPerUnit = floor(totalCost / newTotalUnits)
newRemainder   = totalCost - newCostPerUnit × newTotalUnits
```

`newRemainder` liegt immer im Bereich `0 <= newRemainder < newTotalUnits`. Es geht daher niemals Kosteninformation durch Rundung verloren, und die gebundenen Gesamtkosten bleiben exakt erhalten.

## Abgang von Ware

Ein Abgang von `removedUnits` reduziert den Bestand und die gebundenen Kosten proportional:

```
removedCost   = removedUnits × costPerUnitMoneyUnits
newTotalUnits = totalUnits - removedUnits
```

`costPerUnitMoneyUnits` bleibt unverändert; `costRemainderMoneyUnits` bleibt beim verbleibenden Bestand. Erreicht `newTotalUnits` den Wert 0, werden `costPerUnitMoneyUnits` und `costRemainderMoneyUnits` gemeinsam auf 0 gesetzt; der Rest ist dann realisierter Gewinn oder Verlust und wird als solcher protokolliert.

## Übergabe zwischen eigenen Inventaren

Ein Transfer vom Kontor in die eigene Flotte und von der Flotte in das Zielkontor überträgt die Kostenbasis mit der Ware. Die Flotte führt dafür dieselben drei Felder je Ware. Beim Entladen im Zielkontor werden die zugeordneten kalkulatorischen Transportkosten als `addedTotalCost` hinzugerechnet und gehen damit regulär in den gewichteten Durchschnitt ein.

Die kalkulatorischen Transportkosten sind in [`ai-logistics.md`](ai-logistics.md) verbindlich definiert:

`transportCostMoneyUnits = floor(routeDistanceKm × transportedQuantityUnits / 100)`

Sie erzeugen keine Ledgerbuchung und entfernen kein Gold aus dem Kreislauf. Sie erhöhen ausschließlich die Kostenbasis der transportierten Ware und damit deren Mindestverkaufspreis. Eine Ware, die dieselbe Strecke zweimal zurücklegt, trägt die Kosten beider Fahrten – die KI wird dadurch von sinnlosen Hin- und Rücktransporten abgehalten.

Ein Transfer erzeugt und vernichtet keine Kosten: Die Summe der gebundenen Gesamtkosten über alle Inventare eines Handelshauses ändert sich durch einen Transfer nicht, abgesehen von den ausdrücklich zugerechneten Transportkosten.

## Variable Kosten und Mindestverkaufspreis

Die variablen Kosten einer Ware entsprechen ihrer Kostenbasis:

`variableCostGoldPerTon = costPerUnitMoneyUnits`

Der Mindestverkaufspreis deckt zusätzlich die Zielmarge und die erwartete Verkäufergebühr:

`minimumSellPriceGoldPerTon = max(1, ceil(variableCostGoldPerTon × marginPermille / (1000 - sellerFeePermille)))`

Mit `sellerFeePermille = 5` lautet die ganzzahlige Form:

`minimumSellPriceGoldPerTon = max(1, floor((variableCostGoldPerTon × marginPermille + 994) / 995))`

| Lage | `marginPermille` | Zielmarge |
|---|---:|---:|
| regulär | 1.100 | 10 % |
| `acute_shortage` | 1.050 | 5 % |
| `critical_shortage` | 1.000 | 0 % |

Die Zielmarge sinkt niemals unter 0 %. Ein planmäßiger Verkauf unterhalb der vollständigen variablen Kosten ist in Alpha 6 ausgeschlossen. Bereits wertlose oder im Insolvenzfall gestrandete Restbestände dürfen erst durch ein späteres Liquidationssystem unter Kosten verkauft werden; Alpha 6 enthält kein solches System.

### Beispiel

Kostenbasis 190 `moneyUnits` je Einheit, also 190 Gold je Tonne, reguläre Marge:

`floor((190 × 1.100 + 994) / 995) = floor(209.994 / 995) = 211`

Bei 211 Gold je Tonne und 10,00 t beträgt der Bruttowert 2.110,00 Gold, die Verkäufergebühr `ceil(211.000 × 5 / 1.000) = 1.055` `moneyUnits` und der Nettoerlös 2.099,45 Gold gegenüber 1.900,00 Gold variablen Kosten. Die erzielte Marge liegt damit bei 10,5 % und niemals unter dem Ziel.

## Erwarteter Verkaufserlös

Für Zielstadt und Ware wird der erwartete erzielbare Preis in dieser Reihenfolge bestimmt; die erste zutreffende Quelle gilt:

1. vorhandene offene Bevölkerungs- oder Stadt-Buy-Orders mit ihrem tatsächlichen Limitpreis und ihrer offenen Menge;
2. beste fremde Buy Orders im lokalen Buch;
3. der mengengewichtete Median der realen Executions der letzten 72 Ticks, falls aktuell keine Buy Order existiert;
4. der Basispreis der Ware, ausschließlich als Bewertungsreferenz.

Der mengengewichtete Median ist deterministisch definiert: Alle Executions des Fensters werden aufsteigend nach `executionPriceGoldPerTon`, danach nach `executionId` lexikografisch sortiert; der Median ist der Preis der Execution, bei der die kumulierte Menge erstmals mindestens die Hälfte der Gesamtmenge erreicht.

Der Basispreis ist niemals ein garantierter Erlös. Ein Plan, dessen erwarteter Erlös ausschließlich aus Quelle 4 stammt, darf nur umgesetzt werden, wenn `structural_shortage` vorliegt **und** der geplante Mindestverkaufspreis innerhalb des aktuellen Bevölkerungspreislimits liegt.

## Maximaler Einkaufspreis

Gegeben sind die erwartete gelieferte Menge `Q` in Mengeneinheiten, der erwartete Verkaufspreis `S` in Gold je Tonne und die kalkulatorischen Transportkosten `T` in `moneyUnits`.

```
grossRevenue     = Q × S
sellerFee        = ceil(grossRevenue × sellerFeePermille / 1000)
netRevenue       = grossRevenue - sellerFee
budgetAfterProfit= floor(netRevenue × 1000 / (1000 + profitPermille))
purchaseBudget   = budgetAfterProfit - T
maxBuyPrice      = floor(purchaseBudget × 1000 / (Q × (1000 + buyerFeePermille)))
```

| Lage | `profitPermille` | Mindestzielgewinn |
|---|---:|---:|
| regulär | 100 | 10 % |
| `acute_shortage` | 50 | 5 % |
| `critical_shortage` | 0 | 0 % |

`buyerFeePermille` ist 5. Der Mindestzielgewinn wird niemals negativ. Ist `maxBuyPrice` kleiner als 1, entsteht keine Buy Order und die Option wird mit `margin_below_target` abgelehnt.

Der erwartete Warenverlust auf einer Reise ist in Alpha 6 exakt null.

Der so berechnete Preis ist eine Obergrenze für die Entscheidung. Die tatsächlich erstellte Order wird anschließend nach den regulären Alpha-5-Regeln mit der exakt aufgerundeten Käufergebühr vollständig reserviert. Reicht das verfügbare Gold für die volle Menge nicht, wird die Menge reduziert, nie die Deckung. Nach dem Kauf müssen Liquiditätsreserve und Lohndeckung nach [`ai-actors.md`](ai-actors.md) erhalten bleiben.

## Bewertung konkurrierender Chancen

Jede Handelschance erhält einen ganzzahligen Kapitaleffizienzwert:

`expectedProfitScore = floor(expectedProfitMoneyUnits × 1000 / max(capitalBoundMoneyUnits, 1))`

`capitalBoundMoneyUnits` ist das für die Dauer der Maßnahme gebundene Kapital, also Einkaufswert zuzüglich Käufergebühr. `expectedProfitMoneyUnits` ist der erwartete Nettoerlös abzüglich aller variablen Kosten, Gebühren und kalkulatorischen Transportkosten.

Die Auswahlreihenfolge ist verbindlich:

1. höherer `supportScore` der Zielstadt und Ware;
2. höherer `expectedProfitScore`;
3. kürzere erwartete Bindungsdauer in Ticks;
4. `targetCityId`, dann `goodId`, dann `sourceCityId` lexikografisch aufsteigend.

## Invarianten

- Die gebundenen Gesamtkosten eines Inventars sind jederzeit exakt `totalUnits × costPerUnitMoneyUnits + costRemainderMoneyUnits`.
- `0 <= costRemainderMoneyUnits < totalUnits`, bei `totalUnits = 0` ist der Rest 0.
- Ein Transfer zwischen eigenen Inventaren verändert die Summe der gebundenen Kosten nur um ausdrücklich zugerechnete Transportkosten.
- Die Kostenbasis ist niemals negativ.
- Kein planmäßiger Verkaufspreis liegt unter `minimumSellPriceGoldPerTon`.
- Kostenbasis und Rundungsreste beeinflussen weder die Geldmenge noch die Warenmenge; sie sind reine Bewertungsgrößen ohne Ledgerbuchung.

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `AI_COST_BASIS_INVALID` | negative Kostenbasis, ungültiger Rest oder verletzte Kostenidentität |
| `AI_ORDER_BELOW_COST` | geplanter Verkaufspreis unterschreitet den Mindestverkaufspreis |
| `AI_ORDER_LIMIT_CALCULATION_FAILED` | Preisgrenze konnte nicht ganzzahlig bestimmt werden |
