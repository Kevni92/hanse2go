# Technische Architektur und Arbeitsweise

## 1. Zweck dieser Dokumentation

Diese Datei beschreibt die verbindliche technische Grundlage von Hanse2Go und den abgegrenzten Umfang der ersten spielbaren Alpha. Sie ist gemeinsam mit den fachlichen Dokumenten unter `docs/` die Single Source of Truth für spätere Implementierungs-Issues.

Produktivcode darf nur auf Basis freigegebener Dokumentation entstehen. Änderungen an fachlichen oder technischen Entscheidungen werden zuerst dokumentiert und anschließend implementiert.

## 2. Arbeitsweise

Für jedes Issue gelten folgende Regeln:

1. Das Issue und alle abhängigen Dokumente vollständig lesen.
2. Fehlende oder widersprüchliche Anforderungen vor der Umsetzung klären.
3. Einen eigenen Branch pro Issue verwenden.
4. Nur Änderungen innerhalb des Issue-Umfangs vornehmen.
5. Akzeptanzkriterien durch passende automatisierte oder manuelle Tests nachweisen.
6. Einen Pull Request pro Issue eröffnen.
7. Pull Requests nicht eigenständig mergen.
8. Dauerhafte Entscheidungen unter `docs/` festhalten.

## 3. Architekturprinzipien

### 3.1 Serverautorität

Der Server ist die einzige verbindliche Autorität über den Spielzustand. Der Client stellt Zustände dar und sendet Absichten des Spielers, darf aber keine spielrelevanten Ergebnisse verbindlich festlegen.

Serverseitig validiert werden insbesondere:

- Position der aktiven Flotte
- Entfernung zu einer Stadt
- Berechtigung zur Stadtinteraktion
- Marktbestand und Flottenbestand
- verfügbares Geld und freier Laderaum
- Kauf- und Verkaufspreise
- vollständige Handelstransaktionen

Der Client darf Werte zur Vorschau berechnen. Die endgültige Entscheidung und der endgültige Zustand kommen immer vom Server.

### 3.2 Austauschbare Positionsquelle

Die Spiellogik verwendet eine abstrahierte Positionsquelle. Für Alpha 1 setzt der Spieler seine Position im Debug-Modus per Mausklick auf der Karte. Später wird dieselbe Schnittstelle durch eine GPS-Positionsquelle bedient.

Die nachgelagerten Systeme dürfen nicht unterscheiden müssen, ob eine Position durch einen Debug-Klick oder durch GPS entstanden ist. Sie erhalten ausschließlich eine normalisierte Position mit Koordinaten und Zeitstempel.

### 3.3 REST-Kommunikation

Der Client kommuniziert über eine REST API mit dem Server. Alle schreibenden Aktionen werden als Befehle an den Server gesendet. Der Server validiert den Befehl, verändert den In-Memory-Zustand atomar und liefert den neuen Zustand oder einen fachlich eindeutigen Fehler zurück.

Für Alpha 1 sind keine WebSockets erforderlich. Aktualisierungen entstehen nur durch Spieleraktionen; eine fortlaufende Wirtschaftssimulation ist ausdrücklich ausgeschlossen.

## 4. Tech Stack

### 4.1 Repository-Struktur

Hanse2Go wird als TypeScript-Monorepo mit pnpm Workspaces organisiert.

Vorgesehene Struktur:

```text
apps/
  client/       Vue-Anwendung
  server/       REST-Server und Spiellogik
packages/
  shared/       gemeinsame API-Typen und fachliche Basistypen
docs/           verbindliche Dokumentation
tests/
  e2e/          Playwright-Abnahmetests
```

Gemeinsame Typen dürfen keine Serverimplementierung enthalten. Fachliche Regeln verbleiben auf dem Server.

### 4.2 Client

- Vue 3
- TypeScript
- Vite
- MapLibre GL JS
- Vue Router für eigenständige Anwendungsseiten, sofern benötigt
- normales, komponentenbezogenes CSS ohne verpflichtendes UI-Framework
- Mobile-First-Layout mit Desktop-Unterstützung
- Vitest für Komponenten- und Logiktests

