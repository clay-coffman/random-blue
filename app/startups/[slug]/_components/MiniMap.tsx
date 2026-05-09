"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { sectorHex } from "@/lib/sectors";

type MiniMapProps = {
  lat: number;
  lng: number;
  name: string;
  sector: string | null;
  slug: string;
};

const VECTOR_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export function MiniMap({ lat, lng, name, sector }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Lazy-load MapLibre only when this section enters the viewport.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || !containerRef.current) return;
    let map: import("maplibre-gl").Map | null = null;
    let cancelled = false;

    (async () => {
      try {
        const maplibre = (await import("maplibre-gl")).default;
        if (cancelled || !containerRef.current) return;

        map = new maplibre.Map({
          container: containerRef.current,
          style: VECTOR_STYLE_URL,
          center: [lng, lat],
          zoom: 11,
          attributionControl: { compact: true },
          interactive: false,
        });

        map.on("load", () => {
          if (!map) return;
          // A single coloured pin at the company's coordinate.
          const el = document.createElement("div");
          el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${sectorHex(sector)};border:2px solid #0f1b2d;box-shadow:0 1px 4px rgba(0,0,0,0.25)`;
          new maplibre.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        });

        map.on("error", () => setMapError(true));
      } catch (err) {
        console.error("[MiniMap] failed to load MapLibre", err);
        setMapError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [shouldLoad, lat, lng, sector]);

  return (
    <div
      ref={containerRef}
      className="relative h-44 w-full overflow-hidden rounded-tile border-[1.5px] border-ink/30 bg-paper-2"
      role="img"
      aria-label={`Map showing ${name}'s location`}
    >
      {!shouldLoad ? (
        <div className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-wider text-ink-3">
          loading map…
        </div>
      ) : null}
      {mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-paper-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">
          map unavailable
        </div>
      ) : null}
    </div>
  );
}
