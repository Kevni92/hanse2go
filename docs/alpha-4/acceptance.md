# Alpha 4 – Test- und Abnahmevertrag

Konfigurationstests prüfen die vier eindeutigen Typen, Kapazitäten 60/100/250/400, Geschwindigkeiten 12/10/8/7, Bauzeiten 6/12/24/36, Preise 20.000/32.000/60.000/95.000, Ankauf exakt 60 %, Materialien und gültige Startschiffe. Doppelte IDs, unbekannte Waren, nichtpositive Werte, falsche Ankaufpreise, ungültige Standorte, leere Startflotten und Doppelzuordnung verhindern den Serverstart.

Identitätstests kaufen `ship-market-lambrecht-01`, benennen Waldwind zu Hansewind, bilden `Handelsflotte`, verkaufen und kaufen erneut. Schiffszahl, `shipId`, Name und Herkunft bleiben durchgehend erhalten; nur Eigentum und Versionen ändern sich. Zwei parallele Käufe lassen genau einen Erfolg, eine Buchung und einen Eigentümer zu; Wiederholung derselben Idempotenz bucht nicht erneut.

Der Pinassenauftrag `Neue Hoffnung` aus `alpha4-harbor-ready` zieht 5.000 Gold sowie 40,00 Holz, 20,00 Bretter, 10,00 Stoff und 5,00 Werkzeug ab, erzeugt vor Tick 6 kein Schiff und danach exakt eines mit `shipyard_build`, Auftrag-ID und unzugeordnetem Standort in Lambrecht. Eine anschließende Schnigge prüft FIFO: nach Abschluss der Pinasse wird sie aktiv, verliert aber erst im Folgetick Bauzeit. Fehlendes Kontor, Gold, Material, Typ, Name, Reichweite oder abweichende Idempotenz lassen alles unverändert.

Formeltests prüfen Pinasse/Schnigge = 160,00 t und 10 km/h, Pinasse/Flöte = 310,00 t und 8 km/h sowie alle vier Typen = 810,00 t und 7 km/h. Sie prüfen Flottenbildung, Zuweisung, Entnahme, Schutz des letzten Schiffs, Auflösung nur leerer inaktiver Flotten, lokalen Aktivwechsel und erhaltene Ladung. Bei 160,00 t/80,00 t Ladung darf Pinasse entfernt werden, Schnigge nicht (`FLEET_CAPACITY_BELOW_CARGO`).

Transfers decken Kontor ↔ aktive/inaktive lokale Flotte und zwischen lokalen inaktiven Flotten ab. Quelle sinkt, Ziel steigt, Gesamtmenge bleibt erhalten, Kapazität und Idempotenz gelten und unterschiedliche Häfen/fremde Inventare werden abgelehnt. Ein künstlicher Werftfehler rollt den gesamten Tick einschließlich Alpha-3-Änderungen zurück.

Der echte Vue/Fastify-Happy-Path lädt `alpha4-harbor-ready`, öffnet den Hafen, kauft Waldwind, benennt ihn um, bildet und aktiviert Handelsflotte, überträgt 20,00 t Holz, wechselt zurück, beauftragt Neue Hoffnung, löst sechs Ticks aus und prüft Auftrag, Schiff, Tickbericht und Reload. Er läuft in Desktop Chromium und kleinem Mobile-Chromium ohne horizontales Scrollen, Hover-Abhängigkeit oder unzugängliche Dialoge. CI speichert bei Fehlern Trace, Screenshot, Browserkonsole, Serverlog, Preset/Seed, Hafen-/Flotten-/Werft-/Schiffszustand, Tickbericht und Schiffs-IDs vor/nach dem Fehler.

Die Playwright-Abnahme enthält den serverbestätigten Hafen-Workflow auf Desktop und Mobile: Lambrecht öffnen, Hafen wählen, die konkrete Startpinasse und Waldwind lesen, Waldwind kaufen und die unveränderte Schiff-ID mit neuem Eigentümer im Weltzustand prüfen.
