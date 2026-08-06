"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Eye, EyeOff, Info, CheckCircle2, XCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";

const formSchema = z.object({
  environment: z.enum(["SANDBOX", "PRODUCTION"]),
  consumerKey: z.string().min(1, "Consumer key is required"),
  consumerSecret: z.string().min(1, "Consumer secret is required"),
  shortCode: z.string().min(1, "Short code is required"),
  passkey: z.string().min(1, "Passkey is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface UpdateCredentialsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId: string;
  onSuccess?: () => void;
}

export function UpdateCredentialsSheet({
  open,
  onOpenChange,
  credentialId,
  onSuccess,
}: UpdateCredentialsSheetProps) {
  const [showConsumerKey, setShowConsumerKey] = React.useState(false);
  const [showConsumerSecret, setShowConsumerSecret] = React.useState(false);
  const [showPasskey, setShowPasskey] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { data: credData } = trpc.niscPaymentGateway.credentials.getDecrypted.useQuery(
    { id: credentialId },
    { enabled: open && !!credentialId }
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      environment: "SANDBOX",
      consumerKey: "",
      consumerSecret: "",
      shortCode: "",
      passkey: "",
    },
  });

  // Populate form when data loads
  React.useEffect(() => {
    if (credData?.credentials) {
      form.reset({
        environment: credData.environment as "SANDBOX" | "PRODUCTION",
        consumerKey: credData.credentials.consumerKey || "",
        consumerSecret: credData.credentials.consumerSecret || "",
        shortCode: credData.credentials.shortCode || "",
        passkey: credData.credentials.passkey || "",
      });
    }
  }, [credData, form]);

  const updateMutation = trpc.niscPaymentGateway.credentials.update.useMutation({
    onSuccess: () => {
      toast.success("Credentials updated successfully");
      captureEvent("payment_gateway_credentials_updated");
      setTestResult(null);
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update credentials");
    },
  });

  const testMutation = trpc.niscPaymentGateway.credentials.test.useMutation({
    onSuccess: (data) => {
      setTestResult(data);
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      setTestResult({
        success: false,
        message: error.message || "Failed to test credentials",
      });
      toast.error(error.message || "Failed to test credentials");
    },
  });

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate({
      id: credentialId,
      environment: data.environment,
      credentials: {
        consumerKey: data.consumerKey,
        consumerSecret: data.consumerSecret,
        shortCode: data.shortCode,
        passkey: data.passkey,
      },
    });
  };

  const handleTest = () => {
    const data = form.getValues();
    if (!credData) return;
    
    testMutation.mutate({
      provider: credData.provider as "MPESA",
      environment: data.environment,
      credentials: {
        consumerKey: data.consumerKey,
        consumerSecret: data.consumerSecret,
        shortCode: data.shortCode,
        passkey: data.passkey,
      },
    });
  };

  const watchEnvironment = form.watch("environment");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>Update Credentials</SheetTitle>
          <SheetDescription>
            Update payment provider credentials
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              {/* Provider Info */}
              {credData && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Provider:</span>
                  <Badge>{credData.provider}</Badge>
                </div>
              )}

              {/* Environment Selection */}
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
                        <SelectItem value="SANDBOX">
                          Test (Sandbox)
                        </SelectItem>
                        <SelectItem value="PRODUCTION">
                          Live (Production)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose Test for development, Live for real payments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Environment Info Alert */}
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  {watchEnvironment === "SANDBOX" ? (
                    <>
                      <strong>Sandbox Environment:</strong> Test credentials for development. No real
                      money will be processed.
                    </>
                  ) : (
                    <>
                      <strong>Production Environment:</strong> Live credentials for real transactions.
                      Real money will be processed.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {/* M-Pesa Credentials */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">M-Pesa API Credentials</h3>

                <FormField
                  control={form.control}
                  name="consumerKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumer Key *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="cAAxRGh4R9EuGHW5AGYRAJNv..."
                            type={showConsumerKey ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowConsumerKey(!showConsumerKey)}
                        >
                          {showConsumerKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormDescription>
                        Your M-Pesa API consumer key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consumerSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumer Secret *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="fl3kYPG2xifadNYngclNCNs..."
                            type={showConsumerSecret ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowConsumerSecret(!showConsumerSecret)}
                        >
                          {showConsumerSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormDescription>
                        Your M-Pesa API consumer secret
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Short Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="174379" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your paybill or till number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passkey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lipa Na M-Pesa Passkey *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="bfb279f9aa9bdbcf158e97dd..."
                            type={showPasskey ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPasskey(!showPasskey)}
                        >
                          {showPasskey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormDescription>
                        Your Lipa Na M-Pesa Online passkey
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Security Notice */}
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <Info className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-xs text-red-800 dark:text-red-200">
                  <strong>Your credentials are secure:</strong> All sensitive information is encrypted and stored securely. Only you can access your credentials.
                </AlertDescription>
              </Alert>

              {/* Test Result */}
              {testResult && (
                <Alert
                  className={
                    testResult.success
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                      : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
                  }
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  )}
                  <AlertDescription
                    className={
                      testResult.success
                        ? "text-green-800 dark:text-green-200"
                        : "text-orange-800 dark:text-orange-200"
                    }
                  >
                    <strong>{testResult.success ? "Test Passed:" : "Test Failed:"}</strong>{" "}
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={updateMutation.isPending || testMutation.isPending}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleTest}
            disabled={testMutation.isPending || updateMutation.isPending}
          >
            {testMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Test Credentials
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateMutation.isPending || testMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Credentials
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
