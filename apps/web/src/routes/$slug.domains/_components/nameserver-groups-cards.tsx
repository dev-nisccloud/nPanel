"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, Copy, MoreHorizontal, Server, X, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Skeleton } from "@/components/ui/skeleton";

// Validation schemas
const nameserverSchema = z.object({
  name: z.string()
    .min(1, "Nameserver name is required")
    .max(253, "Nameserver name must be 253 characters or less")
    .regex(/^[a-zA-Z0-9.-]+$/, "Nameserver name can only contain letters, numbers, dots, and hyphens")
    .regex(/^[a-zA-Z0-9]/, "Nameserver name must start with a letter or number")
    .regex(/[a-zA-Z0-9]$/, "Nameserver name must end with a letter or number"),
  ipv4: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      return ipv4Regex.test(val);
    }, "Invalid IPv4 address format"),
  ipv6: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      return ipv6Regex.test(val);
    }, "Invalid IPv6 address format"),
});

const nameserverGroupSchema = z.object({
  name: z.string()
    .min(1, "Group name is required")
    .max(100, "Group name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\s.-]+$/, "Group name can only contain letters, numbers, spaces, dots, and hyphens"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  nameservers: z.array(nameserverSchema)
    .min(1, "At least one nameserver is required")
    .max(10, "Maximum 10 nameservers allowed"),
});

interface NameserverGroupCardProps {
  data: {
    id: string;
    name: string;
    description?: string | null;
    nameservers: Array<{
      id: string;
      name: string;
      ipv4?: string | null;
      ipv6?: string | null;
    }>;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  className?: string;
}

function NameserverGroupCard({
  data,
  onEdit,
  onDelete,
  onSetDefault,
  className
}: NameserverGroupCardProps) {
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

  const handleCopyNameservers = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nameserverList = data.nameservers.map(ns => ns.name).join('\n');
    navigator.clipboard.writeText(nameserverList);
    toast.success("Nameservers copied to clipboard");
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyNameservers}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Nameservers
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
            <CardTitle className="text-lg font-semibold truncate">
              {data.name}
            </CardTitle>
            {data.description && (
              <CardDescription className="text-sm line-clamp-2">
                {data.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Nameservers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nameservers ({data.nameservers.length})</span>
            </div>
            <div className="space-y-1.5">
              {data.nameservers.map((ns) => (
                <div key={ns.id} className="p-2 border rounded-md bg-muted/30">
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-medium truncate" title={ns.name}>
                      {ns.name}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ns.ipv4 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          IPv4: {ns.ipv4}
                        </Badge>
                      )}
                      {ns.ipv6 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          IPv6: {ns.ipv6}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

export function NameserverGroupsCards() {
  // React Query hooks for data fetching with caching
  const { data: nameserverGroups, isLoading: isLoadingNameserverGroups, refetch: refetchNameserverGroups } = trpc.nameserverGroups.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Mutations with optimistic updates
  const createNameserverGroup = trpc.nameserverGroups.create.useMutation({
    onSuccess: () => {
      toast.success("Nameserver group created successfully");
      refetchNameserverGroups();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create nameserver group");
    },
  });

  const updateNameserverGroup = trpc.nameserverGroups.update.useMutation({
    onSuccess: () => {
      toast.success("Nameserver group updated successfully");
      refetchNameserverGroups();
      setIsEditDialogOpen(false);
      setEditingGroup(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update nameserver group");
    },
  });

  const deleteNameserverGroup = trpc.nameserverGroups.delete.useMutation({
    onSuccess: () => {
      toast.success("Nameserver group deleted successfully");
      refetchNameserverGroups();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete nameserver group");
    },
  });

  const setDefaultNameserverGroup = trpc.nameserverGroups.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Default nameserver group updated successfully");
      refetchNameserverGroups();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to set default nameserver group");
    },
  });

  // State management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<any>(null);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Form state
  const [newGroup, setNewGroup] = React.useState({
    name: "",
    description: "",
    nameservers: [{ name: "", ipv4: "", ipv6: "" }]
  });

  // Reset form function
  const resetForm = () => {
    setNewGroup({
      name: "",
      description: "",
      nameservers: [{ name: "", ipv4: "", ipv6: "" }]
    });
    setFormErrors({});
  };

  // Validation function
  const validateForm = (data: typeof newGroup) => {
    try {
      nameserverGroupSchema.parse(data);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err: any) => {
          if (err.path.length === 1) {
            errors[err.path[0] as string] = err.message;
          } else if (err.path.length === 2) {
            const key = `${err.path[0]}.${err.path[1]}`;
            errors[key] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  // Handle create
  const handleCreate = () => {
    if (!validateForm(newGroup)) {
      return;
    }

    const submitData = {
      name: newGroup.name,
      description: newGroup.description || undefined,
      nameservers: newGroup.nameservers.map(ns => ({
        name: ns.name,
        ipv4: ns.ipv4 || undefined,
        ipv6: ns.ipv6 || undefined,
      })),
    };

    createNameserverGroup.mutate(submitData);
  };

  // Handle edit
  const handleEdit = (id: string) => {
    const group = nameserverGroups?.data?.find((g: any) => g.id === id);
    if (group) {
      setEditingGroup(group);
      setNewGroup({
        name: group.name,
        description: group.description || "",
        nameservers: group.nameservers.length > 0 
          ? group.nameservers.map((ns: any) => ({
              name: ns.name,
              ipv4: ns.ipv4 || "",
              ipv6: ns.ipv6 || "",
            }))
          : [{ name: "", ipv4: "", ipv6: "" }]
      });
      setIsEditDialogOpen(true);
    }
  };

  // Handle update
  const handleUpdate = () => {
    if (!editingGroup || !validateForm(newGroup)) {
      return;
    }

    const submitData = {
      id: editingGroup.id,
      name: newGroup.name,
      description: newGroup.description || undefined,
      nameservers: newGroup.nameservers.map(ns => ({
        name: ns.name,
        ipv4: ns.ipv4 || undefined,
        ipv6: ns.ipv6 || undefined,
      })),
    };

    updateNameserverGroup.mutate(submitData);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this nameserver group?")) {
      deleteNameserverGroup.mutate({ id });
    }
  };

  // Handle set default
  const handleSetDefault = (id: string) => {
    setDefaultNameserverGroup.mutate({ id });
  };

  // Nameserver management functions
  const handleAddNameserver = () => {
    setNewGroup(prev => ({
      ...prev,
      nameservers: [...prev.nameservers, { name: "", ipv4: "", ipv6: "" }]
    }));
  };

  const handleRemoveNameserver = (index: number) => {
    if (newGroup.nameservers.length > 1) {
      setNewGroup(prev => ({
        ...prev,
        nameservers: prev.nameservers.filter((_, i) => i !== index)
      }));
    }
  };

  const handleNameserverChange = (index: number, field: 'name' | 'ipv4' | 'ipv6', value: string) => {
    setNewGroup(prev => ({
      ...prev,
      nameservers: prev.nameservers.map((ns, i) => 
        i === index ? { ...ns, [field]: value } : ns
      )
    }));
  };

  // Loading states
  if (isLoadingNameserverGroups) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Nameserver Groups</h3>
            <p className="text-sm text-muted-foreground">
              Manage DNS nameserver configurations for your domains
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
          <h3 className="text-lg font-semibold">Nameserver Groups</h3>
          <p className="text-sm text-muted-foreground">
            Manage DNS nameserver configurations for your domains
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Nameserver Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Nameserver Group</DialogTitle>
              <DialogDescription>
                Create a new nameserver group with DNS server configurations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g., Default Nameservers, Premium DNS"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-description">Description (Optional)</Label>
                <Input
                  id="group-description"
                  placeholder="Brief description of this nameserver group"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  className={formErrors.description ? "border-destructive" : ""}
                />
                {formErrors.description && (
                  <p className="text-sm text-destructive">{formErrors.description}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Nameservers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddNameserver}
                    disabled={newGroup.nameservers.length >= 10}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Nameserver
                  </Button>
                </div>

                {newGroup.nameservers.map((ns, index) => (
                  <div key={index} className="p-2.5 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Nameserver {index + 1}</span>
                      {newGroup.nameservers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNameserver(index)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor={`ns-name-${index}`} className="text-xs">Nameserver Name</Label>
                        <Input
                          id={`ns-name-${index}`}
                          placeholder="ns1.example.com"
                          value={ns.name}
                          onChange={(e) => handleNameserverChange(index, 'name', e.target.value)}
                          className={formErrors[`nameservers.${index}.name`] ? "border-destructive" : "font-mono text-sm"}
                        />
                        {formErrors[`nameservers.${index}.name`] && (
                          <p className="text-xs text-destructive">{formErrors[`nameservers.${index}.name`]}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`ns-ipv4-${index}`} className="text-xs">IPv4 (Optional)</Label>
                          <Input
                            id={`ns-ipv4-${index}`}
                            placeholder="192.168.1.1"
                            value={ns.ipv4}
                            onChange={(e) => handleNameserverChange(index, 'ipv4', e.target.value)}
                            className={formErrors[`nameservers.${index}.ipv4`] ? "border-destructive" : "font-mono text-sm"}
                          />
                          {formErrors[`nameservers.${index}.ipv4`] && (
                            <p className="text-xs text-destructive">{formErrors[`nameservers.${index}.ipv4`]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`ns-ipv6-${index}`} className="text-xs">IPv6 (Optional)</Label>
                          <Input
                            id={`ns-ipv6-${index}`}
                            placeholder="2001:db8::1"
                            value={ns.ipv6}
                            onChange={(e) => handleNameserverChange(index, 'ipv6', e.target.value)}
                            className={formErrors[`nameservers.${index}.ipv6`] ? "border-destructive" : "font-mono text-sm"}
                          />
                          {formErrors[`nameservers.${index}.ipv6`] && (
                            <p className="text-xs text-destructive">{formErrors[`nameservers.${index}.ipv6`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {formErrors.nameservers && (
                  <p className="text-sm text-destructive">{formErrors.nameservers}</p>
                )}
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
                  disabled={createNameserverGroup.isPending}
                >
                  {createNameserverGroup.isPending ? (
                    <div className="flex items-center gap-2">
                      <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Nameserver Groups Grid */}
      {nameserverGroups?.data && nameserverGroups.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nameserverGroups.data.map((group: any) => (
            <NameserverGroupCard
              key={group.id}
              data={group}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Nameserver Groups</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first nameserver group
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Nameserver Group
          </Button>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Nameserver Group</DialogTitle>
            <DialogDescription>
              Update the nameserver group configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                placeholder="e.g., Default Nameservers, Premium DNS"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-group-description">Description (Optional)</Label>
              <Input
                id="edit-group-description"
                placeholder="Brief description of this nameserver group"
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                className={formErrors.description ? "border-destructive" : ""}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Nameservers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddNameserver}
                  disabled={newGroup.nameservers.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Nameserver
                </Button>
              </div>

              {newGroup.nameservers.map((ns, index) => (
                <div key={index} className="p-2.5 border rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Nameserver {index + 1}</span>
                    {newGroup.nameservers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNameserver(index)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`edit-ns-name-${index}`} className="text-xs">Nameserver Name</Label>
                      <Input
                        id={`edit-ns-name-${index}`}
                        placeholder="ns1.example.com"
                        value={ns.name}
                        onChange={(e) => handleNameserverChange(index, 'name', e.target.value)}
                        className={formErrors[`nameservers.${index}.name`] ? "border-destructive" : "font-mono text-sm"}
                      />
                      {formErrors[`nameservers.${index}.name`] && (
                        <p className="text-xs text-destructive">{formErrors[`nameservers.${index}.name`]}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`edit-ns-ipv4-${index}`} className="text-xs">IPv4 (Optional)</Label>
                        <Input
                          id={`edit-ns-ipv4-${index}`}
                          placeholder="192.168.1.1"
                          value={ns.ipv4}
                          onChange={(e) => handleNameserverChange(index, 'ipv4', e.target.value)}
                          className={formErrors[`nameservers.${index}.ipv4`] ? "border-destructive" : "font-mono text-sm"}
                        />
                        {formErrors[`nameservers.${index}.ipv4`] && (
                          <p className="text-xs text-destructive">{formErrors[`nameservers.${index}.ipv4`]}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`edit-ns-ipv6-${index}`} className="text-xs">IPv6 (Optional)</Label>
                        <Input
                          id={`edit-ns-ipv6-${index}`}
                          placeholder="2001:db8::1"
                          value={ns.ipv6}
                          onChange={(e) => handleNameserverChange(index, 'ipv6', e.target.value)}
                          className={formErrors[`nameservers.${index}.ipv6`] ? "border-destructive" : "font-mono text-sm"}
                        />
                        {formErrors[`nameservers.${index}.ipv6`] && (
                          <p className="text-xs text-destructive">{formErrors[`nameservers.${index}.ipv6`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {formErrors.nameservers && (
                <p className="text-sm text-destructive">{formErrors.nameservers}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingGroup(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateNameserverGroup.isPending}
              >
                {updateNameserverGroup.isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update Group"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
