<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { City, Fleet, GameState, Good, GoodCategory, Order, OrderBookSnapshot, Player } from '@hanse2go/shared';
import { ApiRequestError, cancelOrder, createOrder, fetchOrderBook, fetchPlayerOrders, fetchTreasury, replaceOrder } from './api.js';
import { goodCategoryName, goodName } from './i18n.js';

const props = defineProps<{ city: City; goods: Good[]; fleet: Fleet; player: Player; state?: GameState }>();
const emit = defineEmits<{ traded: [] }>();

const categoryOrder: GoodCategory[] = ['food', 'building_materials', 'crafts', 'clothing', 'household', 'luxury'];
const icons: Record<GoodCategory, string> = { food: '🍞', building_materials: '🪵', crafts: '🔨', clothing: '🧵', household: '🏺', luxury: '🥃' };
const selected = ref<Good>();
const side = ref<'buy' | 'sell'>('buy');
const quantityUnits = ref(100);
const limitPrice = ref(100);
const book = ref<OrderBookSnapshot>();
const orders = ref<Order[]>([]);
const treasury = ref<{ cityAccount: GameState['accounts'][string]; populationAccount: GameState['accounts'][string] }>();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const lastExecutions = ref(0);

const groupedGoods = computed(() => categoryOrder.map((category) => ({ category, goods: props.goods.filter((good) => good.category === category) })).filter((group) => group.goods.length));
const ownAccount = computed(() => props.state?.accounts[`player:${props.player.id}`]);
const ownInventory = computed(() => selected.value ? props.state?.kontorWarehouses[props.city.id]?.[selected.value.id] : undefined);
const currentOrder = computed(() => selected.value ? orders.value.filter((order) => order.goodId === selected.value!.id && (order.status === 'open' || order.status === 'partially_filled')) : []);
const formatGold = (value: number) => `${(value / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} G`;
const formatUnits = (value: number) => `${(value / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`;

function apiMessage(cause: unknown) { return cause instanceof ApiRequestError ? cause.message : 'Der Server ist derzeit nicht erreichbar.'; }
async function loadSelected() {
  if (!selected.value) return;
  loading.value = true;
  error.value = '';
  try {
    book.value = await fetchOrderBook(props.city.id, selected.value.id);
    orders.value = await fetchPlayerOrders();
    treasury.value = await fetchTreasury(props.city.id);
  } catch (cause) { error.value = apiMessage(cause); } finally { loading.value = false; }
}
function selectGood(good: Good) { selected.value = good; limitPrice.value = Math.max(1, good.basePrice); quantityUnits.value = 100; void loadSelected(); }
async function submit() {
  if (!selected.value || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const response = await createOrder(props.city.id, { goodId: selected.value.id, side: side.value, quantityUnits: quantityUnits.value, limitPriceGoldPerTon: limitPrice.value });
    lastExecutions.value = response.executions.length;
    await loadSelected();
    emit('traded');
  } catch (cause) { error.value = apiMessage(cause); } finally { saving.value = false; }
}
async function cancel(order: Order) {
  try { await cancelOrder(props.city.id, order.orderId, order.orderVersion); await loadSelected(); emit('traded'); } catch (cause) { error.value = apiMessage(cause); }
}
async function replace(order: Order) {
  const nextPrice = Math.max(1, order.limitPriceGoldPerTon + (order.side === 'buy' ? -1 : 1));
  try { await replaceOrder(props.city.id, order.orderId, order.orderVersion, nextPrice, order.remainingQuantityUnits); await loadSelected(); emit('traded'); } catch (cause) { error.value = apiMessage(cause); }
}
watch(() => [props.state, props.city], () => { if (selected.value) void loadSelected(); });
</script>

