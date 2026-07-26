# Alpha 6: KI-Logistik, Warenumladen und Handelsroutenentscheidung

## Grundsatz

Eine erkannte Versorgungslücke erzeugt niemals Ware am Zielort. Ein Handelshaus muss eine reale Bezugsquelle finden, die Ware über eine gedeckte Buy Order tatsächlich kaufen, sie aus dem Quellkontor in eine eigene Flotte laden, eine reale virtuelle Reise durchführen, am Ziel in das eigene Kontor entladen und sie dort über eine gedeckte Sell Order verkaufen.

Es gibt keinen Teleport, keinen direkten Kontor-zu-Kontor-Transfer zwischen Städten und keine abstrakte Warenbewegung.

Die vollständige Kette lautet:

`Buy Order → Ausführung → Quellkontor → Flotte → Reise → Zielkontor → Sell Order → Ausführung`

Nach jedem einzelnen Schritt gelten alle Gold-, Waren-, Kapazitäts-, Reservierungs- und Eigentumsinvarianten unverändert.

## Logistikplan

Jeder geplante Transport wird als `logisticsPlan` gespeichert:

| Feld | Bedeutung |
|---|---|
| `logisticsPlanId` | deterministische ID `logistics-<tick>-<actorId>-<sequence>` |
| `actorId` | planendes Handelshaus |
| `goodId` | transportierte Ware |
| `sourceCityId`, `targetCityId` | Quell- und Zielstadt |
| `requestedQuantityUnits` | gewünschte Menge |
| `acquiredQuantityUnits` | tatsächlich beschaffte Menge |
| `transportedQuantityUnits` | tatsächlich verladene und gereiste Menge |
| `soldQuantityUnits` | am Ziel bereits verkaufte Menge |
| `fleetId` | zugewiesene Flotte |
| `status` | siehe Lebenszyklus |
| `expectedCostMoneyUnits`, `expectedRevenueMoneyUnits`, `expectedMarginMoneyUnits` | Planwerte bei Entscheidung |
| `actualCostMoneyUnits`, `actualRevenueMoneyUnits`, `actualMarginMoneyUnits` | realisierte Werte |
| `supportScore`, `routeScore`, `reasonCode` | Entscheidungsgrundlage |
| `buyOrderIds`, `sellOrderIds`, `executionIds`, `transferIds`, `voyageId` | Referenzen auf reale Vorgänge |
| `planVersion` | monotone Version |
| `idempotencyKeys` | deterministische Schlüssel je Schritt |

## Lebenszyklus

| Status | Bedeutung |
|---|---|
| `planned` | bewertet und angenommen, noch keine Order erstellt |
| `awaiting_purchase` | Buy Order offen, wartet auf Ausführung |
| `ready_to_load` | Ware im Quellkontor verfügbar, Flotte zugewiesen |
| `traveling` | Ware verladen, Reise läuft |
| `ready_to_unload` | Flotte angekommen, Entladung steht aus |
| `selling` | Ware im Zielkontor, Sell Order offen |
| `completed` | Menge vollständig verkauft oder Rest bewusst eingelagert |
| `cancelled` | vor Abfahrt regulär abgebrochen |
| `failed` | Schritt endgültig nicht ausführbar |

Zulässig sind ausschließlich die Übergänge entlang dieser Reihenfolge sowie `cancelled` aus `planned`, `awaiting_purchase` und `ready_to_load`. Nach der Abfahrt ist kein Abbruch mehr möglich. Jeder andere Übergang wird mit `AI_LOGISTICS_PLAN_STATE_CONFLICT` abgelehnt.

## Bezugsquellen

Für eine Zielstadt und Ware ist eine Quellstadt zulässig, wenn **alle** Bedingungen gelten:

