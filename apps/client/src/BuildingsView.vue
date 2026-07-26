<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { BuildingOffer, City, CityBuildingsOverview, Good, TickReport, TransferDirection, WorkforcePriority } from '@hanse2go/shared';
import { ApiRequestError, buildBuilding, buyConcession, fetchBuildings, setBuildingPriority, simulateNextHour, transferKontorGoods } from './api.js';
import { buildingClassName, buildingName, cityName, goodName, reputationStatusName } from './i18n.js';

const props = defineProps<{ city: City; goods: Good[] }>();
const emit = defineEmits<{ changed: [] }>();

const overview = ref<CityBuildingsOverview>();
const report = ref<TickReport>();
const quantities = ref<Record<string, number>>({});
const loading = ref(false);
const busy = ref(false);
const ticking = ref(false);
const error = ref('');

const formatGold = (value: number) => value.toLocaleString('de-DE');
const amounts = (entries: Record<string, number>) => Object.entries(entries).map(([goodId, amount]) => `${amount} t ${goodName(goodId)}`).join(', ');

const missingReputation = computed(() => Math.max(0, 80 - (overview.value?.reputation.value ?? 0)));
const fleetCargo = computed(() => overview.value?.fleet.cargo ?? {});
const freeCapacity = computed(() => (overview.value?.fleet.capacity ?? 0) - Object.values(fleetCargo.value).reduce((total, amount) => total + amount, 0));
const canBuyConcession = computed(() => Boolean(overview.value) && missingReputation.value === 0 && (overview.value?.player.gold ?? 0) >= (overview.value?.concessionPrice ?? 0));
const catalogGroups = computed(() => [
  { key: 'raw', title: 'Rohstoffbetriebe', entries: overview.value?.catalog.filter((entry) => entry.kind === 'raw' && entry.workforceClass) ?? [] },
  { key: 'processing', title: 'Verarbeitung', entries: overview.value?.catalog.filter((entry) => entry.kind === 'processing') ?? [] },
  { key: 'housing', title: 'Wohnen', entries: overview.value?.catalog.filter((entry) => entry.buildingType === 'town_house') ?? [] },
].filter((group) => group.entries.length));
const transferGoods = computed(() => props.goods.filter((good) => (fleetCargo.value[good.id] ?? 0) > 0 || (overview.value?.kontorInventory[good.id] ?? 0) > 0));
const cityConsumption = computed(() => report.value?.consumption.filter((entry) => entry.cityId === props.city.id) ?? []);

const statusLabels: Record<string, string> = { built: 'gebaut', production_ready: 'produzierte vollständig', stalled: 'stillstehend' };
const requirementLabels: Record<string, string> = { concession: 'Baukonzession fehlt', kontor: 'eigenes Kontor fehlt', kontor_already_exists: 'Kontor bereits vorhanden', gold: 'Gold fehlt', materials: 'Baumaterialien fehlen' };

function apiMessage(cause: unknown) {
  if (cause instanceof ApiRequestError) return cause.message;
  return 'Der Server ist derzeit nicht erreichbar. Bitte versuche es erneut.';
}

function apply(next: CityBuildingsOverview) {
  overview.value = next;
  emit('changed');
}

async function load() {
  loading.value = true;
  try { overview.value = await fetchBuildings(props.city.id); error.value = ''; }
  catch (cause) { error.value = apiMessage(cause); }
  finally { loading.value = false; }
}

async function run(operation: () => Promise<CityBuildingsOverview>) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try { apply(await operation()); }
  catch (cause) {
    // Die Serverablehnung bleibt sichtbar, während der bestätigte Zustand neu geladen wird.
    const message = apiMessage(cause);
    await load();
    error.value = message;
  }
  finally { busy.value = false; }
}

const purchaseConcession = () => run(() => buyConcession(props.city.id));
const build = (buildingType: string) => run(() => buildBuilding(props.city.id, buildingType));
const changePriority = (buildingId: string, priority: WorkforcePriority) => run(() => setBuildingPriority(props.city.id, buildingId, priority));

