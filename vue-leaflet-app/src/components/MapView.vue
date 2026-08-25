<script setup lang="ts">
import L from 'leaflet';
import officeIcon from '../assets/office-building.png'
import { createApp, onBeforeUnmount, onMounted, reactive } from 'vue';
// import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { geocoding, config } from "@maptiler/client";
import { useLayerManager } from '../composables/useLayerManager';
import { LAYERS } from '../config/layers.config';
import CustomLayerControl from './CustomLayerControl.vue';

let map: L.Map | null = null;
let controlApp: ReturnType<typeof createApp> | null = null;
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
// const gc = new GeocodingControl({ apiKey: maptilerKey });
// object thay vì ref: props của createApp không tự unwrap ref lồng bên trong,
// nhưng object reactive() thì giữ nguyên reactivity khi đi qua props (giống stateOn)
const uiState = reactive({ activeBaseName: 'Street' });


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

var openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
});



const baseMaps: Record<string, L.Layer> = {
  "Street": openStreetMap,
  "Terrain": terrainTileLayer,
  "Topo": openTopoMap,
};

function switchBaseMap(name: string) {

  if (!map || name === uiState.activeBaseName) return;
  const current = baseMaps[uiState.activeBaseName];
  const next = baseMaps[name];
  if (!current || !next) return;
  map.removeLayer(current);
  next.addTo(map);
  // next.bringToBack(map)
  uiState.activeBaseName = name;
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
  openStreetMap.addTo(map);

  map.flyTo([centerLat, centerLng])
  L.marker([centerLat, centerLng], { icon: marker }).addTo(map).bindPopup("Sở Khoa học Công nghệ");

  const layerManager = useLayerManager(map, LAYERS);
  layerManager.initLayer()

  // Create custom leaflet control panel
  const PanelControl = L.Control.extend({
    onAdd() {
      const container = L.DomUtil.create('div', 'custom-layer-control');
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      controlApp = createApp(CustomLayerControl, {
        layers: LAYERS,
        stateOn: layerManager.stateOn,
        uiState,
        selectBase: switchBaseMap,
        toggleLayer: layerManager.toggleLayer,
      });
      controlApp.mount(container);

      return container;
    },

    onRemove() {
      controlApp?.unmount();
      controlApp = null;
    },
  });

  new PanelControl({ position: 'topright' }).addTo(map);
})

onBeforeUnmount(() => {
  map?.remove();
});



defineExpose({ switchBaseMap });
</script>



<template>
  <div class="app-shell">
    <div id="map"></div>
  </div>
</template>
