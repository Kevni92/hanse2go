# Alpha 6: KI-Produktion, Gebäudebau und Investitionsplanung

## Grundsatz

Ein Gebäude entsteht niemals als direkte Reaktion auf eine einzelne knappe Order. Ein Handelshaus versucht zuerst, vorhandene Ware, regulären Handel und bestehende eigene Produktion zu nutzen. Ein Neubau ist ausschließlich eine langfristige, vollständig finanzierte Maßnahme bei nachgewiesener struktureller oder kritischer Unterversorgung.

Alle Bau-, Konzessions-, Material- und Produktionsregeln der Spieler gelten unverändert. Es gibt keine kostenlose Konzession außerhalb der Heimatinitialisierung, keinen Produktionsbonus, keinen Startbestand, keine exklusive Arbeiterzuteilung und keine Subvention.

## Maßnahmenreihenfolge

Für eine Stadt-Ware-Kombination mit `supportScore > 0` prüft ein Handelshaus strikt in dieser Reihenfolge:

| Stufe | Maßnahme |
|---:|---|
| 1 | eigene vorhandene Ware in dieser Stadt regulär verkaufen |
| 2 | Ware aus einer anderen Stadt kaufen und über einen Logistikplan transportieren |
| 3 | Inputs bestehender eigener Produktionsgebäude beschaffen |
| 4 | Priorität bestehender eigener Gebäude anpassen |
| 5 | vorhandene eigene Produktionskapazität besser auslasten |
| 6 | neues Endproduktgebäude bauen |
| 7 | fehlende vorgelagerte Produktionsstufen ergänzen |
| 8 | zusätzliche Wohnhäuser bei nachgewiesenem Arbeitskräfte- und Wohnraummangel bauen |

Eine spätere Stufe wird nur geprüft, wenn die früheren Stufen die gemessene strukturelle Lücke voraussichtlich nicht ausreichend schließen. „Ausreichend“ heißt: Die erwartete zusätzliche Liefermenge der früheren Stufen deckt über die nächsten 24 Ticks mindestens die gemessene unerfüllte finanzierbare Nachfrage.

Die Stufen 1 bis 5 sind regulärer Betrieb und benötigen keinen Mangelstatus. Die Stufen 6 bis 8 sind Investitionen und unterliegen den vollständigen Investitionsvoraussetzungen.

## Investitionsplan

Jede potenzielle Investition besitzt einen `investmentPlan`:

| Feld | Bedeutung |
|---|---|
| `investmentPlanId` | deterministische ID `investment-<tick>-<actorId>-<sequence>` |
| `actorId`, `cityId`, `goodId`, `buildingTypeId` | Ziel der Investition |
| `requiredSteps` | benötigte Konzession, Kontor und Gebäudeschritte |
| `goldCostMoneyUnits`, `materialRequirements` | Gold- und Materialkosten |
| `expectedWorkers`, `expectedWagesPer24Ticks` | erwarteter Arbeits- und Lohnaufwand |
| `expectedInputs`, `expectedOutputs` | Rezeptmengen je Tick |
| `expectedSellPriceGoldPerTon`, `expectedSalesUnitsPer24Ticks` | erwarteter Absatz |
| `expectedContributionPer24Ticks` | erwarteter Deckungsbeitrag |
| `paybackTicks` | Amortisationsdauer |
| `supportScore` | Unterstützungswert der Zielstadt/Ware |
| `status` | `evaluating`, `awaiting_reputation`, `acquiring_materials`, `ready_to_build`, `built`, `cancelled` oder `failed` |
| `reasonCode` | Entscheidungs- beziehungsweise Ablehnungsgrund |
| `planVersion` | monotone Version |

Zulässige Übergänge sind `evaluating` → `awaiting_reputation` → `acquiring_materials` → `ready_to_build` → `built` sowie `cancelled` und `failed` aus jedem noch nicht gebauten Zustand. Fehlt keine Konzession, wird `awaiting_reputation` übersprungen. Jeder andere Übergang liefert `AI_PRODUCTION_PLAN_STATE_CONFLICT`.

## Investitionsvoraussetzungen

