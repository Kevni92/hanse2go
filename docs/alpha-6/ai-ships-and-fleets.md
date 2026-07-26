# Alpha 6: KI-Schiffskauf, Schiffsbau und Flottenplanung

## Grundsatz

Ein Transportengpass wird niemals durch eine abstrakte Kapazitätserhöhung gelöst. Ein Handelshaus muss ein konkretes vorhandenes Schiff regulär kaufen oder einen vollständig finanzierten regulären Schiffsbauauftrag erteilen.

Jedes Schiff bleibt dieselbe dauerhafte Alpha-4-Entität. Ein Kauf oder Verkauf erzeugt und löscht niemals ein Schiff; nur ein abgeschlossener Bauauftrag erzeugt genau eine neue Entität. Es gibt keine kostenlosen Schiffe, keine bevorzugte Werftposition, kein Leasing und keine Verschrottung.

## Kapazitätsbeobachtung

Je Handelshaus werden über 72 Ticks erfasst:

| Größe | Bedeutung |
|---|---|
| `totalCapacityUnits` | Summe der Kapazitäten aller eigenen Flotten |
| `occupiedCapacityUnits` | tatsächlich belegte Kapazität |
| `rejectedProfitablePlanUnits` | Menge rentabler Logistikpläne, die mangels Flotte oder Kapazität abgelehnt wurden |
| `waitingTransportableUnits` | Summe wartender transportierbarer Mengen |
| `fleetTravelTicks`, `fleetUtilisationBp` | Reisezeit und Auslastung je Flotte |
| `highUtilisationTicks` | Anzahl Ticks mit mindestens 80 % gebundener Gesamtkapazität |

Ein `transport_capacity_shortage` liegt vor, wenn für mindestens 72 aufeinanderfolgende Ticks **beide** Bedingungen gelten:

- die durchschnittliche Kapazitätsbindung beträgt mindestens 80 %, also `floor(sum(occupiedCapacityUnits) × 10.000 / sum(totalCapacityUnits)) >= 8.000`;
- rentable Logistikpläne mit insgesamt mindestens 6.000 Mengeneinheiten, also 60,00 t, wurden wegen fehlender Kapazität abgelehnt.

Ein Handelshaus ohne jede Flotte hat `totalCapacityUnits = 0`. Für dieses ist die erste Bedingung ab dem ersten abgelehnten rentablen Plan erfüllt, damit ein Handelshaus, das sein letztes Schiff verloren hat, nicht dauerhaft handlungsunfähig bleibt.

## Investitionsgrenzen

Ein neues Schiff darf nur geplant werden, wenn **alle** Bedingungen gelten:

1. das Handelshaus ist `active`;
2. nach Kauf beziehungsweise vollständigem Bauauftrag bleiben mindestens 25.000,00 Gold verfügbar;
3. die Löhne der nächsten 24 Ticks bleiben vollständig gedeckt;
4. dasselbe Handelshaus hat in den letzten 24 Ticks keine andere größere Investition begonnen;
5. die erwarteten zusätzlichen Transportgewinne amortisieren die Investition innerhalb von höchstens 1.440 Ticks;
6. es existiert keine ausreichend große ungenutzte eigene Flotte, die den Bedarf bereits decken könnte;
7. `transport_capacity_shortage` ist bestätigt.

Zusätzlich gilt: **höchstens ein neues Schiff je Handelshaus und 72 Ticks** darf gekauft oder beauftragt werden. Diese Sperre wirkt zusätzlich zur allgemeinen 24-Tick-Investitionssperre aus [`ai-production-and-investment.md`](ai-production-and-investment.md), die Gebäude und Schiffe gemeinsam begrenzt.

Die Amortisation verwendet dieselbe Rechnung wie bei Gebäuden, mit 1.440 statt 720 Ticks als Obergrenze:

`paybackTicks = ceil(shipInvestmentCost × 24 / max(expectedAdditionalContributionPer24Ticks, 1))`

`expectedAdditionalContributionPer24Ticks` ist der erwartete Deckungsbeitrag genau der Logistikpläne, die bisher mangels Kapazität abgelehnt wurden. Ein Wert von null oder darunter führt zur Ablehnung.

## Kauf vor Neubau

Ein Handelshaus prüft zuerst konkrete vorhandene Schiffe im lokalen Hafenmarkt. Ein Schiff ist kaufbar, wenn:

