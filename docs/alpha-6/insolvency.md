# Alpha 6: Liquiditätszustände und Insolvenz der Handelshäuser

## Grundsatz

Ein Handelshaus kann Verluste erleiden und wirtschaftlich handlungsunfähig werden. Es gibt kein Rettungsgeld, keinen Kredit, keinen negativen Kontostand, keinen automatischen Reset und keine automatische Kassenauffüllung. Insolvenz ist ein regulärer Wirtschaftszustand, kein Fehler und keine Löschung.

Alle Statuswechsel sind deterministisch, werden ausschließlich in der strategischen 24-Tick-Planungsphase geprüft und im Entscheidungsprotokoll sowie im Tickbericht mit auslösender Bedingung, Messwerten und Tick festgehalten.

## Zustände

| Status | Bedeutung |
|---|---|
| `active` | volle Handlungsfähigkeit einschließlich Investitionen |
| `conserving` | Liquidität sichern, keine neuen Investitionen |
| `insolvent` | keine neuen Verpflichtungen, Eigentum bleibt bestehen |

Zulässige Übergänge sind `active → conserving`, `conserving → active`, `conserving → insolvent` und `insolvent → conserving`. Ein direkter Übergang `active → insolvent` oder `insolvent → active` ist ausgeschlossen; jeder andere angeforderte Übergang wird mit `AI_STATUS_TRANSITION_INVALID` abgelehnt.

Jeder Wechsel setzt `statusSinceTick` und erhöht `actorVersion`.

## Wechsel nach `conserving`

Ein Handelshaus wechselt von `active` nach `conserving`, sobald mindestens eine Bedingung gilt:

- die verfügbare Liquidität liegt unter 25.000,00 Gold beziehungsweise 2.500.000 `moneyUnits`;
- die erwarteten Löhne der nächsten 24 Ticks sind aus verfügbarem Gold nicht vollständig gedeckt;
- die bestehenden Buy-Order-Reservierungen gefährden eine notwendige Zahlung, das heißt: nach Abzug aller bereits eingegangenen Bau- und Logistikverpflichtungen sowie der erwarteten Löhne der nächsten 24 Ticks bliebe ohne Freigabe von Reservierungen ein negativer verfügbarer Bestand.

Der Wechsel wirkt sofort und nicht erst nach einer Wartezeit.

## Maßnahmen im Status `conserving`

Die Maßnahmen werden in genau dieser Reihenfolge geprüft und ausgeführt:

1. keine neuen Gebäude-, Kontor-, Wohnhaus- und Schiffsinvestitionen; laufende Investitions- und Schiffspläne werden abgebrochen, soweit noch keine Kosten gebucht wurden;
2. offene Buy Orders stornieren beziehungsweise verkleinern, aufsteigend nach erwartetem Deckungsbeitrag, danach nach `orderId` lexikografisch, bis die Lohndeckung der nächsten 24 Ticks wieder erfüllt ist;
3. freie, nicht reservierte Waren mindestens kostendeckend über reguläre Sell Orders anbieten;
4. ungenutzte Schiffe für einen möglichen regulären Verkauf prüfen; die Bedingungen aus dem Alpha-6-Schiffskonzept einschließlich des Schutzes des letzten Schiffes gelten unverändert;
5. bestehende Produktion nur fortführen, wenn Inputs und Löhne des nächsten Ticks gesichert sind; andernfalls sinkt die Gebäudepriorität nach den regulären Prioritätsregeln.

Handel, Logistik und Erfüllung bereits eingegangener Verpflichtungen bleiben zulässig. Bereits abgefahrene Reisen werden regulär zu Ende geführt.

## Rückkehr nach `active`

Ein Handelshaus wechselt von `conserving` zurück nach `active`, sobald in einer strategischen Prüfung gleichzeitig gilt:

- die verfügbare Liquidität beträgt mindestens 25.000,00 Gold;
- die erwarteten Löhne der nächsten 24 Ticks sind vollständig gedeckt;
- keine Buy-Order-Reservierung gefährdet eine notwendige Zahlung.

Eine Mindestverweildauer in `conserving` gibt es nicht; maßgeblich ist ausschließlich die gemessene Lage.

