# Alpha 6: öffentliche Wirtschaftsbeobachtung

## Grundsatz

KI-Handelshäuser reagieren ausschließlich auf messbare, öffentliche Wirtschaftsergebnisse einer Stadt und Ware: unerfüllte Bevölkerungskäufe, fehlende Angebote, schwache menschliche Produktion und dauerhaft niedrige Versorgung. Sie reagieren niemals auf die private Lage eines einzelnen Spielers.

Alle Beobachtungswerte sind ganzzahlig, deterministisch und aus dem serverautoritativen Zustand ableitbar. Sie werden am Ende jedes Ticks aus bereits gebuchten Ergebnissen fortgeschrieben und nie geschätzt, geglättet oder aus Zufall gebildet. Dieselbe Ausgangswelt erzeugt dieselben Beobachtungswerte.

## Beobachtungsfenster

Für jede Kombination aus `cityId` und `goodId` führt der Server ein rollierendes Beobachtungsfenster. Je Tick werden festgehalten:

| Größe | Bedeutung |
|---|---|
| `coverageBp` | Bedarfsdeckung der Bevölkerung in Basispunkten 0–10.000 |
| `requiredQuantityUnits` | Sollmenge der Bevölkerungsnachfrage |
| `financeableQuantityUnits` | daraus finanzierbare Menge |
| `orderedQuantityUnits` | tatsächlich bestellte Menge |
| `executedQuantityUnits` | tatsächlich gekaufte Menge |
| `expiredPopulationUnits` | unerfüllt abgelaufene Bevölkerung-Buy-Menge |
| `openPopulationUnits` | offene Bevölkerung-Buy-Menge am Tickende |
| `bestBidGoldPerTon`, `bestAskGoldPerTon` | beste sichtbare Preise, `null` ohne Order |
| `openBuyUnits`, `openSellUnits` | verfügbare Ordermengen je Seite |
| `suppliedUnitsByOwnerType` | ausgeführtes Versorgungsvolumen je `player`, `ai`, `city`, `population` |
| `distinctHumanSellers` | Anzahl unterschiedlicher menschlicher Verkäufer |
| `humanProductionCapacityUnits`, `aiProductionCapacityUnits` | Kapazität aktiver Produktionsgebäude je Eigentümertyp |
| `wagesPaidMoneyUnits` | in der Stadt gezahlte Löhne |
| `unemploymentPermille`, `wealth` | Arbeitslosigkeit und Wohlstand der Stadt |
| `shortageDurationTicks` | Dauer der ununterbrochen bestehenden Mangellage |

Löhne, Arbeitslosigkeit und Wohlstand sind Stadtwerte und in jedem Stadt-Ware-Eintrag derselben Stadt identisch.

### Versorgungsvolumen

`suppliedUnitsByOwnerType` zählt je Execution die ausgeführte Menge **einmal** und ordnet sie dem `ownerType` der **Verkäuferseite** zu. Maßgeblich ist damit, wer die Ware tatsächlich in die Stadt geliefert hat. Käuferseitige Mengen werden nicht zusätzlich gezählt; eine Execution erhöht das Versorgungsvolumen genau um ihre Menge.

`totalSuppliedUnits` ist die Summe über alle Eigentümertypen.

### Verbindliche Auswertungsfenster

| Fenster | Zweck |
|---:|---|
| 12 Ticks | akute Lage |
| 72 Ticks | strukturelle Lage, Handelsanteile, Marktanteilsziel und Rückzug |
| 720 Ticks | langfristige Diagnose und Oberflächenanzeige, **nicht** für unmittelbare Entscheidungen |

Ein Fenster ist erst auswertbar, wenn mindestens so viele Ticks aufgezeichnet wurden, wie es umfasst. Ein Status, der `n` aufeinanderfolgende Ticks verlangt, kann daher frühestens im Tick `n` erreicht werden. Vor diesem Zeitpunkt gilt der Status `normal`.

Für ein Fenster über `n` Ticks gilt:

`averageCoverageBp(n) = floor(sum(coverageBp der letzten n Ticks) / n)`

Alle übrigen Fenstermittelwerte werden nach derselben abgerundeten Ganzzahlregel gebildet. Summen über ein Fenster sind exakte Ganzzahlsummen.

## Menschliche Wirtschaftsaktivität

Für Stadt, Ware und die letzten 72 Ticks gilt:

`humanTradeShareBp = floor(playerSuppliedUnits72 × 10.000 / totalSuppliedUnits72)`

Bei `totalSuppliedUnits72 = 0` ist der Anteil 0.

Getrennt erfasst und getrennt auswertbar bleiben:

- `playerSuppliedUnits72` – menschliches Verkaufsvolumen in Stadt- und Bevölkerungsnachfrage;
- `humanProductionCapacityUnits` – menschliche Produktionskapazität der betroffenen Ware in der Stadt;
- `distinctHumanSellers72` – Anzahl unterschiedlicher menschlicher Verkäufer im Fenster.

`distinctHumanSellers72` zählt verschiedene `ownerId`-Werte mit `ownerType = player`, die im Fenster mindestens eine Execution als Verkäufer hatten.

## Ausdrücklich keine Metrik

Nicht Bestandteil der Beobachtung sind und dürfen von keiner KI-Entscheidung gelesen werden:

- private Gold- oder Warenbestände einzelner Spieler;
- private Kontorbestände, Flottenladungen und Gebäudebestände fremder Akteure;
- geplante, aber noch nicht veröffentlichte Orders;
- interne Pläne, Scores oder Ablehnungsgründe anderer Handelshäuser;
- zukünftige Tickresultate.

Die Anonymisierung fremder Spieleridentitäten aus [`../alpha-5/api-contracts.md`](../alpha-5/api-contracts.md) bleibt vollständig erhalten: `distinctHumanSellers72` ist eine Anzahl, keine Identitätsliste.

## Erhebungszeitpunkt

Die Beobachtungsfenster werden genau einmal je Tick fortgeschrieben, nachdem Produktion, Konsumabschluss, Wohlstand, Werft, Stadtorders und Bevölkerungorders des Ticks vollständig gebucht sind, und bevor die taktische oder strategische KI-Planung desselben Ticks läuft. Alle Handelshäuser eines Ticks sehen damit dasselbe Fenster.

Eine Tickwiederholung schreibt das Fenster nicht doppelt fort. Ein zurückgerollter Tick lässt die Fenster vollständig unverändert.

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `AI_ECONOMIC_METRIC_INVALID` | Fensterwert außerhalb des zulässigen Bereichs, negativ oder nicht ganzzahlig |

Eine verletzte Metrikinvariante ist ein technischer Fehler und rollt den gesamten Tick zurück.
