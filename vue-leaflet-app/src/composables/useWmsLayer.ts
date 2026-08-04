// src/composables/useWmsLayer.ts
// Composable dùng cho lớp lấy trực tiếp từ GeoServer thật (WMS).
// Nhưng vì GeoServer chưa thể lấy được từ nguồn nên chưa thể sử dụng WMS

import L from 'leaflet';
import type { WmsSourceConfig, LayerRuntimeState } from '../types/layers';

// const geoServerURL = "https://opendata.hcmgis.vn/geoserver/wms";

export function useWmsLayer(map: L.Map, source: WmsSourceConfig) {
  let tileLayer: L.TileLayer.WMS | null = null;

  function add(state: LayerRuntimeState) {
    state.status = 'loading';
    tileLayer = L.tileLayer.wms(source.baseUrl, {
      layers: source.layers,
      format: source.format ?? 'image/png',
      transparent: source.transparent ?? true,
      version: '1.1.0',
    });

    // WMS không trả về "số feature" như WFS, nên ta chỉ biết layer load được
    // hay không qua sự kiện tileerror / tileload của Leaflet.
    tileLayer.on('load', () => {
      state.status = 'ready';
      state.message = 'WMS OK';
    });
    tileLayer.on('tileerror', () => {
      state.status = 'error';
      state.message = 'Không tải được tile — kiểm tra tên layer hoặc CORS';
    });

    tileLayer.addTo(map);
  }

  function remove() {
    if (tileLayer) {
      map.removeLayer(tileLayer);
      tileLayer = null;
    }
  }

  return { add, remove };
}
