# Weltkarte, Übergangsposition und Kartenereignisse

## Kartendarstellung

Die langfristige Spielwelt wird als virtuelle Karibikkarte dargestellt. Städte und Häfen besitzen feste virtuelle Kartenpositionen; Meer, Landmassen und Inseln bilden eine zusammenhängende Handelswelt. Die konkrete Karibikkarte und virtuelle Reiseberechnung sind ein späterer eigener Slice.

Lambrecht, Neustadt und Mannheim mit ihren Koordinaten sind bis dahin ausschließlich eine deterministische Alpha-Testwelt. Ihre Inseln und Radien bilden keinen Entwurf der späteren Live-Welt ab.

Langfristig sollen Inseln visuell wachsen. Häuser, Plantagen, Werkstätten, Bäume und weitere Gebäude werden prozedural ergänzt, damit das Stadtwachstum auf der Karte sichtbar wird. Alpha 1 zeigt nur einfache Inselobjekte ohne Bebauung.

## Historische Auswahl realer Orte

Die folgenden Überlegungen dokumentieren den früheren GPS-Entwurf. Sie sind keine langfristige Produktvorgabe mehr und werden nicht als Grundlage für die virtuelle Karibikkarte verwendet.

Zielkonflikt:

- Auf dem Land sollen Dörfer wie Lambrecht, Lindenberg, Neidenfels und Esthal als eigene Inseln spielbar sein.
- Größere Städte wie Neustadt sollen größere beziehungsweise mehrere relevante Inseln erhalten.
- Metropolen wie Mannheim, Karlsruhe oder Berlin dürfen nicht nur aus einer einzigen Insel bestehen, da sonst zu viele Spieler denselben Punkt aufsuchen müssten.
- Stadtteile, Bahnhöfe und stark frequentierte Orte können eigene Inseln werden.

Die Importlogik muss konfigurierbar sein. Eine Einstellungsdatei soll steuern, welche Ortsarten, Größen und Abstände zu Inseln führen. Die endgültige Regel wird erst anhand realer Daten und Dichteanalysen festgelegt.

## Übergangs-Interaktion für die Alpha-Testwelt

- Der Testspieler setzt eine Debug-Position in die Nähe eines Kartenobjekts.
- Jede Stadt und jedes Ereignis besitzt einen Interaktionsradius.
- Eine geöffnete Ansicht berechtigt nicht dauerhaft zur Aktion.
- Vor jeder relevanten Aktion prüft der Server die aktuelle Position erneut.
- Eine Stadt kann aus Lambrecht heraus nicht bedient werden, wenn ihre Insel in Neustadt liegt.

Die Radien und die erneute Positionsprüfung schützen die aktuelle Testwelt davor, dass eine geöffnete Stadtansicht später aus der Ferne benutzt wird. Sie werden durch serverseitige virtuelle Reise- und Ankunftsregeln ersetzt, sobald der entsprechende Slice umgesetzt ist.

## Positionsquelle

Die nachgelagerte Spiellogik arbeitet nur mit einer normalisierten Position aus:

- Längen- und Breitengrad,
- Zeitstempel,
- Positionsquelle beziehungsweise Metadaten, soweit technisch nötig.

Für Alpha 1 bis Alpha 5 wird die Position per Mausklick auf der MapLibre-Karte gesetzt. Die langfristige Eingabe ist eine serverseitig verwaltete virtuelle Flottenposition, nicht Browser-Geolocation oder GPS. Stadt-, Markt- und Handelslogik dürfen nicht direkt von Kartenklick, Browser-Geolocation oder einer späteren Positionsquelle abhängen.

## Historische GPS-Betrugsprävention

Nicht Bestandteil von Alpha 1; diese historische Liste ist keine Vorgabe für die virtuelle Karibik:

- regelmäßige Positionsübermittlung,
- serverseitige Prüfung von Distanz und Zeitdifferenz,
- Ermittlung unplausibler Geschwindigkeiten,
- abgestufte Reaktionen wie Ablehnung, Markierung oder Sperre,
- keine clientseitige Autorität über Reichweite oder Geschwindigkeit.

Konkrete Grenzwerte und Sanktionen werden in einer späteren Alpha festgelegt.

## Spätere Kartenereignisse

An virtuellen Kartenpunkten können später temporäre Ereignisse erscheinen.

### Fässer

- erscheinen in festen oder dynamisch gewählten Abständen,
- besitzen einen kleinen Interaktionsradius,
- enthalten zufällige Waren, zum Beispiel zehn Tonnen Holz,
- verschwinden nach Aufnahme oder Ablauf.

### Schiffbrüchige und Reisende

- werden an einem Kartenpunkt aufgenommen,
- möchten zu einer bestimmten Stadt gebracht werden,
- belohnen größere Distanzen grundsätzlich stärker,
- dienen als ergänzende Aktivität und möglicher Tutorialschritt.

## Spieler gegründete Inseln

Später dürfen Spieler an noch unbesetzten Orten neue Städte beziehungsweise Inseln gründen. Das ist bewusst spielerisch und muss geografisch nicht realistisch sein.

Mögliche Umsetzung:

- sehr hohe Rang-, Geld- und Warenanforderungen,
- Einzelprojekt eines sehr reichen Spielers oder
- Community-Challenge, bei der viele Spieler Baumaterialien liefern,
- besondere Orte und Denkmäler können dadurch zu neuen Zentren werden.

## Alpha-Testzugang

Alpha 1 bis Alpha 5 umfassen nur drei fest konfigurierte Inselstädte und eine Debug-Position. Die Orderbuch- und Wirtschaftslogik bleibt unabhängig von dieser Übergangsposition. OSM-Import, echtes GPS, Karibikkarte, virtuelle Reisen, Anti-Cheat, Kartenereignisse, dynamische Inseln und Stadtgründungen sind ausgeschlossen.
