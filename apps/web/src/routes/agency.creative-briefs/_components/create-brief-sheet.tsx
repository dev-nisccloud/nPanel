"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { FileText, XIcon, Image, X, Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dropzone, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import type { ComboboxItem } from "@npanel/ui/components/combobox-dropdown";

const STYLE_PRESETS = ["Minimal", "Corporate", "Playful", "Modern", "Retro", "Bold", "Elegant", "Clean"] as const;

/** Sentinel id for optional team combobox (must not collide with real team IDs). */
const OPTIONAL_TEAM_SENTINEL = "__npanel_brief_team_none__";

const FormSchema = z.object({
  name: z.string().min(1, { message: "Brief name is required." }),
  teamId: z.string().optional(),
  approverUserId: z.string().optional(),
  background: z.string().min(1, { message: "Background is required." }),
  objectives: z.string().min(1, { message: "Objectives are required." }),
  requirements: z.string().min(1, { message: "Requirements are required." }),
  comments: z.string().optional(),
  style: z.string().optional(),
  copy: z.string().optional(),
  mandatoryElements: z.string().optional(),
  designPreference: z.string().optional(),
  timelineStartDate: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return undefined;
      if (val instanceof Date) return val;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z.date().optional()
  ),
  timelineEndDate: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return undefined;
      if (val instanceof Date) return val;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z.date().optional()
  ),
  referenceImages: z.array(z.object({
    fileUrl: z.string(),
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileMetadata: z.unknown().optional(),
  })).optional(),
});

interface CreateBriefSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBrief?: () => void;
}

interface SelectedFile {
  file: File;
  preview: string;
}

interface ReferenceImage {
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileMetadata?: unknown;
}

