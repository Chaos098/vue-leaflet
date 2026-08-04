# Task 2
## Thời gian hoàn thành dự kiến: 29/07/2026 (Thứ 4 tuần sau)

## Mô tả
Sử dụng các API bên ngoài để fetching dữ liệu hình thành các layer (ranh giới hành chính, giao thông, thuỷ hệ, quy hoạch đất, sử dụng đất, v.v)

## Danh sách lớp bản đồ sử dụng
1. Lớp Ranh giới hành chính
Sử dụng dữ liệu được tạo sẵn trên github: "https://github.com/nguyencaonhan271201/tphcm_district_boundaries.git"
Dữ liệu được tạo dưới dạng GeoJSON dễ dàng xử lý, tạo ranh giới qua các toạ độ trên dữ liệu

2. Lớp thuỷ hệ & Lớp giao thông & Lớp quy hoạch đất & Lớp sử dụng đất
Sử dụng API Overpass để lấy dữ liệu của từng lớp: "https://overpass.kumi.systems/api/interpreter"


## Hướng dẫn xây dựng dự án

### Bước 1/ Định nghĩa kiểu dữ liệu chung cho layer

Trước khi thêm layer, định nghĩa các kiểu dữ liệu dùng chung trong `src/types/layers.ts` — mỗi layer sẽ thuộc 1 trong các "nguồn" (`source.kind`): `static` (GeoJSON tĩnh), `overpass` (fetch động từ Overpass API), `wms` (tile raster từ GeoServer), `wfs` (chưa cài handler, dự phòng):
```ts
export type LayerSourceKind = 'wms' | 'wfs' | 'overpass' | 'static';

export interface WmsSourceConfig {
  kind: 'wms';
  baseUrl: string; // URL gốc GeoServer, ví dụ: https://ows.terrestris.de/osm/service
  layers: string; // tên layer trên GeoServer, dạng "workspace:layer_name"
  transparent?: boolean;
  format?: string;
}

export interface WfsSourceConfig {
  kind: 'wfs';
  baseUrl: string;
  typeName: string; // "workspace:layer_name"
  version?: '1.0.0' | '2.0.0';
}

export interface OverpassSourceConfig {
  kind: 'overpass';
  color: string;
  query: string; // câu truy vấn Overpass QL, đã bao gồm bbox
}

export interface StaticSourceConfig {
  kind: 'static';
  color: string;
  data: GeoJSON.FeatureCollection; // GeoJSON đã import tĩnh
}

export type LayerSource =
  | WmsSourceConfig
  | WfsSourceConfig
  | OverpassSourceConfig
  | StaticSourceConfig;

export interface LayerConfig {
  id: string;
  name: string;
  description: string;
  source: LayerSource;
  defaultOn?: boolean;
}

export interface LayerRuntimeState {
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error';
  message?: string;
  featureCount?: number;
}
```

### Bước 2/ Khai báo danh sách layer

Trong `src/config/layers.config.ts`, khai báo mảng `LAYERS`, mỗi phần tử ứng với 1 layer trên bản đồ và chỉ định nguồn dữ liệu tương ứng:
```ts
import type { LayerConfig } from "../types/layers";
import districtsGeoJson from "../data/hcm-districts.geojson.json";

export const LAYERS: LayerConfig[] = [
  {
    id: "admin",
    name: "Ranh giới hành chính",
    description: "22 quận/huyện TP.HCM",
    defaultOn: true,
    source: {
      kind: "static",
      color: "#FF0000",
      data: districtsGeoJson as GeoJSON.FeatureCollection,
    },
  },
  {
    id: "roads",
    name: "Giao thông",
    description: "Trục đường chính (motorway/trunk/primary/secondary)",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl: "https://ows.terrestris.de/osm/service",
      layers: "OSM-WMS",
    },
  },
  {
    id: "water",
    name: "Thủy hệ",
    description: "Sông, kênh, rạch, mặt nước toàn quốc",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl: "https://data.opendevelopmentmekong.net/geoserver/ODMekong/river/wms",
      layers: "river",
    },
  },
  {
    id: "landuse",
    name: "Sử dụng đất",
    description: "Phân rạch hệ thống đất toàn quốc",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl: "https://data.vietnam.opendevelopmentmekong.net/geoserver/ODVietnam/wms",
      layers: "ODVietnam:landcover2020",
    },
  },
  {
    id: "planning",
    name: "Sân bay",
    description: "Danh sách sân bay tại Việt Nam 2018",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl: "https://data.opendevelopmentmekong.net/geoserver/ODMekong/airport/wms",
      layers: "ODVietnam:airport",
    },
    // Khi xin được quyền dùng dữ liệu quy hoạch chính thức (theo Nghị định
    // 73/2017/NĐ-CP + QĐ 37/2018/QĐ-UBND), thay bằng WMS hoặc WFS thật.
  },
];
```

