// src/composables/useStaticGeoJsonLayer.ts
// Composable đơn giản nhất: dữ liệu đã có sẵn trong bundle (import tĩnh),
// không cần fetch — dùng cho lớp ranh giới hành chính.

import L from 'leaflet';
import type { StaticSourceConfig, LayerRuntimeState } from '../types/layers';

export function useStaticGeoJsonLayer(
  map: L.Map,
  source: StaticSourceConfig,
  color: string,
) {
  let geoLayer: L.GeoJSON | null = null;

  function add(state: LayerRuntimeState) {
    state.status = 'loading';
    geoLayer = L.geoJSON(source.data, {
      style: { color, weight: 1.6, fillColor: color, fillOpacity: 0.04 },
      onEachFeature: (f, layer) => {
        const name = (f.properties as { name?: string } | null)?.name ?? '(không tên)';
        layer.bindPopup(`<b>${name}</b>`);
      },
    }).addTo(map);
    state.status = 'ready';
    state.featureCount = source.data.features.length;
  }

  function remove() {
    if (geoLayer) {
      map.removeLayer(geoLayer);
      geoLayer = null;
    }
  }

  return { add, remove };
}
