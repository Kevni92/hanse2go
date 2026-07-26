# Alpha 6: virtuelle Flottenreisen

## Zweck und Abgrenzung

Alpha 6 führt eine minimale, vollständig serverautoritative virtuelle Reisemechanik zwischen den drei Teststädten ein. Sie ist die Grundlage dafür, dass Waren real zwischen Städten bewegt werden müssen, statt am Ziel zu entstehen.

Spieler und KI-Handelshäuser verwenden denselben Fachbefehl, dieselben Voraussetzungen, dieselbe Fahrzeitformel und dieselben Sperren. Es gibt keine KI-Sonderreise und keine Spielerabkürzung.

Die spätere Karibikkarte ersetzt ausschließlich den Streckengraph aus [`test-world-routes.md`](test-world-routes.md). Reiseentität, Flottenstatus, Befehl, Tickphase und Sperrregeln bleiben dabei unverändert.

## Flottenstatus

Der Alpha-4-Flottenstatus wird erweitert:

| Status | Bedeutung |
|---|---|
| `in_port` | Flotte liegt in genau einem Hafen und kann lokal handeln |
| `traveling` | Flotte ist auf einer virtuellen Reise und besitzt keinen Hafen |
| `active` | ausschließlich die bestehende Übergangs-Debugflotte des Spielers |

`active` bleibt allein als Übergangsstatus der bisherigen Spieler-Debugflotte erhalten. Beim Start einer virtuellen Reise wird auch eine `active`-Flotte zu `traveling`; nach der Ankunft erhält sie `in_port` der Zielstadt und kehrt nicht automatisch nach `active` zurück. Für KI-Flotten ist `active` durchgehend ausgeschlossen.

Eine Flotte besitzt niemals gleichzeitig `portCityId` und eine offene Reise. Genau eines von beidem ist gesetzt.

## Reiseentität

| Feld | Bedeutung |
|---|---|
| `voyageId` | weltweit eindeutige, unveränderliche ID |
| `fleetId` | reisende Flotte |
| `ownerType` | `player` oder `ai` |
| `ownerId` | Eigentümer der Flotte bei Abfahrt |
| `originCityId` | Abfahrtsstadt |
| `destinationCityId` | Zielstadt |
| `departureTick` | Tick der Abfahrt |
| `arrivalTick` | `departureTick + totalTravelTicks` |
| `totalTravelTicks` | berechnete Gesamtfahrzeit |
| `remainingTravelTicks` | verbleibende Fahrzeit |
| `routeDistanceKm` | Distanz der direkten Strecke |
| `fleetSpeedAtDeparture` | eingefrorene Flottengeschwindigkeit |
| `status` | `traveling`, `arrived` oder `cancelled_before_departure` |
| `voyageVersion` | monotone Version |
| `idempotencyKey` | Idempotenzreferenz des auslösenden Befehls |

`originCityId`, `destinationCityId`, `departureTick`, `arrivalTick`, `totalTravelTicks`, `routeDistanceKm` und `fleetSpeedAtDeparture` sind nach der Abfahrt unveränderlich.

Der Status `cancelled_before_departure` beschreibt ausschließlich einen Abfahrtsbefehl, der innerhalb derselben Transaktion vor der Buchung scheitert. Nach erfolgreicher Abfahrt gibt es keinen Abbruch und keine Umleitung.

## Fahrzeit

`fleetVirtualSpeedKmPerTick` ist die Geschwindigkeit des langsamsten zugeordneten Schiffes nach [`../alpha-4/ship-catalog.md`](../alpha-4/ship-catalog.md).

`travelTicks = ceil(routeDistanceKm / fleetVirtualSpeedKmPerTick)`

Die Berechnung erfolgt in Ganzzahlarithmetik:

`travelTicks = floor((routeDistanceKm + fleetVirtualSpeedKmPerTick - 1) / fleetVirtualSpeedKmPerTick)`

`travelTicks` ist immer mindestens 1. Die vollständige Referenzmatrix aller vier Schiffstypen steht in [`test-world-routes.md`](test-world-routes.md).

