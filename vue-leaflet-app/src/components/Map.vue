<script setup lang="ts">
import { computed, ref } from 'vue';

interface MapLayer {
  id: string;
  name: string;
  thumbnail: string;
  type: 'basemap' | 'overlay';
  defaultOn?: boolean;
}

// Danh sách layer.
// Sau này bạn có thể chuyển danh sách này sang layers.config.ts
const layers: MapLayer[] = [
  {
    id: 'streets',
    name: 'Đường phố',
    thumbnail: '/thumbnails/streets.png',
    type: 'basemap',
    defaultOn: true,
  },
  {
    id: 'terrain',
    name: 'Địa hình',
    thumbnail: '/thumbnails/terrain.png',
    type: 'basemap',
    defaultOn: false,
  },
  {
    id: 'satellite',
    name: 'Vệ tinh',
    thumbnail: '/thumbnails/satellite.png',
    type: 'basemap',
    defaultOn: false,
  },
  {
    id: 'traffic',
    name: 'Giao thông',
    thumbnail: '/thumbnails/traffic.png',
    type: 'overlay',
    defaultOn: false,
  },
  {
    id: 'airport',
    name: 'Sân bay',
    thumbnail: '/thumbnails/airport.png',
    type: 'overlay',
    defaultOn: false,
  },
];

// Layer đang được chọn
const activeLayerId = ref(
  layers.find((layer) => layer.defaultOn)?.id ?? ''
);

// Trạng thái mở rộng danh sách layer
const showMore = ref(false);

// Số layer hiển thị ban đầu
const visibleLayerCount = 4;

// Các layer được hiển thị trên UI
const visibleLayers = computed(() => {
  if (showMore.value) {
    return layers;
  }

  return layers.slice(0, visibleLayerCount);
});

// Các layer còn lại
const hasMoreLayers = computed(() => {
  return layers.length > visibleLayerCount;
});

const emit = defineEmits<{
  (event: 'select', layer: MapLayer): void;
}>();

/**
 * Chọn một layer
 */
function selectLayer(layer: MapLayer) {
  // Nếu là basemap thì chỉ có một basemap active
  if (layer.type === 'basemap') {
    activeLayerId.value = layer.id;
  }

  emit('select', layer);
}

/**
 * Mở / đóng danh sách layer
 */
function toggleMore() {
  showMore.value = !showMore.value;
}
</script>

<template>
  <div class="map-layer-selector">
    <div class="layer-list">
      <!-- Layer -->
      <button
        v-for="layer in visibleLayers"
        :key="layer.id"
        class="layer-item"
        :class="{
          active: activeLayerId === layer.id,
        }"
        type="button"
        @click="selectLayer(layer)"
      >
        <div class="thumbnail-wrapper">
          <img
            class="thumbnail"
            :src="layer.thumbnail"
            :alt="layer.name"
          />
        </div>

        <span class="layer-name">
          {{ layer.name }}
        </span>
      </button>

      <!-- Xem thêm -->
      <button
        v-if="hasMoreLayers"
        class="layer-item more-button"
        type="button"
        @click="toggleMore"
      >
        <div class="more-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <span class="layer-name">
          {{ showMore ? 'Thu gọn' : 'Xem thêm' }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.map-layer-selector {
  position: absolute;

  /*
   * Đặt selector ở phía dưới bản đồ,
   * tương tự vị trí layer selector của Google Maps.
   */
  bottom: 20px;
  left: 20px;

  z-index: 1000;

  max-width: calc(100vw - 40px);

  background: #ffffff;
  border-radius: 16px;

  padding: 8px;

  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.12);
}

.layer-list {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

/*
 * Mỗi layer item
 */
.layer-item {
  position: relative;

  width: 96px;

  padding: 0;

  border: none;
  background: transparent;

  cursor: pointer;

  display: flex;
  flex-direction: column;
  align-items: center;

  font-family: inherit;
}

/*
 * Thumbnail
 */
.thumbnail-wrapper {
  width: 96px;
  height: 58px;

  overflow: hidden;

  border-radius: 12px;

  border: 2px solid transparent;

  box-sizing: border-box;

  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.thumbnail {
  width: 100%;
  height: 100%;

  object-fit: cover;

  display: block;
}

/*
 * Tên layer
 */
.layer-name {
  margin-top: 5px;

  font-size: 14px;
  line-height: 18px;

  color: #444;

  text-align: center;

  white-space: nowrap;
}

/*
 * Layer đang active
 */
.layer-item.active .thumbnail-wrapper {
  border-color: #008577;
}

.layer-item.active .layer-name {
  color: #008577;
  font-weight: 500;
}

/*
 * Hover
 */
.layer-item:hover .thumbnail-wrapper {
  transform: translateY(-2px);
}

/*
 * Nút xem thêm
 */
.more-icon {
  width: 96px;
  height: 58px;

  border-radius: 12px;

  background: #f1f3f4;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.more-icon span {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #555;
}

/*
 * Responsive cho màn hình nhỏ
 */
@media (max-width: 768px) {
  .map-layer-selector {
    left: 10px;
    bottom: 10px;

    max-width: calc(100vw - 20px);

    overflow-x: auto;
  }

  .layer-list {
    gap: 6px;
  }

  .layer-item,
  .thumbnail-wrapper,
  .more-icon {
    width: 80px;
  }

  .thumbnail-wrapper,
  .more-icon {
    height: 50px;
  }

  .layer-name {
    font-size: 12px;
  }
}
</style>