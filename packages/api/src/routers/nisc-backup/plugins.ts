import { protectedProcedure, router } from "../../trpc";
import { NiscBackupListResponse, Plugin, PluginPackage } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupPluginsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<Plugin>>("listPlugins", input);
    }),

  listPackages: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<PluginPackage>>("listPluginPackages", input);
    }),

  listRepositories: protectedProcedure.query(async () => {
    return niscBackupCall("listRepositories");
  }),

  manageRepository: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify"]),
      _id: z.string().optional(),
      url: z.string(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageRepositories", input);
    }),

  deleteRepository: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteRepository", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<Plugin>("getPlugin", input);
    }),

  manage: protectedProcedure
    .input(z.object({
      _id: z.string(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("managePlugin", input);
    }),

  install: protectedProcedure
    .input(z.object({
      package_id: z.string().optional(),
      zip_path: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("installPlugin", input);
    }),

  uninstall: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("uninstallPlugin", input);
    }),

  update: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("updatePlugin", input);
    }),

  listFiles: protectedProcedure.query(async () => {
    return niscBackupCall("listPluginFiles");
  }),

  manageSecurity: protectedProcedure
    .input(z.object({ enabled: z.number().optional() }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageSecurityPlugin", input);
    }),
});
