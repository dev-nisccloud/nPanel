import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Smartphone, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

interface SimulatorFormProps {
  merchantId: string;
  apiKeys: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    environment: string;
    isActive: boolean;
  }>;
}

type PaymentStatus = "idle" | "initiating" | "pending" | "success" | "failed" | "cancelled" | "timeout";

interface PaymentTest {
  id: string;
  phoneNumber: string;
  amount: string;
  reference: string;
  status: PaymentStatus;
  message: string;
  timestamp: Date;
  checkoutRequestId?: string;
  transactionId?: string;
  duration?: number;
}

export function SimulatorForm({ merchantId, apiKeys }: SimulatorFormProps) {
  const [fullApiKey, setFullApiKey] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [currentTest, setCurrentTest] = React.useState<PaymentTest | null>(null);
  const [testHistory, setTestHistory] = React.useState<PaymentTest[]>([]);
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const pollingQuickRetryRef = React.useRef<NodeJS.Timeout | null>(null);
  const terminalStateDetectedRef = React.useRef(false);

  const utils = trpc.useUtils();

  const selectedApiKey = React.useMemo(
    () => apiKeys.find((key) => key.isActive),
    [apiKeys]
  );

  const activeApiKeys = React.useMemo(
    () => apiKeys.filter((key) => key.isActive),
    [apiKeys]
  );

  // Constants from working implementation
  const POLL_INTERVAL_MS = 1000; // 1 second
  const POLL_MAX_ATTEMPTS = 90; // 90 seconds total
  const PROCESSING_CODES = new Set([1037, 4999]);

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (pollingQuickRetryRef.current) {
        clearTimeout(pollingQuickRetryRef.current);
      }
    };
  }, []);

  // Helper to format phone number to 254xxxxxxxxx format
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");
    
    // Handle different formats:
    // 0712345678 -> 254712345678
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      cleaned = "254" + cleaned.substring(1);
    }
    // 712345678 -> 254712345678
    else if (cleaned.length === 9 && !cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }
    // +254712345678 or 254712345678 -> 254712345678
    else if (cleaned.startsWith("254") && cleaned.length === 12) {
      // Already in correct format
    }
    // Invalid format - return as is
    
    return cleaned;
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case "initiating":
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "timeout":
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      idle: { variant: "outline", label: "Idle" },
      initiating: { variant: "secondary", label: "Initiating..." },
      pending: { variant: "secondary", label: "Pending" },
      success: { variant: "default", label: "Success" },
      failed: { variant: "destructive", label: "Failed" },
      cancelled: { variant: "outline", label: "Cancelled" },
      timeout: { variant: "outline", label: "Timeout" },
    };

    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const pollPaymentStatus = React.useCallback(
    async (transactionId: string, testId: string, startTime: number) => {
      terminalStateDetectedRef.current = false;

      const stopPolling = () => {
        if (pollingQuickRetryRef.current) {
          clearTimeout(pollingQuickRetryRef.current);
          pollingQuickRetryRef.current = null;
        }
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsProcessing(false);
      };

      const poll = async (): Promise<boolean> => {
        if (terminalStateDetectedRef.current) {
          return true;
        }

        const elapsed = Date.now() - startTime;

        try {
          // Use tRPC for instant internal access (same as global payment dialog)
          const data = await utils.niscPaymentGateway.transactions.getById.fetch(
            { id: transactionId },
            { staleTime: 0, gcTime: 0 }
          );

          if (!data || !data.transaction) {
            return false;
          }

          const status = data.transaction.status?.toUpperCase();
          
          if (!status) return false;

          // Check if still processing
          if (status === "PENDING" || status === "PROCESSING") {
            setCurrentTest((prev) =>
              prev
                ? {
                    ...prev,
                    message: `Waiting for user action (${Math.floor(elapsed / 1000)}s)`,
                    duration: elapsed,
                  }
                : null
            );
            return false;
          }

          // Terminal state reached
          terminalStateDetectedRef.current = true;

          let finalStatus: PaymentStatus;
          let message: string;

          if (status === "SUCCESS") {
            finalStatus = "success";
            message = "Payment completed successfully!";
            toast.success(message);
          } else if (status === "CANCELLED") {
            finalStatus = "cancelled";
            message = "Payment cancelled by user";
            toast.warning(message);
          } else {
            finalStatus = "failed";
            message = data.transaction.message || "Payment failed";
            toast.error(message);
          }

          setCurrentTest((prev) =>
            prev ? { ...prev, status: finalStatus, message, duration: elapsed } : null
          );

          setTestHistory((prev) =>
            prev.map((test) =>
              test.id === testId ? { ...test, status: finalStatus, message, duration: elapsed } : test
            )
          );

          return true;
        } catch (error) {
          // Handle terminal errors
          const message = error instanceof Error ? error.message : String(error);
          const isAuthError =
            message.includes("UNAUTHORIZED") ||
            message.includes("Authentication") ||
            message.includes("session");

          if (isAuthError) {
            terminalStateDetectedRef.current = true;
            const authMsg = "Authentication failed. Please sign in again.";
            setCurrentTest((prev) =>
              prev ? { ...prev, status: "failed", message: authMsg, duration: elapsed } : null
            );
            setTestHistory((prev) =>
              prev.map((test) =>
                test.id === testId ? { ...test, status: "failed", message: authMsg, duration: elapsed } : test
              )
            );
            toast.error(authMsg);
            return true;
          }

          // Non-terminal error - continue polling
          return false;
        }
      };

      // Poll immediately, then once at 1s, then every 1s (exact pattern from working implementation)
      const finished = await poll();
      if (finished) {
        stopPolling();
        return;
      }

      let attempts = 1;
      pollingQuickRetryRef.current = setTimeout(async () => {
        pollingQuickRetryRef.current = null;
        if (terminalStateDetectedRef.current) return;

        attempts += 1;
        const done = await poll();
        if (done) {
          stopPolling();
          return;
        }

        const id = setInterval(async () => {
          if (terminalStateDetectedRef.current) return;

          attempts += 1;
          const finishedAgain = await poll();

          if (finishedAgain || attempts >= POLL_MAX_ATTEMPTS) {
            stopPolling();
            if (!finishedAgain && attempts >= POLL_MAX_ATTEMPTS) {
              const elapsed = Date.now() - startTime;
              const msg = "Payment is taking longer than expected. Please check your M-Pesa or try again.";
              terminalStateDetectedRef.current = true;

              setCurrentTest((prev) =>
                prev ? { ...prev, status: "timeout", message: msg, duration: elapsed } : null
              );

              setTestHistory((prev) =>
                prev.map((test) =>
                  test.id === testId ? { ...test, status: "timeout", message: msg, duration: elapsed } : test
                )
              );

              toast.error(msg);
            }
          }
        }, POLL_INTERVAL_MS);

        pollingIntervalRef.current = id;
      }, 1000);
    },
    [utils, POLL_INTERVAL_MS, POLL_MAX_ATTEMPTS]
  );

  const handleSendSTK = async () => {
    if (!fullApiKey || !fullApiKey.trim()) {
      toast.error("Please enter the full API key");
      return;
    }

    if (!phoneNumber || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Format phone number to required format
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Validate formatted phone number
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(formattedPhone)) {
      toast.error("Invalid phone number. Please enter a valid Kenyan mobile number (e.g., 0712345678, 712345678, or 254712345678)");
      return;
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }

    setIsProcessing(true);
    const testId = `test_${Date.now()}`;
    const startTime = Date.now();

    const newTest: PaymentTest = {
      id: testId,
      phoneNumber: formattedPhone,
      amount,
      reference,
      status: "initiating",
      message: "Sending STK push...",
      timestamp: new Date(),
    };

    setCurrentTest(newTest);
    setTestHistory((prev) => [newTest, ...prev.slice(0, 9)]); // Keep last 10 tests

    try {
      const payload: any = {
        phoneNumber: formattedPhone,
        amount: parseFloat(amount),
        currency: "KES",
      };

      if (reference && reference.trim()) {
        payload.referenceId = reference;
      }

      if (description && description.trim()) {
        payload.description = description;
      }

      payload.metadata = {
        test: true,
        simulator: true,
      };

      const response = await fetch(`/api/nisc-gateway/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fullApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Response is not JSON
        const text = await response.text();
        throw new Error(`Invalid response from server: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || "Failed to initiate payment");
      }

      const transactionId = data.id; // Server returns id at top level

      if (!transactionId) {
        throw new Error("No transaction ID returned from server");
      }

      const updatedTest = {
        ...newTest,
        status: "pending" as PaymentStatus,
        message: "STK push sent! Check your phone to complete payment",
        checkoutRequestId: data.checkoutRequestId,
        transactionId,
      };

      setCurrentTest(updatedTest);
      setTestHistory((prev) =>
        prev.map((test) => (test.id === testId ? updatedTest : test))
      );

      toast.success("STK push sent to your phone!");

      // Start polling with exact same pattern as working implementation
      pollPaymentStatus(transactionId, testId, startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send STK push";

      const failedTest = {
        ...newTest,
        status: "failed" as PaymentStatus,
        message: errorMessage,
        duration: Date.now() - startTime,
      };

      setCurrentTest(failedTest);
      setTestHistory((prev) =>
        prev.map((test) => (test.id === testId ? failedTest : test))
      );

      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full-api-key" className="text-xs font-medium">
            API Key <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full-api-key"
            type="password"
            placeholder="npg_live_xxx or npg_test_xxx"
            value={fullApiKey}
            onChange={(e) => setFullApiKey(e.target.value)}
            className="h-9 font-mono text-xs"
            disabled={isProcessing}
          />
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-xs text-orange-800 dark:text-orange-200">
              <strong>Security Note:</strong> The full API key is only shown once when generated. 
              Copy it from the "Generate API Key" sheet in the API Keys tab. Never share or commit this key.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-medium">
              Phone Number <span className="text-destructive">*</span>
            </Label>
          <Input
            id="phone"
            placeholder="0712345678, 712345678, or 254712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="h-9"
            disabled={isProcessing}
          />
          <p className="text-xs text-muted-foreground">Any Kenyan format accepted</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-medium">
              Amount (KES) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9"
              min={1}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">Minimum: KES 1</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reference" className="text-xs font-medium">
              Reference
            </Label>
            <Input
              id="reference"
              placeholder="REF123"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-9"
              maxLength={20}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-medium">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Payment description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9"
              maxLength={50}
              disabled={isProcessing}
            />
          </div>
        </div>

        <Button
          onClick={handleSendSTK}
          disabled={isProcessing || !fullApiKey}
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Smartphone className="mr-2 h-4 w-4" />
              Send STK Push
            </>
          )}
        </Button>
      </div>

      {/* Current Test Status */}
      {currentTest && (
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(currentTest.status)}
                    <h3 className="text-sm font-semibold">Current Test</h3>
                    {getStatusBadge(currentTest.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{currentTest.message}</p>
                </div>
                {currentTest.duration && (
                  <span className="text-xs text-muted-foreground">
                    {(currentTest.duration / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{currentTest.phoneNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-medium">KES {currentTest.amount}</p>
                </div>
                {currentTest.reference && (
                  <div>
                    <span className="text-muted-foreground">Reference:</span>
                    <p className="font-medium">{currentTest.reference}</p>
                  </div>
                )}
                {currentTest.transactionId && (
                  <div>
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <p className="font-mono text-xs">{currentTest.transactionId}</p>
                  </div>
                )}
              </div>

              {currentTest.status === "pending" && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Action Required:</strong> Check your phone and enter your M-Pesa PIN to complete the payment.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test History */}
      {testHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Test History</h3>
          <div className="space-y-2">
            {testHistory.map((test) => (
              <Card key={test.id} className="border">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(test.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{test.phoneNumber}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-medium">KES {test.amount}</span>
                          {getStatusBadge(test.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{test.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {test.timestamp.toLocaleTimeString()}
                      </p>
                      {test.duration && (
                        <p className="text-xs text-muted-foreground">
                          {(test.duration / 1000).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Testing Instructions:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Select an API key to use for testing</li>
            <li>Enter a valid M-Pesa registered phone number</li>
            <li>Click "Send STK Push" to initiate payment</li>
            <li>Check your phone for the M-Pesa prompt</li>
            <li>Enter your PIN to complete (or cancel to test failure)</li>
            <li>The status will update automatically in real-time</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
