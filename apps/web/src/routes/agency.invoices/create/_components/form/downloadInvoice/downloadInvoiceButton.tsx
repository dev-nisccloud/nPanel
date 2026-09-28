"use client";

import { Button } from "@/components/ui/button";
import { Document, Font } from "@react-pdf/renderer";
import { useData } from "../../../hooks/useData";
import { pdf } from "@react-pdf/renderer";
import { useState } from "react";
import QRCodeUtil from "qrcode";
import { trpc } from "@/utils/trpc";
import { useFormContext } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router";
import { captureEvent } from "@/lib/posthog";
import { InvoiceStatusSelect, type InvoiceStatusOption } from "../invoice-status-select";
import { buildKraPersistFieldsFromManual } from "@npanel/api/lib/etims-fiscal-fields";
import { AgencyInvoicePdfPage } from "@npanel/api/agency-invoice-pdf/agency-invoice-pdf-page";
import { useInvoiceEtimsFiscalPreview } from "../../../hooks/useEtimsFiscalPreview";

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
  const etimsFiscal = useInvoiceEtimsFiscalPreview();

  const submitInvoiceMutation = trpc.invoicing.submitInvoice.useMutation({
    onSuccess: (data) => {
      setStatus("submitted");
      captureEvent("invoice_created", {
        currency: invoiceDetails.currency || paymentDetails.currency || "KES",
        line_items_count: (invoiceDetails.items || []).length,
      });
      
      // Invalidate the invoice number cache to ensure fresh data on next create
      // This ensures when user navigates to create a new invoice, they get the latest number
      utils.invoicing.getNextInvoiceNumber.invalidate();
      
      toast.success("Invoice saved", {
        description:
          data.status === "DRAFT"
            ? "Saved as draft. You can send it from the invoice details page when ready."
            : `Saved with status ${data.status.replaceAll("_", " ").toLowerCase()}.`,
      });
      // Redirect to invoices list after a short delay
      setTimeout(() => {
        navigate("/agency/invoices");
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

      if (!companyDetails.companyName?.trim()) {
        toast.error("Bill-to name is required", {
          description: "Enter the recipient name, or select an organization with billing details.",
        });
        setStatus("not-submitted");
        return;
      }

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
      
      let qrCodeDataUrl: string | undefined;
      const etimsUrl = etimsFiscal.verificationUrl?.trim();
      if (etimsUrl) {
        try {
          qrCodeDataUrl = await QRCodeUtil.toDataURL(etimsUrl, {
            width: 120,
            margin: 1,
          });
        } catch (error) {
          console.error("Failed to generate QR code:", error);
        }
      }

      const blob = await pdf(
        <Document>
          <AgencyInvoicePdfPage
            companyDetails={companyDetails}
            invoiceDetails={invoiceDetails}
            invoiceTerms={invoiceTerms}
            yourDetails={yourDetails}
            etimsFiscal={etimsFiscal}
            qrCodeDataUrl={qrCodeDataUrl}
          />
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
        metadata: (item.billingCycle && item.billingCycle !== '__unset__') ? { billingCycle: item.billingCycle } : null,
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

      const values = form.getValues() as Record<string, string | undefined>;
      const invoiceStatus = (values.invoiceStatus || "DRAFT") as InvoiceStatusOption;
      const teamId = values.billToMode === "manual" ? null : values.teamId?.trim() || null;
      const kraFields = buildKraPersistFieldsFromManual({
        sdcId: values.scuSdcId,
        sdcDate: values.scuDate,
        sdcTime: values.scuTime,
        curRcptNo: values.scuCurRcptNo,
        totRcptNo: values.scuTotRcptNo,
        intrlData: values.scuIntrlData,
        rcptSign: values.scuRcptSign,
        tin: yourDetails.yourTaxId,
        bhfId: "00",
      });

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
        status: invoiceStatus,
        teamId,
        ...(kraFields ?? {}),
      });
    } catch (e) {
      console.error(e);
      setStatus("not-submitted");
    }
  };

  return (
    <div className="flex h-[calc(100vh-208px)] justify-center items-center px-4">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-semibold pb-4">Your invoice is ready</h1>
        <p className="text-neutral-500 text-base pb-6">
          Choose the invoice status, then submit. The KRA SCU layout is applied on the preview
          even when SCU fields are still empty. You can enter SCU details on Invoice terms for
          backdated receipts.
        </p>
        <div className="mx-auto mb-6 max-w-xs text-left">
          <label className="mb-2 block text-sm font-medium text-gray-900">Invoice status</label>
          <InvoiceStatusSelect />
        </div>
        <Button
          disabled={status === "submitting" || status === "submitted"}
          onClick={handleSubmitInvoice}
          type="button"
          className="h-12 rounded-lg text-base px-12 mx-auto block min-w-[260px]"
        >
          {status === "not-submitted" && "Submit Invoice"}
          {status === "submitting" && "Submitting..."}
          {status === "submitted" && "Invoice Submitted"}
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
