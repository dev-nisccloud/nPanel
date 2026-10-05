"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  setHours,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, GripVertical, Plus } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  CONTENT_KIND_META,
  CONTENT_STATUS_META,
  CreateContentDialog,
  DayScheduleDialog,
  type CreateContentTarget,
} from "./content-calendar-dialogs";
import type { MockScheduledContent } from "./mock-data";

type CalendarMode = "month" | "week" | "day";

type SlotDrop = {
  dateKey: string;
  /** Null keeps the piece's current clock time and only changes the date. */
  hour: number | null;
};

const WEEK_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const WEEK_STARTS_ON = 1 as const;
const EARLIER_HOUR = 7;
const LATER_HOUR = 21;

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

const IgnoreClickContext = React.createContext<React.MutableRefObject<boolean> | null>(null);

function useDragClickGuard() {
  const ignoreClick = React.useContext(IgnoreClickContext);
  return (event: React.MouseEvent) => {
    if (!ignoreClick?.current) return false;
    ignoreClick.current = false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };
}

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function hourLabel(hour: number) {
  return format(setHours(new Date(), hour), "h a");
}

function padHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function rescheduleItem(item: MockScheduledContent, target: SlotDrop): MockScheduledContent {
  const current = new Date(item.scheduledAt);
  const [year, month, day] = target.dateKey.split("-").map(Number);
  const hour = target.hour ?? current.getHours();
  const next = new Date(year, (month ?? 1) - 1, day, hour, current.getMinutes(), 0, 0);
  if (next.getTime() === current.getTime()) return item;
  return { ...item, scheduledAt: format(next, "yyyy-MM-dd'T'HH:mm:ss") };
}

