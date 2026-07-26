<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { City } from '@hanse2go/shared';
import { ApiRequestError, buyShip, fetchHarbor, type HarborState } from './api.js';

const props = defineProps<{ city: City }>();
const state = ref<HarborState>(); const error = ref(''); const busy = ref('');
async function load() { error.value = ''; try { state.value = await fetchHarbor(props.city.id); } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Der Hafen konnte nicht geladen werden.'; } }
async function buy(shipId: string) { if (!state.value) return; busy.value = shipId; error.value = ''; try { state.value = await buyShip(props.city.id, shipId, state.value.marketVersion); } catch (cause) { error.value = cause instanceof ApiRequestError ? cause.message : 'Der Kauf ist fehlgeschlagen.'; await load(); } finally { busy.value = ''; } }
onMounted(load);
</script>
<template>
  <article class="harbor"><h3>Hafen</h3><p v-if="error" role="alert">{{ error }}</p><p v-if="!state && !error">Hafen wird geladen …</p>
    <template v-else-if="state"><section class="active"><h4 id="active-fleet-name">{{ state.activeFleet?.customName ?? 'Aktive Flotte' }}</h4><p id="active-fleet-capacity">{{ state.activeFleet?.shipIds.length ?? 0 }} Schiffe</p><p id="active-fleet-speed">Serverbestätigte Flottenwerte</p></section>
      <section><h4>Eigene Flotten</h4><article v-for="fleet in state.fleets" :key="fleet.fleetId" :data-testid="`fleet-card-${fleet.fleetId}`"><strong>{{ fleet.customName }}</strong><span>{{ fleet.shipIds.length }} Schiffe</span></article></section>
      <section><h4>Vorhandene Schiffe kaufen</h4><article v-for="ship in state.ships.filter((item) => item.ownerType === 'system')" :key="ship.shipId" :data-testid="`ship-card-${ship.shipId}`"><strong>{{ ship.customName }}</strong><span>{{ ship.shipTypeId }}</span><button type="button" :data-testid="`buy-ship-${ship.shipId}`" :disabled="busy === ship.shipId" @click="buy(ship.shipId)">Kaufen</button></article></section>
    </template>
  </article>
</template>
<style scoped>.harbor{display:grid;gap:1rem}.harbor section,.harbor article{padding:.75rem;border-radius:.5rem;background:#fff7e5}.harbor section{display:grid;gap:.5rem}.harbor h3,.harbor h4,.harbor p{margin:0}.harbor article{display:flex;justify-content:space-between;align-items:center;gap:.5rem}.harbor button{min-width:44px;min-height:44px;border:0;border-radius:.4rem;background:#b96b45;color:#fff;font:inherit}</style>
