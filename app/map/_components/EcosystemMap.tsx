"use client";

import maplibregl, {
  type GeoJSONSource,
  type LngLatLike,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef } from "react";
import {
  FALLBACK_SECTOR_COLOR,
  SECTOR_COLORS,
  colorForSector,
} from "./sector-colors";
import type { CompanyListItem } from "./types";

type Props = {
  companies: CompanyListItem[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

const UTAH_CENTER: LngLatLike = [-111.5, 39.5];
const SOURCE_ID = "companies";
const CLUSTER_LAYER = "company-clusters";
const POINT_LAYER = "company-points";

// Stable per-slug jitter (±0.018°, ~2km) so co-centroid pins separate.
function jitter(slug: string): { dx: number; dy: number } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  const a = (h & 0xffff) / 0xffff - 0.5;
  const b = ((h >>> 16) & 0xffff) / 0xffff - 0.5;
  return { dx: a * 0.036, dy: b * 0.036 };
}

function toFeatureCollection(
  companies: CompanyListItem[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const c of companies) {
    if (typeof c.lat !== "number" || typeof c.lng !== "number") continue;
    const j = jitter(c.slug);
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lng + j.dx, c.lat + j.dy] },
      properties: {
        slug: c.slug,
        name: c.name,
        sector: c.sector,
        sector_color: colorForSector(c.sector),
      },
    });
  }
  return { type: "FeatureCollection", features };
}

export function EcosystemMap({ companies, selectedSlug, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const ready = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const data = useMemo(() => toFeatureCollection(companies), [companies]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            ],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
          },
        },
        layers: [
          { id: "osm", type: "raster", source: "osm", minzoom: 0, maxzoom: 22 },
        ],
      },
      center: UTAH_CENTER,
      zoom: 6.2,
      minZoom: 5,
      maxZoom: 16,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 12,
      });

      map.addLayer({
        id: CLUSTER_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0f1b2d",
          "circle-stroke-color": "#fbf9f4",
          "circle-stroke-width": 2,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            5,
            20,
            15,
            26,
            40,
            32,
          ],
          "circle-opacity": 0.92,
        },
      });

      // (Cluster counts are communicated by circle radius — the
      // raster basemap doesn't ship a glyphs URL, so a symbol layer
      // with text-field would error at addLayer.)

      map.addLayer({
        id: POINT_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "coalesce",
            ["get", "sector_color"],
            FALLBACK_SECTOR_COLOR,
          ],
          // Default radius / stroke-width — the selected pin's halo
          // is patched in via setPaintProperty in the selection
          // useEffect below.
          "circle-radius": 7,
          "circle-stroke-color": "#0f1b2d",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.95,
        },
      });

      map.on("click", CLUSTER_LAYER, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const clusterId = feature.properties?.cluster_id;
        const src = map.getSource(SOURCE_ID) as GeoJSONSource;
        src
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            const geom = feature.geometry as GeoJSON.Point;
            map.easeTo({
              center: geom.coordinates as [number, number],
              zoom,
              duration: 500,
            });
          })
          .catch((err) => {
            console.warn("cluster expansion zoom failed", err);
          });
      });

      const onPointClick = (e: MapMouseEvent) => {
        const feature = (e as MapMouseEvent & { features?: GeoJSON.Feature[] })
          .features?.[0];
        const slug = feature?.properties?.slug;
        if (typeof slug === "string") onSelectRef.current(slug);
      };
      map.on("click", POINT_LAYER, onPointClick);

      map.on("mouseenter", CLUSTER_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", CLUSTER_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", POINT_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", POINT_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });

      ready.current = true;
      const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (src) src.setData(data);
    });

    mapRef.current = map;
    return () => {
      ready.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push new feature data into the source whenever filters change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (src) src.setData(data);
  }, [data]);

  // Highlight the selected pin via a halo using a runtime filter on
  // the point layer's stroke width.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    if (!map.getLayer(POINT_LAYER)) return;
    map.setPaintProperty(POINT_LAYER, "circle-stroke-width", [
      "case",
      ["==", ["get", "slug"], selectedSlug ?? ""],
      3.5,
      1.5,
    ]);
    map.setPaintProperty(POINT_LAYER, "circle-radius", [
      "case",
      ["==", ["get", "slug"], selectedSlug ?? ""],
      10,
      7,
    ]);
  }, [selectedSlug]);

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      <Legend />
    </>
  );
}

function Legend() {
  const items = Object.entries(SECTOR_COLORS);
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-tile border-[1.5px] border-ink bg-paper-2/95 p-3 font-mono text-[10px] uppercase tracking-wider text-ink shadow-sketch md:block">
      <div className="mb-1 text-ink-3">Sector</div>
      <ul className="grid gap-1">
        {items.map(([sector, color]) => (
          <li key={sector} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full border border-ink"
              style={{ backgroundColor: color }}
            />
            <span>{sector}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
