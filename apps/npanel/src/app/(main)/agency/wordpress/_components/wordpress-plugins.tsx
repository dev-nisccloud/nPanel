"use client";

import * as React from "react";
import { 
  Package, 
  Shield, 
  ShieldAlert, 
  Settings,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { PluginsTable } from "./plugins-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useWordPressPlugins, WordPressPlugin } from "./use-wordpress-plugins";

interface WordPressPluginsProps {
  installationId: string;
}

// Expandable description component
function ExpandableDescription({ description }: { description?: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (!description) return null;
  
  const shouldShowToggle = description.length > 150; // Show toggle if description is long
  const displayText = isExpanded || !shouldShowToggle 
    ? description 
    : description.substring(0, 150) + "...";
  
  return (
    <div className="text-sm text-muted-foreground">
      <p className="whitespace-pre-wrap leading-relaxed">{displayText}</p>
      {shouldShowToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 mt-1 text-xs text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Read more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Loading skeleton component
function PluginsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Error component
function PluginsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <Package className="h-12 w-12 text-muted-foreground mx-auto" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Failed to load plugins</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An error occurred while fetching WordPress plugins."}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

// Individual plugin card
function PluginCard({ 
  plugin, 
  isSelected, 
  onSelect,
  installationId,
  onRefetch 
}: { 
  plugin: WordPressPlugin; 
  isSelected: boolean; 
  onSelect: (selected: boolean) => void; 
  installationId: string;
  onRefetch?: () => void;
}) {
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // tRPC mutation for updating plugin status
  const updatePluginStatus = trpc.plesk.wpPluginsStatus.setStatus.useMutation({
    onSuccess: () => {
      toast.success(`Plugin ${plugin.status ? 'deactivated' : 'activated'} successfully!`);
      // Refetch data to update the UI
      onRefetch?.();
    },
    onError: (error: any) => {
      console.error("Error updating plugin status:", error);
      
      let errorMessage = "Please try again.";
      
      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid plugin data.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "NOT_FOUND") {
        errorMessage = "Plugin not found.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while updating plugin.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error("Failed to update plugin", {
        description: errorMessage,
      });
    },
  });

  // tRPC mutation for deleting plugins
  const deletePlugins = trpc.plesk.wpPluginsDelete.delete.useMutation({
    onSuccess: () => {
      toast.success("Plugin deleted successfully!");
      setDeleteDialogOpen(false);
      // Refetch data to update the UI
      onRefetch?.();
    },
    onError: (error: any) => {
      console.error("Error deleting plugin:", error);
      
      let errorMessage = "Please try again.";
      
      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid plugin data.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "NOT_FOUND") {
        errorMessage = "WordPress installation not found.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while deleting plugin.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error("Failed to delete plugin", {
        description: errorMessage,
      });
    },
  });

  const getStatusBadge = () => {
    if (plugin.vulnerable) {
      return <Badge variant="destructive">Vulnerable</Badge>;
    }
    if (plugin.status) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getUpdateBadge = () => {
    if (plugin.availableVersion && plugin.availableVersion !== plugin.version) {
      return <Badge variant="outline">Update Available</Badge>;
    }
    return null;
  };

  const getMustUseBadge = () => {
    if (plugin.mustUse) {
      return <Badge variant="secondary">Must Use</Badge>;
    }
    return null;
  };

  const handleAction = async (action: string) => {
    switch (action) {
      case 'activate':
        try {
          await updatePluginStatus.mutateAsync({
            installationId: parseInt(installationId),
            slug: plugin.slug!,
            status: true
          });
        } catch (error) {
          // Error handling is done in the mutation's onError callback
          console.error("Error in handleAction activate:", error);
        }
        break;
      case 'deactivate':
        try {
          await updatePluginStatus.mutateAsync({
            installationId: parseInt(installationId),
            slug: plugin.slug!,
            status: false
          });
        } catch (error) {
          // Error handling is done in the mutation's onError callback
          console.error("Error in handleAction deactivate:", error);
        }
        break;
      case 'delete':
        setDeleteDialogOpen(true);
        break;
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePlugins.mutateAsync({
        installationId: parseInt(installationId),
        plugins: [plugin.slug!]
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Error in confirmDelete:", error);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
            />
          </div>
          
          {/* Plugin Icon */}
          <div className="flex-shrink-0">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          
          {/* Plugin Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{plugin.title}</h3>
              {plugin.mustUse && (
                <Shield className="h-4 w-4 text-blue-500" />
              )}
              {plugin.vulnerable && (
                <ShieldAlert className="h-4 w-4 text-red-500" />
              )}
            </div>
            
            <ExpandableDescription description={plugin.description} />
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                v{plugin.version}
              </span>
              {plugin.availableVersion && plugin.availableVersion !== plugin.version && (
                <>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs text-blue-600">
                    v{plugin.availableVersion}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Badges and Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              {getStatusBadge()}
              {getUpdateBadge()}
              {getMustUseBadge()}
            </div>
            
            {/* Action Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {plugin.status ? (
                  <DropdownMenuItem 
                    onClick={() => handleAction('deactivate')}
                    disabled={updatePluginStatus.isPending}
                  >
                    {updatePluginStatus.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Deactivating...
                      </>
                    ) : (
                      <>
                    <Settings className="mr-2 h-4 w-4" />
                    Deactivate
                      </>
                    )}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => handleAction('activate')}
                    disabled={updatePluginStatus.isPending}
                  >
                    {updatePluginStatus.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Activating...
                      </>
                    ) : (
                      <>
                    <Package className="mr-2 h-4 w-4" />
                    Activate
                      </>
                )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {plugin.changeLogUrl && (
                  <DropdownMenuItem onClick={() => window.open(plugin.changeLogUrl!, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Changelog
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => handleAction('delete')}
                  className="text-red-600 focus:text-red-600"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plugin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the plugin{" "}
              <span className="font-semibold text-foreground">
                {plugin.title}
              </span>
              ? This action cannot be undone and will permanently remove the plugin
              and all its associated data from your WordPress installation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deletePlugins.isPending}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePlugins.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlugins.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete Plugin"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export function WordPressPlugins({ installationId }: WordPressPluginsProps) {
  return <PluginsTable installationId={installationId} />;
}

// Legacy component - keeping for reference but not used
function WordPressPluginsLegacy({ installationId }: WordPressPluginsProps) {
  const { data: plugins, isLoading, isError, error, refetch } = useWordPressPlugins(installationId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedPlugins, setSelectedPlugins] = React.useState<Set<string>>(new Set());

  // tRPC mutation for bulk auto-updating plugins
  const bulkAutoUpdatePlugins = trpc.plesk.wpPluginsAutoupdate.update.useMutation({
    onSuccess: () => {
      toast.success("Auto-update settings updated successfully!");
      // Refetch data to update the UI
      refetch();
    },
    onError: (error: any) => {
      console.error("Error updating auto-update settings:", error);
      
      let errorMessage = "Please try again.";
      
      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid plugin data.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "NOT_FOUND") {
        errorMessage = "WordPress installation not found.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while updating auto-update settings.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error("Failed to update auto-update settings", {
        description: errorMessage,
      });
    },
  });

  const filteredPlugins = React.useMemo(() => {
    if (!plugins) return [];

    if (searchTerm.trim()) {
      return plugins.filter(plugin =>
        plugin.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plugin.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plugin.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return plugins;
  }, [plugins, searchTerm]);

  const handleSelectPlugin = (pluginSlug: string, selected: boolean) => {
    setSelectedPlugins(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(pluginSlug);
      } else {
        newSet.delete(pluginSlug);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedPlugins(new Set(filteredPlugins.map(plugin => plugin.slug!).filter(Boolean)));
    } else {
      setSelectedPlugins(new Set());
    }
  };

  const handleBulkAction = async (action: string) => {
    const selectedPluginSlugs = Array.from(selectedPlugins);
    console.log(`Bulk ${action} for plugins:`, selectedPluginSlugs);
    
    if (selectedPluginSlugs.length === 0) {
      toast.error("No plugins selected");
      return;
    }
    
    try {
    switch (action) {
        case 'auto-update':
          // Enable auto-update for selected plugins
          await bulkAutoUpdatePlugins.mutateAsync({
            installationId: parseInt(installationId),
            plugins: selectedPluginSlugs.map(slug => {
              const plugin = plugins?.find(p => p.slug === slug);
              return { 
                slug, 
                autoUpdates: true,
                status: plugin?.status || false // Include current status
              };
            })
          });
          break;
    }
    
      // Clear selection after successful action
    setSelectedPlugins(new Set());
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error(`Error in bulk ${action}:`, error);
    }
  };

  const selectedCount = selectedPlugins.size;
  const hasSelection = selectedCount > 0;

  if (isLoading) {
    return <PluginsSkeleton />;
  }

  if (isError) {
    return <PluginsError error={error as Error} onRetry={() => refetch()} />;
  }

  // Handle empty plugins array (not an error, just no plugins installed)
  if (!plugins || plugins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No plugins installed</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          This WordPress installation doesn't have any plugins installed yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedPlugins.size === filteredPlugins.length && filteredPlugins.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select All ({selectedPlugins.size})
            </span>
          </div>
          <div className="relative">
            <Input
              placeholder="Search plugins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredPlugins.length} of {plugins.length} plugins
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk Action Buttons */}
          {hasSelection && (
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('auto-update')}
                disabled={bulkAutoUpdatePlugins.isPending}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                {bulkAutoUpdatePlugins.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Enabling Auto-Update...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Enable Auto-Update ({selectedCount})
                  </>
                )}
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Plugins List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filteredPlugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No plugins found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No plugins match your search criteria." : "No plugins are installed."}
              </p>
            </div>
          ) : (
            filteredPlugins.map((plugin) => (
              <PluginCard 
                key={plugin.slug} 
                plugin={plugin} 
                isSelected={selectedPlugins.has(plugin.slug!)}
                onSelect={(selected) => handleSelectPlugin(plugin.slug!, selected)}
                installationId={installationId}
                onRefetch={refetch}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}