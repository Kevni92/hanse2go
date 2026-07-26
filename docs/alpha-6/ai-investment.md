# Alpha 6: gemeinsame Investitionsregeln der Handelshäuser

Dieses Dokument fasst die für **alle** Investitionsarten gemeinsam geltenden Grenzen zusammen. Die art-spezifischen Regeln stehen in [`ai-production-and-investment.md`](ai-production-and-investment.md) für Konzession, Kontor, Produktionsgebäude und Wohnhäuser sowie in [`ai-ships-and-fleets.md`](ai-ships-and-fleets.md) für Schiffskauf und Schiffsbau.

Bei einem Widerspruch gilt dieses Dokument für die gemeinsamen Grenzen und das jeweilige Fachdokument für die art-spezifischen Bedingungen.

## Was als größere Investition zählt

| Vorgang | größere Investition |
|---|---|
| Kauf einer Baukonzession | ja |
| Bau eines Kontors | ja |
| Bau eines Produktionsgebäudes | ja |
| Bau eines Wohnhauses | ja |
| Kauf eines Schiffes | ja |
| Erteilung eines Schiffsbauauftrags | ja |
| Erstellung einer Buy Order für Handelsware | nein |
| Erstellung einer Buy Order für Produktionsinputs | nein |
| Erstellung einer Buy Order für Baumaterialien | nein |
| Anlegen einer Flotte oder Zuweisen eines Schiffes | nein |
| Start einer Reise | nein |

Materialbeschaffung ist bewusst keine größere Investition. Andernfalls könnte ein Handelshaus die Materialien für ein bereits genehmigtes Bauvorhaben nicht innerhalb der Sperrfrist beschaffen.

## Gemeinsame Grenzen

| Grenze | Wert |
|---|---|
| Liquiditätsreserve nach der Investition | mindestens 25.000,00 Gold verfügbar |
| zusätzliche Lohndeckung | Löhne der nächsten 24 Ticks vollständig finanzierbar |
| Investitionsrate | höchstens eine größere Investition je Handelshaus und 24 Ticks |
| Schiffsrate | zusätzlich höchstens ein neues Schiff je Handelshaus und 72 Ticks |
| Amortisation Gebäude und Wohnhäuser | höchstens 720 Ticks |
| Amortisation Schiffe | höchstens 1.440 Ticks |
| Status | ausschließlich im Status `active` |

Die Investitionsrate gilt **art-übergreifend**: Ein Handelshaus, das in Tick 100 ein Produktionsgebäude beginnt, darf frühestens in Tick 124 ein Schiff kaufen. Die Schiffsrate wirkt zusätzlich und ist strenger.

Maßgeblich für den Beginn ist der Tick der ersten gebuchten Kostenposition, nicht der Tick der Bewertung. Ein Plan, der nur bewertet oder auf Ruf gewartet hat, blockiert die Sperre nicht.

## Gemeinsame Amortisationsform

```
paybackTicks = ceil(investmentCost × 24 / max(expectedContributionPer24Ticks, 1))
```

Der `max(..., 1)`-Schutz verhindert ausschließlich die Division durch null. Ein `expectedContributionPer24Ticks` von null oder darunter führt in **jeder** Investitionsart zwingend zur Ablehnung.

Nicht in `investmentCost` enthalten sind laufende Warenstückkosten; nicht in der Warenkostenbasis enthalten sind Investitionskosten. Die Trennung steht in [`cost-basis-and-profit.md`](cost-basis-and-profit.md) und verhindert, dass eine Investition über den Warenpreis refinanziert wird.

## Auswahl bei konkurrierenden Investitionsarten

Stehen im selben strategischen Zyklus ein Gebäude- und ein Schiffskandidat zur Wahl, entscheidet:

1. höherer `supportScore` der zugrunde liegenden Mangellage; ein Schiffsplan erbt den höchsten `supportScore` der Logistikpläne, die er ermöglichen würde;
2. kürzere `paybackTicks`;
3. geringere `investmentCost`;
4. `building` vor `ship` als stabiler Typvergleich, danach `cityId`, `goodId` beziehungsweise `shipTypeId` lexikografisch aufsteigend.

Höchstens ein Kandidat wird gewählt. Alle übrigen werden mit `decision_budget_exhausted` protokolliert und im nächsten Zyklus neu bewertet.

## Invarianten

- In keinem Tick beginnt ein Handelshaus mehr als eine größere Investition.
- Zwischen zwei begonnenen größeren Investitionen desselben Handelshauses liegen mindestens 24 Ticks.
- Zwischen zwei Schiffsanschaffungen desselben Handelshauses liegen mindestens 72 Ticks.
- Nach jeder Investition sind Liquiditätsreserve und Lohndeckung erfüllt.
- Keine Investition erzeugt Gold, Ware, Schiffe, Gebäude oder Wohnraum ungedeckt.
- Eine abgelehnte Investition verändert keinen Zustand und ist mit genau einem `reasonCode` protokolliert.
