# Alpha 6: vollständige Abnahme

Die Abnahme beweist eine autonome, vollständig gedeckte Handelswirtschaft – nicht nur eine sichtbare Handelshausoberfläche. Nach jedem Befehl und jedem Tick gilt:

`sum(alle verfügbaren + alle reservierten Kontostände) = 170.717.000 moneyUnits`

Zusätzlich gilt für jedes Konto `availableMoney + reservedMoney = totalAccountMoney`, kein Konto ist negativ, jede Warenänderung ist durch Produktion, Orderausführung, Konsum, Bau oder Schiffsbau erklärbar, und jedes Objekt besitzt genau einen Eigentümer.

## Initialisierung

- Alle Goldübertragungen und Gebühren besitzen ausgeglichene Ledgerbuchungen mit einem der Gründe `ai_endowment`, `concession_fee`, `land_purchase_fee`, `building_construction_fee` oder `ship_purchase`.
- Die Startgoldwerte betragen exakt 98.000,00 / 110.000,00 / 70.000,00 Gold.
- Die Stadtkassen betragen exakt 106.900,00 / 157.450,00 / 232.500,00 Gold.
- Die Baumaterialien werden vollständig verbraucht: 150,00 t Holz, 75,00 t Bretter, 120,00 t Ziegel, 30,00 t Werkzeug.
- Kein städtisches Lager wird negativ; die städtischen Lager entsprechen exakt der Tabelle in [`test-world.md`](test-world.md).
- Die Schiffszahl bleibt konstant; `shipId`, Name, Typ und Herkunft der drei Startschiffe bleiben unverändert.
- Jedes Objekt besitzt genau einen Eigentümer; alle Reservierungen sind vor Tick 0 null.
- Die Gesamtgeldmenge ist vor und nach der Initialisierung exakt gleich.
- Die Tick-0-Stadtorders der vier Baumaterialien entsprechen exakt der Tabelle in [`test-world.md`](test-world.md).
- Alle Stadt-Buy-Orders sind aus der jeweiligen Stadtkasse vollständig finanzierbar.

## Determinismus

Zwei Läufe mit demselben Reset und derselben Tickzahl müssen vollständig identisch sein bei:

- Konten, Ledger, Waren und Reservierungen;
- Orders, Executions und Buchversionen;
- Entscheidungen, `decisionId`, Reihenfolge und Ablehnungsgründen;
- Reisen, Logistik-, Investitions- und Schiffsplänen;
- Gebäuden, Schiffen, Flotten und Eigentümern;
- Versorgung, Wohlstand und Bevölkerung.

Eine Abweichung ist eine Determinismusverletzung `AI_DETERMINISM_VIOLATION`. Das Entscheidungsprotokoll ist dabei selbst Prüfgegenstand, nicht nur der Endzustand.

## Versorgungsschwellen

| Prüfung | Erwartung |
|---|---|
| Tick 11 unter 60 % | noch **nicht** `acute_shortage` |
| Tick 12 unter 60 % | `acute_shortage` |
| Tick 71 unter 70 % | noch **nicht** `structural_shortage` |
| Tick 72 unter 70 % | `structural_shortage` |
| 24 Ticks unter 50 % | `critical_shortage` |
| Spielerbedingung 71 Ticks | noch **kein** Rückzug |
| Spielerbedingung 72 Ticks | `player_supplied` |

Ein einzelner Tick, der eine Bedingung verletzt, setzt den Zähler auf null. `supportScore` und alle Tie-Breaker sind exakt reproduzierbar; die Grenzwerte 0 und 1.000 werden geprüft.

## Orders und Preise

- Jede KI-Order ist bei Erstellung vollständig gedeckt.
- Es entstehen ausschließlich Limit Orders; keine Market Order existiert.
- Alpha-5-Gebühren, Preis-Zeit-Priorität und Matching bleiben unverändert.
- Die Zielmargen betragen 10 % / 5 % / 0 % je nach Versorgungslage und werden nie negativ.
- Kein geplanter Verkauf liegt unter den vollständigen variablen Kosten.
- Eine einzelne Handelsentscheidung bindet höchstens 25 % des verfügbaren Goldes.
- Eigenhandel desselben Handelshauses wird übersprungen; zwei verschiedene Handelshäuser matchen regulär.
- Eine KI-Order erhält keine Vorrangstellung gegenüber einer gleichpreisigen älteren Spielerorder.

Referenzrechnungen: Kostenbasis 190 Gold/t ergibt regulär `minimumSellPrice = 211 Gold/t`; ein erwarteter Verkaufspreis von 211 Gold/t über 10,00 t ohne Transportkosten ergibt `maxBuyPrice = 189 Gold/t` bei einer realisierten Marge von mindestens 10 %.

## Reisen

Verbindliche Fahrzeiten:

