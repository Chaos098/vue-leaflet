import L from 'leaflet';
import type { OverpassSourceConfig, LayerRuntimeState } from '../types/layers';

//OVERPASS API 
const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Format result data from Overpass into GeoJSON
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

    features.push({
      type: 'Feature',
      properties: el.tags ?? {},
      geometry,
    });
  }

  return { type: 'FeatureCollection', features };
}

export function useOverpassLayer(
  map: L.Map,
  source: OverpassSourceConfig,
  color: string,
) {
  let geoLayer: L.GeoJSON | null = null;
  let aborted = false;

  async function add(state: LayerRuntimeState) {
    state.status = 'loading';
    aborted = false;
    // Fetch data from OVERPASS API 
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(source.query),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: OverpassResponse = await res.json();
      if (aborted) return;

      const geojson = overpassToGeoJSON(json);

      // Set geoJSON for type map 
      geoLayer = L.geoJSON(geojson, {
        style: { color, weight: 2, fillColor: color, fillOpacity: 0.15 },
        pointToLayer: (_f, latlng) => L.circleMarker(latlng, { radius: 4, color }),
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
