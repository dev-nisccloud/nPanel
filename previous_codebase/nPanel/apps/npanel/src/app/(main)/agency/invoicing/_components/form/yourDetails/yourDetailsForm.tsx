import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import CustomTextInput from "@/app/(main)/agency/invoicing/_components/ui/customTextInput";
import CustomNumberInput from "@/app/(main)/agency/invoicing/_components/ui/customNumberInput";
// import ImageInput from "@/app/(main)/agency/invoicing/_components/ui/imageInput";
import { DEFAULT_INVOICE_LOGO } from "../../../constants";

export const YourDetailsForm = () => {
  const { setValue } = useFormContext();

  useEffect(() => {
    setValue("yourLogo", DEFAULT_INVOICE_LOGO, { shouldDirty: false });
  }, [setValue]);

  return (
    <div className="pt-24">
      <p className="text-2xl font-semibold pb-3">Your Details (From)</p>
      <CustomTextInput
        label="Email"
        placeholder="e.g. johndoe@example.com"
        variableName="yourEmail"
      />
      <p className="pb-10 pt-3 text-xs font-medium text-neutral-500">
        We&apos;ll fill the billing details automatically if we find the your.
      </p>
      <p className="pb-2 text-sm font-medium text-neutral-500">Billing details</p>
      <CustomTextInput
        label="Your Name"
        placeholder="John Doe"
        variableName="yourName"
      />
      {/* NOTE: Keep this file picker for future use when manual logo uploads are reinstated.
      <ImageInput label="Logo" variableName="yourLogo" />
      */}
      <p className="text-xs text-muted-foreground">
        Logo is set automatically for the generated invoice.
      </p>
      <CustomTextInput
        label="Address"
        placeholder="Kenyatta Avenue, 2"
        variableName="yourAddress"
      />
      <CustomTextInput
        label="City"
        placeholder="Nairobi"
        variableName="yourCity"
      />
      <CustomTextInput
        label="State"
        placeholder="Nairobi County"
        variableName="yourState"
      />
      <CustomNumberInput
        label="Zip"
        placeholder="00100"
        variableName="yourZip"
      />
      <CustomTextInput
        label="Country"
        placeholder="Kenya"
        variableName="yourCountry"
      />
      <CustomTextInput
        label="Tax ID"
        placeholder="KRA PIN"
        variableName="yourTaxId"
      />
    </div>
  );
};
