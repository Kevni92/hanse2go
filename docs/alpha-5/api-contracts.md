# Alpha 5: Orderbuch-API und Atomarität

Dieses Dokument ist der verbindliche technische Vertrag für den Alpha-5-Markt. Der Server ist die einzige Autorität für Konten, Reservierungen, Orders, Executions, Ledger und Tickberichte. Der Client sendet Absichten und zeigt ausschließlich den zuletzt serverbestätigten Zustand.

## Schreibmodell

Alle schreibenden Orderbefehle verlangen den Header `Idempotency-Key` mit einer nichtleeren, aufrufstabilen ID. Alternativ darf die JSON-Nutzlast das Feld `idempotencyKey` enthalten; der Server normalisiert beide Formen und lehnt widersprüchliche oder fehlende Werte ab. Ein Schlüssel wird zusammen mit einer kanonisch serialisierten Nutzlast und dem vollständigen Ergebnis gespeichert.

- Derselbe Schlüssel mit identischer Nutzlast liefert das ursprüngliche Ergebnis erneut.
- Derselbe Schlüssel mit anderer Nutzlast liefert `ORDER_IDEMPOTENCY_PAYLOAD_CONFLICT` und verändert keinen Zustand.
- Eine fehlgeschlagene Transaktion speichert kein teilweises Ergebnis und keinen Ledgerrest.
- Systemorders verwenden deterministische Schlüssel aus Stadt, Ware, Eigentümertyp und Konsumperiode beziehungsweise Ticknummer.
- Spieler senden niemals eine Ausführungs- oder Settlement-Anweisung, sondern nur eine Orderabsicht.

Jedes Stadt-Ware-Orderbuch wird während eines Schreibbefehls serialisiert. Die In-Memory-Implementierung verwendet dafür die bestehende Welttransaktion; eine spätere Persistenz muss dieselben Commit-Grenzen erhalten.

## Lesen

Alle folgenden Routen prüfen den lokalen Stadtzugang, sofern eine Stadt betroffen ist. Fremde Spielerkonten und Order-Eigentümer werden nicht offengelegt.

| Methode und Route | Antwort | Zweck |
|---|---|---|
| `GET /api/cities/:cityId/market/:goodId/order-book` | `OrderBookResponse` | sichtbare Bid-/Ask-Stufen, beste Preise, letzter Preis und `orderBookVersion` |
| `GET /api/cities/:cityId/market/:goodId/trades` | `TradeHistoryResponse` | unveränderliche Executions und sichtbarer Verlauf |
| `GET /api/cities/:cityId/market/summary` | `MarketSummaryResponse` | Best Bid/Ask und offene Mengen je Ware |
| `GET /api/player/orders` | `PlayerOrdersResponse` | eigene offene und historische Orders mit optionalen Filtern `cityId`, `goodId`, `status` |
| `GET /api/player/ledger` | `PlayerLedgerResponse` | eigene Goldbuchungen und Gebühren mit optionalem Tickfilter |
| `GET /api/cities/:cityId/treasury` | `TreasuryResponse` | öffentliche Stadt- und Bevölkerungskasse sowie aggregierte Flüsse |
| `GET /api/cities/:cityId/market/orders/:orderId` | `OrderDetailsResponse` | eigene Order, Reservierung und zugehörige Executions |

Eine Preisstufe enthält mindestens `limitPriceGoldPerTon`, `quantityUnits`, `cumulativeQuantityUnits` und `ownQuantityUnits`. Die Identität fremder Spieler wird durch `ownerType` (`city`, `population` oder anonymisierte `player`) ersetzt.

## Spielerbefehle

| Methode und Route | Anfrage | Ergebnis |
|---|---|---|
| `POST /api/cities/:cityId/market/orders` | `CreateOrderRequest` | Order, alle Executions dieses Befehls, Restreservierung, Kontostände, Kontorbestand, Stadtkasse, Ruf und Buchversion |
| `DELETE /api/cities/:cityId/market/orders/:orderId` | Header plus `expectedOrderVersion` | stornierte Restorder, freigegebene Reservierung, neue Version und Ledgerreferenzen |
| `POST /api/cities/:cityId/market/orders/:orderId/replace` | Header, `expectedOrderVersion`, neue Seite/Menge/Limit | alte Order `replaced`, neue Order, Executions und beide Reservierungsänderungen |

`CreateOrderRequest` enthält:

```json
{
  "goodId": "wood",
  "side": "buy",
  "quantityUnits": 1000,
  "limitPriceGoldPerTon": 100,
  "idempotencyKey": "player-alpha-wood-buy-0001"
}
```

Die Menge ist in Hundertstel-Tonnen, der Limitpreis eine positive ganze Goldzahl je Tonne. Für `buy` reserviert der Server `maximumTradeValueMoneyUnits + maximumBuyerFeeMoneyUnits`; für `sell` reserviert er exakt `quantityUnits` freie Kontor-Wareneinheiten. Die Order wird unmittelbar nach der Reservierung gegen das lokale Buch gematcht.

Eine Antwort enthält mindestens:

