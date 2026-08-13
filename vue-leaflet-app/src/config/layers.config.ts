import type { LayerConfig } from "../types/layers";
import districtsGeoJson from "../data/hcm-districts.geojson.json";

export const LAYERS: LayerConfig[] = [
  {
    id: "admin",
    name: "Ranh giới hành chính",
    description: "22 quận/huyện TP.HCM",
    icon: "mingcute:map-line",
    defaultOn: true,
    source: {
      kind: "static",
      color: "#FF0000",
      data: districtsGeoJson as GeoJSON.FeatureCollection,
    },
  },
  {
    id: "roads",
    name: "Cảng hàng hải",
    description: "Vị trí của các cảng hàng hải tại Việt Nam",
    icon: "carbon:harbor",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl: "https://data.opendevelopmentmekong.net/geoserver/ODMekong/harbor/wms",
      layers: "harbor",
    },
  },
  {
    id: "water",
    name: "Thủy hệ",
    description: "Sông, kênh, rạch, mặt nước toàn quốc",
    icon: "ic:sharp-water",
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
    name: "Ga xe lửa",
    description: "Vị trí các nhà ga xe lửa trên toàn Việt Nam",
    icon: "fluent-emoji-high-contrast:station",
    defaultOn: false,
    source: {
      kind: "wms",
      // baseUrl:
      //   "https://data.vietnam.opendevelopmentmekong.net/geoserver/ODVietnam/wms",
      // layers: "ODVietnam:landcover2020",
      // baseUrl:
      //   "https://data.opendevelopmentmekong.net/geoserver/ODMekong/station/wmsß",
      // layers: "station"
      baseUrl:
        "https://data.opendevelopmentmekong.net/geoserver/ODMekong/station/wms",
      layers: "station"
    }, 
  },
  {
    id: "planning",
    name: "Sân bay",
    description:
      "Danh sách sân bay tại Việt Nam 2018",
    icon: "pinhead:airport-terminal-with-plane-takeoff",
    defaultOn: false,
    source: {
      kind: "wms",
      baseUrl:
        "https://data.opendevelopmentmekong.net/geoserver/ODMekong/airport/wms",
      layers: "ODVietnam:airport",
      // baseUrl:
      //   "https://geodata-stnmt.tphcm.gov.vn/geoserver/wms",
      // layers: "dulieunen:cacdoituongduongbokhacc"
    }, 
    // Khi xin được quyền dùng dữ liệu quy hoạch chính thức (theo Nghị định
    // 73/2017/NĐ-CP + QĐ 37/2018/QĐ-UBND, xem hướng dẫn công bố dữ liệu
    // trên geoportal-stnmt.tphcm.gov.vn), thay bằng WMS hoặc WFS thật.
  },
];
