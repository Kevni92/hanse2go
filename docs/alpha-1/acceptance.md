# Alpha 1 – Abnahme und Tests

## Ziel

Die Alpha gilt nur dann als abgeschlossen, wenn der vollständige Kernablauf mit realem Vue-Client und realem Fastify-Server automatisiert nachgewiesen ist. Vollständige API-Mocks dürfen den End-to-End-Test nicht ersetzen.

## Testebenen

### Unit-Tests

Mindestens:

- Distanzberechnung zwischen Position und Stadt
- Verhalten innerhalb, außerhalb und exakt auf dem Radius
- Preisfaktor und Begrenzung auf 0,4 bis 4,0
- Kauf- und Verkaufsspread
- Rundung auf ganze Goldmünzen
- mengenabhängige Einheitspreise
- Laderaumberechnung
- Validierung aller Handelsgrenzen
- deterministische Startkonfiguration

### API-Integrationstests

Mindestens:

- Health-Endpunkt
- Laden des Spielstartzustands
- Laden aller 22 Waren und drei Städte
- Setzen einer gültigen Debug-Position
- Ablehnung ungültiger Koordinaten
- Stadtzugriff innerhalb und außerhalb des Radius
- Preisvorschau für Kauf und Verkauf
- erfolgreicher Kauf und Verkauf
- Ablehnung bei fehlendem Gold, Bestand, Ladung oder Reichweite
- veraltetes Angebot
- atomarer Zustand bei Fehlern
- idempotenter Umgang mit doppelt gesendeten Transaktionen
- Reset des Testzustands

### Komponenten-Tests

Mindestens:

- Kartenstatus vor und nach Serverbestätigung
- Sichtbarkeit des Eintrittsbuttons
- Fullscreen-Stadtansicht und Tabs
- Marktgruppierung aller Waren
- Münzindikator an den definierten Grenzen
- Mengensteuerung und `Max`
- HUD-Aktualisierung nach Handel
- verständliche Fehlerzustände

## Playwright-Happy-Path

Jeder Test beginnt mit dem Zustand aus [`test-world.md`](test-world.md).

1. Client und Server starten.
2. Anwendung öffnen.
3. 30.000 Gold, 60 Tonnen Kapazität und leere Flotte prüfen.
4. Prüfen, dass außerhalb aller Radien kein Eintrittsbutton sichtbar ist.
5. Per Debug-Klick eine serverseitig bestätigte Position in Lambrecht setzen.
6. `Stadt betreten` prüfen und Lambrecht öffnen.
7. Bevölkerung, Wohlstand, Beliebtheit und Kontorstatus prüfen.
8. Produktionsschwerpunkte öffnen und Holz als Schwerpunkt erkennen.
9. Markt öffnen und alle sechs Kategorien sowie 22 Waren prüfen.
10. Holz öffnen.
11. Eine serverseitige Kaufvorschau für zehn Tonnen laden.
12. Gesamtpreis, Restgold und verbleibenden Laderaum prüfen.
13. Kauf abschließen.
14. Prüfen: Gold gesunken, Lambrechter Holzbestand gesunken, Flottenbestand zehn, freier Laderaum 50.
15. Stadt schließen.
16. Per Debug-Klick nach Neustadt wechseln.
17. Neustadt betreten und Holz öffnen.
18. Verkaufsvorschau für zehn Tonnen laden.
19. Verkauf abschließen.
20. Prüfen: Flottenbestand Holz null, freier Laderaum 60, Neustädter Bestand gestiegen.
21. Prüfen, dass der Verkaufserlös größer als der vorherige Kaufpreis war und das Endgold über 30.000 liegt.
22. Preis- und Handelsverlauf in beiden Städten prüfen.

## Negative End-to-End-Szenarien

Mindestens ein Szenario aus jeder Gruppe:

### Reichweite

- Stadtansicht öffnen, Position anschließend außerhalb setzen und Handel versuchen.
- Server lehnt ab; Client zeigt eine verständliche Meldung und verändert keinen Bestand.

### Handelsgrenzen

- mehr als 60 Tonnen kaufen,
- Kauf ohne ausreichendes Gold,
- mehr verkaufen als in der Flotte vorhanden,
- mehr kaufen als die Stadt besitzt.

### Veraltetes Angebot

- Angebot laden,
- Marktzustand verändern,
- altes Angebot abschließen.
- Server lehnt ab und der Client lädt ein neues Angebot.

## Viewports und Bedienbarkeit

Der Happy-Path läuft mindestens in:

- einem mobilen Chromium-Profil, ungefähr 390 × 844,
- einem Desktop-Chromium-Profil, mindestens 1280 × 720.

Zentrale Aktionen werden über Rollen, zugängliche Namen oder stabile fachliche Test-IDs selektiert. Fragile Selektoren anhand interner CSS-Strukturen sind zu vermeiden.

## Diagnose

Bei Fehlern werden gespeichert:

- Playwright Trace,
- Screenshot,
- Browserkonsole,
- relevante Serverlogs.

## CI

Ein zentraler Repository-Befehl führt aus:

- Installation beziehungsweise Lockfile-Prüfung,
- Linting,
- Typecheck,
- Unit- und Integrationstests,
- Client- und Server-Build,
- Playwright-Abnahme.

Der Pull Request darf erst gemergt werden, wenn alle GitHub-CI-Prüfungen erfolgreich sind. Nach dem Merge wird der Issue-Branch gelöscht.

## Abnahmekriterium

Die Alpha ist fachlich abgenommen, wenn der beschriebene Handelsweg reproduzierbar auf Mobil und Desktop funktioniert, alle Zustandsänderungen serverseitig autorisiert sind, alle Tests grün sind und die Dokumentation dem implementierten Verhalten entspricht.