"use client";

import * as React from "react";
import { TabsTrigger } from "@/components/ui/tabs";

// ─── Inject keyframes once ──────────────────────────────────────────────────
const STYLE_ID = "ai-tab-trigger-v3";
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    /* Cycling color for text + icon */
    @keyframes aitab-hue {
      0%   { color: #7c3aed; }
      33%  { color: #2563eb; }
      66%  { color: #06b6d4; }
      100% { color: #7c3aed; }
    }

    /* Border color cycle */
    @keyframes aitab-border {
      0%   { border-color: rgba(124,58,237,0.7); box-shadow: 0 0 6px 1px rgba(124,58,237,0.3); }
      33%  { border-color: rgba(37,99,235,0.7);  box-shadow: 0 0 6px 1px rgba(37,99,235,0.3);  }
      66%  { border-color: rgba(6,182,212,0.7);  box-shadow: 0 0 6px 1px rgba(6,182,212,0.3);  }
      100% { border-color: rgba(124,58,237,0.7); box-shadow: 0 0 6px 1px rgba(124,58,237,0.3); }
    }

    /* Sparkle float */
    @keyframes aitab-float {
      0%, 100% { transform: translateY(0)    scale(1);    }
      50%       { transform: translateY(-2px) scale(1.15); }
    }

    /* Wrapper that provides the animated border + glow */
    .aitab-wrap {
      display: inline-flex;
      border-radius: 9999px;
      padding: 1.5px;
      border: 1.5px solid rgba(124,58,237,0.7);
      animation: aitab-border 4s linear infinite;
      line-height: 0;
    }

    /* The trigger inside: fill the wrapper exactly */
    .aitab-wrap > [role="tab"] {
      border-radius: 9999px !important;
      margin: 0 !important;
    }

    /* Inactive: cycle the text + icon color */
    .aitab-wrap > [data-state="inactive"] .aitab-label,
    .aitab-wrap > [data-state="inactive"] .aitab-icon {
      animation: aitab-hue 4s linear infinite;
    }

    /* Active: keep a vibrant purple color */
    .aitab-wrap > [data-state="active"] .aitab-label,
    .aitab-wrap > [data-state="active"] .aitab-icon {
      color: #a78bfa;
    }

    /* Sparkle float always on */
    .aitab-icon {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      animation: aitab-float 2s ease-in-out infinite;
    }

    .aitab-label {
      font-weight: 600;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(el);
}

// ─── Sparkle SVG ─────────────────────────────────────────────────────────────
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Big 4-point star */}
      <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z" />
      {/* Small accent star */}
      <path
        d="M20 3 L20.6 5.4 L23 6 L20.6 6.6 L20 9 L19.4 6.6 L17 6 L19.4 5.4 Z"
        opacity="0.65"
      />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
interface AiTabTriggerProps {
  value: string;
  label?: string;
}

export function AiTabTrigger({ value, label = "AI Domain Search" }: AiTabTriggerProps) {
  React.useEffect(() => {
    injectStyles();
  }, []);

  return (
    <span className="aitab-wrap">
      <TabsTrigger value={value} className="gap-1.5 flex items-center">
        <span className="aitab-icon">
          <SparkleIcon />
        </span>
        <span className="aitab-label">{label}</span>
      </TabsTrigger>
    </span>
  );
}
