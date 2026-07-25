<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { City, Fleet, Good, GoodCategory, MarketHistoryEntry, MarketQuote, Player, TradeDirection } from '@hanse2go/shared';
import { ApiRequestError, fetchMarketHistory, fetchQuote, submitTrade } from './api.js';

const props = defineProps<{ city: City; goods: Good[]; fleet: Fleet; player: Player }>();
const emit = defineEmits<{ traded: [] }>();

const categoryOrder: GoodCategory[] = ['Nahrung', 'Baustoffe', 'Handwerk', 'Kleidung', 'Haushaltswaren', 'Luxuswaren'];
const icons: Record<GoodCategory, string> = { Nahrung: '🍞', Baustoffe: '🪵', Handwerk: '🔨', Kleidung: '🧵', Haushaltswaren: '🏺', Luxuswaren: '🥃' };
const selected = ref<Good>();
const direction = ref<TradeDirection>('buy');
const quantity = ref(1);
const maximum = ref(0);
const quotes = ref<Record<string, MarketQuote>>({});
const activeQuote = ref<MarketQuote>();
const buyQuote = ref<MarketQuote>();
const sellQuote = ref<MarketQuote>();
const history = ref<MarketHistoryEntry[]>([]);
const overviewLoading = ref(false);
const quoteLoading = ref(false);
const saving = ref(false);
const error = ref('');
let overviewRequest = 0;
let quoteRequest = 0;

const groupedGoods = computed(() => categoryOrder.map((category) => ({ category, goods: props.goods.filter((good) => good.category === category) })).filter((group) => group.goods.length));
const usedCapacity = computed(() => Object.values(props.fleet.cargo).reduce((total, amount) => total + amount, 0));
const freeCapacity = computed(() => props.fleet.capacity - usedCapacity.value);
const fleetStock = computed(() => selected.value ? props.fleet.cargo[selected.value.id] ?? 0 : 0);
const cityStock = computed(() => selected.value ? props.city.stock[selected.value.id] ?? 0 : 0);
const hardMaximum = computed(() => direction.value === 'buy' ? Math.min(cityStock.value, freeCapacity.value) : fleetStock.value);
const displayedQuote = computed(() => direction.value === 'buy' ? buyQuote.value : sellQuote.value);
const tradeDisabled = computed(() => !activeQuote.value || quoteLoading.value || saving.value);
const tradedVolume = computed(() => history.value.reduce((total, entry) => total + entry.quantity, 0));
const historyPoints = computed(() => {
  const values = history.value.map((entry) => entry.priceAfter);
  if (values.length < 2) return '';
  const minimum = Math.min(...values);
  const range = Math.max(...values) - minimum || 1;
  return values.map((value, index) => `${(index / (values.length - 1)) * 100},${36 - ((value - minimum) / range) * 32}`).join(' ');
});

function formatGold(value: number) { return value.toLocaleString('de-DE'); }
function priceIndicator(price: number | undefined, basePrice: number) {
  if (price === undefined) return { coins: '…', label: 'Preis wird geladen' };
  const ratio = price / basePrice;
  if (ratio <= 0.75) return { coins: '●', label: 'günstig: eine Bronzemünze', tone: 'bronze' };
  if (ratio < 0.9) return { coins: '● ●', label: 'günstig: zwei Bronzemünzen', tone: 'bronze' };
  if (ratio <= 1.1) return { coins: '● ● ●', label: 'normal: drei Silbermünzen', tone: 'silver' };
  if (ratio <= 1.5) return { coins: '●', label: 'teuer: eine Goldmünze', tone: 'gold' };
  if (ratio <= 2.5) return { coins: '● ● ●', label: 'teuer: drei Goldmünzen', tone: 'gold' };
  return { coins: '● ● ● ● ●', label: 'teuer: fünf Goldmünzen', tone: 'gold' };
}

function apiMessage(cause: unknown) {
  if (cause instanceof ApiRequestError) return cause.message;
  return 'Der Server ist derzeit nicht erreichbar. Bitte versuche es erneut.';
}

