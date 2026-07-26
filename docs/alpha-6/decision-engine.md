# Alpha 6: Entscheidungsmaschine der Handelshäuser

Dieses Dokument beschreibt, **wie** ein Handelshaus innerhalb eines Zyklus zu genau einer Entscheidung kommt. Die Tickeinbettung steht in [`tick.md`](tick.md), die Protokollstruktur in [`ai-transparency.md`](ai-transparency.md).

## Aufbau

Die Entscheidungsmaschine ist eine reine Funktion:

`entscheidung = f(Weltsnapshot, actorId, cycleType, tickNumber)`

Sie besitzt keinen verborgenen Zustand, keine Zufallsquelle, keinen Zugriff auf die Systemzeit und keinen Zugriff auf private Daten anderer Akteure. Zwei Aufrufe mit identischen Argumenten liefern identische Ergebnisse einschließlich aller erzeugten IDs.

Sie mutiert nichts. Ihr Ergebnis ist eine geordnete Liste von Fachbefehlen, die anschließend durch die regulären Befehlspfade ausgeführt werden.

## Ablauf eines Zyklus

### 1. Verpflichtungen erfüllen

Zuerst werden ausschließlich bereits eingegangene Verpflichtungen abgearbeitet: laufende Logistikpläne, Inputversorgung bestehender Produktion und die Lohndeckung der nächsten 24 Ticks. Diese Schritte zählen nicht gegen das Entscheidungsbudget.

### 2. Liquidität und Status prüfen

Der Status `active` / `conserving` / `insolvent` wird nach [`insolvency.md`](insolvency.md) neu bestimmt. Ein Wechsel nach `conserving` oder `insolvent` löst unmittelbar die dort definierten Maßnahmen aus und beendet den Zyklus für alle Investitionskandidaten.

### 3. Kandidaten erzeugen

Für den jeweiligen Zyklustyp wird eine endliche Kandidatenmenge gebildet:

| Zyklus | Kandidaten |
|---|---|
| operativ | ausschließlich Schritte bestehender Pläne |
| taktisch | offene eigene Orders, Handelschancen je Stadt/Ware, verfügbare Flotten, eigene Gebäude |
| strategisch | Investitionskandidaten je Stadt/Ware, Schiffskandidaten, Rückzugsprüfungen |

Die Kandidatenmenge ist immer höchstens 3 Städte × 22 Waren × 3 Handelshäuser groß und damit fest beschränkt.

### 4. Vorfiltern

Vor jeder tieferen Analyse werden Kandidaten verworfen, die eine der folgenden Bedingungen erfüllen. Jede Verwerfung wird mit ihrem `reasonCode` protokolliert:

| Bedingung | `reasonCode` |
|---|---|
| `supportScore = 0` und keine regulär rentable Chance | `no_support_need` |
| Status `player_supplied` | `player_supplied_withdrawal` |
| `marketShareHeadroomUnits = 0` ohne `critical_shortage` | `market_share_target_reached` |
| Status `conserving` bei Investitionskandidat | `actor_conserving` |
| Status `insolvent` bei allen außer Sell-Kandidaten | `actor_insolvent` |

Das Vorfiltern ist billig und verhindert, dass teure Rentabilitätsrechnungen für aussichtslose Kandidaten laufen.

### 5. Bewerten

Die verbliebenen Kandidaten werden vollständig bewertet: Kostenbasis, erwarteter Erlös, Gebühren, kalkulatorische Transportkosten, Zielmarge, Mengengrenzen, Liquidität und gegebenenfalls Amortisation. Die Formeln stehen in [`cost-basis-and-profit.md`](cost-basis-and-profit.md), [`ai-logistics.md`](ai-logistics.md), [`ai-production-and-investment.md`](ai-production-and-investment.md) und [`ai-ships-and-fleets.md`](ai-ships-and-fleets.md).

### 6. Sortieren

Die Sortierung ist verbindlich und vollständig:

1. höherer `supportScore`;
2. der art-spezifische Score – `expectedProfitScore` bei Handel, `routeScore` bei Logistik, kürzere `paybackTicks` bei Investitionen, höherer `shipUtilityScore` bei Schiffen;
3. kürzere erwartete Bindungsdauer beziehungsweise geringere `investmentCost`;
4. stabile IDs lexikografisch aufsteigend: `targetCityId`, `goodId`, `sourceCityId`, `fleetId`, `buildingTypeId`, `shipTypeId`.

Jeder Vergleich endet spätestens bei Stufe 4 eindeutig. Ein Gleichstand nach Stufe 4 ist ausgeschlossen, weil die IDs eindeutig sind.

### 7. Budget anwenden

Kandidaten werden in Sortierreihenfolge angenommen, bis das Budget des Zyklus erschöpft ist. Alle weiteren erhalten `decision_budget_exhausted`.

### 8. Fachbefehle erzeugen

Für jeden angenommenen Kandidaten werden die Fachbefehle mit deterministischen Idempotenzschlüsseln erzeugt und in der Reihenfolge ihrer Entscheidung ausgeführt. Die Ausführung kann fehlschlagen; das ist eine reguläre Ablehnung und verändert die bereits erfolgreich ausgeführten Befehle nicht.

## Determinismusanforderungen

Verbindlich für die Implementierung:

- Keine Iteration über eine ungeordnete Map oder ein ungeordnetes Set ohne vorherige explizite Sortierung.
- Kein `Math.random`, kein `Date.now`, keine Prozess- oder Speicheradressen in einer Entscheidung.
- Keine Abhängigkeit von der Einfügereihenfolge einer Datenstruktur.
- Keine Gleitkommaarithmetik in einer autoritativen Größe; alle Scores und Beträge sind ganzzahlig.
- Jede Sortierung ist total, das heißt: Jeder Vergleich endet bei einer eindeutigen ID.
- Alle abgeleiteten IDs stammen aus Tick, Akteur, Plan und einem monotonen Zähler.

Ein Verstoß ist ein technischer Fehler `AI_DETERMINISM_VIOLATION`. Die Abnahme weist ihn nach, indem zwei Läufe derselben Ausgangswelt über dieselbe Tickzahl byteweise identische Endzustände, IDs und Protokolle erzeugen müssen.

## Abgrenzung zur Ausführung

Die Entscheidungsmaschine darf nicht prüfen, ob ein Befehl erfolgreich sein **wird**. Sie bewertet nach den dokumentierten Fachregeln und erzeugt den Befehl; die endgültige Prüfung von Deckung, Version, Kapazität und Eigentum erfolgt ausschließlich im regulären Befehlspfad.

Damit gibt es genau eine Stelle, an der eine Regel durchgesetzt wird, und die KI kann keine Regel umgehen, indem sie die Prüfung dupliziert oder abschwächt.

## Invarianten

- Eine Entscheidung beruht ausschließlich auf öffentlichen Daten und eigenem Besitz.
- Eine Entscheidung beruht niemals auf einem zukünftigen Tickzustand.
- Zwei Läufe derselben Ausgangswelt erzeugen identische Entscheidungen, IDs, Befehle und Protokolle.
- Jede geprüfte Option besitzt genau einen Protokolleintrag mit genau einem Ergebnis.
- Die Kandidatenmenge je Zyklus ist fest beschränkt und wächst nicht mit der Laufzeit.
- Die Entscheidungsmaschine verändert keinen Domänenzustand.