- es real als neutrale beziehungsweise städtische Schiffsentität unzugeordnet im Hafen angeboten wird;
- die Eigentums- und Kassenregeln aus Alpha 4 und Alpha 5 konsistent sind;
- der Kaufpreis vollständig aus verfügbarem Gold gedeckt ist;
- der Schiffstyp den Kapazitätsbedarf sinnvoll deckt;
- die Investitionsgrenzen eingehalten werden.

Der Kauf verwendet denselben Fachbefehl, dieselbe `shipMarketVersion` und dieselbe Eigentumsübertragung wie beim Spieler. Der Kaufpreis geht an die Stadtkasse des Hafens; `shipId`, `customName`, `shipTypeId`, `originType`, `originCityId` und `createdAtTick` bleiben unverändert.

Die Alpha-4-Voraussetzung „aktive Flotte erreicht den Hafen“ wird für Handelshäuser durch ein eigenes Kontor beziehungsweise eine dort liegende eigene Flotte ersetzt. Alle übrigen Kaufvoraussetzungen gelten unverändert.

Ein Kauf erzeugt kein Schiff.

## Auswahl des Schiffstyps

Für jeden verfügbaren Schiffstyp wird ein ganzzahliger Nutzwert berechnet:

```
capacityBenefit       = min(requiredAdditionalCapacityUnits, shipCapacityUnits)
speedBenefit          = virtualSpeed × 1000
capitalCostPenalty    = floor(investmentCostMoneyUnits / 100)
excessCapacityPenalty = max(shipCapacityUnits - requiredAdditionalCapacityUnits, 0) × 10

shipUtilityScore = capacityBenefit × 100
                 + speedBenefit
                 - capitalCostPenalty
                 - excessCapacityPenalty
```

Alle Divisionen sind abgerundete Ganzzahldivisionen. `investmentCostMoneyUnits` ist der tatsächliche Kaufpreis beziehungsweise die vollständigen Baukosten aus Werftgebühr und bewerteten Materialien.

Der höchste Score gewinnt. Bei Gleichstand entscheidet in dieser Reihenfolge: geringerer Gesamtpreis, höhere Geschwindigkeit, kleinere `shipTypeId` lexikografisch.

### Referenzwerte beim Kauf zum neutralen Preis

| benötigte Zusatzkapazität | Pinasse | Schnigge | Flöte | Kraweel |
|---|---:|---:|---:|---:|
| 60,00 t | **592.000** | 538.000 | 358.000 | 172.000 |
| 150,00 t | 592.000 | 978.000 | **1.348.000** | 1.162.000 |
| 250,00 t | 592.000 | 978.000 | **2.448.000** | 2.262.000 |

Die Formel wählt damit erwartungsgemäß das kleinste Schiff, das den Bedarf deckt, und vermeidet teure Überkapazität. Die Kraweel gewinnt nie gegen die Flöte, solange der Bedarf 250,00 t nicht deutlich übersteigt.

## Schiffsbau

Existiert kein geeignetes kaufbares Schiff, darf ein Handelshaus einen regulären Schiffsbauauftrag erteilen. Voraussetzungen:

- eigenes Kontor in der Werftstadt;
- vollständige Werftgebühr aus verfügbarem Gold;
- alle Baumaterialien real, unreserviert und vollständig im lokalen Kontor;
- die Materialien wurden regulär produziert, gekauft oder transportiert;
- Werftwarteschlange und Bauzeit werden unverändert akzeptiert;
- die Investition bleibt nach der erwarteten Fertigstellung wirtschaftlich.

Der Auftrag verwendet exakt die Alpha-4-Regeln aus [`../alpha-4/shipbuilding.md`](../alpha-4/shipbuilding.md):

- Werftgebühr und alle Materialien werden bei Auftragserteilung sofort verbraucht beziehungsweise übertragen;
- zunächst entsteht kein Schiff;
- genau eine Schiffsentität entsteht bei Fertigstellung im Tick;
- die FIFO-Reihenfolge gilt unverändert; ein Handelshaus erhält keine bevorzugte Werftposition und kann sie nicht erkaufen;
- es gibt keinen Abbruch und keine Rückerstattung.

### Kosten und Bauzeiten

