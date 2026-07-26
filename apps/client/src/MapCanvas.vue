<script setup lang="ts">
import maplibregl, { type Map } from 'maplibre-gl';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { City, Fleet, ReachableCity } from '@hanse2go/shared';
import { cityName } from './i18n.js';

const props = defineProps<{ cities: City[]; fleet: Fleet; reachableCities: ReachableCity[]; disabled?: boolean }>();
const emit = defineEmits<{ debugPosition: [position: { longitude: number; latitude: number }] }>();
const element = ref<HTMLElement>();
let map: Map | undefined;

const cityFeatures = computed(() => props.cities.map((city) => ({
  type: 'Feature' as const,
  properties: { id: city.id, name: cityName(city.id), reachable: props.reachableCities.some((entry) => entry.cityId === city.id && entry.reachable) },
  geometry: { type: 'Point' as const, coordinates: [city.position.longitude, city.position.latitude] },
})));

function refreshSources() {
  const citySource = map?.getSource('cities') as maplibregl.GeoJSONSource | undefined;
  citySource?.setData({ type: 'FeatureCollection', features: cityFeatures.value });
  const fleetSource = map?.getSource('fleet') as maplibregl.GeoJSONSource | undefined;
  fleetSource?.setData({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [props.fleet.position.longitude, props.fleet.position.latitude] } });
}

onMounted(() => {
  if (!element.value) return;
  map = new maplibregl.Map({
    container: element.value,
    center: [8.12, 49.4], zoom: 10,
    style: { version: 8, sources: {}, layers: [{ id: 'ocean', type: 'background', paint: { 'background-color': '#a9ddeb' } }] },
  });
  map.on('load', () => {
    map?.addSource('cities', { type: 'geojson', data: { type: 'FeatureCollection', features: cityFeatures.value } });
    map?.addLayer({ id: 'city-radius', type: 'circle', source: 'cities', paint: { 'circle-radius': 28, 'circle-color': '#f4c778', 'circle-opacity': 0.35 } });
    map?.addLayer({ id: 'cities', type: 'circle', source: 'cities', paint: { 'circle-radius': ['case', ['get', 'reachable'], 12, 8], 'circle-color': ['case', ['get', 'reachable'], '#e17055', '#705a3c'], 'circle-stroke-color': '#fff7e5', 'circle-stroke-width': 2 } });
    map?.addLayer({ id: 'city-labels', type: 'symbol', source: 'cities', layout: { 'text-field': ['get', 'name'], 'text-offset': [0, 1.2], 'text-anchor': 'top' }, paint: { 'text-color': '#293b45', 'text-halo-color': '#fff7e5', 'text-halo-width': 1 } });
    map?.addSource('fleet', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [props.fleet.position.longitude, props.fleet.position.latitude] } } });
    map?.addLayer({ id: 'fleet', type: 'circle', source: 'fleet', paint: { 'circle-radius': 9, 'circle-color': '#176b87', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 } });
    map?.on('click', (event) => { if (!props.disabled) emit('debugPosition', { longitude: event.lngLat.lng, latitude: event.lngLat.lat }); });
  });
});
watch(() => [props.cities, props.fleet, props.reachableCities], refreshSources, { deep: true });
onBeforeUnmount(() => map?.remove());
</script>

<template><div ref="element" class="map" aria-label="Ozeankarte im Debug-Modus" /></template>

<style scoped>
.map { width: 100%; height: 100%; min-height: 28rem; }
</style>