function quantityFor(goodId: string) { return quantities.value[goodId] ?? 1; }
function setQuantity(goodId: string, value: number) { quantities.value = { ...quantities.value, [goodId]: Math.max(1, Math.floor(value) || 1) }; }
function maximumFor(goodId: string, direction: TransferDirection) {
  return direction === 'store' ? fleetCargo.value[goodId] ?? 0 : Math.min(overview.value?.kontorInventory[goodId] ?? 0, freeCapacity.value);
}
const transfer = (goodId: string, direction: TransferDirection) => run(() => transferKontorGoods(props.city.id, goodId, quantityFor(goodId), direction));

async function nextHour() {
  if (ticking.value) return;
  ticking.value = true;
  error.value = '';
  try {
    report.value = await simulateNextHour();
    overview.value = await fetchBuildings(props.city.id);
    emit('changed');
  } catch (cause) { error.value = apiMessage(cause); }
  finally { ticking.value = false; }
}

watch(() => props.city.id, load);
onMounted(load);
</script>

<template>
  <div class="buildings" data-testid="buildings-tab" aria-live="polite">
    <p v-if="loading && !overview" class="status">Gebäudedaten werden geladen …</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template v-if="overview">
      <section class="panel" aria-label="Örtlicher Ruf">
        <h4>Örtlicher Ruf</h4>
        <dl>
          <div><dt>Ruf</dt><dd>{{ overview.reputation.value }} / 100</dd></div>
          <div><dt>Status</dt><dd>{{ reputationStatusName(overview.reputation.status) }}</dd></div>
          <div v-if="!overview.hasConcession"><dt>Fehlender Ruf</dt><dd>{{ missingReputation }}</dd></div>
          <div><dt>Baukonzession</dt><dd>{{ overview.hasConcession ? 'vorhanden' : `${formatGold(overview.concessionPrice)} Gold` }}</dd></div>
        </dl>
        <button v-if="!overview.hasConcession" data-testid="concession-button" type="button" :disabled="!canBuyConcession || busy" @click="purchaseConcession">Baukonzession kaufen</button>
      </section>

      <section v-if="overview.hasConcession && !overview.hasKontor" class="panel" aria-label="Kontor bauen">
        <h4>Kontor</h4>
        <p>Das Kontor ist das erste Gebäude dieser Stadt.</p>
        <dl>
          <div><dt>Grundstück</dt><dd>{{ formatGold(overview.kontor.cost.landGold) }} Gold</dd></div>
          <div><dt>Baukosten</dt><dd>{{ formatGold(overview.kontor.cost.buildGold) }} Gold</dd></div>
          <div><dt>Gesamt</dt><dd>{{ formatGold(overview.kontor.cost.totalGold) }} Gold</dd></div>
        </dl>
        <ul class="materials">
          <li v-for="(amount, goodId) in overview.kontor.cost.materials" :key="goodId" :class="{ missing: overview.kontor.missingMaterials[goodId] }">
            {{ goodName(goodId) }}: {{ fleetCargo[goodId] ?? 0 }} / {{ amount }} t<span v-if="overview.kontor.missingMaterials[goodId]"> · es fehlen {{ overview.kontor.missingMaterials[goodId] }} t</span>
          </li>
        </ul>
        <button data-testid="kontor-build-button" type="button" :disabled="overview.kontor.availability !== 'buildable' || busy" @click="build('kontor')">Kontor bauen</button>
      </section>

      <template v-if="overview.hasKontor">
        <section class="panel" aria-label="Kontorlager">
          <h4>Kontorlager</h4>
          <p v-if="!Object.keys(overview.kontorInventory).length">Das Kontorlager ist leer.</p>
          <ul v-else class="inventory"><li v-for="(amount, goodId) in overview.kontorInventory" :key="goodId">{{ goodName(goodId) }}: {{ amount }} t</li></ul>
          <p class="hint">Freier Laderaum: {{ freeCapacity }} t</p>
          <p v-if="!transferGoods.length" class="hint">Es sind keine Waren in Flotte oder Kontor vorhanden.</p>
          <div v-for="good in transferGoods" :key="good.id" class="transfer" :data-testid="`kontor-transfer-${good.id}`">
            <strong>{{ goodName(good.id) }}</strong>
            <span><small>Flotte</small>{{ fleetCargo[good.id] ?? 0 }} t</span>
            <span><small>Kontor</small>{{ overview.kontorInventory[good.id] ?? 0 }} t</span>
            <label :for="`transfer-${good.id}`" class="visually-hidden">Menge {{ goodName(good.id) }}</label>
            <input :id="`transfer-${good.id}`" type="number" min="1" step="1" :value="quantityFor(good.id)" @input="setQuantity(good.id, Number(($event.target as HTMLInputElement).value))">
            <span class="transfer-actions">
              <button type="button" :aria-label="`Höchstmenge ${goodName(good.id)} einlagern`" :disabled="maximumFor(good.id, 'store') < 1 || busy" @click="setQuantity(good.id, maximumFor(good.id, 'store'))">Max</button>
              <button type="button" :disabled="busy" @click="transfer(good.id, 'store')">Einlagern</button>
              <button type="button" :aria-label="`Höchstmenge ${goodName(good.id)} auslagern`" :disabled="maximumFor(good.id, 'retrieve') < 1 || busy" @click="setQuantity(good.id, maximumFor(good.id, 'retrieve'))">Max</button>
              <button type="button" :disabled="busy" @click="transfer(good.id, 'retrieve')">Auslagern</button>
            </span>
          </div>
        </section>

        <section class="panel" aria-label="Eigene Gebäude">
          <h4>Eigene Gebäude</h4>
          <ul class="own-buildings">
            <li v-for="building in overview.buildings" :key="building.id">
              <strong>{{ buildingName(building.buildingType) }}</strong>
              <span>{{ statusLabels[building.status] }}</span>
              <small v-if="building.reason === 'missing_inputs'">Grund: fehlende Eingangswaren</small>
              <small v-if="building.workforceClass">{{ building.assignedWorkers ?? 0 }} Arbeiter · {{ building.lastWageCost ?? 0 }} Gold Lohn</small>
              <label v-if="building.workforceClass">Priorität <select :data-testid="`building-priority-${building.id}`" :value="building.workforcePriority" :disabled="busy" @change="changePriority(building.id, ($event.target as HTMLSelectElement).value as WorkforcePriority)"><option value="very_high">Sehr hoch</option><option value="high">Hoch</option><option value="normal">Normal</option><option value="low">Niedrig</option><option value="very_low">Sehr niedrig</option></select></label>
              <small v-else-if="Object.keys(building.lastOutputs).length">Letzter Tick: {{ amounts(building.lastInputs) || 'kein Verbrauch' }} → {{ amounts(building.lastOutputs) }}</small>
            </li>
          </ul>
        </section>

        <section v-for="group in catalogGroups" :key="group.key" class="panel" :aria-label="group.title">
          <h4>{{ group.title }}</h4>
          <article v-for="entry in group.entries" :key="entry.buildingType" class="building-card" :data-testid="`building-card-${entry.buildingType}`">
            <header><strong>{{ buildingName(entry.buildingType) }}</strong><span>{{ buildingClassName(entry.buildingClass) }}</span></header>
            <p>{{ formatGold(entry.cost.landGold) }} Gold Grundstück + {{ formatGold(entry.cost.buildGold) }} Gold Bau = {{ formatGold(entry.cost.totalGold) }} Gold</p>
            <p>Material: {{ amounts(entry.cost.materials) }}</p>
            <p>Je Stunde: {{ Object.keys(entry.inputs).length ? amounts(entry.inputs) : 'kein Eingang' }} → {{ amounts(entry.outputs) }}</p>
            <p v-if="entry.buildingType === 'town_house'">+100 Wohnraum · keine Arbeiter · keine Lohnkosten</p>
            <p v-if="entry.availability === 'requirements_missing'" class="missing">{{ (entry.missingRequirements as BuildingOffer['missingRequirements']).map((requirement) => requirementLabels[requirement]).join(' · ') }}<span v-if="entry.missingGold"> ({{ formatGold(entry.missingGold) }} Gold, {{ amounts(entry.missingMaterials) || 'kein Material' }})</span><span v-else-if="Object.keys(entry.missingMaterials).length"> ({{ amounts(entry.missingMaterials) }})</span></p>
            <button type="button" :disabled="entry.availability !== 'buildable' || busy" @click="build(entry.buildingType)">{{ buildingName(entry.buildingType) }} bauen</button>
          </article>
        </section>
      </template>

      <section class="panel debug" aria-label="Debugbereich">
        <h4>Debugbereich</h4>
        <dl>
          <div><dt>Tick</dt><dd>{{ overview.world.tickNumber }}</dd></div>
          <div><dt>Simulierte Stunde</dt><dd>{{ overview.world.simulatedHour }}</dd></div>
        </dl>
        <button data-testid="next-hour-button" type="button" :disabled="ticking" @click="nextHour">{{ ticking ? 'Stadtwirtschaft wird berechnet …' : 'Nächste Stunde simulieren' }}</button>
        <div v-if="report" data-testid="tick-report" class="tick-report">
          <h5>Bericht der Stunde {{ report.simulatedHour }}</h5>
          <p v-if="!report.production.length">Keine Produktionsgebäude in dieser Welt.</p>
          <ul v-else>
            <li v-for="entry in report.production" :key="entry.buildingId">
              {{ entry.buildingId }}: {{ statusLabels[entry.status] }}<span v-if="entry.reason === 'missing_inputs'"> · fehlende Eingangswaren</span><span v-else> · {{ amounts(entry.inputs) || 'kein Verbrauch' }} → {{ amounts(entry.outputs) }}</span>
            </li>
          </ul>
          <h5>Verbrauch in {{ cityName(city.id) }}</h5>
          <ul>
            <li v-for="entry in cityConsumption" :key="entry.goodId">
              {{ goodName(entry.goodId) }}: {{ entry.consumed }} / {{ entry.requested }} t · Fehlmenge {{ entry.requested - entry.consumed }} t · Bestand {{ entry.remainingStock }} t
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.buildings { display: grid; gap: 1rem; }
.panel { display: grid; gap: .6rem; padding: .8rem; border-radius: .5rem; background: #fff7e5; }
.panel h4,.panel h5 { margin: 0; }
.panel p { margin: 0; }
dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .4rem; margin: 0; }
dl div { padding: .45rem; border-radius: .4rem; background: #f3dfc0; }
dt { font-size: .75rem; } dd { margin: .1rem 0 0; font-weight: 700; }
button { min-height: 2.75rem; padding: .55rem .7rem; border: 0; border-radius: .4rem; background: #b96b45; color: #fff; font: inherit; }
button:disabled { opacity: .5; }
ul { display: grid; gap: .3rem; margin: 0; padding-left: 1.1rem; }
.materials .missing,.missing { color: #8a2517; }
.transfer { display: grid; grid-template-columns: 1fr auto auto; gap: .4rem; align-items: center; padding: .55rem; border-radius: .4rem; background: #f3dfc0; }
.transfer small { display: block; font-size: .7rem; }
.transfer input { grid-column: 1 / -1; min-height: 2.75rem; padding: .4rem; border: 1px solid #d6b98e; border-radius: .4rem; font: inherit; }
.transfer-actions { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, 1fr); gap: .3rem; }
.transfer-actions button { background: #e9d4b2; color: inherit; }
.own-buildings { padding: 0; list-style: none; }
.own-buildings li { display: grid; padding: .5rem; border-radius: .4rem; background: #f3dfc0; }
.building-card { display: grid; gap: .35rem; padding: .6rem; border: 1px solid #d6b98e; border-radius: .4rem; }
.building-card header { display: flex; justify-content: space-between; gap: .5rem; }
.building-card p { font-size: .85rem; }
.debug .tick-report { display: grid; gap: .4rem; padding: .6rem; border-radius: .4rem; background: #f3dfc0; font-size: .85rem; }
.hint { font-size: .8rem; }
.status,.error { padding: .6rem; border-radius: .4rem; }
.status { background: #f3dfc0; } .error { background: #ffe0db; color: #8a2517; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (min-width: 700px) {
  dl { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .transfer { grid-template-columns: 1.4fr auto auto 6rem 2fr; }
  .transfer input,.transfer-actions { grid-column: auto; }
}
</style>
