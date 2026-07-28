"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Copy, Check, Eye, EyeOff, Info } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";

const formSchema = z.object({
  name: z.string().min(1, "Key name is required"),
  // Must match apiKeys.create: "test" | "live" (key format npg_test_ / npg_live_)
  environment: z.enum(["test", "live"]),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
  rateLimit: z.number().min(10).max(1000).default(100),
});

type FormValues = z.infer<typeof formSchema>;

const ALL_PERMISSIONS = [
  { id: "PAYMENT_CREATE", label: "Create payments", description: "Initiate payment requests" },
  { id: "PAYMENT_READ", label: "Read payments", description: "Query payment status" },
  { id: "PAYMENT_LIST", label: "List payments", description: "List merchant's payments" },
];

interface GenerateApiKeySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  onSuccess?: () => void;
}

export function GenerateApiKeySheet({
  open,
  onOpenChange,
  merchantId,
  onSuccess,
}: GenerateApiKeySheetProps) {
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null);
  const [showKey, setShowKey] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      environment: "test",
      permissions: ["PAYMENT_CREATE", "PAYMENT_READ", "PAYMENT_LIST"],
      rateLimit: 100,
    },
  });

  const generateMutation = trpc.niscPaymentGateway.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      toast.success("API key generated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate API key");
    },
  });

  const onSubmit = (data: FormValues) => {
    generateMutation.mutate({
      merchantId,
      name: data.name,
      environment: data.environment,
      permissions: data.permissions,
      rateLimit: data.rateLimit,
    });
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setGeneratedKey(null);
    form.reset();
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {generatedKey ? "API Key Generated" : "Generate API Key"}
          </SheetTitle>
          <SheetDescription>
            {generatedKey
              ? "Save this key securely - it won't be shown again"
              : "Create a new API key for external access"}
          </SheetDescription>
        </SheetHeader>

        {!generatedKey ? (
          <ScrollArea className="h-[calc(100vh-200px)] pr-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                {/* Key Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Production Website" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name to identify this key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Environment */}
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environment *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="test">Test (Sandbox)</SelectItem>
                          <SelectItem value="live">Live (Production)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose Test for sandbox credentials, Live for production
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Permissions */}
                <FormField
                  control={form.control}
                  name="permissions"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Permissions *</FormLabel>
                        <FormDescription>
                          Select which actions this API key can perform
                        </FormDescription>
                      </div>
                      <div className="space-y-3">
                        {ALL_PERMISSIONS.map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={permission.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(permission.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, permission.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== permission.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium cursor-pointer">
                                      {permission.label}
                                    </FormLabel>
                                    <FormDescription>
                                      {permission.description}
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rate Limit */}
                <FormField
                  control={form.control}
                  name="rateLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Limit (requests per minute)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={10}
                          max={1000}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum requests per minute (10-1000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)] pr-4">
            <div className="space-y-6 mt-6">
              {/* Generated Key Display */}
              <Alert className="border-primary">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Copy this API key now. For security reasons,
                  it won't be shown again. Store it securely.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your API Key</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={generatedKey}
                      readOnly
                      type={showKey ? "text" : "password"}
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">How to use this API key</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Include it in the Authorization header of your requests:
                  </p>
                  <code className="block bg-background p-3 rounded text-xs font-mono break-all">
                    Authorization: Bearer {generatedKey}
                  </code>
                </div>
              </div>

              {/* API Endpoint */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">API Endpoint</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <code className="block text-xs font-mono break-all">
                    POST {window.location.origin}/api/nisc-gateway/v1/payments
                  </code>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <SheetFooter className="mt-6">
          {!generatedKey ? (
            <>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={generateMutation.isPending}
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate API Key
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
