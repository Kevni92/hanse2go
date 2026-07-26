# Alpha 6: verbindliche Balancingwerte

Alle Werte dieses Dokuments stehen in `packages/config/game-config.json` und werden beim Serverstart validiert. Eine Änderung erfolgt ausschließlich über ein eigenes Folge-Issue, nie beiläufig in einer Implementierung.

## Startvermögen

| Wert | Betrag |
|---|---:|
| Heimatkapital je Handelshaus | 150.000,00 Gold |
| Konzessionsgebühr | 10.000,00 Gold |
| Kontorkosten gesamt | 10.000,00 Gold |
| verfügbar Westwind-Handelshaus | 98.000,00 Gold |
| verfügbar Haardt-Kompanie | 110.000,00 Gold |
| verfügbar Rheinhandel-Kontor | 70.000,00 Gold |

## Liquidität und Handel

| Wert | Betrag |
|---|---:|
| Liquiditätsreserve für Investitionen | 25.000,00 Gold |
| Lohnvorschau für Liquiditätsprüfungen | 24 Ticks |
| maximaler Kapitaleinsatz je Handelsentscheidung | 25 % des verfügbaren Goldes |
| Zielmarge regulär | 10 % |
| Zielmarge bei `acute_shortage` | 5 % |
| Zielmarge bei `critical_shortage` | 0 % |
| Käufer- und Verkäufergebühr | je 5 Promille, unverändert aus Alpha 5 |

## Unterstützungsgrenzen

| Status | Bedingung |
|---|---|
| `acute_shortage` | Deckung unter 60 % für 12 Ticks |
| `structural_shortage` | Deckung unter 70 % für 72 Ticks bei unter 40 % menschlichem Anteil |
| `critical_shortage` | Deckung unter 50 % für 24 Ticks, oder 24 Ticks kein finanzierbares Angebot |
| `player_supplied` | Deckung über 90 % und menschlicher Anteil über 70 % für 72 Ticks |
| reguläres KI-Marktanteilsziel | höchstens 60 % je Stadt und Ware über 72 Ticks |

## Investitionen

| Wert | Grenze |
|---|---:|
| größere Investitionen je Handelshaus | höchstens eine je 24 Ticks |
| neue Schiffe je Handelshaus | höchstens eines je 72 Ticks |
| Amortisation Gebäude und Wohnhäuser | höchstens 720 Ticks |
| Amortisation Schiffe | höchstens 1.440 Ticks |
| Idle-Dauer vor Verkaufsprüfung eines Schiffes | 240 Ticks |
| Nachweisdauer Transportkapazitätsengpass | 72 Ticks bei mindestens 80 % Auslastung |
| abgelehnte rentable Menge für Kapazitätsengpass | mindestens 60,00 t |
| Wohnhausbau: Auslastungsschwelle der eigenen Produktion | unter 80 % |
| Wohnhausbau: Dauer vollständiger Wohnraumauslastung | 72 Ticks |

## Entscheidungsrhythmus und Budgets

| Wert | Grenze |
|---|---:|
| operativer Zyklus | jeder Tick |
| taktischer Zyklus | alle 6 Ticks |
| strategischer Zyklus | alle 24 Ticks |
| neue strategische Investitionsentscheidungen je Zyklus | 1 |
| neue Logistikpläne je taktischem Zyklus | 3 |
| Orderaktionen je Zyklus | 10 |
| Primärkandidaten je strategischem Zyklus | höchstens 198 |
| Tiefe der Produktionskettenprüfung | 3 Stufen |
| Wartezeit auf Teilfüllung einer Handels-Buy-Order | höchstens 24 Ticks |
| Wartezeit auf Teilbeschaffung von Baumaterial | höchstens 72 Ticks |
| Ersetzungen je Order und taktischem Zyklus | höchstens 1 |
| Prioritätsänderungen je Gebäude und 6 Ticks | höchstens 1 |

## Insolvenz

| Wert | Bedingung |
|---|---|
| Wechsel nach `conserving` | verfügbare Liquidität unter 25.000,00 Gold oder Löhne der nächsten 24 Ticks ungedeckt |
| Wechsel nach `insolvent` | 72 aufeinanderfolgende Ticks vollständiger Handlungsunfähigkeit |
| Rettungsgeld, Kredit, Reset | nicht vorhanden |

## Virtuelle Reisen

| Strecke | Distanz |
|---|---:|
| Lambrecht ↔ Neustadt | 48 km |
| Neustadt ↔ Mannheim | 96 km |
| Lambrecht ↔ Mannheim | 120 km |

`travelTicks = ceil(Distanz / Geschwindigkeit des langsamsten Schiffes)`

| Schiffstyp | km/Tick | 48 km | 96 km | 120 km |
|---|---:|---:|---:|---:|
| Pinasse | 12 | 4 | 8 | 10 |
| Schnigge | 10 | 5 | 10 | 12 |
| Flöte | 8 | 6 | 12 | 15 |
| Kraweel | 7 | 7 | 14 | 18 |

Alpha 6 kennt keine Reisegebühr.

## Kalkulatorische Transportkosten

`transportCostMoneyUnits = floor(routeDistanceKm × transportedQuantityUnits / 100)`

Das entspricht 1 `moneyUnit` je Kilometer und transportierter Tonne. Referenz: 96 km mit 20,00 t ergeben 1.920 `moneyUnits` beziehungsweise 19,20 Gold.

Der Betrag bewegt kein Gold und erzeugt keine Ledgerbuchung. Er erhöht ausschließlich die Kostenbasis der transportierten Ware.

## Bewertungsstrafen der Routenwahl

| Term | Formel |
|---|---|
| Kapitalbindungsstrafe | `floor(boundCapitalMoneyUnits × travelTicks / 240)` |
| Dauerstrafe | `travelTicks × 100 moneyUnits` |

## Unveränderte Werte aus früheren Alphas

Alpha 6 verändert keinen einzigen bestehenden Balancingwert. Unverändert bleiben insbesondere:

- alle Warenbasispreise und Zielbestände;
- Käufer- und Verkäufergebühr von je 5 Promille;
- Grundstückspreis 5.000 Gold und alle Gebäudeklassenkosten;
- Kontorkosten und -materialien;
- Wohnhauskosten, -materialien und Kapazität von 100 Einwohnern;
- alle vier Schiffstypen mit Kapazität, Geschwindigkeit, Bauzeit, Kaufpreis, Ankaufspreis, Werftgebühr und Materialien;
- Konzessionsgebühr 10.000 Gold und Rufschwelle 80;
- alle Produktionsrezepte, Beschäftigungsklassen und Löhne;
- Bevölkerungsverbrauchsraten und die Wohlstandsformel;
- die konstante Geldmenge von 170.717.000 moneyUnits.