async function refreshOverview() {
  const request = ++overviewRequest;
  overviewLoading.value = true;
  error.value = '';
  const results = await Promise.all(props.goods.map(async (good) => {
    try { return [good.id, await fetchQuote(props.city.id, good.id, 'buy', 1)] as const; } catch { return undefined; }
  }));
  if (request !== overviewRequest) return;
  quotes.value = Object.fromEntries(results.filter((result): result is readonly [string, MarketQuote] => Boolean(result)));
  overviewLoading.value = false;
  if (results.some((result) => !result)) error.value = 'Einige aktuelle Marktpreise konnten nicht geladen werden.';
}

async function loadMaximum(good: Good, tradeDirection: TradeDirection) {
  const upperBound = tradeDirection === 'buy'
    ? Math.min(props.city.stock[good.id] ?? 0, freeCapacity.value)
    : props.fleet.cargo[good.id] ?? 0;
  if (upperBound < 1) return 0;
  if (tradeDirection === 'sell') return upperBound;
  try {
    await fetchQuote(props.city.id, good.id, tradeDirection, upperBound);
    return upperBound;
  } catch (cause) {
    if (!(cause instanceof ApiRequestError) || cause.code !== 'INSUFFICIENT_GOLD') return upperBound;
    let low = 0;
    let high = upperBound;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      try { await fetchQuote(props.city.id, good.id, tradeDirection, middle); low = middle; } catch { high = middle - 1; }
    }
    return low;
  }
}

async function loadDetail() {
  const good = selected.value;
  if (!good) return;
  const request = ++quoteRequest;
  error.value = '';
  quoteLoading.value = true;
  activeQuote.value = undefined;
  try {
    const [buy, sell, entries, allowedMaximum] = await Promise.all([
      fetchQuote(props.city.id, good.id, 'buy', 1),
      (props.fleet.cargo[good.id] ?? 0) > 0 ? fetchQuote(props.city.id, good.id, 'sell', 1) : Promise.resolve(undefined),
      fetchMarketHistory(props.city.id, good.id),
      loadMaximum(good, direction.value),
    ]);
    if (request !== quoteRequest) return;
    buyQuote.value = buy;
    sellQuote.value = sell;
    history.value = entries;
    maximum.value = allowedMaximum;
    quantity.value = Math.min(Math.max(1, quantity.value), maximum.value || 1);
    await loadActiveQuote(request);
  } catch (cause) {
    if (request === quoteRequest) error.value = apiMessage(cause);
  } finally {
    if (request === quoteRequest) quoteLoading.value = false;
  }
}

async function loadActiveQuote(request = ++quoteRequest) {
  const good = selected.value;
  if (!good) return;
  if (quantity.value < 1 || quantity.value > hardMaximum.value) {
    activeQuote.value = undefined;
    return;
  }
  quoteLoading.value = true;
  activeQuote.value = undefined;
  try {
    const quote = await fetchQuote(props.city.id, good.id, direction.value, quantity.value);
    if (request !== quoteRequest) return;
    activeQuote.value = quote;
    maximum.value = await loadMaximum(good, direction.value);
  } catch (cause) {
    if (request === quoteRequest) error.value = apiMessage(cause);
  } finally {
    if (request === quoteRequest) quoteLoading.value = false;
  }
}

function selectGood(good: Good) {
  selected.value = good;
  direction.value = 'buy';
  quantity.value = 1;
  maximum.value = 0;
}

function chooseDirection(nextDirection: TradeDirection) {
  direction.value = nextDirection;
  quantity.value = 1;
  maximum.value = 0;
  void loadDetail();
}

function changeQuantity(nextQuantity: number) {
  quantity.value = Math.min(Math.max(1, nextQuantity), maximum.value || 1);
}

async function useMaximum() {
  const good = selected.value;
  if (!good) return;
  maximum.value = await loadMaximum(good, direction.value);
  changeQuantity(maximum.value);
}

async function trade() {
  const quote = activeQuote.value;
  if (!quote) return;
  saving.value = true;
  error.value = '';
  try {
    await submitTrade(props.city.id, quote);
    activeQuote.value = undefined;
    emit('traded');
  } catch (cause) {
    error.value = apiMessage(cause);
    activeQuote.value = undefined;
    void loadActiveQuote();
  } finally {
    saving.value = false;
  }
}

watch(quantity, () => { if (selected.value) void loadActiveQuote(); });
watch(selected, () => { if (selected.value) void loadDetail(); });
watch(() => [props.city, props.fleet, props.player], () => {
  void refreshOverview();
  if (selected.value) void loadDetail();
});
onMounted(refreshOverview);
</script>

