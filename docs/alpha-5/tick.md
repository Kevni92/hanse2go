# Alpha 5: Wirtschaftstick und Ordermarkt

Der Alpha-4-Wirtschaftstick wird als eine atomare Welttransaktion erweitert. Es gibt keinen Hintergrundscheduler und keinen Echtzeittick. Ein Befehl verarbeitet genau eine Stunde; eine Idempotenzwiederholung liefert denselben Bericht.

## Reihenfolge

1. Tick sperren, Idempotenz prüfen und einen vollständigen Weltsnapshot erstellen.
2. Bevölkerung, Wohnraum, Konten, Orders, Reservierungen und Lager erfassen.
3. Arbeitsnachfrage und faire Arbeiterverteilung nach Alpha 3 ausführen.
4. vollständig finanzierbare Löhne atomar vom Gebäudeeigentümer an die Bevölkerungskasse der Stadt übertragen und als `wage_payment` buchen.
5. Produktion mit freien Kontorbeständen ausführen. Für Sell Orders reservierte Ware ist kein Produktionsinput.
6. Die seit dem letzten Tick laufende Bevölkerungskonsumperiode abschließen:
   - ausgeführte Mengen auswerten;
   - offene Restorders der alten Periode ablaufen lassen;
   - Restgold freigeben;
   - Versorgung und reale Kaufkraft berechnen.
7. Wohlstand und Bevölkerungswachstum nach den bestehenden Alpha-3-Regeln aktualisieren.
8. die Alpha-4-Werftphase ausführen. Gebühren und Schiffskäufe/-verkäufe verwenden reale Stadtkassen; reserviertes Gold bleibt unantastbar.
9. sämtliche offenen Stadtorders stornieren und ihre Restreservierungen freigeben.
10. neue gedeckte Stadtorders gemäß `city-market-actor.md` erzeugen und jeweils sofort matchen.
11. neue gedeckte Bevölkerung-Buy-Orders für die nächste Konsumperiode gemäß `population-orders-and-consumption.md` erzeugen und jeweils sofort matchen.
12. Geld-, Waren-, Order-, Reserve- und Ledgerinvarianten über den vollständigen Snapshot prüfen.
13. Ticknummer und simulierte Zeit erhöhen, Bericht speichern und den Snapshot atomar committen.

Sofortige Ausführungen der in Schritt 11 erzeugten Bevölkerungorders zählen zur neuen Periode, nicht rückwirkend zur gerade abgeschlossenen Periode.

## Atomarität

Der Tick verändert den live gespeicherten Zustand erst nach erfolgreichem Abschluss aller Schritte. Fehlende Bevölkerungsmittel, fehlendes Angebot oder ein nicht kreuzendes Limit sind fachliche Nichtausführungen und lassen eine gedeckte Restorder offen beziehungsweise reduzieren die finanzierte Menge. Eine ungedeckte Systemorder, negative Konten, ein nicht ausgeglichener Ledger oder eine Waren-/Geldabweichung sind technische Fehler und rollen den ganzen Tick zurück.

Reservierte Ware darf während des gesamten Ticks weder produziert, transferiert, verbaut, verschifft noch erneut angeboten werden. Reserviertes Gold darf weder für Löhne, Bau, Konzession, Werft, Schiffskauf noch weitere Orders verwendet werden.

## Tickbericht

Der gespeicherte Bericht umfasst mindestens:

### Ordermarkt

- neue, gefüllte, teilweise gefüllte, abgelaufene und stornierte Systemorders;
- Executions und Volumen je Stadt und Ware;
- bester Bid, bester Ask, letzter Preis und Buchversion;
- Gebühreneinnahmen je Stadt.

### Geld

- Spieler-, Stadt- und Bevölkerungskonten vor/nach dem Tick;
- Lohnflüsse, Bevölkerungsausgaben, Reservierungen und Freigaben;
- Geldmenge vor/nach dem Tick sowie Status `unverändert`;
- Ledgerreferenzen und Invariantenstatus.

### Waren und Bevölkerung

- städtische Lager vor/nach Stadtorders;
- Soll, finanzierbare, bestellte und ausgeführte Bevölkerungsmengen;
- reale Konsummengen, Versorgung, Kaufkraft und Wohlstand;
- erlaubte Warenänderungen aus Produktion, Ausführung, Konsum, Bau und Schiffsbau.

## Fehlercodes

Der Tick verwendet mindestens `TICK_IN_PROGRESS`, `TICK_ORDER_MARKET_INVARIANT_FAILED`, `MONEY_SUPPLY_INVARIANT_VIOLATION`, `GOODS_SUPPLY_INVARIANT_VIOLATION`, `MONEY_LEDGER_IMBALANCE` und `ORDER_ATOMIC_COMMIT_FAILED`. Die vollständige Welt bleibt bei jedem dieser Fehler unverändert.
