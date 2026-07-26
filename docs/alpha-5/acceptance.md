# Alpha 5: vollständige Abnahme

Die Abnahme beweist den geschlossenen Gold- und Warenkreislauf, nicht nur die sichtbare Orderbuchoberfläche. Jeder Befehl und jeder Tick prüft:

`sum(all available balances + all reserved balances) = 170.717.000 moneyUnits`

Zusätzlich gilt für jedes Konto `availableMoney + reservedMoney = totalAccountMoney`, kein Konto ist negativ und jede Warenänderung ist durch Produktion, Orderausführung, Konsum, Bau oder Schiffsbau erklärbar.

## Domänen- und Bilanztests

### Reservierungen

- Eine Sell Order über 10,00 t Holz aus 100,00 t lässt 90,00 t verfügbar, 10,00 t reserviert und 100,00 t gesamt.
- Reservierte Ware kann nicht transferiert, produziert, verbaut, verschifft oder erneut angeboten werden.
- Nach Storno sind wieder 100,00 t verfügbar; die Gesamtmenge ändert sich nicht.
- Eine Buy Order über 10,00 t zu 100 Gold/t reserviert 1.005,00 Gold, senkt den verfügbaren Betrag um genau diesen Wert und verändert die Kontosumme nicht.
- Nach Storno wird die Restreservierung vollständig freigegeben.

### Matching und Gebühren

Eine ruhende Sell Order über 10,00 t Holz zu 90 Gold/t und eine neue Buy Order bis 100 Gold/t ergeben exakt:

| Wert | Ergebnis |
|---|---:|
| Preis | 90 Gold/t |
| Menge | 10,00 t |
| Bruttowert | 900,00 Gold |
| Käufergebühr | 4,50 Gold |
| Verkäufergebühr | 4,50 Gold |
| Käuferbelastung | 904,50 Gold |
| Verkäufergutschrift | 895,50 Gold |
| Stadtkasse | +9,00 Gold |

Es entsteht genau eine Execution, beide Orders sind `filled`, die Warenmenge ist nur übertragen und die Gesamtgeldmenge bleibt unverändert. Gebühren werden für jede Teilfüllung einzeln auf den nächsten Hundertstel-Goldbetrag aufgerundet.

Weitere Pflichtfälle:

- Sells 5 t/80, 10 t/85, 5 t/90 werden von Buy 20 t/100 in genau dieser Reihenfolge ausgeführt.
- Eine Buy Order über 20 t mit nur 7,50 t Angebot wird `partially_filled`; die Reservierung entspricht exakt der Restmenge, dem Limitpreis und der maximalen Restgebühr.
- Niedrigerer Sell-Preis, höherer Buy-Preis und ältere `createdSequence` gewinnen; Ersetzen verliert Zeitpriorität.
- Eigenorders werden übersprungen, fremde Gegenorders danach normal gematcht.
- Ruhender Preis und beide Gebühren stehen in jeder Execution und im Ledger.

### Lebenszyklus, Idempotenz und Rollback

- Storno gibt nur die Restreservierung frei; fertige Trades bleiben unverändert.
- Ersetzung erzeugt neue Order-ID und Sequenz; bei fehlender Deckung bleibt die alte Order vollständig unverändert.
- Wiederholung mit identischer Idempotenz-ID erzeugt weder neue Order noch neue Execution.
- Wiederholung mit anderer Nutzlast liefert einen Konflikt ohne Zustand.
- Fehler in einer späteren Teilfüllung, beim Ledger oder bei der Invariante rollt alle früheren Teilfüllungen des Befehls zurück.
- Zwei parallele Befehle können zusammen höchstens die vorhandene Restmenge ausführen.

## Stadt- und Bevölkerungorders

Für Lambrecht wird ein Bestand von 200 t Holz bei Ziel 100 t als gedeckte Sell Order über 100 t zu 88 Gold/t angeboten. Bei 65 t Brot und Ziel 80 t wird eine finanzierbare Buy Order über 15 t zu 171 Gold/t erzeugt. Es gibt pro Stadt-Ware nie gleichzeitig Stadt-Buy und Stadt-Sell; ein Refresh storniert Restorders, gibt Reservierungen frei und erzeugt deterministisch neu.

Bei Wohlstand 40 besitzt die Bevölkerung in Lambrecht 4,00 t Brotbedarf und ein Limit von 171 Gold/t. Eine Spieler-Sell Order zu 170 Gold/t führt zu 680,00 Gold Bruttowert, 3,40 Gold je Gebühr, 676,60 Gold Verkäufergutschrift, 683,40 Gold Bevölkerungsbelastung, 6,80 Gold Stadtkassenzuwachs und unmittelbar konsumierten 4,00 t. Der Spieler erhält Ruf nur für diese reale Ausführung.

