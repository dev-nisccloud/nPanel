"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyName: z.string().min(1, "Company name is required"),
  budget: z.string().min(1, "Budget is required"),
  timeline: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return undefined;
      if (val instanceof Date) return val;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z.date().optional()
  ),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface WebDesignContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebDesignContactDialog({ open, onOpenChange }: WebDesignContactDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      companyName: "",
      budget: "",
      timeline: undefined,
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Simulate API call - replace with actual API endpoint when available
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Request submitted successfully", {
        description: "We will contact you as soon as possible with a quotation for your request.",
      });
      
      form.reset();
      setSelectedDate(undefined);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to submit request", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get Professional Web Design & Development</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll get back to you with a custom quotation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <FormControl>
                    <Input placeholder="KES 50,000 - 100,000" {...field} />
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
                  <FormLabel>Timeline</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedDate(undefined);
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
