import { protectedProcedure, router } from "../../trpc";
import { jetbackupCall } from "./_helpers";
export const jetbackupSystemRouter = router({
    getMasterEncryptionKey: protectedProcedure.query(async () => {
        return jetbackupCall("getMasterEncryptionKey");
    }),
    factoryReset: protectedProcedure.mutation(async () => {
        return jetbackupCall("factoryReset");
    }),
    exitDisasterRecovery: protectedProcedure.mutation(async () => {
        return jetbackupCall("exitDisasterRecovery");
    }),
    approveAgreement: protectedProcedure.mutation(async () => {
        return jetbackupCall("approveAgreement");
    }),
    approveShowcase: protectedProcedure.mutation(async () => {
        return jetbackupCall("approveShowcase");
    }),
    listShowcase: protectedProcedure.query(async () => {
        return jetbackupCall("listShowcase");
    }),
});
