"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Globe, XIcon, Edit, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";

const FormSchema = z.object({
    host: z.string().min(1, { message: "Host is required." }),
    ttl: z.number().min(60, { message: "TTL must be at least 60 seconds." }),
    recordType: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "PTR"]),
    value: z.string().min(1, { message: "Value is required." }),
    priority: z.number().optional(),
    weight: z.number().optional(),
    port: z.number().optional(),
});

interface EditDnsRecordSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    siteId: number;
    domainName?: string;
    record: {
        id?: number;
        host?: string;
        type?: string;
        value?: string;
        opt?: string | number;
        ttl?: number;
    } | null;
    onSuccess?: () => void;
}

export function EditDnsRecordSheet({ open, onOpenChange, siteId, domainName, record, onSuccess }: EditDnsRecordSheetProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [selectedRecordType, setSelectedRecordType] = React.useState<string>("");

    const updateDnsRecord = trpc.plesk.dnsUpdate.update.useMutation({
        onSuccess: (_data, variables) => {
            captureEvent("dns_record_updated", { record_type: variables.type });
            toast.success("DNS record updated successfully!");
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (error) => {
            console.error("Error updating DNS record:", error);
            toast.error("Failed to update DNS record", {
                description: error.message || "Please try again.",
            });
        },
    });

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            host: "",
            ttl: 3600,
            recordType: "A",
            value: "",
            priority: undefined,
            weight: undefined,
            port: undefined,
        },
    });

    // Prefill form when record changes
    React.useEffect(() => {
        if (open && record) {
            const type = (record.type || "A") as any;
            setSelectedRecordType(type);

            // Strip domain name from host for editing
            let displayHost = record.host || "";
            if (domainName) {
                const lowerHost = displayHost.toLowerCase().replace(/\.$/, '');
                const lowerDomain = domainName.toLowerCase().replace(/\.$/, '');

                if (lowerHost === lowerDomain) {
                    displayHost = "@";
                } else if (lowerHost.endsWith('.' + lowerDomain)) {
                    displayHost = displayHost.substring(0, displayHost.length - (lowerDomain.length + 1));
                }
            }

            form.reset({
                host: displayHost,
                ttl: record.ttl || 3600,
                recordType: type,
                value: record.value || "",
                priority: record.type === "MX" || record.type === "SRV" ? parseInt(String(record.opt || "0")) : undefined,
                weight: undefined, // Not typically returned by default plesk get
                port: undefined,   // Not typically returned by default plesk get
            });
        }
    }, [open, record, domainName, form]);

    const onSubmit = async (data: z.infer<typeof FormSchema>) => {
        if (!record || !record.id) {
            toast.error("Cannot update record: missing ID");
            return;
        }
        setIsSubmitting(true);

        try {
            await updateDnsRecord.mutateAsync({
                siteId,
                recordId: record.id,
                domainName,
                type: data.recordType,
                host: data.host,
                value: data.value,
                ttl: data.ttl,
                opt: data.priority !== undefined ? data.priority.toString() : undefined,
            });
        } catch (error) {
            console.error("Error in onSubmit:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordTypeChange = (value: string) => {
        setSelectedRecordType(value);
        form.setValue("recordType", value as any);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col">
                <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Edit className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-bold">Edit DNS Record</SheetTitle>
                            <SheetDescription className="text-base">
                                Modify DNS record details
                            </SheetDescription>
                        </div>
                    </div>
                    <SheetClose asChild>
                        <Button size="icon" variant="ghost" className="p-0 m-0 size-auto hover:bg-transparent">
                            <XIcon className="size-5" />
                        </Button>
                    </SheetClose>
                </SheetHeader>

                <ScrollArea className="flex-1 min-h-0 pr-4">
                    <div className="px-1 pb-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Record Details</CardTitle>
                                        <CardDescription>Update the following information</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="host"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Host</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                placeholder="www, mail, @, etc."
                                                                {...field}
                                                                className="flex-1"
                                                            />
                                                            {domainName && (
                                                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                                    .{domainName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="recordType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Record Type</FormLabel>
                                                    <Select onValueChange={handleRecordTypeChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select record type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="A">A (IPv4 Address)</SelectItem>
                                                            <SelectItem value="AAAA">AAAA (IPv6 Address)</SelectItem>
                                                            <SelectItem value="CNAME">CNAME (Alias)</SelectItem>
                                                            <SelectItem value="MX">MX (Mail Exchange)</SelectItem>
                                                            <SelectItem value="TXT">TXT (Text)</SelectItem>
                                                            <SelectItem value="NS">NS (Name Server)</SelectItem>
                                                            <SelectItem value="SRV">SRV (Service)</SelectItem>
                                                            <SelectItem value="PTR">PTR (Pointer)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="value"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Value</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter value" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="ttl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>TTL (Time To Live)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 3600)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {(selectedRecordType === "MX" || selectedRecordType === "SRV") && (
                                            <FormField
                                                control={form.control}
                                                name="priority"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Priority</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                <SheetFooter className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Save className="h-4 w-4" />
                                                <span>Save Changes</span>
                                            </div>
                                        )}
                                    </Button>
                                </SheetFooter>
                            </form>
                        </Form>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