| Schiffstyp | Lambrecht–Neustadt | Neustadt–Mannheim | Lambrecht–Mannheim |
|---|---:|---:|---:|
| Pinasse | 4 | 8 | 10 |
| Schnigge | 5 | 10 | 12 |
| Flöte | 6 | 12 | 15 |
| Kraweel | 7 | 14 | 18 |

Zusätzlich:

- eine neu gestartete Reise bewegt sich erst im folgenden Tick;
- Ladung und Flottenzusammensetzung sind während der Reise vollständig gesperrt;
- eine Tickwiederholung erzeugt keine doppelte Ankunft und keinen doppelten Fortschritt;
- Spieler und KI verwenden denselben Reisebefehl und denselben Codepfad;
- eine Reise erzeugt und vernichtet weder Gold noch Ware noch Schiffe.

## Logistik

Vollständiger Nachweis der Kette:

`Buy Order → Ausführung → Quellkontor → Flotte → Reise → Zielkontor → Sell Order → Ausführung`

Nach **jedem** Schritt gelten Gold-, Waren-, Kapazitäts-, Reservierungs- und Eigentumsinvarianten. Eine Flotte gehört nie zwei aktiven Plänen an. Es existiert kein Weg, Ware ohne Flotte und Reise zwischen Städten zu bewegen. Die Kostenbasis ist über die gesamte Kette lückenlos nachvollziehbar; kalkulatorische Transportkosten erhöhen sie, ohne Gold zu bewegen.

## Produktion und Investition

- Handel und bestehende Kapazität werden nachweislich vor jedem Neubau geprüft und verworfene Stufen protokolliert.
- Neubau nur bei `structural_shortage` oder `critical_shortage`; `acute_shortage` allein genügt nicht.
- Höchstens eine größere Investition je Handelshaus und 24 Ticks, art-übergreifend über Gebäude und Schiffe.
- Nach jeder Investition bleiben mindestens 25.000,00 Gold plus die Löhne der nächsten 24 Ticks verfügbar.
- Die Amortisation beträgt höchstens 720 Ticks; ein Deckungsbeitrag von null oder darunter wird abgelehnt.
- Ruf, Konzession, Kontor, Materialien und Bau folgen exakt den Spielerregeln und -kosten.
- Kein Material wird automatisch aus einem Stadtbestand entnommen; die Direktzuteilung gilt ausschließlich für die Initialisierung.
- Die Gebäudepriorität ändert sich höchstens einmal je 6 Ticks und wirkt erst im Folgetick.
- Ein Handelshaus erhält in der Max-Min-Arbeiterverteilung keinen Vorteil gegenüber einem Spieler mit gleicher Nachfrage.

## Schiffe und Flotten

- Ein Kapazitätsengpass wird erst nach vollen 72 Ticks bei mindestens 80 % Auslastung und mindestens 60,00 t abgelehnter rentabler Menge bestätigt.
- Ein vorhandenes kaufbares Schiff hat Vorrang vor einem Bauauftrag.
- Höchstens ein Schiff je Handelshaus und 72 Ticks.
- Ein Schiffsbau benötigt reale Materialien, die volle Gebühr und die reguläre Warteschlange; eine KI erhält keine bevorzugte Position.
- Genau ein Schiff entsteht bei Fertigstellung, nie bei Auftragserteilung.
- Ein Verkauf nach mindestens 240 Idle-Ticks löscht kein Schiff und benötigt eine ausreichende Stadtkasse.
- Das letzte Schiff eines Handelshauses ist geschützt, auch im Insolvenzfall.
- Die Typauswahl ist deterministisch: bei 60,00 t Bedarf gewinnt die Pinasse, bei 150,00 t und 250,00 t die Flöte.

## Insolvenz

- Unter 25.000,00 Gold verfügbarer Liquidität wechselt ein Handelshaus nach `conserving`.
- Im Status `conserving` entstehen keine neuen Gebäude- und Schiffsinvestitionen.
- Unnötige Buy Orders werden reduziert oder storniert; freigegeben wird ausschließlich die Restreservierung.
- Nach 72 aufeinanderfolgenden Ticks echter Handlungsunfähigkeit folgt `insolvent`.
- Es entsteht kein Rettungsgeld, kein Kredit und kein Reset; kein Konto wird negativ.
- Eigentum und bereits offene gedeckte Sell Orders bleiben bestehen; kein Objekt wird gelöscht.
- Ein direkter Übergang `active` → `insolvent` wird abgelehnt.

## Marktanteil und Rückzug

- Das reguläre Gesamtziel aller Handelshäuser beträgt höchstens 60 % je Stadt und Ware über 72 Ticks.
- Bei `critical_shortage` darf es überschritten werden und bleibt als Diagnosewert sichtbar.
- Bei ausreichender Spielerversorgung erfolgt der Rückzug ohne künstliche Preisunterbietung.
- Offene rentable Orders laufen dabei regulär aus und werden nicht vorzeitig zurückgezogen.

