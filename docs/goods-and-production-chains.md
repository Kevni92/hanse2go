# Waren und Produktionsketten

## Grundregeln

- Jede Ware kann grundsätzlich am Stadtmarkt gekauft und verkauft werden.
- Für Alpha 1 entspricht eine Wareneinheit einer Tonne Laderaum.
- Waren gehören einer Kategorie und besitzen einen Basispreis, eine Icon-Referenz und eine eindeutige technische ID.
- Produktionsketten werden später in festen Zyklen ausgeführt; Alpha 1 zeigt und handelt die Waren bereits, simuliert die Produktion aber noch nicht.
- Eisen setzt ein lokales Eisenvorkommen voraus. Getreide, Holz, Lehm, Baumwolle und Zuckerrohr sind grundsätzlich breiter verfügbar; die konkrete regionale Eignung wird später festgelegt.

## Verbindliche 22 Alpha-Waren

| ID | Ware | Kategorie | Rolle |
|---|---|---|---|
| `grain` | Getreide | Nahrung | Grundrohstoff, Futter |
| `flour` | Mehl | Nahrung | Zwischenware |
| `bread` | Brot | Nahrung | Grundbedürfnis |
| `livestock` | Vieh | Nahrung | Zwischenware |
| `milk` | Milch | Nahrung | Zwischenware |
| `meat` | Fleisch | Nahrung | gehobenes Bedürfnis |
| `cheese` | Käse | Nahrung | gehobenes Bedürfnis |
| `wood` | Holz | Baustoff/Rohstoff | Bau, Bretter, Kohle |
| `planks` | Bretter | Baustoff | Bau, Möbel |
| `clay` | Lehm | Baustoff/Rohstoff | Bau, Ziegel, Keramik |
| `bricks` | Ziegel | Baustoff | Bau |
| `charcoal` | Kohle | Handwerk | Werkzeugproduktion; in Alpha aus Köhlerei |
| `iron` | Eisen | Handwerk | begrenzter Rohstoff |
| `tools` | Werkzeug | Handwerk | Bau und Reparatur |
| `cotton` | Baumwolle | Kleidung | Grundrohstoff |
| `cloth` | Stoff | Kleidung | Zwischenware, später auch Segel |
| `clothing` | Kleidung | Kleidung | Bevölkerungsbedürfnis |
| `ceramics` | Keramik | Haushaltswaren | gehobenes Bedürfnis |
| `furniture` | Möbel | Haushaltswaren | reiches Bedürfnis |
| `sugarcane` | Zuckerrohr | Luxus | Grundrohstoff |
| `sugar` | Zucker | Luxus | Zwischenware, später weitere Nutzung |
| `rum` | Rum | Luxus | Luxusbedürfnis |

## Produktionsketten

### Getreide, Mehl und Brot

`Getreidehof → Getreide → Windmühle → Mehl → Bäckerei → Brot`

Brot ist das erste und in der ersten Bevölkerungssimulation wichtigste Grundbedürfnis.

### Vieh, Milch, Fleisch und Käse

`Getreide → Rinderhof → Vieh + Milch`

Danach zwei Zweige:

- `Vieh → Metzgerei → Fleisch`
- `Milch → Käserei → Käse`

Der Rinderhof erzeugt zwei Ausgänge. Getreide konkurriert dadurch zwischen Brot- und Viehproduktion.

### Holz, Bretter und Möbel

- `Forstbetrieb → Holz`
- `Holz → Sägewerk → Bretter`
- `Bretter → Tischlerei → Möbel`

Holz wird zugleich direkt für Bau, Bretter und Kohle benötigt und kann dadurch bewusst knapp werden.

### Lehm, Ziegel und Keramik

- `Lehmgrube → Lehm`
- `Lehm → Ziegelei → Ziegel`
- `Lehm → Töpferei → Keramik`

Lehm konkurriert zwischen Baustoffen und Haushaltswaren.

### Kohle, Eisen und Werkzeug

- `Holz → Köhlerei → Kohle`
- `Eisenmine → Eisen`
- `Eisen + Kohle → Schmiede → Werkzeug`

Für Alpha und den ersten Produktionsumfang ist Kohle ausdrücklich Holzkohle aus einer Köhlerei. Eine Kohlemine kann später als weitere Quelle ergänzt werden. Die Köhlerei kann grundsätzlich überall gebaut werden; die Eisenmine nur an Städten mit Eisenvorkommen.

Werkzeug wird später:

- in größerer Menge beim Gebäudebau benötigt,
- für Reparaturen verbraucht,
- möglicherweise als laufender Betriebsbedarf verwendet; Letzteres ist noch nicht entschieden.

### Baumwolle, Stoff und Kleidung

`Baumwollplantage → Baumwolle → Weberei → Stoff → Schneiderei → Kleidung`

Stoff kann später zusätzlich für Segel und damit für den Schiffbau verwendet werden. Ein separater Garn-Zwischenschritt ist für den ersten Umfang bewusst nicht vorgesehen.

### Zuckerrohr, Zucker und Rum

`Zuckerrohrplantage → Zuckerrohr → Zuckerraffinerie → Zucker → Brennerei → Rum`

Rum ist die erste konkrete Luxusware. Zucker darf später Grundlage weiterer Warenketten werden.

## Bedürfnisse nach Wohlstand

Vorgesehene erste Staffelung:

- **Arm:** Brot
- **Einfach:** Brot und Kleidung
- **Wohlhabend:** zusätzlich Fleisch, Käse und Keramik
- **Reich:** zusätzlich Möbel und Rum

Reiche Einwohner essen nicht lediglich ein Vielfaches an Brot. Neue Wohlstandsstufen erzeugen vor allem Nachfrage nach zusätzlichen, höherwertigen Waren. Konkrete Verbrauchskurven stehen in [`population-prosperity-and-housing.md`](population-prosperity-and-housing.md).

## Spätere Waren

Nicht Bestandteil der Alpha, aber als sinnvolle Erweiterungen vorgemerkt:

- Wein,
- Edelmetalle,
- Schmuck,
- Tabak und Zigarren,
- Kakao und Schokolade,
- Segel aus Stoff,
- weitere Lebensmittel und Luxuswaren.

## Alpha 2: verbindliche Produktion

Alpha 2 macht jede der 22 Tabellenwaren durch ein Spielergebäude erzeugbar. Die bisher beschriebenen Ketten bleiben dabei erhalten; die verbindlichen technischen IDs, Klassen und Rezeptmengen pro Stundentick stehen in [`alpha-2/building-catalog.md`](alpha-2/building-catalog.md) und [`alpha-2/production-recipes.md`](alpha-2/production-recipes.md). Es gibt keine Nebenprodukte außer den ausdrücklich zwei Ausgängen des Rinderhofs und keine alternativen Rezepte.

## Alpha 3: proportionale Produktion

Alpha 3 behält dieselben Ketten und Waren bei, ersetzt aber die Alpha-2-Rezeptmengen durch die verbindliche Tabelle in [`alpha-3/production-recipes.md`](alpha-3/production-recipes.md). Teilbesetzung verringert sämtliche Inputs und Outputs proportional. Mengen werden intern als Hundertstel-Tonnen mit Restakkumulatoren geführt; die atomare Inputprüfung steht in [`alpha-3/production-and-fractions.md`](alpha-3/production-and-fractions.md).
