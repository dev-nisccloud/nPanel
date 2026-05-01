import {
  CheckIcon,
  ChevronDownIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  providers,
  type TersaModel,
  type TersaProvider,
} from "@/routes/_agency.zeepo-canvas/_lib/providers";
import { cn } from "@/routes/_agency.zeepo-canvas/_lib/utils";
import type { PriceBracket } from "@/routes/_agency.zeepo-canvas/_providers/gateway/client";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface ModelSelectorProps {
  id?: string;
  options: Record<string, TersaModel>;
  value: string;
  width?: number | string;
  className?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const getCostBracketIcon = (bracket: PriceBracket, className?: string) => {
  switch (bracket) {
    case "lowest":
      return (
        <ChevronsDownIcon
          className={cn("text-green-500 dark:text-green-400", className)}
          size={16}
        />
      );
    case "low":
      return (
        <ChevronDownIcon
          className={cn("text-blue-500 dark:text-blue-400", className)}
          size={16}
        />
      );
    case "high":
      return (
        <ChevronUpIcon
          className={cn("text-orange-500 dark:text-orange-400", className)}
          size={16}
        />
      );
    case "highest":
      return (
        <ChevronsUpIcon
          className={cn("text-red-500 dark:text-red-400", className)}
          size={16}
        />
      );
    default:
      return null;
  }
};

const getCostBracketLabel = (bracket: PriceBracket) => {
  switch (bracket) {
    case "lowest":
      return "This model uses a lot less credits.";
    case "low":
      return "This model uses less credits.";
    case "high":
      return "This model uses more credits.";
    case "highest":
      return "This model uses a lot of credits.";
    default:
      return "";
  }
};

const getModelDisabled = (model: TersaModel) => {
  if (model.disabled) {
    return true;
  }

  return false;
};

const CommandGroupHeading = ({ data }: { data: TersaProvider }) => (
  <div className="flex items-center gap-2">
    <data.icon className="size-4 shrink-0" />
    <span className="block truncate">{data.name}</span>
  </div>
);

const ModelIcon = ({
  data,
  chef,
  className,
}: {
  data: TersaModel;
  chef: TersaProvider;
  className?: string;
}) => {
  if (data.icon) {
    return <data.icon className={cn("size-4 shrink-0", className)} />;
  }

  return <chef.icon className={cn("size-4 shrink-0", className)} />;
};

export const ModelSelector = ({
  id,
  value,
  options,
  width = 250,
  className,
  onChange,
  disabled,
}: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const activeModel = options[value];

  useEffect(() => {
    if (value && !options[value]) {
      onChange?.(Object.keys(options)[0]);
    }
  }, [value, options, onChange]);

  const groupedOptions = Object.entries(options).reduce(
    (acc, [modelId, model]) => {
      const chef = model.chef.id;

      if (!acc[chef]) {
        acc[chef] = {};
      }

      acc[chef][modelId] = model;
      return acc;
    },
    {} as Record<string, Record<string, TersaModel>>
  );

  const sortedChefs = Object.keys(groupedOptions).sort((a, b) => {
    const aName = Object.values(providers)
      .find((provider) => provider.id === a)
      ?.name.toLowerCase();
    const bName = Object.values(providers)
      .find((provider) => provider.id === b)
      ?.name.toLowerCase();

    return aName?.localeCompare(bName ?? "") ?? 0;
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        asChild
        className={className}
        disabled={disabled}
        id={id}
        style={{ width }}
      >
        <Button className="w-full" variant="outline">
          {activeModel ? (
            <div className="flex w-full items-center gap-2 overflow-hidden">
              <span className="block truncate">{activeModel.label}</span>
            </div>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Select a model</DialogTitle>
        </DialogHeader>
        <Command>
          <div className="[&>div]:h-12">
            <CommandInput placeholder="Search for a model..." />
          </div>
          <CommandList>
            <CommandEmpty />
            {sortedChefs.map((chef) => (
              <CommandGroup key={chef}>
                {Object.entries(groupedOptions[chef]).map(
                  ([modelKey, model]) => (
                    <CommandItem
                      className={cn(
                        "mb-1 rounded-md py-2",
                        value === modelKey &&
                          "bg-primary text-primary-foreground data-[selected=true]:bg-primary/80 data-[selected=true]:text-primary-foreground"
                      )}
                      disabled={getModelDisabled(model)}
                      key={modelKey}
                      onSelect={() => {
                        onChange?.(modelKey);
                        setOpen(false);
                      }}
                      value={modelKey}
                    >
                      <div className="flex flex-1 items-center gap-2 overflow-hidden">
                        <span className="block truncate">{model.label}</span>
                      </div>
                      {value === modelKey && (
                        <CheckIcon className="size-4 shrink-0 text-primary-foreground" />
                      )}
                    </CommandItem>
                  )
                )}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