## Parallelität und Rollback

- Konkurrierende KI-Buy-Orders kaufen zusammen höchstens die tatsächlich vorhandene Ware.
- Flotte, Ware und Gold werden nie doppelt genutzt.
- Eine parallele Reise und eine parallele Flottenänderung ergeben einen konsistenten Endzustand; höchstens eine ist erfolgreich.
- Ein Fehler in der KI-Phase rollt den vollständigen Tick einschließlich Ledger, Orders, Reisen, Produktion und Entscheidungsprotokoll zurück.
- Dieselbe Tick-ID erzeugt keine Doppelaktion.
- Ein Versionskonflikt eines KI-Befehls ist eine reguläre Ablehnung und rollt den Tick **nicht** zurück.

## Langzeitsimulationen

### 720 Ticks

Nach **jedem** Tick wird geprüft:

- die Gesamtgeldmenge beträgt exakt 170.717.000 moneyUnits;
- kein Konto ist negativ und jede Kontoformel stimmt;
- jede offene Order ist vollständig gedeckt;
- jede Warenänderung ist erklärbar und die Gesamtmenge je Ware stimmt;
- Schiffe entstehen ausschließlich durch einen fertiggestellten Bauauftrag und verschwinden nie;
- jedes Objekt besitzt genau einen Eigentümer;
- keine Flotte ist gleichzeitig in einem Hafen und auf Reise;
- die Entscheidungsbudgets wurden in keinem Zyklus überschritten.

### 4.320 Ticks

Am Ende wird geprüft:

- mindestens eine Versorgungslücke wurde erkannt und real bearbeitet;
- mindestens ein vollständiger interstädtischer KI-Handel wurde abgeschlossen;
- die KI reagiert nachweislich auf den menschlichen Marktanteil;
- es gibt keine ungebremste Gebäude- oder Schiffsexplosion;
- die Investitionsraten von 24 beziehungsweise 72 Ticks wurden durchgehend eingehalten;
- eine Wiederholung liefert einen identischen Endzustand.

## End-to-End-Happy-Path

Mit echtem Fastify-Server und echtem Vue-Client:

1. `alpha6-bread-shortage` laden.
2. Handelshäuser und ihre Startschiffe prüfen.
3. den kritischen Brotmangel in Mannheim in der Versorgungsanzeige prüfen.
4. den KI-Zyklus auslösen und die entstandene gedeckte Buy Order in Neustadt prüfen.
5. Verladung und Abfahrt der Reise Neustadt–Mannheim verfolgen.
6. nach exakt 8 Ticks Ankunft und Entladung im Zielkontor prüfen.
7. die entstandene Sell Order und den anschließenden Bevölkerungskauf prüfen.
8. Gebühren, Versorgung und Wohlstand prüfen.
9. die Debug-Entscheidung mit Kosten, Marge und Grund öffnen.
10. eine eigene Spielerreise starten und dieselbe Reiseregel nachweisen.
11. die Seite neu laden und ausschließlich serverbestätigte Zustände erneut prüfen.
12. den Tickbericht mit unveränderten Invarianten prüfen.

Der Ablauf läuft auf Desktop Chromium und einem kleinen mobilen Chromium-Profil, jeweils ohne horizontalen Seitenüberlauf, mit Touch-Zielen von mindestens 44 × 44 CSS-Pixeln und ohne hoverabhängige Bedienung.

## CI-Diagnosen

Bei einem Fehler bewahrt die CI mindestens auf:

- Playwright-Trace, Screenshot, Browserkonsole und Serverlog;
- Testpreset und Seed;
- den letzten Tickbericht;
- alle KI-Entscheidungen des betroffenen Ticks mit Gründen;
- Orders, Executions und Ledger;
- Reisen, Logistik-, Investitions- und Schiffspläne;
- alle Konten, Warenbestände, Schiffe, Flotten und Eigentümer;
- den Invariantenvergleich unmittelbar vor und nach dem Fehler.

Die Diagnose darf keine privaten fremden Spieleridentitäten offenlegen.

## Abnahmesperren

Alpha 6 ist erst abgenommen, wenn:

- alle Tests grün sind;
- die 720-Tick-Simulation nach jedem Tick bilanziert;
- die 4.320-Tick-Simulation stabile und begrenzte Entwicklung zeigt;
- zwei Wiederholungen vollständig identische Ergebnisse liefern;
- die mobile und die Desktop-E2E erfolgreich sind;
- Dokumentation und Implementierung widerspruchsfrei sind;
- kein KI-System ungedeckte Ressourcen erzeugen kann;
- kein Alpha-7-System – persistente PostgreSQL-Welt, Echtzeittick, Kampf oder Karibikkarte – enthalten ist.
