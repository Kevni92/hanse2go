# Alpha 2 – Gebäudeoberfläche

Die Stadtansicht erhält den Tab `Gebäude`. Alle Daten und Aktionen stammen vom Server; während einer Anfrage bleiben bestätigte Werte sichtbar.

Alpha 4 ergänzt neben Markt und Gebäuden den Tab `Hafen`. Auch dort bleiben während Anfragen ausschließlich serverbestätigte Werte sichtbar; Details stehen in [`../alpha-4/user-interface.md`](../alpha-4/user-interface.md).

## Zustände

Ohne Konzession zeigt der Tab Rufwert, Status, fehlenden Ruf, Preis 10.000 Gold und einen nur bei 80 Ruf sowie ausreichendem Gold aktivierten Button `Baukonzession kaufen`. Ohne Kontor zeigt er ausschließlich dessen Kosten, vorhandene/fehlende Materialien und `Kontor bauen`. Mit Kontor zeigt er Lager, eigene Gebäude mit letztem Status sowie den nach Kategorie gruppierten Gebäudekatalog mit Kosten, Inputs, Outputs und Bauvoraussetzungen.

Transfers besitzen Ware, Mengensteuerung, `Max`, `Einlagern` und `Auslagern`; Fehlermeldungen kommen vom Server. Der Debugbereich zeigt Ticknummer, simulierte Stunde, `Nächste Stunde simulieren` und den letzten Produktions-/Verbrauchsbericht. Der Tickbutton ist bis zur Antwort gesperrt.

Mobile nutzt eine einspaltige Liste; Desktop trennt Lager, eigene Gebäude und Katalog in Bereiche. Stabile Selektoren sind `buildings-tab`, `concession-button`, `kontor-build-button`, `building-card-<id>`, `kontor-transfer-<goodId>`, `next-hour-button` und `tick-report`. Die Alpha-3-Erweiterung ergänzt diese Ansicht, ersetzt sie aber nicht; ihre zusätzlichen Kennzahlen, Karten und Bedienregeln stehen in [`../alpha-3/user-interface.md`](../alpha-3/user-interface.md).
