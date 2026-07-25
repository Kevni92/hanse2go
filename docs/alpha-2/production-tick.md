# Alpha 2 – Stundentick

Ein Tick entspricht genau einer simulierten Spielstunde. Die Welt beginnt mit Ticknummer `0` und simuliertem Zeitpunkt `0`; ein Erfolg erhöht beide Werte atomar um eins beziehungsweise eine Stunde.

## Ausführung

Der ausschließlich im Debug- und Testbetrieb verfügbare Befehl verarbeitet genau einen Tick unter einer serverseitigen Weltsperre. Läuft bereits ein Tick, antwortet er mit `TICK_IN_PROGRESS` und verändert keinen Zustand. Ein wiederholter Request mit derselben Idempotenz-ID gibt das erste Ergebnis zurück und erzeugt keinen zweiten Tick.

Der Tick ist als Ganzes atomar. Seine Reihenfolge ist:

1. Gebäude je Spieler, Stadt und stabiler Erstellungsreihenfolge prüfen.
2. Für jede produktionsfähige Instanz sämtliche Kontorinputs atomar entnehmen; bei fehlenden Inputs `stalled` mit `missing_inputs` setzen.
3. Alle erfolgreichen Outputs in Tickpuffern sammeln und nach der vollständigen Produktionsphase in die passenden Kontore einlagern. Outputs sind erst im folgenden Tick Inputs.
4. Den festen Bevölkerungsverbrauch aus jedem Stadtmarkt buchen.
5. Ticknummer, simulierte Zeit, Gebäudestatus und Tickbericht speichern und zurückgeben.

Wegen der Gesamtatomarität führt ein unerwarteter Fehler in jeder Phase zur vollständigen Rücknahme. Fehlende Inputs oder knappe Marktbestände sind fachliche Ergebnisse, keine Tickfehler.

## Ergebnis und Abgrenzung

Die Antwort enthält mindestens `tickNumber`, `simulatedHour`, Produktionsberichte je Gebäude und Verbrauchsberichte je Stadt und Ware. Der letzte erfolgreiche Bericht bleibt bis zum nächsten erfolgreichen Tick im Weltzustand verfügbar. Marktpreise ergeben sich anschließend unverändert aus den neuen Beständen.

Der Client kann den Tick ausschließlich anfordern und zeigt bis zur Serverantwort eine Sperre. Automatische Echtzeitticks, Scheduler, Offline-Fortschritt, Nachholen verpasster Zeit und variable Tickdauer existieren nicht.
