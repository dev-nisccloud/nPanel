import { router } from "../../trpc";
import { biotimeAttendanceRouter } from "./attendance";
import { biotimeAuthRouter } from "./auth";
import { biotimeDevicesRouter } from "./devices";
import { biotimeEmployeesRouter } from "./employees";
import { biotimeTransactionsRouter } from "./transactions";

export const biotimeRouter = router({
	auth: biotimeAuthRouter,
	devices: biotimeDevicesRouter,
	employees: biotimeEmployeesRouter,
	attendance: biotimeAttendanceRouter,
	transactions: biotimeTransactionsRouter,
});
