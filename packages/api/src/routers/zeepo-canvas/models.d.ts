export type ZeepoModel = {
    id: string;
    label: string;
    uiname: string;
    provider: string;
    description: string;
    category: "text" | "image" | "video" | "audio" | "background-remover";
    default?: boolean;
    capabilities?: {
        images?: boolean;
        audio?: boolean;
        video?: boolean;
        thinking?: boolean;
        audio_generation?: boolean;
        /** Optimised for graphic design: logos, business cards, flyers, banners, UI mockups */
        design?: boolean;
    };
};
export declare const MODELS: ZeepoModel[];
export declare const zeepoCanvasModelsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getModels: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            data: Record<string, ZeepoModel[]>;
        };
        meta: object;
    }>;
}>>;
