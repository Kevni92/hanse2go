# Alpha 6: Handelshaus-, Wirtschafts- und Reiseoberfläche

Die KI darf für Spieler nicht wie ein unsichtbarer Cheat wirken. Ihre öffentlichen wirtschaftlichen Handlungen müssen sichtbar und nachvollziehbar sein. Zusätzlich braucht Alpha 6 eine klar gekennzeichnete Debug-Ansicht, die jede Entscheidung und jede Ablehnung erklärt.

Die Oberfläche zeigt ausschließlich serverbestätigte Zustände. Sie darf Werte zur flüssigen Bedienung vorhersagen, verändert aber weder Geld, Ware, Orders, Pläne noch Reisen lokal. Alle Anzeigenamen und Erklärtexte stammen aus den Sprachdateien; der Server liefert Codes und Zahlen.

## Ansicht `Handelshäuser`

Je Handelshaus:

- Name und Heimatstadt;
- Status `Aktiv`, `Liquidität sichern` oder `Insolvent`, mit Dauer seit dem Wechsel;
- öffentliches Gesamtvermögen als grobe Kategorie;
- Anzahl Kontore, Gebäude, Schiffe und Flotten;
- aktuell reisende Flotten mit Ziel und Restticks;
- gehandelte Waren und öffentliches 72-Tick-Volumen;
- Marktanteile je Stadt und Ware;
- die letzten öffentlichen Wirtschaftsaktivitäten.

### Vermögenskategorien

Das öffentliche Gesamtvermögen wird als Kategorie statt als exakter Betrag gezeigt. Bewertet werden verfügbares und reserviertes Gold, Warenbestände zur Kostenbasis, Gebäude zu ihren Baukosten und Schiffe zum neutralen Ankaufspreis:

| Kategorie | Gesamtvermögen |
|---|---|
| `sehr klein` | unter 50.000,00 Gold |
| `klein` | 50.000,00 bis unter 150.000,00 Gold |
| `mittel` | 150.000,00 bis unter 400.000,00 Gold |
| `groß` | 400.000,00 bis unter 1.000.000,00 Gold |
| `sehr groß` | ab 1.000.000,00 Gold |

Im Alpha-Debugbetrieb darf zusätzlich der exakte Kontostand sichtbar sein. Im späteren regulären Spiel bleibt er privat; die Kategorie bleibt öffentlich.

## Kennzeichnung im Orderbuch

Orders und Executions eines Handelshauses werden als `Handelshaus` mit lokalisiertem Namen gekennzeichnet.

- Preis-Zeit-Priorität wird unverändert dargestellt; die Sortierung ändert sich nicht.
- Farbe ist niemals die einzige Kennzeichnung; jeder Akteurstyp besitzt Text und Icon.
- Eigene Spielerorders bleiben deutlich unterscheidbar.
- `Stadt`, `Bevölkerung`, `Spieler`, `Handelshaus` und `Eigene Order` sind über Text und Icon erkennbar.
- Fremde private Bestände und fremde Spieleridentitäten werden nicht angezeigt.

Ein Handelshaus wird namentlich genannt, ein fremder Spieler nicht. Das ist beabsichtigt: Ein Handelshaus ist ein öffentlicher Wirtschaftsakteur, ein Spieler eine Person.

## Stadtwirtschaft und Versorgung

Je Stadt und Ware sichtbar:

- aktuelle Deckung in Prozent;
- Status `normal`, `akut knapp`, `strukturell knapp`, `kritisch knapp` oder `durch Spieler versorgt`;
- Dauer des aktuellen Status in Ticks;
- menschlicher und KI-Handelsanteil der letzten 72 Ticks;
- die angestrebte KI-Obergrenze von 60 % als Referenzlinie;
- ein ausdrücklicher Hinweis, wenn die Grenze wegen kritischer Unterversorgung überschritten werden darf;
- Veränderung des Wohlstands gegenüber vor 72 Ticks;
- offene Bevölkerungs- und Stadtorders.

Prozentwerte werden aus den ganzzahligen Basispunkten des Servers abgeleitet und nie im Client neu berechnet.

## Flotten und Reisen

Die öffentliche Flottenansicht zeigt für sichtbare Flotten:

- Flottenname und Eigentümer, bei `ownerType = ai` den Namen des Handelshauses;
- Schiffstypen und Gesamtkapazität;
- Status und aktuellen Hafen oder laufende Reise;
- Start- und Zielstadt;
- Restticks und erwarteten Ankunftstick;
- transportierte Warengruppen und Gesamtmenge.

Eine vollständige private Ladungsdetailauflistung fremder Flotten ist im späteren regulären Spiel nicht erforderlich; im Alpha-Debugbetrieb darf sie sichtbar sein.

### Spielerreise

Die Reise-UI zeigt vor der Abfahrt:

- Auswahl der Zielstadt aus den direkt erreichbaren Städten;
- Distanz in Kilometern, Flottengeschwindigkeit und die daraus berechnete Fahrzeit in Ticks;
- eine deutliche Warnung, dass Flottenzusammensetzung und Ladung während der Reise gesperrt sind;
- den Hinweis, dass die Reise nicht abgebrochen oder umgeleitet werden kann.

Nach der Bestätigung zeigt sie die laufende Reise mit Fortschritt, Restticks und erwarteter Ankunft. Während der Reise ist keine Debugposition erforderlich und keine Positionsangabe wirkt auf die Flotte.

Ist die einzige Flotte des Spielers unterwegs, weist die Oberfläche verständlich darauf hin, dass bis zur Ankunft keine positionsgebundene Aktion möglich ist.

## Öffentliche Aktivitätschronik

Chronologisch, neueste zuerst, mit Tick und Akteur:

- Order erstellt, teilweise oder vollständig ausgeführt, storniert oder ersetzt;
- Ware verladen oder entladen;
- Flotte abgefahren oder angekommen;
- Konzession oder Kontor erworben;
- Gebäude oder Wohnhaus gebaut;
- Schiff gekauft, verkauft, beauftragt oder fertiggestellt;
- Statuswechsel eines Handelshauses;
- Rückzug aus einem ausreichend spielerversorgten Markt.

Es werden ausschließlich öffentlich vertretbare Daten angezeigt. Private Bestände, Kostenbasen, Pläne und Scores erscheinen hier nicht.

## Debug-Ansicht `KI-Entscheidungen`

Ausschließlich im Debug- und Testbetrieb verfügbar, unter derselben Bedingung wie `POST /test/reset`. Die Ansicht ist deutlich als Debug-Funktion gekennzeichnet.

Filter: Tick, Handelshaus, Stadt, Ware, Zyklus `operativ` / `taktisch` / `strategisch`, Ergebnis `ausgeführt` / `abgelehnt` / `fehlgeschlagen`.

Je Entscheidung:

- Eingangsmetriken und die verwendeten Beobachtungsfenster;
- `supportScore` mit allen fünf Bestandteilen;
- alle geprüften Optionen in ihrer Sortierreihenfolge;
- erwartete Kosten, Erlöse, Gebühren, Transportkosten und Marge;
- Liquidität und Reserven vor und nach der Entscheidung;
- gewählte Flotte, Route, Order, Gebäude oder Schiff;
- angewandte Tie-Breaker;
- erzeugte Fachbefehle und deren serverbestätigte Ergebnisse;
- genau ein eindeutiger Ablehnungsgrund.

Die Ansicht ist reine Anzeige. Es gibt keinerlei Bedienelement, das eine KI-Entscheidung auslösen, verändern, überstimmen oder unterdrücken kann.

## Erklärtexte

Jeder `reasonCode` und jeder Versorgungsstatus besitzt genau einen deutschen Erklärtext in den Sprachdateien. Verbindliche Beispiele:

- `Diese Ware ist seit 12 Stunden akut knapp.`
- `Das Handelshaus transportiert vorhandene Ware, statt ein Gebäude zu bauen.`
- `Keine Investition: 25.000,00 Gold Liquiditätsreserve würden unterschritten.`
- `Keine weitere KI-Order: Spieler decken bereits mehr als 70 % des Handelsvolumens.`
- `Schiffsbau verworfen: vorhandenes Schiff ist wirtschaftlicher.`
- `Keine Aktion: erwarteter Verkaufspreis deckt Kosten und Gebühren nicht.`

Die Texte enthalten Platzhalter für Zahlenwerte, die der Server liefert. Freie oder generative Texterzeugung ist ausgeschlossen.

