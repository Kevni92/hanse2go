# Alpha 3 – Test- und Abnahmevertrag

Alpha 3 ist erst abgenommen, wenn die folgenden Tests mit realem Vue-Client und Fastify-Server sowie als deterministische Domänen- und API-Tests bestehen. Testpresets sind ausschließlich bei aktivem Testbetrieb erreichbar.

## Testebenen

- Konfigurations- und Datentests prüfen alle 21 Produktionsgebäude: genau eine Beschäftigungsklasse, getrennte Bauklasse, korrektes Rezept, Vollauslastung mit exakt 200 Gold Lohn und positive Referenzmarge. Kontor und `town_house` haben keine Beschäftigungsklasse.
- Domänentests prüfen Max-Min-Fairness, Prioritäten, Lohnbudget, Teilproduktion, Reste, Verbrauch, Wohlstand und Wachstum.
- API-Tests prüfen Bauen, Prioritätsänderung, Bericht, Idempotenz, Welt-Sperre und vollständigen Rollback nach künstlichem Fehler.
- Komponenten- und Playwright-Tests prüfen nur serverbestätigte Werte, verständliche Fehler und die Test-IDs aus [`user-interface.md`](user-interface.md).

## Verbindliche Fachfälle

`alpha3-fairness-equal` verteilt bei 1.000 Einwohnern und je 800 finanzierbaren einfachen Arbeitern 500 an Spieler A und 500 an B. `alpha3-fairness-redistribution` verteilt Nachfragen A 800, B 200, C 50 zu 750, 200, 50 ohne Arbeitslose. Reste rotieren deterministisch.

`alpha3-priority-and-wages` ergibt bei 150 finanzierbaren Arbeitern Bäckerei sehr hoch = 100, Windmühle hoch = 50, Getreidehof normal = 0 und Löhne 200 + 100 + 0 = 300 Gold. `alpha3-wage-limited` begrenzt ein hochwertiges Gebäude mit 50 Bedarf und 75 Gold auf `floor(75 / 4) = 18` Arbeiter, 72 Gold Lohn, 3 Gold Rest, 36 % Auslastung und `wage_budget_limited`.

`alpha3-partial-production` prüft eine mittelklassige Windmühle mit 60 Arbeitern und 6,00 Getreide: 120 Gold Lohn, 6,00 Input, 8,40 Mehl, 60,0 % und erfolgreich produziert. Mit 5,99 Getreide werden Löhne weiter gezahlt, aber weder Input noch Output gebucht; Status ist `stalled` mit `MISSING_INPUTS`.

Wohlstandstests ergeben für Versorgung/Kaufkraft `1/0`, `1/0,5`, `1/1`, `0,5/1`, `0/1` die Zielwerte 40, 70, 100, 50, 0. Fehlendes Brot wiegt 25 %, eine Komfortware 10 %. Wohlstand bleibt 0–100 und nähert sich pro 24 Ticks ungefähr 2 % der Differenz. Es gibt weder im Modell noch im API-Vertrag ein Zufriedenheitsfeld.

Verbrauchstests prüfen Brot und jede übrige Konsumware für Lambrecht 4,00/2,00, Neustadt 10,00/5,00 und Mannheim 20,00/10,00 Tonnen je Tick sowie bei 1.250 Einwohnern 5,00/2,50. Über 100 Ticks darf 1-%-Produktion keine Rezeptmenge verlieren; Verbrauchs- und Wachstumsreste werden fortgeführt, fehlender Input verändert Produktionsreste nicht und der Reset setzt alle Reste auf 0.

Die reine 720-Tick-Simulation verwendet konstante Zielwohlstände und erwartet die Werte in [`test-world.md`](test-world.md), ohne auf Echtzeit zu warten.

## Atomarität

Dieselbe Idempotenz-ID führt genau einen Tick aus und liefert denselben Bericht. Zwei parallele neue IDs führen höchstens einen Tick aus. Ein künstlicher Fehler nach Lohnplanung verändert weder Gold, Waren, Wohlstand noch Bevölkerung. Fehlende Inputs oder Marktware sind dagegen erfolgreiche Tickberichte mit fachlichem Status.

## End-to-End-Abnahme

Jeder Happy Path lädt `alpha3-building-ready`, öffnet Lambrecht und prüft 1.000 Einwohner, 1.100 Wohnraum und Wohlstand 40,0. Er baut ein Wohnhaus und bestätigt 1.200 Wohnraum sowie Gold-, Material- und Kapazitätsänderung. Danach baut er Getreidehof und Windmühle, setzt Windmühle auf Sehr hoch und Getreidehof auf Hoch, prüft `Wirkt ab dem nächsten Stundentick` und löst einen Tick aus.

Anschließend prüft der Test Arbeiterzuteilung, Auslastung, Lohnabzug, Produktion, Kontor, Verbrauch, Marktbestände, Kaufkraft, Zielwohlstand, Trend, Wohnraumfaktor, Wachstum und alle sechs Abschnitte des Tickberichts. Ein Reload zeigt ausschließlich identische serverbestätigte Werte.

Der Ablauf läuft in Desktop Chromium (mindestens 1280 × 720) und mobilem Chromium. Mobil darf es keine horizontale Seitenscrollleiste geben; Priorität ist per Touch bedienbar, Akkordeons sind erreichbar und der Wohnhausbau benötigt keinen Hover.

## Diagnose und CI

Bei Playwright-Fehlern speichert CI Trace, Screenshot, Browserkonsole, Serverlog, Testpreset und Seed sowie Tickbericht des letzten erfolgreichen und fehlgeschlagenen Versuchs. Alle Unit-, Daten-, API-, Komponenten-, Desktop- und Mobile-Tests müssen grün sein.
