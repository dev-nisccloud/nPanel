"use client";

import * as React from "react";
import {
    Search,
    User,
    RefreshCw,
    Plus,
    MoreVertical,
    Pencil,
    Phone,
    Mail,
    Building2,
    Eye,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ETimsInitializationGuard } from "@/components/etims/etims-initialization-guard";
import { ETimsBranchSwitcher } from "@/components/etims/etims-branch-switcher";
import {
    SaveETimsCustomerSheet,
    type EtimsCustomerFormValues,
} from "./agency.kra-etims/customers/_components/save-etims-customer-sheet";
import { ViewETimsCustomerSheet } from "./agency.kra-etims/customers/_components/view-etims-customer-sheet";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function ETimsCustomersPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedBhfId, setSelectedBhfId] = React.useState<string | null>(null);
    const [isSaveOpen, setIsSaveOpen] = React.useState(false);
    const [isViewOpen, setIsViewOpen] = React.useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const [editingCustomer, setEditingCustomer] = React.useState<EtimsCustomerFormValues | null>(null);
    const [viewingCustomer, setViewingCustomer] = React.useState<EtimsCustomerFormValues | null>(null);
    const [customerToDelete, setCustomerToDelete] = React.useState<EtimsCustomerFormValues | null>(null);

    const { data: etimsConfig } = trpc.etims.auth.getConfiguration.useQuery();
    const { data: branchesData } = trpc.etims.branch.getBranchList.useQuery({ lastReqDt: "20230101000000" });

    const branches = React.useMemo(() => {
        const root: any = branchesData;
        const payload = root?.data?.responseBody?.data ?? root?.data ?? root?.responseBody?.data ?? root;
        const data: any = payload?.data ?? payload;
        const bhfList = data?.bhfList ?? [];
        return bhfList.map((b: any) => ({ bhfId: b.bhfId, bhfNm: b.bhfNm }));
    }, [branchesData]);

    React.useEffect(() => {
        if (selectedBhfId) return;
        const defaultBhfId = (etimsConfig as any)?.config?.branchId;
        if (defaultBhfId) setSelectedBhfId(defaultBhfId);
        else if (branches.length) setSelectedBhfId(branches[0].bhfId);
    }, [selectedBhfId, etimsConfig, branches]);

    const { data: customersData, isLoading, refetch, isFetching } = trpc.etims.data.getCustomerList.useQuery({
        lastReqDt: "20230101000000",
    });

    const customers = React.useMemo(() => {
        const list = (customersData as any)?.data;
        const all = Array.isArray(list) ? list : [];
        return all.filter((c: any) => c.useYn !== "N");
    }, [customersData]);

    const filteredCustomers = React.useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const query = searchQuery.toLowerCase().trim();
        return customers.filter((c: any) =>
            String(c.custNm ?? "").toLowerCase().includes(query) ||
            String(c.custTin ?? "").toLowerCase().includes(query) ||
            String(c.custNo ?? "").toLowerCase().includes(query) ||
            String(c.telNo ?? "").toLowerCase().includes(query) ||
            String(c.email ?? "").toLowerCase().includes(query)
        );
    }, [customers, searchQuery]);

    const openCreate = () => {
        setEditingCustomer(null);
        setIsSaveOpen(true);
    };

    const openEdit = (customer: EtimsCustomerFormValues) => {
        setEditingCustomer(customer);
        setIsSaveOpen(true);
    };

    const openView = (customer: EtimsCustomerFormValues) => {
        setViewingCustomer(customer);
        setIsViewOpen(true);
    };

    const requestDelete = (customer: EtimsCustomerFormValues) => {
        setIsViewOpen(false);
        setCustomerToDelete(customer);
        setIsDeleteOpen(true);
    };

    const deleteCustomer = trpc.etims.branch.saveCustomer.useMutation({
        onSuccess: (res) => {
            if (res?.success === false) {
                toast.error(res?.errorMessage ?? "Failed to remove customer");
                return;
            }
            toast.success("Customer removed from branch");
            setIsDeleteOpen(false);
            setCustomerToDelete(null);
            refetch();
        },
        onError: (err) => toast.error(err.message || "Failed to remove customer"),
    });

    const confirmDelete = () => {
        if (!customerToDelete) return;
        deleteCustomer.mutate({
            customer: {
                custNo: customerToDelete.custNo,
                custTin: customerToDelete.custTin,
                custNm: customerToDelete.custNm,
                adrs: customerToDelete.adrs ?? null,
                telNo: customerToDelete.telNo ?? null,
                email: customerToDelete.email ?? null,
                faxNo: customerToDelete.faxNo ?? null,
                remark: customerToDelete.remark ?? null,
                useYn: "N",
                regrId: "Admin",
                regrNm: "Admin",
                modrId: "Admin",
                modrNm: "Admin",
            },
        });
    };

    return (
        <ETimsInitializationGuard>
            <SaveETimsCustomerSheet
                open={isSaveOpen}
                onOpenChange={(open) => {
                    setIsSaveOpen(open);
                    if (!open) setEditingCustomer(null);
                }}
                initialCustomer={editingCustomer}
                onSuccess={() => refetch()}
            />

            <ViewETimsCustomerSheet
                open={isViewOpen}
                onOpenChange={(open) => {
                    setIsViewOpen(open);
                    if (!open) setViewingCustomer(null);
                }}
                customer={viewingCustomer}
                onEdit={openEdit}
                onDeleteRequest={requestDelete}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove branch customer?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    You are about to remove{" "}
                                    <span className="font-semibold text-foreground">{customerToDelete?.custNm}</span>{" "}
                                    (<span className="font-mono">{customerToDelete?.custTin}</span>) from your eTIMS branch.
                                </p>
                                <p>
                                    KRA eTIMS does not support permanently deleting branch customers. This action marks the
                                    customer as inactive on KRA so they will no longer appear in active customer lists or be
                                    available for new invoices.
                                </p>
                                <p className="font-medium text-foreground">This cannot be undone from nPanel without re-registering the customer.</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteCustomer.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={deleteCustomer.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteCustomer.isPending ? (
                                <>
                                    <Spinner size={16} className="mr-2" />
                                    Removing...
                                </>
                            ) : (
                                "Remove customer"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">Branch Customers</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage customers registered on your eTIMS branch. Register customers here before using them on invoices.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, TIN, phone or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {selectedBhfId && branches.length ? (
                                <ETimsBranchSwitcher
                                    branches={branches}
                                    value={selectedBhfId}
                                    onChange={(bhfId) => {
                                        const deviceBhfId = (etimsConfig as any)?.config?.branchId;
                                        if (deviceBhfId && bhfId !== deviceBhfId) {
                                            toast.error(`This device is only valid for branch ${deviceBhfId}. Re-initialize eTIMS for branch ${bhfId} to use it.`);
                                            return;
                                        }
                                        setSelectedBhfId(bhfId);
                                        setTimeout(() => refetch(), 0);
                                    }}
                                />
                            ) : null}
                            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading || isFetching}>
                                <RefreshCw className={`h-4 w-4 ${isLoading || isFetching ? "animate-spin" : ""}`} />
                            </Button>
                            <Button onClick={openCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add customer
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-lg border bg-card shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">KRA PIN</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                <h3 className="text-lg font-medium">No branch customers</h3>
                                                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                                    {searchQuery.trim()
                                                        ? "No customers match your search."
                                                        : "Register customers on your eTIMS branch so they can be used on sales invoices."}
                                                </p>
                                                {!searchQuery.trim() ? (
                                                    <Button className="mt-4" size="sm" onClick={openCreate}>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add first customer
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer: any) => (
                                        <tr key={customer.custNo} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{customer.custNm}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">#{customer.custNo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-mono text-xs">{customer.custTin}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                    {customer.telNo ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="h-3 w-3" />
                                                            {customer.telNo}
                                                        </div>
                                                    ) : null}
                                                    {customer.email ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="h-3 w-3" />
                                                            {customer.email}
                                                        </div>
                                                    ) : null}
                                                    {!customer.telNo && !customer.email ? "—" : null}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge
                                                    variant={customer.useYn === "N" ? "secondary" : "default"}
                                                    className={customer.useYn === "N" ? "" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"}
                                                >
                                                    {customer.useYn === "N" ? "INACTIVE" : "ACTIVE"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openView(customer)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEdit(customer)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit customer
                                                        </DropdownMenuItem>
                                                        {customer.useYn !== "N" ? (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => requestDelete(customer)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Remove customer
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : null}
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
        </ETimsInitializationGuard>
    );
}