Die Negativfälle prüfen: Sell 172 Gold/t führt zu keiner Ausführung; fehlendes Bevölkerungsgold reduziert die finanzierte Menge; fehlendes Angebot ergibt Kaufkraft 1, aber Versorgung 0; die offene Restorder läuft am Folgetick ab und gibt Gold frei.

Kaufkraft und Versorgung werden getrennt geprüft. Die Wohlstandsformel bleibt `100 × Versorgung × (0,4 + 0,6 × Kaufkraft)` und die bestehende Glättung sowie Begrenzung 0–100 bleiben erhalten.

## Frühere Zahlungen und Werften

Konzession, Grundstück, Gebäudegold, Kontor, Wohnhaus und Werftgebühr erhöhen die jeweilige Stadtkasse exakt. Schiffskauf belastet Spieler und schreibt der Stadtkasse gut; Schiffsverkauf belastet die Stadtkasse und schreibt dem Verkäufer gut. Eine zu kleine Stadtkasse lehnt den Ankauf atomar ab. Baumaterialien bleiben Warensenken.

## 720-Tick-Bilanzsimulation

Eine beschleunigte, deterministische Simulation führt 720 Stundenticks mit Stadtorders, Bevölkerungorders, Löhnen, Produktion, Konsum, Wohlstand, Wachstum und Werften aus. Nach jedem Tick müssen Geldmenge, Nichtnegativität, Kontoformel, Orderdeckung, Warenherkunft und ausgeglichener Ledger stimmen. Ein Testfehler nennt Tick, Phase, Seed, Orderbuch, Konten, Reservierungen, Lager und letzte Ledgerbuchung.

## REST-, Komponenten- und E2E-Abnahme

Die API-Tests decken alle Lese- und Schreibverträge aus [`api-contracts.md`](api-contracts.md), Versionen, Idempotenz, Stadtzugang, Rollback und serverbestätigte Zustände ab. Die Komponentenabnahme prüft die stabilen IDs aus [`user-interface.md`](user-interface.md), `aria-live`, getrennte freie/reservierte/gesamte Werte, Gebühren-/Reservierungsvorschau, Cancel-and-Replace und die fehlende Market-Order.

Der vollständige Happy Path läuft mit echtem Fastify-Server und Vue-Client:

1. `alpha5-order-ready` laden und Lambrecht öffnen.
2. Bid/Ask und Stadtorders prüfen.
3. Holz-Sell Order unter vorhandener Buy-Order einstellen und Sofortausführung prüfen.
4. Buy Order gegen mehrere Angebote ausführen, Restreservierung prüfen, ersetzen und stornieren.
5. Brot-Sell Order einstellen, Tick auslösen und Bevölkerungskauf, Konsum, Kasse, Versorgung, Wohlstand und Ruf prüfen.
6. `Meine Orders`, Trade-Historie, Ledger und Tickbericht öffnen.
7. Seite neu laden und nur serverbestätigte Werte erneut prüfen.
8. sicherstellen, dass der alte Direktkauf-/Verkaufsdialog und die alte Preisformel nicht mehr als Spielaktion vorhanden sind.

Der Happy Path läuft mindestens auf Desktop Chromium und einem mobilen Chromium-Profil. Mobil werden zusätzlich kein horizontaler Überlauf, mindestens 44 × 44 CSS-Pixel-Touchziele, Tastatur-/Fokusverhalten, sichtbare Gebühren/Reservierungen und hoverfreie Bedienung geprüft.

## CI-Diagnosen

Bei Fehlern bewahrt CI Playwright-Trace, Screenshot, Browserkonsole, Serverlog, Preset/Seed, Orderbuch, Orders, Executions, Ledger, alle Kontostände, alle Stadt-/Kontorbestände und den letzten Tickbericht auf. Die Diagnose darf keine privaten fremden Spieleridentitäten offenlegen.

## Abnahmesperren

Alpha 5 ist erst abgenommen, wenn alle Tests grün sind, die 720-Tick-Simulation nach jedem Tick bilanziert, die mobile und Desktop-E2E erfolgreich sind, die Dokumentation und Implementierung widerspruchsfrei sind und kein Alpha-6-System (KI, virtuelle Reise oder neue Geldquelle) enthalten ist.
