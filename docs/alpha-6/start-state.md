# Alpha 6: bilanzierte Initialisierung der Handelshäuser

## Einordnung

Die Alpha-6-Initialisierung setzt exakt auf dem abgeschlossenen Alpha-5-Startzustand aus [`../alpha-5/start-state.md`](../alpha-5/start-state.md) auf. Sie läuft nach der Alpha-5-Geld- und Warenmigration und **vor** der Tick-0-Stadtordergenerierung. Damit berührt sie keine reservierte Ware und kein reserviertes Gold; alle Reservierungen sind zu diesem Zeitpunkt null.

Die Initialisierung erzeugt kein Gold, keine Ware, kein Schiff, kein Gebäude und keine Flotte. Sie überträgt ausschließlich vorhandene Bestände zwischen vorhandenen Eigentümern und verbraucht vorhandene Ware als reguläre Baustoffsenke. Jeder Schritt erzeugt ausgeglichene Ledger-Einträge.

## Verarbeitungsreihenfolge

Handelshäuser werden aufsteigend nach `actorId` initialisiert:

`ai-house-lambrecht` → `ai-house-mannheim` → `ai-house-neustadt`

Innerhalb eines Handelshauses gilt strikt diese Reihenfolge:

1. Goldkonto anlegen und Heimatkapital übertragen.
2. Heimatkonzession gegen reguläre Gebühr erwerben.
3. Kontor in der Heimatstadt gegen reguläre Gold- und Materialkosten errichten.
4. Festgelegtes vorhandenes Stadtschiff zum regulären Alpha-4-Preis kaufen.
5. Neue eigene Flotte mit genau diesem Schiff anlegen.

Das Ergebnis ist von dieser Reihenfolge unabhängig: Die drei Handelshäuser greifen bei Gold auf getrennte Stadtkassen zu, und die gewählte Materialzuteilung führt bei jeder der sechs möglichen Bearbeitungsreihenfolgen zu identischen Endlagerbeständen. Die feste Reihenfolge ist trotzdem verbindlich, damit Ledger-, Execution- und Ereignissequenzen reproduzierbar bleiben.

## Schritt 1: Heimatkapital

Die Heimatstadt überträgt 150.000,00 Gold beziehungsweise 15.000.000 `moneyUnits` aus ihrer Stadtkasse an das Konto des Handelshauses. Der Ledger-Grund ist `ai_endowment`; Quelle ist die Stadtkasse, Ziel das KI-Konto.

Dies ist kein Kredit, keine Subvention und keine wiederholbare Zahlung. Sie findet ausschließlich in der Initialisierung statt und wird nie zurückgezahlt, aufgestockt oder wiederholt. Reicht die verfügbare Stadtkasse nicht aus, schlägt die Initialisierung mit `AI_START_STATE_IMBALANCE` fehl; ein Teilzustand entsteht nicht.

| Stadtkasse | verfügbar vorher | Übertragung | verbleibend nach Schritt 1 |
|---|---:|---:|---:|
| Lambrecht | 204.900,00 | 150.000,00 | 54.900,00 |
| Neustadt | 267.450,00 | 150.000,00 | 117.450,00 |
| Mannheim | 302.500,00 | 150.000,00 | 152.500,00 |

## Schritt 2: Heimatkonzession

Das Handelshaus zahlt 10.000,00 Gold Konzessionsgebühr an die Stadtkasse seiner Heimatstadt; Ledger-Grund `concession_fee`. Es erhält dafür die dauerhafte lokale Baukonzession seiner Heimatstadt.

Die Rufschwelle von 80 aus [`../alpha-2/reputation-and-concessions.md`](../alpha-2/reputation-and-concessions.md) gilt hier ausdrücklich nicht. Die Heimatkonzession ist ein Bestandteil des gedeckten Startzustands, genau wie die bereits im Alpha-Startzustand enthaltene Spielerkonzession für Lambrecht. Die Gebühr wird trotzdem vollständig gezahlt; die Konzession ist damit nicht kostenlos.