## Reisevoraussetzungen

Eine Reise darf nur starten, wenn **alle** Bedingungen erfüllt sind:

1. die Flotte gehört dem befehlenden Akteur;
2. die Flotte liegt `in_port` in der Startstadt, oder die bisherige aktive Spielerflotte erreicht deren Stadtradius;
3. die Zielstadt existiert und unterscheidet sich von der Startstadt;
4. zwischen Start- und Zielstadt existiert eine direkte Strecke;
5. die Flotte besitzt mindestens ein Schiff;
6. `usedUnits <= capacityUnits`, die Flotte ist also nicht überladen;
7. für diese Flotte ist keine andere Aktion offen, die denselben Zustand verändert, und sie ist keiner anderen offenen Reise zugeordnet;
8. alle erwarteten Versionen (`fleetVersion`, betroffene Inventarversionen) und der Idempotenzschlüssel sind gültig.

Ein Handelshaus im Status `insolvent` darf keine neue Reise starten; bereits abgefahrene Reisen laufen regulär weiter.

Eine KI-Reise entsteht ausschließlich als Schritt eines Logistikplans nach [`ai-logistics.md`](ai-logistics.md). Die Flotte ist zu diesem Zeitpunkt genau einem aktiven Plan zugeordnet und bereits beladen; Ziel und Menge stehen fest. Die Reise selbst kennt den Plan nicht und behandelt eine KI-Flotte exakt wie eine Spielerflotte.

## Abfahrt

Die Abfahrt ist eine einzige atomare Transaktion:

- die Flotte verlässt den Hafen; `portCityId` beziehungsweise die Debugposition wird entfernt;
- die Reiseentität wird mit `status = traveling` und `remainingTravelTicks = totalTravelTicks` angelegt;
- der Flottenstatus wird `traveling`;
- Schiffszusammensetzung, Ladung und Eigentum werden eingefroren;
- `arrivalTick = departureTick + travelTicks` wird gesetzt;
- lokale Hafen-, Kontor-, Markt- und Werftaktionen dieser Flotte sind ab sofort unzulässig.

Die Abfahrt bewegt kein Gold und keine Ware. In Alpha 6 gibt es keine Reisegebühr, keinen Proviant und keinen Treibstoff.

## Fortschritt

In jedem Stundentick gilt für jede reisende Flotte:

- `remainingTravelTicks` sinkt exakt um 1;
- Kapazität, Geschwindigkeit, Strecke und Ankunftstick werden nicht neu berechnet;
- die Flottenladung bleibt unverändert;
- offene Orders des Eigentümers in Abfahrts- oder Zielstadt bleiben bestehen, sofern sie aus einem Kontor gedeckt sind – eine Reise berührt Kontorbestände nicht;
- die Reise erzeugt und verbraucht weder Ware noch Gold.

Eine im selben Tick neu gestartete Reise macht ihren ersten Fortschritt erst im folgenden Tick.

## Ankunft

Erreicht `remainingTravelTicks` den Wert 0:

- die Reise erhält `status = arrived`;
- die Flotte erhält `in_port` mit `portCityId = destinationCityId`;
- alle Schiffe, die Ladung und das Eigentum bleiben unverändert;
- lokale Aktionen sind ab demselben Tick zulässig, sobald die Reisephase abgeschlossen ist;
- die Ankunft wird im Tickbericht und im öffentlichen Ereignisverlauf protokolliert.

Eine angekommene Reise ist abgeschlossen und unveränderlich.

## Sperren während der Reise

Während `traveling` sind ausgeschlossen:

- Schiffe hinzufügen oder entfernen;
- die aktive Flotte auf diese Flotte wechseln oder von ihr weg wechseln;
- Ladung transferieren, laden oder entladen;
- jede Markt-, Kontor-, Bau- oder Werftaktion mit dieser Flotte;
- Umleitung, Zielwechsel oder Reiseabbruch;
- Verkauf oder Eigentumsübertragung eines zugeordneten Schiffes;
- Auflösung der Flotte.

