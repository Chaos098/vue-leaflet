<script setup lang="ts">
import { Icon } from '@iconify/vue';
import streetThumbnail from '../assets/Street.png';
import terrainThumbnail from '../assets/Terrain.png';
import topoThumbnail from '../assets/Topo.png'
import type { LayerConfig } from '../types/layers';

interface BaseMapOption {
  name: string;
  thumbnail: string;
}

const baseMapOptions: BaseMapOption[] = [
  { name: 'Street', thumbnail: streetThumbnail },
  { name: 'Terrain', thumbnail: terrainThumbnail },
  { name: 'Topo', thumbnail: topoThumbnail},
];

defineProps<{
  layers: LayerConfig[];
  stateOn: Record<string, boolean>;
  uiState: { activeBaseName: string };
  selectBase: (name: string) => void;
  toggleLayer: (id: string, checked: boolean) => void;
}>();
</script>

<template>
  <div class="custom-layer-control">
    <div class="section">
      <div class="section-title">Basemap</div>
      <div class="basemap-list">
        <button
          v-for="bm in baseMapOptions"
          :key="bm.name"
          type="button"
          class="basemap-item"
          :class="{ active: bm.name === uiState.activeBaseName }"
          @click="selectBase(bm.name)"
        >
          <img class="thumbnail" :src="bm.thumbnail" :alt="bm.name" />
          <span class="label">{{ bm.name }}</span>
        </button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Layers</div>
      <label v-for="layer in layers" :key="layer.id" class="layer-item">
        <input
          type="checkbox"
          :checked="stateOn[layer.id]"
          @change="toggleLayer(layer.id, ($event.target as HTMLInputElement).checked)"
        />
        <Icon :icon="layer.icon" class="layer-icon" />
        <span class="layer-name">{{ layer.name }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.custom-layer-control {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
  padding: 10px 12px;
  min-width: 190px;
  font-size: 13px;
  color: #222;
}

.section + .section {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #e5e5e5;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.basemap-list {
  display: flex;
  gap: 10px;
}

.basemap-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 2px solid transparent;
  border-radius: 6px;
  background: none;
  padding: 4px;
  cursor: pointer;
}

.basemap-item.active {
  border-color: #3388ff;
}

.thumbnail {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
  display: block;
}

.label {
  font-size: 12px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  cursor: pointer;
}

.layer-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.layer-name {
  white-space: nowrap;
}
</style>
