# Alpha 6: Testwelt und reproduzierbare Presets

Alle Alpha-6-Tests starten aus einer deterministischen Welt. Der Reset baut auf dem abgeschlossenen Alpha-5-Zustand auf, führt anschließend die bilanzierte Initialisierung aus [`start-state.md`](start-state.md) aus und erzeugt dabei weder Gold noch Ware noch Schiffe.

## Standard-Reset `alpha6-baseline`

### Gold nach bilanzierter Initialisierung

| Konto | Gold | moneyUnits |
|---|---:|---:|
| Spieler `player-alpha` | 100.000,00 | 10.000.000 |
| Westwind-Handelshaus | 98.000,00 | 9.800.000 |
| Haardt-Kompanie | 110.000,00 | 11.000.000 |
| Rheinhandel-Kontor | 70.000,00 | 7.000.000 |
| Stadtkasse Lambrecht | 106.900,00 | 10.690.000 |
| Stadtkasse Neustadt | 157.450,00 | 15.745.000 |
| Stadtkasse Mannheim | 232.500,00 | 23.250.000 |
| Bevölkerung Lambrecht | 97.920,00 | 9.792.000 |
| Bevölkerung Neustadt | 244.800,00 | 24.480.000 |
| Bevölkerung Mannheim | 489.600,00 | 48.960.000 |
| **Gesamt** | **1.707.170,00** | **170.717.000** |

Die Gesamtgeldmenge ist exakt identisch mit der Alpha-5-Baseline. Alpha 6 erzeugt kein Gold; es verschiebt ausschließlich 330.000,00 Gold aus drei Stadtkassen in drei neue KI-Konten und lässt 152.000,00 Gold davon über Konzession, Kontor und Schiffskauf sofort wieder zurückfließen.

Vor der Tick-0-Systemordergenerierung sind alle Reservierungen null.

### Startobjekte je Handelshaus

- Heimatkonzession und genau ein Kontor mit leerem Lager;
- genau eine Flotte mit dem festgelegten Startschiff;
- keine Produktions- und keine Wohngebäude;
- keine Waren, Orders, Reisen, Logistik- oder Investitionspläne;
- Ruf 0 in allen Städten;
- Status `active`.

| Handelshaus | Flotte | Schiff | Typ | Kapazität | Geschwindigkeit |
|---|---|---|---|---:|---:|
| Westwind-Handelshaus | `fleet-ai-house-lambrecht-01` | `ship-market-lambrecht-01` Waldwind | Schnigge | 100,00 t | 10 km/Tick |
| Haardt-Kompanie | `fleet-ai-house-neustadt-01` | `ship-market-neustadt-01` Rebenläufer | Pinasse | 60,00 t | 12 km/Tick |
| Rheinhandel-Kontor | `fleet-ai-house-mannheim-01` | `ship-market-mannheim-01` Rheingold | Flöte | 250,00 t | 8 km/Tick |

Schiffszahl, Schiff-IDs, Namen, Typen und Herkunft bleiben durch die Initialisierung unverändert. Die Marktschiffe `ship-market-neustadt-02` (Haardtstern) und `ship-market-mannheim-02` (Kurpfalz) bleiben im neutralen Angebot.

### Verbrauchte Baumaterialien

Für die drei Kontore werden insgesamt real verbraucht:

- 150,00 t Holz;
- 75,00 t Bretter;
- 120,00 t Ziegel;
- 30,00 t Werkzeug.

Materialquellen sind die Heimatstadt zuerst, danach nach Streckendistanz und `cityId`. Es wird keine Ware erzeugt. Die verbindliche Zuteilung steht in [`start-state.md`](start-state.md).

### Städtische Lager nach der Initialisierung

| Stadt | Holz | Bretter | Ziegel | Werkzeug |
|---|---:|---:|---:|---:|
| Lambrecht | 140,00 t | 105,00 t | 0,00 t | 30,00 t |
| Neustadt | 0,00 t | 20,00 t | 80,00 t | 45,00 t |
| Mannheim | 0,00 t | 40,00 t | 15,00 t | 50,00 t |

Alle übrigen 18 Waren bleiben in allen drei Städten unverändert.

### Tick-0-Stadtorders der Baumaterialien

Die reduzierten Lager verändern die in Tick 0 erzeugten Stadtorders gegenüber der Alpha-5-Baseline. Verbindlich sind:

| Stadt | Ware | Seite | Menge | Limitpreis |
|---|---|---|---:|---:|
| Lambrecht | Holz | Sell | 40,00 t | 88 Gold/t |
| Lambrecht | Bretter | Sell | 25,00 t | 143 Gold/t |
| Lambrecht | Ziegel | Buy | 80,00 t | 108 Gold/t |
| Lambrecht | Werkzeug | Buy | 20,00 t | 288 Gold/t |
| Neustadt | Holz | Buy | 100,00 t | 72 Gold/t |
| Neustadt | Bretter | Buy | 60,00 t | 117 Gold/t |
| Neustadt | Ziegel | – | keine Order | Bestand exakt am Ziel |
| Neustadt | Werkzeug | Buy | 5,00 t | 288 Gold/t |
| Mannheim | Holz | Buy | 100,00 t | 72 Gold/t |
| Mannheim | Bretter | Buy | 40,00 t | 117 Gold/t |
| Mannheim | Ziegel | Buy | 65,00 t | 108 Gold/t |
| Mannheim | Werkzeug | – | keine Order | Bestand exakt am Ziel |

