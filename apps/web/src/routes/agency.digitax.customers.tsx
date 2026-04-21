"use client";

import * as React from "react";
import {
    Plus,
    Search,
    RefreshCw,
    User,
    UserPlus,
    MoreVertical,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Edit2,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { SaveDigitaxCustomerSheet } from "./agency.digitax/customers/_components/save-digitax-customer-sheet";

export default function DigitaxCustomersPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);

    const { data: customersData, isLoading, refetch } = trpc.digitax.customers.getAll.useQuery({
        page_size: 20,
    });

    const customers = customersData?.data ?? [];

    const filteredCustomers = React.useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const query = searchQuery.toLowerCase().trim();
        return customers.filter((c: any) =>
            c.name.toLowerCase().includes(query) ||
            c.tin.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
        );
    }, [customers, searchQuery]);

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <SaveDigitaxCustomerSheet 
                open={isAddOpen}
                onOpenChange={(v) => {
                    setIsAddOpen(v);
                    if (!v) setSelectedCustomer(null);
                }}
                onSuccess={() => refetch()}
                customer={selectedCustomer}
            />

            <div className="w-full max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Customer Directory</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage and synchronise customer tax identities for eTIMS.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-none transition-all gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            New Customer
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/40 max-w-md shadow-inner">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Search by name, TIN or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-transparent border-none focus-visible:ring-0 h-9"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-6 rounded-3xl border border-border/50 bg-card/50 animate-pulse space-y-5">
                                <div className="flex justify-between">
                                    <Skeleton className="h-14 w-14 rounded-2xl" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                                <div className="space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                            </div>
                        ))
                    ) : filteredCustomers.length === 0 ? (
                        <div className="col-span-full py-24 bg-card/30 rounded-[2.5rem] border border-dashed border-border/60 flex flex-col items-center justify-center space-y-5">
                            <div className="h-20 w-20 rounded-[2rem] bg-muted/60 flex items-center justify-center text-muted-foreground/30">
                                <User className="h-10 w-10" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-foreground/80 tracking-tight">Your directory is empty</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">Start by adding customers to simplify your invoicing workflow.</p>
                            </div>
                            <Button variant="outline" onClick={() => setIsAddOpen(true)} className="rounded-full px-8 h-12">
                                Add First Customer
                            </Button>
                        </div>
                    ) : (
                        filteredCustomers.map((customer: any) => (
                            <div key={customer.id} className="group p-6 rounded-[2rem] border border-border/50 bg-card hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden flex flex-col">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/30">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl w-48 font-sans">
                                            <DropdownMenuItem className="gap-2 py-2.5">
                                                <Edit2 className="h-4 w-4" /> Edit Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 py-2.5">
                                                <CreditCard className="h-4 w-4" /> Billing History
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="opacity-40" />
                                            <DropdownMenuItem className="gap-2 py-2.5 text-rose-500 font-medium">
                                                <Trash2 className="h-4 w-4" /> Archive
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/5 text-amber-600 border border-amber-500/10">
                                        <User className="h-7 w-7" />
                                    </div>
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold tracking-widest px-3 py-1">
                                        VERIFIED
                                    </Badge>
                                </div>

                                <div className="flex-1 space-y-1.5">
                                    <h3 className="text-xl font-bold text-foreground/90 leading-tight line-clamp-1">{customer.name}</h3>
                                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/40 w-fit px-2 py-0.5 rounded-md">
                                        <span className="opacity-50">TIN:</span> {customer.tin}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-border/20 space-y-2.5">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Mail className="h-4 w-4 shrink-0 opacity-60" />
                                        <span className="text-xs font-medium truncate">{customer.email || "No email"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Phone className="h-4 w-4 shrink-0 opacity-60" />
                                        <span className="text-xs font-medium">{customer.phone || "No phone"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <MapPin className="h-4 w-4 shrink-0 opacity-60" />
                                        <span className="text-xs font-medium line-clamp-1">{customer.address || "No address"}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