1. die Quelle besitzt eine fremde Sell Order innerhalb der Preisgrenze **oder** das Handelshaus besitzt dort eigene frei verfügbare Ware;
2. der erwartete Einkauf einschließlich Käufergebühr ist aus verfügbarem Gold vollständig finanzierbar, ohne Liquiditätsreserve oder Lohndeckung zu verletzen;
3. zwischen Quelle und Ziel existiert eine direkte Strecke;
4. die Zielnachfrage und der erwartete Verkaufspreis erlauben eine nichtnegative Marge nach [`cost-basis-and-profit.md`](cost-basis-and-profit.md);
5. an Quelle und Ziel existiert ein eigenes Kontor oder kann regulär errichtet werden.

Eigene bereits vorhandene Ware wird vor einem neuen Markteinkauf verwendet, sofern ihre Kostenbasis und der erwartete Zielverkauf wirtschaftlich sind. Das verhindert, dass ein Handelshaus Ware kauft, die es bereits besitzt.

## Auswahl der Quelle

Je Kandidat wird berechnet:

```
capitalBindingPenalty = floor(boundCapitalMoneyUnits × travelTicks / 240)
durationPenalty       = travelTicks × 100
routeScore            = expectedNetProfitMoneyUnits
                        - capitalBindingPenalty
                        - durationPenalty
```

Nur Kandidaten mit `expectedNetProfitMoneyUnits >= 0` sind zulässig. Regulär gilt zusätzlich die volle Zielmarge aus [`ai-order-strategy.md`](ai-order-strategy.md); erst bei `acute_shortage` beziehungsweise `critical_shortage` sinkt sie auf 5 % beziehungsweise 0 %.

Der höchste `routeScore` gewinnt. Bei Gleichstand entscheidet in dieser Reihenfolge: kürzere Reise in Ticks, dann `sourceCityId`, dann `fleetId` lexikografisch aufsteigend.

Beide Strafterme sind rein kalkulatorisch. Sie machen lange Reisen und hohe Kapitalbindung unattraktiver, ohne Gold zu bewegen.

## Flottenauswahl

Eine Flotte ist für einen Plan verfügbar, wenn:

- sie dem Handelshaus gehört;
- sie `in_port` im Quellhafen liegt;
- sie nicht reist und keinem anderen offenen Logistikplan zugeordnet ist;
- sie ausreichend freie Kapazität besitzt oder die Planmenge entsprechend reduziert werden kann;
- ihre vorhandene Ladung mit dem Plan vereinbar ist, also die Restkapazität nicht überschreitet.

Priorität in dieser Reihenfolge:

1. kleinste ausreichende freie Kapazität;
2. kürzeste Fahrzeit auf der geplanten Strecke;
3. niedrigste gebundene Schiffskapitalbewertung, bewertet mit dem neutralen Ankaufspreis der Schiffstypen;
4. `fleetId` lexikografisch aufsteigend.

Die kleinste ausreichende Flotte wird bevorzugt, damit große Flotten für große Transporte frei bleiben.

## Beschaffung

- Das Handelshaus erstellt eine reguläre, vollständig gedeckte Buy Order im Quellkontor.
- Nur tatsächlich ausgeführte Menge kann verladen werden. Eine offene Order ist keine Ware.
- Eine Teilfüllung reduziert den Plan auf die erworbene Menge oder lässt ihn bis höchstens 24 Ticks auf weitere Füllung warten.
- Nach 24 Ticks wird die Restorder storniert und der Plan mit der tatsächlich beschafften Menge fortgesetzt, sofern diese mindestens eine Mengeneinheit beträgt und der Plan mit dieser Menge weiterhin wirtschaftlich ist.
- Ohne beschaffte Menge wird der Plan mit `cancelled` und dem Grund `no_covered_supply` beendet; die Restreservierung wird vollständig freigegeben.

## Laden

