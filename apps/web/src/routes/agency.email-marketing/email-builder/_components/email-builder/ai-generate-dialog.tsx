import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { cn } from "@/utils/cn";

const IMAGE_COUNT_OPTIONS = [
    { label: "No images", value: "0" },
    { label: "Small (1 image)", value: "1" },
    { label: "Medium (2 images)", value: "2" },
    { label: "Large (3+ images)", value: "3" },
];

const TONE_OPTIONS = ["Professional", "Friendly", "Witty", "Urgent", "Luxury", "Other"];
const GOAL_OPTIONS = ["Product Launch", "Discount/Sale", "Newsletter", "Event Invitation", "Welcome Email", "Other"];
const AUDIENCE_OPTIONS = ["Existing Customers", "New Leads", "Tech-savvy Millennials", "Corporate Professionals", "Bargain Hunters", "Other"];

const aiFormSchema = z.object({
    companyName: z.string().optional(),
    productName: z.string().optional(),
    emailType: z.string().min(1, "Please select an email type"),
    brandColors: z.array(z.string()).default([]),
    
    audienceType: z.string().min(1, "Please select an audience"),
    otherAudience: z.string().optional(),
    
    goalType: z.string().min(1, "Please select a goal"),
    otherGoal: z.string().optional(),
    
    toneType: z.string().min(1, "Please select a tone"),
    otherTone: z.string().optional(),
    
    imageDensity: z.string().default("1"),
    instructions: z.string().optional(),
}).refine((data) => {
    if (data.audienceType === "Other" && !data.otherAudience) return false;
    if (data.goalType === "Other" && !data.otherGoal) return false;
    if (data.toneType === "Other" && !data.otherTone) return false;
    return true;
}, {
    message: "Description is required for 'Other' options",
    path: ["otherTone"], // Just one path for simplicity in error handling
});

type AiFormValues = z.infer<typeof aiFormSchema>;

