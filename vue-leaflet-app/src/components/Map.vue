<script setup lang="ts">
import L from 'leaflet';
import officeIcon from '../assets/office-building.png'
import { onBeforeUnmount, onMounted, ref } from 'vue';
// import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { geocoding, config } from "@maptiler/client";
import { useLayerManager } from '../composables/useLayerManager';
import { LAYERS } from '../config/layers.config';

let map: L.Map | null = null;
let manager: ReturnType<typeof useLayerManager> | null = null;
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
// const gc = new GeocodingControl({ apiKey: maptilerKey });
const layerState = ref<ReturnType<typeof useLayerManager>['state'] | null>(null);



var marker = L.icon({
  iconUrl: officeIcon,

  iconSize: [25, 40], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});



onMounted(async () => {


  config.apiKey = maptilerKey
  const center = await geocoding.forward("273 Điện Biên Phủ, Phường Xuân Hòa, Thành phố Hồ Chí Minh.");
  const start = await geocoding.forward("Việt Nam")
  const [centerLng, centerLat] = center.features[0].center;
  const [startLng, startLat] = start.features[0].center;
  map = L.map('map').setView([startLat, startLng], 15);
  L.tileLayer(`https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${maptilerKey}`, { //style URL
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: "\u003ca href=\"https://www.maptiler.com/copyright/\" target=\"_blank\"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e",
    crossOrigin: true
  }).addTo(map);
  map.flyTo([centerLat, centerLng])
  L.marker([centerLat, centerLng], { icon: marker }).addTo(map).bindPopup("Sở Khoa học Công nghệ");



  manager = useLayerManager(map, LAYERS);
  layerState.value = manager.state;
  manager.initDefaults();
})

onBeforeUnmount(() => {
  map?.remove();
});


function onToggle(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  manager?.toggle(id, checked);
}

const statusLabel: Record<string, string> = {
  idle: '○ tắt',
  loading: '● đang tải…',
  ready: '● sẵn sàng',
  empty: '● không có dữ liệu',
  error: '● lỗi',
};

</script>


<template>
  <div class="app-shell">
    <aside class="panel">
      <h1>WebGIS TP.HCM</h1>
      <p class="sub">5 lớp overlay — Leaflet + Vue 3 + TypeScript</p>

      <label v-for="cfg in LAYERS" :key="cfg.id" class="layer-row">
        <input type="checkbox" :checked="cfg.defaultOn" @change="onToggle(cfg.id, $event)" />
        <!-- <span class="swatch" :style="{ background: cfg.color }"></span> -->
        <span class="meta">
          <span class="name">{{ cfg.name }}</span>
          <span class="desc">{{ cfg.description }}</span>
          <span v-if="layerState && layerState[cfg.id]" class="status" :class="`status-${layerState[cfg.id].status}`">
            {{ statusLabel[layerState[cfg.id].status] }}
            <template v-if="layerState[cfg.id].featureCount !== undefined">
              ({{ layerState[cfg.id].featureCount }} đối tượng)
            </template>
          </span>
        </span>
      </label>
    </aside>
    <div ref="mapContainer" id="map"></div>
  </div>
</template>
