import type { LayerConfig } from '../types/layers';
import districtsGeoJson from '../data/hcm-districts.geojson.json';

// bbox trung tâm TP.HCM: south,west,north,east
const BBOX = '10.70,106.60,10.90,106.78';
const BBOX_TIGHT = '10.74,106.62,10.84,106.72'; // vùng nhỏ hơn cho landuse (tránh timeout)

export const LAYERS: LayerConfig[] = [
  {
    id: 'admin',
    name: 'Ranh giới hành chính',
    description: '22 quận/huyện TP.HCM — GeoJSON tĩnh',
    color: '#1b1f23',
    defaultOn: true,
    source: {
      kind: 'static',
      data: districtsGeoJson as GeoJSON.FeatureCollection,
    },
  },
  {
    id: 'roads',
    name: 'Giao thông',
    description: 'Trục đường chính (motorway/trunk/primary/secondary)',
    color: '#c2410c',
    defaultOn: true,
    source: {
      kind: 'overpass',
      query: `[out:json][timeout:25];
        (way["highway"~"^(motorway|trunk|primary|secondary)$"](${BBOX}););
        out geom;`,
    },
    // Khi có layer WMS thật, thay bằng:
    // source: { kind: 'wms', baseUrl: 'https://geodata-stnmt.tphcm.gov.vn/geoserver/tnmt/wms', layers: 'tnmt:giao_thong' },
  },
  {
    id: 'water',
    name: 'Thủy hệ',
    description: 'Sông, kênh, rạch, mặt nước',
    color: '#1d4ed8',
    defaultOn: true,
    source: {
      kind: 'overpass',
      query: `[out:json][timeout:25];
        (way["waterway"~"^(river|canal|stream)$"](${BBOX});
         way["natural"="water"](${BBOX}););
        out geom;`,
    },
  },
  {
    id: 'landuse',
    name: 'Sử dụng đất',
    description: 'Đất ở / thương mại / công nghiệp / nông nghiệp',
    color: '#65a30d',
    defaultOn: false,
    source: {
      kind: 'overpass',
      query: `[out:json][timeout:25];
        (way["landuse"~"^(residential|commercial|industrial|farmland)$"](${BBOX_TIGHT}););
        out geom;`,
    },
  },
  {
    id: 'planning',
    name: 'Quy hoạch (tạm thay bằng không gian xanh)',
    description:
      'Cổng quy hoạch TP.HCM không có API mở công khai — tạm dùng công viên/khu vui chơi làm placeholder',
    color: '#047857',
    defaultOn: false,
    source: {
      kind: 'overpass',
      query: `[out:json][timeout:25];
        (way["leisure"="park"](${BBOX});
         way["landuse"="recreation_ground"](${BBOX}););
        out geom;`,
    },
    // Khi xin được quyền dùng dữ liệu quy hoạch chính thức (theo Nghị định
    // 73/2017/NĐ-CP + QĐ 37/2018/QĐ-UBND, xem hướng dẫn công bố dữ liệu
    // trên geoportal-stnmt.tphcm.gov.vn), thay bằng WMS hoặc WFS thật.
  },
];
