import { protectedProcedure, router } from "../../trpc";
import { jetbackupCall } from "./_helpers";

export const jetbackupPermissionsRouter = router({
  list: protectedProcedure.query(async () => {
    return jetbackupCall("listPermissions");
  }),
});
