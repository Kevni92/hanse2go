# Alpha 3 – Arbeiter-, Wohnraum- und Wohlstandsoberfläche

Alpha 3 erweitert die vorhandene Stadtansicht, den Gebäude-Tab und den Debug-Tick. Es gibt weder eine eigene Simulationsmaske noch eine Zufriedenheitsanzeige. Alle Werte und Aktionen sind serverbestätigt; der Client rechnet keine autoritativen Wirtschafts- oder Tickwerte selbst.

## Stadtübersicht

Der Kopfbereich einer geöffneten Stadt zeigt in dieser Reihenfolge Bevölkerung, Wohnraum, Arbeit und Wohlstand:

| Karte | Inhalt |
|---|---|
| Bevölkerung | Einwohner und Bevölkerungsänderung des letzten Ticks |
| Wohnraum | Gesamtwohnraum, frei, Auslastung und Wachstumszustand |
| Arbeit | verfügbare, beschäftigte und arbeitslose Arbeiter, Beschäftigungsquote sowie Anzahl Spieler mit Nachfrage |
| Wohlstand | Wert 0–100, Zielwert des letzten Ticks, Trend, Versorgung, Kaufkraft, Einkommen und Grundwarenkorbkosten pro Kopf |

Einwohner und Arbeiter verwenden ganze `de-DE`-Zahlen, Gold ganze `de-DE`-Zahlen, Tonnen höchstens zwei Nachkommastellen, Wohlstand und Prozente eine Nachkommastelle. Trend zeigt immer Icon, Text und Farbe: `steigend`, wenn Ziel minus aktuell mindestens `0,1` ist, `fallend`, wenn aktuell minus Ziel mindestens `0,1` ist, sonst `stabil`.

Die Wohnraumkarte zeigt etwa `Bevölkerung: 1.000`, `Wohnraum: 1.100`, `Frei: 100`, `Auslastung: 90,9 %`. Bei mindestens 10 % freiem Wohnraum lautet der Zustand `Wachstum nicht durch Wohnraum begrenzt`, zwischen 0 und 10 % `Wachstum durch knappen Wohnraum reduziert`, bei 0 `Kein Bevölkerungswachstum: Wohnraum vollständig belegt`.

Die Arbeitskarte zeigt fremde Nachfrage ausschließlich aggregiert. Weder fremde Prioritäten noch fremde Goldbestände werden sichtbar. Die Wohlstandskarte erklärt aufklappbar: `Wohlstand verbindet Warenversorgung und Kaufkraft. Es gibt keinen separaten Zufriedenheitswert.`

Die Versorgungsliste ist fest als Brot, Fleisch, Käse, Kleidung, Keramik, Möbel, Rum sortiert. Sie zeigt Icon, Sollverbrauch, Verbrauch, Fehlmenge, Deckungsgrad und Verbraucherpreis. Fehlende Grundwaren Brot, Fleisch, Käse und Kleidung werden mit Text, Icon und Farbe deutlicher markiert als Komfortwaren.

## Gebäude

Nach Konzession und Kontor ergänzt der Katalog die Kategorien `Produktion`, `Wohnen` und `Eigene Gebäude`. Ohne Konzession oder Kontor bleiben die Alpha-2-Zustände unverändert. Das Wohnhaus ist erst nach beiden Voraussetzungen baubar.

Die `town_house`-Karte zeigt `+100 Wohnraum`, Grundstückspreis 5.000 Gold, Baukosten 5.000 Gold, 30 Holz, 20 Bretter, 20 Ziegel und 10 Werkzeug, sämtliche vorhandenen/fehlenden Voraussetzungen und den Baubutton. Sie erklärt außerdem: keine Arbeiter, keine Lohnkosten, keine direkten Mieteinnahmen, Wohnraum für die gesamte Stadt. Wohnhäuser haben keine Prioritätssteuerung.

