# Alpha 5: Orderbuch-, Order- und Treasury-Oberfläche

Die Marktansicht bleibt der zentrale Einstieg für eine Stadt. Sie zeigt ab Alpha 5 ausschließlich das lokale, vollständig gedeckte Limit-Orderbuch und serverbestätigte Zustände. Die UI darf Werte vorhersagen, verändert aber weder Geld, Ware, Reservierungen noch Orders lokal.

## Marktübersicht

Für jede Ware zeigt die Übersicht:

- Warenname und Icon;
- bester Käufer (Best Bid) und günstigstes Angebot (Best Ask);
- Preisdifferenz, offene Buy-Menge und offene Sell-Menge;
- letzten ausgeführten Preis und sichtbares Handelsvolumen;
- eigene freie und für Sell Orders reservierte Kontormenge;
- eigenes verfügbares und für Buy Orders reserviertes Gold.

Fehlt eine Seite, steht `Keine Nachfrage` beziehungsweise `Kein Angebot`. Die UI zeigt keinen künstlichen Referenzpreis als Marktpreis.

Die Übersicht verwendet pro Ware `market-summary-<goodId>`.

## Waren-Detailansicht

Die Detailansicht enthält in dieser Reihenfolge:

1. Preis-, Mengen- und Volumenübersicht;
2. Buy-Order-Seite mit Preisstufen;
3. Sell-Order-Seite mit Preisstufen;
4. Formulare `Kaufen` und `Verkaufen`;
5. eigene offene Orders dieser Ware;
6. letzte Trade Executions.

Auf dem Desktop stehen Buy und Sell als getrennte Tabellen nebeneinander oder untereinander. Jede Stufe zeigt Preis je Tonne, verfügbare Menge, kumulierte Menge und eigene Menge. Auf Mobilgeräten werden die Seiten über eine Segmentsteuerung oder kompakte Karten gewechselt; es gibt keinen horizontalen Seitenüberlauf.

Fremde Spielerkonten werden nicht identifiziert. Stadt- und Bevölkerungsorders dürfen als `Stadt` beziehungsweise `Bevölkerung` gekennzeichnet werden.

Verbindliche IDs sind `order-book-bids-<goodId>` und `order-book-asks-<goodId>`.

## Buy Order

Das Kaufformular enthält Menge in Hundertstel-Tonnen, maximalen Preis je Tonne und das unveränderliche Zielkontor der geöffneten Stadt. Während der Eingabe zeigt es:

- verfügbares Gold;
- maximalen Transaktionswert;
- maximale Käufergebühr;
- insgesamt zu reservierendes Gold;
- geschätzte sofortige Ausführung aus dem sichtbaren Buch;
- erwartete Restorder.

Vor der Bestätigung steht verständlich:

> Gold wird reserviert. Die Order kauft sofort alle passenden günstigeren oder gleich teuren Angebote und bleibt mit der Restmenge offen.

`Zum besten Angebot kaufen` setzt den aktuellen Best Ask als Limitpreis. Die Aktion bleibt eine normale Limit Order; sie ist keine Market Order. Vor dem Senden wird der serverseitige Stand erneut verwendet.

Stabile IDs: `create-buy-order-<goodId>`, `order-quantity-input`, `order-price-input`, `order-trade-value`, `order-fee-preview` und `order-reservation-preview`.

## Sell Order

Das Verkaufsformular enthält Menge, Mindestpreis je Tonne sowie freien, reservierten und gesamten Kontorbestand. Es zeigt maximalen Bruttoerlös, geschätzte Verkäufergebühr, geschätzten Nettoerlös, sofortige Teilfüllung und Restorder.

> Die angebotene Ware wird im Kontor reserviert und kann bis zur Ausführung oder Stornierung nicht anderweitig verwendet werden.

`An besten Käufer verkaufen` übernimmt den Best Bid als Limitpreis und erzeugt ebenfalls eine normale Limit Order.

