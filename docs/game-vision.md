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
- Ab Alpha 6 wirtschaften zusätzlich autonome Handelshäuser in derselben Welt, nach denselben Regeln und ohne Sonderrechte.
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

Alpha 6 führt die virtuelle Flottenreise ein. Der Server berechnet die Dauer aus der Streckendistanz und der Geschwindigkeit des langsamsten Schiffes einer Flotte; während der Reise sind Zusammensetzung und Ladung gesperrt. Spieler und autonome Handelshäuser verwenden denselben Befehl und dieselben Regeln.

Der Alpha-6-Streckengraph umfasst bewusst nur die drei Teststädte. Er ist eine Zwischenstufe, keine Weltkarte: Die spätere Karibikkarte ersetzt ausschließlich die Kantenliste, während Reiseentität, Flottenstatus und Fahrzeitformel bestehen bleiben. Wind, Wetter, Gefahren, freie Navigation und automatisch wiederholte Handelsrouten folgen in späteren Slices.

## Autonome Handelshäuser

Ab Alpha 6 wird die Welt nicht mehr ausschließlich von Spielern belebt. Drei autonome Handelshäuser beobachten die öffentliche Wirtschaft, erkennen Versorgungslücken und handeln, produzieren, transportieren und investieren nach genau denselben Regeln wie ein Spieler.

Sie sind ausdrücklich kein Weltmechanismus und kein Balancingwerkzeug: Sie besitzen eigene endliche Konten, kaufen und verkaufen über dasselbe Orderbuch, bezahlen dieselben Gebühren, brauchen Ruf und Konzession für jede neue Stadt, können Verluste machen und können insolvent werden. Sie erhalten weder Sonderressourcen noch Sonderpreise noch Einblick in private Spielerdaten. Kein KI-Befehl erzeugt Gold oder Waren aus dem Nichts.

Sobald Spieler einen Markt ausreichend versorgen, ziehen sich die Handelshäuser messbar zurück, statt Spieler zu verdrängen. Sie sind regelbasiert und deterministisch; generative oder lernende Verfahren sind ausgeschlossen. Der vollständige Umfang steht in [`alpha-6/scope.md`](alpha-6/scope.md).

## Langfristige Systeme

Spätere Entwicklungsstufen umfassen unter anderem:

- Kontore und lokale Lager
- Produktionsgebäude und Wohnhäuser
- Bevölkerung, Arbeiter, Bedürfnisse und Wohlstand
- Stadtwachstum und prozedural sichtbare Bebauung
- die vollständige Karibikkarte mit grafischen Reisewegen
- Wind, Wetter, Gefahren und dynamische Routen
- automatisch wiederholte Handelsrouten
- persistente Welt, Benutzerkonten und automatischer Echtzeittick
- Spieler- oder gemeinschaftsfinanzierte Stadtgründungen
- Reparaturen, Module, Besatzungen, Piraterie, Kapern und Seeschlachten
- Goldware, Goldabbau und materiell gedeckte Münzprägung
- weitere Warenketten, Schiffe und Bedürfnisse

## Designprinzipien

- **Serverautorität:** Der Server entscheidet über Position, Reichweite, Preise, Bestände und Transaktionen.
- **Spielspaß vor strengem Realismus:** Inseln können aus spielerischen Gründen auch an ungewöhnlichen Orten entstehen.
- **Gemeinsame Konsequenzen:** Handel und Produktion eines Spielers verändern die wirtschaftliche Lage für alle.
- **Verständliche Tiefe:** Wirtschaftliche Zusammenhänge sollen dynamisch sein, aber über wenige klare Werte erklärbar bleiben.
- **Mobile First:** Handel und Verwaltung funktionieren primär auf dem Smartphone; komplexere Verwaltung bleibt am Desktop komfortabel.

## Abgrenzung Alpha 1

Alpha 1 bis Alpha 5 verwenden weiterhin drei statische Teststädte und eine Debug-Position als Übergang. Die langfristige virtuelle Karibik ist verbindliche Zielrichtung, aber nicht Bestandteil dieser Alphas.

Ab Alpha 6 sind virtuelle Flottenreisen auf dem statischen Drei-Städte-Graph vorhanden; die Debug-Position bleibt ausschließlich Übergangsmechanik für nicht reisende Flotten. Die grafische Karibikkarte bleibt weiterhin außerhalb des Umfangs.
