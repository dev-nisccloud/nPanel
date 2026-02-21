import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../trpc";
import { createConnection, readFrame, sendFrame } from "../../lib/epp/epp-client";
import { buildLoginXml, buildLogoutXml, buildDomainTransferXml } from "../../lib/epp/epp-xml";
import { getKenicEppConfig } from "../../lib/epp/kenic-config";
import { getEppResult, getResData } from "../../lib/epp/epp-response";
import { validateKenicDomains } from "../../lib/epp/kenic-tlds";

const parser = new XMLParser({ ignoreAttributes: false });

const domainTransferInputSchema = z.object({
	name: z.string().min(1),
	authCode: z.string().min(1, "Auth code from losing registrar is required"),
	roid: z.string().optional(),
	period: z.number().int().min(1).max(10).optional(),
});

/**
 * KENIC EPP domain transfer (RFC 5731, op="request").
 * Initiates transfer of a domain to us (gaining registrar). Auth code must be obtained from current registrar.
 */
export const kenicDomainTransferRouter = router({
	request: publicProcedure
		.input(domainTransferInputSchema)
		.mutation(async ({ input }) => {
			const validation = validateKenicDomains([input.name]);
			if (!validation.valid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Only KENIC TLDs are supported. Domain: ${input.name}. Use kenic.tlds.list for supported TLDs.`,
					cause: { invalidDomains: validation.invalidDomains },
				});
			}

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

				const transferXml = buildDomainTransferXml({
					name: input.name,
					authCode: input.authCode,
					roid: input.roid,
					period: input.period,
				});
				sendFrame(socket, transferXml);
				const transferResponseBuffer = await readFrame(socket);
				const transferResponseXml = transferResponseBuffer.toString("utf8");
				const transferParsed = parser.parse(transferResponseXml) as Record<string, unknown>;
				const transferResult = getEppResult(transferParsed);

				sendFrame(socket, buildLogoutXml());
				await readFrame(socket);

				// 1000 = completed (auto-approved), 1001 = pending (awaiting losing registrar approval)
				if (transferResult.code !== "1000" && transferResult.code !== "1001") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: transferResult.msg,
						cause: transferResult.extValue,
					});
				}

				const resData = getResData(transferParsed);
				const trnData = resData?.["domain:trnData"] as Record<string, unknown> | undefined;
				const name = trnData?.["domain:name"] as string | undefined;
				const trStatus = trnData?.["domain:trStatus"] as string | undefined;
				const reId = trnData?.["domain:reId"] as string | undefined;
				const reDate = trnData?.["domain:reDate"] as string | undefined;
				const acId = trnData?.["domain:acId"] as string | undefined;
				const acDate = trnData?.["domain:acDate"] as string | undefined;
				const exDate = trnData?.["domain:exDate"] as string | undefined;

				return {
					success: true,
					pending: transferResult.code === "1001",
					domain: name ?? input.name,
					trStatus: trStatus ?? null,
					reId: reId ?? null,
					reDate: reDate ?? null,
					acId: acId ?? null,
					acDate: acDate ?? null,
					exDate: exDate ?? null,
					raw: transferResponseXml,
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
					message: `KENIC domain transfer failed: ${message}`,
					cause: error,
				});
			} finally {
				socket?.destroy();
			}
		}),
});
