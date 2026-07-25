# Alpha 2 – Stundentick

Ein Alpha-2-Tick entspricht einer simulierten Spielstunde. Seine vollständige Ausführungs-, Parallelitäts- und Debug-Regel wird in diesem Dokument mit dem Tickkonzept ergänzt. Der Bevölkerungsverbrauch ist bereits verbindlich: In der Verbrauchsphase wird für jede Stadt und jede in [`population-consumption.md`](population-consumption.md) genannte Ware `min(Sollverbrauch, Marktbestand)` abgebucht und als `{ cityId, goodId, requested, consumed, remainingStock }` berichtet. Er ändert keine Geldwerte und darf keinen negativen Marktbestand erzeugen.