export function FacebookContentCalendar({
  pageId,
  pageName,
  items,
  onItemsChange,
}: {
  pageId: string;
  pageName: string;
  items: MockScheduledContent[];
  onItemsChange: (items: MockScheduledContent[]) => void;
}) {
  const [mode, setMode] = React.useState<CalendarMode>("month");
  const [cursor, setCursor] = React.useState(() => new Date());
  const [dayView, setDayView] = React.useState<Date | null>(null);
  const [createTarget, setCreateTarget] = React.useState<CreateContentTarget | null>(null);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const ignoreClick = React.useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const pageItems = React.useMemo(
    () => items.filter((item) => item.pageId === pageId),
    [items, pageId],
  );

  const itemsByDay = React.useMemo(() => {
    const grouped = new Map<string, MockScheduledContent[]>();
    for (const item of pageItems) {
      const key = dayKey(new Date(item.scheduledAt));
      const bucket = grouped.get(key);
      if (bucket) bucket.push(item);
      else grouped.set(key, [item]);
    }
    for (const bucket of grouped.values()) {
      bucket.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return grouped;
  }, [pageItems]);

  const monthDays = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const dayDate = startOfDay(cursor);

  const rangeLabel =
    mode === "month"
      ? format(cursor, "MMMM yyyy")
      : mode === "week"
        ? `${format(weekDays[0]!, "MMM d")} – ${format(weekDays[6]!, "MMM d, yyyy")}`
        : format(cursor, "EEEE, MMM d, yyyy");

  const activeItem = pageItems.find((item) => item.id === activeItemId) ?? null;
  const dayItems = dayView ? (itemsByDay.get(dayKey(dayView)) ?? []) : [];

  const openCreate = (date: Date, time = "09:00") => {
    setCreateTarget({ date, time });
  };

  const focusDay = (date: Date) => {
    setCursor(date);
    setMode("day");
  };

  const shift = (direction: -1 | 1) => {
    setCursor((current) => {
      if (mode === "month") return direction === 1 ? addMonths(current, 1) : subMonths(current, 1);
      if (mode === "week") return direction === 1 ? addWeeks(current, 1) : subWeeks(current, 1);
      return direction === 1 ? addDays(current, 1) : subDays(current, 1);
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const itemId = event.active.data.current?.itemId;
    if (typeof itemId === "string") setActiveItemId(itemId);
  };

  const armClickGuard = () => {
    ignoreClick.current = true;
    window.setTimeout(() => {
      ignoreClick.current = false;
    }, 80);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    armClickGuard();
    setActiveItemId(null);
    const itemId = event.active.data.current?.itemId;
    const target = event.over?.data.current as SlotDrop | undefined;
    if (typeof itemId !== "string" || !target?.dateKey) return;
    const next = items.map((item) => (item.id === itemId ? rescheduleItem(item, target) : item));
    if (next.some((item, index) => item !== items[index])) onItemsChange(next);
  };

  return (
    <IgnoreClickContext.Provider value={ignoreClick}>
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragCancel={() => {
        armClickGuard();
        setActiveItemId(null);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-border/70 bg-muted/40 p-0.5">
              <ModeButton active={mode === "month"} onClick={() => setMode("month")}>
                Month
              </ModeButton>
              <ModeButton active={mode === "week"} onClick={() => setMode("week")}>
                Week
              </ModeButton>
              <ModeButton active={mode === "day"} onClick={() => setMode("day")}>
                Day
              </ModeButton>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => shift(-1)}
                aria-label={mode === "month" ? "Previous month" : mode === "week" ? "Previous week" : "Previous day"}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className={cn("text-center text-sm font-semibold", mode === "day" ? "min-w-[14rem]" : "min-w-[11rem]")}>
                {rangeLabel}
              </p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => shift(1)}
                aria-label={mode === "month" ? "Next month" : mode === "week" ? "Next week" : "Next day"}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <button
              type="button"
              className="h-8 rounded-md px-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => focusDay(new Date())}
            >
              ({format(new Date(), "d MMMM yyyy")})
            </button>
          </div>

          <Button type="button" size="sm" className="w-fit" onClick={() => openCreate(cursor)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add content
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {(Object.keys(CONTENT_KIND_META) as Array<keyof typeof CONTENT_KIND_META>).map((kind) => (
            <span key={kind} className="inline-flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", CONTENT_KIND_META[kind].dot)} />
              {CONTENT_KIND_META[kind].label}
            </span>
          ))}
          <span className="text-border">|</span>
          {(Object.keys(CONTENT_STATUS_META) as Array<keyof typeof CONTENT_STATUS_META>).map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", CONTENT_STATUS_META[status].dot)} />
              {CONTENT_STATUS_META[status].label}
            </span>
          ))}
          <span className="text-border">|</span>
          <span>Drag a piece to another day or time</span>
        </div>

        {mode === "month" ? (
          <MonthGrid
            cursor={cursor}
            days={monthDays}
            itemsByDay={itemsByDay}
            onFocusDay={focusDay}
            onOpenItems={setDayView}
            onAddDay={(date) => openCreate(date)}
          />
        ) : (
          <TimeGrid
            days={mode === "week" ? weekDays : [dayDate]}
            itemsByDay={itemsByDay}
            dragging={activeItemId !== null}
            onFocusDay={focusDay}
            onOpenItems={setDayView}
            onAddSlot={openCreate}
          />
        )}

        <DayScheduleDialog
          date={dayView}
          items={dayItems}
          pageName={pageName}
          onOpenChange={(open) => {
            if (!open) setDayView(null);
          }}
          onAdd={(date) => openCreate(date)}
        />

        <CreateContentDialog
          open={createTarget !== null}
          onOpenChange={(open) => {
            if (!open) setCreateTarget(null);
          }}
          pageName={pageName}
          target={createTarget}
          onCreate={(draft) => {
            onItemsChange([
              ...items,
              {
                ...draft,
                id: `cnt_${Date.now()}`,
                pageId,
              },
            ]);
            setCursor(new Date(draft.scheduledAt));
          }}
        />
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <div className="w-44 rotate-1 cursor-grabbing rounded-md shadow-lg">
                  <ContentChip item={activeItem} />
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )
        : null}
    </DndContext>
    </IgnoreClickContext.Provider>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-3 py-1 text-xs font-medium transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function MonthGrid({
  cursor,
  days,
  itemsByDay,
  onFocusDay,
  onOpenItems,
  onAddDay,
}: {
  cursor: Date;
  days: Date[];
  itemsByDay: Map<string, MockScheduledContent[]>;
  onFocusDay: (date: Date) => void;
  onOpenItems: (date: Date) => void;
  onAddDay: (date: Date) => void;
}) {
  const weekdayLabels = days.slice(0, 7);

  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/30">
        {weekdayLabels.map((day) => (
          <div
            key={format(day, "EEE")}
            className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {format(day, "EEE")}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <MonthDayCell
            key={dayKey(day)}
            day={day}
            inMonth={isSameMonth(day, cursor)}
            items={itemsByDay.get(dayKey(day)) ?? []}
            onFocusDay={onFocusDay}
            onOpenItems={onOpenItems}
            onAddDay={onAddDay}
          />
        ))}
      </div>
    </div>
  );
}

