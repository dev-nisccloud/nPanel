"use client";

import { Editor } from "./editor";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useCustomersQuery } from "@/hooks/use-customers";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectCustomer } from "@/components/npanel-ui/select-customer";
import { LabelInput } from "./label-input";
import type { JSONContent } from "@tiptap/react";

export function CustomerDetails() {
  const { control, setValue, watch } = useFormContext();
  const { setParams, selectedCustomerId } = useInvoiceParams();
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);

  const content = watch("customerDetails");
  const id = watch("id");

  const { data: customers } = useCustomersQuery();
  const customer = customers?.data?.find(c => c.id === selectedCustomerId);

  const handleLabelSave = (value: string) => {
    setIsUpdatingTemplate(true);
    // Simulate template update
    setTimeout(() => {
      setIsUpdatingTemplate(false);
    }, 500);
  };

  const handleOnChange = (content?: JSONContent | null) => {
    // Reset the selected customer id when the content is changed
    setParams({ selectedCustomerId: null });

    setValue("customerDetails", content, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!content) {
      setValue("customerName", null, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerId", null, { shouldValidate: true, shouldDirty: true });
    }
  };

  useEffect(() => {
    if (customer) {
      // Simple customer content transformation
      const customerContent: JSONContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: customer.name,
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: customer.address,
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: customer.email,
              },
            ],
          },
        ],
      };

      // Remove the selected customer id from the url so we don't introduce a race condition
      setParams({ selectedCustomerId: null });

      setValue("customerName", customer.name, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerId", customer.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerDetails", customerContent, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [customer, setParams, setValue]);

  return (
    <div>
      <LabelInput
        name="template.customerLabel"
        className="mb-2 block"
        onSave={handleLabelSave}
      />
      {content ? (
        <Controller
          name="customerDetails"
          control={control}
          render={({ field }) => (
            <Editor
              // NOTE: This is a workaround to get the new content to render
              key={id}
              initialContent={field.value}
              onChange={handleOnChange}
              className="min-h-[90px]"
            />
          )}
        />
      ) : (
        <SelectCustomer />
      )}
    </div>
  );
}
