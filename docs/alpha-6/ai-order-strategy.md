# Alpha 6: KI-Orderstrategie und Orderpflege

## Grundsatz

KI-Handel findet ausschließlich über die vollständig gedeckten Alpha-5-Limit-Orders statt. Ein Handelshaus verwendet dieselben Endpunkte, dieselben Reservierungen, dieselbe Preis-Zeit-Priorität, dieselben Teilfüllungen, dieselben Gebühren und dieselbe Idempotenz wie ein Spieler.

Es gibt keine Market Order, keine Sonderpreise, keine garantierte Ausführung, keine Preisvorschau auf noch nicht veröffentlichte Orders und keine bevorzugte Matching-Priorität.

## Einheitliche Orderregeln

- Jede KI-Buy-Order ist vollständig durch verfügbares Gold des Handelshauses einschließlich der maximalen Käufergebühr gedeckt: `requiredReservation = maximumTradeValueMoneyUnits + ceil(maximumTradeValueMoneyUnits × 5 / 1000)`.
- Jede KI-Sell-Order ist vollständig durch freie, nicht reservierte Ware im Kontor des Handelshauses in derselben Stadt gedeckt.
- Ein Handelshaus benötigt für eine Order ein eigenes Kontor in dieser Stadt, genau wie ein Spieler.
- Die Eigenhandelssperre gilt je Kombination aus `ownerType` und `ownerId`: Ein Handelshaus handelt nie mit sich selbst. Zwei verschiedene Handelshäuser sind verschiedene Eigentümer und dürfen regulär miteinander handeln.
- Preis-Zeit-Priorität, Gebühren, Teilfüllungen und Ruf gelten unverändert nach [`../alpha-5/orders.md`](../alpha-5/orders.md) und [`../alpha-5/order-matching.md`](../alpha-5/order-matching.md).

Eine Order eines Handelshauses im Status `insolvent` ist ausschließlich als Sell Board über bereits vorhandene freie Ware zulässig.

## Preisgrenzen

Kostenbasis, Mindestverkaufspreis, maximaler Einkaufspreis, erwarteter Erlös und `expectedProfitScore` sind vollständig in [`cost-basis-and-profit.md`](cost-basis-and-profit.md) definiert und werden hier unverändert verwendet.

Kurzfassung:

- `minimumSellPriceGoldPerTon = max(1, ceil(variableCostGoldPerTon × marginPermille / 995))` mit `marginPermille` 1.100 / 1.050 / 1.000 je nach Versorgungslage;
- `maxBuyPriceGoldPerTon` ergibt sich aus erwartetem Nettoerlös, kalkulatorischen Transportkosten, Mindestzielgewinn und Käufergebühr;
- ein Limitpreis ist immer mindestens 1 Gold je Tonne.

## Ordermenge

Die Menge einer neuen Order ist das Minimum aus allen folgenden Grenzen:

| Grenze | Bedeutung |
|---|---|
| finanzierbare Menge | vollständig reservierbar aus verfügbarem Gold einschließlich maximaler Käufergebühr |
| Lager- beziehungsweise Flottenkapazität | freie, nicht reservierte Zielkapazität |
| erwartete Nachfrage | erwartete abnehmbare Menge der nächsten 24 Ticks am Zielort |
| Marktanteilsziel | `marketShareHeadroomUnits` nach [`shortage-and-intervention.md`](shortage-and-intervention.md) |
| verfügbares Angebot | tatsächlich angebotene Gegenmenge innerhalb der Preisgrenze |
| Kapitalgrenze | höchstens 25 % des verfügbaren KI-Goldes je einzelner Handelsentscheidung |

Die Kapitalgrenze lautet exakt:

`maxCapitalPerDecisionMoneyUnits = floor(availableMoneyUnits × 25 / 100)`

Bei `critical_shortage` entfällt ausschließlich die Marktanteilsgrenze. Alle übrigen Grenzen, insbesondere Deckung, Kapazität, Kapitalgrenze und Liquiditätsreserve, bleiben vollständig bestehen.

Unterschreitet die resultierende Menge 0,01 t, also eine Mengeneinheit, entsteht keine Order und die Option wird mit dem zutreffenden `reasonCode` abgelehnt.

## Sofortige und ruhende Orders

- Existiert eine passende Gegenorder, darf die KI einen Limitpreis wählen, der eine sofortige Ausführung ermöglicht. Sie verwendet dafür trotzdem eine vollständig gedeckte Limit Order.
- Der Limitpreis bleibt an die Preisgrenzen gebunden: Ein Buy überschreitet nie `maxBuyPriceGoldPerTon`, ein Sell unterschreitet nie `minimumSellPriceGoldPerTon`.
- Existiert keine passende Gegenorder, bleibt die Order als reguläre ruhende Order offen.
- Es gibt keine unlimitierte Market Order, keine garantierte Ausführung und keine Umgehung des Buches.

Es gilt weiterhin der Preis der ruhenden Order. Eine sofort ausführbare KI-Order erhält damit denselben Preisvorteil oder -nachteil wie eine Spielerorder in derselben Lage.

## Orderpflege

Jeder taktische 6-Tick-Zyklus prüft alle offenen Orders eines Handelshauses in aufsteigender `orderId`-Reihenfolge.

