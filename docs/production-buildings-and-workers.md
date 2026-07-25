# Produktion, Gebäude und Arbeiter

## Produktionszyklen

Produktionsgebäude arbeiten nicht kontinuierlich, sondern in festen, konfigurierbaren Zyklen. Die Dauer wird in Minuten angegeben.

Beispiel: Ein Forstbetrieb produziert alle 30 Minuten eine Tonne Holz. Konkrete Zykluszeiten, Mengen, Löhne und Baukosten sind Balancingwerte.

Bei jedem Zyklus prüft der Server:

1. Sind die benötigten Eingangswaren im lokalen Kontor des Eigentümers vorhanden?
2. Sind ausreichend Arbeiter zugeteilt?
3. Welchen Zustand besitzt das Gebäude?
4. Kann der Eigentümer die Löhne bezahlen?
5. Welche effektive Produktionsmenge ergibt sich?

## Ein- und Ausgangswaren

- Eingangswaren werden ausschließlich aus dem Kontor des Gebäude-Eigentümers in derselben Stadt entnommen.
- Ausgangswaren werden in dieses lokale Kontor gelegt.
- Fehlen Eingangswaren, produziert das Gebäude nichts.
- Stadtmarkt und Kontor sind getrennte Bestände. Ein Gebäude kauft seine Eingänge nicht automatisch vom Markt.
- Der Spieler muss die Versorgung seiner Betriebe durch Handel und Lagerverwaltung sicherstellen.

## Löhne

- Jedes Gebäude benötigt eine feste Zahl allgemeiner Arbeiter.
- Arbeiter werden pro Produktionszyklus bezahlt.
- Löhne fallen auch an, wenn wegen fehlender Eingangswaren keine Produktion stattfindet.
- Kann ein Eigentümer Löhne nicht zahlen, muss der genaue Stillstands- und Schuldenfall später definiert werden.
- Gezahlte Löhne fließen in das gemeinsame Bevölkerungsvermögen der Stadt.

## Arbeiterverteilung

Für den ersten Produktionsumfang gibt es nur einen allgemeinen Arbeitertyp ohne Berufe.

- Bevölkerung entspricht vereinfacht dem maximal verfügbaren Arbeitskräftepotenzial.
- Arbeiter werden automatisch auf Gebäude verteilt.
- Der Spieler kann seine eigenen Gebäude priorisieren.
- Ein Gebäude mit 100 benötigten, aber nur 50 zugeteilten Arbeitern arbeitet mit 50 Prozent Arbeitereffizienz.
- Ein Gebäude ohne Arbeiter steht still.

Für konkurrierende Prioritäten mehrerer Spieler gilt als spätere Standardrichtung: zuerst werden höhere Prioritätsklassen berücksichtigt, innerhalb derselben Klasse fair und deterministisch verteilt. Der konkrete Algorithmus wird im Implementierungs-Issue festgelegt und darf keinen Spieler dauerhaft willkürlich bevorzugen.

## Produktionseffizienz

Die effektive Produktion hängt mindestens von Arbeitern und Gebäudezustand ab.

Vorgesehene Grundform:

`Effizienz = Arbeiterauslastung × Gebäudezustand`

Beispiel:

- 50 Prozent der Arbeiter vorhanden,
- 80 Prozent Gebäudezustand,
- daraus 40 Prozent effektive Ausgabe.

Eingangswaren sollen nur im zur tatsächlichen Ausgabe passenden Umfang verbraucht werden. Eine ausdrücklich diskutierte Ausnahme war: Ein Gebäude mit 50 Prozent Zustand produziert bei gleichem Input nur die Hälfte. Vor der späteren Produktionsimplementierung muss festgelegt werden, ob Zustand ineffizienten Mehrverbrauch oder proportionalen Inputverbrauch bedeutet. Für eine verständliche Standardlösung soll Zustand zunächst die Ausgabe bei vollem planmäßigen Input reduzieren; Reparaturen vermeiden damit echte Ressourcenverschwendung.

## Gebäudezustand und Reparatur

Jedes Gebäude besitzt einen Zustand von 0 bis 100 Prozent.

- 100 Prozent: volle zustandsbedingte Effizienz.
- 50 Prozent: halbe zustandsbedingte Produktion.
- 0 Prozent: keine Produktion.
- Der Zustand verschlechtert sich langfristig nach einer noch zu definierenden Regel.
- Reparaturen benötigen einen Bruchteil der ursprünglichen Baukosten und Baumaterialien.
- Werkzeug wird für Bau und Reparatur benötigt.

Konkrete Verschleißraten und Reparaturformeln sind Balancing.

## Gebäudeinstanzen und Bauplätze

- Gebäude besitzen keine unsichtbaren Ausbaustufen.
- Jedes zusätzliche Gebäude ist eine eigene Instanz.
- Fünf Forstbetriebe belegen fünf Bauplätze und sollen später fünfmal sichtbar sein.
- Spieler konkurrieren um begrenzte Bauplätze einer Stadt.
- Wohngebäude sind ebenfalls spielereigene Gebäude.

## Gebäude des ersten Produktionsumfangs

- Getreidehof
- Windmühle
- Bäckerei
- Rinderhof
- Metzgerei
- Käserei
- Forstbetrieb
- Sägewerk
- Lehmgrube
- Ziegelei
- Köhlerei
- Eisenmine
- Schmiede
- Baumwollplantage
- Weberei
- Schneiderei
- Töpferei
- Tischlerei
- Zuckerrohrplantage
- Zuckerraffinerie
- Brennerei
- Wohngebäude

## Alpha 1

Alpha 1 implementiert keine Gebäude, Kontore, Produktionszyklen, Arbeiter, Löhne, Verschleiß oder Reparaturen. Sie zeigt pro Stadt nur statische Produktionsschwerpunkte und handelt bereits alle 22 Waren.

## Alpha 2: Bau ohne Arbeiter und Bauzeit

Alpha 2 ersetzt für seinen Umfang die oben beschriebenen offenen Arbeits-, Lohn-, Zustands- und Bauzeitregeln. Der Server baut ein berechtigtes Gebäude sofort und atomar aus Gold und Baumaterialien der aktiven Flotte. Es gibt weder Baufortschritt, Wartung, Verschleiß, Reparatur noch Arbeiter. Produktionsgebäude arbeiten später mit voller Rezeptleistung oder stehen bei fehlenden Inputs vollständig still.

Jedes Produktionsgebäude ist eine eigene Instanz; mehrere Instanzen desselben Typs sind erlaubt. Nur das Kontor ist je Spieler und Stadt einmalig und muss vor jeder Produktionsinstanz vorhanden sein. Die verbindlichen Baukosten stehen in [`alpha-2/buildings-and-construction.md`](alpha-2/buildings-and-construction.md).

Alle Alpha-2-Rezepte laufen einmal pro manuell simuliertem Stundentick. Rohstoffgebäude haben keine Eingangswaren. Verarbeitende Gebäude verbrauchen alle Eingänge und erzeugen alle Ausgänge vollständig oder bleiben ohne Teilverbrauch stehen. Die vollständige Tabelle steht in [`alpha-2/production-recipes.md`](alpha-2/production-recipes.md).
