# Alpha 6: Nachvollziehbarkeit der KI

## Grundsatz

Jede KI-Entscheidung ist erklärbar. Für jede geprüfte Option wird festgehalten, welche öffentlichen Eingangswerte sie ausgelöst haben, wie sie bewertet wurde, welche Alternativen verglichen wurden und warum sie ausgeführt oder abgelehnt wurde.

Erklärungen entstehen ausschließlich deterministisch aus Regel-, Status- und Fehlercodes. Generative oder freie Texterzeugung ist ausgeschlossen; identische Eingaben erzeugen identische Erklärungen.

## Entscheidungsprotokoll

Jede geprüfte Option erzeugt einen unveränderlichen Eintrag mit mindestens:

| Feld | Bedeutung |
|---|---|
| `decisionId` | deterministische ID |
| `tick` | Tick der Bewertung |
| `actorId` | bewertendes Handelshaus |
| `cycle` | `operational`, `tactical` oder `strategic` |
| `candidateType` | Art der geprüften Maßnahme |
| `cityId`, `goodId` | betroffener Markt, soweit zutreffend |
| `inputMetrics` | die verwendeten öffentlichen Fensterwerte |
| `supportScore` | Unterstützungswert der Zielstadt/Ware und seine fünf Bestandteile |
| `shortageStatus` | Versorgungsstatus zum Bewertungszeitpunkt |
| `score`, `tieBreakers` | Bewertung und angewandte Gleichstandsregeln |
| `outcome` | `planned`, `executed`, `rejected`, `failed` oder `superseded` |
| `reasonCode` | stabiler Regel- oder Fehlercode der Entscheidung |

Weitere Pflichtfelder für Orders, Logistik, Investitionen und Schiffe ergänzen die jeweiligen Alpha-6-Fachdokumente. Ein Protokolleintrag wird nie nachträglich verändert; eine überholte Entscheidung erhält `superseded` und einen Verweis auf ihren Nachfolger.

### Zusatzfelder für Orderentscheidungen

Jede erstellte, ersetzte oder verworfene Order speichert zusätzlich Kostenbasis, erwarteten Verkaufspreis samt Quelle, erwartete Käufer- und Verkäufergebühr, zugerechnete kalkulatorische Transportkosten, angewandte Zielmarge, berechnete Preisgrenze, gewählten Limitpreis, gewählte Menge, die konkret bindende Mengengrenze sowie `expectedProfitMoneyUnits` und `expectedProfitScore`. Die vollständige Feldliste steht in [`ai-order-strategy.md`](ai-order-strategy.md).

## Ablehnungsgründe

Eine Ablehnung ist eine reguläre fachliche Nichtausführung und niemals ein technischer Fehler. Jede Ablehnung trägt genau einen stabilen `reasonCode`. Verbindlich sind mindestens:

| `reasonCode` | Bedeutung |
|---|---|
| `no_support_need` | `supportScore` ist 0 |
| `player_supplied_withdrawal` | Markt ist ausreichend spielerversorgt |
| `market_share_target_reached` | Marktanteilsziel würde ohne kritischen Mangel überschritten |
| `no_financeable_demand` | keine finanzierbare Nachfrage vorhanden |
| `no_covered_supply` | kein gedecktes Angebot innerhalb der Preisgrenze |
| `margin_below_target` | erwarteter Erlös deckt Kosten, Gebühren und Zielmarge nicht |
| `liquidity_reserve` | Liquiditätsreserve oder Lohndeckung würde unterschritten |
| `investment_rate_limited` | Investitionsgrenze je 24 beziehungsweise 72 Ticks greift |
| `payback_too_long` | Amortisationsdauer überschreitet die Obergrenze |
| `no_fleet_available` | keine verfügbare Flotte mit ausreichender Kapazität |
| `decision_budget_exhausted` | Entscheidungsbudget des Zyklus ausgeschöpft |
| `actor_conserving` | Status `conserving` verbietet die Maßnahme |
| `actor_insolvent` | Status `insolvent` verbietet die Maßnahme |
| `version_conflict` | Fachbefehl wurde wegen Versionskonflikt abgelehnt |

## Erklärtexte

Jeder `reasonCode` und jeder Versorgungsstatus besitzt genau eine deutsche Erklärung. Die Texte stehen in den Sprachdateien unter `packages/config/locales/` und werden ausschließlich vom Client aufgelöst; der Server liefert Codes und Zahlenwerte, keine Anzeigetexte.

Verbindliche Beispiele:

- `Diese Ware ist seit 12 Stunden akut knapp.`
- `Keine weitere KI-Order: Spieler decken bereits mehr als 70 % des Handelsvolumens.`
- `Keine Investition: 25.000,00 Gold Liquiditätsreserve würden unterschritten.`
- `Keine Aktion: erwarteter Verkaufspreis deckt Kosten und Gebühren nicht.`

## Öffentliche und interne Sichtbarkeit

| Datenklasse | öffentlich | nur Debug-/Testbetrieb |
|---|---|---|
| Versorgungsstatus, Dauer, Deckung | ja | – |
| menschlicher und KI-Handelsanteil, Marktanteilsziel | ja | – |
| Statuswechsel eines Handelshauses | ja | – |
| öffentliche Wirtschaftsaktivitäten der KI | ja | – |
| exakter KI-Kontostand | – | ja |
| vollständige Kandidatenlisten, Scores und Tie-Breaker | – | ja |
| einzelne Ablehnungsgründe je Option | – | ja |

Private Bestände, Konten und Pläne fremder Spieler werden weder öffentlich noch im Debugbetrieb offengelegt. Die vollständige Oberflächendefinition folgt im Alpha-6-Oberflächenkonzept.

## Determinismus des Protokolls

`decisionId` folgt dem Format `decision-<tick>-<actorId>-<sequence>` mit einem je Tick und Akteur bei 1 beginnenden, in Verarbeitungsreihenfolge monoton steigenden Zähler. Zwei Läufe derselben Ausgangswelt über dieselbe Tickzahl erzeugen damit identische Protokolle mit identischen IDs, identischer Reihenfolge und identischen Gründen.

Das Protokoll ist deshalb selbst ein Abnahmekriterium: Weicht es zwischen zwei Läufen ab, liegt eine Determinismusverletzung `AI_DETERMINISM_VIOLATION` vor. Die vollständigen Determinismusregeln stehen in [`decision-engine.md`](decision-engine.md).

## Invarianten

- Jede ausgeführte KI-Aktion besitzt genau einen Protokolleintrag mit `outcome = executed` und den daraus erzeugten Fachbefehlen.
- Jede Ablehnung besitzt genau einen `reasonCode`.
- Ein zurückgerollter Tick speichert kein Protokoll.
- Eine Tickwiederholung erzeugt keine doppelten Protokolleinträge.
- Das Protokoll enthält keine Größe, die nicht auch für einen menschlichen Beobachter öffentlich verfügbar wäre, mit Ausnahme der ausdrücklich als Debug gekennzeichneten Felder.