Die stabile ID für den Einstieg lautet `create-sell-order-<goodId>`; die gemeinsamen Formular-IDs aus dem Buy-Formular bleiben erhalten.

## Serverantwort und Fehler

Nach einer erfolgreichen Antwort werden getrennt angezeigt:

- sofort ausgeführte Menge und jede Teilfüllung mit Preis;
- Bruttowert, Käufer- beziehungsweise Verkäufergebühr und Netto-Goldänderung;
- eingegangene oder abgegangene Kontorware;
- offene Restmenge und Restreservierung;
- mögliche Rufänderung;
- aktualisierter Best Bid und Best Ask.

Die UI zeigt nicht nur `Order erstellt`, wenn Executions stattgefunden haben. Während des Befehls sind Bestätigung und weitere Mutationen gesperrt. Die Werte werden erst aus der Serverantwort übernommen. Bei einem Fehler bleibt der letzte serverbestätigte Zustand sichtbar und erhält einen verständlichen Fehlertext für:

- zu wenig verfügbares Gold oder freie Ware;
- veraltete Order-/Konto-/Kontorversion;
- ungültige Preis- oder Mengenangabe;
- fehlenden Stadtzugang oder fehlendes Kontor;
- atomaren Serverkonflikt;
- Nichterreichbarkeit des Servers.

Dynamische Status-, Execution- und Reservierungsänderungen werden in einer `aria-live`-Region ausgegeben.

## Meine Orders

Die globale Ansicht `Meine Orders` enthält Stadt, Ware, Seite, ursprüngliche und verbleibende Menge, Limitpreis, Status, Reservierung, durchschnittlichen Ausführungspreis, Gebühren sowie Erstellungssequenz oder verständliche Zeitangabe. Filter sind `offen`, `teilweise gefüllt`, `abgeschlossen`, `storniert/abgelaufen`, Stadt, Ware und Seite.

Jede Orderkarte oder Tabellenzeile verwendet `own-order-<orderId>`. Zulässige Aktionen sind `cancel-order-<orderId>` und `replace-order-<orderId>`.

### Stornieren

Die Bestätigung nennt Restmenge, freizugebendes Gold oder freizugebende Ware und weist darauf hin, dass bereits ausgeführte Trades bestehen bleiben. Nach Erfolg aktualisiert die UI Reservierungen ausschließlich aus der Antwort.

### Ersetzen

Der Dialog stellt alte und neue Menge, Preis und Seite gegenüber und nennt neue Reservierung, freigegebene alte Reservierung sowie erwartete sofortige Ausführung. Der Hinweis lautet: `Die neue Order verliert ihre bisherige Zeitpriorität.` Die alte Order bleibt als `Ersetzt` in der Historie. Stabile Version und Idempotenzwerte werden mitgesendet.

## Trade-Historie und Ledger

Je Ware und eigener Order zeigt die Trade-Historie Tick oder Zeitpunkt, Menge, Ausführungspreis, Bruttowert, beide Gebühren, Nettoauswirkung, Gegenparteityp (`Stadt`/`Bevölkerung`) und möglichen Rufgewinn. Eine Execution ist unveränderlich und verwendet `trade-execution-<executionId>`.

Die Ledgeransicht zeigt eigene Goldbuchungen mit Grund, Betrag, Quelle/Ziel, Tick, Referenz und verfügbaren/reservierten Kontoständen. Sie kennzeichnet Marktwert, Käufergebühr und Verkäufergebühr getrennt.

## Gold, Waren und Stadtwirtschaft

Jede Anzeige unterscheidet ausdrücklich:

- `Verfügbar`;
- `Reserviert`;
- `Gesamt`.

Gold wird mit zwei Nachkommastellen im `de-DE`-Format dargestellt, zum Beispiel `12.345,67 Gold`. Das HUD zeigt primär verfügbares Gold und den reservierten Unterbestand. Bau-, Lohn-, Schiff- und Orderdialoge verwenden immer den verfügbaren Betrag. Die IDs `gold-available` und `gold-reserved` sind stabil.