<template>
  <div class="market" aria-live="polite">
    <template v-if="!selected">
      <p v-if="overviewLoading" class="status">Aktuelle Marktpreise werden geladen …</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <section v-for="group in groupedGoods" :key="group.category" class="market-group">
        <h4>{{ group.category }}</h4>
        <button v-for="good in group.goods" :key="good.id" class="good-row" :data-testid="`market-good-${good.id}`" type="button" @click="selectGood(good)">
          <span class="good-name"><span aria-hidden="true">{{ icons[good.category] }}</span>{{ good.name }}</span>
          <span class="price" :class="priceIndicator(quotes[good.id]?.averageUnitPrice, good.basePrice).tone" :aria-label="priceIndicator(quotes[good.id]?.averageUnitPrice, good.basePrice).label">
            <strong v-if="quotes[good.id]">{{ formatGold(quotes[good.id]?.averageUnitPrice ?? 0) }} G</strong> {{ priceIndicator(quotes[good.id]?.averageUnitPrice, good.basePrice).coins }}<small>{{ priceIndicator(quotes[good.id]?.averageUnitPrice, good.basePrice).label }}</small>
          </span>
          <span><small>Stadt</small>{{ city.stock[good.id] ?? 0 }} t</span>
          <span><small>Flotte</small>{{ fleet.cargo[good.id] ?? 0 }} t</span>
        </button>
      </section>
    </template>

    <template v-else>
      <button class="back" type="button" @click="selected = undefined">← Marktübersicht</button>
      <header class="detail-header"><span class="detail-icon" aria-hidden="true">{{ icons[selected.category] }}</span><div><h4>{{ selected.name }}</h4><p>{{ selected.category }}</p></div></header>
      <p v-if="quoteLoading" class="status">Aktuelles Serverangebot wird geladen …</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <dl class="market-facts">
        <div><dt>Basispreis</dt><dd>{{ formatGold(selected.basePrice) }} Gold</dd></div>
        <div><dt>Kaufpreis</dt><dd>{{ buyQuote ? `${formatGold(buyQuote.averageUnitPrice)} Gold` : '—' }}</dd></div>
        <div><dt>Verkaufspreis</dt><dd>{{ sellQuote ? `${formatGold(sellQuote.averageUnitPrice)} Gold` : '—' }}</dd></div>
        <div><dt>Stadtbestand</dt><dd>{{ cityStock }} t</dd></div>
        <div><dt>Flottenbestand</dt><dd>{{ fleetStock }} t</dd></div>
      </dl>

      <section class="history" aria-label="Preis- und Handelsverlauf">
        <h5>Preisverlauf</h5>
        <template v-if="history.length"><svg v-if="history.length > 1" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" :aria-label="`${history.length} Preisänderungen in dieser Serverlaufzeit`"><polyline :points="historyPoints" /></svg><p>{{ tradedVolume }} t in dieser Serverlaufzeit gehandelt</p></template>
        <p v-else>Noch kein Preis- oder Handelsverlauf in dieser Serverlaufzeit.</p>
      </section>

      <div class="mode" aria-label="Handelsrichtung"><button type="button" :class="{ active: direction === 'buy' }" @click="chooseDirection('buy')">Kaufen</button><button type="button" :class="{ active: direction === 'sell' }" @click="chooseDirection('sell')">Verkaufen</button></div>
      <section class="quantity" aria-label="Handelsmenge">
        <label for="trade-quantity">Menge: <output>{{ quantity }} t</output></label>
        <input id="trade-quantity" v-model.number="quantity" type="range" min="1" :max="Math.max(1, maximum)" :disabled="maximum < 1 || quoteLoading || saving">
        <div class="quantity-buttons"><button type="button" :disabled="quantity <= 1" @click="changeQuantity(quantity - 10)">−10</button><button type="button" :disabled="quantity <= 1" @click="changeQuantity(quantity - 1)">−1</button><button type="button" :disabled="quantity >= maximum" @click="changeQuantity(quantity + 1)">+1</button><button type="button" :disabled="quantity >= maximum" @click="changeQuantity(quantity + 10)">+10</button><button type="button" :disabled="maximum < 1 || quantity >= maximum" @click="useMaximum">Max</button></div>
      </section>

      <section v-if="activeQuote" class="offer" aria-label="Serverangebot" role="region">
        <h5>Serverangebot</h5>
        <dl><div><dt>Menge</dt><dd>{{ activeQuote.quantity }} t</dd></div><div><dt>Durchschnittspreis</dt><dd>{{ formatGold(activeQuote.averageUnitPrice) }} Gold</dd></div><div><dt>{{ direction === 'buy' ? 'Gesamtpreis' : 'Gesamterlös' }}</dt><dd>{{ formatGold(activeQuote.total) }} Gold</dd></div><div><dt>Verbleibendes Gold</dt><dd>{{ formatGold(activeQuote.resultingGold) }} Gold</dd></div><div><dt>Freier Laderaum</dt><dd>{{ activeQuote.remainingCapacity }} t</dd></div><div><dt>Stadt / Flotte</dt><dd>{{ activeQuote.resultingCityStock }} t / {{ activeQuote.resultingFleetStock }} t</dd></div></dl>
      </section>
      <button class="trade" type="button" :disabled="tradeDisabled" @click="trade">{{ saving ? 'Handel wird abgeschlossen …' : 'Serverangebot abschließen' }}</button>
      <p v-if="!displayedQuote && !quoteLoading && maximum < 1" class="status">Für diese Handelsrichtung ist keine Menge verfügbar.</p>
    </template>
  </div>
