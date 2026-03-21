"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
}

export function QrCodeDialog({ open, onOpenChange, domain }: QrCodeDialogProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const domainUrl = `https://${domain}`;

  React.useEffect(() => {
    if (open && domain) {
      generateQrCode();
    } else {
      setQrCodeDataUrl(null);
      setCopied(false);
    }
  }, [open, domain]);

  const generateQrCode = async () => {
    setIsGenerating(true);
    try {
      // Dynamically import qrcode library
      const QRCodeUtil = await import("qrcode");
      const dataUrl = await QRCodeUtil.toDataURL(domainUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      toast.error("Failed to generate QR code", {
        description: "Please try again later.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(domainUrl);
      setCopied(true);
      toast.success("Domain URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeDataUrl;
    link.download = `${domain}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {domain}</DialogTitle>
          <DialogDescription>
            Scan this QR code to visit {domain}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-[300px] w-[300px]" />
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          ) : qrCodeDataUrl ? (
            <>
              <div className="border rounded-lg p-4 bg-background">
                <img 
                  src={qrCodeDataUrl} 
                  alt={`QR code for ${domain}`}
                  className="w-[300px] h-[300px]"
                />
              </div>
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 p-2 border rounded-md bg-muted/50">
                  <p className="text-sm font-mono truncate">{domainUrl}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
