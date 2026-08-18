import { reactive } from "vue";
import type L from "leaflet";
import type { LayerConfig, LayerRuntimeState } from "../types/layers";
import { useWmsLayer } from "./useWmsLayer";
import { useOverpassLayer } from "./useOverpassLayer";
import { useStaticGeoJsonLayer } from "./useStaticGeoJsonLayer";

export function useLayerManager(map: L.Map, layers: LayerConfig[]) {
  // state[layerId] -> { status, message, featureCount }
  // const state = reactive<Record<string, LayerRuntimeState>>(
  //   Object.fromEntries(layers.map((l) => [l.id, { status: 'idle' } as LayerRuntimeState])),
  // );

  // handlers[layerId] -> { add, remove }
  const handlers = new Map<
    string,
    { add: (s: LayerRuntimeState) => void | Promise<void>; remove: () => void }
  >();

  function createOverLayer(cfg: LayerConfig): L.Layer{
    switch (cfg.source.kind) {
      case "wms":
        return useWmsLayer(map, cfg.source);
      case "overpass":
      throw new Error("Overpass cần xử lý bất đồng bộ");
        // handlers.set(cfg.id, useWmsLayer(map, cfg.source));
        // break;
      // case "overpass":
      //   const overpass = useOverpassLayer(map, cfg.source);

      //   const layer = await overpass.getOverpassAPI();
      //   // handlers.set(cfg.id, useOverpassLayer(map, cfg.source));
      //   break;
      case "static":
        return useStaticGeoJsonLayer(map, cfg.source);
        // handlers.set(cfg.id, useStaticGeoJsonLayer(map, cfg.source));
        // break;
      case "wfs":
        throw new Error(
          `Layer "${cfg.id}": WFS handler chưa cài — xem ghi chú trong useWfsLayer.ts nếu bạn thêm.`,
        );
    }
  }
  // for (const cfg of layers) {
  //   switch (cfg.source.kind) {
  //     case 'wms':
  //       useWmsLayer(map, cfg.source)
  //       // handlers.set(cfg.id, useWmsLayer(map, cfg.source));
  //       break;
  //     case 'overpass':
  //       useOverpassLayer(map, cfg.source)
  //       // handlers.set(cfg.id, useOverpassLayer(map, cfg.source));
  //       break;
  //     case 'static':
  //       useStaticGeoJsonLayer(map, cfg.source)
  //       // handlers.set(cfg.id, useStaticGeoJsonLayer(map, cfg.source));
  //       break;
  //     case 'wfs':
  //       throw new Error(`Layer "${cfg.id}": WFS handler chưa cài — xem ghi chú trong useWfsLayer.ts nếu bạn thêm.`);
  //   }
  // }

  // Toggle to switch on/off each layer
  // async function toggle(id: string, on: boolean) {
  //   const handler = handlers.get(id);
  //   if (!handler) return;
  //   if (on) {
  //     await handler.add(state[id]);
  //   } else {
  //     handler.remove();
  //     state[id] = { status: 'idle' };
  //   }
  // }

  // async function initDefaults() {
  //   for (const cfg of layers) {
  //     if (cfg.defaultOn) await toggle(cfg.id, true);
  //   }
  // }

  // return { state, toggle, initDefaults };
  return { createOverLayer };
}
