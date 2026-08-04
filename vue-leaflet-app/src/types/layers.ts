// src/types/layers.ts
// Kiểu dữ liệu chung cho toàn bộ hệ thống layer.
// Mỗi lớp overlay trong app đều thuộc 1 trong 3 "nguồn" (source kind):
//   - "wms"      : ảnh raster lấy từ GeoServer thật (geodata-stnmt.tphcm.gov.vn)
//   - "overpass" : vector GeoJSON fetch động từ Overpass API (OSM) — dùng khi
//                  chưa xác nhận được layer WMS/WFS thật tương ứng
//   - "static"   : GeoJSON tĩnh import sẵn trong bundle (ranh giới hành chính)

export type LayerSourceKind = 'wms' | 'wfs' | 'overpass' | 'static';

export interface WmsSourceConfig {
  kind: 'wms';
  /** URL gốc của GeoServer, ví dụ: https://geodata-stnmt.tphcm.gov.vn/geoserver/tnmt/wms */
  baseUrl: string;
  /** Tên layer dạng "workspace:layer_name" — lấy từ Layer Preview hoặc GetCapabilities */
  layers: string;
  transparent?: boolean;
  format?: string;
}

export interface WfsSourceConfig {
  kind: 'wfs';
  /** URL endpoint OWS/WFS, ví dụ: https://geodata-stnmt.tphcm.gov.vn/geoserver/tnmt/ows */
  baseUrl: string;
  typeName: string; // "workspace:layer_name"
  version?: '1.0.0' | '2.0.0';
}

export interface OverpassSourceConfig {
  kind: 'overpass';
  color: string;
  /** Câu truy vấn Overpass QL, đã bao gồm bbox */
  query: string;
}

export interface StaticSourceConfig {
  kind: 'static';
  color: string;
  /** GeoJSON đã import tĩnh */
  data: GeoJSON.FeatureCollection;
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