</template>

<style scoped>
.market { display: grid; gap: 1rem; }.market-group { display: grid; gap: .25rem; }.market h4,.market h5 { margin: 0; }.good-row { width: 100%; min-height: 4.25rem; display: grid; grid-template-columns: 1.3fr 1fr .7fr .7fr; gap: .4rem; align-items: center; text-align: left; padding: .6rem; border: 1px solid #d6b98e; border-radius: .5rem; background: #fff7e5; color: inherit; font: inherit; }.good-row:hover,.good-row:focus-visible { outline: 3px solid #b96b45; outline-offset: 1px; }.good-row small { display: block; font-size: .7rem; }.good-name { display: flex; align-items: center; gap: .35rem; font-weight: 700; }.price { font-size: .8rem; }.price small { color: #453526; }.bronze { color: #9a5f2f; }.silver { color: #58636d; }.gold { color: #9f6900; }.back,.mode button,.quantity button,.trade { min-height: 2.75rem; padding: .55rem .7rem; border: 0; border-radius: .4rem; background: #e9d4b2; color: inherit; font: inherit; }.back { justify-self: start; }.detail-header { display: flex; gap: .7rem; align-items: center; }.detail-header p { margin: .15rem 0 0; }.detail-icon { font-size: 2rem; }.market-facts,.offer dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .45rem; margin: 0; }.market-facts div,.offer dl div { padding: .55rem; border-radius: .4rem; background: #fff7e5; }.market-facts dt,.offer dt { font-size: .75rem; }.market-facts dd,.offer dd { margin: .15rem 0 0; font-weight: 700; }.history { padding: .7rem; border-radius: .5rem; background: #f3dfc0; }.history svg { width: 100%; height: 4rem; margin-top: .5rem; }.history polyline { fill: none; stroke: #b96b45; stroke-width: 3; vector-effect: non-scaling-stroke; }.history p { margin: .4rem 0 0; font-size: .85rem; }.mode { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; }.mode .active,.trade { background: #b96b45; color: #fff; }.quantity { display: grid; gap: .55rem; }.quantity label { font-weight: 700; }.quantity input { width: 100%; accent-color: #b96b45; }.quantity-buttons { display: grid; grid-template-columns: repeat(5, 1fr); gap: .35rem; }.quantity button:disabled,.trade:disabled { opacity: .5; }.offer { padding: .75rem; border: 2px solid #b96b45; border-radius: .5rem; }.offer h5 { margin-bottom: .5rem; }.status,.error { margin: 0; padding: .6rem; border-radius: .4rem; }.status { background: #f3dfc0; }.error { background: #ffe0db; color: #8a2517; } @media (min-width: 700px) { .good-row { grid-template-columns: 1.5fr 1.1fr .8fr .8fr; }.market-facts,.offer dl { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
</style>
