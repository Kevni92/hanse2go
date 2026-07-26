# Alpha 4 – Werftphase im Stundentick

Alpha 4 erweitert den atomaren Alpha-3-Stundentick um eine Werftphase nach Wirtschaft und Bevölkerung. Der Tick arbeitet weiterhin auf einem vollständigen Weltsnapshot: Ein unerwarteter Fehler, auch während der Werftphase, verwirft alle Alpha-3- und Alpha-4-Änderungen gemeinsam.

Die Werftphase verarbeitet Städte nach `cityId`, bestimmt je Werft den zu Tickbeginn aktiven Auftrag und reduziert dessen `remainingBuildTicks` genau einmal. Ein bei null fertiggestellter Auftrag erzeugt genau ein Schiff, wird abgeschlossen und kann den nächsten wartenden Auftrag noch im selben Tick aktivieren. Der neue aktive Auftrag macht erst im Folgetick Fortschritt.

Der Tickbericht ergänzt pro Werft abgeschlossene und aktivierte Aufträge mit IDs, Restzeit, neuem `resultShipId` und allen neuen Schiffen. Tick-Idempotenz verhindert jeden Doppelabschluss.

Jeder Werftbericht enthält `cityId`, Werftversion vor/nach dem Tick, aktiven Auftrag vor/nachher, Restzeit vor/nachher, abgeschlossene und neu aktivierte Auftrags-ID, erzeugte Schiff-ID sowie Warteschlangenlänge. Die Zusammenfassung enthält fortgeschriebene Aufträge, fertiggestellte Schiffe und die Schiffszahl vor/nach dem Tick. Hafenbefehle und Tick serialisieren vollständig: Eine Aktion wird vor oder nach dem Tick verarbeitet, nie in einem Zwischenzustand.
