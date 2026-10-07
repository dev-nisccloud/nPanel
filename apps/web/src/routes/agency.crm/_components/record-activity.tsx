import { useState } from "react";
import { CheckSquare, Phone, StickyNote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { CrmEmptyLine, CrmInfoCard, formatCrmDate } from "./crm-detail";

type Scope = {
  companyId?: string;
  contactId?: string;
  dealId?: string;
};

const ACTIVITY_TYPES = [
  { id: "call", label: "Call" },
  { id: "email", label: "Email" },
  { id: "meeting", label: "Meeting" },
  { id: "note", label: "Note" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "sms", label: "SMS" },
] as const;

export function RecordNotes({ scope }: { scope: Scope }) {
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const notesQuery = trpc.crm.notes.list.useQuery({ page: 1, limit: 20, ...scope });
  const notes = notesQuery.data?.data ?? [];

  const create = trpc.crm.notes.create.useMutation({
    onSuccess: () => {
      setContent("");
      utils.crm.notes.list.invalidate();
      utils.crm.companies.get.invalidate();
    },
    onError: (error) => toast.error(error.message || "Failed to add note"),
  });

  return (
    <CrmInfoCard icon={StickyNote} title="Notes" description={`${notes.length} saved`}>
      <div className="space-y-2 border-b px-4 py-3">
        <Textarea
          rows={2}
          placeholder="Add a note"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={!content.trim() || create.isPending}
            onClick={() => create.mutate({ content: content.trim(), isPinned: false, ...scope })}
          >
            Add note
          </Button>
        </div>
      </div>
      {notes.length === 0 ? (
        <CrmEmptyLine>No notes yet.</CrmEmptyLine>
      ) : (
        <div className="divide-y divide-border">
          {notes.map((note) => (
            <div key={note.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {note.createdBy?.name || "Note"}
                  {note.isPinned ? " · Pinned" : ""}
                </p>
                <p className="text-xs text-muted-foreground">{formatCrmDate(note.createdAt)}</p>
              </div>
              <p className="mt-1 text-sm text-primary">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </CrmInfoCard>
  );
}

export function RecordTasks({ scope }: { scope: Scope }) {
  const utils = trpc.useUtils();
  const { data: session } = authClient.useSession();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const tasksQuery = trpc.crm.tasks.list.useQuery({ page: 1, limit: 20, ...scope });
  const tasks = tasksQuery.data?.data ?? [];

  const create = trpc.crm.tasks.create.useMutation({
    onSuccess: () => {
      setTitle("");
      utils.crm.tasks.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Failed to add task"),
  });

  return (
    <CrmInfoCard icon={CheckSquare} title="Tasks" description={`${tasks.length} open and done`}>
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <Input
          className="h-8 max-w-sm"
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Select value={priority} onValueChange={(value) => setPriority(value as typeof priority)}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          disabled={!title.trim() || !session?.user?.id || create.isPending}
          onClick={() =>
            create.mutate({
              title: title.trim(),
              priority,
              status: "todo",
              assignedToId: session?.user?.id ?? "",
              ...scope,
            })
          }
        >
          Add task
        </Button>
      </div>
      {tasks.length === 0 ? (
        <CrmEmptyLine>No tasks yet.</CrmEmptyLine>
      ) : (
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.assignedTo?.name || "Unassigned"}
                  {task.dueDate ? ` · Due ${formatCrmDate(task.dueDate)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {task.status.replace("_", " ")}
                </Badge>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {task.priority}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </CrmInfoCard>
  );
}

export function RecordActivities({ scope }: { scope: Scope }) {
  const utils = trpc.useUtils();
  const [subject, setSubject] = useState("");
  const [activityType, setActivityType] = useState<(typeof ACTIVITY_TYPES)[number]["id"]>("call");
  const activitiesQuery = trpc.crm.activities.list.useQuery({ page: 1, limit: 20, ...scope });
  const activities = activitiesQuery.data?.data ?? [];

  const create = trpc.crm.activities.create.useMutation({
    onSuccess: () => {
      setSubject("");
      utils.crm.activities.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Failed to log activity"),
  });

  return (
    <CrmInfoCard icon={Phone} title="Activities" description="Calls, meetings, and messages">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <Select value={activityType} onValueChange={(value) => setActivityType(value as typeof activityType)}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="h-8 max-w-sm"
          placeholder="Subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
        <Button
          type="button"
          size="sm"
          disabled={!subject.trim() || create.isPending}
          onClick={() =>
            create.mutate({
              activityType,
              subject: subject.trim(),
              ...scope,
            })
          }
        >
          Log
        </Button>
      </div>
      {activities.length === 0 ? (
        <CrmEmptyLine>No activities yet.</CrmEmptyLine>
      ) : (
        <div className="divide-y divide-border">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">{activity.subject}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {activity.activityType.replaceAll("_", " ")}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">{formatCrmDate(activity.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </CrmInfoCard>
  );
}
