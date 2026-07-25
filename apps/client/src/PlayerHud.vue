<script setup lang="ts">
import { computed } from 'vue';
import type { Fleet, Good, Player } from '@hanse2go/shared';

const props = defineProps<{ player: Player; fleet: Fleet; goods: Good[]; view: 'player' | 'fleet' }>();
defineEmits<{ close: []; changeView: [view: 'player' | 'fleet'] }>();

const usedCapacity = computed(() => Object.values(props.fleet.cargo).reduce((total, amount) => total + amount, 0));
const freeCapacity = computed(() => props.fleet.capacity - usedCapacity.value);
const cargo = computed(() => Object.entries(props.fleet.cargo).map(([goodId, quantity]) => ({ name: props.goods.find((good) => good.id === goodId)?.name ?? goodId, quantity })).sort((left, right) => left.name.localeCompare(right.name, 'de')));
const formatGold = (value: number) => value.toLocaleString('de-DE');
</script>

<template>
  <section class="hud-dialog" role="dialog" aria-modal="true" :aria-label="view === 'player' ? 'Spielerübersicht' : 'Flottenübersicht'">
    <header><h2>{{ view === 'player' ? 'Spielerübersicht' : 'Aktive Flotte' }}</h2><button type="button" aria-label="Übersicht schließen" @click="$emit('close')">×</button></header>
    <template v-if="view === 'player'">
      <p class="player-name">{{ player.name }}</p>
      <dl><div><dt>Gold</dt><dd>{{ formatGold(player.gold) }} Gold</dd></div><div><dt>Aktive Flotte</dt><dd>{{ fleet.id }}</dd></div><div><dt>Kapazität</dt><dd>{{ usedCapacity }} / {{ fleet.capacity }} t</dd></div></dl>
      <button class="secondary" type="button" @click="$emit('changeView', 'fleet')">Ladung ansehen</button>
    </template>
    <template v-else>
      <dl><div><dt>Gesamtkapazität</dt><dd>{{ fleet.capacity }} t</dd></div><div><dt>Belegt</dt><dd>{{ usedCapacity }} t</dd></div><div><dt>Frei</dt><dd>{{ freeCapacity }} t</dd></div></dl>
      <h3>Geladene Waren</h3>
      <p v-if="!cargo.length">Die Flotte ist leer.</p>
      <ul v-else class="cargo"><li v-for="entry in cargo" :key="entry.name"><span>{{ entry.name }}</span><strong>{{ entry.quantity }} t</strong></li></ul>
      <button class="secondary" type="button" @click="$emit('changeView', 'player')">Spielerübersicht</button>
    </template>
  </section>
</template>

<style scoped>
.hud-dialog { position: fixed; z-index: 4; top: .65rem; right: .65rem; left: .65rem; max-width: 28rem; padding: 1rem; border: 3px solid #9b6a3e; border-radius: .75rem; background: #fff7e5; color: #453526; box-shadow: 0 8px 28px #26323855; }.hud-dialog header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }.hud-dialog h2,.hud-dialog h3 { margin: 0; }.hud-dialog h3 { margin-top: 1rem; font-size: 1rem; }.hud-dialog header button { min-width: 2.75rem; min-height: 2.75rem; border: 0; border-radius: .4rem; background: #e9d4b2; font: inherit; font-size: 1.4rem; }.player-name { margin: .75rem 0; font-weight: 700; }.hud-dialog dl { display: grid; gap: .5rem; margin: .75rem 0; }.hud-dialog dl div,.cargo li { display: flex; justify-content: space-between; gap: .75rem; padding: .65rem; border-radius: .4rem; background: #f3dfc0; }.hud-dialog dt { font-size: .8rem; }.hud-dialog dd { margin: 0; font-weight: 700; text-align: right; }.secondary { min-height: 2.75rem; padding: .55rem .75rem; border: 0; border-radius: .4rem; background: #b96b45; color: #fff; font: inherit; }.cargo { display: grid; gap: .4rem; padding: 0; margin: .6rem 0 1rem; list-style: none; } @media (min-width: 700px) { .hud-dialog { left: auto; } }
</style>
