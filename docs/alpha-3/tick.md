# Alpha 3 – Atomarer Stundentick

Ein Tick entspricht einer simulierten Stunde, wird nur über den Debug-Befehl ausgelöst und verlangt eine Idempotenz-ID. Eine bereits erfolgreiche ID liefert exakt denselben Bericht; eine neue parallele Anfrage wird mit `TICK_ALREADY_RUNNING` abgelehnt. Scheduler und Offline-Fortschritt existieren nicht.

Zu Beginn wird ein unveränderlicher Weltsnapshot von Zeit, Spielern und Gold, Bevölkerung und Wohlstand, Wohnraum, Gebäuden und Prioritäten, Kontoren und Produktionsresten, Märkten und sämtlichen Verbrauchs-, Wohlstands- und Wachstumsresten erfasst.

Die Phasen sind verbindlich:

1. Tick sperren, Idempotenz und Ausgangszustand prüfen.
2. `populationAtTickStart`, Wohnraum und `wealthBefore` je Stadt erfassen.
3. Finanzierbare Arbeitsnachfrage nach Spieler-, Stadt- und Prioritätssortierung reservieren.
4. Arbeiter je Stadt per Max-Min und Priorität verteilen; Beschäftigung und Arbeitslosigkeit berechnen.
5. Tatsächliche Löhne erneut prüfen und atomar abziehen; je Stadt Einkommen erfassen.
6. Produktion gegen den Kontor-Snapshot nach `cityId`, `playerId`, `buildingInstanceId` planen und atomar buchen; Outputs sind kein Input desselben Ticks.
7. Verbraucherpreise von Brot, Fleisch, Käse und Kleidung vor dem Verbrauch sichern.
8. Verbrauch aus der Anfangsbevölkerung in `goodId`-Reihenfolge buchen, Deckung berechnen und Märkte aktualisieren.
9. Kaufkraft, Zielwohlstand und Wohlstand mit Resten aktualisieren.
10. Wachstum aus aktuellem Wohlstand, Wohnraum und Anfangsbevölkerung buchen; neue Einwohner wirken erst im Folgetick.
11. Ticknummer und Zeit um genau eins erhöhen, Bericht und Idempotenz-Ergebnis speichern, Sperre lösen.

Ein unerwarteter Fehler stellt den Zustand vor Phase 1 vollständig wieder her. Gebäudestillstand, fehlende Marktware und vorab begrenzte Lohnnachfrage sind fachliche Ergebnisse, keine Tickfehler.

Der Bericht enthält vor/nach-Zeit und Idempotenz-ID, Gold und reservierte/gezahlt Löhne je Spieler, Bevölkerung/Arbeit/Wohnraum/Einkommen/Kaufkraft/Versorgung/Wohlstand/Wachstum je Stadt, Priorität/Arbeiter/Auslastung/Löhne/Input/Output/Status je Gebäude sowie Verbrauch, Bestand und Preis je Marktware. Die Oberfläche zeigt ihn in zugänglichen, mobilen Akkordeons; siehe [`user-interface.md`](user-interface.md).