Für **jede weitere** Stadt gilt für Handelshäuser der unveränderte Spielerablauf: Ruf regulär durch nützliche Verkäufe aufbauen, ab 80 Ruf die Konzession für 10.000,00 Gold kaufen. Eine zweite kostenfreie Konzession existiert nicht.

## Schritt 3: Kontor in der Heimatstadt

Das Handelshaus errichtet mit demselben Fachbefehl wie ein Spieler genau ein Kontor in seiner Heimatstadt.

### Goldkosten

Die Kosten entsprechen unverändert [`../alpha-2/buildings-and-construction.md`](../alpha-2/buildings-and-construction.md):

| Position | Betrag | Ledger-Grund |
|---|---:|---|
| Grundstückspreis | 5.000,00 Gold | `land_purchase_fee` |
| Kontorbaukosten | 5.000,00 Gold | `building_construction_fee` |
| **gesamt** | **10.000,00 Gold** | |

Beide Beträge gehen an die Stadtkasse der Heimatstadt.

### Baumaterialien

Je Kontor werden real verbraucht:

| Ware | Menge |
|---|---:|
| Holz (`wood`) | 50,00 t |
| Bretter (`planks`) | 25,00 t |
| Ziegel (`bricks`) | 40,00 t |
| Werkzeug (`tools`) | 10,00 t |

Für alle drei Kontore zusammen sind das 150,00 t Holz, 75,00 t Bretter, 120,00 t Ziegel und 30,00 t Werkzeug.

### Materialquelle und Zuteilungsregel

Abweichend vom laufenden Spiel werden diese Materialien im Initialisierungsschritt direkt aus bereits vorhandenen städtischen Lagern zugeordnet und beim Bau verbraucht. Es wird keine Ware erzeugt, kein Markt bemüht und keine Order ausgeführt.

Die Quellreihenfolge je Ware ist verbindlich:

1. das Lager der Heimatstadt;
2. danach das Lager der nach Streckendistanz nächstgelegenen Stadt;
3. bei gleicher Distanz die kleinere `cityId` lexikografisch.

Als Streckendistanz gilt der Alpha-6-Testwelt-Städtegraph: Lambrecht–Neustadt 48 km, Neustadt–Mannheim 96 km, Lambrecht–Mannheim 120 km.

Ein Lager darf zu keinem Zeitpunkt negativ werden. Reicht die Gesamtmenge aller Stadtlager für eine Ware nicht aus, schlägt die Initialisierung vollständig mit `AI_START_MATERIALS_INSUFFICIENT` fehl.

Diese Direktentnahme ist ausschließlich ein Initialisierungsvorgang. Jeder spätere Kontor-, Gebäude-, Wohnhaus- und Schiffsbau eines Handelshauses beschafft seine Materialien vollständig regulär über ausgeführte Buy Orders, eigene Produktion oder eigenen Transport.

### Verbindliche Materialzuteilung

| Handelshaus | Ware | aus Lambrecht | aus Neustadt | aus Mannheim |
|---|---|---:|---:|---:|
| `ai-house-lambrecht` | Holz | 50,00 t | – | – |
| `ai-house-lambrecht` | Bretter | 25,00 t | – | – |
| `ai-house-lambrecht` | Ziegel | 30,00 t | 10,00 t | – |
| `ai-house-lambrecht` | Werkzeug | 10,00 t | – | – |
| `ai-house-mannheim` | Holz | – | – | 50,00 t |
| `ai-house-mannheim` | Bretter | – | – | 25,00 t |
| `ai-house-mannheim` | Ziegel | – | – | 40,00 t |
| `ai-house-mannheim` | Werkzeug | – | – | 10,00 t |
| `ai-house-neustadt` | Holz | 10,00 t | 40,00 t | – |
| `ai-house-neustadt` | Bretter | – | 25,00 t | – |
| `ai-house-neustadt` | Ziegel | – | 40,00 t | – |
| `ai-house-neustadt` | Werkzeug | – | 10,00 t | – |

