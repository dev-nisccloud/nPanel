"use client";

import * as React from "react";
import { Plus, RefreshCw, Search, User, EllipsisVertical, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { CreateUserSheet } from "./_components/create-user-sheet";
import { UserViewDialog } from "./_components/user-view-dialog";
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
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { z } from "zod";
import { userSchema } from "./_components/schema";

const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-lg font-semibold mb-2">{title}</p>
    <p className="text-muted-foreground mb-4">{description}</p>
    {action}
  </div>
);

export default function ManageUsersPage() {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusChangeDialog, setStatusChangeDialog] = React.useState<{
    open: boolean;
    userId: string | null;
    status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED" | null;
    action: string;
  }>({
    open: false,
    userId: null,
    status: null,
    action: "",
  });

  const { data: users, isLoading, error, refetch } = trpc.manageUsers.getAll.useQuery({});

  const utils = trpc.useUtils();

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);

  const transformedUsers = React.useMemo(() => {
    return filteredUsers.map((user) => {
      const toDate = (value: unknown): Date => {
        if (value instanceof Date) return value;
        if (typeof value === 'string') return new Date(value);
        return new Date(String(value));
      };
      
      const mappedUser = {
        ...user,
        createdAt: toDate(user.createdAt),
        updatedAt: toDate(user.updatedAt),
        lastLoginAt: user.lastLoginAt ? toDate(user.lastLoginAt) : null,
      } as z.infer<typeof userSchema>;
      return mappedUser;
    });
  }, [filteredUsers]);

  const handleSuccess = () => {
    utils.manageUsers.getAll.invalidate();
    setIsCreateSheetOpen(false);
  };

  const handleView = (id: string) => {
    setSelectedUserId(id);
  };

  const changeStatusMutation = trpc.manageUsers.changeStatus.useMutation({
    onSuccess: () => {
      toast.success("User status updated successfully");
      utils.manageUsers.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });

  const handleStatusChange = (id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED", action: string) => {
    setStatusChangeDialog({
      open: true,
      userId: id,
      status,
      action,
    });
  };

  const handleUnban = (id: string) => {
    handleStatusChange(id, "ACTIVE", "unban");
  };

  const handleUnsuspend = (id: string) => {
    handleStatusChange(id, "ACTIVE", "unsuspend");
  };

  const confirmStatusChange = () => {
    if (statusChangeDialog.userId && statusChangeDialog.status) {
      changeStatusMutation.mutate({
        userId: statusChangeDialog.userId,
        status: statusChangeDialog.status,
      });
      setStatusChangeDialog({
        open: false,
        userId: null,
        status: null,
        action: "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">{error.message || "Failed to load users"}</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground">
            Manage agency user accounts, view their activity, and handle their permissions.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search users by name, email, role, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => setIsCreateSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
      {!users || users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Get started by creating a new agency user account."
          action={
            <Button onClick={() => setIsCreateSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          }
        />
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold mb-2">No users found</p>
          <p className="text-muted-foreground mb-4">
            No users match your search query "{searchQuery}".
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => handleView(user.id)}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.role.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.status === "ACTIVE"
                          ? "bg-green-600 text-white border-green-600 hover:bg-green-600 hover:text-white"
                          : ""
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="pr-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <EllipsisVertical className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onSelect={() => handleView(user.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TooltipTrigger>
                        <TooltipContent>Actions</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
        </div>
      </div>

      <CreateUserSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        onSuccess={handleSuccess}
      />

      {selectedUserId && (
        <UserViewDialog
          open={!!selectedUserId}
          onOpenChange={(open) => {
            if (!open) setSelectedUserId(null);
          }}
          userId={selectedUserId}
          onStatusChange={(id, status, action) => handleStatusChange(id, status, action)}
        />
      )}

      <AlertDialog
        open={statusChangeDialog.open}
        onOpenChange={(open) =>
          setStatusChangeDialog({
            open,
            userId: null,
            status: null,
            action: "",
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusChangeDialog.action} this user account? 
              {statusChangeDialog.status && ` This action will change their account status to ${statusChangeDialog.status}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changeStatusMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={changeStatusMutation.isPending}
              className={
                statusChangeDialog.status === "BANNED" || statusChangeDialog.status === "DEACTIVATED"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {changeStatusMutation.isPending ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
