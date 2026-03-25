"use client";

import { Editor } from "./editor";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");

  return (
    <div>
      <LabelInput
        name="template.paymentLabel"
        onSave={(value) => {
          console.log("Update template:", { paymentLabel: value });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="paymentDetails"
        render={({ field }) => (
          <Editor
            // NOTE: This is a workaround to get the new content to render
            key={id}
            initialContent={field.value}
            onChange={field.onChange}
            onBlur={(content) => {
              console.log("Update template:", {
                paymentDetails: content ? JSON.stringify(content) : null,
              });
            }}
            className="min-h-[78px]"
          />
        )}
      />
    </div>
  );
}
