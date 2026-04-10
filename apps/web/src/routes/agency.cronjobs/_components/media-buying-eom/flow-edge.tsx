"use client";

import * as React from "react";
import { getSmoothStepPath, type EdgeProps } from "@xyflow/react";

export function MediaBuyingEomFlowEdge({
  id,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Base edge stays solid. When selected, we overlay a subtle animated "flow" dash.
  const baseStyle: React.CSSProperties = {
    stroke: style?.stroke ?? "var(--primary)",
    strokeWidth: style?.strokeWidth ?? 2,
    fill: "none",
  };

  const overlayStyle: React.CSSProperties = {
    stroke: baseStyle.stroke,
    strokeWidth: Math.max(1, Number(baseStyle.strokeWidth) - 1),
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: "2 10",
    animation: "mb-eom-edge-flow 0.9s linear infinite",
    opacity: 0.85,
  };

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={path}
        style={baseStyle}
        markerEnd={markerEnd}
      />
      {selected && (
        <path
          className="react-flow__edge-path"
          d={path}
          style={overlayStyle}
          markerEnd={markerEnd}
        />
      )}
    </>
  );
}

