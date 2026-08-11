import type { LayerConfig } from "../types/layers";
import districtsGeoJson from "../data/hcm-districts.geojson.json";

export const LAYERS: LayerConfig[] = [
  {
    id: "admin",
    name: "Ranh giới hành chính",
    description: "22 quận/huyện TP.HCM",
    icon: "analytics-outline",
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
    icon: "subway-outline",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl:
        "https://ows.terrestris.de/osm/service",
      layers: "OSM-WMS",
    },
  },
  {
    id: "water",
    name: "Thủy hệ",
    description: "Sông, kênh, rạch, mặt nước toàn quốc",
    icon: "boat-outline",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl:
        "https://data.opendevelopmentmekong.net/geoserver/ODMekong/river/wms",
      layers: "river",
    }, 
  },
  {
    id: "landuse",
    name: "Sử dụng đất",
    description: "Phân rạch hệ thống đất toàn quốc",
    icon: "globe-outline",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl:
        "https://data.vietnam.opendevelopmentmekong.net/geoserver/ODVietnam/wms",
      layers: "ODVietnam:landcover2020",
    }, 
  },
  {
    id: "planning",
    name: "Sân bay",
    description:
      "Danh sách sân bay tại Việt Nam 2018",
    icon: "airplane-outline",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl:
        "https://data.opendevelopmentmekong.net/geoserver/ODMekong/airport/wms",
      layers: "ODVietnam:airport",
    }, 
    // Khi xin được quyền dùng dữ liệu quy hoạch chính thức (theo Nghị định
    // 73/2017/NĐ-CP + QĐ 37/2018/QĐ-UBND, xem hướng dẫn công bố dữ liệu
    // trên geoportal-stnmt.tphcm.gov.vn), thay bằng WMS hoặc WFS thật.
  },
];