Weiterhin zulässig bleibt das Umbenennen von Schiffen und der Flotte, sofern die bestehende Eigentumsregel es erlaubt. Umbenennen verändert weder Position, Ladung, Zuordnung noch Reise.

Ein Verstoß wird mit `FLEET_LOCKED_FOR_VOYAGE` abgelehnt und verändert keinen Zustand.

## Spielerübergang

Bis zur vollständigen Karibikkarte gilt:

- der Spieler startet eine virtuelle Reise über die Hafenansicht;
- eine reisende Flotte ist nicht per Debugposition steuerbar, und die Debugposition verändert ihre Reise nicht;
- besitzt der Spieler weitere lokale Flotten, darf er später eine andere lokale Flotte aktivieren;
- die Debugposition bleibt ausschließlich Übergangs- und Testmechanik für nicht reisende Flotten.

Die bestehende Regel, dass ein Spieler genau eine aktive Flotte besitzt, wird dadurch nicht verletzt: Eine reisende Flotte ist keine aktive Flotte. Solange die einzige Flotte des Spielers reist, besitzt er vorübergehend keine aktive Flotte und kann keine positionsgebundenen Aktionen ausführen. Die Oberfläche weist verständlich darauf hin; die Reisebedienung steht in [`user-interface.md`](user-interface.md).

## Parallelität und Idempotenz

- Derselbe Abfahrtsbefehl mit identischem Idempotenzschlüssel und identischer Nutzlast erzeugt höchstens eine Reise und liefert bei Wiederholung dasselbe Ergebnis.
- Ein paralleler Abfahrtsbefehl und eine parallele Flottenänderung können nicht beide erfolgreich sein; die zweite Aktion scheitert an der Version.
- Zwei Abfahrtsbefehle für dieselbe Flotte ergeben höchstens eine Reise; der zweite wird mit `FLEET_ALREADY_TRAVELING` abgelehnt.
- Eine Tickwiederholung erzeugt keine doppelte Ankunft und keinen doppelten Fortschritt.
- Ein Fehler in der Reisephase rollt den vollständigen Welt-Tick einschließlich aller übrigen Phasen zurück.

## Invarianten

Nach jeder Abfahrt, jedem Tick und jeder Ankunft gilt:

- jede Flotte ist entweder genau in einem Hafen oder genau auf einer Reise, nie beides und nie keines von beidem;
- jede Flotte gehört höchstens einer offenen Reise an;
- `0 <= remainingTravelTicks <= totalTravelTicks`;
- `arrivalTick = departureTick + totalTravelTicks`;
- die Gesamtmenge jeder Ware und die Gesamtgeldmenge sind durch Reisen unverändert;
- Schiffszahl, Schiffseigentum und Flottenzuordnung sind durch Reisen unverändert.

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `ROUTE_NOT_FOUND` | keine direkte Strecke zwischen Start und Ziel oder identische Städte |
| `FLEET_ALREADY_TRAVELING` | Flotte ist bereits auf Reise |
| `FLEET_NOT_IN_ORIGIN_PORT` | Flotte liegt nicht im angegebenen Starthafen |
| `FLEET_OVERLOADED` | Ladung überschreitet die Kapazität |
| `FLEET_LOCKED_FOR_VOYAGE` | verbotene Aktion an einer reisenden Flotte |
| `VOYAGE_NOT_FOUND` | referenzierte Reise existiert nicht |
| `VOYAGE_STATE_CONFLICT` | Reisezustand oder Version passt nicht zur Anfrage |

Die bestehenden Alpha-4-Fehlercodes `FLEET_NOT_FOUND`, `FLEET_NOT_OWNED` und `FLEET_MUST_KEEP_ONE_SHIP` bleiben unverändert gültig.

## Ausdrücklich ausgeschlossen

Sichtbare Karibikkarte, freie Navigation und Wegfindung, Zwischenknoten, alternative Routen, Mehrzielreisen, Zwischenstopps, Reiseabbruch, Umleitung, Wind, Wetter, Treibstoff, Proviant, Gefahren, Kampf während der Reise, Reisegebühren und Echtzeitbewegung statt Stundenticks.
