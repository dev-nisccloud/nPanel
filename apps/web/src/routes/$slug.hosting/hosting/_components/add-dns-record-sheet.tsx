"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Globe, XIcon, Plus } from "lucide-react";

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

import { dnsRecordSchema } from "./dns-schema";

const FormSchema = z.object({
  host: z.string().min(1, { message: "Host is required." }),
  ttl: z.number().min(60, { message: "TTL must be at least 60 seconds." }),
  recordType: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "PTR"]).refine((val) => val !== undefined, {
    message: "Please select a record type.",
  }),
  value: z.string().min(1, { message: "Value is required." }),
  priority: z.number().optional(),
  weight: z.number().optional(),
  port: z.number().optional(),
});

interface AddDnsRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  onSuccess?: () => void;
}

export function AddDnsRecordSheet({ open, onOpenChange, siteId, onSuccess }: AddDnsRecordSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedRecordType, setSelectedRecordType] = React.useState<string>("");

  // tRPC mutation for creating DNS record
  const createDnsRecord = trpc.plesk.dnsCreate.create.useMutation({
    onSuccess: () => {
      toast.success("DNS record added successfully!");
      form.reset();
      setSelectedRecordType("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error adding DNS record:", error);
      
      // Handle different types of errors
      let errorMessage = "Please check your information and try again.";
      
      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid DNS record data.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while creating DNS record.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error("Failed to add DNS record", {
        description: errorMessage,
      });
    },
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      host: "",
      ttl: 3600,
      recordType: undefined,
      value: "",
      priority: undefined,
      weight: undefined,
      port: undefined,
    },
  });

  // Reset form and states when sheet closes
  React.useEffect(() => {
    if (!open) {
      // Reset all form fields to defaults
      form.reset({
        host: "",
        ttl: 3600,
        recordType: undefined,
        value: "",
        priority: undefined,
        weight: undefined,
        port: undefined,
      });
      // Reset other states
      setSelectedRecordType("");
      setIsSubmitting(false);
      form.clearErrors();
    }
  }, [open, form]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the data for the API call
      const apiData = {
        siteId,
        type: data.recordType,
        host: data.host,
        value: data.value,
        ttl: data.ttl,
        // For MX and SRV records, include priority in the opt field
        opt: data.priority !== undefined ? data.priority.toString() : undefined,
      };

      await createDnsRecord.mutateAsync(apiData);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Error in onSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordTypeChange = (value: string) => {
    setSelectedRecordType(value);
    form.setValue("recordType", value as any);
    
    // Reset optional fields when record type changes
    form.setValue("priority", undefined);
    form.setValue("weight", undefined);
    form.setValue("port", undefined);
  };

  const getRecordTypeDescription = (type: string) => {
    switch (type) {
      case "A":
        return "Points a domain to an IPv4 address";
      case "AAAA":
        return "Points a domain to an IPv6 address";
      case "CNAME":
        return "Creates an alias from one domain name to another";
      case "MX":
        return "Specifies mail servers for the domain";
      case "TXT":
        return "Stores text information for the domain";
      case "NS":
        return "Specifies name servers for the domain";
      case "SRV":
        return "Specifies services available in the domain";
      case "PTR":
        return "Maps an IP address to a domain name";
      default:
        return "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Add DNS Record</SheetTitle>
              <SheetDescription className="text-base">
                Create a new DNS record for your domain
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="px-1 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>Configure the DNS record details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Host</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="www, mail, @, etc." 
                            {...field} 
                          />
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
                        <Select onValueChange={handleRecordTypeChange} defaultValue={field.value}>
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

                  {selectedRecordType && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {getRecordTypeDescription(selectedRecordType)}
                      </p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={
                              selectedRecordType === "A" ? "192.168.1.1" :
                              selectedRecordType === "AAAA" ? "2001:db8::1" :
                              selectedRecordType === "CNAME" ? "example.com" :
                              selectedRecordType === "MX" ? "mail.example.com" :
                              selectedRecordType === "TXT" ? "v=spf1 include:_spf.google.com ~all" :
                              selectedRecordType === "NS" ? "ns1.example.com" :
                              selectedRecordType === "SRV" ? "example.com" :
                              selectedRecordType === "PTR" ? "example.com" :
                              "Enter value"
                            }
                            {...field} 
                          />
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
                            min="60"
                            placeholder="3600"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 3600)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Additional Fields for MX and SRV Records */}
              {(selectedRecordType === "MX" || selectedRecordType === "SRV") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Settings</CardTitle>
                    <CardDescription>
                      {selectedRecordType === "MX" ? "Mail server priority" : "Service record details"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              max="65535"
                              placeholder={selectedRecordType === "MX" ? "10" : "0"}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedRecordType === "SRV" && (
                      <>
                        <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  max="65535"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="port"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Port</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  max="65535"
                                  placeholder="443"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <SheetFooter className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Record</span>
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