Ein Neubau ist nur zulässig, wenn **alle** Bedingungen gelten:

1. der Status der Stadt-Ware-Kombination ist `structural_shortage` oder `critical_shortage`;
2. für diese Kombination liegt kein `player_supplied` vor;
3. regulärer Handel kann die erwartete Lücke nicht günstiger schließen;
4. alle Gebäude- und Produktionsrezepte sind bekannt und konfiguriert;
5. die erforderlichen Inputs sind real beschaffbar oder durch weitere reguläre Investitionen herstellbar;
6. nach den vollständigen Goldkosten bleiben mindestens 25.000,00 Gold verfügbar;
7. die erwarteten Löhne der nächsten 24 Ticks sind zusätzlich vollständig finanzierbar;
8. dasselbe Handelshaus hat in den letzten 24 Ticks keine andere größere Investition begonnen;
9. `paybackTicks` beträgt höchstens 720;
10. das Handelshaus ist `active`.

Als größere Investition zählt jeder Kontorbau, Produktionsgebäudebau, Wohnhausbau, Schiffskauf und Schiffsbauauftrag. Die 24-Tick-Sperre ist damit gemeinsam mit der Schiffsplanung wirksam: Ein Handelshaus beginnt höchstens eine größere Investition je 24 Ticks, unabhängig von ihrer Art.

## Amortisationsrechnung

```
investmentCost = concessionCostIfNeeded
               + kontorCostIfNeeded
               + buildingGoldCost
               + expectedMaterialAcquisitionCost
               + expectedBuyerFees

expectedContributionPer24Ticks = expectedNetSalesRevenue
                               - expectedInputCosts
                               - expectedWages
                               - expectedSellerFees

paybackTicks = ceil(investmentCost × 24 / max(expectedContributionPer24Ticks, 1))
```

Alle Beträge sind ganzzahlige `moneyUnits`; die Division ist eine aufgerundete Ganzzahldivision.

- Kalkulatorische Transportkosten dürfen in `expectedInputCosts` einfließen.
- Ein `expectedContributionPer24Ticks` von null oder darunter führt zwingend zur Ablehnung mit `AI_INVESTMENT_NOT_PROFITABLE`. Der `max(..., 1)`-Schutz verhindert nur die Division durch null und macht eine unrentable Investition nicht zulässig.
- Basispreise sind ausschließlich Bewertungsreferenz. Erwartete Erlöse stammen aus realen Orders, Executions und Bevölkerungspreislimits nach [`cost-basis-and-profit.md`](cost-basis-and-profit.md).
- `paybackTicks > 720` führt zur Ablehnung mit `payback_too_long`.

## Ruf und Konzession

- Außerhalb der Heimatinitialisierung erhält ein Handelshaus **keine** kostenlose Konzession.
- In einer neuen Stadt muss es zuerst regulär nützliche Verkäufe ausführen und dadurch nach den unveränderten Alpha-2-Regeln Ruf aufbauen.
- Ab 80 Ruf kauft es die Konzession regulär für 10.000,00 Gold aus verfügbarem Gold; die Gebühr fließt an die Stadtkasse.
- Ohne Konzession ist kein Kontor-, Gebäude- und Wohnhausbau möglich.

Ein Plan im Status `awaiting_reputation` wartet auf den regulären Rufaufbau. Er blockiert die 24-Tick-Investitionssperre nicht, weil noch keine Kosten gebucht wurden.

## Kontorbau in einer neuen Stadt

- In jeder neuen Stadt ist ein eigenes Kontor Voraussetzung für jedes weitere Gebäude.
- Die Goldkosten von 5.000,00 Gold Grundstück und 5.000,00 Gold Bau gehen an die Stadtkasse.
- Die Baumaterialien werden **real** beschafft, transportiert und verbraucht.
- Es wird niemals Material automatisch aus einem Stadtbestand entnommen. Zulässige Quellen sind ausschließlich eine tatsächlich ausgeführte eigene Buy Order, eigene Produktion und eigener Transport.
- Der Bau verwendet ausschließlich verfügbare, nicht für Sell Orders reservierte Ware.