- Ware wird ausschließlich über den regulären lokalen Transfer aus [`../alpha-4/fleet-cargo-and-transfers.md`](../alpha-4/fleet-cargo-and-transfers.md) vom Quellkontor in die zugewiesene Flotte bewegt.
- Die Transfermenge überschreitet niemals die freie Kapazität der Flotte.
- Für Sell Orders reservierte Kontorware ist kein zulässiger Transferbestand; verfügbare und reservierte Mengen werden getrennt geführt.
- Die Kostenbasis wird gemeinsam mit der Ware in den Flottenbestand übernommen.
- Nach erfolgreichem Laden startet die virtuelle Reise nach [`virtual-voyages.md`](virtual-voyages.md).

Laden und Abfahrt sind zwei getrennte Schritte. Scheitert die Abfahrt, bleibt die Ware geladen in der Flotte im Quellhafen und der Plan bleibt `ready_to_load`.

## Reise und Ankunft

- Die Reise verwendet ausschließlich die Mechanik aus [`virtual-voyages.md`](virtual-voyages.md).
- Während der Reise ist der Plan gesperrt: keine Mengenänderung, keine Flottenänderung, kein Abbruch.
- Bei Ankunft wird die Ware über einen regulären lokalen Transfer in das Zielkontor entladen.
- Zielkontor und Flottenbestand übernehmen dieselbe Kostenbasis zuzüglich der zugerechneten kalkulatorischen Transportkosten.
- Existiert am Ziel kein eigenes Kontor, bleibt die Ware in der Flotte im Hafen liegen, bis ein Kontor regulär errichtet wurde. Es entsteht kein Verlust und keine Zwangsabgabe.

## Kalkulatorische Transportkosten

Alpha 6 kennt weder Treibstoff noch Proviant noch Schiffsunterhalt. Für wirtschaftliche Entscheidungen wird ausschließlich eine kalkulatorische Größe verwendet:

`transportCostMoneyUnits = floor(routeDistanceKm × transportedQuantityUnits / 100)`

Das entspricht 1 `moneyUnit` je Kilometer und belegter Tonne. Eine Reise über 96 km mit 20,00 t, also 2.000 Mengeneinheiten, ergibt `floor(96 × 2.000 / 100) = 1.920` `moneyUnits` beziehungsweise 19,20 Gold.

Dieser Betrag wird ausdrücklich **nicht** als Gold aus dem Kreislauf entfernt und erzeugt **keine** Ledgerbuchung. Er ist ausschließlich ein Bestandteil der Kostenbasis und der Rentabilitätsrechnung und wird in Oberfläche und Protokoll klar als kalkulatorisch gekennzeichnet.

Die Gesamtgeldmenge bleibt durch Transportkosten exakt unverändert.

## Verkauf am Ziel

- Das Handelshaus erstellt eine vollständig gedeckte Sell Order aus dem Zielkontor.
- Der Mindestpreis folgt der Kostenbasis einschließlich Transportkosten und der Zielmarge aus [`cost-basis-and-profit.md`](cost-basis-and-profit.md).
- Die Ordermenge ist auf die vorhandene freie Zielware und auf `marketShareHeadroomUnits` begrenzt.
- Teilverkäufe reduzieren die offene Restmenge des Plans.
- Der Plan wird `completed`, sobald die transportierte Menge vollständig verkauft ist oder eine Restmenge bewusst im Zielkontor eingelagert bleibt. Eingelagerte Restware bleibt regulärer Bestand mit ihrer Kostenbasis und kann in einem späteren Zyklus erneut angeboten werden.

## Wiederverwendung der Flotte

Nach der Entladung:

- die Flotte bleibt `in_port` im Zielhafen;
- sie wird nicht automatisch leer zurückgeschickt;
- der nächste taktische 6-Tick-Zyklus darf ihr eine neue wirtschaftliche Route zuweisen;
- eine rentable Rückfracht wird gegenüber einer Leerfahrt bevorzugt, das heißt: existiert vom aktuellen Hafen aus ein zulässiger Plan mit `expectedNetProfit >= 0`, wird er einer Fahrt ohne Ladung vorgezogen.

Eine reine Leerfahrt ist nur zulässig, wenn sie Teil eines konkreten Plans mit nichtnegativem erwarteten Gewinn ist, das Schiff also am Zielhafen für eine bereits bewertete Ladung benötigt wird.

