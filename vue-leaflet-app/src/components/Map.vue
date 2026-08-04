<script setup lang="ts">
import L from 'leaflet';
import officeIcon from '../assets/office-building.png'
import { onBeforeUnmount, onMounted } from 'vue';
// import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { geocoding, config } from "@maptiler/client";
import { LAYERS } from '../config/layers.config';
import type { LayerConfig } from '../types/layers';

let map: L.Map | null = null;
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
// const gc = new GeocodingControl({ apiKey: maptilerKey });

var marker = L.icon({
  iconUrl: officeIcon,

  iconSize: [25, 40], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

const mapTileLayer = L.tileLayer(`https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${maptilerKey}`, { //style URL
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

// Dựng L.Layer từ config — chỉ hỗ trợ các nguồn có thể tạo layer đồng bộ
// (cần thiết để đưa thẳng vào L.control.layers ngay khi khởi tạo map).
function createOverlayLayer(cfg: LayerConfig): L.Layer {
  switch (cfg.source.kind) {
    case 'static':
      return L.geoJSON(cfg.source.data, {
        style: { color: cfg.source.color, weight: 1.6, fillColor: cfg.source.color, fillOpacity: 0.04 },
        onEachFeature: (f, layer) => {
          const name = (f.properties as { name?: string } | null)?.name ?? '(không tên)';
          layer.bindPopup(`<b>${name}</b>`);
        },
      });
    case 'wms':
      return L.tileLayer.wms(cfg.source.baseUrl, {
        layers: cfg.source.layers,
        format: cfg.source.format ?? 'image/png',
        transparent: cfg.source.transparent ?? true,
        version: '1.1.0',
      });
    case 'overpass':
    case 'wfs':
      throw new Error(`Layer "${cfg.id}": nguồn "${cfg.source.kind}" chưa được hỗ trợ.`);
  }
}

onMounted(async () => {

  config.apiKey = maptilerKey
  const center = await geocoding.forward("273 Điện Biên Phủ, Phường Xuân Hòa, Thành phố Hồ Chí Minh.");
  const start = await geocoding.forward("Việt Nam")
  const [centerLng, centerLat] = center.features[0].center;
  const [startLng, startLat] = start.features[0].center;
  map = L.map('map').setView([startLat, startLng], 15);
  mapTileLayer.addTo(map);

  const baseMaps: Record<string, L.Layer> = {
    "MapTiler Streets": mapTileLayer,
    "OpenStreetMap": openStreetMap,
  };

  const overlayMaps: Record<string, L.Layer> = {};
  for (const cfg of LAYERS) {
    const layer = createOverlayLayer(cfg);
    overlayMaps[cfg.name] = layer;
    if (cfg.defaultOn) layer.addTo(map);
  }

  L.control.layers(baseMaps, overlayMaps).addTo(map);

  map.flyTo([centerLat, centerLng])
  L.marker([centerLat, centerLng], { icon: marker }).addTo(map).bindPopup("Sở Khoa học Công nghệ");
})

onBeforeUnmount(() => {
  map?.remove();
});
</script>


<template>
  <div id="map"></div>
</template>
