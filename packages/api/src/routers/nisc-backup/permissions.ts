import { protectedProcedure, router } from "../../trpc";
import { niscBackupCall } from "./_helpers";

export const niscBackupPermissionsRouter = router({
  list: protectedProcedure.query(async () => {
    return niscBackupCall("listPermissions");
  }),
});