export function CreateBriefSheet({ open, onOpenChange, onCreateBrief }: CreateBriefSheetProps) {
  // Agency: all teams (not only teams the caller is a member of)
  const { data: teams, isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { data: usersForApprover = [], isLoading: isLoadingUsers } = trpc.creativeBriefs.listUsersForApprover.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const [approverComboboxOpen, setApproverComboboxOpen] = React.useState(false);

  // Create brief mutation
  const createBriefMutation = trpc.creativeBriefs.create.useMutation({
    onSuccess: () => {
      toast.success("Creative brief created successfully!");
      form.reset();
      // Clean up preview URLs
      selectedFiles.forEach((item) => {
        URL.revokeObjectURL(item.preview);
      });
      setSelectedFiles([]);
      setDateRange(undefined);
      onOpenChange(false);
      onCreateBrief?.();
    },
    onError: (error) => {
      toast.error("Failed to create brief", {
        description: error.message,
      });
    },
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      teamId: "",
      approverUserId: "",
      background: "",
      objectives: "",
      requirements: "",
      comments: "",
      style: "",
      copy: "",
      mandatoryElements: "",
      designPreference: "",
      timelineStartDate: undefined,
      timelineEndDate: undefined,
      referenceImages: [],
    },
  });

  const [selectedFiles, setSelectedFiles] = React.useState<SelectedFile[]>([]);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const isSubmitting = createBriefMutation.isPending || isUploadingImages;

  const teamComboboxItems: ComboboxItem[] = React.useMemo(() => {
    const none: ComboboxItem = { id: OPTIONAL_TEAM_SENTINEL, label: "No team (optional)" };
    if (!teams) return [none];
    return [none, ...teams.map((team) => ({ id: team.id, label: team.name }))];
  }, [teams]);

  const teamIdValue = form.watch("teamId");
  const selectedTeamCombo = React.useMemo(() => {
    if (!teamIdValue) return teamComboboxItems.find((t) => t.id === OPTIONAL_TEAM_SENTINEL);
    return teamComboboxItems.find((t) => t.id === teamIdValue);
  }, [teamIdValue, teamComboboxItems]);

  // Handle file drop - just add to local state, don't upload yet
  const handleDrop = (acceptedFiles: File[]) => {
    if (selectedFiles.length + acceptedFiles.length > 5) {
      toast.error("Maximum 5 reference images allowed");
      return;
    }

    if (isSubmitting) return;

    const filesToAdd = acceptedFiles.slice(0, 5 - selectedFiles.length);
    const newFiles: SelectedFile[] = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  // Remove reference image
  const handleRemoveImage = (index: number) => {
    if (isSubmitting) return;
    const fileToRemove = selectedFiles[index];
    URL.revokeObjectURL(fileToRemove.preview);
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  // Update date range
  React.useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      form.setValue("timelineStartDate", dateRange.from);
      form.setValue("timelineEndDate", dateRange.to);
    } else {
      form.setValue("timelineStartDate", undefined);
      form.setValue("timelineEndDate", undefined);
    }
  }, [dateRange, form]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsUploadingImages(true);
    try {
      // Upload files to UploadThing first
      let uploadedImages: ReferenceImage[] = [];
      if (selectedFiles.length > 0) {
        const filesToUpload = selectedFiles.map((item) => item.file);
        const response = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
          files: filesToUpload,
        });

        if (!response || response.length === 0) {
          throw new Error("No files were uploaded");
        }

        uploadedImages = response.map((file) => ({
          fileUrl: file.ufsUrl || file.url || "",
          fileKey: file.key || "",
          fileName: file.name || "",
          fileSize: file.size || 0,
          mimeType: file.type || "",
          fileMetadata: undefined,
        }));
      }

      // Now create the brief with uploaded images
      // Ensure dates are Date objects (not strings)
      const timelineStartDate = data.timelineStartDate instanceof Date 
        ? data.timelineStartDate 
        : data.timelineStartDate 
          ? new Date(data.timelineStartDate) 
          : undefined;
      const timelineEndDate = data.timelineEndDate instanceof Date 
        ? data.timelineEndDate 
        : data.timelineEndDate 
          ? new Date(data.timelineEndDate) 
          : undefined;

      createBriefMutation.mutate({
        name: data.name,
        teamId: data.teamId || undefined,
        approverUserId: data.approverUserId || undefined,
        background: data.background,
        objectives: data.objectives,
        requirements: data.requirements,
        comments: data.comments || undefined,
        style: data.style || undefined,
        copy: data.copy || undefined,
        mandatoryElements: data.mandatoryElements || undefined,
        designPreference: data.designPreference || undefined,
        timelineStartDate,
        timelineEndDate,
        referenceImages: uploadedImages.length > 0 ? uploadedImages : undefined,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Reset form and clean up when sheet closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      // Clean up preview URLs
      setSelectedFiles((prev) => {
        prev.forEach((item) => {
          URL.revokeObjectURL(item.preview);
        });
        return [];
      });
      setDateRange(undefined);
    }
  }, [open, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-hidden">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Create Creative Brief</SheetTitle>
              <SheetDescription className="text-base">
                Create a new creative brief for your design project
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
              disabled={isSubmitting}
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-1 pb-1">
              <Form {...form}>
                <form id="create-brief-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Brief Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Brief Information
                    </CardTitle>
                    <CardDescription>Basic brief details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brief Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter the name of the creative brief"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="teamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team (Optional)</FormLabel>
                          <FormControl>
                            {isLoadingTeams ? (
                              <div className="flex items-center justify-center h-10 border rounded-md">
                                <Spinner variant="ellipsis" size="sm" />
                              </div>
                            ) : (
                              <ComboboxDropdown
                                placeholder="Select a team (optional)"
                                searchPlaceholder="Search teams..."
                                items={teamComboboxItems}
                                selectedItem={selectedTeamCombo}
                                onSelect={(item) => {
                                  field.onChange(item.id === OPTIONAL_TEAM_SENTINEL ? "" : item.id);
                                }}
                                emptyResults="No teams found"
                                disabled={isSubmitting}
                                className="w-full"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="approverUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approver (Optional)</FormLabel>
                          <Popover open={approverComboboxOpen} onOpenChange={setApproverComboboxOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={approverComboboxOpen}
                                  className="w-full justify-between font-normal"
                                  disabled={isSubmitting || isLoadingUsers}
                                >
                                  {field.value
                                    ? usersForApprover.find((u) => u.id === field.value)?.name ?? field.value
                                    : "Select approver..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search users..." />
                                <CommandList>
                                  <CommandEmpty>No users found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value=""
                                      onSelect={() => {
                                        field.onChange("");
                                        setApproverComboboxOpen(false);
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
                                      None
                                    </CommandItem>
                                    {usersForApprover.map((u) => (
                                      <CommandItem
                                        key={u.id}
                                        value={`${u.name} ${u.email}`}
                                        onSelect={() => {
                                          field.onChange(u.id);
                                          setApproverComboboxOpen(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", field.value === u.id ? "opacity-100" : "opacity-0")} />
                                        <span className="truncate">{u.name}</span>
                                        <span className="ml-1 shrink-0 text-muted-foreground text-xs truncate">({u.email})</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Brief Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Brief Content</CardTitle>
                    <CardDescription>Describe the project background, objectives, and requirements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="background"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the background and context of the project. What is the purpose and what problem are we solving?"
                              className="resize-none"
                              rows={4}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="objectives"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objectives</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What are the main objectives and goals for this project? What do you want to achieve?"
                              className="resize-none"
                              rows={4}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Design Requirements</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List the specific design requirements, specifications, and any technical constraints"
                              className="resize-none"
                              rows={4}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Design specifics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Design specifics</CardTitle>
                    <CardDescription>Style, copy, mandatory elements, and design preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="style"
                      render={({ field }) => {
                        const tags = (field.value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                        const toggleTag = (tag: string) => {
                          const next = tags.includes(tag)
                            ? tags.filter((t) => t !== tag)
                            : [...tags, tag];
                          field.onChange(next.join(", ") || "");
                        };
                        const addCustom = (custom: string) => {
                          const t = custom.trim();
                          if (t && !tags.includes(t)) {
                            field.onChange([...tags, t].join(", ") || "");
                          }
                        };
                        return (
                          <FormItem>
                            <FormLabel>Style (Optional)</FormLabel>
                            <FormControl>
                              <div className="space-y-2 w-full">
                                <div className="flex flex-wrap gap-2">
                                  {STYLE_PRESETS.map((preset) => (
                                    <Badge
                                      key={preset}
                                      variant={tags.includes(preset) ? "default" : "outline"}
                                      className="cursor-pointer select-none"
                                      onClick={() => !isSubmitting && toggleTag(preset)}
                                    >
                                      {preset}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {tags.filter((t) => !STYLE_PRESETS.includes(t as typeof STYLE_PRESETS[number])).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="cursor-pointer select-none"
                                      onClick={() => !isSubmitting && toggleTag(tag)}
                                    >
                                      {tag} ×
                                    </Badge>
                                  ))}
                                </div>
                                <Input
                                  placeholder="Type a custom style and press Enter"
                                  className="w-full"
                                  disabled={isSubmitting}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const t = (e.target as HTMLInputElement).value;
                                      if (t) {
                                        addCustom(t);
                                        (e.target as HTMLInputElement).value = "";
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="copy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Copy / Content (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Content or copy you want used in the design"
                              className="resize-none w-full"
                              rows={3}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mandatoryElements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mandatory elements (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Things that must be included in the design"
                              className="resize-none w-full"
                              rows={3}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="designPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Design preference (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any design preferences or direction"
                              className="resize-none w-full"
                              rows={3}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                    <CardDescription>Expected delivery date range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from && dateRange?.to ? (
                            format(dateRange.from, "MMM dd") === format(dateRange.to, "MMM dd") ? (
                              format(dateRange.from, "MMM dd, yyyy")
                            ) : (
                              <>
                                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                              </>
                            )
                          ) : (
                            "Pick a date range"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>

                {/* Reference Images */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Image className="h-5 w-5" />
                      Reference Images
                    </CardTitle>
                    <CardDescription>
                      Upload up to 5 reference images to provide visual inspiration and examples
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedFiles.length < 5 && (
                      <Dropzone
                        onDrop={handleDrop}
                        maxFiles={5 - selectedFiles.length}
                        maxSize={16 * 1024 * 1024} // 16MB
                        accept={{ "image/*": [] }}
                        disabled={isSubmitting}
                        className="w-full border-2 border-dashed transition-colors min-w-0"
                      >
                        <DropzoneEmptyState>
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="mb-3 p-3 bg-primary/10 rounded-full">
                              <Image className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium mb-1">Upload Reference Images</p>
                            <p className="text-xs text-muted-foreground">
                              Drag and drop or click to select
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Images only (up to 5, 16MB each)
                            </p>
                          </div>
                        </DropzoneEmptyState>
                      </Dropzone>
                    )}

                    {/* Selected Images */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        {selectedFiles.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border min-w-0"
                          >
                            <div className="flex-shrink-0">
                              <img
                                src={item.preview}
                                alt={item.file.name}
                                className="h-12 w-12 object-cover rounded"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveImage(index)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Comments</CardTitle>
                    <CardDescription>Any additional notes or comments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional comments or notes about the brief"
                              className="resize-none"
                              rows={4}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="gap-2 sm:gap-0 flex-shrink-0 border-t pt-4 mt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" form="create-brief-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner variant="ellipsis" className="mr-2" size="sm" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Create Brief
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
