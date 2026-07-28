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

Trước khi thêm layer, định nghĩa các kiểu dữ liệu dùng chung trong `src/types/layers.ts` — mỗi layer sẽ thuộc 1 trong các "nguồn" (`source.kind`): `static` (GeoJSON tĩnh), `overpass` (fetch động từ Overpass API), `wms` (tile raster từ GeoServer):
```ts
export type LayerSourceKind = 'wms' | 'wfs' | 'overpass' | 'static';

export interface OverpassSourceConfig {
  kind: 'overpass';
  query: string; // câu truy vấn Overpass QL, đã bao gồm bbox
}

export interface StaticSourceConfig {
  kind: 'static';
  data: GeoJSON.FeatureCollection; // GeoJSON đã import tĩnh
}

export interface LayerConfig {
  id: string;
  name: string;
  description: string;
  color: string;
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
import districtsGeoJson from '../data/hcm-districts.geojson.json';

const BBOX = '10.70,106.60,10.90,106.78'; // south,west,north,east

export const LAYERS: LayerConfig[] = [
  {
    id: 'admin',
    name: 'Ranh giới hành chính',
    color: '#1b1f23',
    defaultOn: true,
    source: { kind: 'static', data: districtsGeoJson as GeoJSON.FeatureCollection },
  },
  {
    id: 'roads',
    name: 'Giao thông',
    color: '#c2410c',
    defaultOn: true,
    source: {
      kind: 'overpass',
      query: `[out:json][timeout:25];
        (way["highway"~"^(motorway|trunk|primary|secondary)$"](${BBOX}););
        out geom;`,
    },
  },
];
```

### Bước 3/ Viết composable hiển thị dữ liệu GeoJSON tĩnh (`static`)

Với layer có dữ liệu import sẵn (ví dụ ranh giới hành chính), không cần fetch — chỉ cần đưa thẳng object GeoJSON vào `L.geoJSON()`. Tạo `src/composables/useStaticGeoJsonLayer.ts`:
```ts
export function useStaticGeoJsonLayer(map: L.Map, source: StaticSourceConfig, color: string) {
  let geoLayer: L.GeoJSON | null = null;

  function add(state: LayerRuntimeState) {
    state.status = 'loading';
    geoLayer = L.geoJSON(source.data, {
      style: { color, weight: 1.6, fillColor: color, fillOpacity: 0.04 },
      onEachFeature: (f, layer) => layer.bindPopup(`<b>${f.properties?.name ?? '(không tên)'}</b>`),
    }).addTo(map);
    state.status = 'ready';
    state.featureCount = source.data.features.length;
  }

  function remove() {
    if (geoLayer) map.removeLayer(geoLayer);
  }

  return { add, remove };
}
```

### Bước 4/ Viết composable fetch dữ liệu từ Overpass API (`overpass`)

Với các layer chưa có nguồn WMS/WFS chính thức (giao thông, thuỷ hệ, sử dụng đất, quy hoạch), fetch trực tiếp từ Overpass API rồi tự convert kết quả sang GeoJSON trước khi vẽ. Tạo `src/composables/useOverpassLayer.ts`:
```ts
const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';

function overpassToGeoJSON(data: OverpassResponse): GeoJSON.FeatureCollection {
  // gộp geometry [{lat, lon}, ...] của từng element thành Polygon/LineString
  // rồi trả về { type: 'FeatureCollection', features: [...] }
}

export function useOverpassLayer(map: L.Map, source: OverpassSourceConfig, color: string) {
  let geoLayer: L.GeoJSON | null = null;

  async function add(state: LayerRuntimeState) {
    state.status = 'loading';
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(source.query),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const geojson = overpassToGeoJSON(await res.json());

      geoLayer = L.geoJSON(geojson, {
        style: { color, weight: 2, fillColor: color, fillOpacity: 0.15 },
        pointToLayer: (_f, latlng) => L.circleMarker(latlng, { radius: 4, color }),
      }).addTo(map);

      state.featureCount = geojson.features.length;
      state.status = geojson.features.length > 0 ? 'ready' : 'empty';
    } catch (err) {
      state.status = 'error';
      state.message = err instanceof Error ? err.message : String(err);
    }
  }

  function remove() {
    if (geoLayer) map.removeLayer(geoLayer);
  }

  return { add, remove };
}
```

