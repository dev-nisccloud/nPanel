"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import {
  webDesignQuoteFormSchema,
  type WebDesignQuoteFormValues,
  UI_PROJECT_TYPE_OPTIONS,
  transformFormToCreatePayload,
} from "./web-design-quote-ui-schema";

interface WebDesignContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional phone number for the "Call us" button (e.g. from VITE_PUBLIC_SUPPORT_PHONE) */
  supportPhoneNumber?: string;
  /** Pre-fill domain when opened from a domain context */
  domainName?: string;
}

export function WebDesignContactDialog({
  open,
  onOpenChange,
  supportPhoneNumber,
  domainName,
}: WebDesignContactDialogProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const createMutation = trpc.webDesignQuotes.create.useMutation({
    onError: (err) => {
      toast.error("Could not send request", {
        description: err.message ?? "Please try again.",
      });
    },
  });

  const form = useForm<WebDesignQuoteFormValues>({
    resolver: zodResolver(webDesignQuoteFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      companyName: "",
      domain: domainName ?? "",
      projectType: "",
      projectDescription: "",
      budget: "",
      timeline: undefined,
    },
  });

  React.useEffect(() => {
    if (open && domainName) {
      form.setValue("domain", domainName);
    }
  }, [open, domainName, form]);

  const onSubmit = async (data: WebDesignQuoteFormValues) => {
    const payload = transformFormToCreatePayload(data);
    type CreateInput = Parameters<typeof createMutation.mutateAsync>[0];
    try {
      await createMutation.mutateAsync(payload as CreateInput);
      toast.success("Request sent", {
        description: "We will reply with a quote soon.",
      });
      form.reset({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        domain: domainName ?? "",
        projectType: "",
        projectDescription: "",
        budget: "",
        timeline: undefined,
      });
      setSelectedDate(undefined);
      onOpenChange(false);
    } catch {
      // onError toast already fired from mutation
    }
  };

  const isSubmitting = createMutation.isPending;

  const handleCallUs = () => {
    const phone = supportPhoneNumber?.trim() || "+254748777666";
    window.location.href = `tel:${phone.replace(/\s+/g, "")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden flex flex-col max-h-[90vh] sm:max-w-lg">
        <DialogHeader className="p-6 pb-2 flex-none">
          <DialogTitle>Get a website built</DialogTitle>
          <DialogDescription>
            Tell us what you need. We will send you a quote.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="space-y-4 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+254 700 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <FormControl>
                        <Input placeholder="example.com (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>What do you need?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose one" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UI_PROJECT_TYPE_OPTIONS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brief details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What should the site do? Any links to sites you like?"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. KES 50,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Needed by</FormLabel>
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                type="button"
                                disabled={isSubmitting}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? (
                                  format(selectedDate, "PPP")
                                ) : (
                                  <span>Optional date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date);
                                field.onChange(date);
                                setIsDatePickerOpen(false);
                              }}
                              initialFocus
                              disabled={isSubmitting}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t flex-none flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCallUs}
                disabled={isSubmitting}
              >
                <Phone className="h-4 w-4" />
                Call us
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset({
                      name: "",
                      email: "",
                      phone: "",
                      companyName: "",
                      domain: domainName ?? "",
                      projectType: "",
                      projectDescription: "",
                      budget: "",
                      timeline: undefined,
                    });
                    setSelectedDate(undefined);
                    onOpenChange(false);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner
                        variant="ellipsis"
                        className="text-primary-foreground"
                        size="sm"
                      />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Get quote"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
