# Spielvision und Core Loop

## Grundidee

Hanse2Go ist ein GPS-basiertes Handels- und Aufbauspiel, inspiriert von klassischen Titeln wie Port Royale 2. Die reale Umgebung wird spielerisch als Ozean interpretiert. Ausgewählte reale Orte erscheinen als Inselstädte. Der Spieler bewegt seine aktive Flotte durch seine physische Bewegung und kann nur mit Städten und Kartenobjekten interagieren, wenn er sich innerhalb ihres serverseitig geprüften Radius befindet.

## Gemeinsame Spielwelt

- Alle Spieler spielen in derselben persistenten Welt.
- Jede Stadt besitzt einen gemeinsamen Marktbestand.
- Verkauft ein Spieler drei Tonnen Getreide an eine Stadt, kann ein anderer Spieler diese drei Tonnen anschließend dort kaufen.
- Städte sind grundsätzlich neutral und gehören keinem Spieler.
- Spieler besitzen eigene Schiffe, Kontore und Gebäude innerhalb der Städte.
- Bauplätze sind grundsätzlich begrenzt; die konkrete Skalierung für dicht besiedelte Gebiete wird später gebalanced.

## Kern-Spielablauf

1. Der Spieler bewegt sich real zu einer Inselstadt oder einem Kartenereignis.
2. Der Server bestätigt, dass sich die aktive Flotte im erlaubten Radius befindet.
3. Der Spieler kauft günstige Waren, sammelt Waren oder erfüllt Transportaufträge.
4. Er bewegt sich zu einer anderen Stadt mit höherer Nachfrage.
5. Dort verkauft er Waren gewinnbringend.
6. Durch Handel steigen Vermögen und lokale Beliebtheit.
7. Später werden Kontore, Produktionsgebäude, weitere Schiffe und automatische Handelsrouten freigeschaltet.
8. Langfristig beeinflussen Spieler gemeinsam Versorgung, Wachstum, Wohlstand und Erscheinungsbild der Städte.

## Spielerische Priorität echter Bewegung

Echte Bewegung soll die schnellste und direkteste Form des Handels bleiben. Automatische Handelsrouten sind später möglich, aber:

- sie benötigen zusätzliche Schiffe und Flotten,
- sie sind kostspielig,
- sie bewegen sich virtuell deutlich langsamer als ein real reisender Spieler,
- ihre Geschwindigkeit richtet sich nach dem langsamsten Schiff der Flotte.

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
- **Mobile First:** Die aktive Bewegung und der Handel funktionieren primär auf dem Smartphone; komplexere Verwaltung darf später zusätzlich am Desktop komfortabler sein.

## Abgrenzung Alpha 1

Alpha 1 bildet nur den serverautoritativen Handel mit drei statischen Städten und einer Debug-Position ab. Die langfristigen Systeme in diesem Dokument sind verbindliche Zielrichtung, aber nicht automatisch Bestandteil der ersten Alpha.