import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import DottedMap from "dotted-map";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils.ts";

interface MapDot {
  start: { lat: number; lng: number; label?: string };
  end: { lat: number; lng: number; label?: string };
}

interface MapProps {
  dots?: MapDot[];
  lineColor?: string;
  showLabels?: boolean;
  animationDuration?: number;
  loop?: boolean;
  blend?: boolean;
  className?: string;
}

interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

function extractSvgInner(svg: string): string {
  const match = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match?.[1]?.trim() ?? "";
}

function locationKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function createCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  arcLift: number,
) {
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - arcLift;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}

function collectUniquePoints(dots: MapDot[]): MapPoint[] {
  const seen = new Set<string>();
  const points: MapPoint[] = [];

  for (const dot of dots) {
    for (const point of [dot.start, dot.end]) {
      const key = locationKey(point.lat, point.lng);
      if (seen.has(key)) continue;
      seen.add(key);
      points.push(point);
    }
  }

  return points;
}

export function WorldMap({
  dots = [],
  lineColor = "#38b6ff",
  showLabels = true,
  animationDuration = 2,
  loop = true,
  blend = true,
  className,
}: MapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const map = useMemo(() => new DottedMap({ height: 100, grid: "diagonal" }), []);

  const mapWidth = map.image.width;
  const mapHeight = map.image.height;

  const projectPoint = useCallback(
    (lat: number, lng: number) => {
      const pin = map.getPin({ lat, lng });
      if (!pin) return { x: 0, y: 0 };
      return { x: pin.x, y: pin.y };
    },
    [map],
  );

  const mapDotsInner = useMemo(() => {
    const svg = map.getSVG({
      radius: 0.22,
      color: isDark ? "#FFFFFF35" : "#64748b45",
      shape: "circle",
      backgroundColor: blend ? "transparent" : isDark ? "black" : "white",
    });
    return extractSvgInner(svg);
  }, [map, isDark, blend]);

  const uniquePoints = useMemo(() => collectUniquePoints(dots), [dots]);

  const arcLift = mapHeight * 0.14;
  const pointRadius = 0.9;
  const pulseMax = 3.2;
  const strokeWidth = 0.35;
  const labelFontSize = 3.8;

  const staggerDelay = 0.25;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 1.5;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  return (
    <div
      className={cn("relative w-full font-sans", className)}
      style={{ aspectRatio: `${mapWidth} / ${mapHeight}` }}
    >
      {/*
        Single SVG: base dotted-map layer + routes + pins share one viewBox.
        Avoids img object-cover vs overlay mismatch (per dotted-map getPin coords).
      */}
      <svg
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="h-full w-full select-none"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="World map showing global server connectivity"
      >
        <defs>
          <linearGradient id="world-map-path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="8%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="92%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="world-map-glow">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g dangerouslySetInnerHTML={{ __html: mapDotsInner }} />

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          const pathD = createCurvedPath(startPoint, endPoint, arcLift);

          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;

          return (
            <g key={`path-${i}`}>
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#world-map-path-gradient)"
                strokeWidth={strokeWidth}
                initial={{ pathLength: 0 }}
                animate={loop ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                transition={
                  loop
                    ? {
                        duration: fullCycleDuration,
                        times: [0, startTime, endTime, resetTime, 1],
                        ease: "easeInOut",
                        repeat: Infinity,
                      }
                    : {
                        duration: animationDuration,
                        delay: i * staggerDelay,
                        ease: "easeInOut",
                      }
                }
              />

              {loop && (
                <motion.circle
                  r={pointRadius * 0.7}
                  fill={lineColor}
                  initial={{ offsetDistance: "0%", opacity: 0 }}
                  animate={{
                    offsetDistance: [null, "0%", "100%", "100%", "100%"],
                    opacity: [0, 0, 1, 0, 0],
                  }}
                  transition={{
                    duration: fullCycleDuration,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                  style={{ offsetPath: `path('${pathD}')` }}
                />
              )}
            </g>
          );
        })}

        {uniquePoints.map((point) => {
          const { x, y } = projectPoint(point.lat, point.lng);
          const label = point.label ?? "";
          const isHovered = hoveredLocation === label;

          return (
            <g
              key={locationKey(point.lat, point.lng)}
              className="cursor-pointer"
              onMouseEnter={() => label && setHoveredLocation(label)}
              onMouseLeave={() => setHoveredLocation(null)}
            >
              <circle
                cx={x}
                cy={y}
                r={pointRadius}
                fill={lineColor}
                filter="url(#world-map-glow)"
              />
              <circle cx={x} cy={y} r={pointRadius} fill={lineColor} opacity="0.45">
                <animate
                  attributeName="r"
                  from={String(pointRadius)}
                  to={String(pulseMax)}
                  dur="2.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>

              {(showLabels || isHovered) && label && (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={x - label.length * 1.05}
                    y={y - 5.2}
                    width={label.length * 2.1}
                    height={4.2}
                    rx={0.8}
                    fill={isDark ? "rgba(13,27,42,0.92)" : "rgba(255,255,255,0.92)"}
                    stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                    strokeWidth={0.15}
                  />
                  <text
                    x={x}
                    y={y - 2.4}
                    textAnchor="middle"
                    fontSize={labelFontSize}
                    fill={isHovered ? lineColor : isDark ? "#e2eaf2" : "#0f172a"}
                    fontWeight={isHovered ? 600 : 500}
                  >
                    {label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-border/60 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm md:hidden"
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
