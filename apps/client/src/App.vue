<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchHealth } from './api.js';

const status = ref<'loading' | 'online' | 'offline'>('loading');

onMounted(async () => {
  try {
    await fetchHealth();
    status.value = 'online';
  } catch {
    status.value = 'offline';
  }
});
</script>

<template>
  <main>
    <h1>Hanse2Go</h1>
    <p v-if="status === 'loading'" aria-live="polite">Serverstatus wird geladen …</p>
    <p v-else-if="status === 'online'" role="status">Server ist erreichbar.</p>
    <p v-else role="alert">Der Server ist derzeit nicht erreichbar.</p>
  </main>
</template>