## Tickbericht

Neuer Abschnitt `Handelshäuser und virtuelle Reisen` mit:

- Status und Konten je Handelshaus;
- fortgeschriebene, gestartete und angekommene Reisen;
- neue und abgeschlossene Logistikpläne;
- KI-Orders und Executions;
- Gebäude- und Schiffsentscheidungen;
- Statusklassifikationen je Stadt und Ware;
- Marktanteile und Rückzugsereignisse;
- Invariantenstatus für Gold, Waren, Schiffe und Eigentum;
- abgelehnte Optionen gruppiert nach Grund.

## Mobile Layout

- einspaltige Handelshauskarten;
- Reisen als Fortschrittskarten mit gleichwertigem Textinhalt;
- Marktanteile als Balken **plus** Prozenttext;
- Wirtschaftsstatus je Stadt als Akkordeon;
- Debug-Entscheidungen als aufklappbare Karten;
- keine horizontale Seitenscrollleiste;
- alle Touch-Ziele mindestens 44 × 44 CSS-Pixel;
- keine Bedienung, die Hover voraussetzt.

Breite Inhalte wie Kandidatenlisten und Berechnungen scrollen innerhalb ihres eigenen Containers, nie über die Seite.

## Desktop Layout

- Handelshäuser als Kennzahlenraster;
- Flottenreisen als Tabelle oder Zeitachse;
- Stadt-Ware-Matrix für Deckung und Marktanteile;
- Debug-Ansicht als filterbare Master-Detail-Tabelle;
- lange Berechnungen und Kandidatenlisten aufklappbar statt dauerhaft ausgeklappt.

## Barrierefreiheit

- KI-, Spieler-, Stadt- und Bevölkerungsakteure sind nie ausschließlich über Farbe unterscheidbar; jeder trägt Text und Icon.
- Der Reisefortschritt verwendet `role="progressbar"` mit `aria-valuenow`, `aria-valuemin`, `aria-valuemax` und zusätzlich einen Textwert wie `Noch 3 von 8 Stunden`.
- Neue Ereignisse in der Aktivitätschronik und Statuswechsel werden über `aria-live="polite"` angekündigt.
- Filter, Tabellen und Akkordeons sind vollständig per Tastatur bedienbar, in sinnvoller Fokusreihenfolge.
- Alle Überschriften sind hierarchisch korrekt; jedes Bedienelement besitzt einen zugänglichen Namen.
- Der Reisedialog setzt den Fokus beim Öffnen auf sein erstes Bedienelement und gibt ihn beim Schließen an den Auslöser zurück.

## Stabile Test-IDs

| ID | Element |
|---|---|
| `ai-house-list` | Liste aller Handelshäuser |
| `ai-house-<actorId>` | Karte eines Handelshauses |
| `ai-house-status-<actorId>` | Statusanzeige eines Handelshauses |
| `ai-market-share-<cityId>-<goodId>` | Marktanteilsanzeige |
| `shortage-status-<cityId>-<goodId>` | Versorgungsstatus |
| `voyage-card-<voyageId>` | Reisekarte |
| `voyage-progress-<voyageId>` | Fortschrittsanzeige einer Reise |
| `start-voyage-<fleetId>` | Abfahrtsaktion einer Flotte |
| `ai-decision-list` | Debug-Entscheidungsliste |
| `ai-decision-<decisionId>` | einzelne Entscheidung |
| `ai-decision-reason-<decisionId>` | Ablehnungs- oder Entscheidungsgrund |
| `ai-logistics-plan-<planId>` | Logistikplan |
| `ai-investment-plan-<planId>` | Investitionsplan |
| `tick-report-ai` | KI-Abschnitt des Tickberichts |
| `ai-gold-invariant` | Goldinvariante im Tickbericht |
| `ai-goods-invariant` | Wareninvariante im Tickbericht |
| `ai-ship-invariant` | Schiffsinvariante im Tickbericht |

## Ausdrücklich ausgeschlossen

KI-Steuerung oder manuelles Eingreifen durch Spieler, Änderung von KI-Regeln in der Oberfläche, vollständige private Inventare fremder Akteure im regulären Spiel, grafische Karibikkarte, Kampf- oder Reparaturanzeigen sowie generative Freitexterklärungen.