| Schiffstyp | Werftgebühr | Holz | Bretter | Stoff | Werkzeug | Eisen | Bauzeit |
|---|---:|---:|---:|---:|---:|---:|---:|
| Pinasse | 5.000 Gold | 40,00 t | 20,00 t | 10,00 t | 5,00 t | – | 6 Ticks |
| Schnigge | 8.000 Gold | 70,00 t | 40,00 t | 15,00 t | 8,00 t | – | 12 Ticks |
| Flöte | 15.000 Gold | 130,00 t | 80,00 t | 30,00 t | 15,00 t | – | 24 Ticks |
| Kraweel | 25.000 Gold | 200,00 t | 120,00 t | 40,00 t | 25,00 t | 20,00 t | 36 Ticks |

Alpha 6 verändert keinen dieser Werte.

## Schiffsanschaffungsplan

Ein `shipAcquisitionPlan` besitzt mindestens `shipAcquisitionPlanId`, `actorId`, `cityId`, `shipTypeId`, `acquisitionType` (`purchase` oder `build`), `requiredAdditionalCapacityUnits`, `shipUtilityScore`, `investmentCostMoneyUnits`, `paybackTicks`, Materialbedarf und -deckung, `buildOrderId` nach Auftragserteilung, `resultShipId` nach Fertigstellung, `reasonCode` und `planVersion`.

| Status | Bedeutung |
|---|---|
| `evaluating` | Engpass bestätigt, Optionen werden bewertet |
| `acquiring_materials` | Schiffbaumaterialien werden regulär beschafft |
| `queued` | Bauauftrag erteilt, wartet in der Werftwarteschlange |
| `building` | Auftrag hat den Bauplatz belegt |
| `completed` | Schiff gekauft oder fertiggestellt und einer Flotte zugeordnet |
| `cancelled` | vor Kostenbuchung regulär abgebrochen |
| `failed` | endgültig nicht ausführbar |

Ein Kaufplan springt von `evaluating` direkt auf `completed`. Materialorders bleiben höchstens 72 Ticks offen; danach werden Kosten und Nutzen neu bewertet. Eine ungedeckte Teilbeauftragung der Werft ist ausgeschlossen: Der Auftrag wird erst erteilt, wenn Gebühr und **alle** Materialien vollständig vorhanden sind.

## Flottenbildung

Nach Kauf oder Fertigstellung liegt das Schiff unzugeordnet im Hafen. Das Handelshaus entscheidet deterministisch:

- **vorhandene Flotte bevorzugen**, wenn das Schiff dadurch einen bereits geplanten Transport ohne nennenswerte Überkapazität ermöglicht und die Flotte im selben Hafen liegt und nicht reist;
- **neue Flotte anlegen**, wenn parallele Reisen benötigt werden oder alle bestehenden Flotten an anderen Häfen gebunden oder unterwegs sind.

Jede Flotte enthält mindestens ein konkretes Schiff. Eine KI-Flotte ohne Schiff existiert nicht. Die Flottenbildung verwendet dieselben Alpha-4-Fachbefehle wie beim Spieler; der geforderte lokale Nachweis ist das eigene Kontor beziehungsweise eine eigene Flotte im selben Hafen.

## Flottenzusammensetzung

- Die Kapazität einer Flotte ist die Summe der Schiffskapazitäten.
- Ihre Geschwindigkeit ist die des langsamsten Schiffes.
- Ein langsameres Schiff wird nur hinzugefügt, wenn der zusätzliche Kapazitätsnutzen die verlängerte Reisezeit rechtfertigt: Der `routeScore` des geplanten Transports muss mit dem zusätzlichen Schiff höher sein als ohne.
- Das Entfernen eines Schiffes ist nur zulässig, wenn die Restkapazität die vorhandene Ladung weiterhin trägt.
- Eine reisende Flotte kann nicht verändert werden.

## Ungenutzte Schiffe und Verkauf

Ein Schiff gilt als `idle`, wenn **beide** Bedingungen gelten:

- es war 240 aufeinanderfolgende Ticks keiner Reise und keinem geplanten Logistikauftrag zugeordnet;
- für die nächsten 72 Ticks besteht keine erwartete rentable Verwendung.

Ein Verkauf wird nur geprüft, wenn:

- das Handelshaus `conserving` ist **oder** die Kapazität dauerhaft deutlich über dem Bedarf liegt, also über 72 Ticks weniger als 40 % Auslastung bei null abgelehnten rentablen Plänen;
- das Schiff unzugeordnet im Hafen liegt;
- es nicht das letzte Schiff des Handelshauses ist;
- die Stadtkasse des Hafens den regulären Ankaufspreis vollständig zahlen kann.

