"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Globe,
  GripVertical,
  ImageIcon,
  MessageCircle,
  Pencil,
  Play,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  contentMediaRule,
  trimMediaForKind,
  type MockScheduledContent,
  type ScheduledContentKind,
  type ScheduledMedia,
  type ScheduledMediaKind,
  type ScheduledContentStatus,
} from "./mock-data";

export const CONTENT_KIND_META: Record<
  ScheduledContentKind,
  { label: string; chip: string; dot: string }
> = {
  post: {
    label: "Post",
    chip: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  reel: {
    label: "Reel",
    chip: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
    dot: "bg-violet-500",
  },
  story: {
    label: "Story",
    chip: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
    dot: "bg-amber-500",
  },
};

export const CONTENT_STATUS_META: Record<ScheduledContentStatus, { label: string; dot: string }> = {
  draft: { label: "Draft", dot: "bg-muted-foreground" },
  scheduled: { label: "Scheduled", dot: "bg-sky-500" },
  published: { label: "Published", dot: "bg-emerald-500" },
};

export type CreateContentTarget = {
  date: Date;
  time: string;
};

function pageInitials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "F";
}

export function PostPreviewDialog({
  item,
  pageName,
  pageColor,
  onOpenChange,
  onEdit,
}: {
  item: MockScheduledContent | null;
  pageName: string;
  pageColor: string;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: MockScheduledContent) => void;
}) {
  const scheduled = item ? new Date(item.scheduledAt) : null;
  const status = item ? CONTENT_STATUS_META[item.status] : null;
  const kind = item ? CONTENT_KIND_META[item.kind] : null;
  const body = item?.caption.trim() || item?.title || "";

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(720px,calc(100%-2rem))] gap-0 overflow-y-auto p-0 sm:max-w-[440px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{item?.title ?? "Post"}</DialogTitle>
          <DialogDescription>
            {pageName}
            {scheduled ? ` · ${format(scheduled, "d MMMM 'at' h:mm a")}` : ""}
          </DialogDescription>
        </DialogHeader>

        {item && scheduled && status && kind ? (
          <article className="bg-background text-foreground">
            <header className="flex items-start gap-2.5 pt-4 pr-12 pb-2 pl-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: pageColor }}
              >
                {pageInitials(pageName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight">{pageName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                  <span>{format(scheduled, "d MMMM 'at' h:mm a")}</span>
                  <span aria-hidden>·</span>
                  <Globe className="h-3 w-3" />
                  <span className="sr-only">Public</span>
                </p>
              </div>
            </header>

            {body ? (
              <p className="px-4 pt-1 pb-3 text-[15px] leading-snug whitespace-pre-wrap">{body}</p>
            ) : null}

            <FacebookMedia
              media={item.media ?? []}
              pageColor={pageColor}
              tall={item.kind === "story"}
              emptyLabel={item.kind === "post" ? null : kind.label}
            />

            <div className="mx-4 border-t" />
            <div className="grid grid-cols-3 px-1 py-1 text-[13px] font-semibold text-muted-foreground">
              <span className="flex items-center justify-center gap-1.5 py-2">
                <ThumbsUp className="h-4 w-4" />
                Like
              </span>
              <span className="flex items-center justify-center gap-1.5 py-2">
                <MessageCircle className="h-4 w-4" />
                Comment
              </span>
              <span className="flex items-center justify-center gap-1.5 py-2">
                <Share2 className="h-4 w-4" />
                Share
              </span>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
              <Button type="button" size="sm" onClick={() => onEdit(item)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit post
              </Button>
            </footer>
          </article>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function FacebookMedia({
  media,
  pageColor,
  tall,
  emptyLabel,
}: {
  media: ScheduledMedia[];
  pageColor: string;
  tall: boolean;
  emptyLabel: string | null;
}) {
  const [index, setIndex] = React.useState(0);
  const mediaKey = media.map((item) => item.id).join("|");

  React.useEffect(() => {
    setIndex(0);
  }, [mediaKey]);

  if (media.length === 0) {
    if (!emptyLabel) return null;
    return (
      <div
        className={cn("relative flex items-end px-4 py-4 text-white", tall ? "min-h-72" : "min-h-52")}
        style={{ background: `linear-gradient(165deg, ${pageColor} 0%, #111827 80%)` }}
      >
        <span className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20">
          <Play className="ml-0.5 h-6 w-6 fill-white" />
        </span>
        <span className="text-xs font-semibold tracking-wide uppercase">{emptyLabel}</span>
      </div>
    );
  }

  const current = media[Math.min(index, media.length - 1)]!;
  const several = media.length > 1;

  return (
    <div className="relative bg-black">
      <MediaSlide item={current} tall={tall} />
      {several ? (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm"
            aria-label="Previous media"
            onClick={() => setIndex((value) => (value - 1 + media.length) % media.length)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm"
            aria-label="Next media"
            onClick={() => setIndex((value) => (value + 1) % media.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="absolute top-3 right-3 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
            {Math.min(index, media.length - 1) + 1} / {media.length}
          </span>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
            {media.map((item, dotIndex) => (
              <span
                key={item.id}
                className={cn("h-1.5 w-1.5 rounded-full", dotIndex === index ? "bg-white" : "bg-white/40")}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function MediaSlide({ item, tall }: { item: ScheduledMedia; tall: boolean }) {
  const frame = cn("w-full bg-black object-contain", tall ? "max-h-80 aspect-[9/16]" : "max-h-[420px] aspect-square");

  if (item.kind === "video" && item.src) {
    return <video className={frame} src={item.src} controls playsInline />;
  }

  if (item.kind === "photo" && item.src) {
    return <img className={frame} src={item.src} alt={item.name} />;
  }

  return (
    <div
      className={cn("relative flex w-full items-end p-4 text-white", tall ? "min-h-72" : "min-h-64")}
      style={{ background: `linear-gradient(165deg, ${item.color} 0%, #111827 78%)` }}
    >
      {item.kind === "video" ? (
        <span className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20">
          <Play className="ml-0.5 h-6 w-6 fill-white" />
        </span>
      ) : (
        <ImageIcon className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/80" />
      )}
      <span className="text-xs font-medium">{item.name}</span>
    </div>
  );
}

function revokeBlob(item: ScheduledMedia) {
  if (item.src?.startsWith("blob:")) URL.revokeObjectURL(item.src);
}

function MediaOrderEditor({
  kind,
  media,
  onChange,
}: {
  kind: ScheduledContentKind;
  media: ScheduledMedia[];
  onChange: (media: ScheduledMedia[]) => void;
}) {
  const rule = contentMediaRule(kind);
  const photoInput = React.useRef<HTMLInputElement>(null);
  const videoInput = React.useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const canAdd = media.length < rule.max;

  const addFiles = (fileList: FileList | null, mediaKind: ScheduledMediaKind) => {
    const files = fileList ? Array.from(fileList) : [];
    if (photoInput.current) photoInput.current.value = "";
    if (videoInput.current) videoInput.current.value = "";
    if (files.length === 0) return;
    if (!rule.kinds.includes(mediaKind)) {
      toast.error(kind === "reel" ? "A reel can only be a video." : "That file type is not allowed here.");
      return;
    }

    const next = [...media];
    let skipped = 0;
    for (const file of files) {
      if (next.length >= rule.max) {
        skipped += 1;
        continue;
      }
      next.push({
        id: `med_${crypto.randomUUID()}`,
        kind: mediaKind,
        name: file.name,
        src: URL.createObjectURL(file),
        color: mediaKind === "video" ? "#111827" : "#1d4ed8",
      });
    }
    if (skipped > 0) {
      toast.error(
        rule.max === 1
          ? "Facebook allows one file for this type."
          : `A Facebook carousel stops at ${rule.max} items. Extra files were left out.`,
      );
    }
    onChange(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = media.findIndex((item) => item.id === active.id);
    const newIndex = media.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(media, oldIndex, newIndex));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    onChange(arrayMove(media, index, target));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">Media</Label>
        <span className="text-[11px] text-muted-foreground">
          {media.length} / {rule.max}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{rule.hint}</p>

      {media.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} autoScroll={false} onDragEnd={handleDragEnd}>
          <SortableContext items={media.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {media.map((item, index) => (
                <SortableMediaRow
                  key={item.id}
                  item={item}
                  index={index}
                  total={media.length}
                  onMove={(direction) => move(index, direction)}
                  onRemove={() => {
                    revokeBlob(item);
                    onChange(media.filter((entry) => entry.id !== item.id));
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          {kind === "post" ? "No media yet. A text-only post is fine." : "Add the file Facebook will publish."}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {rule.kinds.includes("photo") ? (
          <>
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              multiple={rule.max > 1}
              className="sr-only"
              onChange={(event) => addFiles(event.target.files, "photo")}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAdd}
              onClick={() => photoInput.current?.click()}
            >
              <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
              Add photo
            </Button>
          </>
        ) : null}
        {rule.kinds.includes("video") ? (
          <>
            <input
              ref={videoInput}
              type="file"
              accept="video/*"
              multiple={rule.max > 1}
              className="sr-only"
              onChange={(event) => addFiles(event.target.files, "video")}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAdd}
              onClick={() => videoInput.current?.click()}
            >
              <Film className="mr-1.5 h-3.5 w-3.5" />
              Add video
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SortableMediaRow({
  item,
  index,
  total,
  onMove,
  onRemove,
}: {
  item: ScheduledMedia;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background px-2 py-1.5",
        isDragging && "z-10 opacity-80 shadow-md",
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label={`Drag ${item.name} to a new position`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-4 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
      <MediaThumb item={item} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{item.name}</span>
        <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
          {item.kind === "video" ? "Video" : "Photo"}
        </span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={index === 0}
        aria-label="Move earlier"
        onClick={() => onMove(-1)}
      >
        <ChevronLeft className="h-3.5 w-3.5 -rotate-90" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={index === total - 1}
        aria-label="Move later"
        onClick={() => onMove(1)}
      >
        <ChevronRight className="h-3.5 w-3.5 -rotate-90" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        aria-label={`Remove ${item.name}`}
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
}

function MediaThumb({ item }: { item: ScheduledMedia }) {
  if (item.kind === "photo" && item.src) {
    return <img src={item.src} alt="" className="h-9 w-9 rounded object-cover" />;
  }
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded text-white"
      style={{ backgroundColor: item.color }}
    >
      {item.kind === "video" ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
    </span>
  );
}

export function CreateContentDialog({
  open,
  onOpenChange,
  pageName,
  target,
  editing,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageName: string;
  target: CreateContentTarget | null;
  editing?: MockScheduledContent | null;
  onCreate: (item: Omit<MockScheduledContent, "id" | "pageId">) => void;
  onUpdate?: (item: MockScheduledContent) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [kind, setKind] = React.useState<ScheduledContentKind>("post");
  const [status, setStatus] = React.useState<ScheduledContentStatus>("scheduled");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("09:00");
  const [media, setMedia] = React.useState<ScheduledMedia[]>([]);

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      const scheduled = new Date(editing.scheduledAt);
      setTitle(editing.title);
      setCaption(editing.caption);
      setKind(editing.kind);
      setStatus(editing.status);
      setDate(format(scheduled, "yyyy-MM-dd"));
      setTime(format(scheduled, "HH:mm"));
      setMedia(editing.media ?? []);
      return;
    }
    if (!target) return;
    setTitle("");
    setCaption("");
    setKind("post");
    setStatus("scheduled");
    setDate(format(target.date, "yyyy-MM-dd"));
    setTime(target.time);
    setMedia([]);
  }, [open, target, editing]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !date || !time) {
      toast.error("Add a title, date, and time");
      return;
    }
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(year, (month ?? 1) - 1, day, hours, minutes, 0, 0);
    const draft = {
      title: trimmed,
      caption: caption.trim(),
      kind,
      status,
      scheduledAt: format(scheduledAt, "yyyy-MM-dd'T'HH:mm:ss"),
      media,
    };
    if (editing) {
      onUpdate?.({ ...editing, ...draft });
      toast.success("Post updated");
    } else {
      onCreate(draft);
      toast.success(status === "draft" ? "Draft saved on the calendar" : "Content added to the calendar");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(720px,calc(100%-2rem))] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit post" : "Add content"}</DialogTitle>
          <DialogDescription>
            {editing
              ? `Update this ${CONTENT_KIND_META[editing.kind].label.toLowerCase()} on ${pageName}.`
              : `Schedule a post, reel, or story on ${pageName}.`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="content-date" className="text-sm font-medium">
                Date
              </Label>
              <Input id="content-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-time" className="text-sm font-medium">
                Time
              </Label>
              <Input id="content-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <Select
                value={kind}
                onValueChange={(value) => {
                  const nextKind = value as ScheduledContentKind;
                  setKind(nextKind);
                  setMedia((current) => {
                    const trimmed = trimMediaForKind(current, nextKind);
                    if (trimmed.length === current.length) return current;
                    current.filter((item) => !trimmed.includes(item)).forEach(revokeBlob);
                    toast("Some media was removed so it matches what Facebook allows for this type.");
                    return trimmed;
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ScheduledContentStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="content-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Internal name for this piece"
            />
          </div>

          <MediaOrderEditor kind={kind} media={media} onChange={setMedia} />

          <div className="space-y-2">
            <Label htmlFor="content-caption" className="text-sm font-medium">
              Caption
            </Label>
            <Textarea
              id="content-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="What should this say?"
              className="min-h-24"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editing ? "Save changes" : "Add to calendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
