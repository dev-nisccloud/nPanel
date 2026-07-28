"use client";

import * as React from "react";
import { useParams, useNavigate, Link } from "react-router";
import { toast } from "@/components/ui/sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  MoreHorizontal,
  Key,
  CreditCard,
  Settings,
  Activity,
  FileText,
  Shield,
  ExternalLink,
  Copy,
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddCredentialsSheet } from "./agency.nisc-payment-gateway/_components/add-credentials-sheet";
import { GenerateApiKeySheet } from "./agency.nisc-payment-gateway/_components/generate-api-key-sheet";
import { ViewCredentialsSheet } from "./agency.nisc-payment-gateway/_components/view-credentials-sheet";
import { UpdateCredentialsSheet } from "./agency.nisc-payment-gateway/_components/update-credentials-sheet";
import { DeactivateCredentialsDialog } from "./agency.nisc-payment-gateway/_components/deactivate-credentials-dialog";
import { ViewApiKeySheet } from "./agency.nisc-payment-gateway/_components/view-api-key-sheet";
import { RevokeApiKeyDialog } from "./agency.nisc-payment-gateway/_components/revoke-api-key-dialog";
import { SimulatorForm } from "./agency.nisc-payment-gateway/_components/simulator-form";
import { AreaChart, Area, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

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

function getHttpMethodBadge(method: string) {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800",
    PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800",
  };

  return (
    <Badge variant="outline" className={cn("font-mono text-xs", colors[method] || "")}>
      {method}
    </Badge>
  );
}

