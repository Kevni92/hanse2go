# Alpha 3 – Fachliche Schnittstellen

Die vorhandene Tickroute wird erweitert. Sie verlangt eine Idempotenz-ID und verwendet die Fehler `TICK_ALREADY_RUNNING`, `TICK_IDEMPOTENCY_REQUIRED`, `TICK_STATE_CONFLICT` und `TICK_ATOMIC_COMMIT_FAILED`.

Zusätzlich stellt die API Stadt-Demografie, Stadt-Arbeiterübersicht, erweiterte eigene Gebäudedaten mit Arbeiter- und Lohnstatus, das Setzen eigener Gebäudeprioritäten und den letzten Tickbericht bereit. Prioritätsbefehle verwenden `BUILDING_NOT_FOUND`, `BUILDING_NOT_OWNED`, `BUILDING_HAS_NO_WORKFORCE` und `INVALID_WORKFORCE_PRIORITY`.

Alle Verträge verwenden stabile englische IDs. Der Client berechnet keine autoritativen Tickwerte und zeigt nur serverbestätigte Daten.
