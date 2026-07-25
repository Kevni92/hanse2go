# Bevölkerung, Wohlstand und Wohnraum

## Gemeinsame Bevölkerungssimulation

Eine Stadt simuliert die Bevölkerung zunächst als gemeinsame, aggregierte Einheit. Einzelne Bürger werden nicht separat berechnet.

Die Stadt führt mindestens:

- Bevölkerungszahl,
- verfügbares Arbeitskräftepotenzial,
- beschäftigte und arbeitslose Bevölkerung,
- gemeinsames Bevölkerungsvermögen,
- Wohlstand beziehungsweise Lebensstandard von 0 bis 100,
- Bedarf je Ware,
- vorhandenen und freien Wohnraum.

Vereinfacht kann jeder Einwohner als potenzieller Arbeiter gelten. Das ist bewusst nicht realistisch, hält das System aber verständlich.

## Gemeinsames Bevölkerungsvermögen

Das gemeinsame Vermögen bildet die Kaufkraft aller Einwohner ab.

### Einnahmen

- Löhne der Spieler- und später KI-Betriebe,
- gegebenenfalls spätere weitere Einkommen.

Die Löhne werden stündlich beziehungsweise pro Produktionszyklus in den Bevölkerungstopf gezahlt.

### Ausgaben

- benötigte Waren vom Stadtmarkt,
- Mieten für Wohnraum,
- später weitere Abgaben oder Dienstleistungen.

Das Geld, das die Bevölkerung in der ersten Simulation am Stadtmarkt ausgibt, verschwindet zunächst aus dem Bevölkerungsvermögen. Der Stadtmarkt besitzt unbegrenzt Geld. Ein späteres Order-System kann Zahlungen direkt an verkaufende Spieler leiten.

## Arbeitslosigkeit

Arbeitslosigkeit wirkt indirekt:

- Alle Einwohner erhöhen den Gesamtbedarf der Stadt.
- Nur Beschäftigte erzeugen Lohnzufluss.
- Viele Arbeitslose senken dadurch das durchschnittlich verfügbare Geld pro Einwohner.
- Sinkende Kaufkraft erschwert Bedürfnisdeckung und drückt den Wohlstand.

Später kann es auch wohlhabende Einwohner geben, die nicht arbeiten müssen. Dieses System ist nicht Bestandteil der ersten Bevölkerungsstufe.

## Wohlstandsskala

Technisch wird Wohlstand als Wert von 0 bis 100 geführt. Die Begriffe sind Anzeigegruppen:

- 0–9: **arm**
- 10–29: **einfach**
- 30–59: **wohlhabend**
- 60–100: **reich**

Der kontinuierliche Wert ist entscheidend. Mit steigendem Wert verändern sich Verbrauchsmengen und werden zusätzliche Bedürfnisse freigeschaltet.

Wohlstand soll nach oben zunehmend schwerer zu steigern sein. Hohe Stufen, insbesondere Werte nahe 100, erfordern über lange Zeit sehr gute Versorgung, hohe Kaufkraft und ausreichenden Wohnraum.

## Bedürfnisse

Die Definition jeder Ware enthält eine konfigurierbare Verbrauchskurve pro Einwohner und Wohlstandswert.

Erste fachliche Staffelung:

- arm: Brot,
- einfach: zusätzlich Kleidung,
- wohlhabend: zusätzlich Fleisch, Käse und Keramik,
- reich: zusätzlich Möbel und Rum.

Die Menge einer bereits benötigten Ware kann ebenfalls steigen. Als Beispiel wurde genannt:

- niedriger Wohlstand: 0,10 Brot je Einwohner und Tag,
- nächste Wohlstandsstufe: 0,15,
- danach 0,20.

Diese Zahlen sind keine finalen Balancingwerte. Die Kurven müssen datengetrieben konfigurierbar sein. Zusätzliche Bedürfnisse sollen wichtiger sein als unrealistisch stark steigender Brotverbrauch.

