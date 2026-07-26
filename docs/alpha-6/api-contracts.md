# Alpha 6: Reise- und Routenverträge

Dieses Dokument ist der verbindliche technische Vertrag für virtuelle Flottenreisen. Es folgt vollständig den Grundsätzen aus [`../alpha-5/api-contracts.md`](../alpha-5/api-contracts.md): Der Server ist die einzige Autorität, der Client sendet Absichten und zeigt ausschließlich den zuletzt serverbestätigten Zustand.

## Schreibmodell

Jeder schreibende Reisebefehl verlangt den Header `Idempotency-Key` mit einer nichtleeren, aufrufstabilen ID; alternativ das Feld `idempotencyKey` in der Nutzlast. Der Server normalisiert beide Formen und lehnt widersprüchliche oder fehlende Werte ab.

- Derselbe Schlüssel mit identischer Nutzlast liefert das ursprüngliche Ergebnis erneut, ohne eine zweite Reise anzulegen.
- Derselbe Schlüssel mit anderer Nutzlast liefert `ORDER_IDEMPOTENCY_PAYLOAD_CONFLICT` und verändert keinen Zustand.
- Eine fehlgeschlagene Abfahrt speichert keinen Teilzustand und keine Reiseentität.

KI-Handelshäuser verwenden exakt dieselben internen Fachbefehle. Sie erhalten deterministische Idempotenzschlüssel aus Tick, Akteur, Plan und Schritt und keine eigene Route.

## Lesen

| Methode und Route | Antwort | Zweck |
|---|---|---|
| `GET /api/routes` | `RouteGraphResponse` | statischer Städtegraph mit `fromCityId`, `toCityId` und `distanceKm` |
| `GET /api/fleets/:fleetId/voyage` | `VoyageResponse` oder `null` | aktuelle Reise einer eigenen Flotte |
| `GET /api/voyages/:voyageId` | `VoyageResponse` | einzelne Reise |
| `GET /api/voyages` | `VoyageListResponse` | öffentlich sichtbare laufende Reisen |

`GET /api/routes` ist öffentlich und unabhängig von Stadtzugang oder Position.

`GET /api/voyages` liefert für fremde Flotten ausschließlich öffentlich vertretbare Felder: `voyageId`, `fleetId`, Flottenname, `ownerType`, bei `ownerType = ai` den Namen des Handelshauses, `originCityId`, `destinationCityId`, `departureTick`, `arrivalTick`, `totalTravelTicks`, `remainingTravelTicks` und `routeDistanceKm`. Fremde private Ladungsdetails, Kostenbasen und Pläne werden nicht offengelegt; fremde Spieleridentitäten bleiben anonymisiert.

## Reisebefehl

| Methode und Route | Anfrage | Ergebnis |
|---|---|---|
| `POST /api/fleets/:fleetId/voyages` | `StartVoyageRequest` | angelegte Reise, aktualisierte Flotte und serverbestätigter lokaler Zustand |

`StartVoyageRequest`:

```json
{
  "destinationCityId": "mannheim",
  "expectedFleetVersion": 7,
  "idempotencyKey": "ai-house-neustadt-voyage-0001"
}
```

Die Antwort enthält mindestens:

- die vollständige Reise mit `voyageId`, `status`, `totalTravelTicks`, `remainingTravelTicks`, `arrivalTick`, `routeDistanceKm`, `fleetSpeedAtDeparture` und `voyageVersion`;
- die Flotte mit `status = traveling`, ohne `portCityId`, mit unveränderter Ladung, Kapazität, Geschwindigkeit und `fleetVersion`;
- den verlassenen Hafen mit aktualisierter Flottenliste;
- die Ticknummer der Abfahrt.

Es gibt bewusst **keine** Route zum Abbrechen, Umleiten oder Beschleunigen einer Reise.

## Versionen und Konflikte

- `voyageVersion` startet bei 1 und steigt bei jedem Fortschritt und bei der Ankunft.
- `fleetVersion` steigt bei Abfahrt und Ankunft.
- Der Abfahrtsbefehl verlangt die vom Client gelesene `expectedFleetVersion`; eine veraltete Version liefert einen Konflikt statt einer stillen Überschreibung.
- Von zwei parallelen Abfahrtsbefehlen für dieselbe Flotte kann höchstens einer erfolgreich sein.
- Eine parallele Flottenänderung und eine Abfahrt können nicht beide erfolgreich sein.

## Atomarität

Eine Abfahrt ist eine einzige Fachtransaktion:

1. Eigentum, Flottenstatus, Starthafen, Zielstadt, Strecke, Schiffszahl, Ladung, Versionen und Idempotenz prüfen.
2. Fahrzeit aus Distanz und langsamster Schiffsgeschwindigkeit berechnen.
3. Reiseentität anlegen und Flotte aus dem Hafen lösen.
4. Flotten-, Hafen- und Reiseinvarianten prüfen.
5. den gesamten Snapshot gemeinsam bestätigen.

Schlägt ein Schritt fehl, bleiben Flotte, Hafen, Ladung, Versionen und Reiseliste vollständig unverändert.

## Tickvertrag

Der Reisefortschritt ist eine eigene Phase des atomaren Welt-Ticks. Sie verarbeitet alle offenen Reisen aufsteigend nach `voyageId`, reduziert je Reise `remainingTravelTicks` genau einmal und schließt bei null die Ankunft ab. Eine im selben Tick neu gestartete Reise macht ihren ersten Fortschritt erst im folgenden Tick.

Ein Fehler in der Reisephase rollt den vollständigen Welt-Tick zurück. Eine idempotente Tickwiederholung liefert exakt denselben gespeicherten Tickbericht und erzeugt keinen doppelten Fortschritt und keine doppelte Ankunft.

Der Tickbericht ergänzt je Reise `voyageId`, `fleetId`, `ownerType`, Start und Ziel, Restticks vor und nach dem Tick sowie den Ankunftsstatus. Die Zusammenfassung enthält fortgeschriebene, gestartete und angekommene Reisen.

## Fehlercodes

Verbindlich sind `ROUTE_NOT_FOUND`, `FLEET_ALREADY_TRAVELING`, `FLEET_NOT_IN_ORIGIN_PORT`, `FLEET_OVERLOADED`, `FLEET_LOCKED_FOR_VOYAGE`, `VOYAGE_NOT_FOUND` und `VOYAGE_STATE_CONFLICT` aus [`virtual-voyages.md`](virtual-voyages.md).

Die bestehenden Fehlercodes `FLEET_NOT_FOUND`, `FLEET_NOT_OWNED`, `CITY_NOT_REACHABLE`, `ORDER_IDEMPOTENCY_REQUIRED`, `ORDER_IDEMPOTENCY_PAYLOAD_CONFLICT` und die Alpha-4-Versionskonflikte bleiben unverändert gültig.

## Schutz der früheren Systeme

Alle Alpha-2-bis-Alpha-5-Befehle prüfen zusätzlich, dass die betroffene Flotte nicht `traveling` ist:

- Markt- und Orderbefehle, die eine Flotte als Quelle oder Ziel verwenden;
- Kontor- und Flottentransfers;
- Gebäude-, Kontor- und Wohnhausbau;
- Schiffskauf, Schiffsverkauf, Schiffsbauauftrag und Flottenzuweisung;
- Aktivwechsel und Flottenauflösung.

Ein Verstoß liefert `FLEET_LOCKED_FOR_VOYAGE` und verändert keinen Zustand. Kontorbestände sind von einer Reise nicht betroffen und bleiben uneingeschränkt handelbar.
