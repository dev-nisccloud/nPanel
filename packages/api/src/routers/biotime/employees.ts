import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { runBioTime } from "./call";

const listInput = z.object({
	page: z.number().int().min(1).optional(),
	pageSize: z.number().int().min(1).max(500).optional(),
	empCode: z.string().trim().min(1).max(64).optional(),
	firstName: z.string().trim().min(1).max(80).optional(),
	lastName: z.string().trim().min(1).max(80).optional(),
	department: z.number().int().optional(),
	appStatus: z.number().int().optional(),
});

export const biotimeEmployeesRouter = router({
	list: protectedProcedure.input(listInput.optional()).query(({ input }) =>
		runBioTime((client) => client.listEmployees(input ?? {})),
	),

	get: protectedProcedure
		.input(z.object({ id: z.string().trim().min(1).max(80) }))
		.query(({ input }) => runBioTime((client) => client.getEmployee(input.id))),
});