### Bước 5/ Viết composable cho tile raster từ GeoServer (`wms`)

Với layer có nguồn WMS thật, không cần tự fetch — giao cho `L.tileLayer.wms` tự request ảnh tile theo từng ô khi pan/zoom. Tạo `src/composables/useWmsLayer.ts`:
```ts
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
    tileLayer.on('load', () => (state.status = 'ready'));
    tileLayer.on('tileerror', () => (state.status = 'error'));
    tileLayer.addTo(map);
  }

  function remove() {
    if (tileLayer) map.removeLayer(tileLayer);
  }

  return { add, remove };
}
```

### Bước 6/ Điều phối các layer bằng `useLayerManager`

`src/composables/useLayerManager.ts` nhận `LAYERS` và, dựa vào `source.kind` của từng layer, chọn đúng composable ở Bước 3-5 để xử lý — đồng thời tạo state reactive để UI theo dõi trạng thái từng layer:
```ts
export function useLayerManager(map: L.Map, layers: LayerConfig[]) {
  const state = reactive<Record<string, LayerRuntimeState>>(
    Object.fromEntries(layers.map((l) => [l.id, { status: 'idle' }])),
  );
  const handlers = new Map<string, { add: (s: LayerRuntimeState) => void | Promise<void>; remove: () => void }>();

  for (const cfg of layers) {
    switch (cfg.source.kind) {
      case 'wms': handlers.set(cfg.id, useWmsLayer(map, cfg.source)); break;
      case 'overpass': handlers.set(cfg.id, useOverpassLayer(map, cfg.source, cfg.color)); break;
      case 'static': handlers.set(cfg.id, useStaticGeoJsonLayer(map, cfg.source, cfg.color)); break;
    }
  }

  async function toggle(id: string, on: boolean) {
    const handler = handlers.get(id);
    if (!handler) return;
    if (on) await handler.add(state[id]);
    else { handler.remove(); state[id] = { status: 'idle' }; }
  }

  async function initDefaults() {
    for (const cfg of layers) if (cfg.defaultOn) await toggle(cfg.id, true);
  }

  return { state, toggle, initDefaults };
}
```

### Bước 7/ Gắn layer vào bản đồ và UI (`Map.vue`)

Khởi tạo bản đồ, sau đó khởi tạo `useLayerManager(map, LAYERS)` và bật sẵn các layer có `defaultOn: true`:
```ts
map = L.map('map').setView([startLat, startLng], 15);
L.tileLayer(`https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${maptilerKey}`, {
  tileSize: 512,
  zoomOffset: -1,
}).addTo(map);

manager = useLayerManager(map, LAYERS);
layerState.value = manager.state;
manager.initDefaults();
```

Render danh sách checkbox từ `LAYERS` để người dùng bật/tắt từng layer — mỗi lần đổi checkbox sẽ gọi `manager.toggle()`, và trạng thái (`loading`/`ready`/`error`, số lượng feature) tự cập nhật lên UI nhờ `layerState` là reactive:
```html
<label v-for="cfg in LAYERS" :key="cfg.id" class="layer-row">
  <input type="checkbox" :checked="cfg.defaultOn" @change="onToggle(cfg.id, $event)" />
  <span class="swatch" :style="{ background: cfg.color }"></span>
  <span class="name">{{ cfg.name }}</span>
  <span v-if="layerState?.[cfg.id]" class="status">
    {{ statusLabel[layerState[cfg.id].status] }}
    ({{ layerState[cfg.id].featureCount }} đối tượng)
  </span>
</label>
```
```ts
function onToggle(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  manager?.toggle(id, checked);
}
```