<template>
  <div class="market" aria-live="polite">
    <template v-if="!selected">
      <section v-for="group in groupedGoods" :key="group.category" class="market-group">
        <h4>{{ goodCategoryName(group.category) }}</h4>
        <button v-for="good in group.goods" :key="good.id" class="good-row" :data-testid="`market-good-${good.id}`" type="button" @click="selectGood(good)">
          <span class="good-name"><span aria-hidden="true">{{ icons[good.category] }}</span>{{ goodName(good.id) }}</span>
          <span><small>Basispreis</small>{{ good.basePrice }} G/t</span><span><small>Stadt</small>{{ city.stock[good.id] ?? 0 }} t</span>
        </button>
      </section>
    </template>
    <template v-else>
      <button class="back" type="button" @click="selected = undefined">← Marktübersicht</button>
      <header class="detail-header"><span class="detail-icon" aria-hidden="true">{{ icons[selected.category] }}</span><div><h4>{{ goodName(selected.id) }}</h4><p>{{ goodCategoryName(selected.category) }}</p></div></header>
      <p v-if="error" class="error" role="alert">{{ error }}</p><p v-if="loading" class="status">Orderbuch wird geladen …</p>
      <section class="balance-grid" aria-label="Kontostände">
        <div><small>Verfügbares Gold</small><strong>{{ ownAccount ? formatGold(ownAccount.availableMoney) : '—' }}</strong></div>
        <div><small>Reserviertes Gold</small><strong>{{ ownAccount ? formatGold(ownAccount.reservedMoney) : '—' }}</strong></div>
        <div><small>Kontor frei</small><strong>{{ ownInventory ? formatUnits(ownInventory.availableUnits) : '—' }}</strong></div>
        <div><small>Kontor reserviert</small><strong>{{ ownInventory ? formatUnits(ownInventory.reservedUnits) : '—' }}</strong></div>
      </section>
      <section class="book" aria-label="Orderbuch">
        <h5>Orderbuch <span v-if="book">· Version {{ book.version }}</span></h5>
        <div class="book-columns"><div><h6>Kauforders</h6><p v-for="level in book?.bids ?? []" :key="`bid-${level.limitPriceGoldPerTon}`" class="level"><span>{{ level.limitPriceGoldPerTon }} G/t</span><strong>{{ formatUnits(level.quantityUnits) }}</strong></p><p v-if="!book?.bids.length">Keine Kauforders</p></div><div><h6>Verkaufsorders</h6><p v-for="level in book?.asks ?? []" :key="`ask-${level.limitPriceGoldPerTon}`" class="level"><span>{{ level.limitPriceGoldPerTon }} G/t</span><strong>{{ formatUnits(level.quantityUnits) }}</strong></p><p v-if="!book?.asks.length">Keine Verkaufsorders</p></div></div>
      </section>
      <form class="order-form" aria-label="Limitorder" @submit.prevent="submit">
        <div class="mode" aria-label="Orderseite"><button type="button" :class="{ active: side === 'buy' }" @click="side = 'buy'">Kaufen</button><button type="button" :class="{ active: side === 'sell' }" @click="side = 'sell'">Verkaufen</button></div>
        <label for="order-quantity">Menge in 0,01 t <output>{{ formatUnits(quantityUnits) }}</output></label><input id="order-quantity" v-model.number="quantityUnits" type="number" min="1" step="1" required>
        <label for="order-price">Limitpreis Gold/t <output>{{ limitPrice }} G/t</output></label><input id="order-price" v-model.number="limitPrice" type="number" min="1" step="1" required>
        <p class="preview">Maximalwert: <strong>{{ formatGold(quantityUnits * limitPrice) }}</strong> · Käufergebühr: <strong>{{ formatGold(Math.ceil(quantityUnits * limitPrice * 5 / 1000)) }}</strong></p>
        <button class="trade" type="submit" :disabled="saving || loading">{{ saving ? 'Order wird gebucht …' : 'Limitorder einstellen' }}</button>
      </form>
      <p v-if="lastExecutions" class="success" role="status">{{ lastExecutions }} Execution{{ lastExecutions === 1 ? '' : 's' }} ausgeführt.</p>
      <section class="open-orders" aria-label="Eigene offene Orders"><h5>Eigene Orders</h5><p v-if="!currentOrder.length">Keine offene Order für diese Ware.</p><article v-for="order in currentOrder" :key="order.orderId" class="own-order"><span>{{ order.side === 'buy' ? 'Kauf' : 'Verkauf' }} · {{ order.limitPriceGoldPerTon }} G/t · {{ formatUnits(order.remainingQuantityUnits) }}</span><span><button type="button" @click="replace(order)">Preis ändern</button><button type="button" @click="cancel(order)">Stornieren</button></span></article></section>
      <section class="treasury" aria-label="Stadtkasse"><h5>Stadtkasse</h5><p>Stadtkasse: {{ treasury ? formatGold(treasury.cityAccount.availableMoney) : '—' }} · Bevölkerungskasse: {{ treasury ? formatGold(treasury.populationAccount.availableMoney) : '—' }}</p></section>
    </template>
  </div>
</template>

<style scoped>
.market { display: grid; gap: 1rem; }.market-group { display: grid; gap: .25rem; }.market h4,.market h5 { margin: 0; }.good-row { width: 100%; min-height: 4rem; display: grid; grid-template-columns: 1.5fr 1fr .7fr; gap: .4rem; align-items: center; text-align: left; padding: .6rem; border: 1px solid #d6b98e; border-radius: .5rem; background: #fff7e5; color: inherit; font: inherit; }.good-row:hover,.good-row:focus-visible { outline: 3px solid #b96b45; outline-offset: 1px; }.good-row small,.balance-grid small { display: block; font-size: .7rem; }.good-name { display: flex; align-items: center; gap: .35rem; font-weight: 700; }.back,.mode button,.trade,.own-order button { min-height: 2.6rem; padding: .5rem .7rem; border: 0; border-radius: .4rem; background: #e9d4b2; color: inherit; font: inherit; }.back { justify-self: start; }.detail-header { display: flex; gap: .7rem; align-items: center; }.detail-header p { margin: .15rem 0 0; }.detail-icon { font-size: 2rem; }.balance-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .4rem; }.balance-grid div,.book,.order-form,.open-orders,.treasury { padding: .7rem; border-radius: .5rem; background: #fff7e5; }.balance-grid strong { display: block; margin-top: .2rem; }.book-columns { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }.book h5 { margin-bottom: .5rem; }.book h6 { margin: .25rem 0; }.level,.own-order { display: flex; justify-content: space-between; gap: .6rem; margin: .25rem 0; padding: .4rem; border-radius: .3rem; background: #f3dfc0; }.order-form { display: grid; gap: .55rem; }.order-form label { display: flex; justify-content: space-between; font-weight: 700; }.order-form input { min-height: 2.5rem; padding: 0 .5rem; border: 1px solid #b99672; border-radius: .35rem; font: inherit; }.mode { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; }.mode .active,.trade { background: #b96b45; color: #fff; }.trade:disabled { opacity: .5; }.preview { margin: 0; font-size: .85rem; }.error,.success,.status { margin: 0; padding: .6rem; border-radius: .4rem; }.error { background: #ffe0db; color: #8a2517; }.success { background: #d8f0d0; }.status { background: #f3dfc0; }.own-order { align-items: center; }.own-order button { min-height: 2.25rem; margin-left: .3rem; }.treasury p { margin: .35rem 0 0; } @media (min-width: 700px) { .balance-grid { grid-template-columns: repeat(4, 1fr); }.book-columns { grid-template-columns: repeat(2, 1fr); } }
</style>