Der Client ist verantwortlich für:

- Darstellung der Karte und der Inselstädte
- Eingabe der Debug-Position
- Darstellung serverseitig gelieferter Zustände
- Stadt-, Markt- und Warendetailansichten
- Eingabe von Kauf- und Verkaufsmengen
- verständliche Darstellung serverseitiger Validierungsfehler

Der Client ist nicht verantwortlich für:

- verbindliche Distanzprüfung
- verbindliche Preisberechnung
- verbindliche Bestands- oder Geldänderungen
- Autorisierung einer Stadtinteraktion

### 4.3 Server

- Node.js in einer aktuellen LTS-Version
- TypeScript
- Fastify als HTTP- und REST-Framework
- JSON-Schema-basierte Request- und Response-Validierung
- OpenAPI-Dokumentation über Fastify-Plugins
- Vitest für Unit- und Integrationstests
- In-Memory-Repositories für Alpha 1

Fastify wird verwendet, weil es TypeScript gut unterstützt, eine klare Plugin-Struktur bietet und API-Schemas sowohl zur Validierung als auch zur OpenAPI-Dokumentation nutzen kann.

Der Server ist verantwortlich für:

- Initialisierung und Verwaltung des vollständigen Alpha-1-Spielzustands
- Bereitstellung der drei statischen Städte
- Positionsverwaltung der aktiven Flotte
- Distanzberechnung und Freigabe von Stadtinteraktionen
- Warenkatalog, Basispreise und Marktbestände
- dynamische Preisberechnung
- atomare Kauf- und Verkaufstransaktionen
- Geld, Laderaum und Warenbestand der Flotte
- Preis- und Handelsverlauf innerhalb der aktuellen Serverlaufzeit
- Zurücksetzen auf definierte Startbedingungen nach einem Neustart

### 4.4 Persistenz

PostgreSQL ist für spätere Entwicklungsstufen vorgesehen. Alpha 1 verwendet ausdrücklich keine Datenbank. Sämtliche Zustände werden im Arbeitsspeicher gehalten und bei jedem Serverstart neu initialisiert.

Die Spiellogik darf nicht direkt an konkrete In-Memory-Datenstrukturen gekoppelt werden. Repository-Schnittstellen sollen so geschnitten sein, dass sie später durch PostgreSQL-Implementierungen ersetzt werden können.

## 5. Alpha-1-Ziel

Alpha 1 soll den grundlegenden, serverautoritativen Handel zwischen drei vordefinierten Städten spielbar und testbar machen.

Der Testspieler kann:

1. seine Flottenposition im Debug-Modus per Kartenklick setzen,
2. sich in den Interaktionsradius einer Stadt bewegen,
3. die Stadt über einen deutlich sichtbaren Button betreten,
4. statische Informationen zur Stadt ansehen,
5. den Markt öffnen,
6. Warenbestände und dynamische Preise vergleichen,
7. Waren kaufen und verkaufen,
8. Veränderungen an Geld, Laderaum, Flottenbestand und Stadtbestand unmittelbar sehen,
9. eine andere Stadt aufsuchen und dort mit einer anderen Marktlage handeln.

## 6. Alpha-1-Spielzustand

### 6.1 Spieler und Flotte

Alpha 1 verwendet genau einen vordefinierten Testspieler.

- Startkapital: konfigurierbarer statischer Wert
- eine aktive Flotte
- feste maximale Laderaumkapazität: 60 Tonnen
- keine individuellen Schiffe
- keine Flottenverwaltung
- eine Wareneinheit entspricht für Alpha 1 einer Tonne Laderaum

### 6.2 Städte

Es existieren genau drei statisch definierte Städte mit:

- eindeutiger ID
- Name
- Kartenkoordinate
- Interaktionsradius
- statischer Bevölkerung
- statischem Wohlstandswert zwischen 0 und 100
- statischer Beliebtheit des Testspielers
- statischem Kontorstatus
- statischer Produktionsübersicht
- eigenem Warenbestand