- die vollständige Order mit `status`, `remainingQuantityUnits`, `reservedMoneyUnits` oder `reservedGoodsUnits` und `orderVersion`;
- alle in diesem Befehl entstandenen Executions in Reihenfolge;
- `orderBookVersion`;
- `account.availableMoney`, `account.reservedMoney`, `account.totalMoney` und `accountVersion`;
- `inventory.availableUnits`, `inventory.reservedUnits`, `inventory.totalUnits` und `inventoryVersion`;
- Stadtkasse nach den Gebühren;
- `reputationDelta` und unveränderliche Ledgerreferenzen.

Auch eine sofort vollständig ausgeführte Order wird mit `status: "filled"` zurückgegeben. Nicht ausgeführte Restmengen bleiben mit ihrem Restbestand offen.

## Versionen und Konflikte

- `orderVersion` startet bei 1 und steigt bei Füllung, Statusänderung, Stornierung, Ersetzung oder Ablauf.
- Jedes Stadt-Ware-Buch besitzt eine monotone `orderBookVersion`; jede sichtbare Mutation erhöht sie.
- Konten und Kontore besitzen eigene `accountVersion` beziehungsweise `inventoryVersion`.
- Storno und Ersetzung verlangen die vom Client gelesene `expectedOrderVersion`.
- Erstellung prüft Konto und Kontor atomar und braucht keine vom Client vorgegebene Buchversion.
- Eine veraltete Version liefert einen Konflikt statt einer stillen Überschreibung.

Verbindliche technische Fehlercodes sind:

`ORDER_IDEMPOTENCY_REQUIRED`, `ORDER_IDEMPOTENCY_PAYLOAD_CONFLICT`, `ORDER_VERSION_CONFLICT`, `ACCOUNT_VERSION_CONFLICT`, `KONTOR_VERSION_CONFLICT`, `ORDER_BOOK_STATE_CONFLICT`, `ORDER_ATOMIC_COMMIT_FAILED` und `TICK_ORDER_MARKET_INVARIANT_FAILED`.

Die bestehenden Reichweiten-, Kontor-, Mengen-, Preis- und Liquiditätsfehler bleiben gültig. Fachliche Nichtausführung (kein passendes Angebot, zu hoher Preis oder fehlende Finanzierung für einen Teil der Systemnachfrage) ist kein technischer Fehler; die gedeckte Restorder bleibt offen oder wird auf die finanzierte Menge reduziert.

## Atomare Erstellung und Settlement

Eine Ordererstellung ist eine einzige Fachtransaktion:

1. Stadtzugang, Kontor, Ware, Seite, Menge, Preis und Idempotenz prüfen.
2. freie Ware oder verfügbares Gold reservieren.
3. Order mit neuer Sequenz anlegen.
4. Preis-Zeit-Matching vollständig ausführen.
5. jede Execution mit Warenübertragung, Goldflüssen, Gebühren, Ruf und Ledger planen.
6. Order-, Konto-, Kontor-, Waren- und Geldinvarianten prüfen.
7. den gesamten Snapshot gemeinsam bestätigen.

Schlägt eine spätere Teilfüllung oder eine Bilanzprüfung fehl, werden Reservierungen, frühere Teilfüllungen, Status, Versionszähler, Ruf und Ledger gemeinsam zurückgerollt. Ein erfolgreicher Settlement-Eintrag ohne zugehörige Zustandsänderung ist unzulässig.

## Schutz der früheren Systeme

Alle Alpha-2-bis-Alpha-4-Befehle verwenden künftig freie statt gesamte Bestände:

- reservierte Sell-Ware ist für Produktion, Kontor-/Flottentransfer, Gebäude- und Schiffsbau sowie weitere Sell Orders gesperrt;
- reserviertes Buy-Gold ist für Löhne, Konzession, Grundstück, Gebäude, Schiffsbau, Schiffskauf und weitere Buy Orders gesperrt;
- Storno, Ablauf und erfolgreiche Teilfüllung geben ausschließlich die jeweilige Restreservierung frei.

Die historischen Quote-/Trade-Routen und die Bestands-Preisformel dürfen nicht mehr als regulärer Alpha-5-Spielweg registriert oder für Settlement verwendet werden. Basispreise und Zielbestände bleiben Konfigurations- und Referenzwerte. Es gibt keine Market Order und keinen Direkttransfer außerhalb des Buches.

## Tickvertrag

Der manuelle Debug-Tick verwendet die in [`tick.md`](tick.md) dokumentierte Reihenfolge. Der Tick verwendet eine Welttransaktion: Fehler in Matching, Gebühren, Stadtorders, Bevölkerungorders, Ledger oder Invarianten rollen sämtliche Tickphasen zurück. Idempotente Wiederholung liefert exakt denselben gespeicherten Tickbericht.

Der Tickbericht enthält Markt-, Geld- und Warenabschnitte mit Start-/Endgeldmenge, Reservierungen, Konten, Executions, Gebühren, Stadt- und Bevölkerungorders, offenen Resten, Konsummengen und Invariantenstatus.
