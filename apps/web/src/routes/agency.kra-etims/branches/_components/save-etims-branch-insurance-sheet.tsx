"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { kraMutationError } from "../../_lib/etims-kra";

const formSchema = z.object({
  isrccCd: z.string().min(1).max(10),
  isrccNm: z.string().min(1).max(100),
  isrcRt: z.coerce.number().min(0).max(999),
  useYn: z.enum(["Y", "N"]).default("Y"),
});

type FormData = z.infer<typeof formSchema>;

export function SaveETimsBranchInsuranceSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { isrccCd: "", isrccNm: "", isrcRt: 0, useYn: "Y" },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({ isrccCd: "", isrccNm: "", isrcRt: 0, useYn: "Y" });
  }, [open, form]);

  const save = trpc.etims.branch.saveBranchInsurance.useMutation();

  const onSubmit = async (data: FormData) => {
    try {
      const res = await save.mutateAsync({
        insurance: {
          isrccCd: data.isrccCd,
          isrccNm: data.isrccNm,
          isrcRt: data.isrcRt,
          useYn: data.useYn,
          regrId: "Admin",
          regrNm: "Admin",
          modrId: "Admin",
          modrNm: "Admin",
        },
      });
      const error = kraMutationError(res);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Branch insurance saved on KRA eTIMS");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save insurance");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Branch insurance</SheetTitle>
          <SheetDescription>
            Registers an insurer via /saveBhfInsurance. Required for OSCU coverage even if you are not a pharmacy.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField control={form.control} name="isrccCd" render={({ field }) => (
              <FormItem>
                <FormLabel>Insurer code</FormLabel>
                <FormControl><Input maxLength={10} placeholder="ISRCC01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isrccNm" render={({ field }) => (
              <FormItem>
                <FormLabel>Insurer name</FormLabel>
                <FormControl><Input maxLength={100} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isrcRt" render={({ field }) => (
              <FormItem>
                <FormLabel>Premium rate</FormLabel>
                <FormControl><Input type="number" min={0} max={999} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? <><Spinner size={16} className="mr-2" />Saving...</> : "Save insurance"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