Die einmalige Direktzuteilung aus Stadtlagern gilt ausschließlich für die Heimatinitialisierung in [`start-state.md`](start-state.md) und wird hier nicht wiederholt.

## Materialquelle beim Bau

Ein Spieler baut aus dem Laderaum seiner aktiven Flotte. Ein Handelshaus besitzt keine aktive Flotte. Für die KI gilt deshalb:

- Existiert bereits ein eigenes Kontor in der Stadt, stammen alle Baumaterialien aus diesem Kontor.
- Für den ersten Bau einer Stadt, also das Kontor selbst, stammen die Materialien aus einer eigenen Flotte, die in diesem Hafen liegt und nicht reist.

Damit gilt für die KI dieselbe Grundregel wie für den Spieler: Material muss physisch am Bauort vorhanden und unreserviert sein. Ein Fernzugriff auf Bestände anderer Städte ist ausgeschlossen.

## Materialbeschaffung

- Fehlende Baumaterialien werden über vollständig gedeckte Buy Orders beschafft.
- Vorhandenes Material darf aus einem eigenen Kontor einer anderen Stadt über einen regulären Logistikplan transportiert werden.
- Ein Investitionsplan darf dieselbe Materialmenge nicht doppelt reservieren; eine reservierte Menge gehört genau einem Plan.
- Eine Teilbeschaffung bleibt höchstens 72 Ticks offen.
- Nach 72 Ticks wird die Rentabilität neu bewertet: Bleibt der Plan wirtschaftlich, läuft er weiter; andernfalls wird er abgebrochen und alle Restorders werden storniert. Bereits beschafftes Material bleibt regulärer Kontorbestand.

## Gebäudebau

- Der Bau verwendet exakt denselben serverautoritativen Fachbefehl wie beim Spieler.
- Gold und Materialien werden atomar verbraucht beziehungsweise an die Stadtkasse übertragen.
- Das Gebäude gehört anschließend konkret dem Handelshaus.
- Es erhält die Startpriorität `normal`, also Rang 3 von 5.
- Es gibt keinen Produktionsbonus, keinen Startbestand und keine verkürzte Bauzeit.

## Produktionsplanung

Je bestehendem eigenen Gebäude prüft ein Handelshaus in jedem Tick:

- frei verfügbare Inputs für mindestens den nächsten Tick;
- verfügbares Gold für die vollständigen Löhne des nächsten Ticks;
- aktuelle Arbeiterzuteilung und Auslastung;
- freie Kontorkapazität, soweit sie später begrenzt wird;
- offene eigene Sell Orders und den tatsächlichen Absatzbedarf.

Input-Buy-Orders decken höchstens den Bedarf der nächsten 24 Produktionsticks ab, abzüglich der bereits verfügbaren eigenen Inputs und der bereits bestellten, noch offenen Mengen:

`inputOrderUnits = max(0, requiredUnitsNext24Ticks - availableOwnUnits - openOrderedUnits)`

Damit entsteht kein Aufbau überdimensionierter Inputlager und keine dauerhafte Bindung von Gold in Vorräten.

## Gebäudeprioritäten

Die Priorität jedes eigenen Gebäudes wird alle 6 Ticks deterministisch neu bestimmt:

| Rang | ID | Bedingung |
|---:|---|---|
| 5 | `very_high` | Produktion behebt ein `critical_shortage` und Inputs sowie Löhne sind gesichert |
| 4 | `high` | `structural_shortage` oder wesentliche profitable Nachfrage |
| 3 | `normal` | normale rentable Produktion |
| 2 | `low` | geringe Nachfrage oder fehlende Inputs |
| 1 | `very_low` | `player_supplied`, unrentabel oder Liquiditätsschutz |

Die Prioritätsänderung verwendet denselben Fachbefehl wie beim Spieler und darf höchstens einmal je Gebäude und 6-Tick-Zyklus erfolgen. Wie beim Spieler wirkt sie erst im folgenden Tick, und der laufende Tick verwendet einen unveränderlichen Prioritätssnapshot.

