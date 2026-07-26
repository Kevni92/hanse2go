# Alpha 5: Testwelt und reproduzierbare Presets

Alle Alpha-5-Tests starten aus einer deterministischen Welt. Der Reset baut auf dem abgeschlossenen Alpha-4-Zustand auf, verwendet einen festen Seed und erzeugt keine zusätzlichen Waren oder Geldkonten.

## Standard-Reset `alpha5-baseline`

### Geld

| Konto | Gold | moneyUnits |
|---|---:|---:|
| `player-alpha` | 100.000,00 | 10.000.000 |
| Stadtkasse Lambrecht | 204.900,00 | 20.490.000 |
| Stadtkasse Neustadt | 267.450,00 | 26.745.000 |
| Stadtkasse Mannheim | 302.500,00 | 30.250.000 |
| Bevölkerung Lambrecht | 97.920,00 | 9.792.000 |
| Bevölkerung Neustadt | 244.800,00 | 24.480.000 |
| Bevölkerung Mannheim | 489.600,00 | 48.960.000 |
| **Gesamt** | **1.707.170,00** | **170.717.000** |

Vor der ersten Systemordergenerierung sind alle Reservierungen null. Reserviertes Geld ist ein Unterbestand und wird nicht nochmals zur Summe addiert.

### Waren und Orders

- Alle bisherigen Stadtbestände werden je Stadt und Ware exakt als städtisches Lager in Hundertstel-Tonnen übernommen.
- Spieler-, Kontor-, Flotten- und Produktionsbestände aus Alpha 4 bleiben erhalten.
- Die Gesamtmenge jeder Ware vor und nach der Migration ist identisch.
- Die alte parallele Marktbestandsstruktur ist nach der Migration kein Handelsbestand mehr.
- Tick 0 erzeugt stabile Stadtorders gemäß [`city-market-actor.md`](city-market-actor.md).
- Die erste Bevölkerungskonsumperiode erzeugt deterministische Buy Orders gemäß [`population-orders-and-consumption.md`](population-orders-and-consumption.md).
- Order-, Execution-, Ledger- und Buchsequenzen starten mit konfigurierten reproduzierbaren Werten.

## Preset `alpha5-order-ready`

Das Preset lädt die Baseline und stellt den Happy Path her:

- aktive Flotte und Spieler erreichen Lambrecht;
- Spieler besitzt Konzession und Kontor in Lambrecht;
- Spieler besitzt 100.000,00 Gold verfügbar;
- Kontor enthält mindestens 100,00 t Holz, 20,00 t Brot und 20,00 t Kleidung frei verfügbar;
- es existieren keine Spielerorders und keine Spielerreservierungen;
- Stadt- und Bevölkerungorders entsprechen dem Baselinezustand.

Die drei Warenmengen sind dem Alpha-4-/Testweltbestand zu entnehmen und werden nicht zusätzlich erzeugt. Der Reset muss für jedes Preset die Warenbilanz vor und nach der Vorbereitung prüfen.

## Preset `alpha5-two-players`

Zusätzlich zu `player-alpha` wird `player-beta` mit 50.000,00 Gold, eigenem Kontor, lokalem Stadtzugang, getrennten Inventar-/Kontoversionen und eigener Orderhistorie eingerichtet. Das Gold wird vor dem Preset atomar aus der Stadtkasse Lambrecht übertragen; es wird nicht erzeugt. Die Geldmenge bleibt exakt 170.717.000 moneyUnits.

## Konfigurations- und Migrationsprüfungen

Der Serverstart beziehungsweise Testreset schlägt bei ungültigen Geld-, Gebühren-, Preis-, Reserve-, Waren- oder Kontokonfigurationen fehl. Die Tests prüfen mindestens:

- 1,00 Gold entspricht exakt 100 moneyUnits;
- alle sieben Basiskonten und die Gesamtgeldmenge stimmen mit der Tabelle überein;
- sämtliche 66 Stadt-Warenbestände (22 Waren × 3 Städte) bleiben mengenidentisch;
- Basispreise und Zielbestände bleiben als Referenzwerte erhalten;
- alte Spread-/Preisfaktorwerte werden nicht für Settlement verwendet;
- keine Stadt-/Bevölkerungorder ist ohne Ware beziehungsweise Gold gedeckt;
- kein neutrales, unbegrenztes oder negatives Konto wird angelegt.

## Deterministische Diagnose

Jeder Reset und Tickbericht enthält Presetname, Seed, Ticknummer, Konten verfügbar/reserviert/gesamt, Orderbuchversionen, offene Orders, Executions, Ledgerreferenzen und Warenbestände verfügbar/reserviert/gesamt. Ein fehlgeschlagener Test speichert zusätzlich den letzten serverbestätigten Snapshot.
