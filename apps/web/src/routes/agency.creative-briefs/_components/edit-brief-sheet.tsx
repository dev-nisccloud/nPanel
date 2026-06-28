"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { FileText, XIcon, Image, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import {
	mapStorageResultToReferenceImage,
	uploadErrorMessage,
} from "@/lib/app-file-upload";
import { STORAGE_PREFIXES } from "@/lib/storage-prefixes";

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
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { creativeBriefSchema } from "./schema";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import type { ComboboxItem } from "@npanel/ui/components/combobox-dropdown";

const STYLE_PRESETS = ["Minimal", "Corporate", "Playful", "Modern", "Retro", "Bold", "Elegant", "Clean"] as const;

/** Sentinel id for optional team combobox (must not collide with real team IDs). */
const OPTIONAL_TEAM_SENTINEL = "__npanel_brief_team_none__";

// Edit schema - only some fields are editable
const EditFormSchema = z.object({
  name: z.string().min(1, { message: "Brief name is required." }).optional(),
  teamId: z.string().optional(),
  background: z.string().min(1, { message: "Background is required." }).optional(),
  objectives: z.string().min(1, { message: "Objectives are required." }).optional(),
  requirements: z.string().min(1, { message: "Requirements are required." }).optional(),
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
}).refine(
  (data) => {
    return (
      data.name !== undefined ||
      data.teamId !== undefined ||
      data.background !== undefined ||
      data.objectives !== undefined ||
      data.requirements !== undefined ||
      data.comments !== undefined ||
      data.style !== undefined ||
      data.copy !== undefined ||
      data.mandatoryElements !== undefined ||
      data.designPreference !== undefined ||
      data.timelineStartDate !== undefined ||
      data.timelineEndDate !== undefined ||
      data.referenceImages !== undefined
    );
  },
  { message: "At least one field must be updated" }
);

interface EditBriefSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brief: z.infer<typeof creativeBriefSchema> | null;
  onEditBrief?: () => void;
}

interface ReferenceImage {
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileMetadata?: unknown;
}

interface SelectedFile {
  file: File;
  preview: string;
}

