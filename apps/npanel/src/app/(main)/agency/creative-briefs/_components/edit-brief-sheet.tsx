"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FileText, XIcon, Image, X, Calendar as CalendarIcon } from "lucide-react";
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
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { creativeBriefSchema } from "./schema";

// Edit schema - only some fields are editable
const EditFormSchema = z.object({
  name: z.string().min(1, { message: "Brief name is required." }).optional(),
  teamId: z.string().optional(),
  background: z.string().min(1, { message: "Background is required." }).optional(),
  objectives: z.string().min(1, { message: "Objectives are required." }).optional(),
  requirements: z.string().min(1, { message: "Requirements are required." }).optional(),
  comments: z.string().optional(),
  timelineStartDate: z.date().optional(),
  timelineEndDate: z.date().optional(),
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
    // At least one field must be provided for update
    return (
      data.name !== undefined ||
      data.teamId !== undefined ||
      data.background !== undefined ||
      data.objectives !== undefined ||
      data.requirements !== undefined ||
      data.comments !== undefined ||
      data.timelineStartDate !== undefined ||
      data.timelineEndDate !== undefined ||
      data.referenceImages !== undefined
    );
  },
  {
    message: "At least one field must be updated",
  }
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

export function EditBriefSheet({ open, onOpenChange, brief, onEditBrief }: EditBriefSheetProps) {
  // Fetch teams
  const { data: teams, isLoading: isLoadingTeams } = trpc.teams.getUserTeams.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Update brief mutation
  const updateBriefMutation = trpc.creativeBriefs.update.useMutation({
    onSuccess: () => {
      toast.success("Creative brief updated successfully!");
      form.reset();
      setReferenceImages([]);
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
      timelineStartDate: brief?.timelineStartDate || undefined,
      timelineEndDate: brief?.timelineEndDate || undefined,
      referenceImages: [],
    },
  });

  // Initialize reference images from brief
  React.useEffect(() => {
    if (brief?.referenceImages && brief.referenceImages.length > 0) {
      const images: ReferenceImage[] = brief.referenceImages.map((img) => ({
        fileUrl: img.fileUrl,
        fileKey: img.fileKey,
        fileName: img.fileName,
        fileSize: img.fileSize,
        mimeType: img.mimeType,
        fileMetadata: img.fileMetadata,
      }));
      setReferenceImages(images);
      form.setValue("referenceImages", images);
    } else {
      setReferenceImages([]);
      form.setValue("referenceImages", []);
    }

    // Initialize date range
    if (brief?.timelineStartDate && brief?.timelineEndDate) {
      setDateRange({
        from: brief.timelineStartDate,
        to: brief.timelineEndDate,
      });
    } else {
      setDateRange(undefined);
    }
  }, [brief, form]);

  const [referenceImages, setReferenceImages] = React.useState<ReferenceImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const isSubmitting = updateBriefMutation.isPending || isUploadingImages;

  // Convert teams to options
  const teamOptions = React.useMemo(() => {
    if (!teams) return [];
    return teams.map((team) => ({
      id: team.id,
      label: team.name,
    }));
  }, [teams]);

  // Handle file drop
  const handleDrop = async (acceptedFiles: File[]) => {
    if (referenceImages.length + acceptedFiles.length > 5) {
      toast.error("Maximum 5 reference images allowed");
      return;
    }

    setIsUploadingImages(true);
    try {
      const filesToUpload = acceptedFiles.slice(0, 5 - referenceImages.length);
      
      const response = await uploadFiles(UPLOAD_ENDPOINTS.IMAGE, {
        files: filesToUpload,
      });

      if (!response || response.length === 0) {
        throw new Error("No files were uploaded");
      }

      const newImages: ReferenceImage[] = response.map((file) => ({
        fileUrl: file.ufsUrl || file.url || "",
        fileKey: file.key || "",
        fileName: file.name || "",
        fileSize: file.size || 0,
        mimeType: file.type || "",
        fileMetadata: undefined,
      }));

      setReferenceImages((prev) => [...prev, ...newImages]);
      form.setValue("referenceImages", [...referenceImages, ...newImages]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Remove reference image
  const handleRemoveImage = (index: number) => {
    if (isSubmitting) return;
    const newImages = referenceImages.filter((_, i) => i !== index);
    setReferenceImages(newImages);
    form.setValue("referenceImages", newImages);
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

    // Only send fields that have changed
    const updateData: {
      id: string;
      name?: string;
      teamId?: string;
      background?: string;
      objectives?: string;
      requirements?: string;
      comments?: string;
      timelineStartDate?: Date;
      timelineEndDate?: Date;
      referenceImages?: ReferenceImage[];
    } = {
      id: brief.id,
    };

    if (data.name !== undefined && data.name !== brief.name) {
      updateData.name = data.name;
    }
    if (data.teamId !== undefined && data.teamId !== brief.teamId) {
      updateData.teamId = data.teamId || undefined;
    }
    if (data.background !== undefined && data.background !== brief.background) {
      updateData.background = data.background;
    }
    if (data.objectives !== undefined && data.objectives !== brief.objectives) {
      updateData.objectives = data.objectives;
    }
    if (data.requirements !== undefined && data.requirements !== brief.requirements) {
      updateData.requirements = data.requirements;
    }
    if (data.comments !== undefined && data.comments !== brief.comments) {
      updateData.comments = data.comments || undefined;
    }
    if (data.timelineStartDate !== undefined || data.timelineEndDate !== undefined) {
      updateData.timelineStartDate = data.timelineStartDate;
      updateData.timelineEndDate = data.timelineEndDate;
    }
    if (data.referenceImages !== undefined) {
      updateData.referenceImages = referenceImages.length > 0 ? referenceImages : [];
    }

    updateBriefMutation.mutate(updateData);
  };

  if (!brief) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
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

        <div className="px-1 pb-1">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              <select
                                {...field}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isSubmitting}
                              >
                                <option value="">Select a team (optional)</option>
                                {teamOptions.map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.label}
                                  </option>
                                ))}
                              </select>
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
                    {referenceImages.length < 5 && (
                      <Dropzone
                        onDrop={handleDrop}
                        maxFiles={5 - referenceImages.length}
                        maxSize={16 * 1024 * 1024} // 16MB
                        accept={{ "image/*": [] }}
                        disabled={isSubmitting || isUploadingImages}
                        className="w-full border-2 border-dashed transition-colors"
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
                    {referenceImages.length > 0 && (
                      <div className="space-y-2">
                        {referenceImages.map((image, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
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

                <SheetFooter className="gap-2 sm:gap-0">
                  <SheetClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button type="submit" disabled={isSubmitting}>
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
              </form>
            </Form>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
