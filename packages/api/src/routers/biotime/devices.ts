import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { runBioTime } from "./call";

const listInput = z.object({
	page: z.number().int().min(1).optional(),
	pageSize: z.number().int().min(1).max(500).optional(),
	sn: z.string().trim().min(1).max(64).optional(),
	alias: z.string().trim().min(1).max(120).optional(),
	area: z.union([z.string().trim().min(1).max(40), z.number().int()]).optional(),
});

export const biotimeDevicesRouter = router({
	list: protectedProcedure.input(listInput.optional()).query(({ input }) =>
		runBioTime((client) => client.listDevices(input ?? {})),
	),

	all: protectedProcedure.query(() => runBioTime((client) => client.listAllDevices())),

	get: protectedProcedure
		.input(z.object({ id: z.number().int().positive() }))
		.query(({ input }) => runBioTime((client) => client.getDevice(input.id))),
});
