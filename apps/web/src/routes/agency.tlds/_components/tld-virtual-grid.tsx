"use client";

import * as React from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { TldCard } from "./tld-card";
import type { OpenproviderTld } from "@/types/openprovider";
import type { ToKesFn } from "./tld-price-format";

const GAP_PX = 12; // gap-3
const ESTIMATED_CARD_HEIGHT = 168; // includes optional KES line
const ESTIMATED_ROW_HEIGHT = ESTIMATED_CARD_HEIGHT + GAP_PX;

function getColumnCount(width: number): number {
  if (width >= 1280) return 4; // xl
  if (width >= 1024) return 3; // lg
  if (width >= 640) return 2; // sm
  return 1;
}

interface TldVirtualGridProps {
  tlds: OpenproviderTld[];
  onSelect: (tld: OpenproviderTld) => void;
  toKes?: ToKesFn;
}

export function TldVirtualGrid({ tlds, onSelect, toKes }: TldVirtualGridProps) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [columns, setColumns] = React.useState(1);
  const [scrollMargin, setScrollMargin] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const update = () => {
      setScrollMargin(el.offsetTop);
      setColumns(getColumnCount(el.clientWidth));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(tlds.length / columns) || 0;

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 4,
    scrollMargin,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div ref={listRef} className="w-full">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowTlds = tlds.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                paddingBottom: GAP_PX,
              }}
            >
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {rowTlds.map((tld) => (
                  <TldCard
                    key={tld.name}
                    tld={tld}
                    onSelect={onSelect}
                    toKes={toKes}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
