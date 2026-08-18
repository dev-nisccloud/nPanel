"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { FileText, XIcon, Edit } from "lucide-react";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import type { ComboboxItem } from "@npanel/ui/components/combobox-dropdown";

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
import { trpc } from "@/utils/trpc";
import { creativeAssetSchema } from "./schema";
import { captureEvent } from "@/lib/posthog";

const FormSchema = z.object({
  name: z.string().min(1, { message: "Asset name is required." }),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"]).default("DRAFT"),
  teamId: z.string().min(1, { message: "Organization is required." }),
});

interface EditAssetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: z.infer<typeof creativeAssetSchema> | null;
  onEditAsset?: () => void;
}

// Category options - IDs match database format (capitalized)
const CATEGORIES: ComboboxItem[] = [
  { id: "Magazine", label: "Magazine" },
  { id: "Logo", label: "Logo" },
  { id: "Video", label: "Video" },
  { id: "Banner", label: "Banner" },
  { id: "Poster", label: "Poster" },
  { id: "Brochure", label: "Brochure" },
  { id: "Flyer", label: "Flyer" },
  { id: "Business Card", label: "Business Card" },
  { id: "Letterhead", label: "Letterhead" },
  { id: "Presentation", label: "Presentation" },
  { id: "Social Media", label: "Social Media" },
  { id: "Advertisement", label: "Advertisement" },
  { id: "Infographic", label: "Infographic" },
  { id: "Newsletter", label: "Newsletter" },
  { id: "Catalog", label: "Catalog" },
  { id: "Packaging", label: "Packaging" },
  { id: "Other", label: "Other" },
];

// Status options
const STATUS_OPTIONS: ComboboxItem[] = [
  { id: "DRAFT", label: "Draft" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "APPROVED", label: "Approved" },
  { id: "ARCHIVED", label: "Archived" },
];

export function EditAssetSheet({ open, onOpenChange, asset, onEditAsset }: EditAssetSheetProps) {
  // Pre-fetch teams before sheet opens
  const { data: teams, isLoading: isLoadingTeams } = trpc.teams.getUserTeams.useQuery(undefined, {
    enabled: true, // Always fetch teams
  });

  // Update asset mutation - TODO: Create this mutation in the API
  const updateAssetMutation = trpc.creativeAssets.update.useMutation({
    onSuccess: () => {
      const values = form.getValues();
      const fieldsChanged: string[] = [];
      if (asset) {
        if (values.name !== asset.name) fieldsChanged.push("name");
        if ((values.description || "") !== (asset.description || "")) fieldsChanged.push("description");
        if ((values.category || "") !== (asset.category || "")) fieldsChanged.push("category");
        if (values.status !== asset.status) fieldsChanged.push("status");
        if (values.teamId !== asset.teamId) fieldsChanged.push("teamId");
      }
      captureEvent("creative_asset_edited", {
        fields_changed: fieldsChanged,
      });
      toast.success("Creative asset updated successfully!");
      form.reset();
      onOpenChange(false);
      onEditAsset?.();
    },
    onError: (error) => {
      toast.error("Failed to update asset", {
        description: error.message,
      });
    },
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      status: "DRAFT",
      teamId: "",
    },
  });

  // Update form when asset changes
  React.useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name,
        description: asset.description || "",
        category: asset.category || "",
        status: asset.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED",
        teamId: asset.teamId,
      });
    }
  }, [asset, form]);

  const isSubmitting = updateAssetMutation.isPending;

  // Convert teams to combobox items
  const teamOptions: ComboboxItem[] = React.useMemo(() => {
    if (!teams) return [];
    return teams.map((team) => ({
      id: team.id,
      label: team.name,
    }));
  }, [teams]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!asset) return;
    
    updateAssetMutation.mutate({
      id: asset.id,
      name: data.name,
      description: data.description || undefined,
      category: data.category || undefined,
      status: data.status,
      teamId: data.teamId,
    });
  };

  // Get selected values for comboboxes
  const selectedTeam = teamOptions.find((t) => t.id === form.watch("teamId"));
  const selectedCategory = CATEGORIES.find((c) => c.id === form.watch("category"));
  const selectedStatus = STATUS_OPTIONS.find((s) => s.id === form.watch("status")) || STATUS_OPTIONS[0];

  if (!asset) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Edit className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle>Edit Creative Asset</SheetTitle>
              <SheetDescription>
                Update the creative asset details
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="px-1 pb-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Asset Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Asset Information
                  </CardTitle>
                  <CardDescription>Basic asset details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Company Logo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional description..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <ComboboxDropdown
                            placeholder="Select category"
                            searchPlaceholder="Search categories..."
                            items={CATEGORIES}
                            selectedItem={selectedCategory}
                            onSelect={(item) => {
                              field.onChange(item.id);
                            }}
                            emptyResults="No categories found"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <ComboboxDropdown
                            placeholder="Select status"
                            searchPlaceholder="Search status..."
                            items={STATUS_OPTIONS}
                            selectedItem={selectedStatus}
                            onSelect={(item) => {
                              field.onChange(item.id);
                            }}
                            emptyResults="No status found"
                            className="w-full"
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
                        <FormLabel>Organization</FormLabel>
                        <FormControl>
                          {isLoadingTeams ? (
                            <div className="flex items-center justify-center h-10 border rounded-md">
                              <Spinner variant="ellipsis" size="sm" />
                            </div>
                          ) : (
                            <ComboboxDropdown
                              placeholder="Select organization"
                              searchPlaceholder="Search organizations..."
                              items={teamOptions}
                              selectedItem={selectedTeam}
                              onSelect={(item) => {
                                field.onChange(item.id);
                              }}
                              emptyResults="No organizations found"
                              disabled={isLoadingTeams || teamOptions.length === 0}
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

              <SheetFooter className="gap-2 sm:gap-0">
                <SheetClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting || isLoadingTeams}>
                  {isSubmitting ? (
                    <>
                      <Spinner variant="ellipsis" className="mr-2" size="sm" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Update Asset
                    </>
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}


