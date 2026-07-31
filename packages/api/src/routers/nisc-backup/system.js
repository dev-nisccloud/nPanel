import { protectedProcedure, router } from "../../trpc";
import { niscBackupCall } from "./_helpers";
export const niscBackupSystemRouter = router({
    getMasterEncryptionKey: protectedProcedure.query(async () => {
        return niscBackupCall("getMasterEncryptionKey");
    }),
    factoryReset: protectedProcedure.mutation(async () => {
        return niscBackupCall("factoryReset");
    }),
    exitDisasterRecovery: protectedProcedure.mutation(async () => {
        return niscBackupCall("exitDisasterRecovery");
    }),
    approveAgreement: protectedProcedure.mutation(async () => {
        return niscBackupCall("approveAgreement");
    }),
    approveShowcase: protectedProcedure.mutation(async () => {
        return niscBackupCall("approveShowcase");
    }),
    listShowcase: protectedProcedure.query(async () => {
        return niscBackupCall("listShowcase");
    }),
});
