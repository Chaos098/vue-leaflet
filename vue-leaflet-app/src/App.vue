<script setup lang="ts">
import { ref } from 'vue';
import MapView from './components/MapView.vue';
import MapLayerSelector from './components/MapLayerSelector.vue';
import Map from './components/Map.vue';

const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
const activeBaseName = ref('Street');
const activeLayerName = ref('admin')

function handleLayerSelect(name: string) {
  activeLayerName.value = name;
  mapViewRef.value?.switchBaseMap(name);
}

function handleBasemapSelect(name: string) {
  activeBaseName.value = name;
  mapViewRef.value?.switchBaseMap(name);
}
</script>

<template>
  <MapView ref="mapViewRef" />

  <MapLayerSelector
    :active-base-name="activeBaseName"
    @select="handleBasemapSelect"
  />

  <!-- <Map/> -->
</template>