function MonthDayCell({
  day,
  inMonth,
  items,
  onFocusDay,
  onOpenItems,
  onAddDay,
}: {
  day: Date;
  inMonth: boolean;
  items: MockScheduledContent[];
  onFocusDay: (date: Date) => void;
  onOpenItems: (date: Date) => void;
  onAddDay: (date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${dayKey(day)}`,
    data: { dateKey: dayKey(day), hour: null } satisfies SlotDrop,
  });
  const visible = items.slice(0, 3);
  const hidden = items.length - visible.length;
  const today = isToday(day);
  const guardDragClick = useDragClickGuard();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative min-h-[108px] border-b border-r border-border/50 p-1.5 text-left",
        !inMonth && "bg-muted/20",
        isOver && "bg-primary/10",
      )}
      onClick={(event) => {
        if (guardDragClick(event)) return;
        onFocusDay(day);
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
            today && "bg-primary text-primary-foreground",
            !today && !inMonth && "text-muted-foreground",
          )}
        >
          {format(day, "d")}
        </span>
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Add content on ${format(day, "MMMM d")}`}
          onClick={(event) => {
            event.stopPropagation();
            onAddDay(day);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-1 space-y-1">
        {visible.map((item) => (
          <DraggableContentChip key={item.id} item={item} onOpen={() => onOpenItems(day)} />
        ))}
        {hidden > 0 ? (
          <button
            type="button"
            className="px-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onFocusDay(day);
            }}
          >
            +{hidden} more
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TimeGrid({
  days,
  itemsByDay,
  dragging,
  onFocusDay,
  onOpenItems,
  onAddSlot,
}: {
  days: Date[];
  itemsByDay: Map<string, MockScheduledContent[]>;
  dragging: boolean;
  onFocusDay: (date: Date) => void;
  onOpenItems: (date: Date) => void;
  onAddSlot: (date: Date, time: string) => void;
}) {
  const singleDay = days.length === 1;

  return (
    <div className="overflow-x-auto rounded-lg border border-border/70 bg-card">
      <div className={singleDay ? "min-w-[320px]" : "min-w-[860px]"}>
        <div
          className={cn(
            "grid border-b border-border/70 bg-muted/30",
            singleDay ? "grid-cols-[64px_minmax(0,1fr)]" : "grid-cols-[64px_repeat(7,minmax(0,1fr))]",
          )}
        >
          <div />
          {days.map((day) => {
            const count = itemsByDay.get(dayKey(day))?.length ?? 0;
            const today = isToday(day);
            return (
              <button
                key={dayKey(day)}
                type="button"
                onClick={() => onFocusDay(day)}
                className="border-l border-border/50 px-2 py-2 text-left hover:bg-muted/60"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE")}
                </p>
                <p className="mt-0.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold",
                      today && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                </p>
              </button>
            );
          })}
        </div>

        <div className="max-h-[560px] overflow-y-auto">
          <OffHoursRow
            label="Earlier"
            hour={EARLIER_HOUR}
            days={days}
            singleDay={singleDay}
            dragging={dragging}
            itemsByDay={itemsByDay}
            match={(hour) => hour < WEEK_HOURS[0]!}
            onOpenItems={onOpenItems}
            onAddSlot={onAddSlot}
          />
          {WEEK_HOURS.map((hour) => (
            <div
              key={hour}
              className={cn(
                "grid",
                singleDay ? "grid-cols-[64px_minmax(0,1fr)]" : "grid-cols-[64px_repeat(7,minmax(0,1fr))]",
              )}
            >
              <div className="border-b border-border/40 px-2 py-2 text-right text-[10px] text-muted-foreground">
                {hourLabel(hour)}
              </div>
              {days.map((day) => (
                <SlotCell
                  key={`${dayKey(day)}-${hour}`}
                  day={day}
                  hour={hour}
                  roomy={singleDay}
                  items={(itemsByDay.get(dayKey(day)) ?? []).filter(
                    (item) => new Date(item.scheduledAt).getHours() === hour,
                  )}
                  onOpenItems={onOpenItems}
                  onAddSlot={onAddSlot}
                />
              ))}
            </div>
          ))}
          <OffHoursRow
            label="Later"
            hour={LATER_HOUR}
            days={days}
            singleDay={singleDay}
            dragging={dragging}
            itemsByDay={itemsByDay}
            match={(hour) => hour > WEEK_HOURS[WEEK_HOURS.length - 1]!}
            onOpenItems={onOpenItems}
            onAddSlot={onAddSlot}
          />
        </div>
      </div>
    </div>
  );
}

function SlotCell({
  day,
  hour,
  items,
  roomy = false,
  onOpenItems,
  onAddSlot,
}: {
  day: Date;
  hour: number;
  items: MockScheduledContent[];
  roomy?: boolean;
  onOpenItems: (date: Date) => void;
  onAddSlot: (date: Date, time: string) => void;
}) {
  const dateKeyValue = dayKey(day);
  const guardDragClick = useDragClickGuard();
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${dateKeyValue}:${hour}`,
    data: { dateKey: dateKeyValue, hour } satisfies SlotDrop,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative space-y-0.5 border-b border-l border-border/40 p-0.5",
        roomy ? "min-h-14" : "min-h-12",
        isOver && "bg-primary/10",
      )}
      onClick={(event) => {
        if (guardDragClick(event)) return;
        onAddSlot(day, padHour(hour));
      }}
    >
      {items.map((item) => (
        <DraggableContentChip key={item.id} item={item} roomy={roomy} onOpen={() => onOpenItems(day)} />
      ))}
    </div>
  );
}

function OffHoursRow({
  label,
  hour,
  days,
  singleDay,
  dragging,
  itemsByDay,
  match,
  onOpenItems,
  onAddSlot,
}: {
  label: string;
  hour: number;
  days: Date[];
  singleDay: boolean;
  dragging: boolean;
  itemsByDay: Map<string, MockScheduledContent[]>;
  match: (hour: number) => boolean;
  onOpenItems: (date: Date) => void;
  onAddSlot: (date: Date, time: string) => void;
}) {
  const rows = days.map((day) =>
    (itemsByDay.get(dayKey(day)) ?? []).filter((item) => match(new Date(item.scheduledAt).getHours())),
  );
  if (!dragging && rows.every((row) => row.length === 0)) return null;

  return (
    <div
      className={cn(
        "grid",
        singleDay ? "grid-cols-[64px_minmax(0,1fr)]" : "grid-cols-[64px_repeat(7,minmax(0,1fr))]",
      )}
    >
      <div className="border-b border-border/40 px-2 py-2 text-right text-[10px] text-muted-foreground">{label}</div>
      {days.map((day, index) => (
        <OffHoursCell
          key={dayKey(day)}
          day={day}
          hour={hour}
          roomy={singleDay}
          items={rows[index] ?? []}
          onOpenItems={onOpenItems}
          onAddSlot={onAddSlot}
        />
      ))}
    </div>
  );
}

function OffHoursCell({
  day,
  hour,
  items,
  roomy = false,
  onOpenItems,
  onAddSlot,
}: {
  day: Date;
  hour: number;
  items: MockScheduledContent[];
  roomy?: boolean;
  onOpenItems: (date: Date) => void;
  onAddSlot: (date: Date, time: string) => void;
}) {
  const dateKeyValue = dayKey(day);
  const guardDragClick = useDragClickGuard();
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${dateKeyValue}:${hour}`,
    data: { dateKey: dateKeyValue, hour } satisfies SlotDrop,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("min-h-8 space-y-0.5 border-b border-l border-border/40 p-0.5", isOver && "bg-primary/10")}
      onClick={(event) => {
        if (guardDragClick(event)) return;
        onAddSlot(day, padHour(hour));
      }}
    >
      {items.map((item) => (
        <DraggableContentChip key={item.id} item={item} roomy={roomy} onOpen={() => onOpenItems(day)} />
      ))}
    </div>
  );
}

function DraggableContentChip({
  item,
  roomy = false,
  onOpen,
}: {
  item: MockScheduledContent;
  roomy?: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item:${item.id}`,
    data: { itemId: item.id },
  });
  const guardDragClick = useDragClickGuard();

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cn(
        "block w-full cursor-grab touch-none text-left active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...listeners}
      {...attributes}
      onClick={(event) => {
        event.stopPropagation();
        if (guardDragClick(event)) return;
        onOpen();
      }}
    >
      <ContentChip item={item} roomy={roomy} />
    </button>
  );
}

function ContentChip({ item, roomy = false }: { item: MockScheduledContent; roomy?: boolean }) {
  const kind = CONTENT_KIND_META[item.kind];
  const status = CONTENT_STATUS_META[item.status];
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1 rounded border bg-background/80 px-1 py-0.5 text-left font-medium leading-tight",
        roomy ? "px-2 py-1 text-xs" : "text-[10px]",
        kind.chip,
      )}
    >
      <GripVertical className="h-3 w-3 shrink-0 opacity-50" />
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.dot)} />
      <span className="shrink-0 opacity-70">{format(new Date(item.scheduledAt), "h:mm")}</span>
      <span className="truncate">{item.title}</span>
    </span>
  );
}
