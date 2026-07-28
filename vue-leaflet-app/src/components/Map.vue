<template>
  <div id="map"></div>
</template>

<script setup lang="ts">
import L from 'leaflet';
import officeIcon from '../assets/office-building.png'
import { onMounted } from 'vue';
// import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { geocoding, config } from "@maptiler/client";

let map: L.Map;
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
// const gc = new GeocodingControl({ apiKey: maptilerKey });


var marker = L.icon({
    iconUrl: officeIcon,

    iconSize:     [25, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});


onMounted(async () => {
  config.apiKey = maptilerKey
  const center = await geocoding.forward("273 Điện Biên Phủ, Phường Xuân Hòa, Thành phố Hồ Chí Minh.");
  const start = await geocoding.forward("Việt Nam")
  const [centerLng, centerLat] = center.features[0].center;
  const [startLng, startLat] = start.features[0].center;

  
  map = L.map('map').setView([startLat, startLng], 18);
  L.tileLayer(`https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${maptilerKey}`, { //style URL
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: "\u003ca href=\"https://www.maptiler.com/copyright/\" target=\"_blank\"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e",
    crossOrigin: true
  }).addTo(map);
  map.flyTo([centerLat, centerLng])
  L.marker([centerLat, centerLng], {icon: marker}).addTo(map).bindPopup("Sở Khoa học Công nghệ");
  

  
})

</script>
