# Weltkarte, GPS und Kartenereignisse

## Kartendarstellung

Die Spielwelt wird als Ozeankarte dargestellt. Ausgewählte reale Orte erscheinen als Inseln. Die Insel ist das spielerische Abbild eines Ortes und nicht dessen reale geografische Fläche.

Langfristig sollen Inseln visuell wachsen. Häuser, Plantagen, Werkstätten, Bäume und weitere Gebäude werden prozedural ergänzt, damit das Stadtwachstum auf der Karte sichtbar wird. Alpha 1 zeigt nur einfache Inselobjekte ohne Bebauung.

## Auswahl realer Orte

Die spätere Live-Welt soll aus einer externen Geodatenquelle, voraussichtlich OpenStreetMap oder einer vergleichbaren Ortsdatenbank, erzeugt werden.

Zielkonflikt:

- Auf dem Land sollen Dörfer wie Lambrecht, Lindenberg, Neidenfels und Esthal als eigene Inseln spielbar sein.
- Größere Städte wie Neustadt sollen größere beziehungsweise mehrere relevante Inseln erhalten.
- Metropolen wie Mannheim, Karlsruhe oder Berlin dürfen nicht nur aus einer einzigen Insel bestehen, da sonst zu viele Spieler denselben Punkt aufsuchen müssten.
- Stadtteile, Bahnhöfe und stark frequentierte Orte können eigene Inseln werden.

Die Importlogik muss konfigurierbar sein. Eine Einstellungsdatei soll steuern, welche Ortsarten, Größen und Abstände zu Inseln führen. Die endgültige Regel wird erst anhand realer Daten und Dichteanalysen festgelegt.

## GPS-Interaktion

- Der Spieler muss sich physisch in der Nähe eines Kartenobjekts befinden.
- Jede Stadt und jedes Ereignis besitzt einen Interaktionsradius.
- Eine geöffnete Ansicht berechtigt nicht dauerhaft zur Aktion.
- Vor jeder relevanten Aktion prüft der Server die aktuelle Position erneut.
- Eine Stadt kann aus Lambrecht heraus nicht bedient werden, wenn ihre Insel in Neustadt liegt.

Auto, Bahn und Fahrrad sind grundsätzlich erlaubt. Der Radius und die erneute Positionsprüfung sollen verhindern, dass ein Spieler beim schnellen Vorbeifahren eine Stadtansicht dauerhaft offenhält und später aus der Ferne handelt.

## Positionsquelle

Die nachgelagerte Spiellogik arbeitet nur mit einer normalisierten Position aus:

- Längen- und Breitengrad,
- Zeitstempel,
- Positionsquelle beziehungsweise Metadaten, soweit technisch nötig.

Für Alpha 1 wird die Position per Mausklick auf der MapLibre-Karte gesetzt. Später wird dieselbe Schnittstelle durch GPS ersetzt. Stadt-, Markt- und Handelslogik dürfen nicht direkt vom Kartenklick oder der Browser-Geolocation abhängen.

## Spätere Betrugsprävention

Nicht Bestandteil von Alpha 1, aber technisch vorzubereiten:

- regelmäßige Positionsübermittlung,
- serverseitige Prüfung von Distanz und Zeitdifferenz,
- Ermittlung unplausibler Geschwindigkeiten,
- abgestufte Reaktionen wie Ablehnung, Markierung oder Sperre,
- keine clientseitige Autorität über Reichweite oder Geschwindigkeit.

Konkrete Grenzwerte und Sanktionen werden in einer späteren Alpha festgelegt.

## Kartenereignisse

An real existierenden Punkten von Interesse können temporäre Ereignisse erscheinen.

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

## Alpha 1

Alpha 1 umfasst nur drei fest konfigurierte Inselstädte und eine Debug-Position. OSM-Import, echtes GPS, Anti-Cheat, Kartenereignisse, dynamische Inseln und Stadtgründungen sind ausgeschlossen.