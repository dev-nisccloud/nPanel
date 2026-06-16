import { protectedProcedure, router } from "../../trpc";
import { JetBackupListResponse, Plugin, PluginPackage } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";
export const jetbackupPluginsRouter = router({
    list: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return jetbackupCall("listPlugins", input);
    }),
    listPackages: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return jetbackupCall("listPluginPackages", input);
    }),
    listRepositories: protectedProcedure.query(async () => {
        return jetbackupCall("listRepositories");
    }),
    manageRepository: protectedProcedure
        .input(z.object({
        action: z.enum(["create", "modify"]),
        _id: z.string().optional(),
        url: z.string(),
    }))
        .mutation(async ({ input }) => {
        return jetbackupCall("manageRepositories", input);
    }),
    deleteRepository: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return jetbackupCall("deleteRepository", input);
    }),
    get: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return jetbackupCall("getPlugin", input);
    }),
    manage: protectedProcedure
        .input(z.object({
        _id: z.string(),
        enabled: z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        return jetbackupCall("managePlugin", input);
    }),
    install: protectedProcedure
        .input(z.object({
        package_id: z.string().optional(),
        zip_path: z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        return jetbackupCall("installPlugin", input);
    }),
    uninstall: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return jetbackupCall("uninstallPlugin", input);
    }),
    update: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return jetbackupCall("updatePlugin", input);
    }),
    listFiles: protectedProcedure.query(async () => {
        return jetbackupCall("listPluginFiles");
    }),
    manageSecurity: protectedProcedure
        .input(z.object({ enabled: z.number().optional() }))
        .mutation(async ({ input }) => {
        return jetbackupCall("manageSecurityPlugin", input);
    }),
});
