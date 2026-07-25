<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { City, GameState, ReachableCity } from '@hanse2go/shared';
import { fetchGameState, fetchReachableCity, setDebugPosition } from './api.js';
import CityView from './CityView.vue';
import MapCanvas from './MapCanvas.vue';

const state = ref<GameState>();
const reachableCities = ref<ReachableCity[]>([]);
const status = ref<'loading' | 'ready' | 'error'>('loading');
const isMoving = ref(false);
const openCity = ref<City>();
const reachable = computed(() => state.value?.cities.filter((city) => reachableCities.value.some((entry) => entry.cityId === city.id && entry.reachable)) ?? []);

onMounted(async () => {
  try {
    state.value = await fetchGameState();
    status.value = 'ready';
  } catch {
    status.value = 'error';
  }
});

async function moveFleet(position: { longitude: number; latitude: number }) {
  if (isMoving.value) return;
  isMoving.value = true;
  try {
    const result = await setDebugPosition(position);
    if (state.value) state.value = { ...state.value, fleet: result.fleet };
    reachableCities.value = result.reachableCities;
  } catch { status.value = 'error'; } finally { isMoving.value = false; }
}
async function enterCity(cityId: string) {
  try { openCity.value = (await fetchReachableCity(cityId)).city; } catch { status.value = 'error'; }
}
async function refreshState() { try { state.value = await fetchGameState(); if (openCity.value) openCity.value = (await fetchReachableCity(openCity.value.id)).city; } catch { status.value = 'error'; } }
</script>

<template>
  <main class="game-shell">
    <header class="topbar"><h1>Hanse2Go</h1><span>Debug-Modus · Karte klicken zum Bewegen</span></header>
    <p v-if="status === 'loading'" aria-live="polite">Spielwelt wird geladen …</p>
    <p v-else-if="status === 'error'" role="alert">Der Server ist derzeit nicht erreichbar.</p>
    <template v-else-if="state">
      <MapCanvas :cities="state.cities" :fleet="state.fleet" :reachable-cities="reachableCities" :disabled="isMoving" @debug-position="moveFleet" />
      <section v-if="reachable.length" class="city-entry" aria-live="polite">
        <strong>{{ reachable[0]?.name }} ist erreichbar</strong>
        <button class="enter-city" type="button" @click="enterCity(reachable[0]!.id)">Stadt betreten</button>
      </section>
      <CityView v-if="openCity" :city="openCity" :goods="state.goods" :fleet="state.fleet" :player="state.player" @close="openCity = undefined" @traded="refreshState" />
    </template>
  </main>
</template>