Jede eigene Produktionsinstanz zeigt Name, Waren, lokalisierte Beschäftigungsklasse (`simple` = Einfach, `medium` = Mittel, `premium` = Hochwertig), Bedarf, zuletzt zugewiesene Arbeiter, Auslastung, Lohn je Arbeiter, Lohnkosten des letzten Ticks, Priorität, Soll- und Ist-Input/Output sowie Status und alle Stillstandsgründe. Die technische Baukostenklasse wird getrennt von der Beschäftigungsklasse beschriftet.

Die Prioritätsbedienung ist nur für eigene Produktionsgebäude verfügbar und bietet Sehr hoch, Hoch, Normal, Niedrig und Sehr niedrig; neue Gebäude beginnen bei Normal. Sie sendet die Änderung sofort, sperrt nur diese Steuerung bis zur Antwort und zeigt den neuen Wert erst nach Bestätigung. Sie enthält den Hinweis `Wirkt ab dem nächsten Stundentick`; bei Fehler bleibt oder erscheint wieder der letzte bestätigte Wert. Verständliche Status kombinieren bei Bedarf `Vollständig besetzt`, `Teilweise besetzt`, `Keine Arbeiter zugeteilt`, `Arbeitskräfte in der Stadt knapp`, `Lohnbudget begrenzt die Beschäftigung` und `Eingangswaren fehlen; Löhne wurden trotzdem bezahlt`.

## Tick und Bericht

`Nächste Stunde simulieren` bleibt bestehen. Während der Anfrage ist er gesperrt und zeigt `Stadtwirtschaft wird berechnet …`; Gold, Arbeiter, Produktion, Wohlstand und Bevölkerung werden nicht optimistisch geändert. Nach Erfolg werden alle betroffenen Serverdaten aktualisiert.

Der Tickbericht verwendet aufklappbare Abschnitte: Zusammenfassung, Löhne und Arbeit, Produktion, Bevölkerungskonsum, Wohlstand sowie Wohnraum und Wachstum. Die Zusammenfassung enthält Ticknummer, simulierte Stunde, Gesamtlöhne, Beschäftigte/Arbeitslose, erfolgreiche/stillstehende Gebäude sowie Wohlstands- und Bevölkerungsänderung je Stadt.

## Responsive und zugänglich

Mobil erscheinen Stadtkennzahlen als horizontal scrollbare kompakte Leiste oder zweispaltiges Raster; Gebäudekarten bleiben einspaltig. Prioritäten haben mindestens 44 × 44 CSS-Pixel Bedienfläche, der Bericht verwendet Akkordeons und die Versorgungsliste erzeugt keine horizontale Seitenscrollleiste. Bau- und Tickaktionen benötigen keinen Hover.

Desktop verwendet vier Stadtkarten; eigene und baubare Gebäude dürfen nebeneinander liegen. Versorgung und Bericht dürfen responsive Tabellen verwenden. Es ist keine neue globale Navigation nötig.

Alle Interaktionen haben zugängliche Namen, Prioritäten sind per Tastatur bedienbar und Fortschritts-/Prozentwerte haben Textäquivalente. Eine `aria-live`-Region meldet Tick- und Aktionsstatus; Informationen beruhen nie allein auf Farbe und der Fokus bleibt nach Serveraktionen nachvollziehbar.

Stabile Test-IDs sind `city-population`, `city-housing-total`, `city-housing-free`, `city-employed-workers`, `city-unemployed-workers`, `city-wealth`, `city-wealth-target`, `city-purchasing-power`, `building-assigned-workers-<buildingId>`, `building-utilization-<buildingId>`, `building-wage-cost-<buildingId>`, `building-priority-<buildingId>`, `build-town-house`, `tick-report-workforce`, `tick-report-wealth` und `tick-report-growth`. Sie ergänzen zugängliche Selektoren.

Bei abgelehnter Prioritätsänderung, fehlendem Gebäude, veralteten Wohnhausvoraussetzungen, laufendem oder konflikthaftem Tick und nicht erreichbarem Server erscheint eine verständliche deutsche Fehlermeldung; der letzte bestätigte Zustand bleibt sichtbar.