Zwei Kontore benötigen eine Zweitquelle: Lambrecht besitzt nur 30,00 t Ziegel, Neustadt nur 40,00 t Holz. In beiden Fällen greift die nächstgelegene Stadt in 48 km Entfernung.

### Städtische Lager nach der Initialisierung

| Stadt | Holz | Bretter | Ziegel | Werkzeug |
|---|---:|---:|---:|---:|
| Lambrecht vorher | 200,00 t | 130,00 t | 30,00 t | 40,00 t |
| Lambrecht nachher | 140,00 t | 105,00 t | 0,00 t | 30,00 t |
| Neustadt vorher | 40,00 t | 45,00 t | 130,00 t | 55,00 t |
| Neustadt nachher | 0,00 t | 20,00 t | 80,00 t | 45,00 t |
| Mannheim vorher | 50,00 t | 65,00 t | 55,00 t | 60,00 t |
| Mannheim nachher | 0,00 t | 40,00 t | 15,00 t | 50,00 t |

Alle übrigen 18 Waren bleiben in allen drei Städten unverändert. Die Gesamtmenge jeder Ware sinkt exakt um die verbaute Menge und um nichts sonst.

Die anschließend in Tick 0 erzeugten Stadtorders beziehen sich auf diese reduzierten Bestände. Das ist eine gewollte Folge der bilanzierten Initialisierung und keine zusätzliche Warenquelle oder -senke.

## Schritt 4: Startschiff

Jedes Handelshaus kauft genau ein bereits vorhandenes, im Heimathafen liegendes neutrales Schiff zum regulären Alpha-4-Kaufpreis seines Typs. Der Kaufpreis geht gemäß [`../alpha-5/money-and-ledger.md`](../alpha-5/money-and-ledger.md) an die Stadtkasse des Hafens; Ledger-Grund `ship_purchase`.

| Handelshaus | `shipId` | Name | Typ | Kaufpreis |
|---|---|---|---|---:|
| `ai-house-lambrecht` | `ship-market-lambrecht-01` | Waldwind | Schnigge | 32.000,00 Gold |
| `ai-house-neustadt` | `ship-market-neustadt-01` | Rebenläufer | Pinasse | 20.000,00 Gold |
| `ai-house-mannheim` | `ship-market-mannheim-01` | Rheingold | Flöte | 60.000,00 Gold |

Der Kauf erzeugt kein Schiff. `shipId`, `customName`, `shipTypeId`, `originType = world_seed`, `originCityId` und `createdAtTick = 0` bleiben unverändert; ausschließlich `ownerType` und `ownerId` wechseln. Die `shipMarketVersion` des Hafens steigt je Kauf um eins.

Die Alpha-4-Voraussetzung, dass die **aktive Flotte** des Käufers den Hafen erreicht, entfällt für die Initialisierung: Das Handelshaus besitzt zu diesem Zeitpunkt noch keine Flotte. Die Lokalität ist durch das in Schritt 3 errichtete Kontor im selben Hafen nachgewiesen. Alle übrigen Kaufvoraussetzungen – Schiff liegt unzugeordnet im Hafen, gehört dem neutralen Makler, Preis vollständig verfügbar, aktuelle Marktversion, Idempotenzschlüssel – gelten unverändert.

Die beiden übrigen Marktschiffe `ship-market-neustadt-02` (Haardtstern, Flöte) und `ship-market-mannheim-02` (Kurpfalz, Kraweel) bleiben unverändert im neutralen Angebot.

## Schritt 5: Startflotte

Das gekaufte Schiff wird einer neu angelegten eigenen Flotte des Handelshauses im selben Hafen zugeordnet. Die Flotte erhält Status `in_port`, den Heimathafen als `portCityId`, leere Ladung und genau dieses eine Schiff. Ein leerer Zwischenzustand entsteht nicht.

