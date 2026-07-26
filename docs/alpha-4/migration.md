# Alpha 4 – Migration der Startflotte

Die abstrakte Alpha-3-Startflotte wird ohne spielbare Kapazitäts- oder Ladungsänderung migriert:

- `fleetId = fleet-alpha`, `customName = Möwe-Flotte`, `ownerId = player-alpha`, `status = active`;
- bisherige Position und Ladung werden unverändert übernommen;
- `ship-player-alpha-01` ist die Pinasse `Möwe` des Spielers, mit `originType = world_seed`, `originCityId = lambrecht`, `createdAtTick = 0` und Zuordnung zu `fleet-alpha`;
- die abgeleitete Kapazität ist exakt 60,00 Tonnen, die Geschwindigkeit 12 km pro Spielstunde.
- der vollständige bisherige Warenbestand wird verlustfrei als `cargoByGood` von `fleet-alpha` übernommen; 10 Tonnen entsprechen 1.000 internen Hundertstel-Tonnen.

Damit existiert keine Sonderflotte ohne konkrete Schiffe. Spätere Status wie `traveling` und KI-Flotten nutzen dasselbe Modell und dieselben Formeln.
