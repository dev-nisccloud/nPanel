import { protectedProcedure, router } from "../../trpc";
import { z } from "zod";
import { jetbackupCall } from "./_helpers";

const settingsInput = z.record(z.string(), z.unknown());

export const jetbackupSettingsRouter = router({
  getRestore: protectedProcedure.query(async () => {
    return jetbackupCall("getSettingsRestore");
  }),

  manageRestore: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ input }) => {
      return jetbackupCall("manageSettingsRestore", input);
    }),

  getSecurity: protectedProcedure.query(async () => {
    return jetbackupCall("getSettingsSecurity");
  }),

  manageSecurity: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ input }) => {
      return jetbackupCall("manageSettingsSecurity", input);
    }),

  getPrivacy: protectedProcedure.query(async () => {
    return jetbackupCall("getSettingsPrivacy");
  }),

  managePrivacy: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ input }) => {
      return jetbackupCall("manageSettingsPrivacy", input);
    }),

  getPanel: protectedProcedure.query(async () => {
    return jetbackupCall("getSettingsPanel");
  }),

  managePanel: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ input }) => {
      return jetbackupCall("manageSettingsPanel", input);
    }),

  getSnapshots: protectedProcedure.query(async () => {
    return jetbackupCall("getSettingsSnapshots");
  }),

  manageSnapshots: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ input }) => {
      return jetbackupCall("manageSettingsSnapshots", input);
    }),

  getBinary: protectedProcedure.query(async () => {
    return jetbackupCall("getSettingsBinary");
  }),

  manageBinary: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ input }) => {
      return jetbackupCall("manageSettingsBinary", input);
    }),

  getResource: protectedProcedure.query(async () => {
    return jetbackupCall("getSettingsResource");
  }),

  manageResource: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ input }) => {
      return jetbackupCall("manageSettingsResource", input);
    }),

  listNotificationIntegrationTypes: protectedProcedure.query(async () => {
    return jetbackupCall("listNotificationIntegrationTypes");
  }),

  listEnabledNotificationIntegrations: protectedProcedure.query(async () => {
    return jetbackupCall("listEnabledNotificationIntegrations");
  }),

  getEnabledNotificationIntegration: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ input }) => {
      return jetbackupCall("getEnabledNotificationIntegration", input);
    }),

  deleteEnabledNotificationIntegration: protectedProcedure
    .input(z.object({ type: z.string() }))
    .mutation(async ({ input }) => {
      return jetbackupCall("deleteEnabledNotificationIntegration", input);
    }),
});