Kontorbestände zeigen frei verfügbare, für Sell Orders reservierte und gesamte Tonnen. Produktion, Transfers, Gebäude- und Schiffsbau dürfen reservierte Ware nicht als frei verfügbar anbieten. Die IDs lauten `kontor-good-available-<goodId>` und `kontor-good-reserved-<goodId>`.

Der aufklappbare Bereich `Stadtwirtschaft` zeigt:

- Stadtkasse und Bevölkerungskasse jeweils verfügbar/reserviert/gesamt;
- Handelsgebühren im letzten Tick, gezahlte Löhne und Bevölkerungsausgaben;
- offene Stadt- und Bevölkerungorders;
- den Hinweis, dass beide Kassen endlich sind.

Stabile IDs: `city-treasury` und `population-treasury`.

Die Wohlstandsanzeige unterscheidet finanzierbare Nachfrage, tatsächliche Käufe, unfinanzierte Nachfrage, fehlendes Angebot, Durchschnittspreise und Bevölkerungskasse. Sie erklärt Kaufkraft und Warenverfügbarkeit getrennt.

## Tickbericht

Der Abschnitt `Ordermarkt und Goldkreislauf` zeigt abgelaufene Bevölkerungorders, neue Stadt- und Bevölkerungorders, Executions, Volumen, Gebühren je Stadt, Konten vorher/nachher, Reservierungen/Freigaben, Geldmenge vorher/nachher mit Status `unverändert`, Warenbilanz und reale Konsummengen. Die Übersichtsregion verwendet `tick-report-order-market`; die Geldmengenprüfung verwendet `money-supply-invariant`.

## Responsive Bedienung und Barrierefreiheit

Mobil ist das Orderformular ein Bottom Sheet oder Vollbilddialog; jedes Touch-Ziel ist mindestens 44 × 44 CSS-Pixel groß. Eigene Orders erscheinen als Karten oder Akkordeons. Betrag, Gebühr und Reservierung bleiben vor Bestätigung sichtbar. Keine Funktion hängt ausschließlich von Hover ab.

Auf Desktop dürfen Orderbuch und Formular nebeneinander stehen. Tiefe wird in Tabellen dargestellt, Orders und Trades sind filterbar, und die Stadtwirtschaft nutzt ein Kennzahlenraster. Beim Verkleinern bleibt jede Funktion erhalten.

Buy und Sell werden nicht ausschließlich über Farbe unterschieden. Alle Eingaben besitzen sichtbare Labels, Fehlertexte und eine Zusammenfassung. Dialoge halten den Fokus und geben ihn nach dem Schließen zurück; Erstellung, Stornierung und Ersetzung sind vollständig per Tastatur bedienbar. Tabellen besitzen verständliche Überschriften.

## Alpha 6: Akteurstypen im Orderbuch

Ab Alpha 6 kennzeichnet das Orderbuch zusätzlich Orders und Executions von KI-Handelshäusern als `Handelshaus` mit ihrem lokalisierten Namen. Preis-Zeit-Priorität und Sortierung ändern sich dadurch nicht; ein Handelshaus erhält keine hervorgehobene Position.

`Stadt`, `Bevölkerung`, `Spieler`, `Handelshaus` und `Eigene Order` sind über Text und Icon unterscheidbar; Farbe ist niemals das einzige Merkmal. Ein Handelshaus wird namentlich genannt, weil es ein öffentlicher Wirtschaftsakteur ist; fremde Spieler bleiben wie bisher anonymisiert, und fremde private Bestände werden weiterhin nicht angezeigt.

Die vollständige Alpha-6-Oberfläche für Handelshäuser, Versorgungsstatus, Marktanteile, Reisen und die Debug-Entscheidungsansicht steht in [`../alpha-6/user-interface.md`](../alpha-6/user-interface.md).
