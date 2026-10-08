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
  userId: z.string().min(1).max(20),
  userNm: z.string().min(1).max(60),
  pwd: z.string().min(1).max(255),
  adrs: z.string().max(200).optional(),
  cntc: z.string().max(20).optional(),
  authCd: z.string().max(100).optional(),
  remark: z.string().max(2000).optional(),
  useYn: z.enum(["Y", "N"]).default("Y"),
});

type FormData = z.infer<typeof formSchema>;

export function SaveETimsBranchUserSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { userId: "", userNm: "", pwd: "", adrs: "", cntc: "", authCd: "", remark: "", useYn: "Y" },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({ userId: "", userNm: "", pwd: "", adrs: "", cntc: "", authCd: "", remark: "", useYn: "Y" });
  }, [open, form]);

  const save = trpc.etims.branch.saveBranchUser.useMutation();

  const onSubmit = async (data: FormData) => {
    try {
      const res = await save.mutateAsync({
        user: {
          userId: data.userId,
          userNm: data.userNm,
          pwd: data.pwd,
          adrs: data.adrs || null,
          cntc: data.cntc || null,
          authCd: data.authCd || null,
          remark: data.remark || null,
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
      toast.success("Branch user saved on KRA eTIMS");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save branch user");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Branch user</SheetTitle>
          <SheetDescription>Registers a branch employee account via /saveBhfUser.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl><Input maxLength={20} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="userNm" render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl><Input maxLength={60} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="pwd" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" maxLength={255} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="cntc" render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <FormControl><Input maxLength={20} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="adrs" render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl><Input maxLength={200} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="authCd" render={({ field }) => (
              <FormItem>
                <FormLabel>Authority code</FormLabel>
                <FormControl><Input maxLength={100} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? <><Spinner size={16} className="mr-2" />Saving...</> : "Save user"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
