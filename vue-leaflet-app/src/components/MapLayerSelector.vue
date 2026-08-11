<script setup lang="ts">
import { computed, ref } from 'vue';
import streetThumbnail from '../assets/Street.png'
import terrainThumbnail from '../assets/Terrain.png'
const props = defineProps<{
    activeBaseName: string;
}>();

const emit = defineEmits<{
    (e: 'select', name: string): void;
}>();

interface MapLayer {
    id: string,
    name: string,
    thumbnail: string,
    defaultOn: boolean
}

const baseMapNames: MapLayer[] = [
    {
        id: 'street',
        name: 'Street',
        thumbnail: streetThumbnail,
        defaultOn: true
    },
    {
        id: 'terrain',
        name: 'Terrain',
        thumbnail: terrainThumbnail,
        defaultOn: false
    }
];

const nextBaseMap = computed(() =>
    baseMapNames.find((map) => map.name !== props.activeBaseName) ?? baseMapNames[0]
);

// function onBaseChange(name: string) {
//     emit('select', name);
// }
</script>

<template>
    <button class="map-layer-selector" type="button" @click="emit('select', nextBaseMap.name)">
        <img class="thumbnail" :src="nextBaseMap.thumbnail" :alt="nextBaseMap.name" />
        <span class="layer-name">
            {{ nextBaseMap.name }}
        </span>
    </button>
</template>


<style scoped>
.map-layer-selector {
    border: none;
    padding: 0;
    position: absolute;
    bottom: 20px;
    left: 100px;
    z-index: 1000;
}

.thumbnail {
    height: 60px;
    width: 60px;
    display: block;
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


}
</style>