Die drei Städte werden so konfiguriert, dass unterschiedliche Über- und Unterversorgungen entstehen und ein nachvollziehbarer Handelskreislauf möglich ist.

### 6.3 Waren

Der Warenkatalog umfasst die bereits fachlich festgelegten Alpha-Waren:

- Getreide
- Mehl
- Brot
- Vieh
- Milch
- Fleisch
- Käse
- Holz
- Bretter
- Lehm
- Ziegel
- Kohle
- Eisen
- Werkzeug
- Baumwolle
- Stoff
- Kleidung
- Keramik
- Möbel
- Zuckerrohr
- Zucker
- Rum

Jede Ware besitzt mindestens:

- eindeutige ID
- Name
- Kategorie
- Basispreis
- Icon-Referenz
- Einheit `Tonne`

### 6.4 Preisberechnung

Jede Stadt führt für jede Ware einen aktuellen Bestand und einen konfigurierten Zielbestand.

Grundmodell:

```text
Preisfaktor = Zielbestand / aktueller Bestand
Marktwert = Basispreis × begrenzter Preisfaktor
```

Der Preisfaktor wird konfigurierbar nach unten und oben begrenzt. Als Startwert wird ein Bereich von `0,4` bis `4,0` vorgesehen.

Die Stadt verwendet einen Spread:

- Stadt kauft vom Spieler zu 95 Prozent des Marktwerts.
- Stadt verkauft an den Spieler zu 105 Prozent des Marktwerts.

Bei größeren Transaktionen verändert sich der Preis schrittweise mit jeder gehandelten Einheit. Der Server berechnet vor Abschluss den durchschnittlichen Gesamtpreis der gewünschten Menge.

Der genaue Algorithmus muss deterministisch sein und durch Unit-Tests abgedeckt werden.

## 7. Client-Oberfläche

### 7.1 Kartenansicht

- MapLibre-Karte als zentrale Spielansicht
- Ozeanartige visuelle Grundgestaltung
- drei einfache Inselobjekte ohne Gebäude oder Detailausbau
- sichtbare aktive Flottenposition
- Debug-Modus: Position per Kartenklick setzen
- Topbar mit aktuellem Geld und Zugriff auf Spieler- beziehungsweise Flottenübersicht

Liegt die Flotte im serverseitig bestätigten Interaktionsradius einer Stadt, erscheint ein prominenter, dezent pulsierender Button `Stadt betreten`.

### 7.2 Stadtansicht

Die Stadt öffnet sich als bildschirmfüllende Ansicht über der Karte. Sie enthält mindestens:

- Übersicht
- Produktion
- Markt

Die Übersicht zeigt statische Bevölkerung, Wohlstand, Beliebtheit und Kontorstatus. Die Produktionsseite zeigt statisch konfigurierte Produktionsschwerpunkte.

### 7.3 Marktübersicht

Waren werden nach Kategorien gruppiert. Jede Warenzeile zeigt:

1. Icon und Name
2. aktuellen Preis mit verständlichem Münzindikator
3. Stadtbestand
4. Bestand in der aktiven Flotte

Preisindikator:

- Bronze: unter dem Basispreis
- Silber: nahe am Basispreis
- Gold: über dem Basispreis
- die Anzahl sichtbarer Münzen verdeutlicht die Stärke der Abweichung

### 7.4 Warendetail und Handel

Die Detailansicht zeigt mindestens:

- Basispreis
- aktuellen Kauf- und Verkaufspreis
- Stadtbestand
- Flottenbestand
- Preisverlauf der aktuellen Serverlaufzeit
- Handelsvolumen der aktuellen Serverlaufzeit
- wählbare Handelsmenge
- erwarteten Gesamtpreis
- verbleibendes Geld oder erwarteten Erlös
- verbleibenden Laderaum

Die Menge kann über einen Slider sowie über fein und grob abgestufte Plus- und Minus-Schaltflächen angepasst werden. Kaufen und Verkaufen werden eindeutig getrennt dargestellt.

Die Ansicht soll auf typischen mobilen Bildschirmgrößen ohne Scrollen bedienbar sein. Dafür müssen Informationsdichte und Diagramme responsiv reduziert werden.

