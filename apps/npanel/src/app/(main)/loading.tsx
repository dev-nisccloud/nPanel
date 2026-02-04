import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { NavigationLoadingProvider } from "@/contexts/navigation-loading-context";
// import { SwitchingTeamProvider } from "@/contexts/switching-team-context"; // This context requires data, so we can't wrap it here.

export default function Loading() {
    return (
        <NavigationLoadingProvider>
            {/* We don't wrap with SwitchingTeamProvider here because it likely depends on server data 
          that might be blocking. We just want a pure visual shell. */}
            <SidebarProvider defaultOpen={true}>
                {/* Skeleton Sidebar - Mimics basic sidebar structure */}
                <div className="hidden md:flex h-screen w-[--sidebar-width] bg-sidebar border-r flex-col gap-4 p-4">
                    {/* Logo Skeleton */}
                    <div className="px-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                    {/* Menu Items Skeleton */}
                    <div className="flex-1 space-y-4 mt-4">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                        <div className="mt-8 space-y-2">
                            <Skeleton className="h-4 w-20 ml-2" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </div>
                    {/* User Profile Skeleton */}
                    <Skeleton className="h-12 w-full" />
                </div>

                <SidebarInset>
                    {/* Header Skeleton */}
                    <header className="flex h-12 shrink-0 items-center justify-between px-4 border-b bg-background">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-md" /> {/* Trigger */}
                            <div className="h-4 w-[1px] bg-border mx-2" />
                            <Skeleton className="h-6 w-48" /> {/* Breadcrumb/Search */}
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-32" /> {/* Team Switcher */}
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </header>
                    {/* Content Body Skeleton */}
                    <div className="p-4 md:p-6 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" /> {/* Welcome Message */}
                            <Skeleton className="h-4 w-96" />
                        </div>
                        {/* Metric Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                        </div>
                        {/* Promo/Chart Section */}
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </NavigationLoadingProvider>
    );
}
