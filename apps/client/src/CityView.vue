<script setup lang="ts">
import { ref } from 'vue';
import type { City, Fleet, Good, Player } from '@hanse2go/shared';
import { cityName, goodName } from './i18n.js';
import BuildingsView from './BuildingsView.vue';
import MarketView from './MarketView.vue';

defineProps<{ city: City; goods: Good[]; fleet: Fleet; player: Player }>();
defineEmits<{ close: []; traded: [] }>();
const tab = ref<'overview' | 'production' | 'market' | 'buildings'>('overview');
const prosperityLabel = (value: number) => value < 30 ? 'einfach' : value < 60 ? 'wohlhabend' : 'reich';
</script>

<template>
  <section class="city-view" role="dialog" aria-modal="true" :aria-label="`${cityName(city.id)} Stadtansicht`">
    <header class="city-header"><div><small>Inselstadt</small><h2>{{ cityName(city.id) }}</h2></div><div class="city-hud"><span>{{ player.gold.toLocaleString('de-DE') }} G</span><span>{{ Object.values(fleet.cargo).reduce((total, amount) => total + amount, 0) }} / {{ fleet.capacity }} t</span></div><button type="button" aria-label="Stadtansicht schließen" @click="$emit('close')">×</button></header>
    <nav aria-label="Stadtbereiche"><button :class="{ active: tab === 'overview' }" @click="tab = 'overview'">Übersicht</button><button :class="{ active: tab === 'production' }" @click="tab = 'production'">Produktion</button><button :class="{ active: tab === 'market' }" @click="tab = 'market'">Markt</button><button :class="{ active: tab === 'buildings' }" @click="tab = 'buildings'">Gebäude</button></nav>
    <article v-if="tab === 'overview'" class="city-content">
      <h3>Stadtübersicht</h3><dl><div><dt>Bevölkerung</dt><dd>{{ city.population.toLocaleString('de-DE') }}</dd></div><div><dt>Wohlstand</dt><dd>{{ city.prosperity }} · {{ prosperityLabel(city.prosperity) }}</dd></div><div><dt>Beliebtheit</dt><dd>{{ city.popularity }} %</dd></div><div><dt>Kontor</dt><dd>{{ city.hasKontor ? 'vorhanden' : 'nicht vorhanden' }}</dd></div></dl>
    </article>
    <article v-else-if="tab === 'production'" class="city-content"><h3>Produktionsschwerpunkte</h3><p>Diese Insel ist besonders geeignet für:</p><ul><li v-for="focus in city.productionFocus" :key="focus">{{ goodName(focus) }}</li></ul></article>
    <article v-else-if="tab === 'market'" class="city-content"><MarketView :city="city" :goods="goods" :fleet="fleet" :player="player" @traded="$emit('traded')" /></article>
    <article v-else class="city-content"><BuildingsView :city="city" :goods="goods" @changed="$emit('traded')" /></article>
  </section>
</template>

<style scoped>
.city-view { position: fixed; inset: 0; overflow: auto; z-index: 3; background: #f8eddb; color: #453526; }
.city-header { display: flex; justify-content: space-between; align-items: center; gap: .5rem; padding: .75rem 1rem; background: #dcb580; border-bottom: 4px solid #9b6a3e; }.city-header h2 { margin: .1rem 0 0; }.city-header button { min-width: 2.75rem; min-height: 2.75rem; border: 0; border-radius: .5rem; font-size: 1.5rem; background: #fff7e5; }.city-hud { display: grid; gap: .15rem; margin-left: auto; font-size: .8rem; text-align: right; font-weight: 700; }
nav { display: flex; padding: .5rem; gap: .5rem; background: #ecd2ad; } nav button { flex: 1; padding: .7rem .4rem; border: 0; border-radius: .4rem; background: #fff7e5; font: inherit; } nav button.active { background: #b96b45; color: #fff; }
.city-content { max-width: 48rem; margin: 1rem auto; padding: 1rem; }.city-content h3 { margin-top: 0; } dl { display: grid; gap: .75rem; } dl div { display: flex; justify-content: space-between; padding: .75rem; border-radius: .5rem; background: #fff7e5; } dt { font-weight: 700; } dd { margin: 0; }
</style>
