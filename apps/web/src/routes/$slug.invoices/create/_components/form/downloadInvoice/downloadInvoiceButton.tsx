"use client";

import { Button } from "@/components/ui/button";
import { Document, Font, Page } from "@react-pdf/renderer";
import { CheckCircle2, Send, LoaderIcon } from "lucide-react";
import { PdfDetails } from "../pdfDetails";
import { useData } from "../../../hooks/useData";
import { pdfContainers } from "@/lib/pdfStyles";
import { pdf } from "@react-pdf/renderer";
import { useEffect, useState } from "react";
import QRCodeUtil from "qrcode";
import { trpc } from "@/utils/trpc";
import { useFormContext } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { useNavigate, useLocation } from "react-router";

// Font registration state
let fontsRegistered = false;
let fontsRegistering = false;

// Register fonts once when module loads
const registerFonts = async (): Promise<boolean> => {
  if (fontsRegistered) return true;
  if (fontsRegistering) {
    // Wait for ongoing registration
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (fontsRegistered) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
    });
  }

  fontsRegistering = true;
  
  try {
    const fontWeights = [
      { name: "Geist-Thin.ttf", weight: "thin" },
      { name: "Geist-UltraLight.ttf", weight: "ultralight" },
      { name: "Geist-Light.ttf", weight: "light" },
      { name: "Geist-Regular.ttf", weight: "normal" },
      { name: "Geist-Medium.ttf", weight: "medium" },
      { name: "Geist-SemiBold.ttf", weight: "semibold" },
      { name: "Geist-Bold.ttf", weight: "bold" },
      { name: "Geist-UltraBlack.ttf", weight: "ultrabold" },
    ];

    const fonts = await Promise.all(
      fontWeights.map(async ({ name, weight }) => {
        try {
          const response = await fetch(`/font/${name}`);
          if (!response.ok) {
            console.warn(`Font ${name} not found, skipping...`);
            return null;
          }
          const fontData = await response.arrayBuffer();
          // Convert ArrayBuffer to base64 data URI
          const base64 = btoa(
            new Uint8Array(fontData).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          return {
            src: `data:font/truetype;base64,${base64}`,
            fontWeight: weight as "thin" | "ultralight" | "light" | "normal" | "medium" | "semibold" | "bold" | "ultrabold",
          };
        } catch (error) {
          console.warn(`Failed to load font ${name}:`, error);
          return null;
        }
      })
    );

    const validFonts = fonts.filter((font) => font !== null);
    
    if (validFonts.length > 0) {
      Font.register({
        family: "Geist",
        fonts: validFonts,
      });
      fontsRegistered = true;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to register fonts:", error);
    return false;
  } finally {
    fontsRegistering = false;
  }
};

// Register fonts on module load
registerFonts();

export const DownloadInvoiceButton = () => {
  const [status, setStatus] = useState<
    "submitted" | "submitting" | "not-submitted"
  >("not-submitted");
  const form = useFormContext();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const {
    companyDetails,
    invoiceDetails,
    invoiceTerms,
    paymentDetails,
    yourDetails,
  } = useData();

  const submitInvoiceMutation = trpc.invoicing.submitInvoice.useMutation({
    onSuccess: (data) => {
      setStatus("submitted");
      
      // Invalidate the invoice number cache to ensure fresh data on next create
      // This ensures when user navigates to create a new invoice, they get the latest number
      utils.invoicing.getNextInvoiceNumber.invalidate();
      
      toast.success("Invoice saved successfully", {
        description: "You can review and send it to the customer from the invoice details page when ready.",
      });
      // Redirect to invoices list after a short delay (customer: /{slug}/invoices, agency: /agency/invoices)
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";
      const slug = pathname.split("/")[1];
      const invoicesPath = slug && slug !== "agency" ? `/${slug}/invoices` : "/agency/invoices";
      setTimeout(() => {
        navigate(invoicesPath);
      }, 1500);
    },
    onError: (error) => {
      setStatus("not-submitted");
      toast.error("Failed to submit invoice", {
        description: error.message || "An error occurred while submitting the invoice",
      });
    },
  });

  const handleSubmitInvoice = async () => {
    try {
      setStatus("submitting");

      // Validate billing email
      if (!companyDetails.email) {
        toast.error("Billing email is required", {
          description: "Please provide a billing email address in the company details step.",
        });
        setStatus("not-submitted");
        return;
      }

      // Ensure fonts are registered before generating PDF
      await registerFonts();
      
      // Generate QR code data URL if qrCodeValue exists
      let qrCodeDataUrl: string | undefined;
      if (paymentDetails.qrCodeValue) {
        try {
          qrCodeDataUrl = await QRCodeUtil.toDataURL(paymentDetails.qrCodeValue, {
            width: 120,
            margin: 1,
          });
        } catch (error) {
          console.error("Failed to generate QR code:", error);
        }
      }

      // Generate PDF
      const blob = await pdf(
        <Document>
          <Page size="A4" style={pdfContainers.page}>
            <PdfDetails
              companyDetails={companyDetails}
              invoiceDetails={invoiceDetails}
              invoiceTerms={invoiceTerms}
              paymentDetails={{
                ...paymentDetails,
                qrCodeDataUrl,
              }}
              yourDetails={yourDetails}
            />
          </Page>
        </Document>
      ).toBlob();

      // Convert PDF blob to base64
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Calculate totals
      const items = invoiceDetails.items || [];
      const subtotal = items.reduce((sum, item) => {
        const amount = item.amount || 0;
        const qty = item.qty || 1;
        return sum + (amount * qty);
      }, 0);

      const discountValue = parseFloat(invoiceDetails.discount || "0");
      const taxPercentage = invoiceDetails.taxPercentage || 0;
      const taxAmount = (subtotal - discountValue) * (taxPercentage / 100);
      const totalAmount = roundTotalIfExceeds(subtotal - discountValue + taxAmount);

      // Map line items (tax and vat removed - tax is applied at invoice level)
      const lineItems = items.map((item, index) => ({
        position: index,
        name: item.itemDescription || "Service",
        description: null,
        quantity: item.qty || 1,
        unit: null,
        price: String(item.amount || 0),
        discount: null,
        total: String((item.amount || 0) * (item.qty || 1)),
        metadata: null,
      }));

      // Prepare payment details JSON
      const paymentDetailsJson: Record<string, unknown> = {
        paymentMethod: paymentDetails.paymentMethod,
        currency: paymentDetails.currency,
      };

      if (paymentDetails.paymentMethod === "bank") {
        paymentDetailsJson.bankName = paymentDetails.bankName;
        paymentDetailsJson.accountNumber = paymentDetails.accountNumber;
        paymentDetailsJson.accountName = paymentDetails.accountName;
        paymentDetailsJson.branchName = paymentDetails.branchName;
        paymentDetailsJson.branchCode = paymentDetails.branchCode;
        paymentDetailsJson.swiftCode = paymentDetails.swiftCode;
      } else if (paymentDetails.paymentMethod === "mpesa") {
        paymentDetailsJson.mpesaPaybillNumber = paymentDetails.mpesaPaybillNumber;
        paymentDetailsJson.mpesaAccountNumber = paymentDetails.mpesaAccountNumber;
        paymentDetailsJson.mpesaInstructions = paymentDetails.mpesaInstructions;
      } else if (paymentDetails.paymentMethod === "cheque") {
        paymentDetailsJson.chequeDeliveryAddress = paymentDetails.chequeDeliveryAddress;
        paymentDetailsJson.chequeInstructions = paymentDetails.chequeInstructions;
      }

      if (paymentDetails.qrCodeValue) {
        paymentDetailsJson.qrCodeValue = paymentDetails.qrCodeValue;
      }

      // Prepare from details (your details)
      const fromDetails = {
        name: yourDetails.yourName,
        email: yourDetails.yourEmail,
        address: yourDetails.yourAddress,
        city: yourDetails.yourCity,
        state: yourDetails.yourState,
        country: yourDetails.yourCountry,
        zip: yourDetails.yourZip,
        taxId: yourDetails.yourTaxId,
      };

      // Prepare customer details (company details)
      const customerDetails = {
        name: companyDetails.companyName,
        email: companyDetails.email,
        address: companyDetails.companyAddress,
        city: companyDetails.companyCity,
        state: companyDetails.companyState,
        country: companyDetails.companyCountry,
        zip: companyDetails.companyZip,
        taxId: companyDetails.companyTaxId,
      };

      // Submit invoice
      await submitInvoiceMutation.mutateAsync({
        invoiceNumber: invoiceTerms.invoiceNumber || undefined,
        customerName: companyDetails.companyName || undefined,
        customerEmail: companyDetails.email,
        issueDate: invoiceTerms.issueDate ? new Date(invoiceTerms.issueDate).toISOString() : undefined,
        dueDate: invoiceTerms.dueDate ? new Date(invoiceTerms.dueDate).toISOString() : undefined,
        amount: String(totalAmount),
        subtotal: String(subtotal),
        discount: invoiceDetails.discount || undefined,
        tax: String(taxAmount),
        taxPercentage: invoiceDetails.taxPercentage || undefined,
        currency: invoiceDetails.currency || "KES",
        note: invoiceDetails.note || undefined,
        lineItems,
        fromDetails: fromDetails as any,
        customerDetails: customerDetails as any,
        paymentDetails: paymentDetailsJson as any,
        pdfBase64,
        billingEmail: companyDetails.email,
      });
    } catch (e) {
      console.error(e);
      setStatus("not-submitted");
    }
  };

  return (
    <div className="flex h-[calc(100vh-208px)] justify-center items-center">
      <div>
        <h1 className="text-5xl font-semibold pb-6">Your invoice is ready</h1>
        <p className="text-neutral-500 text-xl pb-7">
          Review the details carefully before submitting. The invoice will be saved to the database. You can send it to the customer from the invoice details page when you&apos;re ready.
        </p>
        <Button
          disabled={status === "submitting" || status === "submitted"}
          onClick={handleSubmitInvoice}
          type="button"
          className="w-full h-12 rounded-lg text-lg"
        >
          {status === "not-submitted" && (
            <>
              <Send className="mr-2 h-6 w-6" /> Submit Invoice
            </>
          )}
          {status === "submitting" && (
            <>
              <LoaderIcon className="mr-2 h-6 w-6 animate-spin" />{" "}
              Submitting...
            </>
          )}
          {status === "submitted" && (
            <>
              <CheckCircle2 className="mr-2 h-6 w-6" /> Invoice Submitted
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

/**
 * Rounds the total amount to 2 decimal places only if it exceeds 2 decimal places
 */
const roundTotalIfExceeds = (amount: number): number => {
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return Math.round(amount * 100) / 100;
  }
  return amount;
};