## Wechsel nach `insolvent`

Ein Handelshaus im Status `conserving` wechselt nach `insolvent`, wenn für 72 aufeinanderfolgende Ticks **alle** drei Bedingungen gleichzeitig erfüllt sind:

- die Löhne der eigenen Gebäude können nicht vollständig finanziert werden;
- für die vorhandenen freien Waren existiert keine kostendeckende Verkaufsoption, das heißt kein erreichbares Angebot innerhalb der Preisgrenzen deckt die variablen Kosten;
- es sind keine freigebbaren Reservierungen und keine verkaufbaren ungenutzten Schiffe mehr vorhanden.

Der Zähler beginnt beim ersten Tick, in dem alle drei Bedingungen gelten, und wird bei jedem Tick zurückgesetzt, in dem mindestens eine Bedingung nicht gilt. Der Wechsel erfolgt frühestens im 72. aufeinanderfolgenden Tick.

## Wirkung des Status `insolvent`

- Alle offenen Buy Orders werden storniert; ausschließlich die Restreservierungen werden freigegeben. Bereits ausgeführte Teilmengen, Gebühren und Executions bleiben unverändert.
- Es entstehen keine neuen Buy Orders, keine neuen Reisen, keine neuen Logistik- oder Investitionspläne, keine Gebäude-, Kontor- oder Wohnhausbauten und keine Schiffskäufe oder Bauaufträge.
- Bestehende Sell Orders über real vorhandene, gedeckte Ware dürfen bestehen bleiben und regulär ausgeführt werden. Neue Sell Orders über bereits vorhandene freie Ware bleiben zulässig, damit das Handelshaus Bestände abbauen kann.
- Bereits abgefahrene Reisen werden regulär beendet; die Ware wird am Ziel entladen.
- Alle eigenen Gebäude erhalten die niedrigste Priorität 1 und konkurrieren damit nach den bestehenden Alpha-3-Regeln zuletzt um Arbeitskräfte.
- Der Akteur, sein Konto, sein Ruf, seine Konzessionen, Kontore, Gebäude, Schiffe und Flotten bleiben vollständig bestehen und behalten ihren Eigentümer.
- Es gibt kein Rettungsgeld, keinen Kredit, keinen Reset, keine Enteignung, keine Auflösung und keine Übernahme durch ein anderes Handelshaus.

## Rückkehr nach `conserving`

Ein insolventes Handelshaus wechselt zurück nach `conserving`, sobald mindestens eine der drei Insolvenzbedingungen nicht mehr gilt, also wieder Löhne finanziert, kostendeckend verkauft oder Mittel freigesetzt werden können. Von dort ist die reguläre Rückkehr nach `active` möglich.

Eine Genesung ist damit möglich, aber nicht garantiert. Ein dauerhaft insolventes Handelshaus bleibt als sichtbarer, besitzender, aber wirtschaftlich passiver Akteur in der Welt.

## Invarianten

- Ein Statuswechsel erzeugt und vernichtet weder Gold noch Ware, Schiffe, Gebäude oder Flotten.
- Die Gesamtgeldmenge bleibt bei jedem Statuswechsel exakt konstant.
- Kein Konto wird durch einen Statuswechsel negativ.
- Stornierungen im Insolvenzfall geben ausschließlich Restreservierungen frei.
- Derselbe Tick erzeugt keinen doppelten Statuswechsel; die Prüfung ist idempotent.

## Fehlercodes

`AI_STATUS_TRANSITION_INVALID` und `AI_LIQUIDITY_RESERVE_VIOLATION` aus [`ai-actors.md`](ai-actors.md) gelten unverändert. Eine wegen Liquidität oder Status abgelehnte Aktion ist eine reguläre fachliche Nichtausführung mit protokolliertem Grund und rollt den Tick nicht zurück.

## Ausdrücklich ausgeschlossen

Rettungszahlungen, Kredite, Bürgschaften, Stundungen, negative Konten, automatischer Insolvenzreset, Enteignung, Löschung eines Handelshauses, Übernahme oder Fusion von Handelshäusern sowie ein Verkauf des letzten Schiffes zur Insolvenzabwendung.
