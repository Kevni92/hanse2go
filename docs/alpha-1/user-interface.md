# Alpha 1 – Benutzeroberfläche

## Gestaltungsrichtung

Die Oberfläche ist Mobile First und soll freundlich, übersichtlich und leicht historisch wirken.

Ab Alpha 4 ergänzt die Stadtansicht den mobilen und Desktop-fähigen Tab `Hafen`; seine verbindlichen Zustände, Tastaturbedienung und Test-IDs stehen in [`../alpha-4/user-interface.md`](../alpha-4/user-interface.md).

- helle, pastellige Farbwelt
- warme Holzoptik für Flächen, Rahmen und Bedienelemente
- keine überladenen Ornamente
- klare moderne Bedienbarkeit trotz historischem Thema
- farbige Waren-Icons in einheitlichem halb-realistischem Stil
- Desktop-Unterstützung ohne eigene Desktop-Funktionalität

## Kartenansicht

MapLibre GL JS bildet die zentrale Spielansicht.

Die Karte zeigt:

- eine ozeanartige Grundfläche,
- drei einfache Inselobjekte,
- Namen der Städte,
- die bestätigte Position der aktiven Flotte,
- im Debug-Modus optional die Interaktionsradien,
- eine sichtbare Kennzeichnung des Debug-Modus.

Ein Kartenklick sendet die gewünschte Position an den Server. Erst nach erfolgreicher Serverantwort wird die Flottenposition aktualisiert. Abgelehnte oder fehlerhafte Positionsänderungen dürfen nicht lokal als gültig erscheinen.

## Topbar und HUD

Die Topbar ist über der Kartenansicht sichtbar und zeigt mindestens:

- aktuelles Gold,
- Zugriff auf Spielerinformationen,
- Zugriff auf die Flottenübersicht.

Ein Klick auf das Gold öffnet eine kompakte Spielerübersicht. Die Flottenübersicht zeigt:

- 60 Tonnen Gesamtkapazität,
- belegten Laderaum,
- freien Laderaum,
- geladene Waren und Mengen.

Nach erfolgreichem Handel werden Gold, Ladung und Bestände ohne Seitenneuladen aktualisiert.

## Erreichbare Stadt

Befindet sich die Flotte laut Server innerhalb eines Stadtradius:

- wird die Stadt auf der Karte hervorgehoben,
- erscheint prominent der Button `Stadt betreten`,
- der Button pulsiert dezent, blinkt aber nicht.

Liegen mehrere Städte im Radius, muss der Nutzer eindeutig wählen können. In der Alpha-Testwelt überlappen die Radien normalerweise nicht.

## Fullscreen-Stadtansicht

Die Stadt öffnet sich als Fullscreen-Dialog beziehungsweise bildschirmfüllende Ansicht über der Karte. Die Karte bleibt im Hintergrund erhalten und erscheint nach dem Schließen unverändert.

Die Kopfzeile enthält:

- Stadtname,
- klaren Schließen-Button,
- bei Bedarf eine kompakte Anzeige von Gold und Laderaum.

Bereiche beziehungsweise Tabs:

1. **Übersicht**
2. **Produktion**
3. **Markt**

### Übersicht

Zeigt:

- Bevölkerung,
- Wohlstandswert 0 bis 100 und zugehörige Bezeichnung,
- Beliebtheit des Testspielers,
- Kontorstatus.

Alle Werte sind in Alpha 1 statisch.

### Produktion

Zeigt die konfigurierten Produktionsschwerpunkte der Stadt, nach Bedeutung sortiert. Es werden keine echten Produktionsmengen oder Zyklen simuliert.

## Marktübersicht

Alle 22 Waren werden nach Kategorien gruppiert. Verbindlich ist die technische
ID; der deutsche Anzeigename kommt aus der Sprachdatei:

- `food` – Nahrung
- `building_materials` – Baustoffe
- `crafts` – Handwerk
- `clothing` – Kleidung
- `household` – Haushaltswaren
- `luxury` – Luxuswaren

Jede Warenzeile besitzt vier Informationsbereiche:

1. Icon und Warenname
2. aktueller Spieler-Kaufpreis mit Münzindikator
3. Bestand der Stadt
4. Bestand der Flotte

Die gesamte Zeile ist anklickbar.

## Münzindikator

Der Indikator visualisiert das Preisniveau relativ zum Basispreis. Für Alpha 1 gilt folgende klare Zuordnung anhand `aktueller Kaufpreis / Basispreis`:

- bis 0,75: eine bronzene Münze
- über 0,75 bis unter 0,90: zwei bronzene Münzen
- 0,90 bis 1,10: drei silberne Münzen
- über 1,10 bis 1,50: eine goldene Münze
- über 1,50 bis 2,50: drei goldene Münzen
- über 2,50: fünf goldene Münzen

Farbe allein darf nicht die einzige Information sein. Eine zugängliche Textbeschreibung wie `günstig`, `normal`, `teuer` wird zusätzlich bereitgestellt.

## Warendetailansicht

Nach Auswahl einer Ware öffnet sich eine Detailansicht innerhalb der Stadtansicht. Sie zeigt mindestens:

- Icon und Name,
- Kategorie,
- Basispreis,
- aktuellen Kaufpreis,
- aktuellen Verkaufspreis,
- Stadtbestand,
- Flottenbestand,
- Preisverlauf der aktuellen Serverlaufzeit,
- gehandeltes Volumen der aktuellen Serverlaufzeit.

Die Diagramme dürfen kompakt sein. Fehlen historische Daten, wird ein verständlicher leerer Zustand angezeigt.

## Kaufen und Verkaufen

Kauf- und Verkaufsmodus sind visuell eindeutig getrennt.

Die Mengensteuerung enthält:

- Slider,
- `−10`, `−1`, `+1`, `+10`,
- `Max`,
- direkte Mengenanzeige.

Der Sliderbereich wird begrenzt durch:

- beim Kauf: Stadtbestand, Geld und freien Laderaum,
- beim Verkauf: Flottenbestand.

Der Client darf diese Grenzen zur Bedienung vorab schätzen. Das verbindliche Angebot liefert immer der Server.

Vor Abschluss werden angezeigt:

- gewählte Menge,
- durchschnittlicher Preis,
- Gesamtpreis oder Gesamterlös,
- verbleibendes Gold,
- verbleibender Laderaum,
- resultierender Stadt- und Flottenbestand.

Nach einer Mengenänderung wird ein neues serverseitiges Angebot geladen. Währenddessen zeigt die UI einen klaren Ladezustand und verhindert den Abschluss eines veralteten Angebots.

## Fehlerzustände

Mindestens verständlich darzustellen sind:

- Stadt nicht mehr in Reichweite,
- Server nicht erreichbar,
- ungültige Menge,
- Ware oder Stadt unbekannt,
- nicht genug Gold,
- nicht genug Laderaum,
- nicht genug Stadtbestand,
- nicht genug Flottenbestand,
- Preisangebot veraltet.

Bei verlorener Reichweite bleibt die Stadtansicht erklärend sichtbar, aber schreibende Aktionen werden deaktiviert. Der Nutzer kann zur Karte zurückkehren.

## Responsive Anforderungen

Die zentrale Handelsbedienung soll auf einem typischen Smartphone-Viewport von ungefähr 390 × 844 Pixeln ohne unnötiges Scrollen funktionieren. Dafür dürfen Diagramme verkleinert oder sekundäre Details eingeklappt werden.

Auf extrem kleinen oder stark vergrößerten Ansichten ist zugängliches Scrollen besser als abgeschnittene Inhalte. Bedienelemente müssen ausreichend große Touch-Ziele besitzen und per Tastatur nutzbar sein.

## Alpha-Grenzen

Nicht enthalten sind:

- echte Gebäudeansichten,
- Kontorverwaltung,
- einzelne Schiffe,
- Handelsrouten,
- echte GPS-Bedienelemente,
- endgültige prozedurale Inselgrafik,
- endgültige Waren-Artworks; einheitliche Platzhalter sind zulässig, sofern die Asset-Schnittstelle vorbereitet ist.
