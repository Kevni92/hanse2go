# Alpha 4 – Testwelt

Der Testreset baut auf dem abgeschlossenen Alpha-3-Zustand auf. Für den Schiffsmarkt erzeugt die Weltinitialisierung exakt diese neutralen Startschiffe. Alle sind echte `world_seed`-Entitäten mit `createdAtTick = 0`, dem Systemmakler als Eigentümer und einem unzugeordneten Standort im genannten Hafen.

| Hafen | Schiff-ID | Name | Typ |
|---|---|---|---|
| Lambrecht | `ship-market-lambrecht-01` | Waldwind | Schnigge |
| Neustadt | `ship-market-neustadt-01` | Rebenläufer | Pinasse |
| Neustadt | `ship-market-neustadt-02` | Haardtstern | Flöte |
| Mannheim | `ship-market-mannheim-01` | Rheingold | Flöte |
| Mannheim | `ship-market-mannheim-02` | Kurpfalz | Kraweel |

Ein Reset stellt dieselben IDs, Namen, Eigentümer und Hafenstandorte wieder her. Jeder Hafen startet mit `shipMarketVersion = 1`.
