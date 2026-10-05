"use client";

import { captureEvent } from "@/lib/posthog";

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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { RefreshCw, Search } from "lucide-react";
import { customerFromLookup } from "../../_lib/etims-kra";

const formSchema = z.object({
    custNo: z.string().min(1, "Customer number is required").max(9),
    custTin: z.string().min(1, "KRA PIN is required").max(11),
    custNm: z.string().min(1, "Customer name is required").max(60),
    adrs: z.string().max(300).nullable().optional(),
    telNo: z.string().max(20).nullable().optional(),
    email: z.union([z.string().email("Invalid email"), z.literal("")]).nullable().optional(),
    faxNo: z.string().max(20).nullable().optional(),
    remark: z.string().max(1000).nullable().optional(),
    useYn: z.enum(["Y", "N"]).default("Y"),
});

type FormData = z.infer<typeof formSchema>;

export type EtimsCustomerFormValues = {
    custNo: string;
    custTin: string;
    custNm: string;
    adrs?: string | null;
    telNo?: string | null;
    email?: string | null;
    faxNo?: string | null;
    remark?: string | null;
    useYn?: string | null;
};

function buildDefaultCustNo() {
    return `C${String(Date.now()).slice(-8)}`;
}

export function SaveETimsCustomerSheet({
    open,
    onOpenChange,
    onSuccess,
    initialCustomer,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialCustomer?: EtimsCustomerFormValues | null;
}) {
    const isEdit = !!initialCustomer?.custNo;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            custNo: buildDefaultCustNo(),
            custTin: "",
            custNm: "",
            adrs: "",
            telNo: "",
            email: "",
            faxNo: "",
            remark: "",
            useYn: "Y",
        },
    });

    React.useEffect(() => {
        if (!open) return;
        if (initialCustomer) {
            form.reset({
                custNo: initialCustomer.custNo,
                custTin: initialCustomer.custTin,
                custNm: initialCustomer.custNm,
                adrs: initialCustomer.adrs ?? "",
                telNo: initialCustomer.telNo ?? "",
                email: initialCustomer.email ?? "",
                faxNo: initialCustomer.faxNo ?? "",
                remark: initialCustomer.remark ?? "",
                useYn: (initialCustomer.useYn === "N" ? "N" : "Y") as "Y" | "N",
            });
        } else {
            form.reset({
                custNo: buildDefaultCustNo(),
                custTin: "",
                custNm: "",
                adrs: "",
                telNo: "",
                email: "",
                faxNo: "",
                remark: "",
                useYn: "Y",
            });
        }
    }, [open, initialCustomer, form]);

    const [lookupTin, setLookupTin] = React.useState<string | null>(null);
    const { data: lookupData, isFetching: isLookingUp } = trpc.etims.data.lookupCustomer.useQuery(
        { custmTin: lookupTin ?? "" },
        { enabled: !!lookupTin, retry: false },
    );

    React.useEffect(() => {
        if (!lookupTin || isLookingUp) return;
        const found = customerFromLookup(lookupData);
        if (!found) {
            if (lookupData !== undefined) {
                toast.error("KRA did not return details for this PIN");
            }
            return;
        }
        form.setValue("custNm", found.name);
        form.setValue("custTin", found.tin || lookupTin);
        if (found.adrs) form.setValue("adrs", found.adrs);
        if (found.telNo) form.setValue("telNo", found.telNo);
        if (found.email) form.setValue("email", found.email);
        toast.success("Customer details filled from KRA lookup");
        setLookupTin(null);
    }, [lookupData, lookupTin, isLookingUp, form]);

    const saveCustomer = trpc.etims.branch.saveCustomer.useMutation({
        onSuccess: (res) => {
            if (res?.success === false) {
                toast.error(res?.errorMessage ?? "Failed to save customer");
                return;
            }
            toast.success(isEdit ? "Customer updated on branch" : "Customer registered on branch");
            if (!isEdit) captureEvent("etims_customer_registered");
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => toast.error(err.message || "Failed to save customer"),
    });

    const onSubmit = (values: FormData) => {
        saveCustomer.mutate({
            customer: {
                custNo: values.custNo.trim(),
                custTin: values.custTin.trim().toUpperCase(),
                custNm: values.custNm.trim(),
                adrs: values.adrs?.trim() || null,
                telNo: values.telNo?.trim() || null,
                email: values.email?.trim() || null,
                faxNo: values.faxNo?.trim() || null,
                remark: values.remark?.trim() || null,
                useYn: values.useYn,
                regrId: "Admin",
                regrNm: "Admin",
                modrId: "Admin",
                modrNm: "Admin",
            },
        });
    };

    const handleVerifyTin = () => {
        const tin = form.getValues("custTin")?.trim().toUpperCase();
        if (!tin) {
            toast.error("Enter a KRA PIN first");
            return;
        }
        setLookupTin(tin);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEdit ? "Edit Branch Customer" : "Register Branch Customer"}</SheetTitle>
                    <SheetDescription>
                        Saves the customer to your eTIMS branch via KRA `/saveBhfCustomer`. Required before invoicing on sandbox.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="custNo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer #</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="font-mono" readOnly={isEdit} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 items-end">
                            <FormField
                                control={form.control}
                                name="custTin"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>KRA PIN / TIN</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="uppercase font-mono"
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="secondary" onClick={handleVerifyTin} disabled={isLookingUp}>
                                {isLookingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>

                        <FormField
                            control={form.control}
                            name="custNm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="adrs"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value ?? ""} rows={2} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="telNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="remark"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remark</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value ?? ""} rows={2} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saveCustomer.isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saveCustomer.isPending}>
                                {saveCustomer.isPending ? (
                                    <>
                                        <Spinner size={16} className="mr-2" />
                                        Saving...
                                    </>
                                ) : isEdit ? (
                                    "Update customer"
                                ) : (
                                    "Register customer"
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
