# Alpha 6: Umfang, Grundsätze und Abgrenzung

## Ziel

Alpha 6 führt autonome, regelbasierte Handelshäuser ein, die Versorgungslücken erkennen und mit denselben Gebäuden, Schiffen, Flotten, Waren, Goldkonten und Orders wirtschaften wie Spieler. Zusätzlich führt es virtuelle Flottenreisen zwischen den drei Teststädten ein, damit Waren real transportiert werden müssen.

Alpha 4 lieferte dauerhafte Schiffe und Flottenmanagement. Alpha 5 lieferte vollständig gedeckte Orders, reale Stadt- und Bevölkerungskassen und einen geschlossenen Goldkreislauf. Alpha 6 verbindet diese Systeme zu einer autonomen Handelswirtschaft.

## Kernablauf

`öffentliche Wirtschaft beobachten → Unterversorgung bewerten → reguläre Maßnahme planen → Ware kaufen, produzieren oder transportieren → über echte Orders verkaufen → Gewinn oder Verlust verbuchen → bei ausreichender Spieleraktivität zurückfahren`

## Verbindliche Grundsätze

- Die KI ist regelbasiert, deterministisch und serverautoritativ.
- Kein KI-Befehl erzeugt Gold, Waren, Gebäude, Schiffe oder Flotten aus dem Nichts.
- KI-Handel verwendet ausschließlich die Alpha-5-Orders, Reservierungen, das Matching, die Gebühren und den Ledger.
- KI-Produktion verwendet reguläre Konzessionen, Kontore, Baumaterialien, Arbeiter, Löhne und Inputs.
- KI-Schiffe sind normale dauerhafte Alpha-4-Schiffsentitäten.
- Spieler und KI verwenden dieselben Reise-, Flotten- und Wirtschaftsregeln.
- Die KI erhält keine privaten Spielerdaten und keine bevorzugte Orderpriorität.
- Handelshäuser können Verluste erleiden und insolvent werden.
- Die Gesamtgeldmenge bleibt bei normalen Befehlen und Ticks exakt konstant.
- Jede Entscheidung wird mit nachvollziehbarem Grund protokolliert.

## Enthaltener Umfang

- drei unabhängige Handelshäuser mit vollständig bilanziertem Startzustand;
- die Zustände `active`, `conserving` und `insolvent`;
- öffentliche Versorgungs-, Handels- und Marktanteilsmetriken;
- akute, strukturelle und kritische Unterversorgung sowie der Rückzug bei Spielerversorgung;
- KI-Orderstrategie, Warenkostenbasis und Zielmargen;
- virtuelle Reisen für Spieler und KI auf einem statischen Drei-Städte-Graph;
- reale Logistik über Quellkontor, Flotte, Reise und Zielkontor;
- reguläre Produktions-, Kontor-, Gebäude- und Wohnhausinvestitionen;
- regulärer Schiffskauf, Schiffsbau und Flottenausbau;
- operative, taktische und strategische Zyklen im Rhythmus 1 / 6 / 24 Ticks;
- transparente Handelshaus- und Debug-Oberfläche;
- Langzeitsimulationen über 720 und 4.320 Ticks.

## Ausdrücklich ausgeschlossen

- generative oder lernende KI und jeder LLM-Aufruf;
- Sonderpreise, Sonderressourcen und geheime Informationen für die KI;
- kostenloses Gold, kostenlose Waren, Gebäude oder Schiffe;
- die endgültige Karibikkarte und grafische Reisewege;
- Kampf, Piraterie, Reparatur und Module;
- Kredite, Rettungsgeld und negativer Kontostand;
- PostgreSQL-Persistenz und automatischer Echtzeitbetrieb;
- Änderungen an bestehenden Balancingwerten früherer Alphas.

## Dokumentenkarte

### Akteure und Vermögen

- [`ai-actors.md`](ai-actors.md) – Akteursmodell, Eigentümertyp `ai`, Eigentums- und Informationsgrenzen, Liquiditätsreserve
- [`start-state.md`](start-state.md) – bilanzierte Initialisierung von Gold, Konzession, Kontor, Schiff und Flotte
- [`insolvency.md`](insolvency.md) – Liquiditätszustände, Sparmaßnahmen und Insolvenz ohne Rettungsgeld

