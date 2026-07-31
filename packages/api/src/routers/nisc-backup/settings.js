import { protectedProcedure, router } from "../../trpc";
import { z } from "zod";
import { niscBackupCall } from "./_helpers";
const settingsInput = z.record(z.string(), z.unknown());
export const niscBackupSettingsRouter = router({
    getRestore: protectedProcedure.query(async () => {
        return niscBackupCall("getSettingsRestore");
    }),
    manageRestore: protectedProcedure
        .input(settingsInput)
        .mutation(async ({ input }) => {
        return niscBackupCall("manageSettingsRestore", input);
    }),
    getSecurity: protectedProcedure.query(async () => {
        return niscBackupCall("getSettingsSecurity");
    }),
    manageSecurity: protectedProcedure
        .input(settingsInput)
        .mutation(async ({ input }) => {
        return niscBackupCall("manageSettingsSecurity", input);
    }),
    getPrivacy: protectedProcedure.query(async () => {
        return niscBackupCall("getSettingsPrivacy");
    }),
    managePrivacy: protectedProcedure
        .input(settingsInput)
        .mutation(async ({ input }) => {
        return niscBackupCall("manageSettingsPrivacy", input);
    }),
    getPanel: protectedProcedure.query(async () => {
        return niscBackupCall("getSettingsPanel");
    }),
    managePanel: protectedProcedure
        .input(settingsInput)
        .mutation(async ({ input }) => {
        return niscBackupCall("manageSettingsPanel", input);
    }),
    getSnapshots: protectedProcedure.query(async () => {
        return niscBackupCall("getSettingsSnapshots");
    }),
    manageSnapshots: protectedProcedure
        .input(settingsInput)
        .mutation(async ({ input }) => {
        return niscBackupCall("manageSettingsSnapshots", input);
    }),
    getBinary: protectedProcedure.query(async () => {
        return niscBackupCall("getSettingsBinary");
    }),
    manageBinary: protectedProcedure
        .input(settingsInput)
        .mutation(async ({ input }) => {
        return niscBackupCall("manageSettingsBinary", input);
    }),
    getResource: protectedProcedure.query(async () => {
        return niscBackupCall("getSettingsResource");
    }),
    manageResource: protectedProcedure
        .input(settingsInput)
        .mutation(async ({ input }) => {
        return niscBackupCall("manageSettingsResource", input);
    }),
    listNotificationIntegrationTypes: protectedProcedure.query(async () => {
        return niscBackupCall("listNotificationIntegrationTypes");
    }),
    listEnabledNotificationIntegrations: protectedProcedure.query(async () => {
        return niscBackupCall("listEnabledNotificationIntegrations");
    }),
    getEnabledNotificationIntegration: protectedProcedure
        .input(z.object({ type: z.string() }))
        .query(async ({ input }) => {
        return niscBackupCall("getEnabledNotificationIntegration", input);
    }),
    deleteEnabledNotificationIntegration: protectedProcedure
        .input(z.object({ type: z.string() }))
        .mutation(async ({ input }) => {
        return niscBackupCall("deleteEnabledNotificationIntegration", input);
    }),
});
