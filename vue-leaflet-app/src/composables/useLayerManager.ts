import { reactive } from "vue";
import type L from "leaflet";
import type { LayerConfig } from "../types/layers";
import { useWmsLayer } from "./useWmsLayer";
// import { useOverpassLayer } from "./useOverpassLayer";
import { useStaticGeoJsonLayer } from "./useStaticGeoJsonLayer";

export function useLayerManager(map: L.Map, layers: LayerConfig[]) {
  // state[layerId] -> { status, message, featureCount }
  // const state = reactive<Record<string, boolean>>(
  //   Object.fromEntries(layers.map((l) => [l.id, { status: 'idle' } as LayerRuntimeState])),
  // );
  // handlers[layerId] -> { add, remove }
  // const handlers = new Map<
  //   string,
  //   { add: (s: LayerRuntimeState) => void | Promise<void>; remove: () => void }
  // >();

  const layerById = new Map<string, L.Layer>();

  const stateOn = reactive<Record<string, boolean>>(
    Object.fromEntries(layers.map((l) => [l.id, (l.defaultOn ?? false)])),
  );

  // Check if layer's been checked or not 
  // If checked -> add layer, not -> remove layer
  function toggleLayer(id: string, checked: boolean): void {
    const layer = layerById.get(id);
    if (!layer) return;

    if (checked) {
      map.addLayer(layer);
    }
    else {
      map.removeLayer(layer);
    }
    stateOn[id] = checked;
  }

  function createOverLayer(cfg: LayerConfig): L.Layer {
    switch (cfg.source.kind) {
      case "wms":
        return useWmsLayer(map, cfg.source);
      case "overpass":
        throw new Error("Overpass cần xử lý bất đồng bộ");
      case "static":
        return useStaticGeoJsonLayer(map, cfg.source);
      case "wfs":
        throw new Error(
          `Layer "${cfg.id}": WFS handler chưa cài — xem ghi chú trong useWfsLayer.ts nếu bạn thêm.`,
        );
    }
  }

  // Initialize layers and check defaultOn to turn which layer is on
  function initLayer() {
    for (const cfg of layers) {
      const layer = createOverLayer(cfg);
      layerById.set(cfg.id, layer);
      stateOn[cfg.id] = cfg.defaultOn ?? false;
      if (cfg.defaultOn) {
        layer.addTo(map);
      }
    }
  }
  return { createOverLayer, initLayer, toggleLayer, stateOn };
}