### Beobachtung und Eingriffsgrenzen

- [`economic-observation.md`](economic-observation.md) – öffentliche Beobachtungsfenster und Metriken
- [`shortage-and-intervention.md`](shortage-and-intervention.md) – Versorgungsstatus, `supportScore`, Marktanteilsziel und Rückzug

### Handel und Wirtschaftlichkeit

- [`cost-basis-and-profit.md`](cost-basis-and-profit.md) – verlustfreie Warenkostenbasis, Zielmargen und Preisgrenzen
- [`ai-order-strategy.md`](ai-order-strategy.md) – gedeckte KI-Orders, Mengenbegrenzungen und Orderpflege

### Reisen und Logistik

- [`virtual-voyages.md`](virtual-voyages.md) – Flottenstatus, Reiseentität, Abfahrt, Fortschritt und Ankunft
- [`test-world-routes.md`](test-world-routes.md) – statischer Städtegraph und Referenzfahrzeiten
- [`ai-logistics.md`](ai-logistics.md) – Logistikplan, Quellen- und Flottenwahl, Umladen und Transportkosten

### Produktion, Gebäude und Schiffe

- [`ai-production-and-investment.md`](ai-production-and-investment.md) – Maßnahmenreihenfolge, Investitionsvoraussetzungen und Amortisation
- [`ai-building-plans.md`](ai-building-plans.md) – Bauablauf, Kettenprüfung und Kandidatenauswahl
- [`ai-ships-and-fleets.md`](ai-ships-and-fleets.md) – Kapazitätsengpass, Schiffskauf, Schiffsbau und Flottenbildung
- [`ai-investment.md`](ai-investment.md) – gemeinsame Investitionsgrenzen und Raten

### Ausführung und Nachvollziehbarkeit

- [`tick.md`](tick.md) – dreizehnstufige Tickreihenfolge, Akteursreihenfolge, Budgets und Rollbackgrenzen
- [`decision-engine.md`](decision-engine.md) – Zyklusablauf, Vorfilterung, Sortierung und Determinismusregeln
- [`ai-transparency.md`](ai-transparency.md) – Entscheidungsprotokoll, Ablehnungsgründe und Erklärtexte
- [`api-contracts.md`](api-contracts.md) – Reise-, Routen- und Nur-Lese-KI-Verträge

### Oberfläche, Werte und Abnahme

- [`user-interface.md`](user-interface.md) – Handelshausübersicht, Versorgungsanzeige, Reisebedienung und Debug-Ansicht
- [`balancing.md`](balancing.md) – alle verbindlichen Alpha-6-Werte an einer Stelle
- [`test-world.md`](test-world.md) – `alpha6-baseline`, Tick-0-Stadtorders und die drei Testpresets
- [`acceptance.md`](acceptance.md) – vollständige Abnahme, Langzeitsimulationen und E2E-Happy-Path

## Lesereihenfolge

Für einen Einstieg in Alpha 6 empfiehlt sich: dieses Dokument, dann `ai-actors.md` und `start-state.md`, dann `economic-observation.md` und `shortage-and-intervention.md`, dann `cost-basis-and-profit.md`, dann `virtual-voyages.md` und `ai-logistics.md`, dann `tick.md` und zuletzt `acceptance.md`.

## Verhältnis zu späteren Alphas

Alpha 6 ist bewusst eine Zwischenstufe. Der statische Drei-Städte-Graph wird von der späteren Karibikkarte ersetzt, ohne dass Reiseentität, Flottenmodell, Fahrzeitformel oder Tickphase neu gebaut werden müssen. Wind, Wetter, Gefahren, dynamische Routen, wiederholte Handelsrouten, persistente PostgreSQL-Welt, Benutzerkonten, automatischer Echtzeittick, Reparaturen, Module, Besatzungen, Piraterie, Kampf sowie Goldware und Münzprägung folgen in späteren Slices.

## Abhängigkeiten

Alpha 5 einschließlich der Orderbuch-, Geld- und Ledgerregeln muss vollständig abgeschlossen sein. Alpha 6 verändert keine bestehende Alpha-1-bis-Alpha-5-Regel, sondern ergänzt sie ausschließlich.
