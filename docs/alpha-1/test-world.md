# Alpha 1 – Testwelt und Startwerte

## Zweck

Die Testwelt ist bewusst klein und vollständig deterministisch. Ihre Werte dienen der technischen und spielerischen Abnahme, nicht dem endgültigen Balancing der Live-Welt.

## Testspieler

- ID: `player-alpha`
- Name: `Testkapitän`
- Startgold: 30.000 Goldmünzen
- aktive Flotte: `fleet-alpha`
- Kapazität: 60 Tonnen
- Startladung: leer
- Startposition: außerhalb aller Stadtradien bei `8.0400, 49.4000`

## Städte

Die Namen orientieren sich an den besprochenen Beispielorten. Die Koordinaten sind für Alpha 1 fest konfiguriert; sie werden nicht aus OpenStreetMap importiert.

| ID | Name | Längengrad | Breitengrad | Radius | Bevölkerung | Wohlstand | Beliebtheit | Kontor | Schwerpunkt |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| `lambrecht` | Lambrecht | 8.0700 | 49.3700 | 800 m | 1.000 | 24 | 10 % | nein | Holz, Bretter, Kohle |
| `neustadt` | Neustadt | 8.1400 | 49.4000 | 800 m | 2.500 | 38 | 10 % | nein | Getreide, Lehm, Ziegel |
| `mannheim` | Mannheim | 8.2300 | 49.4400 | 800 m | 5.000 | 65 | 10 % | nein | Baumwolle, Zucker, Rum |

Die Inseln müssen auf der Alpha-Karte klar getrennt sein. Im Debug-Modus darf der Interaktionsradius visualisiert werden.

## Basispreise und Bestände

Alle Werte sind Tonnen beziehungsweise Goldmünzen pro Tonne. Der Zielbestand gilt in jeder Stadt. Die unterschiedlichen Startbestände erzeugen gezielt Handelschancen.

| Ware | Basispreis | Ziel | Lambrecht | Neustadt | Mannheim |
|---|---:|---:|---:|---:|---:|
| Getreide | 100 | 100 | 90 | 200 | 40 |
| Mehl | 140 | 80 | 70 | 110 | 45 |
| Brot | 190 | 80 | 65 | 95 | 30 |
| Vieh | 180 | 70 | 60 | 100 | 45 |
| Milch | 120 | 70 | 60 | 95 | 50 |
| Fleisch | 280 | 60 | 45 | 65 | 80 |
| Käse | 240 | 60 | 50 | 70 | 75 |
| Holz | 80 | 100 | 200 | 40 | 50 |
| Bretter | 130 | 80 | 130 | 45 | 65 |
| Lehm | 70 | 100 | 45 | 180 | 65 |
| Ziegel | 120 | 80 | 30 | 130 | 55 |
| Kohle | 110 | 80 | 130 | 55 | 70 |
| Eisen | 180 | 60 | 45 | 70 | 55 |
| Werkzeug | 320 | 50 | 40 | 55 | 60 |
| Baumwolle | 120 | 100 | 55 | 65 | 180 |
| Stoff | 210 | 70 | 45 | 55 | 110 |
| Kleidung | 360 | 60 | 25 | 45 | 85 |
| Keramik | 180 | 60 | 45 | 90 | 55 |
| Möbel | 300 | 50 | 35 | 20 | 70 |
| Zuckerrohr | 90 | 100 | 45 | 65 | 180 |
| Zucker | 160 | 70 | 35 | 50 | 120 |
| Rum | 300 | 50 | 10 | 15 | 100 |

## Verbindlicher Haupt-Handelsweg

### Schritt 1: Holz in Lambrecht kaufen

- Lambrecht besitzt 200 Tonnen Holz bei einem Zielbestand von 100.
- Der Ausgangspreisfaktor liegt damit bei 0,5.
- Holz ist dort deutlich unter dem Basispreis erhältlich.
- Der Abnahmetest kauft zehn Tonnen Holz.

### Schritt 2: Holz in Neustadt verkaufen

- Neustadt besitzt nur 40 Tonnen Holz bei einem Zielbestand von 100.
- Der Ausgangspreisfaktor liegt bei 2,5.
- Holz wird dort deutlich über dem Basispreis angekauft.
- Der Abnahmetest verkauft die zehn Tonnen vollständig.

Der Gesamtverkaufserlös in Neustadt muss größer sein als der vorherige Gesamtkaufpreis in Lambrecht. Der Test prüft die exakten Werte aus den serverseitigen Angeboten statt fest codierter Clientberechnungen.

## Weitere erkennbare Handelsmöglichkeiten

- Getreide günstig von Neustadt nach Mannheim.
- Lehm oder Ziegel günstig von Neustadt nach Lambrecht.
- Baumwolle, Zuckerrohr, Zucker oder Rum günstig von Mannheim in die anderen Städte.
- Möbel und Kleidung sind in einzelnen Städten knapp und bieten weitere Testmöglichkeiten.

## Reset

Jede neue Serverinstanz stellt exakt diese Werte wieder her. Tests benötigen zusätzlich einen ausschließlich in Testumgebungen aktiven Resetmechanismus. Er darf in einer produktiven Umgebung nicht verfügbar sein.

## Konfiguration

Städte, Waren, Preise, Zielbestände und Startbestände werden zentral und validiert konfiguriert. Ungültige IDs, negative Werte, Zielbestand 0 oder ein Startbestand oberhalb technischer Grenzwerte verhindern den Serverstart mit verständlicher Fehlermeldung.