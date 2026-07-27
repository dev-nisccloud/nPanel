"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Search, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { parseCommaList } from "./seo-suite-utils";

const FormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  primaryDomain: z.string().min(1, "Primary domain is required").max(255),
  locationName: z.string().min(1, "Location is required"),
  languageCode: z.string().min(2, "Language code is required").max(10),
  brandEntities: z.string().optional(),
  competitorDomains: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

interface CreateProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (projectId: string) => void;
}

export function CreateProjectSheet({ open, onOpenChange, onSuccess }: CreateProjectSheetProps) {
  const utils = trpc.useUtils();

  const createProject = trpc.seoSuite.createProject.useMutation({
    onSuccess: (project) => {
      toast.success("SEO project created");
      form.reset();
      onOpenChange(false);
      utils.seoSuite.listProjects.invalidate();
      onSuccess?.(project.id);
    },
    onError: (error) => {
      toast.error("Failed to create project", {
        description: error.message || "Please check your information and try again.",
      });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      primaryDomain: "",
      locationName: "Kenya",
      languageCode: "en",
      brandEntities: "",
      competitorDomains: "",
    },
  });

  const onSubmit = (data: FormData) => {
    createProject.mutate({
      name: data.name,
      primaryDomain: data.primaryDomain,
      locationName: data.locationName,
      locationCode: data.locationName.trim().toLowerCase() === "kenya" ? 2356 : undefined,
      languageCode: data.languageCode,
      brandEntities: parseCommaList(data.brandEntities ?? ""),
      competitorDomains: parseCommaList(data.competitorDomains ?? ""),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">New SEO project</SheetTitle>
              <SheetDescription className="text-base">
                Track a client domain for research, ranks, audits, and AI visibility
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
              <form id="create-seo-project" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp SEO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary domain</FormLabel>
                      <FormControl>
                        <Input placeholder="example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Kenya" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="languageCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language code</FormLabel>
                      <FormControl>
                        <Input placeholder="en" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandEntities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand entities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Acme, Acme Corp (comma-separated)"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="competitorDomains"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competitor domains</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="rival.com, other.com (comma-separated)"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-shrink-0 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-seo-project" disabled={createProject.isPending}>
            {createProject.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating…
              </>
            ) : (
              "Create project"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