### Bước 3/ Viết composable hiển thị dữ liệu GeoJSON tĩnh (`static`)

Với layer có dữ liệu import sẵn (ví dụ ranh giới hành chính), không cần fetch — chỉ cần đưa thẳng object GeoJSON vào `L.geoJSON()`, màu vẽ lấy trực tiếp từ `source.color`. Tạo `src/composables/useStaticGeoJsonLayer.ts`:
```ts
import L from 'leaflet';
import type { StaticSourceConfig, LayerRuntimeState } from '../types/layers';

export function useStaticGeoJsonLayer(map: L.Map, source: StaticSourceConfig) {
  let geoLayer: L.GeoJSON | null = null;

  function add(state: LayerRuntimeState) {
    state.status = 'loading';
    geoLayer = L.geoJSON(source.data, {
      style: { color: source.color, weight: 1.6, fillColor: source.color, fillOpacity: 0.04 },
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
```

### Bước 4/ Viết composable fetch dữ liệu từ Overpass API (`overpass`)

Layer này hiện không còn nằm trong `LAYERS` mặc định (4 layer giao thông/thuỷ hệ/sử dụng đất/quy hoạch đã chuyển sang dùng WMS ở Bước 2), nhưng composable vẫn được giữ lại trong `src/composables/useOverpassLayer.ts` cho các layer chưa xác định được nguồn WMS/WFS thật — fetch trực tiếp từ Overpass API rồi tự convert kết quả sang GeoJSON trước khi vẽ:
```ts
import L from 'leaflet';
import type { OverpassSourceConfig, LayerRuntimeState } from '../types/layers';

const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function overpassToGeoJSON(data: OverpassResponse): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const el of data.elements) {
    if (!el.geometry || el.geometry.length === 0) continue;
    const coords = el.geometry.map((p) => [p.lon, p.lat]);
    const isClosed =
      coords.length > 2 &&
      coords[0][0] === coords[coords.length - 1][0] &&
      coords[0][1] === coords[coords.length - 1][1];

    const geometry: GeoJSON.Geometry = isClosed
      ? { type: 'Polygon', coordinates: [coords] }
      : { type: 'LineString', coordinates: coords };

    features.push({ type: 'Feature', properties: el.tags ?? {}, geometry });
  }

  return { type: 'FeatureCollection', features };
}

export function useOverpassLayer(map: L.Map, source: OverpassSourceConfig) {
  let geoLayer: L.GeoJSON | null = null;
  let aborted = false;

  async function add(state: LayerRuntimeState) {
    state.status = 'loading';
    aborted = false;
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(source.query),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: OverpassResponse = await res.json();
      if (aborted) return;

      const geojson = overpassToGeoJSON(json);

      geoLayer = L.geoJSON(geojson, {
        style: { color: source.color, weight: 2, fillColor: source.color, fillOpacity: 0.15 },
        pointToLayer: (_f, latlng) => L.circleMarker(latlng, { radius: 4 }),
        onEachFeature: (f, layer) => {
          const tags = f.properties ?? {};
          const label = tags.name ?? tags.landuse ?? tags.waterway ?? tags.highway ?? '—';
          layer.bindPopup(`<b>${label}</b>`);
        },
      }).addTo(map);

      state.featureCount = geojson.features.length;
      state.status = geojson.features.length > 0 ? 'ready' : 'empty';
    } catch (err) {
      if (aborted) return;
      state.status = 'error';
      state.message = err instanceof Error ? err.message : String(err);
    }
  }

  function remove() {
    aborted = true;
    if (geoLayer) {
      map.removeLayer(geoLayer);
      geoLayer = null;
    }
  }

  return { add, remove };
}
```

### Bước 5/ Viết composable cho tile raster từ GeoServer (`wms`)