export default function MerchantDetailsPage() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  const [showApiKeySecret, setShowApiKeySecret] = React.useState<Record<string, boolean>>({});
  const [addCredentialsOpen, setAddCredentialsOpen] = React.useState(false);
  const [generateApiKeyOpen, setGenerateApiKeyOpen] = React.useState(false);
  const [viewCredentialsOpen, setViewCredentialsOpen] = React.useState(false);
  const [updateCredentialsOpen, setUpdateCredentialsOpen] = React.useState(false);
  const [deactivateCredentialsOpen, setDeactivateCredentialsOpen] = React.useState(false);
  const [viewApiKeyOpen, setViewApiKeyOpen] = React.useState(false);
  const [revokeApiKeyOpen, setRevokeApiKeyOpen] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = React.useState<{
    id: string;
    provider: string;
    environment: string;
  } | null>(null);
  const [selectedApiKey, setSelectedApiKey] = React.useState<{
    id: string;
    name: string;
    keyPrefix: string;
  } | null>(null);

  // Pagination and filtering for logs
  const [logsPage, setLogsPage] = React.useState(0);
  const [logsPageSize, setLogsPageSize] = React.useState<10 | 30 | 50 | 100>(50);
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);

  // Get merchant data
  const { data: merchant, isLoading, refetch } = trpc.niscPaymentGateway.merchants.getById.useQuery({
    id: merchantId!,
  }, {
    enabled: !!merchantId,
  });

  const { data: apiKeys, refetch: refetchApiKeys } = trpc.niscPaymentGateway.apiKeys.list.useQuery({
    merchantId: merchantId!,
  }, {
    enabled: !!merchantId,
  });

  const { data: credentials, refetch: refetchCredentials } = trpc.niscPaymentGateway.credentials.list.useQuery({
    merchantId: merchantId!,
  }, {
    enabled: !!merchantId,
  });

  const { data: transactions } = trpc.niscPaymentGateway.transactions.list.useQuery({
    merchantId: merchantId!,
    limit: 50,
    offset: 0,
  }, {
    enabled: !!merchantId,
  });

  // Fetch request logs with pagination
  const { data: requestLogs } = trpc.niscPaymentGateway.requestLogs.list.useQuery({
    merchantId: merchantId!,
    limit: logsPageSize,
    offset: logsPage * logsPageSize,
  }, {
    enabled: !!merchantId,
  });

  // Fetch access stats for current month
  const { data: accessStats } = trpc.niscPaymentGateway.accessLogs.getCurrentMonthStats.useQuery({
    merchantId: merchantId!,
  }, {
    enabled: !!merchantId,
  });

  // Calculate pagination info for logs
  const logsTotal = requestLogs?.logs?.length || 0;
  const hasLogsNextPage = requestLogs?.pagination?.hasMore || false;
  const hasLogsPrevPage = logsPage > 0;
  const logsCurrentPageLabel = logsTotal > 0 ? logsPage + 1 : 0;

  // Mutation for updating merchant status
  const updateStatusMutation = trpc.niscPaymentGateway.merchants.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Merchant status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update merchant status");
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({
      id: merchantId!,
      status: "ACTIVE",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-semibold">Merchant not found</h2>
        <Button onClick={() => navigate("/agency/nisc-payment-gateway")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to merchants
        </Button>
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch((err) => {
      toast.error(`Failed to copy ${label}`);
      console.error('Failed to copy:', err);
    });
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/agency/nisc-payment-gateway")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-base font-semibold tracking-tight">{merchant.merchant.merchantName}</h1>
              <p className="text-xs text-muted-foreground">{merchant.merchant.merchantEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(merchant.merchant.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
            {merchant.merchant.status === "PENDING" && (
              <>
                <DropdownMenuItem 
                  className="text-sm"
                  onClick={handleApprove}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve Merchant
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
                <DropdownMenuItem className="text-sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit merchant
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm">
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend merchant
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive text-sm">
                  <XCircle className="mr-2 h-4 w-4" />
                  Close merchant
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
        </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Merchant Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Merchant Details</CardTitle>
                  <CardDescription className="text-xs">Basic information about this merchant</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Merchant Name</p>
                    <p className="font-medium">{merchant.merchant.merchantName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Business Type</p>
                    <p className="font-medium">{merchant.merchant.businessType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{merchant.merchant.merchantEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{merchant.merchant.merchantPhone || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Website</p>
                    {merchant.merchant.merchantWebsite ? (
                      <a
                        href={merchant.merchant.merchantWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center"
                      >
                        {merchant.merchant.merchantWebsite}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Business Name</p>
                    <p className="font-medium">{merchant.merchant.businessName || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Registration Number</p>
                    <p className="font-medium">{merchant.merchant.businessRegistration || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(merchant.merchant.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{merchant.merchant.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Webhook Configuration</CardTitle>
                  <CardDescription className="text-xs">
                    Endpoint for receiving payment notifications
                  </CardDescription>
                </div>
                {(merchant.merchant.settings as any)?.webhookUrl && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Configured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(merchant.merchant.settings as any)?.webhookUrl ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Webhook URL</p>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <code className="text-xs flex-1 break-all font-mono">
                        {(merchant.merchant.settings as any).webhookUrl}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => copyToClipboard((merchant.merchant.settings as any).webhookUrl, 'Webhook URL')}
                      >
                        {copiedField === 'Webhook URL' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Registered At</p>
                      <p className="font-medium">
                        {(merchant.merchant.settings as any).webhookRegisteredAt
                          ? format(
                              new Date((merchant.merchant.settings as any).webhookRegisteredAt),
                              "MMM d, yyyy HH:mm"
                            )
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">M-Pesa Callback</p>
                      <p className="font-medium font-mono text-xs">
                        /api/nisc-gateway/webhooks/mpesa/{merchantId}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Flow:</strong> M-Pesa → nPanel server (callback) → This webhook URL
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No webhook configured</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Merchant needs to register a webhook URL via API or WordPress plugin
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Keys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiKeys?.apiKeys.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {apiKeys?.apiKeys.filter((k) => k.isActive).length || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credentials</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{credentials?.credentials.length || 0}</div>
                <p className="text-xs text-muted-foreground">Payment providers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions?.transactions.length || 0}</div>
                <p className="text-xs text-muted-foreground">Last 10 transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions && transactions.transactions.length > 0
                    ? `${Math.round(
                        (transactions.transactions.filter((tx) => tx.status === "COMPLETED")
                          .length /
                          transactions.transactions.length) *
                          100
                      )}%`
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions && transactions.transactions.length > 0
                    ? `${
                        transactions.transactions.filter((tx) => tx.status === "COMPLETED")
                          .length
                      } of ${transactions.transactions.length} successful`
                    : "No transactions yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Provider Credentials</CardTitle>
                <CardDescription>Encrypted credentials for payment providers</CardDescription>
              </div>
              <Button onClick={() => setAddCredentialsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Credentials
              </Button>
            </CardHeader>
            <CardContent>
              {credentials?.credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No credentials configured</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add payment provider credentials to start processing payments
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Verified</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credentials?.credentials.map((cred) => (
                      <TableRow key={cred.id}>
                        <TableCell className="font-medium">{cred.provider}</TableCell>
                        <TableCell>
                          <Badge variant={cred.environment === "PRODUCTION" ? "default" : "secondary"}>
                            {cred.environment === "PRODUCTION" ? "Production" : "Sandbox"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cred.isActive ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cred.lastVerifiedAt
                            ? format(new Date(cred.lastVerifiedAt), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCredential({
                                    id: cred.id,
                                    provider: cred.provider,
                                    environment: cred.environment,
                                  });
                                  setViewCredentialsOpen(true);
                                }}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCredential({
                                    id: cred.id,
                                    provider: cred.provider,
                                    environment: cred.environment,
                                  });
                                  setUpdateCredentialsOpen(true);
                                }}
                              >
                                Update credentials
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedCredential({
                                    id: cred.id,
                                    provider: cred.provider,
                                    environment: cred.environment,
                                  });
                                  setDeactivateCredentialsOpen(true);
                                }}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage API keys for external access</CardDescription>
              </div>
              <Button onClick={() => setGenerateApiKeyOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Generate API Key
              </Button>
            </CardHeader>
            <CardContent>
              {apiKeys?.apiKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Key className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No API keys</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate an API key to start using the gateway
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys?.apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {key.keyPrefix}***
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(key.keyPrefix, `Key-${key.id}`)}
                            >
                              {copiedField === `Key-${key.id}` ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              key.environment === "live" || key.environment === "PRODUCTION"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {key.environment === "live" || key.environment === "PRODUCTION"
                              ? "Live"
                              : "Test"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {key.isActive ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                              Revoked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {key.lastUsedAt
                            ? format(new Date(key.lastUsedAt), "MMM d, yyyy HH:mm")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedApiKey({
                                    id: key.id,
                                    name: key.name,
                                    keyPrefix: key.keyPrefix,
                                  });
                                  setViewApiKeyOpen(true);
                                }}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedApiKey({
                                    id: key.id,
                                    name: key.name,
                                    keyPrefix: key.keyPrefix,
                                  });
                                  setRevokeApiKeyOpen(true);
                                }}
                              >
                                Revoke key
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payment Transactions</CardTitle>
              <CardDescription className="text-xs">
                Transaction history with M-Pesa details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!transactions?.transactions || transactions.transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-base font-semibold">No transactions yet</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transactions will appear here once payments are processed
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Reference</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="pr-4">Date</TableHead>
                        <TableHead className="pr-4 w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="pl-4 font-medium font-mono text-xs">
                            {tx.accountReference || tx.receiptNumber || tx.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tx.provider === "MPESA" ? "M-Pesa" : tx.provider}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tx.paymentStatus === "SUCCESS"
                                  ? "outline"
                                  : tx.paymentStatus === "PROCESSING"
                                  ? "secondary"
                                  : tx.paymentStatus === "FAILED" || tx.paymentStatus === "CANCELLED"
                                  ? "destructive"
                                  : "outline"
                              }
                              className={
                                tx.paymentStatus === "SUCCESS"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                                  : ""
                              }
                            >
                              {tx.paymentStatus === "PARTIALLY_REFUNDED"
                                ? "Partially Refunded"
                                : tx.paymentStatus.charAt(0) + tx.paymentStatus.slice(1).toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tx.currency} {parseFloat(tx.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="pr-4 text-xs">
                            {tx.processedAt
                              ? format(new Date(tx.processedAt), "MMM d, yyyy")
                              : format(new Date(tx.initiatedAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="pr-4">
                            <Button variant="ghost" size="sm" className="h-8">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Request Logs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Request Logs</CardTitle>
                    <CardDescription className="text-xs">Detailed API request and response logs</CardDescription>
                  </div>
                  {requestLogs?.logs && requestLogs.logs.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {requestLogs.logs.length} logs
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!requestLogs?.logs || requestLogs.logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center min-h-[200px] rounded-xl bg-muted/30 border-2 border-dashed border-border">
                    <div className="rounded-full bg-muted/80 dark:bg-muted/60 p-4 mb-4 ring-4 ring-muted/40 dark:ring-muted/30">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold">No request logs yet</p>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">
                      Request logs will appear once API calls are made
                    </p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[400px] rounded-md border border-border">
                      <div className="divide-y divide-border text-sm p-1">
                        {requestLogs.logs.map((log) => (
                          <div key={log.id} className="py-2.5 px-2">
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              className="w-full"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {expandedLogId === log.id ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {getHttpMethodBadge(log.method)}
                                  <code className="text-xs">{log.endpoint}</code>
                                </div>
                                <Badge
                                  variant={log.success ? "outline" : "destructive"}
                                  className={
                                    log.success
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : ""
                                  }
                                >
                                  {log.statusCode}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                                <span>{format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}</span>
                                <span>{log.durationMs}ms</span>
                              </div>
                            </button>

                            {/* Expanded Terminal-like Details */}
                            {expandedLogId === log.id && (
                              <div className="mt-3 rounded-md bg-slate-950 dark:bg-slate-900 p-4 font-mono text-xs text-green-400 overflow-auto max-h-[300px]">
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-blue-400">$</span> <span className="text-yellow-300">{log.method}</span> <span className="text-white">{log.endpoint}</span>
                                  </div>
                                  <div className="text-gray-400">
                                    IP: <span className="text-green-300">{log.ipAddress || "N/A"}</span>
                                  </div>
                                  <div className="text-gray-400">
                                    Duration: <span className="text-cyan-300">{log.durationMs}ms</span>
                                  </div>
                                  <div className="text-gray-400">
                                    Status: <span className={log.success ? "text-green-300" : "text-red-300"}>{log.statusCode}</span>
                                  </div>
                                  <div className="text-gray-400">
                                    Timestamp: <span className="text-purple-300">{format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}</span>
                                  </div>
                                  {log.success ? (
                                    <div className="text-green-300 mt-2">✓ Request completed successfully</div>
                                  ) : (
                                    <div className="text-red-300 mt-2">✗ Request failed</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Pagination */}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Page {logsCurrentPageLabel}
                      </p>
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(logsPageSize)}
                          onValueChange={(v) => {
                            setLogsPageSize(Number(v) as 10 | 30 | 50 | 100);
                            setLogsPage(0);
                          }}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogsPage((p) => Math.max(0, p - 1))}
                          disabled={!hasLogsPrevPage}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogsPage((p) => p + 1)}
                          disabled={!hasLogsNextPage}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Access Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Access Analytics</CardTitle>
                <CardDescription className="text-xs">Request trends and usage metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {accessStats ? (
                  <div className="space-y-4">
                    {/* Area Chart with Multiple Metrics */}
                    <ChartContainer
                      config={{
                        totalRequests: {
                          label: "Total Requests",
                          color: "#8b5cf6",
                        },
                        successfulRequests: {
                          label: "Successful",
                          color: "#10b981",
                        },
                        failedRequests: {
                          label: "Failed",
                          color: "#ef4444",
                        },
                        rateLimitHits: {
                          label: "Rate Limit Hits",
                          color: "#f59e0b",
                        },
                      } satisfies ChartConfig}
                      className="h-[240px] w-full"
                    >
                      <AreaChart
                        data={[
                          {
                            date: "Week 1",
                            totalRequests: Math.floor(accessStats.stats.totalRequests * 0.2),
                            successfulRequests: Math.floor(accessStats.stats.successfulRequests * 0.2),
                            failedRequests: Math.floor(accessStats.stats.failedRequests * 0.2),
                            rateLimitHits: Math.floor(accessStats.stats.rateLimitHits * 0.2),
                          },
                          {
                            date: "Week 2",
                            totalRequests: Math.floor(accessStats.stats.totalRequests * 0.35),
                            successfulRequests: Math.floor(accessStats.stats.successfulRequests * 0.35),
                            failedRequests: Math.floor(accessStats.stats.failedRequests * 0.35),
                            rateLimitHits: Math.floor(accessStats.stats.rateLimitHits * 0.35),
                          },
                          {
                            date: "Week 3",
                            totalRequests: Math.floor(accessStats.stats.totalRequests * 0.25),
                            successfulRequests: Math.floor(accessStats.stats.successfulRequests * 0.25),
                            failedRequests: Math.floor(accessStats.stats.failedRequests * 0.25),
                            rateLimitHits: Math.floor(accessStats.stats.rateLimitHits * 0.25),
                          },
                          {
                            date: "Week 4",
                            totalRequests: Math.floor(accessStats.stats.totalRequests * 0.2),
                            successfulRequests: Math.floor(accessStats.stats.successfulRequests * 0.2),
                            failedRequests: Math.floor(accessStats.stats.failedRequests * 0.2),
                            rateLimitHits: Math.floor(accessStats.stats.rateLimitHits * 0.2),
                          },
                        ]}
                      >
                        <defs>
                          <linearGradient id="fillTotalRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="fillSuccessfulRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="fillFailedRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="fillRateLimitHits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                          dataKey="totalRequests"
                          type="natural"
                          fill="url(#fillTotalRequests)"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                        />
                        <Area
                          dataKey="successfulRequests"
                          type="natural"
                          fill="url(#fillSuccessfulRequests)"
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                        <Area
                          dataKey="failedRequests"
                          type="natural"
                          fill="url(#fillFailedRequests)"
                          stroke="#ef4444"
                          strokeWidth={2}
                        />
                        <Area
                          dataKey="rateLimitHits"
                          type="natural"
                          fill="url(#fillRateLimitHits)"
                          stroke="#f59e0b"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>

                    {/* Total Metrics at Bottom */}
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                          <span className="text-xs font-medium">Total Requests</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{accessStats.stats.totalRequests.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                          <span className="text-xs font-medium">Successful</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {accessStats.stats.successfulRequests.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
                          <span className="text-xs font-medium">Failed</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {accessStats.stats.failedRequests.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                          <span className="text-xs font-medium">Rate Limit Hits</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {accessStats.stats.rateLimitHits.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Stats for {format(new Date(accessStats.year, accessStats.month - 1), "MMMM yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center min-h-[200px] rounded-xl bg-muted/30 border-2 border-dashed border-border">
                    <div className="rounded-full bg-muted/80 dark:bg-muted/60 p-4 mb-4 ring-4 ring-muted/40 dark:ring-muted/30">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold">No access logs yet</p>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">
                      Access analytics will be available after API usage
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Simulator Tab */}
        <TabsContent value="simulator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payment Simulator</CardTitle>
              <CardDescription className="text-xs">
                Test your payment integration in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimulatorForm merchantId={merchantId!} apiKeys={apiKeys?.apiKeys || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Credentials Sheet */}
      <AddCredentialsSheet
        open={addCredentialsOpen}
        onOpenChange={setAddCredentialsOpen}
        merchantId={merchantId!}
        onSuccess={() => {
          setAddCredentialsOpen(false);
          refetchCredentials();
        }}
      />

        {/* Generate API Key Sheet */}
        <GenerateApiKeySheet
          open={generateApiKeyOpen}
          onOpenChange={setGenerateApiKeyOpen}
          merchantId={merchantId!}
          onSuccess={() => {
            setGenerateApiKeyOpen(false);
            refetchApiKeys();
          }}
        />

        {/* View Credentials Sheet */}
        {selectedCredential && (
          <ViewCredentialsSheet
            open={viewCredentialsOpen}
            onOpenChange={setViewCredentialsOpen}
            credentialId={selectedCredential.id}
          />
        )}

        {/* Update Credentials Sheet */}
        {selectedCredential && (
          <UpdateCredentialsSheet
            open={updateCredentialsOpen}
            onOpenChange={setUpdateCredentialsOpen}
            credentialId={selectedCredential.id}
            onSuccess={() => {
              setUpdateCredentialsOpen(false);
              refetchCredentials();
            }}
          />
        )}

        {/* Deactivate Credentials Dialog */}
        {selectedCredential && (
          <DeactivateCredentialsDialog
            open={deactivateCredentialsOpen}
            onOpenChange={setDeactivateCredentialsOpen}
            credentialId={selectedCredential.id}
            provider={selectedCredential.provider}
            environment={selectedCredential.environment}
            onSuccess={() => {
              setDeactivateCredentialsOpen(false);
              refetchCredentials();
            }}
          />
        )}

        {/* View API Key Sheet */}
        {selectedApiKey && (
          <ViewApiKeySheet
            open={viewApiKeyOpen}
            onOpenChange={setViewApiKeyOpen}
            apiKeyId={selectedApiKey.id}
          />
        )}

        {/* Revoke API Key Dialog */}
        {selectedApiKey && (
          <RevokeApiKeyDialog
            open={revokeApiKeyOpen}
            onOpenChange={setRevokeApiKeyOpen}
            apiKeyId={selectedApiKey.id}
            keyName={selectedApiKey.name}
            keyPrefix={selectedApiKey.keyPrefix}
            onSuccess={() => {
              setRevokeApiKeyOpen(false);
              refetchApiKeys();
            }}
          />
        )}
      </div>
    </div>
  );
}
