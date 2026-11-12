"use client";

import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";
import { Icons } from "@npanel/ui/components/icons";
import { Skeleton } from "@npanel/ui/components/skeleton";
import { toast } from "@/components/ui/sonner";
import { useFormContext } from "react-hook-form";

export function Logo() {
  const { watch, setValue } = useFormContext();
  const logoUrl = watch("template.logoUrl");
  const { uploadFile, isLoading } = useUpload();

  const { data: user } = useUserQuery();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { url } = await uploadFile({
          file,
          path: [user?.id ?? "", "invoice", file.name],
          bucket: "avatars",
        });

        setValue("template.logoUrl", url, {
          shouldValidate: true,
          shouldDirty: true,
        });

        // Simulate template update
        console.log("Update template:", { logoUrl: url });
      } catch (error) {
        toast.error("Something went wrong, please try again.");
      }
    }
  };

  return (
    <div className="flex items-start gap-3">
      <label htmlFor="logo-upload" className="block h-[80px] cursor-pointer">
        {isLoading ? (
          <Skeleton className="h-full w-20" />
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt="Invoice logo"
            className="h-full w-auto max-w-none object-contain"
          />
        ) : (
          <div className="h-[80px] w-[80px] bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
        )}
      </label>
      {logoUrl ? (
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1 rounded-[10px] border border-border bg-background px-3 text-sm font-medium"
          onClick={() => {
            setValue("template.logoUrl", undefined, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
        >
          <Icons.Clear className="size-4" />
          Remove logo
        </button>
      ) : null}

      <input
        id="logo-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleUpload}
        disabled={isLoading}
      />
    </div>
  );
}

