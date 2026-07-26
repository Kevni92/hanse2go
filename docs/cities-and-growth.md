# Städte, Bauplätze und Wachstum

## Eigentum und gemeinsame Nutzung

- Städte sind neutrale Orte und gehören zunächst keinem Spieler.
- Alle Spieler handeln mit demselben Stadtmarkt.
- Gebäude innerhalb der Stadt gehören jeweils dem Spieler, der sie errichtet hat.
- Kontore und Warenlager sind ebenfalls spielerbezogen.
- Spieler konkurrieren grundsätzlich um begrenzte Bauplätze.

Die konkrete Bauplatzskalierung für Großstädte und stark besuchte Inseln ist noch Balancing. Das System muss genügend Teilhabe ermöglichen, ohne die Knappheit vollständig aufzuheben.

## Stadtwerte

Eine Stadt besitzt langfristig mindestens:

- eindeutige Identität und Kartenposition,
- Interaktionsradius,
- Bevölkerung,
- maximalen Wohnraum,
- verfügbares Arbeitskräftepotenzial,
- Wohlstand beziehungsweise Lebensstandard von 0 bis 100,
- gemeinsamen Marktbestand je Ware,
- Zielbestand beziehungsweise Nachfrage je Ware,
- vorhandene Spieler- und gegebenenfalls KI-Gebäude,
- begrenzte Bauplätze,
- sichtbare Größe und Entwicklungsstufe.

## Versorgung und Wachstum

Städte wachsen, wenn ihre Bevölkerung gut versorgt ist und ausreichend Wohnraum vorhanden ist.

- Die Bevölkerung verbraucht Waren aus dem gemeinsamen Stadtmarkt.
- Gute Bedürfnisdeckung und Bezahlbarkeit erhöhen den Wohlstand.
- Höherer Wohlstand kann das Bevölkerungswachstum fördern.
- Größere Bevölkerung erzeugt mehr Nachfrage und stellt mehr Arbeiter bereit.
- Fehlender Wohnraum ist ein harter Wachstumsstopp.
- Viel freier Wohnraum beschleunigt das Wachstum, knapper freier Wohnraum bremst es.

Details stehen in [`population-prosperity-and-housing.md`](population-prosperity-and-housing.md).

## Produktion zu Spielbeginn

Langfristig soll die Produktion überwiegend von Spielern getragen werden. Zum Start einer neuen Welt und in wenig bespielten Gebieten darf die Stadt beziehungsweise eine KI jedoch Grundproduktion bereitstellen.

- KI-Betriebe sichern einen minimalen Warenfluss.
- Benachbarte Städte erhalten unterschiedliche Produktionsschwerpunkte, damit Handel möglich ist.
- Je mehr Spieler eine Ware produzieren, desto stärker wird die entsprechende KI-Produktion zurückgefahren.
- KI-Händler dürfen extreme Knappheit oder Überversorgung gelegentlich ausgleichen.
- Für Spielbarkeit dürfen dabei Waren notfalls erzeugt oder entfernt werden; ein vollständig geschlossener Realwirtschaftskreislauf ist kein Selbstzweck.

## Sichtbares Stadtwachstum

Später soll jede einzelne Gebäudeinstanz auf der Insel sichtbar werden. Fünf Forstbetriebe sollen als fünf Gebäude oder passende visuelle Strukturen erscheinen. Es gibt deshalb keine unsichtbaren Gebäudestufen; jedes zusätzliche Gebäude ist eine eigene Instanz.

Die prozedurale Darstellung soll unter anderem berücksichtigen:

- Wohnhäuser,
- Produktionsgebäude,
- Plantagen und Rohstoffflächen,
- Bäume und Vegetation,
- zunehmende Dichte und Größe der Stadt.

## Stadtgründung

Neue Städte können später durch Spieler oder gemeinschaftlich entstehen.

Voraussetzungen können sein:

- hoher Spielerrang,
- sehr große Geldsumme,
- umfangreiche Baumaterialien,
- Community-Lieferziel, das ein einzelner Spieler kaum erfüllen kann,
- mehrstufige Bauzeit.

Die gegründete Stadt bleibt grundsätzlich neutral; die Gründer erhalten nicht automatisch vollständiges Eigentum an der Stadt. Konkrete Privilegien sind noch offen.

## Alpha 1

Alpha 1 zeigt für drei Städte nur statische Werte:

- Bevölkerung,
- Wohlstand,
- Beliebtheit des Testspielers,
- Kontorstatus,
- Produktionsschwerpunkte.

Gebäude, Bauplätze, Wachstum, KI-Produktion, Wohnraum und Stadtgründung werden nicht simuliert.

## Alpha 2: lokale Baukonzession

Für Alpha 2 ist der Ruf je Spieler und Stadt ein zusätzlicher Stadtbezug. Eine Baukonzession gehört immer genau diesem Spieler und dieser Stadt und berechtigt dort zum Bau des verpflichtenden Kontors und danach von Produktionsgebäuden. Sie verleiht weder Eigentum an der Stadt noch ein exklusives Baurecht. Begrenzte Bauplätze, Stadtgründung, Wohnraum und Wachstum bleiben außerhalb von Alpha 2.

Der Bau erfolgt sofort und nur, wenn sich die aktive Flotte im servergeprüften Stadtradius befindet. Alpha 2 kennt keine Bauplatzbegrenzung: Spieler können mehrere gleiche Produktionsgebäude besitzen, aber höchstens ein Kontor pro Stadt. Kosten, Materialquelle und Fehlerszenarien stehen in [`alpha-2/buildings-and-construction.md`](alpha-2/buildings-and-construction.md).

## Alpha 3: gemeinsamer Wohnraum

Der Alpha-3-Grundwohnraum ist stadtweit und neutral; spielereigene Wohnhäuser erhöhen denselben gemeinsamen Pool unmittelbar, ohne Einwohner zu reservieren. Das Wohnhaus gehört seinem Erbauer, aber sein Wohnraum unterstützt das Wachstum der gesamten Stadt. Kosten, Voraussetzungen und Kapazitätsformeln stehen in [`alpha-3/housing.md`](alpha-3/housing.md).