interface ExistingImage {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export function EditBriefSheet({ open, onOpenChange, brief, onEditBrief }: EditBriefSheetProps) {
  // Agency: all teams (not only teams the caller is a member of)
  const { data: teams, isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Update brief mutation
  const updateBriefMutation = trpc.creativeBriefs.update.useMutation({
    onSuccess: () => {
      toast.success("Creative brief updated successfully!");
      form.reset();
      // Clean up preview URLs
      selectedFiles.forEach((item) => {
        URL.revokeObjectURL(item.preview);
      });
      setSelectedFiles([]);
      setExistingImages([]);
      setDateRange(undefined);
      onOpenChange(false);
      onEditBrief?.();
    },
    onError: (error) => {
      toast.error("Failed to update brief", {
        description: error.message,
      });
    },
  });

  // Initialize form with brief data
  const form = useForm<z.infer<typeof EditFormSchema>>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      name: brief?.name || "",
      teamId: brief?.teamId || "",
      background: brief?.background || "",
      objectives: brief?.objectives || "",
      requirements: brief?.requirements || "",
      comments: brief?.comments || "",
      style: brief?.style ?? "",
      copy: brief?.copy ?? "",
      mandatoryElements: brief?.mandatoryElements ?? "",
      designPreference: brief?.designPreference ?? "",
      timelineStartDate: brief?.timelineStartDate || undefined,
      timelineEndDate: brief?.timelineEndDate || undefined,
      referenceImages: [],
    },
  });

  // Initialize form and state when brief changes or sheet opens
  React.useEffect(() => {
    if (brief && open) {
      // Reset form with brief data
      form.reset({
        name: brief.name || "",
        teamId: brief.teamId || "",
        background: brief.background || "",
        objectives: brief.objectives || "",
        requirements: brief.requirements || "",
        comments: brief.comments || "",
        style: brief.style ?? "",
        copy: brief.copy ?? "",
        mandatoryElements: brief.mandatoryElements ?? "",
        designPreference: brief.designPreference ?? "",
        timelineStartDate: brief.timelineStartDate || undefined,
        timelineEndDate: brief.timelineEndDate || undefined,
        referenceImages: [],
      });

      // Initialize reference images from brief
      if (brief.referenceImages && brief.referenceImages.length > 0) {
        const images: ExistingImage[] = brief.referenceImages.map((img) => ({
          id: img.id,
          fileUrl: img.fileUrl,
          fileName: img.fileName,
          fileSize: img.fileSize,
        }));
        setExistingImages(images);
      } else {
        setExistingImages([]);
      }

      // Initialize date range
      if (brief.timelineStartDate && brief.timelineEndDate) {
        setDateRange({
          from: brief.timelineStartDate,
          to: brief.timelineEndDate,
        });
      } else {
        setDateRange(undefined);
      }

      // Clear any selected files when opening a new brief
      setSelectedFiles((prev) => {
        prev.forEach((item) => {
          URL.revokeObjectURL(item.preview);
        });
        return [];
      });
    }
  }, [brief, open, form]);

  const [existingImages, setExistingImages] = React.useState<ExistingImage[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<SelectedFile[]>([]);
  const {
    uploadBatch,
    isUploading: isUploadingImages,
    progressPercent,
    progressLabel,
  } = useAppFileUpload();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const isSubmitting = updateBriefMutation.isPending || isUploadingImages;

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
    const totalImages = existingImages.length + selectedFiles.length;
    if (totalImages + acceptedFiles.length > 5) {
      toast.error("Maximum 5 reference images allowed");
      return;
    }

    if (isSubmitting) return;

    const filesToAdd = acceptedFiles.slice(0, 5 - totalImages);
    const newFiles: SelectedFile[] = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  // Remove existing image (from database)
  const handleRemoveExistingImage = (index: number) => {
    if (isSubmitting) return;
    const newImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newImages);
  };

  // Remove selected file (new upload)
  const handleRemoveSelectedFile = (index: number) => {
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

  const onSubmit = async (data: z.infer<typeof EditFormSchema>) => {
    if (!brief) return;

    try {
      let uploadedNewImages: ReferenceImage[] = [];
      if (selectedFiles.length > 0) {
        const filesToUpload = selectedFiles.map((item) => item.file);
        const results = await uploadBatch(filesToUpload, STORAGE_PREFIXES.IMAGES);
        uploadedNewImages = results.map((file, index) =>
          mapStorageResultToReferenceImage(file, filesToUpload[index]!),
        );
      }

      // Combine existing images (from brief) with newly uploaded images
      const allReferenceImages: ReferenceImage[] = [
        // Keep existing images that weren't removed
        ...(brief.referenceImages || [])
          .filter((img) => existingImages.some((existing) => existing.id === img.id))
          .map((img) => ({
            fileUrl: img.fileUrl,
            fileKey: img.fileKey,
            fileName: img.fileName,
            fileSize: img.fileSize,
            mimeType: img.mimeType,
            fileMetadata: img.fileMetadata,
          })),
        // Add newly uploaded images
        ...uploadedNewImages,
      ];

      // Only send fields that have changed
      // Type assertion needed because tRPC infers timelineStartDate/timelineEndDate as required
      // but they're actually optional in the schema
      const updateData = {
        id: brief.id,
        ...(data.name !== undefined && data.name !== brief.name && { name: data.name }),
        ...(data.teamId !== undefined && data.teamId !== brief.teamId && { teamId: data.teamId || undefined }),
        ...(data.background !== undefined && data.background !== brief.background && { background: data.background }),
        ...(data.objectives !== undefined && data.objectives !== brief.objectives && { objectives: data.objectives }),
        ...(data.requirements !== undefined && data.requirements !== brief.requirements && { requirements: data.requirements }),
        ...(data.comments !== undefined && data.comments !== (brief.comments ?? "") && { comments: data.comments || undefined }),
        ...(data.style !== undefined && data.style !== (brief.style ?? "") && { style: data.style || undefined }),
        ...(data.copy !== undefined && data.copy !== (brief.copy ?? "") && { copy: data.copy || undefined }),
        ...(data.mandatoryElements !== undefined && data.mandatoryElements !== (brief.mandatoryElements ?? "") && { mandatoryElements: data.mandatoryElements || undefined }),
        ...(data.designPreference !== undefined && data.designPreference !== (brief.designPreference ?? "") && { designPreference: data.designPreference || undefined }),
        ...(data.timelineStartDate !== undefined || data.timelineEndDate !== undefined ? {
          timelineStartDate: data.timelineStartDate instanceof Date 
            ? data.timelineStartDate 
            : data.timelineStartDate 
              ? new Date(data.timelineStartDate) 
              : undefined,
          timelineEndDate: data.timelineEndDate instanceof Date 
            ? data.timelineEndDate 
            : data.timelineEndDate 
              ? new Date(data.timelineEndDate) 
              : undefined,
        } : {}),
        ...(selectedFiles.length > 0 || existingImages.length !== (brief.referenceImages?.length || 0) ? {
          referenceImages: allReferenceImages,
        } : {}),
      } as Parameters<typeof updateBriefMutation.mutate>[0];

      updateBriefMutation.mutate(updateData);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images", {
        description: uploadErrorMessage(error),
      });
    }
  };

  // Reset form and clean up when sheet closes
  React.useEffect(() => {
    if (!open) {
      // Clean up preview URLs
      setSelectedFiles((prev) => {
        prev.forEach((item) => {
          URL.revokeObjectURL(item.preview);
        });
        return [];
      });
      setExistingImages([]);
      setDateRange(undefined);
      // Don't reset form here - let it reset when brief changes
    }
  }, [open]);

  if (!brief) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-hidden">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Edit Creative Brief</SheetTitle>
              <SheetDescription className="text-base">
                Update the creative brief details
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
                <form id="edit-brief-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                  {tags.filter((t) => !STYLE_PRESETS.includes(t as (typeof STYLE_PRESETS)[number])).map((tag) => (
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
                    {isUploadingImages ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <UploadProgressRing
                          percent={progressPercent}
                          size={88}
                          label={progressLabel}
                        />
                        <p className="text-sm text-muted-foreground">Uploading reference images…</p>
                      </div>
                    ) : null}
                    {(existingImages.length + selectedFiles.length) < 5 && (
                      <Dropzone
                        onDrop={handleDrop}
                        maxFiles={5 - (existingImages.length + selectedFiles.length)}
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

                    {/* Existing Images from Database */}
                    {existingImages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Existing Images
                        </p>
                        {existingImages.map((image, index) => (
                          <div
                            key={image.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border min-w-0"
                          >
                            <div className="flex-shrink-0">
                              <img
                                src={image.fileUrl}
                                alt={image.fileName}
                                className="h-12 w-12 object-cover rounded"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{image.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {(image.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveExistingImage(index)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Newly Selected Images */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        {existingImages.length > 0 && (
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            New Images
                          </p>
                        )}
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
                              onClick={() => handleRemoveSelectedFile(index)}
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
          <Button type="submit" form="edit-brief-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner variant="ellipsis" className="mr-2" size="sm" />
                Updating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Update Brief
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
