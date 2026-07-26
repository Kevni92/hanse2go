# Alpha 5: Order-Vertragsgrundsätze

Alle schreibenden Orderbefehle enthalten einen Idempotenzschlüssel. Stornierung und Ersetzung enthalten zusätzlich die erwartete `orderVersion`. Erfolgreiche Antworten liefern nur serverbestätigte Order-, Reservierungs-, Kontor- und Kontozustände sowie bereits ausgeführte Teilfüllungen.

Die Routen, Antwort-Datenträger, Orderbuchversionen und Tickintegration werden durch das API-Konzept ergänzt. Seine Regeln bauen auf den verbindlichen Orderfeldern, Fehlercodes und Zustandsübergängen aus [`orders.md`](orders.md) auf.
