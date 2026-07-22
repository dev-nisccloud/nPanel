"use client";

import * as React from "react";
import { Loader2, Eye, EyeOff, Copy, CheckCircle2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";

interface ViewCredentialsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId: string;
}

export function ViewCredentialsSheet({
  open,
  onOpenChange,
  credentialId,
}: ViewCredentialsSheetProps) {
  const [showValues, setShowValues] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const { data, isLoading } = trpc.niscPaymentGateway.credentials.getDecrypted.useQuery(
    { id: credentialId },
    { enabled: open && !!credentialId }
  );

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>View Credentials</SheetTitle>
          <SheetDescription>
            Decrypted payment provider credentials
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <div className="space-y-6 mt-6">
              {/* Provider Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Provider:</span>
                  <Badge>{data.provider}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Environment:</span>
                  <Badge variant={data.environment === "PRODUCTION" ? "default" : "secondary"}>
                    {data.environment}
                  </Badge>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Credentials</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowValues(!showValues)}
                  >
                    {showValues ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide Values
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Show Values
                      </>
                    )}
                  </Button>
                </div>

                {Object.entries(data.credentials).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showValues ? "text" : "password"}
                          value={value as string}
                          readOnly
                          className="w-full px-3 py-2 border rounded-md bg-muted text-sm font-mono"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(key, value as string)}
                      >
                        {copiedField === key ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Failed to load credentials</p>
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