Với layer có nguồn WMS thật (giao thông, thuỷ hệ, sử dụng đất, sân bay — xem Bước 2), không cần tự fetch — giao cho `L.tileLayer.wms` tự request ảnh tile theo từng ô khi pan/zoom. Tạo `src/composables/useWmsLayer.ts`:
```ts
import L from 'leaflet';
import type { WmsSourceConfig, LayerRuntimeState } from '../types/layers';

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
    // hay không qua sự kiện tileerror / load của Leaflet.
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
```

### Bước 6/ Điều phối các layer bằng `useLayerManager`

`src/composables/useLayerManager.ts` nhận `LAYERS` và, dựa vào `source.kind` của từng layer, chọn đúng composable ở Bước 3-5 để xử lý — đồng thời tạo state reactive để UI theo dõi trạng thái từng layer. Trường hợp `wfs` (chưa cài handler) sẽ ném lỗi ngay khi khởi tạo:
```ts
import { reactive } from 'vue';
import type L from 'leaflet';
import type { LayerConfig, LayerRuntimeState } from '../types/layers';
import { useWmsLayer } from './useWmsLayer';
import { useOverpassLayer } from './useOverpassLayer';
import { useStaticGeoJsonLayer } from './useStaticGeoJsonLayer';

export function useLayerManager(map: L.Map, layers: LayerConfig[]) {
  const state = reactive<Record<string, LayerRuntimeState>>(
    Object.fromEntries(layers.map((l) => [l.id, { status: 'idle' } as LayerRuntimeState])),
  );
  const handlers = new Map<string, { add: (s: LayerRuntimeState) => void | Promise<void>; remove: () => void }>();

  for (const cfg of layers) {
    switch (cfg.source.kind) {
      case 'wms':
        handlers.set(cfg.id, useWmsLayer(map, cfg.source));
        break;
      case 'overpass':
        handlers.set(cfg.id, useOverpassLayer(map, cfg.source));
        break;
      case 'static':
        handlers.set(cfg.id, useStaticGeoJsonLayer(map, cfg.source));
        break;
      case 'wfs':
        throw new Error(`Layer "${cfg.id}": WFS handler chưa cài — xem ghi chú trong useWfsLayer.ts nếu bạn thêm.`);
    }
  }

  async function toggle(id: string, on: boolean) {
    const handler = handlers.get(id);
    if (!handler) return;
    if (on) {
      await handler.add(state[id]);
    } else {
      handler.remove();
      state[id] = { status: 'idle' };
    }
  }

  async function initDefaults() {
    for (const cfg of layers) {
      if (cfg.defaultOn) await toggle(cfg.id, true);
    }
  }

  return { state, toggle, initDefaults };
}
```

### Bước 7/ Gắn layer vào bản đồ và UI (`Map.vue`)

Khởi tạo bản đồ nền (MapTiler), geocode vị trí trung tâm/marker, sau đó khởi tạo `useLayerManager(map, LAYERS)` và bật sẵn các layer có `defaultOn: true`:
```ts
onMounted(async () => {
  config.apiKey = maptilerKey;
  const center = await geocoding.forward("273 Điện Biên Phủ, Phường Xuân Hòa, Thành phố Hồ Chí Minh.");
  const start = await geocoding.forward("Việt Nam");
  const [centerLng, centerLat] = center.features[0].center;
  const [startLng, startLat] = start.features[0].center;

  map = L.map('map').setView([startLat, startLng], 15);
  L.tileLayer(`https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${maptilerKey}`, {
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    crossOrigin: true,
  }).addTo(map);

  map.flyTo([centerLat, centerLng]);
  L.marker([centerLat, centerLng], { icon: marker }).addTo(map).bindPopup("Sở Khoa học Công nghệ");

  manager = useLayerManager(map, LAYERS);
  layerState.value = manager.state;
  manager.initDefaults();
});
```

Render danh sách checkbox từ `LAYERS` để người dùng bật/tắt từng layer — mỗi lần đổi checkbox sẽ gọi `manager.toggle()`, và trạng thái (`loading`/`ready`/`error`, số lượng feature) tự cập nhật lên UI nhờ `layerState` là reactive:
```html
<label v-for="cfg in LAYERS" :key="cfg.id" class="layer-row">
  <input type="checkbox" :checked="cfg.defaultOn" @change="onToggle(cfg.id, $event)" />
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
```
```ts
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
```