| Handelshaus | Flotte | Schiff | Kapazität | Geschwindigkeit |
|---|---|---|---:|---:|
| `ai-house-lambrecht` | `fleet-ai-house-lambrecht-01` | Waldwind | 100,00 t | 10 km/Tick |
| `ai-house-neustadt` | `fleet-ai-house-neustadt-01` | Rebenläufer | 60,00 t | 12 km/Tick |
| `ai-house-mannheim` | `fleet-ai-house-mannheim-01` | Rheingold | 250,00 t | 8 km/Tick |

## Ergebnis der Initialisierung

Jedes Handelshaus besitzt danach: Heimatkonzession, genau ein Kontor mit leerem Lager, genau eine Flotte mit genau einem Schiff, Status `active`, Ruf 0 in allen Städten sowie keine Waren, Gebäude, Orders, Reisen oder Pläne.

### Goldkonten

| Konto | vor Alpha 6 | nach Initialisierung | Differenz |
|---|---:|---:|---:|
| Spieler `player-alpha` | 100.000,00 | 100.000,00 | 0,00 |
| Westwind-Handelshaus | – | 98.000,00 | +98.000,00 |
| Haardt-Kompanie | – | 110.000,00 | +110.000,00 |
| Rheinhandel-Kontor | – | 70.000,00 | +70.000,00 |
| Stadtkasse Lambrecht | 204.900,00 | 106.900,00 | −98.000,00 |
| Stadtkasse Neustadt | 267.450,00 | 157.450,00 | −110.000,00 |
| Stadtkasse Mannheim | 302.500,00 | 232.500,00 | −70.000,00 |
| Bevölkerung Lambrecht | 97.920,00 | 97.920,00 | 0,00 |
| Bevölkerung Neustadt | 244.800,00 | 244.800,00 | 0,00 |
| Bevölkerung Mannheim | 489.600,00 | 489.600,00 | 0,00 |
| **Gesamt** | **1.707.170,00** | **1.707.170,00** | **0,00** |

Die Geldmenge bleibt exakt `170.717.000 moneyUnits`.

### Rechenweg je Handelshaus

| Position | Westwind | Haardt | Rheinhandel |
|---|---:|---:|---:|
| Heimatkapital | +150.000,00 | +150.000,00 | +150.000,00 |
| Konzessionsgebühr | −10.000,00 | −10.000,00 | −10.000,00 |
| Grundstückspreis Kontor | −5.000,00 | −5.000,00 | −5.000,00 |
| Kontorbaukosten | −5.000,00 | −5.000,00 | −5.000,00 |
| Startschiff | −32.000,00 | −20.000,00 | −60.000,00 |
| **verfügbar** | **98.000,00** | **110.000,00** | **70.000,00** |

Der Nettoabfluss einer Stadtkasse ist exakt das verfügbare Gold ihres Handelshauses, weil jede Gebühr und der Schiffskaufpreis an dieselbe Heimatstadt zurückfließen.

## Invarianten der Initialisierung

Vor und nach der vollständigen Initialisierung wird geprüft:

- `sum(alle verfügbaren + alle reservierten Kontostände) = 170.717.000 moneyUnits`;
- kein Konto ist negativ, und für jedes Konto gilt `availableMoney + reservedMoney = totalAccountMoney`;
- jede Goldbewegung besitzt ausgeglichene Ledger-Einträge mit einem der Gründe `ai_endowment`, `concession_fee`, `land_purchase_fee`, `building_construction_fee` oder `ship_purchase`;
- die Gesamtmenge jeder Ware sinkt ausschließlich um die verbaute Kontormenge; alle übrigen Waren sind mengenidentisch;
- kein städtisches Lager ist negativ;
- die Gesamtzahl der Schiffe in der Welt ist unverändert;
- jedes Schiff, jede Flotte, jedes Kontor und jedes Konto besitzt genau einen Eigentümer;
- alle Reservierungen sind null;
- es existiert kein neutrales, unbegrenztes oder negatives Konto.

Verletzt eine Prüfung, rollt die gesamte Initialisierung zurück; ein Teilzustand wird nie gespeichert. Die Initialisierung ist idempotent: dieselbe Eingabe erzeugt denselben Snapshot mit denselben IDs, Ledger-Sequenzen und Marktversionen.
