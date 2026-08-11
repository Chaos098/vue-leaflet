<script setup lang="ts">
import { ref } from 'vue';
import MapView from './components/MapView.vue';
import MapLayerSelector from './components/MapLayerSelector.vue';

const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
const activeBaseName = ref('Street');

function handleLayerSelect(name: string) {
  activeBaseName.value = name;
  mapViewRef.value?.switchBaseMap(name);
}
</script>

<template>
  <MapView ref="mapViewRef" />

  <MapLayerSelector
    :active-base-name="activeBaseName"
    @select="handleLayerSelect"
  />
</template>