"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import maplibregl, {
  type Map as MapLibreMap,
  type GeoJSONSource,
  type LngLatLike,
} from "maplibre-gl";
import type { CompanyListItem } from "@/lib/companies-list";
import {
  FALLBACK_HEX,
  SECTOR_PAINT_MATCH,
  SECTOR_REGISTRY,
  sectorKey,
} from "@/lib/sectors";
import { bucketMidpoint } from "@/lib/employee-bucket";
import type { ViewMode } from "./ViewModeToggle";

const VECTOR_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const UTAH_CENTER: LngLatLike = [-111.5, 39.5];
const UTAH_ZOOM = 6.5;
const UTAH_BOUNDS: [[number, number], [number, number]] = [
  [-114.3, 36.7], // SW
  [-108.8, 42.2], // NE
];

type Props = {
  companies: CompanyListItem[];
  view: ViewMode;
  initialCamera: { lat: number; lng: number; zoom: number } | null;
  selectedSlug: string | null;
  onPinClick: (slug: string) => void;
};

const SECTOR_KEYS = SECTOR_REGISTRY.map((s) => s.key).filter(
  (v, i, a) => a.indexOf(v) === i,
);
const KEY_HEX: Record<string, string> = Object.fromEntries(
  SECTOR_REGISTRY.map((s) => [s.key, s.hex]),
);

function buildGeoJson(companies: CompanyListItem[]) {
  return {
    type: "FeatureCollection" as const,
    features: companies
      .filter((c) => c.lat != null && c.lng != null)
      .map((c) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [c.lng!, c.lat!] as [number, number],
        },
        properties: {
          slug: c.slug,
          name: c.name,
          sector: c.sector ?? "",
          sector_key: sectorKey(c.sector),
          stage: c.stage ?? "",
          city: c.city ?? "",
          county: c.county ?? "",
          employee_count: c.employee_count ?? "",
          hiring: c.hiring_status ? 1 : 0,
          weight: bucketMidpoint(c.employee_count) || 5,
        },
      })),
  };
}

// Cluster property aggregations: for each sector key, count how many
// features in the cluster carry that key. Used to drive the
// dominant-sector circle color.
function buildClusterProperties() {
  const obj: Record<string, unknown> = {};
  for (const k of SECTOR_KEYS) {
    obj[`count_${k}`] = [
      "+",
      ["case", ["==", ["get", "sector_key"], k], 1, 0],
    ];
  }
  obj["count_other"] = [
    "+",
    ["case", ["==", ["get", "sector_key"], "other"], 1, 0],
  ];
  return obj;
}

// Circle-color expression that picks the sector key with the largest
// per-cluster count. MapLibre evaluates the `case` ladder top-down.
function buildClusterColorExpression(): unknown[] {
  // For each pair (a, b), if count_a >= count_b, prefer a, else b.
  // We iteratively reduce by always comparing against the current "best".
  // Since MapLibre paint expressions don't have variables, we compose
  // a nested case/all expression by repeated binary comparisons.
  const keys = [...SECTOR_KEYS, "other"];
  const expr: unknown[] = ["case"];
  // For each candidate key, emit:
  //   ["all", count_k >= count_a, count_k >= count_b, ...] => HEX
  for (const k of keys) {
    const checks: unknown[] = ["all"];
    for (const other of keys) {
      if (other === k) continue;
      checks.push([">=", ["get", `count_${k}`], ["get", `count_${other}`]]);
    }
    expr.push(checks);
    expr.push(k === "other" ? FALLBACK_HEX : (KEY_HEX[k] ?? FALLBACK_HEX));
  }
  expr.push(FALLBACK_HEX);
  return expr;
}

