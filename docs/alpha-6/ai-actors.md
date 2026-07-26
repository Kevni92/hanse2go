# Alpha 6: KI-Handelshäuser als reguläre Wirtschaftsakteure

## Grundsatz

Ein KI-Handelshaus ist ein regulärer Wirtschaftseigentümer neben Spieler, Stadt und Bevölkerung. Es besitzt eigene Konten, Konzessionen, Kontore, Gebäude, Schiffe, Flotten, Warenbestände und Orders und verwendet ausschließlich dieselben serverautoritativen Fachbefehle wie ein Spieler. Es erhält keine Sonderressourcen, keine Sonderpreise, keine bevorzugte Orderpriorität und keine privaten Spielerdaten.

Die KI ist regelbasiert, deterministisch und vollständig in den atomaren Welttick eingebettet. Sie besitzt keine Hintergrundausführung, keinen Zufall und keine Zeitabhängigkeit. Sie darf Domänenbestände niemals direkt verändern, sondern erzeugt dieselben internen Fachbefehle, die auch eine Spieleraktion erzeugt.

## Die drei Handelshäuser

| `actorId` | Name | `homeCityId` | Kurzname |
|---|---|---|---|
| `ai-house-lambrecht` | Westwind-Handelshaus | `lambrecht` | `Westwind` |
| `ai-house-neustadt` | Haardt-Kompanie | `neustadt` | `Haardt` |
| `ai-house-mannheim` | Rheinhandel-Kontor | `mannheim` | `Rheinhandel` |

Der Kurzname ist der deterministische Namenspräfix für später erworbene Schiffe. Anzeigenamen der Handelshäuser sind kein Bestandteil des Datenmodells; sie stehen wie alle übrigen Anzeigenamen in den Sprachdateien unter `packages/config/locales/`. Die technischen Bezeichner sind Englisch beziehungsweise stabile IDs.

Alpha 6 kennt genau diese drei Handelshäuser. Sie werden ausschließlich durch die Weltinitialisierung oder einen deterministischen Testreset angelegt.

## Akteursmodell

Ein Handelshaus besitzt mindestens:

| Feld | Bedeutung |
|---|---|
| `actorId` | weltweit eindeutige, unveränderliche ID |
| `homeCityId` | Heimatstadt der bilanzierten Initialisierung |
| `shortName` | deterministischer Präfix für Schiffsnamen |
| `status` | `active`, `conserving` oder `insolvent` |
| `accountId` | Referenz auf das eigene Goldkonto mit verfügbaren und reservierten Mitteln |
| `reputationByCity` | örtlicher Ruf 0–100 je Stadt nach den bestehenden Alpha-2-Regeln |
| `concessionCityIds` | Städte mit erworbener Baukonzession |
| `kontorByCity` | eigene Kontore und deren Lagerbestände je Stadt |
| `buildingIds` | eigene Produktions- und Wohngebäude |
| `shipIds` | eigene konkrete Schiffsentitäten |
| `fleetIds` | eigene Flotten |
| `openOrderIds` | eigene offene Buy- und Sell-Orders |
| `logisticsPlanIds` | offene Logistikpläne |
| `investmentPlanIds` | offene Investitions- und Schiffspläne |
| `decisionLogRef` | Referenz auf das Entscheidungsprotokoll |
| `statusSinceTick` | Tick des letzten Statuswechsels |
| `actorVersion` | monotone Version für optimistische Nebenläufigkeit |

`actorId`, `homeCityId` und `shortName` sind nach der Initialisierung unveränderlich. Jede sichtbare Änderung an Status, Konto, Besitz, Plänen oder Orders erhöht `actorVersion`.

Die drei Handelshäuser teilen weder Gold noch Waren, koordinieren keine Preise und kennen die internen Entscheidungen, Pläne und privaten Bestände der jeweils anderen nicht. Eine gemeinsame KI-Kasse existiert nicht.

## Eigentümertyp `ai`

Alpha 6 erweitert die bestehenden Eigentümertypen um `ai`:

- Orders und Executions kennen `ownerType` `player`, `population`, `city` und zusätzlich `ai`;
- Schiffsentitäten kennen `ownerType` `player`, `system` und zusätzlich `ai`;
- Gebäude, Kontore, Flotten und Konten kennen denselben zusätzlichen Eigentümertyp.

Für das Matching ist `ai` ein normaler externer Eigentümer: Preis-Zeit-Priorität, Gebühren und Teilfüllungen bleiben unverändert. Die bestehende Eigenhandelssperre aus [`../alpha-5/orders.md`](../alpha-5/orders.md) gilt je Kombination aus `ownerType` und `ownerId`; zwei verschiedene Handelshäuser sind daher verschiedene Eigentümer und dürfen regulär miteinander handeln, ein Handelshaus jedoch nie mit sich selbst.

Ruf entsteht für ein Handelshaus nach genau denselben Regeln wie für einen Spieler: ausschließlich aus tatsächlich ausgeführten eigenen Verkäufen an gedeckte Stadt- oder Bevölkerung-Buy-Orders gemäß [`../alpha-5/reputation.md`](../alpha-5/reputation.md).

## Eigentumsregeln

- Jedes Schiff, jede Flotte, jedes Gebäude, jedes Kontor und jeder Inventarbestand besitzt zu jedem Zeitpunkt genau einen Eigentümer.
- Eigentum wechselt ausschließlich über reguläre Kauf-, Verkaufs- oder Bauvorgänge mit vollständiger Deckung.
- Ein Handelshaus darf fremde private Bestände weder lesend auswerten noch verändern.
- Ein von einem Handelshaus verkauftes Schiff behält `shipId`, `customName`, `shipTypeId`, `originType`, `originCityId`, `createdAtTick` und `buildOrderId` und kann später mit derselben `shipId` von einem Spieler erworben werden.
- Kein Objekt eines Handelshauses wird bei Statuswechsel oder Insolvenz gelöscht, verschoben oder enteignet.
- Die Anzahl der Schiffe in der Welt ändert sich durch KI-Aktionen nur über einen abgeschlossenen Schiffsbauauftrag, nie durch Kauf, Verkauf oder Statuswechsel.

## KI-Flotten

Eine KI-Flotte folgt vollständig dem Alpha-4-Flottenmodell aus [`../alpha-4/fleet-management.md`](../alpha-4/fleet-management.md): mindestens ein konkretes Schiff, gemeinsame Ladung, Kapazität als Summe der Schiffskapazitäten und Geschwindigkeit des langsamsten Schiffs.

Abweichend vom Spieler besitzt ein Handelshaus keine aktive Flotte und keine Debug-Position. Der Status `active` ist für KI-Flotten ausgeschlossen; eine KI-Flotte ist immer `in_port` oder, sobald die virtuellen Reisen aus dem eigenen Alpha-6-Reisekonzept vorliegen, `traveling`. Die lokale Handlungsberechtigung eines Handelshauses in einer Stadt ergibt sich nicht aus einer Position, sondern aus einem dort vorhandenen eigenen Kontor beziehungsweise aus einer dort im Hafen liegenden eigenen Flotte. Damit gelten für die KI dieselben Lokalitätsanforderungen wie für den Spieler, ohne dass eine Übergangsmechanik der Testwelt für sie benötigt wird.

Das Anlegen einer neuen KI-Flotte verwendet denselben Fachbefehl wie beim Spieler; der geforderte lokale Nachweis ist das eigene Kontor beziehungsweise eine eigene Flotte im selben Hafen statt der aktiven Flotte.

## Liquiditätsreserve

Jedes Handelshaus im Status `active` hält vor jeder neuen Investition mindestens 25.000,00 Gold beziehungsweise 2.500.000 `moneyUnits` verfügbar.

Die für Investitionsentscheidungen maßgebliche Größe ist:

`investableMoneyUnits = availableMoney - reservedCommitments - expectedWagesNext24Ticks - liquidityReserveMoneyUnits`

Dabei gilt:

- `availableMoney` ist der nicht reservierte Kontostand;
- `reservedCommitments` sind bereits eingegangene, aber noch nicht gebuchte Bau- und Logistikverpflichtungen;
- `expectedWagesNext24Ticks` ist die Summe der erwarteten Löhne aller eigenen Gebäude über die nächsten 24 Ticks nach den Alpha-3-Regeln;
- `liquidityReserveMoneyUnits` ist konstant 2.500.000.

Reserviertes Ordergold ist bereits kein Bestandteil von `availableMoney` und wird nicht zusätzlich abgezogen. Eine Investition ist nur zulässig, wenn `investableMoneyUnits` nach vollständiger Kostenbuchung nichtnegativ bleibt. Andernfalls wird sie mit `AI_LIQUIDITY_RESERVE_VIOLATION` abgelehnt; die Ablehnung ist eine reguläre fachliche Nichtausführung und kein technischer Fehler.

## Status `active`

Ein Handelshaus ist `active`, solange die verfügbare Liquidität mindestens 25.000,00 Gold beträgt und die erwarteten Löhne der nächsten 24 Ticks vollständig gedeckt sind. Nur im Status `active` sind neue Gebäude-, Kontor-, Wohnhaus- und Schiffsinvestitionen zulässig. Regulärer Handel, Logistik und Produktion sind uneingeschränkt möglich.

Die Statuswechsel nach `conserving` und `insolvent` sowie die dort erlaubten Maßnahmen stehen vollständig in [`insolvency.md`](insolvency.md).

## Informationsgrenzen

Ein Handelshaus darf ausschließlich verwenden:

- öffentliche Orderbücher, sichtbare Preisstufen, beste Bid-/Ask-Preise und unveränderliche Executions;
- öffentliche Stadtversorgung, Wohlstand, Bevölkerung, Löhne, Arbeitslosigkeit und Marktanteile;
- öffentliche Stadt- und Bevölkerungskassen;
- die eigenen Konten, Inventare, Gebäude, Schiffe, Flotten, Orders und Pläne.

Ein Handelshaus darf niemals verwenden:

- private Gold- oder Warenbestände anderer Spieler oder anderer Handelshäuser;
- noch nicht veröffentlichte oder erst später im Tick entstehende Orders;
- zukünftige Tickresultate;
- interne Entscheidungen, Pläne oder Ablehnungsgründe anderer Handelshäuser.

Die Anonymisierung fremder Spieleridentitäten aus [`../alpha-5/api-contracts.md`](../alpha-5/api-contracts.md) gilt für die KI unverändert. Eine KI-Entscheidung, die auf einer nicht öffentlichen Größe beruht, ist ein Determinismus- und Fairnessfehler und wird mit `AI_ACTOR_PRIVILEGED_DATA_ACCESS` abgelehnt.

## Fehlercodes

| Fehlercode | Bedingung |
|---|---|
| `AI_ACTOR_NOT_FOUND` | referenziertes Handelshaus existiert nicht |
| `AI_OWNERSHIP_VIOLATION` | Befehl betrifft fremdes Eigentum oder erzeugt doppeltes Eigentum |
| `AI_START_STATE_IMBALANCE` | Initialisierung verletzt Gold-, Waren-, Schiffs- oder Eigentumsinvariante |
| `AI_START_MATERIALS_INSUFFICIENT` | Kontorbaumaterialien sind aus vorhandenen Stadtlagern nicht vollständig deckbar |
| `AI_LIQUIDITY_RESERVE_VIOLATION` | Investition würde Liquiditätsreserve oder Lohndeckung unterschreiten |
| `AI_STATUS_TRANSITION_INVALID` | angeforderter Statuswechsel ist nach den Bedingungen nicht zulässig |
| `AI_ACTOR_PRIVILEGED_DATA_ACCESS` | Entscheidung stützt sich auf nicht öffentliche Daten |

## Ausdrücklich ausgeschlossen

Gemeinsame KI-Kasse, Preisabsprachen zwischen Handelshäusern, kostenloses Startmaterial, kostenloses Gold, automatischer Insolvenzreset, Kredite, Rettungszahlungen, negativer Kontostand, Übernahme insolventer Handelshäuser, generative oder lernende Verfahren sowie jede Form von KI-Sonderressourcen.
