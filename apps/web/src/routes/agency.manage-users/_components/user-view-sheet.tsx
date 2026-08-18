"use client";

import * as React from "react";
import { Edit, Mail, ShieldCheck, ShieldX, Calendar, User, BadgeCheck, XIcon } from "lucide-react";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { EditUserDialog } from "./edit-user-dialog";
import { ProfileInformation } from "./profile-information";
import { EditProfileDialog } from "./edit-profile-dialog";

interface UserViewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}

export function UserViewSheet({
    open,
    onOpenChange,
    userId,
}: UserViewSheetProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = React.useState(false);

    const { data: user, isLoading, error } = trpc.manageUsers.getById.useQuery(
        { userId },
        { enabled: open && !!userId }
    );

    const { data: sessions, isLoading: isLoadingSessions } = trpc.manageUsers.getSessions.useQuery(
        { userId },
        { enabled: open && !!userId }
    );

    const utils = trpc.useUtils();

    const handleEditSuccess = () => {
        utils.manageUsers.getAll.invalidate();
        utils.manageUsers.getById.invalidate({ userId });
        utils.userProfile.getUserById.invalidate({ userId });
        utils.manageUsers.getProfile?.invalidate({ userId });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            ACTIVE: "default",
            SUSPENDED: "secondary",
            BANNED: "destructive",
            DEACTIVATED: "outline",
        };
        return (
            <Badge variant={variants[status] || "secondary"}>
                {status}
            </Badge>
        );
    };

    if (!open) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="flex items-center gap-2">
                                    {isLoading ? "Loading User..." : user?.name || "User Details"}
                                    {user?.emailVerified && (
                                        <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500" />
                                    )}
                                </SheetTitle>
                                <SheetDescription>
                                    {isLoading ? "Fetching user status..." : "Agency account details and session control"}
                                </SheetDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isLoading && user && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                            <SheetClose asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                                    <XIcon className="h-5 w-5" />
                                </Button>
                            </SheetClose>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 min-h-0 pr-4">
                        <div className="px-6 py-6 space-y-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner size={32} />
                                </div>
                            ) : error || !user ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-destructive mb-4">{error?.message || "User not found"}</p>
                                    <Button onClick={() => onOpenChange(false)} variant="outline">
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Account Overview */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <User className="h-5 w-5" />
                                                Account Overview
                                            </CardTitle>
                                            <CardDescription>Primary identification details</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email Address</span>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium">{user.email}</p>
                                                    {user.emailVerified ? (
                                                        <ShieldCheck className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <ShieldX className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Agency Role</span>
                                                <p className="text-sm font-medium">
                                                    <Badge variant="outline">{user.role}</Badge>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</span>
                                                <p className="text-sm font-medium">
                                                    {getStatusBadge(user.status)}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Registered</span>
                                                <p className="text-sm font-medium">
                                                    {new Date(user.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {user.lastLoginAt && (
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Latest Activity</span>
                                                    <p className="text-sm font-medium">
                                                        {new Date(user.lastLoginAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Profile Details */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <BadgeCheck className="h-5 w-5" />
                                                    Profile Information
                                                </CardTitle>
                                                <CardDescription>Detailed user biography</CardDescription>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setIsEditProfileDialogOpen(true)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Profile
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            <ProfileInformation userId={userId} />
                                        </CardContent>
                                    </Card>

                                    {/* Session Management */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <ShieldCheck className="h-5 w-5" />
                                                Active Sessions
                                            </CardTitle>
                                            <CardDescription>Track and manage device logins</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingSessions ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <Spinner size={24} />
                                                </div>
                                            ) : !sessions || sessions.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                    <ShieldX className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No active sessions found.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {sessions.map((session) => (
                                                        <div key={session.id} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                                                            <div className="flex items-center justify-between">
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Identifier</p>
                                                                    <p className="text-xs font-mono truncate max-w-[180px]">{session.token}</p>
                                                                </div>
                                                                <Badge variant={new Date(session.expiresAt) > new Date() ? "default" : "secondary"} className="text-[10px]">
                                                                    {new Date(session.expiresAt) > new Date() ? "Active" : "Expired"}
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 text-[11px]">
                                                                <div>
                                                                    <p className="text-muted-foreground">Created</p>
                                                                    <p className="font-semibold">{new Date(session.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-muted-foreground">Expires</p>
                                                                    <p className="font-semibold text-orange-600">{new Date(session.expiresAt).toLocaleDateString()}</p>
                                                                </div>
                                                                {session.ipAddress && (
                                                                    <div className="col-span-2">
                                                                        <p className="text-muted-foreground">IP Address</p>
                                                                        <p className="font-medium font-mono">{session.ipAddress}</p>
                                                                    </div>
                                                                )}
                                                                {session.userAgent && (
                                                                    <div className="col-span-2">
                                                                        <p className="text-muted-foreground">User Agent</p>
                                                                        <p className="italic font-medium line-clamp-1">{session.userAgent}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {user && (
                <>
                    <EditUserDialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                        userId={user.id}
                        initialData={{
                            name: user.name,
                            email: user.email,
                            role: user.role === "CUSTOMER" ? "AGENCY_USER" : user.role as "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER",
                            agencyRoleId: user.agencyRoleId ?? null,
                        }}
                        onSuccess={handleEditSuccess}
                    />
                    <EditProfileDialog
                        open={isEditProfileDialogOpen}
                        onOpenChange={setIsEditProfileDialogOpen}
                        userId={user.id}
                        userName={user.name}
                        onSuccess={handleEditSuccess}
                    />
                </>
            )}
        </>
    );
}
