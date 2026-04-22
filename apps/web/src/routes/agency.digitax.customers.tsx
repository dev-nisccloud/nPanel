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
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const { data: customersData, isLoading, refetch } = trpc.digitax.customers.getAll.useQuery({
        page_size: 50,
    });

    const deleteCustomer = trpc.digitax.customers.delete.useMutation({
        onSuccess: () => {
            toast.success("Customer removed from eTIMS system");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to remove customer");
        },
    });

    // Robust data extraction
    const customers = React.useMemo(() => {
        if (!customersData) return [];
        if (Array.isArray(customersData)) return customersData;
        if (customersData.data && Array.isArray(customersData.data)) return customersData.data;
        if ((customersData as any).result?.data?.data && Array.isArray((customersData as any).result.data.data)) {
            return (customersData as any).result.data.data;
        }
        if ((customersData as any).result?.data && Array.isArray((customersData as any).result.data)) {
            return (customersData as any).result.data;
        }
        return [];
    }, [customersData]);

    const filteredCustomers = React.useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const query = searchQuery.toLowerCase().trim();
        return customers.filter((c: any) =>
            (c.customer_name?.toLowerCase().includes(query) ?? false) ||
            (c.customer_tin?.toLowerCase().includes(query) ?? false) ||
            (c.email?.toLowerCase().includes(query) ?? false) ||
            (c.phone?.toLowerCase().includes(query) ?? false)
        );
    }, [customers, searchQuery]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success("Copied to clipboard");
    };

    const handleEdit = (customer: any) => {
        setSelectedCustomer(customer);
        setIsAddOpen(true);
    };

    const handleDelete = (customerId: string) => {
        if (confirm("Are you sure you want to remove this customer from eTIMS registry?")) {
            deleteCustomer.mutate({ customerId });
        }
    };

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

            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-base font-semibold tracking-tight">Customers</h1>
                        <p className="text-xs text-muted-foreground">
                            Manage and synchronise customer tax identities for eTIMS.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className="rounded-full h-9 w-9 border-border/50"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedCustomer(null);
                                setIsAddOpen(true);
                            }}
                            className="bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all gap-2 h-9 text-xs font-medium px-4"
                        >
                            <UserPlus className="h-4 w-4" />
                            New Customer
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-6">
                    <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/40 max-w-md shadow-inner">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                            <input
                                placeholder="Search by name, TIN or contact..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 bg-transparent border-none focus:outline-none focus:ring-0 h-9 text-sm"
                            />
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-foreground/5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/40 text-muted-foreground/80 font-semibold text-[10px] tracking-wider uppercase border-b border-border/40">
                                        <th className="px-6 py-4">Customer Identity</th>
                                        <th className="px-6 py-4">Contact Info</th>
                                        <th className="px-6 py-4">Taxpin</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-5"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></td>
                                                <td className="px-6 py-5"><div className="space-y-2"><Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-24" /></div></td>
                                                <td className="px-6 py-5"><Skeleton className="h-4 w-28" /></td>
                                                <td className="px-6 py-5"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></td>
                                            </tr>
                                        ))
                                    ) : filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                                    <div className="p-4 bg-muted rounded-full"><User className="h-10 w-10" /></div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-lg text-foreground">No customers found</p>
                                                        <p className="text-xs">Your directory for eTIMS is currently empty.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map((customer: any) => (
                                            <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/5 text-amber-600 border border-amber-500/10">
                                                            <User className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-foreground/90 truncate">{customer.customer_name}</span>
                                                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{customer.customer_tin}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 group/item">
                                                            <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                                                            <span className="text-xs font-medium text-foreground/70 truncate max-w-[180px]">{customer.email || '—'}</span>
                                                            {customer.email && (
                                                                <button onClick={() => handleCopy(customer.email, customer.id + 'email')} className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                    {copiedId === customer.id + 'email' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground/40 hover:text-primary" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 group/item">
                                                            <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                                                            <span className="text-xs font-medium text-foreground/70">{customer.phone || '—'}</span>
                                                            {customer.phone && (
                                                                <button onClick={() => handleCopy(customer.phone, customer.id + 'phone')} className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                    {copiedId === customer.id + 'phone' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground/40 hover:text-primary" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs font-mono font-bold bg-muted/60 px-2 py-1 rounded border border-border/40 text-foreground/80">
                                                        {customer.customer_tin}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full opacity-40 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border/40 shadow-xl overflow-hidden">
                                                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-4 py-3 bg-muted/20">Manage Customer</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleEdit(customer)} className="gap-3 px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary">
                                                                <Edit2 className="h-4 w-4 opacity-60" /> Edit Profile
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-3 px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary">
                                                                <CreditCard className="h-4 w-4 opacity-60" /> Billing History
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="gap-3 px-4 py-3 cursor-pointer text-rose-500 focus:bg-rose-500/5 focus:text-rose-600">
                                                                <Trash2 className="h-4 w-4 opacity-60" /> Delete Customer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
