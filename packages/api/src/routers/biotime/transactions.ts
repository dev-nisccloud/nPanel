import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { runBioTime } from "./call";

const dateTime = z
	.string()
	.trim()
	.regex(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/, "Use a date and time such as 2026-11-01 00:00:00.")
	.transform((value) => value.replace("T", " "));

const listInput = z.object({
	page: z.number().int().min(1).optional(),
	pageSize: z.number().int().min(1).max(500).optional(),
	empCode: z.string().trim().min(1).max(64).optional(),
	terminalSn: z.string().trim().min(1).max(64).optional(),
	startTime: dateTime.optional(),
	endTime: dateTime.optional(),
});

export const biotimeTransactionsRouter = router({
	list: protectedProcedure.input(listInput.optional()).query(({ input }) =>
		runBioTime((client) => client.listTransactions(input ?? {})),
	),
});