Der Verkauf überträgt das Eigentum an den neutralen Makler und wird von der Stadtkasse bezahlt. Das Schiff wird **nicht** gelöscht; `shipId`, Name, Typ und Herkunft bleiben erhalten, und es erscheint zum normalen neutralen Kaufpreis wieder im Angebot. Reicht die Stadtkasse nicht, wird der Verkauf atomar abgelehnt und das Schiff bleibt Eigentum des Handelshauses.

Das letzte Schiff eines Handelshauses ist geschützt, auch im Insolvenzfall.

## Namensregeln

Neue Schiffe eines Handelshauses erhalten deterministische Namen:

`<Kurzname> <laufende Nummer>`

Die laufende Nummer beginnt bei 2, weil das Startschiff seinen ursprünglichen Namen behält, und zählt je Handelshaus über alle jemals erworbenen Schiffe monoton hoch. Sie wird bei einem Verkauf nicht zurückgesetzt, damit kein Name doppelt vergeben wird.

Beispiele: `Westwind 2`, `Haardt 3`, `Rheinhandel 2`.

Der Name erfüllt die bestehende Alpha-4-Namensregel von 1 bis 40 Unicode-Zeichen. Eine Umbenennung verwendet denselben Schiffsbefehl wie beim Spieler.

## Entscheidungsprotokoll

Je Schiffsplan werden zusätzlich zu den Pflichtfeldern aus [`ai-transparency.md`](ai-transparency.md) festgehalten:

- gemessener Kapazitätsengpass mit Auslastung und Dauer;
- abgelehnte rentable Logistikmengen;
- alle geprüften konkreten Kaufangebote mit `shipId`, Typ und Preis;
- `shipUtilityScore` je geprüftem Typ und die angewandten Tie-Breaker;
- Kauf- oder Baukosten mit Gebühr und bewerteten Materialien;
- `paybackTicks`;
- verfügbare Liquidität vor und nach der Investition;
- Tick der letzten Schiffs- und der letzten größeren Investition;
- gewählte Flottenzuordnung oder Neuanlage;
- `reasonCode` bei Ablehnung.

## Invarianten

- Die Gesamtzahl der Schiffe ändert sich ausschließlich durch einen abgeschlossenen Bauauftrag.
- Kauf und Verkauf erhalten `shipId`, Name, Typ, Herkunft und Entstehungstick.
- Ein Handelshaus verkauft nie sein letztes Schiff.
- Höchstens ein neues Schiff je Handelshaus und 72 Ticks.
- Höchstens eine größere Investition je Handelshaus und 24 Ticks, gemeinsam mit Gebäuden gezählt.
- Ein Bauauftrag wird nie ohne vollständige Gebühr und vollständige Materialien erteilt.
- Ein Schiff gehört höchstens einer Flotte; jede Flotte hat mindestens ein Schiff.
- Eine Tickwiederholung erzeugt kein zweites Schiff und keinen doppelten Bauauftrag.
- Die Gesamtgeldmenge bleibt bei Kauf, Verkauf und Bauauftrag exakt konstant.

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `AI_SHIP_CAPACITY_SHORTAGE_NOT_CONFIRMED` | `transport_capacity_shortage` ist nicht über 72 Ticks belegt |
| `AI_SHIP_INVESTMENT_NOT_AFFORDABLE` | Liquiditätsreserve, Lohndeckung oder Amortisation verletzt |
| `AI_SHIP_INVESTMENT_RATE_LIMITED` | 72-Tick-Schiffssperre oder 24-Tick-Investitionssperre greift |
| `AI_SHIP_BUILD_MATERIALS_MISSING` | Gebühr oder Materialien unvollständig |
| `AI_SHIP_PLAN_STATE_CONFLICT` | unzulässiger Statusübergang oder Versionskonflikt |
| `AI_SHIP_ASSIGNMENT_FAILED` | Flottenzuordnung nicht möglich |

Alle bis auf `AI_SHIP_PLAN_STATE_CONFLICT` sind reguläre fachliche Ablehnungen mit protokolliertem Grund.

## Ausdrücklich ausgeschlossen

Kostenlose oder sofort erzeugte Schiffe, bevorzugte Werftwarteschlange, Schiffsleasing und -miete, Reparatur, Module, Bewaffnung, Besatzung, Verschrottung, Löschung eines Schiffes, Verkauf des letzten KI-Schiffes sowie mehrere Schiffsanschaffungen innerhalb von 72 Ticks.
