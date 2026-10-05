"use client";

import * as React from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

import type { MockScheduledContent, ScheduledContentKind, ScheduledContentStatus } from "./mock-data";

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

export function DayScheduleDialog({
  date,
  items,
  pageName,
  onOpenChange,
  onAdd,
}: {
  date: Date | null;
  items: MockScheduledContent[];
  pageName: string;
  onOpenChange: (open: boolean) => void;
  onAdd: (date: Date) => void;
}) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{date ? format(date, "EEEE, MMM d") : "Day"}</DialogTitle>
          <DialogDescription>
            {sorted.length === 0
              ? `Nothing scheduled on ${pageName} for this day.`
              : `${sorted.length} item${sorted.length === 1 ? "" : "s"} on ${pageName}.`}
          </DialogDescription>
        </DialogHeader>

        {sorted.length > 0 ? (
          <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {sorted.map((item) => {
              const kind = CONTENT_KIND_META[item.kind];
              const status = CONTENT_STATUS_META[item.status];
              return (
                <li key={item.id} className={cn("rounded-lg border px-3 py-2", kind.chip)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{format(new Date(item.scheduledAt), "h:mm a")}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide">
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs opacity-80">{item.caption}</p>
                  <Badge variant="outline" className="mt-2 border-current/20 bg-background/60 px-1.5 py-0 text-[10px]">
                    {kind.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Pick a time and draft the first piece for this day.
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (date) onAdd(date);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateContentDialog({
  open,
  onOpenChange,
  pageName,
  target,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageName: string;
  target: CreateContentTarget | null;
  onCreate: (item: Omit<MockScheduledContent, "id" | "pageId">) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [kind, setKind] = React.useState<ScheduledContentKind>("post");
  const [status, setStatus] = React.useState<ScheduledContentStatus>("scheduled");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("09:00");

  React.useEffect(() => {
    if (!open || !target) return;
    setTitle("");
    setCaption("");
    setKind("post");
    setStatus("scheduled");
    setDate(format(target.date, "yyyy-MM-dd"));
    setTime(target.time);
  }, [open, target]);

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
    onCreate({
      title: trimmed,
      caption: caption.trim(),
      kind,
      status,
      scheduledAt: format(scheduledAt, "yyyy-MM-dd'T'HH:mm:ss"),
    });
    toast.success(status === "draft" ? "Draft saved on the calendar" : "Content added to the calendar");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add content</DialogTitle>
          <DialogDescription>Schedule a post, reel, or story on {pageName}.</DialogDescription>
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
              <Select value={kind} onValueChange={(value) => setKind(value as ScheduledContentKind)}>
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
              Add to calendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
