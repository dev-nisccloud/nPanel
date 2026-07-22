"use client";

import * as React from "react";
import { Link } from "react-router";
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Key,
  CreditCard,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";
import { CreateMerchantSheet } from "./agency.nisc-payment-gateway/_components/create-merchant-sheet";

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Active
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "SUSPENDED":
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800">
          <Ban className="mr-1 h-3 w-3" />
          Suspended
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Closed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function NiscPaymentGatewayPage() {
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [createSheetOpen, setCreateSheetOpen] = React.useState(false);

  const { data, isLoading, refetch } = trpc.niscPaymentGateway.merchants.list.useQuery({
    status: statusFilter as any,
    limit: 50,
    offset: 0,
  });

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = trpc.niscPaymentGateway.merchants.getStats.useQuery();

  const merchants = React.useMemo(() => {
    if (!data?.merchants) return [];
    
    let filtered = data.merchants;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.merchantName.toLowerCase().includes(query) ||
          m.merchantEmail.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [data?.merchants, searchQuery]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Payment Gateway</h1>
          <p className="text-xs text-muted-foreground">
            Manage payment gateway merchants, credentials, and API keys for seamless payment processing.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : data?.merchants.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  data?.merchants.filter((m) => m.status === "ACTIVE").length || 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  stats?.totalApiKeys || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoadingStats ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `${stats?.activeApiKeys || 0} active`
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  stats?.totalTransactions || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoadingStats ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `${stats?.successfulTransactions || 0} successful`
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Merchants */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Merchants</CardTitle>
            <CardDescription className="text-xs">View and manage payment gateway merchants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full sm:flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search merchants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setCreateSheetOpen(true)} size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>

            {/* Merchants Table */}
            <div className="mt-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : merchants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-base font-semibold">No merchants found</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get started by adding your first merchant
                  </p>
                  <Button onClick={() => setCreateSheetOpen(true)} size="sm" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Merchant
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Merchant</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchants.map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell>
                          <Link
                            to={`/agency/nisc-payment-gateway/${merchant.id}`}
                            className="hover:underline"
                          >
                            <div className="text-sm font-medium">{merchant.merchantName}</div>
                            <div className="text-xs text-muted-foreground">
                              {merchant.merchantEmail}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{merchant.businessType}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(merchant.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/agency/nisc-payment-gateway/${merchant.id}`} className="text-sm">
                                  View details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/agency/nisc-payment-gateway/${merchant.id}/api-keys`} className="text-sm">
                                  Manage API keys
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive text-sm">
                                Suspend merchant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Merchant Sheet */}
        <CreateMerchantSheet
          open={createSheetOpen}
          onOpenChange={setCreateSheetOpen}
          onSuccess={() => {
            setCreateSheetOpen(false);
            refetch();
          }}
        />
      </div>
    </div>
  );
}
