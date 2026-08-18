<script setup lang="ts">
import L from 'leaflet';
import officeIcon from '../assets/office-building.png'
import { onBeforeUnmount, onMounted, ref } from 'vue';
// import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { geocoding, config } from "@maptiler/client";
import { useLayerManager } from '../composables/useLayerManager';
import { LAYERS } from '../config/layers.config';
import { Icon } from '@iconify/vue'


import type { DrawerPlacement } from 'naive-ui'

let map: L.Map | null = null;
let manager: ReturnType<typeof useLayerManager> | null = null;
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
// const gc = new GeocodingControl({ apiKey: maptilerKey });
// const layerState = ref<ReturnType<typeof useLayerManager>['state'] | null>(null);

const overlayMaps: Record<string, L.Layer> = {};

var marker = L.icon({
  iconUrl: officeIcon,

  iconSize: [25, 40], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

const terrainTileLayer = L.tileLayer(`https://api.maptiler.com/maps/hybrid-v4/{z}/{x}/{y}.jpg?key=${maptilerKey}`, { //style URL
  tileSize: 512,
  zoomOffset: -1,
  minZoom: 1,
  attribution: "<a href=\"https://www.maptiler.com/copyright/\" target=\"_blank\">&copy; MapTiler</a> <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">&copy; OpenStreetMap contributors</a>",
  crossOrigin: true
})

const openStreetMap = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '&copy; OpenStreetMap contributors'
  }
);

const baseMaps: Record<string, L.Layer> = {
  "Street": openStreetMap,
  "Terrain": terrainTileLayer,
};
let activeBaseName = 'Street';

function switchBaseMap(name: string) {

  if (!map || name === activeBaseName) return;
  const current = baseMaps[activeBaseName];
  const next = baseMaps[name];
  if (!current || !next) return;
  map.removeLayer(current);
  next.addTo(map);
  // next.bringToBack(map) 
  activeBaseName = name;
}

onMounted(async () => {

  config.apiKey = maptilerKey
  const center = await geocoding.forward("273 Điện Biên Phủ, Phường Xuân Hòa, Thành phố Hồ Chí Minh.");
  const start = await geocoding.forward("Việt Nam")
  const [centerLng, centerLat] = center.features[0].center;
  const [startLng, startLat] = start.features[0].center;
  map = L.map('map').setView([startLat, startLng], 15);
  map.createPane('wmsPane')
  map.getPane('wmsPane')!.style.zIndex = '350';
  // map.getPane('wmsPane').style.pointerEvents = 'none';
  openStreetMap.addTo(map);

  //   const overlayMaps: Record<string, L.Layer> = {};
  // for (const cfg of LAYERS) {
  //   const layer = createOverlayLayer(cfg);
  //   overlayMaps[cfg.name] = layer;
  //   if (cfg.defaultOn) layer.addTo(map);
  // }


  map.flyTo([centerLat, centerLng])
  L.marker([centerLat, centerLng], { icon: marker }).addTo(map).bindPopup("Sở Khoa học Công nghệ");

  manager = useLayerManager(map, LAYERS);
  for (const cfg of LAYERS) {
    const layer = manager.createOverLayer(cfg);
    overlayMaps[cfg.name] = layer;
    if (cfg.defaultOn) layer.addTo(map);
  }

  // layerState.value = manager.state;
  // manager.initDefaults();

  L.control.layers(baseMaps,overlayMaps).addTo(map);

})

onBeforeUnmount(() => {
  map?.remove();
});


// function onToggle(id: string, event: Event) {
//   const checked = (event.target as HTMLInputElement).checked;
//   manager?.toggle(id, checked);
// }

// const statusLabel: Record<string, string> = {
//   idle: '○ tắt',
//   loading: '● đang tải…',
//   ready: '● sẵn sàng',
//   empty: '● không có dữ liệu',
//   error: '● lỗi',
// };



// const show = ref(false)
// const placement = ref<DrawerPlacement>('right')
// function activate(place: DrawerPlacement) {
//   show.value = true
//   placement.value = place
// }

defineExpose({ switchBaseMap });
</script>



<template>

</template>
