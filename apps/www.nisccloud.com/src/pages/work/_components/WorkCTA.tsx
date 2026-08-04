import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export default function WorkCTA() {
  const navigate = useNavigate();

  return (
    <section className="px-4 md:px-8 pb-16 bg-background">
      <div className="max-w-6xl mx-auto rounded-xl border border-border p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold mb-1">
              Let{"'"}s plan your <span className="text-primary">next step</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Book a free strategy call and we will map clear hosting and marketing next steps for your business.
            </p>
          </div>
          <Button
            onClick={() => navigate("/contact")}
            className="gap-2 cursor-pointer shrink-0"
          >
            Get Your Free Strategy Call
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
