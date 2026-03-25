"use client";

import { Editor } from "./editor";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function NoteDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");

  return (
    <div>
      <LabelInput
        name="template.noteLabel"
        onSave={(value) => {
          console.log("Update template:", { noteLabel: value });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="noteDetails"
        render={({ field }) => {
          return (
            <Editor
              // NOTE: This is a workaround to get the new content to render
              key={id}
              initialContent={field.value}
              onChange={field.onChange}
              onBlur={(content) => {
                console.log("Update template:", {
                  noteDetails: content ? JSON.stringify(content) : null,
                });
              }}
              className="min-h-[78px]"
            />
          );
        }}
      />
    </div>
  );
}