export function EcosystemMap({
  companies,
  view,
  initialCamera,
  selectedSlug,
  onPinClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const ready = useRef(false);
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: LngLatLike = initialCamera
      ? [initialCamera.lng, initialCamera.lat]
      : UTAH_CENTER;
    const zoom = initialCamera?.zoom ?? UTAH_ZOOM;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: VECTOR_STYLE_URL,
      center,
      zoom,
      minZoom: 5,
      maxZoom: 16,
      maxBounds: UTAH_BOUNDS,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      // Source — populated by the second effect below.
      map.addSource("companies", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
        clusterProperties: buildClusterProperties() as never,
      });

      // ---- Companies (default) view layers ----
      // Cluster bubbles, colored by dominant sector.
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "companies",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": buildClusterColorExpression() as never,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0f1b2d",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            5,
            24,
            15,
            32,
          ],
          "circle-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "companies",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#f7f4ed",
          "text-halo-color": "#0f1b2d",
          "text-halo-width": 1,
        },
      });
      // Individual pins (unclustered).
      map.addLayer({
        id: "pin",
        type: "circle",
        source: "companies",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "sector"],
            ...SECTOR_PAINT_MATCH,
          ] as never,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#0f1b2d",
          "circle-radius": [
            "case",
            ["==", ["get", "slug"], ["literal", ""]], // unused
            10,
            8,
          ],
        },
      });
      // Selected pin highlight (rendered above pin layer).
      map.addLayer({
        id: "pin-selected",
        type: "circle",
        source: "companies",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "slug"], ""]],
        paint: {
          "circle-color": [
            "match",
            ["get", "sector"],
            ...SECTOR_PAINT_MATCH,
          ] as never,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#c2410c",
          "circle-radius": 12,
        },
      });

      // ---- Clusters (gazetteer) view — soft halo + text label ----
      map.addLayer({
        id: "gazetteer-halo",
        type: "circle",
        source: "companies",
        filter: ["has", "point_count"],
        layout: { visibility: "none" },
        paint: {
          "circle-color": buildClusterColorExpression() as never,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            36,
            5,
            48,
            15,
            64,
          ],
          "circle-opacity": 0.18,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": buildClusterColorExpression() as never,
          "circle-stroke-opacity": 0.45,
        },
      });
      map.addLayer({
        id: "gazetteer-label",
        type: "symbol",
        source: "companies",
        filter: ["has", "point_count"],
        layout: {
          visibility: "none",
          "text-field": [
            "concat",
            ["get", "point_count_abbreviated"],
            " companies",
          ],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 13,
          "text-allow-overlap": false,
          "text-offset": [0, 0.2],
        },
        paint: {
          "text-color": "#0f1b2d",
          "text-halo-color": "#f7f4ed",
          "text-halo-width": 1.6,
        },
      });

      // ---- Heat view ----
      map.addLayer(
        {
          id: "heat",
          type: "heatmap",
          source: "companies",
          layout: { visibility: "none" },
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "weight"],
              0,
              0.1,
              500,
              0.6,
              5000,
              1,
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              1,
              12,
              3,
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              16,
              12,
              48,
            ],
            "heatmap-opacity": 0.75,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(33,102,172,0)",
              0.2,
              "rgb(103,169,207)",
              0.4,
              "rgb(252,141,89)",
              0.7,
              "rgb(239,108,41)",
              1,
              "rgb(178,24,43)",
            ],
          },
        },
        // Place beneath the labels so it doesn't paint over the
        // basemap text.
        "clusters",
      );

      // Cluster click → expand zoom.
      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const f = features[0];
        if (!f) return;
        const clusterId = f.properties?.cluster_id as number | undefined;
        if (clusterId == null) return;
        const source = map.getSource("companies") as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: coords, zoom });
      });

      // Pin click → bubble up the selected slug.
      map.on("click", "pin", (e) => {
        const f = e.features?.[0];
        const slug = f?.properties?.slug as string | undefined;
        if (slug) onPinClickRef.current(slug);
      });
      map.on("mouseenter", "pin", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "pin", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      ready.current = true;
      // Initial data load — caller's first companies prop.
      const src = map.getSource("companies") as GeoJSONSource;
      src.setData(buildGeoJson(companiesRef.current) as never);
    });

    return () => {
      mapRef.current = null;
      ready.current = false;
      map.remove();
    };
    // intentionally only initializes once; see companiesRef pattern below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref-companies pattern so the load handler reads the latest list
  // without re-instantiating the map.
  const companiesRef = useRef(companies);
  useEffect(() => {
    companiesRef.current = companies;
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const src = map.getSource("companies") as GeoJSONSource | undefined;
    if (src) src.setData(buildGeoJson(companies) as never);
  }, [companies]);

  // Selected pin filter — re-applied when selectedSlug changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    map.setFilter("pin-selected", [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "slug"], selectedSlug ?? ""],
    ]);
  }, [selectedSlug]);

  // View mode → toggle layer visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const layers = {
      clusters: ["clusters", "cluster-count", "pin", "pin-selected"],
      gazetteer: ["gazetteer-halo", "gazetteer-label"],
      heat: ["heat"],
    };
    const all = [...layers.clusters, ...layers.gazetteer, ...layers.heat];
    const visible: string[] =
      view === "companies"
        ? layers.clusters
        : view === "clusters"
          ? layers.gazetteer
          : layers.heat;
    for (const id of all) {
      if (!map.getLayer(id)) continue;
      map.setLayoutProperty(
        id,
        "visibility",
        visible.includes(id) ? "visible" : "none",
      );
    }
  }, [view]);

  return <div ref={containerRef} className="h-full w-full" />;
}