Eine Order wird storniert oder ersetzt, wenn mindestens eine Bedingung gilt:

1. der Limitpreis ist nicht mehr kostendeckend, weil sich die Kostenbasis oder die Versorgungslage geändert hat;
2. die Zielnachfrage ist entfallen;
3. Ware oder Gold werden für eine höher priorisierte Verpflichtung benötigt, insbesondere für Löhne oder eine laufende Logistikverpflichtung;
4. die Order ist seit mindestens 24 Ticks ohne jede Ausführung offen **und** der Markt hat sich wesentlich verändert;
5. für die Stadt-Ware-Kombination wurde `player_supplied` erreicht.

Der Markt gilt als wesentlich verändert, wenn sich seit der Ordererstellung der beste Gegenpreis um mindestens 10 % verändert hat, der Versorgungsstatus gewechselt ist oder `marketShareHeadroomUnits` auf null gefallen ist.

### Grenzen der Orderpflege

- Eine Order wird höchstens einmal je 6-Tick-Zyklus ersetzt.
- Eine Ersetzung ist die reguläre atomare Cancel-and-Replace-Aktion aus Alpha 5 und verliert dabei immer die Zeitpriorität.
- Ein Storno gibt ausschließlich die Restreservierung frei; ausgeführte Teilmengen, Gebühren und Executions bleiben unverändert.
- Ordererstellungen, -ersetzungen und -stornierungen zählen gemeinsam gegen das Entscheidungsbudget des Zyklus.

Damit ist Orderspam ausgeschlossen: Die KI kann eine Preisstufe nicht schneller verändern, als ein Spieler es könnte, und verliert bei jeder Änderung ihre Zeitpriorität.

## Rückzug

Bei `player_supplied` erstellt das Handelshaus keine neuen Sell Orders für diese Stadt-Ware-Kombination. Bereits offene rentable Orders laufen regulär aus oder werden ausgeführt; sie werden nicht vorzeitig zurückgezogen und nicht unterboten. Eine künstliche Preisunterbietung zur Marktverteidigung ist ausgeschlossen.

## Entscheidungsprotokoll je Order

Zusätzlich zu den Pflichtfeldern aus [`ai-transparency.md`](ai-transparency.md) speichert jede erstellte, ersetzte oder verworfene Order:

- `costPerUnitMoneyUnits` und `variableCostGoldPerTon` zum Entscheidungszeitpunkt;
- erwarteter Verkaufspreis und dessen Quelle 1 bis 4;
- erwartete Käufer- und Verkäufergebühr;
- zugerechnete kalkulatorische Transportkosten;
- angewandte `marginPermille` und `profitPermille`;
- berechneter `minimumSellPriceGoldPerTon` beziehungsweise `maxBuyPriceGoldPerTon`;
- gewählter Limitpreis;
- gewählte Menge und die konkret bindende Mengengrenze;
- `supportScore`, `expectedProfitMoneyUnits` und `expectedProfitScore`;
- bei Nichtentstehung der zutreffende `reasonCode`.

Die bindende Mengengrenze wird als eigener Wert festgehalten, damit im Debugbetrieb ohne Nachrechnen erkennbar ist, ob Kapital, Kapazität, Nachfrage, Marktanteil oder Angebot limitiert hat.

## Invarianten

- Jede KI-Order ist zum Zeitpunkt ihrer Erstellung vollständig gedeckt; eine ungedeckte KI-Order ist ein technischer Fehler und rollt den Tick zurück.
- Kein planmäßiger KI-Verkauf liegt unter den vollständigen variablen Kosten.
- Eine einzelne Handelsentscheidung bindet höchstens 25 % des verfügbaren Goldes.
- Die KI erzeugt weder Gold noch Ware; jede Ausführung verschiebt ausschließlich vorhandene Bestände.
- Eine Tickwiederholung erzeugt keine doppelte Order und keine doppelte Execution.
- Zwei identische Läufe erzeugen dieselben Orders, Preise, Mengen und IDs.

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `AI_COST_BASIS_INVALID` | ungültige Kostenbasis |
| `AI_ORDER_NOT_FULLY_COVERED` | Order wäre nicht vollständig gedeckt |
| `AI_ORDER_BELOW_COST` | Verkaufspreis unter dem Mindestverkaufspreis |
| `AI_ORDER_LIMIT_CALCULATION_FAILED` | Preisgrenze nicht ganzzahlig bestimmbar |
| `AI_ORDER_PLAN_STALE` | Entscheidungsgrundlage ist seit der Bewertung veraltet |

`AI_ORDER_PLAN_STALE` und eine nicht erreichte Marge sind reguläre fachliche Ablehnungen. `AI_ORDER_NOT_FULLY_COVERED` ist ein technischer Fehler.

## Ausdrücklich ausgeschlossen

Market Orders, Stop Orders, stadtübergreifende Orders, Leerverkäufe, Kreditfinanzierung, geheime Preisvorschau, garantierte Ausführung, koordinierte Preise mehrerer Handelshäuser, Verkauf unter Kosten zur künstlichen Stabilisierung sowie spekulative Derivate und Terminhandel.
