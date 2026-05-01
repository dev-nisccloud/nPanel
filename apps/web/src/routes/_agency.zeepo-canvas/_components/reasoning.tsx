"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useReasoning } from "@/routes/_agency.zeepo-canvas/_hooks/use-reasoning";
import { ReasoningTunnel } from "@/routes/_agency.zeepo-canvas/_tunnels/reasoning";
import { Button } from "./ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export const Reasoning = () => {
  const [reasoning, setReasoning] = useReasoning();

  const handleClose = () => {
    setReasoning({ isReasoning: false, isGenerating: false });
  };

  return (
    <motion.div
      animate={{ width: reasoning.isReasoning ? "24rem" : "0" }}
      className="w-sm overflow-auto border-l bg-background"
      initial={{ width: "0" }}
    >
      <div className="flex size-full flex-col divide-y">
        <div className="sticky top-0 flex items-center justify-between gap-4 bg-background px-4 py-2">
          <div className="flex items-center gap-2">
            {reasoning.isGenerating ? (
              <Spinner className="text-primary" size={16} variant="bars" />
            ) : (
              <CheckIcon className="size-4 text-primary" />
            )}
            <p className="font-semibold text-sm">Reasoning</p>
          </div>
          <Button onClick={handleClose} size="icon" variant="ghost">
            <XIcon className="size-3 text-muted-foreground" />
          </Button>
        </div>
        <div className="whitespace-break-spaces p-4 text-sm leading-normal">
          <ReasoningTunnel.Out />
        </div>
      </div>
    </motion.div>
  );
};