Die Preise folgen unverändert `max(1, floor(basePrice × 0,90))` für Buy und `ceil(basePrice × 1,10)` für Sell aus [`../alpha-5/city-market-actor.md`](../alpha-5/city-market-actor.md). Die Orders der übrigen 18 Waren sind gegenüber der Alpha-5-Baseline unverändert.

### Finanzierbarkeit der Stadtorders

Trotz der reduzierten Stadtkassen bleiben alle Stadt-Buy-Orders vollständig finanzierbar:

| Stadt | Kasse nach Initialisierung | Buy-Gesamtbedarf inklusive Gebühren | Deckung |
|---|---:|---:|---|
| Lambrecht | 106.900,00 Gold | 81.766,82 Gold | vollständig |
| Neustadt | 157.450,00 Gold | 53.139,39 Gold | vollständig |
| Mannheim | 232.500,00 Gold | 48.526,43 Gold | vollständig |

Keine Stadt muss ihre Buy-Menge wegen fehlender Liquidität reduzieren. Das ist ein verbindlicher Abnahmewert: Sinkt eine Stadtkasse künftig unter ihren Buy-Gesamtbedarf, ist das eine Balancingänderung und erfordert ein eigenes Folge-Issue.

## Testpreset `alpha6-bread-shortage`

Baut auf `alpha6-baseline` auf und stellt her:

- Mannheim liegt seit 24 Ticks unter 50 % Brotdeckung, ist also `critical_shortage`;
- die Bevölkerung Mannheims kann Brot vollständig bezahlen;
- in Mannheim existiert kein Angebot innerhalb des Bevölkerungspreislimits;
- in Neustadt existiert mindestens 20,00 t wirtschaftlich erwerbbares Brotangebot;
- die Haardt-Kompanie besitzt ihre freie Pinassenflotte `fleet-ai-house-neustadt-01` im Hafen Neustadt.

Erwarteter Ablauf:

`kritischer Mangel erkannt → gedeckte Buy Order in Neustadt → Ausführung → Transfer ins Flottenlager → 8 Ticks Reise Neustadt–Mannheim → Entladung ins Zielkontor → gedeckte Sell Order → Bevölkerungskauf`

Gold, Waren und Gebühren bleiben über den gesamten Ablauf vollständig bilanziert. Die Reisedauer von exakt 8 Ticks ergibt sich aus 96 km und 12 km/Tick der Pinasse.

## Testpreset `alpha6-structural-shortage`

- die Zielware liegt 72 Ticks unter 70 % Deckung, ist also `structural_shortage`;
- der menschliche Anteil am Versorgungsvolumen liegt unter 40 %;
- Handel allein reicht dauerhaft nicht aus, weil kein ausreichendes Angebot in einer anderen Stadt existiert;
- Inputs, Ruf, Gold und Baumaterialien sind regulär beschaffbar.

Erwarteter Ablauf: Die Maßnahmenstufen 1 bis 5 werden nachweislich zuerst geprüft und protokolliert verworfen. Danach entsteht ein vollständig finanzierter Investitionsplan und schließlich ein regulär gebautes Gebäude mit real beschafftem Material.

## Testpreset `alpha6-player-supplied`

- die Deckung liegt seit 72 Ticks über 90 %;
- mehr als 70 % des Versorgungsvolumens stammen von menschlichen Verkäufern;
- mindestens zwei unterschiedliche menschliche Verkäufer sind aktiv.

Erwarteter Ablauf: Der Status wird `player_supplied`, es entsteht keine neue KI-Investition und keine neue KI-Sell-Order für diese Stadt-Ware-Kombination. Bereits offene rentable Orders laufen regulär aus. Es findet keine künstliche Preisunterbietung statt.

## Presetvertrag

Jedes Preset darf Gold ausschließlich zwischen bestehenden Konten übertragen und Ware ausschließlich zwischen bestehenden Inventaren umbuchen. Kein Preset erzeugt Gold, Ware, Schiffe, Gebäude oder Flotten.

Jeder Reset prüft vor und nach seiner Vorbereitung:

- alle zehn Kontostände verfügbar, reserviert und gesamt;
- die konstante Geldmenge von exakt 170.717.000 moneyUnits;
- die Gesamtmenge jeder der 22 Waren über alle Eigentümer;
- die Gesamtzahl der Schiffe und ihre Eigentümer;
- Order-, Execution-, Ledger-, Entscheidungs- und Buchsequenzen;
- dass keine offene Order ohne vollständige Deckung existiert.

Jeder Reset ist idempotent und stellt bei identischer Eingabe denselben Snapshot mit denselben IDs her.

## Deterministische Diagnose

Jeder Reset und jeder Tickbericht enthält Presetname, Seed, Ticknummer, alle Konten verfügbar/reserviert/gesamt, Orderbuchversionen, offene Orders, Executions, Ledgerreferenzen, Warenbestände verfügbar/reserviert/gesamt, Schiffe und Eigentümer, Flotten und Standorte, offene Reisen, Logistik- und Investitionspläne sowie das KI-Entscheidungsprotokoll des Ticks.

Ein fehlgeschlagener Test speichert zusätzlich den letzten serverbestätigten Snapshot vor dem Fehler.