## 8. REST-Ressourcen der Alpha 1

Die genaue URL-Struktur wird im Implementierungs-Issue finalisiert. Fachlich werden mindestens folgende Operationen benötigt:

- aktuellen Spielzustand laden
- Städte und deren Karteninformationen laden
- Debug-Position der Flotte setzen
- serverseitig erreichbare Stadt ermitteln
- Stadtübersicht laden
- Markt einer Stadt laden
- Warendetails und Verlauf laden
- Handelspreis für eine gewünschte Menge vorab berechnen
- Kauf durchführen
- Verkauf durchführen

Schreibende Handelsoperationen müssen atomar sein. Ein fehlgeschlagener Handel darf keinen Teilzustand verändern.

## 9. Fehler- und Sonderfälle

Mindestens folgende Fälle werden serverseitig unterschieden:

- Stadt außerhalb des Interaktionsradius
- ungültige oder unbekannte Stadt
- ungültige oder unbekannte Ware
- ungültige Handelsmenge
- unzureichender Stadtbestand
- unzureichender Flottenbestand
- unzureichendes Geld
- unzureichender Laderaum
- veraltete Preisvorschau zwischen Vorschau und Abschluss

Der Server liefert fachlich eindeutige Fehlercodes. Der Client übersetzt diese in verständliche deutsche Meldungen.

## 10. Teststrategie

### 10.1 Unit-Tests

- Distanzberechnung und Radiusprüfung
- Preisberechnung und Preisbegrenzung
- Durchschnittspreis großer Transaktionen
- Laderaumberechnung
- Kauf- und Verkaufsvalidierung

### 10.2 API-Integrationstests

- Laden des Startzustands
- Setzen der Debug-Position
- Ablehnung einer Stadtinteraktion außerhalb des Radius
- erfolgreiche und abgelehnte Käufe
- erfolgreiche und abgelehnte Verkäufe
- atomare Zustandsänderungen

### 10.3 Playwright-Abnahme

Ein abschließendes Abnahme-Issue prüft den vollständigen Nutzerfluss automatisiert:

1. Anwendung öffnen.
2. Debug-Position in die Nähe der ersten Stadt setzen.
3. Stadt betreten.
4. Ware kaufen.
5. Geld, Stadtbestand, Flottenbestand und Laderaum prüfen.
6. Position zur zweiten Stadt setzen.
7. Ware verkaufen.
8. veränderten Preis und erzielten Erlös prüfen.
9. einen ungültigen Handel auslösen und die korrekte Fehlermeldung prüfen.
10. den Ablauf in einer mobilen und einer Desktop-Viewport-Konfiguration ausführen.

## 11. Ausdrückliche Nicht-Ziele von Alpha 1

- Registrierung, Anmeldung und mehrere echte Spielerkonten
- PostgreSQL oder andere persistente Speicherung
- reale GPS-Ortung
- Anti-Cheat- und Plausibilitätsprüfung von Bewegungen
- OpenStreetMap-Import
- dynamische Erzeugung von Städten
- Produktionszyklen und Gebäudeproduktion
- Bevölkerungsverbrauch und Wohlstandsberechnung
- Gebäude, Wohnraum, Kontore und Bauplätze
- individuelle Schiffe und Flottenverwaltung
- automatische Handelsrouten
- Stadtgründung
- Piraterie und Kämpfe
- prozedurale Stadtgrafik
- Spielerhandel und Buy- oder Sell-Orders

## 12. Spätere Erweiterbarkeit

Die Alpha-1-Architektur muss folgende spätere Erweiterungen ermöglichen, ohne sie vorweg zu implementieren:

- GPS statt Debug-Position
- PostgreSQL statt In-Memory-Repositories
- mehrere Spieler und eine gemeinsame persistente Welt
- serverseitige Bewegungsvalidierung und Anti-Cheat
- laufende Produktions- und Verbrauchssimulation
- individuelle Schiffe und mehrere Flotten
- dynamisch importierte und von Spielern gegründete Städte