## Bedürfnisdeckung und Bezahlbarkeit

In einer späteren Simulation kauft die Bevölkerung stündlich die benötigten Waren aus dem Stadtmarkt, soweit Bestand und Vermögen reichen.

Bewertung:

- Ist die Ware vorhanden und günstig, bleibt nach dem Einkauf Geld übrig; Wohlstand kann steigen.
- Ist die Ware knapp und teuer, sinkt der finanzielle Überschuss.
- Fehlt die Ware oder reicht das Geld nicht, bleibt ein Teil des Bedürfnisses ungedeckt.
- Versorgung und Bezahlbarkeit werden über mehrere Stunden beziehungsweise Tage geglättet, damit der Wohlstand nicht bei jeder Einzeltransaktion springt.

Die Stadt beginnt mit einem Bevölkerungsvermögen, das ungefähr sieben Tage der anfänglichen Bedürfnisse finanzieren kann. Der konkrete Betrag ergibt sich aus Stadtgröße, Startwohlstand, Bedarf und Basispreisen.

## Wohlstandsänderung

Als erste verbindliche Grenze gilt:

- maximal +1 Wohlstandspunkt pro Tag,
- maximal −3 Wohlstandspunkte pro Tag.

Damit wächst Wohlstand langsam, kann bei schwerer Unterversorgung aber schneller sinken und sich auf ein tragfähiges Niveau stabilisieren.

Die konkrete Formel wird später als eigene Balancingentscheidung umgesetzt. Sie soll mindestens berücksichtigen:

- Anteil gedeckter Bedürfnisse,
- tatsächliche Kosten gegenüber Basispreisen,
- verfügbares Vermögen beziehungsweise finanzielle Reichweite,
- Arbeitslosigkeit indirekt über fehlende Löhne,
- verfügbaren Wohnraum.

## Bevölkerungswachstum

Die Bevölkerungswachstumsrate hängt ab von:

- Wohlstand und Bedürfnisdeckung,
- freiem Wohnraum,
- später Gebäuden und Diensten wie Krankenhäusern.

Gute Versorgung erhöht die Wachstumsrate. Dauerhafte Unterversorgung kann Wachstum stoppen und später zu Bevölkerungsrückgang führen.

## Wohnraum

Wohngebäude werden von Spielern errichtet.

- Jedes Wohngebäude stellt eine feste Kapazität bereit.
- Gesamtwohnraum ist ein harter Bevölkerungscap.
- Bei 1.000 Einwohnern und 1.000 Wohnplätzen ist kein weiteres Wachstum möglich.
- Viel freier Wohnraum beschleunigt das Wachstum.
- Wenig freier Wohnraum bremst es.
- Es gibt zunächst keine zusätzliche Obdachlosenbevölkerung oberhalb des Caps.
- Eigentümer erhalten Mieteinnahmen aus dem Bevölkerungsvermögen.

Konkrete Mietverteilung und Auslastung mehrerer Eigentümer werden später definiert.

## Alpha 1

Alpha 1 zeigt pro Stadt nur statische Bevölkerung und einen statischen Wohlstandswert. Bevölkerungsvermögen, Löhne, Bedürfnisse, Arbeitslosigkeit, Wachstum, Wohnraum und Mieten werden nicht simuliert.

## Alpha 2: fester Warenverbrauch

Alpha 2 ersetzt für seinen Umfang die oben beschriebene wohlstands- und einkommensabhängige Bedarfslogik durch feste Mengen pro Einwohner. Alle Einwohner verbrauchen dieselben Waren, unabhängig von Wohlstand, Beruf, Einkommen oder Haushalt. Die verbindlichen Werte, Rest- und Knappheitsregeln stehen in [`alpha-2/population-consumption.md`](alpha-2/population-consumption.md). Wohnraum, Wachstum, Zufriedenheit, Hunger, Krankheit und Sterblichkeit bleiben ausgeschlossen.
