# Alpha 3 – Teilproduktion und Festkommamengen

Für jede Produktionsinstanz `b` gilt `utilization(b) = assignedWorkers(b) / requiredWorkers(b)` mit `0 ≤ utilization ≤ 1`. Bei Vollbesetzung werden 100 Prozent der Rezeptinputs verbraucht und 100 Prozent der Outputs erzeugt. Bei Teilbesetzung sind Input und Output je Rezeptposition proportional; ohne Arbeiter werden weder Inputs noch Outputs gebucht. Gebäudezustand, Verschleiß und weitere Effizienzfaktoren existieren in Alpha 3 nicht.

Für eine Rezeptmenge `baseQuantity` ist `plannedQuantity = baseQuantity × assignedWorkers / requiredWorkers`. Die Berechnung erfolgt getrennt für jede Input- und Outputware.

## Festkomma und Reste

Alle autoritativen Warenbestände verwenden Hundertstel-Tonnen: eine interne Einheit entspricht `0,01` Tonnen. API und UI zeigen höchstens zwei Nachkommastellen. Gleitkommazahlen werden weder gespeichert noch für Buchungen verwendet.

Je Gebäudeinstanz und Rezeptposition wird ein ganzzahliger Divisionsrest gespeichert. Für eine Position gilt:

1. `baseQuantityUnits = baseQuantityTons × 100`
2. `raw = baseQuantityUnits × assignedWorkers + previousRemainder`
3. `bookedUnits = floor(raw / requiredWorkers)`
4. `newRemainder = raw mod requiredWorkers`

Damit gehen wiederholte Bruchmengen nicht verloren.

## Atomare Produktionsphase

1. Geplante Inputs, Outputs und neue Reste werden ausschließlich temporär berechnet.
2. Der Kontorbestand am Beginn der Produktionsphase ist der verbindliche Input-Snapshot.
3. Fehlt mindestens eine vollständige geplante Inputmenge, produziert die Instanz nicht und ihre Input- und Outputreste bleiben unverändert.
4. Sind alle Inputs vorhanden, werden sämtliche Inputs atomar entnommen, sämtliche Outputs gepuffert und alle neuen Reste übernommen.
5. Gepufferte Outputs werden erst nach der Produktionsphase eingelagert und stehen daher erst im Folgetick als Input bereit.
6. Zugewiesene Arbeiter verursachen auch bei `MISSING_INPUTS` ihre vollen Lohnkosten.

Der Produktionsbericht speichert mindestens `assignedWorkers`, `requiredWorkers`, `utilizationBasisPoints` von 0 bis 10.000, `wageCost`, geplante und tatsächlich gebuchte Inputs und Outputs, `produced` sowie `stallReasons[]`. Mögliche Stillstandsgründe sind `NO_WORKERS_ASSIGNED`, `INSUFFICIENT_WAGE_BUDGET` und `MISSING_INPUTS`.

Beispiel: Eine Windmühle mit 100 benötigten und 60 zugewiesenen Arbeitern plant 6,00 Getreide und 8,40 Mehl. Sie zahlt 120 Gold. Mit nur 5,99 Getreide produziert sie nichts, verändert keine Reste und zahlt weiterhin 120 Gold.
