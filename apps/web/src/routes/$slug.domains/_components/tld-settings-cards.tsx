"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, MoreHorizontal, Globe, DollarSign, Settings, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Skeleton } from "@/components/ui/skeleton";

// Validation schemas
const tldSettingsSchema = z.object({
  name: z.string()
    .min(1, "TLD name is required")
    .max(100, "TLD name must be 100 characters or less"),
  nameserverGroupId: z.string().optional(),
  marginType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  percentageMargin: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1000;
    }, "Percentage margin must be between 0 and 1000"),
  fixedMargin: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 10000;
    }, "Fixed margin must be between 0 and 10000"),
  roundOff: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0.01 && num <= 1;
    }, "Round off must be between 0.01 and 1"),
}).refine((data) => {
  if (data.marginType === "PERCENTAGE" && !data.percentageMargin) {
    return false;
  }
  if (data.marginType === "FIXED" && !data.fixedMargin) {
    return false;
  }
  return true;
}, {
  message: "Margin value is required when margin type is selected",
  path: ["marginType"]
});

interface TldSettingCardProps {
  data: {
    id: string;
    name: string;
    marginType?: "PERCENTAGE" | "FIXED" | null;
    percentageMargin?: string | null;
    fixedMargin?: string | null;
    roundOff?: string | null;
    nameserverGroupId?: string | null;
    nameserverGroup?: {
      id: string;
      name: string;
    } | null;
    isDefault?: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  className?: string;
}

function TldSettingCard({
  data,
  onEdit,
  onDelete,
  onSetDefault,
  className
}: TldSettingCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  const handleSetDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSetDefault) {
      onSetDefault(data.id);
    }
  };

  const getMarginTypeBadgeVariant = () => {
    return data.marginType === "PERCENTAGE" ? "outline" : "secondary";
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
    >
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {data.isDefault && (
              <Badge variant="default">Default</Badge>
            )}
            <div className="flex items-center gap-2">
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Settings
                </DropdownMenuItem>
                {!data.isDefault && (
                  <DropdownMenuItem onClick={handleSetDefault}>
                    <Star className="mr-2 h-4 w-4" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg font-bold font-mono line-clamp-2 break-words">
            {data.name}
          </CardTitle>
        </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Margin Configuration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pricing</span>
            </div>
            <div className="space-y-2">
              {data.marginType && (
                <div className="flex items-center gap-2">
                  <Badge variant={getMarginTypeBadgeVariant()}>
                    {data.marginType}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {data.marginType === "PERCENTAGE"
                      ? `${data.percentageMargin}%`
                      : `$${data.fixedMargin}`
                    }
                  </span>
                </div>
              )}
              {data.roundOff && (
                <div className="text-xs text-muted-foreground">
                  Round off: {data.roundOff}
                </div>
              )}
            </div>
          </div>

          {/* Nameserver Group */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Nameservers</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.nameserverGroup?.name || "No nameserver group assigned"}
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Created: {new Date(data.createdAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Updated: {new Date(data.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TldSettingsCards() {
  // React Query hooks for data fetching with caching
  const { data: tldSettings, isLoading: isLoadingTldSettings, refetch: refetchTldSettings } = trpc.tldSettings.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: nameserverGroups, isLoading: isLoadingNameserverGroups } = trpc.nameserverGroups.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Mutations with optimistic updates
  const createTldSetting = trpc.tldSettings.create.useMutation({
    onSuccess: () => {
      toast.success("TLD setting created successfully");
      refetchTldSettings();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create TLD setting");
    },
  });

  const updateTldSetting = trpc.tldSettings.update.useMutation({
    onSuccess: () => {
      toast.success("TLD setting updated successfully");
      refetchTldSettings();
      setIsEditDialogOpen(false);
      setEditingTldSetting(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update TLD setting");
    },
  });

  const deleteTldSetting = trpc.tldSettings.delete.useMutation({
    onSuccess: () => {
      toast.success("TLD setting deleted successfully");
      refetchTldSettings();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete TLD setting");
    },
  });

  const setDefaultTldSetting = trpc.tldSettings.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Default TLD setting updated successfully");
      refetchTldSettings();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to set default TLD setting");
    },
  });

  // State management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingTldSetting, setEditingTldSetting] = React.useState<any>(null);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Form state
  const [newTldSetting, setNewTldSetting] = React.useState({
    name: "",
    marginType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    percentageMargin: "",
    fixedMargin: "",
    roundOff: "0.01",
    nameserverGroupId: ""
  });

  // Reset form function
  const resetForm = () => {
    setNewTldSetting({
      name: "",
      marginType: "PERCENTAGE",
      percentageMargin: "",
      fixedMargin: "",
      roundOff: "0.01",
      nameserverGroupId: ""
    });
    setFormErrors({});
  };

  // Validation function
  const validateForm = (data: typeof newTldSetting) => {
    try {
      tldSettingsSchema.parse(data);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err: any) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  // Handle create
  const handleCreate = () => {
    if (!validateForm(newTldSetting)) {
      return;
    }

    const submitData = {
      name: newTldSetting.name,
      nameserverGroupId: newTldSetting.nameserverGroupId || undefined,
      marginType: newTldSetting.marginType,
      percentageMargin: newTldSetting.marginType === "PERCENTAGE" ? newTldSetting.percentageMargin : undefined,
      fixedMargin: newTldSetting.marginType === "FIXED" ? newTldSetting.fixedMargin : undefined,
      roundOff: newTldSetting.roundOff,
    };

    createTldSetting.mutate(submitData);
  };

  // Handle edit
  const handleEdit = (id: string) => {
    const tldSetting = tldSettings?.data?.find((t: any) => t.id === id);
    if (tldSetting) {
      setEditingTldSetting(tldSetting);
      setNewTldSetting({
        name: tldSetting.name,
        marginType: (tldSetting.marginType as "PERCENTAGE" | "FIXED") || "PERCENTAGE",
        percentageMargin: tldSetting.percentageMargin || "",
        fixedMargin: tldSetting.fixedMargin || "",
        roundOff: tldSetting.roundOff || "0.01",
        nameserverGroupId: tldSetting.nameserverGroupId || ""
      });
      setIsEditDialogOpen(true);
    }
  };

  // Handle update
  const handleUpdate = () => {
    if (!editingTldSetting || !validateForm(newTldSetting)) {
      return;
    }

    const submitData = {
      id: editingTldSetting.id,
      name: newTldSetting.name,
      nameserverGroupId: newTldSetting.nameserverGroupId || undefined,
      marginType: newTldSetting.marginType,
      percentageMargin: newTldSetting.marginType === "PERCENTAGE" ? newTldSetting.percentageMargin : undefined,
      fixedMargin: newTldSetting.marginType === "FIXED" ? newTldSetting.fixedMargin : undefined,
      roundOff: newTldSetting.roundOff,
    };

    updateTldSetting.mutate(submitData);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this TLD setting?")) {
      deleteTldSetting.mutate({ id });
    }
  };

  // Handle set default
  const handleSetDefault = (id: string) => {
    setDefaultTldSetting.mutate({ id });
  };

  // Loading states
  if (isLoadingTldSettings || isLoadingNameserverGroups) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">TLD Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure pricing margins and nameserver groups for TLDs
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">TLD Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure pricing margins and nameserver groups for TLDs
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add TLD Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add TLD Setting</DialogTitle>
              <DialogDescription>
                Configure pricing and nameserver settings for a TLD
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tld-name">TLD Name</Label>
                <Input
                  id="tld-name"
                  placeholder="e.g., .com, .net, .org"
                  value={newTldSetting.name}
                  onChange={(e) => setNewTldSetting(prev => ({ ...prev, name: e.target.value }))}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="margin-type">Margin Type</Label>
                  <Select
                    value={newTldSetting.marginType}
                    onValueChange={(value) => setNewTldSetting(prev => ({ ...prev, marginType: value as "PERCENTAGE" | "FIXED" }))}
                  >
                    <SelectTrigger className={formErrors.marginType ? "border-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.marginType && (
                    <p className="text-sm text-destructive">{formErrors.marginType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="round-off">Round Off</Label>
                  <Select
                    value={newTldSetting.roundOff}
                    onValueChange={(value) => setNewTldSetting(prev => ({ ...prev, roundOff: value }))}
                  >
                    <SelectTrigger className={formErrors.roundOff ? "border-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.01">0.01</SelectItem>
                      <SelectItem value="0.05">0.05</SelectItem>
                      <SelectItem value="0.10">0.10</SelectItem>
                      <SelectItem value="1.00">1.00</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.roundOff && (
                    <p className="text-sm text-destructive">{formErrors.roundOff}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin-value">
                  {newTldSetting.marginType === "PERCENTAGE" ? "Percentage Margin" : "Fixed Margin"}
                </Label>
                <Input
                  id="margin-value"
                  placeholder={newTldSetting.marginType === "PERCENTAGE" ? "25" : "5.00"}
                  value={newTldSetting.marginType === "PERCENTAGE" ? newTldSetting.percentageMargin : newTldSetting.fixedMargin}
                  onChange={(e) => setNewTldSetting(prev => ({
                    ...prev,
                    [newTldSetting.marginType === "PERCENTAGE" ? "percentageMargin" : "fixedMargin"]: e.target.value
                  }))}
                  className={formErrors.percentageMargin || formErrors.fixedMargin ? "border-destructive" : ""}
                />
                {(formErrors.percentageMargin || formErrors.fixedMargin) && (
                  <p className="text-sm text-destructive">
                    {formErrors.percentageMargin || formErrors.fixedMargin}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameserver-group">Nameserver Group</Label>
                <Select
                  value={newTldSetting.nameserverGroupId}
                  onValueChange={(value) => setNewTldSetting(prev => ({ ...prev, nameserverGroupId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nameserver group" />
                  </SelectTrigger>
                  <SelectContent>
                    {nameserverGroups?.data?.map((group: any) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createTldSetting.isPending}
                >
                  {createTldSetting.isPending ? (
                    <div className="flex items-center gap-2">
                      <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create TLD Setting"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* TLD Settings Grid */}
      {tldSettings?.data && tldSettings.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tldSettings.data.map((tldSetting: any) => (
            <TldSettingCard
              key={tldSetting.id}
              data={tldSetting}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No TLD Settings</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first TLD setting
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="mx-auto w-fit">
            <Plus className="mr-2 h-4 w-4" />
            Add TLD Setting
          </Button>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit TLD Setting</DialogTitle>
            <DialogDescription>
              Update pricing and nameserver settings for this TLD
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tld-name">TLD Name</Label>
              <Input
                id="edit-tld-name"
                placeholder="e.g., .com, .net, .org"
                value={newTldSetting.name}
                onChange={(e) => setNewTldSetting(prev => ({ ...prev, name: e.target.value }))}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-margin-type">Margin Type</Label>
                <Select
                  value={newTldSetting.marginType}
                  onValueChange={(value) => setNewTldSetting(prev => ({ ...prev, marginType: value as "PERCENTAGE" | "FIXED" }))}
                >
                  <SelectTrigger className={formErrors.marginType ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.marginType && (
                  <p className="text-sm text-destructive">{formErrors.marginType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-round-off">Round Off</Label>
                <Select
                  value={newTldSetting.roundOff}
                  onValueChange={(value) => setNewTldSetting(prev => ({ ...prev, roundOff: value }))}
                >
                  <SelectTrigger className={formErrors.roundOff ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.01">0.01</SelectItem>
                    <SelectItem value="0.05">0.05</SelectItem>
                    <SelectItem value="0.10">0.10</SelectItem>
                    <SelectItem value="1.00">1.00</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.roundOff && (
                  <p className="text-sm text-destructive">{formErrors.roundOff}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-margin-value">
                {newTldSetting.marginType === "PERCENTAGE" ? "Percentage Margin" : "Fixed Margin"}
              </Label>
              <Input
                id="edit-margin-value"
                placeholder={newTldSetting.marginType === "PERCENTAGE" ? "25" : "5.00"}
                value={newTldSetting.marginType === "PERCENTAGE" ? newTldSetting.percentageMargin : newTldSetting.fixedMargin}
                onChange={(e) => setNewTldSetting(prev => ({
                  ...prev,
                  [newTldSetting.marginType === "PERCENTAGE" ? "percentageMargin" : "fixedMargin"]: e.target.value
                }))}
                className={formErrors.percentageMargin || formErrors.fixedMargin ? "border-destructive" : ""}
              />
              {(formErrors.percentageMargin || formErrors.fixedMargin) && (
                <p className="text-sm text-destructive">
                  {formErrors.percentageMargin || formErrors.fixedMargin}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nameserver-group">Nameserver Group</Label>
              <Select
                value={newTldSetting.nameserverGroupId}
                onValueChange={(value) => setNewTldSetting(prev => ({ ...prev, nameserverGroupId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nameserver group" />
                </SelectTrigger>
                <SelectContent>
                  {nameserverGroups?.data?.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingTldSetting(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateTldSetting.isPending}
              >
                {updateTldSetting.isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update TLD Setting"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
