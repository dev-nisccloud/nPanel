import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

const STAGE_COLORS = ["#6B7280", "#3B82F6", "#F59E0B", "#8B5CF6", "#10B981", "#EF4444"];

const DEFAULT_STAGES = [
  { name: "Lead", probability: 10, color: "#6B7280" },
  { name: "Qualified", probability: 25, color: "#3B82F6" },
  { name: "Proposal", probability: 50, color: "#F59E0B" },
  { name: "Negotiation", probability: 75, color: "#8B5CF6" },
  { name: "Closed Won", probability: 100, color: "#10B981" },
  { name: "Closed Lost", probability: 0, color: "#EF4444" },
];

const pipelineFormSchema = z.object({
  name: z.string().min(1, "Pipeline name is required").max(100),
  description: z.string().max(500).optional(),
  isDefault: z.boolean(),
  stages: z
    .array(
      z.object({
        name: z.string().min(1, "Stage name is required").max(100),
        probability: z.number().int().min(0).max(100),
        color: z.string().regex(/^#[0-9A-F]{6}$/i, "Pick a color"),
      }),
    )
    .min(1, "Add at least one stage"),
});

type PipelineFormValues = z.infer<typeof pipelineFormSchema>;

export function PipelineFormSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (pipelineId: string) => void;
}) {
  const utils = trpc.useUtils();
  const createPipeline = trpc.crm.pipelines.create.useMutation();
  const createStage = trpc.crm.pipelines.createStage.useMutation();

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      stages: DEFAULT_STAGES,
    },
  });

  const stages = useFieldArray({ control: form.control, name: "stages" });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: "",
      description: "",
      isDefault: false,
      stages: DEFAULT_STAGES,
    });
  }, [open, form]);

  const onSubmit = async (values: PipelineFormValues) => {
    let createdId: string | null = null;
    try {
      const created = await createPipeline.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || null,
        isDefault: values.isDefault,
        displayOrder: 0,
      });
      if (!created?.id) {
        throw new Error("Failed to create pipeline");
      }
      createdId = created.id;

      for (const [index, stage] of values.stages.entries()) {
        await createStage.mutateAsync({
          pipelineId: created.id,
          name: stage.name.trim(),
          probability: stage.probability,
          displayOrder: index,
          color: stage.color.toUpperCase(),
        });
      }

      toast.success("Pipeline created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create pipeline");
    } finally {
      await utils.crm.pipelines.list.invalidate();
      if (createdId) onCreated(createdId);
    }
  };

  const saving = form.formState.isSubmitting;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New pipeline</SheetTitle>
          <SheetDescription>
            Name the pipeline and set the stages deals will move through.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sales pipeline" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                  </FormControl>
                  <FormLabel className="font-normal">Use as the default pipeline</FormLabel>
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Stages</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    stages.append({
                      name: "",
                      probability: 0,
                      color: STAGE_COLORS[stages.fields.length % STAGE_COLORS.length] ?? "#6B7280",
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add stage
                </Button>
              </div>

              <div className="space-y-2">
                {stages.fields.map((stage, index) => (
                  <div key={stage.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`stages.${index}.color`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <input
                              type="color"
                              aria-label="Stage color"
                              value={field.value}
                              onChange={field.onChange}
                              className="mt-1 h-8 w-8 cursor-pointer rounded border bg-transparent p-0.5"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`stages.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="min-w-0 flex-1">
                          <FormControl>
                            <Input placeholder="Stage name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`stages.${index}.probability`}
                      render={({ field }) => (
                        <FormItem className="w-20">
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              aria-label="Win probability"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove stage"
                      disabled={stages.fields.length === 1}
                      onClick={() => stages.remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Probability is the win chance for that stage, from 0 to 100.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create pipeline
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
