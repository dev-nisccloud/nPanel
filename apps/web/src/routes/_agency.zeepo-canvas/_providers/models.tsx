import { createContext, useContext, useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export type ZeepoModelEntry = {
  id: string;
  label: string;
  uiname: string;
  provider: string;
  description: string;
  category: "text" | "image" | "video" | "audio" | "background-remover";
  default?: boolean;
};

// Map to Tersa's expected format
type TersaAdaptedModel = {
  label: string;
  chef: { id: string; label: string; icon: any };
  providers: {
    id: string;
    label: string;
    icon: any;
    model: string;
    getCost: () => number;
  }[];
  priceIndicator?: "lowest" | "low" | "high" | "highest";
};

interface ModelsContextType {
  models: Record<string, TersaAdaptedModel>;
  imageModels: Record<string, TersaAdaptedModel>;
  videoModels: Record<string, TersaAdaptedModel>;
  audioModels: Record<string, TersaAdaptedModel>;
  backgroundRemoverModels: Record<string, TersaAdaptedModel>;
}

const ModelsContext = createContext<ModelsContextType | undefined>(undefined);

export const useGateway = () => {
  const context = useContext(ModelsContext);
  if (!context) {
    throw new Error("useGateway must be used within a ModelsProvider");
  }
  return context;
};

const adaptToTersaFormat = (models: ZeepoModelEntry[]): Record<string, TersaAdaptedModel> => {
  const result: Record<string, TersaAdaptedModel> = {};
  for (const model of models) {
    // We mock the chef/provider structure since Replicate doesn't perfectly map to AI SDK Gateway structure
    result[model.id] = {
      label: model.uiname,
      chef: { id: "replicate", label: "Replicate", icon: () => null },
      providers: [
        {
          id: model.provider.toLowerCase().replace(/\s+/g, "-"),
          label: model.provider,
          icon: () => null,
          model: model.id,
          getCost: () => 0,
        },
      ],
      priceIndicator: "low",
    };
  }
  return result;
};

export const ModelsProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = trpc.zeepoCanvas.models.getModels.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const value = useMemo(() => {
    if (!data?.data) {
      return { models: {}, imageModels: {}, videoModels: {}, audioModels: {}, backgroundRemoverModels: {} };
    }

    return {
      models: adaptToTersaFormat(data.data.text || []),
      imageModels: adaptToTersaFormat(data.data.image || []),
      videoModels: adaptToTersaFormat(data.data.video || []),
      audioModels: adaptToTersaFormat(data.data.audio || []),
      backgroundRemoverModels: adaptToTersaFormat(data.data["background-remover"] || []),
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Spinner size={32} variant="bars" />
          <p className="font-medium text-sm">Loading AI Models...</p>
        </div>
      </div>
    );
  }

  return <ModelsContext.Provider value={value}>{children}</ModelsContext.Provider>;
};
