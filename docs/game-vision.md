# Spielvision und Core Loop

## Grundidee

Hanse2Go ist ein browserbasiertes Handels-, Produktions- und Aufbauspiel, inspiriert von klassischen Titeln wie Port Royale 2. Langfristig zeigt es eine virtuelle Karibik mit Meer, Landmassen, Inseln, Häfen und Städten. Spieler bewegen ihre Flotten über diese zusammenhängende Welt durch serverseitig berechnete virtuelle Reisen.

Die bisherige Debug-Position mit Lambrecht, Neustadt und Mannheim bleibt ausschließlich ein deterministischer Alpha-Testzugang, bis ein eigener Karten- und Reiseslice die virtuelle Karibikwelt einführt. Sie ist keine langfristige Produktanforderung.

## Gemeinsame Spielwelt

- Alle Spieler spielen in derselben persistenten Welt.
- Jede Stadt besitzt einen gemeinsamen Marktbestand.
- Verkauft ein Spieler drei Tonnen Getreide an eine Stadt, kann ein anderer Spieler diese drei Tonnen anschließend dort kaufen.
- Städte sind grundsätzlich neutral und gehören keinem Spieler.
- Spieler besitzen eigene Schiffe, Kontore und Gebäude innerhalb der Städte.
- Bauplätze sind grundsätzlich begrenzt; die konkrete Skalierung für dicht besiedelte Gebiete wird später gebalanced.

## Kern-Spielablauf

1. Der Spieler disponiert seine Flotte zu einer virtuellen Stadt oder einem späteren Kartenereignis.
2. Der Server berechnet Strecke, Geschwindigkeit, Abfahrt und Ankunft der virtuellen Reise.
3. Der Spieler handelt gedeckte Limit Orders, produziert Waren oder erfüllt spätere Transportaufträge.
4. Er reist zu einer anderen Stadt mit anderen Angeboten und Nachfragen.
5. Dort verkauft er Waren gewinnbringend.
6. Durch Handel steigen Vermögen und lokale Beliebtheit.
7. Später werden Kontore, Produktionsgebäude, weitere Schiffe und automatische Handelsrouten freigeschaltet.
8. Langfristig beeinflussen Spieler gemeinsam Versorgung, Wachstum, Wohlstand und Erscheinungsbild der Städte.

## Virtuelle Reise und Handelsrouten

Virtuelle Flottenreisen werden in einem eigenen späteren Slice eingeführt. Geschwindigkeit, Strecke und spätere Reiseeinflüsse bestimmen die Dauer. Automatische Handelsrouten benötigen zusätzliche Schiffe, Kapital und serverseitige Routenkonfiguration; sie sind kein Alpha-5-Umfang.

## Langfristige Systeme

Spätere Entwicklungsstufen umfassen unter anderem:

- Kontore und lokale Lager
- Produktionsgebäude und Wohnhäuser
- Bevölkerung, Arbeiter, Bedürfnisse und Wohlstand
- Stadtwachstum und prozedural sichtbare Bebauung
- automatisierte Handelsrouten
- Spieler- oder gemeinschaftsfinanzierte Stadtgründungen
- Piraterie, Kapern und Seeschlachten gegen Spieler- und NPC-Flotten
- weitere Warenketten, Schiffe und Bedürfnisse

## Designprinzipien

- **Serverautorität:** Der Server entscheidet über Position, Reichweite, Preise, Bestände und Transaktionen.
- **Spielspaß vor strengem Realismus:** Inseln können aus spielerischen Gründen auch an ungewöhnlichen Orten entstehen.
- **Gemeinsame Konsequenzen:** Handel und Produktion eines Spielers verändern die wirtschaftliche Lage für alle.
- **Verständliche Tiefe:** Wirtschaftliche Zusammenhänge sollen dynamisch sein, aber über wenige klare Werte erklärbar bleiben.
- **Mobile First:** Handel und Verwaltung funktionieren primär auf dem Smartphone; komplexere Verwaltung bleibt am Desktop komfortabel.

## Abgrenzung Alpha 1

Alpha 1 bis Alpha 5 verwenden weiterhin drei statische Teststädte und eine Debug-Position als Übergang. Die langfristige virtuelle Karibik und virtuelle Flottenreisen sind verbindliche Zielrichtung, aber nicht Bestandteil dieser Alphas.