interface AiGenerateDialogProps {
    designId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiGenerateDialog({ designId, open, onOpenChange }: AiGenerateDialogProps) {
    const [step, setStep] = React.useState(1);
    const [tempColor, setTempColor] = React.useState("#000000");
    const form = useForm<AiFormValues>({
        resolver: zodResolver(aiFormSchema),
        defaultValues: {
            companyName: "",
            productName: "",
            emailType: "promo",
            brandColors: [],
            audienceType: "",
            otherAudience: "",
            goalType: "",
            otherGoal: "",
            toneType: "Professional",
            otherTone: "",
            imageDensity: "1",
            instructions: "",
        },
    });

    const trpcContext = trpc.useContext();
    const { mutate: generateWithAi, isPending } = trpc.emailBuilder.generateWithAi.useMutation({
        mutationKey: ["emailBuilder", "generateWithAi", designId],
        onSuccess: () => {
            toast.success("AI is now building your email. This may take a minute.");
            onOpenChange(false);
            // Invalidate so the parent page picks up the PROCESSING status immediately
            trpcContext.emailBuilder.getDesign.invalidate(designId);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to start AI generation");
        },
    });

    function onSubmit(values: AiFormValues) {
        generateWithAi({
            designId,
            companyName: values.companyName,
            productName: values.productName,
            emailType: values.emailType,
            brandColors: values.brandColors,
            audience: values.audienceType === "Other" ? values.otherAudience : values.audienceType,
            goal: values.goalType === "Other" ? values.otherGoal : values.goalType,
            tone: values.toneType === "Other" ? values.otherTone : values.toneType,
            imageCount: parseInt(values.imageDensity),
            instructions: values.instructions,
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">AI Email Builder</span>
                    </div>
                    <DialogTitle className="text-2xl font-bold">
                        {step === 1 && "Brand & Context"}
                        {step === 2 && "Audience & Goal"}
                        {step === 3 && "Style & Content"}
                    </DialogTitle>
                    <DialogDescription>
                        Step {step} of 3 - {step === 1 ? "Tell us about your brand" : step === 2 ? "Who is this for?" : "Finalize the look and feel"}
                    </DialogDescription>
                    
                    {/* Progress Bar */}
                    <div className="flex gap-1 mt-4">
                        {[1, 2, 3].map((s) => (
                            <div 
                                key={s} 
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                                    s <= step ? "bg-primary" : "bg-gray-100"
                                )} 
                            />
                        ))}
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form 
                        onSubmit={(e) => e.preventDefault()} 
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && step < 3) {
                                e.preventDefault();
                                setStep(step + 1);
                            }
                        }}
                        className="p-6 pt-2 space-y-5"
                    >
                        {step === 1 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acme Corp" {...field} className="h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="productName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product/Service Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="What are you promoting? (Optional)" {...field} className="h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="emailType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="welcome">Welcome Email</SelectItem>
                                                    <SelectItem value="promo">Promotional / Sale</SelectItem>
                                                    <SelectItem value="newsletter">Monthly Newsletter</SelectItem>
                                                    <SelectItem value="transactional">Transactional</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="brandColors"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Brand Colors</FormLabel>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            type="color" 
                                                            value={tempColor}
                                                            className="w-12 h-11 p-1 cursor-pointer" 
                                                            onChange={(e) => setTempColor(e.target.value)}
                                                        />
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            className="h-11 flex-1"
                                                            onClick={() => {
                                                                if (!field.value.includes(tempColor)) {
                                                                    field.onChange([...field.value, tempColor]);
                                                                }
                                                            }}
                                                        >
                                                            Add Color {tempColor.toUpperCase()}
                                                        </Button>
                                                    </div>
                                                    {field.value.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {field.value.map((color, i) => (
                                                                <div 
                                                                    key={i}
                                                                    className="group relative flex items-center gap-1.5 px-2 py-1 bg-white border rounded-full text-[10px] font-bold shadow-sm"
                                                                    style={{ borderColor: color }}
                                                                >
                                                                    <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
                                                                    {color.toUpperCase()}
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => field.onChange(field.value.filter((_, idx) => idx !== i))}
                                                                        className="hover:text-destructive transition-colors"
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                <FormField
                                    control={form.control}
                                    name="audienceType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Audience</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="Who is this for?" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {AUDIENCE_OPTIONS.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch("audienceType") === "Other" && (
                                    <FormField
                                        control={form.control}
                                        name="otherAudience"
                                        render={({ field }) => (
                                            <FormItem className="animate-in fade-in slide-in-from-top-2">
                                                <FormLabel>Describe your Audience</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Amateur photographers interested in film" {...field} className="h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="goalType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign Goal</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="What is the goal?" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {GOAL_OPTIONS.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch("goalType") === "Other" && (
                                    <FormField
                                        control={form.control}
                                        name="otherGoal"
                                        render={({ field }) => (
                                            <FormItem className="animate-in fade-in slide-in-from-top-2">
                                                <FormLabel>Describe your Goal</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Invite users to a beta testing program" {...field} className="h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                <FormField
                                    control={form.control}
                                    name="toneType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tone of Voice</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="Choose a tone" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {TONE_OPTIONS.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch("toneType") === "Other" && (
                                    <FormField
                                        control={form.control}
                                        name="otherTone"
                                        render={({ field }) => (
                                            <FormItem className="animate-in fade-in slide-in-from-top-2">
                                                <FormLabel>Describe your Tone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Sarcastic, edgy and modern" {...field} className="h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="imageDensity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Image Density</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="How many images?" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {IMAGE_COUNT_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="instructions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Additional Instructions</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Anything else Claude should know?" 
                                                    className="resize-none min-h-[100px]" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <DialogFooter className="flex gap-2 pt-4 border-t">
                            {step > 1 && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setStep(step - 1)}
                                    className="flex-1 h-11"
                                >
                                    Back
                                </Button>
                            )}
                            {step < 3 ? (
                                <Button 
                                    type="button" 
                                    onClick={() => setStep(step + 1)}
                                    className="flex-1 h-11 bg-primary hover:bg-primary/90"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button 
                                    type="button" 
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={isPending}
                                    className="flex-1 h-11 bg-primary hover:bg-primary/90"
                                >
                                    {isPending ? "Generating..." : "Generate Email"}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
