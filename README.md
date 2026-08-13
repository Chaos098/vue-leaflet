# Task 3
## Thời gian hoàn thành dự kiến: 05/08/2026 (Thứ 4 tuần sau)

## Mô tả
Xây dựng bộ chọn lớp bản đồ (layer selector) hiển thị icon riêng cho từng overlay, và bộ chuyển đổi nền bản đồ (basemap) dạng nút thumbnail — thay cho danh sách checkbox thuần chữ trước đó.

## Danh sách lớp bản đồ sử dụng
1. Lớp Ranh giới hành chính
Sử dụng dữ liệu được tạo sẵn trên github: "https://github.com/nguyencaonhan271201/tphcm_district_boundaries.git"
Dữ liệu được tạo dưới dạng GeoJSON dễ dàng xử lý, tạo ranh giới qua các toạ độ trên dữ liệu

2. Lớp thuỷ hệ & Lớp giao thông & Lớp quy hoạch đất & Lớp sử dụng đất
Sử dụng WMS để lấy dữ liệu của từng lớp từ GeoServer công khai (xem `src/config/layers.config.ts`) — mỗi lớp có thêm 1 icon riêng để hiển thị trên bộ chọn lớp.


## Hướng dẫn xây dựng dự án

### Bước 1/ Thêm icon cho từng layer trong kiểu dữ liệu chung

Mở rộng `LayerConfig` trong `src/types/layers.ts`, thêm field `icon` (tên icon theo bộ Ionicons) để mỗi layer có 1 icon riêng hiển thị trên UI:
```ts
export interface LayerConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  source: LayerSource;
  defaultOn?: boolean;
}
```

### Bước 2/ Khai báo icon cho từng layer

Trong `src/config/layers.config.ts`, gán icon tương ứng cho từng phần tử trong mảng `LAYERS`:
```ts
export const LAYERS: LayerConfig[] = [
  {
    id: "admin",
    name: "Ranh giới hành chính",
    description: "22 quận/huyện TP.HCM",
    icon: "analytics-outline",
    defaultOn: true,
    source: { kind: "static", color: "#FF0000", data: districtsGeoJson as GeoJSON.FeatureCollection },
  },
  {
    id: "roads",
    name: "Giao thông",
    description: "Trục đường chính (motorway/trunk/primary/secondary)",
    icon: "subway-outline",
    defaultOn: false,
    source: { kind: "wms", baseUrl: "https://ows.terrestris.de/osm/service", layers: "OSM-WMS" },
  },
  {
    id: "water",
    name: "Thủy hệ",
    description: "Sông, kênh, rạch, mặt nước toàn quốc",
    icon: "boat-outline",
    defaultOn: false,
    source: { kind: "wms", baseUrl: "https://data.opendevelopmentmekong.net/geoserver/ODMekong/river/wms", layers: "river" },
  },
  {
    id: "landuse",
    name: "Sử dụng đất",
    description: "Phân rạch hệ thống đất toàn quốc",
    icon: "globe-outline",
    defaultOn: false,
    source: { kind: "wms", baseUrl: "https://data.vietnam.opendevelopmentmekong.net/geoserver/ODVietnam/wms", layers: "ODVietnam:landcover2020" },
  },
  {
    id: "planning",
    name: "Sân bay",
    description: "Danh sách sân bay tại Việt Nam 2018",
    icon: "airplane-outline",
    defaultOn: false,
    source: { kind: "wms", baseUrl: "https://data.opendevelopmentmekong.net/geoserver/ODMekong/airport/wms", layers: "ODVietnam:airport" },
  },
];
```

### Bước 3/ Hiển thị icon động trong danh sách overlay (`MapView.vue`)

Lặp qua `LAYERS` và bind icon theo từng layer bằng `:name="cfg.icon"` (dùng `v-bind` để Vue lấy đúng giá trị `icon` của từng `cfg` trong vòng lặp, thay vì gán 1 chuỗi tĩnh cố định):
```html
<label v-for="cfg in LAYERS" :key="cfg.id" class="layer-row">
  <input type="checkbox" :checked="cfg.defaultOn" @change="onToggle(cfg.id, $event)" />
  <ion-icon :name="cfg.icon"></ion-icon>
  <span class="meta">
    <span class="name">{{ cfg.name }}</span>
    <span class="desc">{{ cfg.description }}</span>
  </span>
</label>
```

### Bước 4/ Xây dựng bộ chọn nền bản đồ dạng thumbnail (`MapLayerSelector.vue`)

Tạo component riêng chứa danh sách basemap kèm ảnh minh hoạ (`src/assets/Street.png`, `src/assets/Terrain.png`), hiển thị dạng nút bấm nổi ở góc bản đồ giống layer selector của Google Maps — mỗi nút có thumbnail + tên, nút ứng với basemap đang active được tô viền màu qua class `active`. Component chỉ nhận `activeBaseName` qua props và phát sự kiện `select` ra ngoài, không tự tạo hay đụng vào instance bản đồ:
```ts
import streetThumbnail from '../assets/Street.png'
import terrainThumbnail from '../assets/Terrain.png'

const props = defineProps<{ activeBaseName: string }>();
const emit = defineEmits<{ (e: 'select', name: string): void }>();

interface MapLayer {
  id: string;
  name: string;
  thumbnail: string;
  defaultOn: boolean;
}

const baseMapNames: MapLayer[] = [
  { id: 'street', name: 'Street', thumbnail: streetThumbnail, defaultOn: true },
  { id: 'terrain', name: 'Terrain', thumbnail: terrainThumbnail, defaultOn: false },
];
```
```html
<div class="map-layer-selector">
  <button
    v-for="map in baseMapNames"
    :key="map.id"
    :class="{ active: map.name === activeBaseName }"
    class="layer-row"
    type="button"
    @click="emit('select', map.name)"
  >
    <div class="thumbnail-wrapper">
      <img class="thumbnail" :src="map.thumbnail" :alt="map.name" />
    </div>
    <span class="meta">
      <span class="name">{{ map.name }}</span>
    </span>
  </button>
</div>
```

### Bước 5/ Kết nối selector với bản đồ thật qua `App.vue`

Vì `MapLayerSelector` không giữ instance bản đồ, `MapView.vue` expose sẵn hàm `switchBaseMap` để đổi tile layer nền khi được gọi từ ngoài:
```ts
// MapView.vue
function switchBaseMap(name: string) {
  if (!map || name === activeBaseName) return;
  const current = baseMaps[activeBaseName];
  const next = baseMaps[name];
  if (!current || !next) return;
  map.removeLayer(current);
  next.addTo(map);
  activeBaseName = name;
}

defineExpose({ switchBaseMap });
```

`App.vue` giữ `activeBaseName` làm nguồn state UI duy nhất, truyền xuống `MapLayerSelector` để tô nút đang active, đồng thời nhận sự kiện `select` để gọi `switchBaseMap` trên `MapView` thông qua template ref — nhờ vậy chỉ có duy nhất `MapView` được phép khởi tạo và chỉnh sửa Leaflet map, tránh 2 component tranh nhau 1 map instance:
```vue
<script setup lang="ts">
import { ref } from 'vue';
import MapView from './components/MapView.vue';
import MapLayerSelector from './components/MapLayerSelector.vue';

const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
const activeBaseName = ref('Street');

function handleLayerSelect(name: string) {
  activeBaseName.value = name;
  mapViewRef.value?.switchBaseMap(name);
}
</script>

<template>
  <MapView ref="mapViewRef" />

  <MapLayerSelector
    :active-base-name="activeBaseName"
    @select="handleLayerSelect"
  />
</template>
```
