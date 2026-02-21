import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../trpc";
import { createConnection, readFrame, sendFrame } from "../../lib/epp/epp-client";
import { buildLoginXml, buildLogoutXml, buildContactCreateXml } from "../../lib/epp/epp-xml";
import type { ContactCreateParams, ContactCreatePostalInfo } from "../../lib/epp/epp-xml";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";
import { getEppResult, getResData } from "../../lib/epp/epp-response";

const parser = new XMLParser({ ignoreAttributes: false });

const postalInfoSchema = z.object({
	name: z.string().min(1),
	org: z.string().optional(),
	street: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
	city: z.string().min(1),
	sp: z.string().optional(),
	pc: z.string().min(1),
	cc: z.string().length(2),
});

const contactCreateInputSchema = z.object({
	id: z.string().min(1, "Contact id is required"),
	postalInfo: z.union([
		postalInfoSchema,
		z.tuple([postalInfoSchema, postalInfoSchema]),
	]),
	voice: z.string().min(1, "Voice is required"),
	fax: z.string().optional(),
	email: z.string().email(),
	authInfo: z.string().optional(),
	disclose: z
		.object({
			flag: z.union([z.literal(0), z.literal(1)]),
			elements: z
				.array(z.enum(["name", "org", "addr", "voice", "fax", "email"]))
				.optional(),
		})
		.optional(),
});

/**
 * KENIC EPP contact create (RFC 3733).
 * Create a contact (registrant/admin/tech) to use in domain create.
 */
export const kenicContactCreateRouter = router({
	create: publicProcedure
		.input(contactCreateInputSchema)
		.mutation(async ({ input }) => {
			let socket;
			try {
				const config = getKenicEppConfig(true);
				socket = await createConnection(config);

				await readFrame(socket);

				sendFrame(socket, buildLoginXml(config.username, config.password));
				const loginResponseBuffer = await readFrame(socket);
				const loginParsed = parser.parse(loginResponseBuffer.toString("utf8")) as Record<string, unknown>;
				const loginResult = getEppResult(loginParsed);
				if (loginResult.code !== "1000") {
					sendFrame(socket, buildLogoutXml());
					await readFrame(socket);
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `EPP login failed: ${loginResult.msg}`,
						cause: loginResult.extValue,
					});
				}

				const params: ContactCreateParams = {
					id: input.id,
					postalInfo: input.postalInfo as ContactCreatePostalInfo | [ContactCreatePostalInfo, ContactCreatePostalInfo],
					voice: input.voice,
					email: input.email,
				};
				if (input.fax != null) params.fax = input.fax;
				if (input.authInfo != null) params.authInfo = input.authInfo;
				if (input.disclose != null) params.disclose = input.disclose;

				const createXml = buildContactCreateXml(params);
				sendFrame(socket, createXml);
				const createResponseBuffer = await readFrame(socket);
				const createResponseXml = createResponseBuffer.toString("utf8");
				const createParsed = parser.parse(createResponseXml) as Record<string, unknown>;
				const createResult = getEppResult(createParsed);

				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				if (createResult.code !== "1000") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: createResult.msg,
						cause: createResult.extValue,
					});
				}

				const resData = getResData(createParsed);
				const creData = resData?.["contact:creData"] as Record<string, unknown> | undefined;
				const contactId = creData?.["contact:id"] as string | undefined;
				const crDate = creData?.["contact:crDate"] as string | undefined;

				return {
					success: true,
					contactId: contactId ?? input.id,
					crDate: crDate ?? null,
					raw: createResponseXml,
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				const message = error instanceof Error ? error.message : String(error);
				if (message.includes("KENIC_EPP_USERNAME") || message.includes("KENIC_EPP_PASSWORD")) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "KENIC_EPP_USERNAME and KENIC_EPP_PASSWORD are required",
					});
				}
				const isTimeout = message.toLowerCase().includes("timeout");
				const isRefused =
					message.toLowerCase().includes("econnrefused") ||
					message.toLowerCase().includes("connection refused");
				throw new TRPCError({
					code: isTimeout ? "TIMEOUT" : isRefused ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
					message: `KENIC contact create failed: ${message}`,
					cause: error,
				});
			} finally {
				socket?.destroy();
			}
		}),
});
