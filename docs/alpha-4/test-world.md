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

`alpha4-baseline` enthält zusätzlich `fleet-alpha` mit der aktiven Pinasse `ship-player-alpha-01`/`Möwe`, 60,00 t, 12 km je Spielstunde und der bestehenden Position/Ladung. Alle Werften haben einen freien Platz, leere Warteschlange und `shipyardVersion = 1`; weitere Schiffe, Flotten und Aufträge existieren nicht.

`alpha4-harbor-ready` setzt die aktive Flotte nach Lambrecht, leert ihre Ladung, gibt `player-alpha` 200.000 Gold, ein Kontor in Lambrecht sowie mindestens 250,00 Holz, 150,00 Bretter, 60,00 Stoff, 40,00 Werkzeug und 20,00 Eisen. Das neutrale Angebot bleibt unverändert.