## Abbruchregeln

Vor der Abfahrt darf ein Plan abgebrochen werden, wenn:

- die Zielnachfrage entfallen ist;
- die Preisgrenze nicht mehr kostendeckend ist;
- die Buy Order nach 24 Ticks ungefüllt geblieben ist;
- die Flotte nicht mehr verfügbar ist;
- das Handelshaus nach `conserving` oder `insolvent` gewechselt ist.

Ein Abbruch storniert offene Orders des Plans, gibt ausschließlich deren Restreservierungen frei und lässt bereits gekaufte Ware als regulären Kontorbestand zurück.

Nach der Abfahrt wird die Reise niemals abgebrochen. Die Ware wird am Ziel entladen und anschließend mindestens kostendeckend angeboten oder eingelagert.

## Parallelität und Idempotenz

- Eine Flotte gehört zu jedem Zeitpunkt höchstens einem aktiven Logistikplan.
- Eine Warenmenge kann höchstens einmal verplant, reserviert oder verladen werden.
- Plan, Order, Transfer und Reise werden je Schritt atomar und idempotent ausgeführt; jeder Schritt besitzt einen deterministischen Idempotenzschlüssel `ai-<tick>-<actorId>-<planId>-<step>`.
- Konkurrierende KI-Buy-Orders auf dieselbe Ware kaufen zusammen höchstens die tatsächlich vorhandene angebotene Menge.
- Ein Fehler in einem Schritt erzeugt weder zusätzliche Ware noch verlorenen Besitz und rollt den betroffenen Schritt vollständig zurück.
- Eine Tickwiederholung erzeugt keinen doppelten Kauf, keinen doppelten Transfer, keine doppelte Reise und keinen doppelten Verkauf.

## Invarianten

- Nur tatsächlich gekaufte und tatsächlich verladene Ware wird transportiert.
- Es existiert kein Weg, Ware zwischen zwei Städten zu bewegen, ohne eine Flotte und eine Reise.
- Die Summe aller Warenmengen einer Ware bleibt über die gesamte Kette konstant.
- Die Gesamtgeldmenge bleibt über die gesamte Kette konstant; kalkulatorische Transportkosten bewegen kein Gold.
- Die Kostenbasis bleibt über Kauf, Quellkontor, Flotte und Zielkontor lückenlos nachvollziehbar.
- Keine Flotte gehört gleichzeitig zwei aktiven Plänen an.

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `AI_LOGISTICS_SOURCE_NOT_FOUND` | keine zulässige Bezugsquelle |
| `AI_LOGISTICS_FLEET_NOT_AVAILABLE` | keine verfügbare Flotte im Quellhafen |
| `AI_LOGISTICS_CAPACITY_INSUFFICIENT` | freie Kapazität reicht auch nach Mengenreduktion nicht |
| `AI_LOGISTICS_PLAN_STATE_CONFLICT` | unzulässiger Statusübergang oder Versionskonflikt |
| `AI_LOGISTICS_MARGIN_NO_LONGER_VALID` | Marge ist seit der Bewertung entfallen |
| `AI_LOGISTICS_TRANSFER_FAILED` | lokaler Transfer nicht ausführbar |

Fehlende Quelle, fehlende Flotte, fehlende Kapazität und entfallene Marge sind reguläre fachliche Ablehnungen mit protokolliertem Grund. Ein fehlgeschlagener Transfer oder ein Zustandskonflikt, der eine Invariante verletzen würde, ist ein technischer Fehler und rollt den Tick zurück.

## Ausdrücklich ausgeschlossen

Kontinuierliche Rundrouten, Mehrzielreisen, Zwischenstopps, automatische Warenaufteilung auf mehrere Flotten innerhalb eines Plans, Flottenmiete, fremde Transportdienstleister, reale Treibstoff-, Proviant- oder Unterhaltszahlungen sowie jeder Teleport zwischen Kontoren.