Ein insolventes Handelshaus setzt alle eigenen Gebäude auf Rang 1.

## Wohnhäuser

Ein Wohnhausbau wird nur geprüft, wenn **alle** Bedingungen gelten:

- eine geplante oder bestehende rentable eigene Produktion liegt wegen fehlender lokaler Arbeiter dauerhaft unter 80 % Auslastung;
- der Wohnraum der Stadt ist seit mindestens 72 Ticks vollständig ausgelastet, also `freeHousing = 0`;
- der erwartete Nutzen rechtfertigt die Baukosten nach derselben Amortisationsrechnung, wobei der Nutzen der zusätzliche Deckungsbeitrag der dadurch besser ausgelasteten eigenen Produktion ist;
- die Liquiditätsreserve und die 24-Tick-Investitionsgrenze werden eingehalten.

Zusätzlicher Wohnraum ist nach [`../alpha-3/housing.md`](../alpha-3/housing.md) eine gemeinsame stadtweite Kapazität. Das Handelshaus erhält daraus keine exklusiven Bewohner und keine bevorzugte Arbeiterzuteilung; die Max-Min-Verteilung aus [`../alpha-3/workforce-allocation.md`](../alpha-3/workforce-allocation.md) bleibt unverändert. Ein Wohnhausbau kann daher auch Spielern und anderen Handelshäusern nützen – das ist gewollt.

## Rückzug bei `player_supplied`

- keine neuen Gebäude für diese Stadt-Ware-Kombination;
- Input-Orders werden auf den Bedarf der bestehenden, weiterhin rentablen Produktion begrenzt;
- die Gebäudepriorität darf auf Rang 1 sinken;
- Gebäude werden in Alpha 6 weder abgerissen, verkauft noch aufgewertet;
- vorhandene Outputs werden weiterhin mindestens kostendeckend verkauft.

## Invarianten

- Kein Bau erzeugt Gold, Ware, Arbeiter oder Wohnraum ungedeckt.
- Jede verbaute Materialmenge stammt aus einem real vorhandenen, unreservierten eigenen Bestand am Bauort.
- Die Gesamtgeldmenge bleibt bei Konzession, Grundstück, Bau und Materialbeschaffung exakt konstant.
- Ein Handelshaus beginnt höchstens eine größere Investition je 24 Ticks.
- Eine Materialmenge ist höchstens einem Investitionsplan zugeordnet.
- Eine Gebäudepriorität ändert sich höchstens einmal je 6 Ticks.
- Eine Tickwiederholung erzeugt kein zweites Gebäude und keine doppelte Materialbuchung.

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `AI_INVESTMENT_NOT_PROFITABLE` | Deckungsbeitrag null oder negativ, oder `paybackTicks > 720` |
| `AI_INVESTMENT_LIQUIDITY_INSUFFICIENT` | Liquiditätsreserve oder Lohndeckung würde unterschritten |
| `AI_INVESTMENT_RATE_LIMITED` | andere größere Investition in den letzten 24 Ticks begonnen |
| `AI_BUILD_REQUIREMENTS_MISSING` | Konzession, Kontor, Rezept oder Material fehlt |
| `AI_BUILD_MATERIAL_RESERVATION_CONFLICT` | Materialmenge ist bereits einem anderen Plan zugeordnet |
| `AI_PRODUCTION_PLAN_STATE_CONFLICT` | unzulässiger Statusübergang oder Versionskonflikt |

Fehlende Rentabilität, fehlende Liquidität und die Ratenbegrenzung sind reguläre fachliche Ablehnungen. Ein Materialreservierungskonflikt, der eine Doppelbuchung erzeugen würde, ist ein technischer Fehler und rollt den Tick zurück.

## Ausdrücklich ausgeschlossen

Kostenlose Konzessionen außerhalb des Startzustands, sofortiger Gebäudebau ohne reale Materialbeschaffung, Abriss, Verkauf und Aufwertung von Gebäuden, exklusive Arbeiterzuteilung an die KI, Subventionen, garantierte Absatzpreise sowie mehrere große Investitionen desselben Handelshauses innerhalb von 24 Ticks.
