import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import prisma from "@nPanel/db";
import {
	contactCreateInputSchema,
	contactUpdateInputSchema,
	contactListFiltersSchema,
	contactDetailSchema,
	contactListResponseSchema,
} from "./schemas";

export const emailMarketingContactsRouter = router({
	/**
	 * Create a new contact
	 */
	create: protectedProcedure
		.input(contactCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				// Create contact and activity log in a single transaction
				const now = new Date();
				const contact = await prisma.$transaction(async (tx) => {
					const newContact = await tx.contact.create({
						data: {
							id: crypto.randomUUID(),
							email: input.email,
							firstName: input.firstName ?? null,
							lastName: input.lastName ?? null,
							phone: input.phone ?? null,
							company: input.company ?? null,
							jobTitle: input.jobTitle ?? null,
							address: input.address ?? null,
							city: input.city ?? null,
							state: input.state ?? null,
							country: input.country ?? null,
							postalCode: input.postalCode ?? null,
							status: "ACTIVE",
							customFields: input.customFields ?? undefined,
							userId,
							teamId: input.teamId ?? null,
							createdAt: now,
							updatedAt: now,
						},
					});

					await tx.contactActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId,
							contactId: newContact.id,
							action: "CREATE",
							description: `Contact ${input.email} created`,
							createdAt: now,
						},
					});

					return newContact;
				});

				return contactDetailSchema.parse({
					...contact,
					firstName: contact.firstName ?? null,
					lastName: contact.lastName ?? null,
					phone: contact.phone ?? null,
					company: contact.company ?? null,
					jobTitle: contact.jobTitle ?? null,
					address: contact.address ?? null,
					city: contact.city ?? null,
					state: contact.state ?? null,
					country: contact.country ?? null,
					postalCode: contact.postalCode ?? null,
					customFields: contact.customFields ?? null,
					lastContactedAt: contact.lastContactedAt ?? null,
					unsubscribedAt: contact.unsubscribedAt ?? null,
					teamId: contact.teamId ?? null,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error creating contact:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create contact",
					cause: error,
				});
			}
		}),

	/**
	 * Get contact by ID
	 */
	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const contact = await prisma.contact.findUnique({
					where: { id: input.id },
				});

				if (!contact) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Contact not found",
					});
				}

				// Check access
				if (contact.userId !== userId) {
					if (contact.teamId) {
						const teamMember = await prisma.teamMember.findUnique({
							where: {
								teamId_userId: {
									teamId: contact.teamId,
									userId,
								},
							},
						});

						if (!teamMember) {
							throw new TRPCError({
								code: "FORBIDDEN",
								message: "Access denied",
							});
						}
					} else {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "Access denied",
						});
					}
				}

				return contactDetailSchema.parse({
					...contact,
					firstName: contact.firstName ?? null,
					lastName: contact.lastName ?? null,
					phone: contact.phone ?? null,
					company: contact.company ?? null,
					jobTitle: contact.jobTitle ?? null,
					address: contact.address ?? null,
					city: contact.city ?? null,
					state: contact.state ?? null,
					country: contact.country ?? null,
					postalCode: contact.postalCode ?? null,
					customFields: contact.customFields ?? null,
					lastContactedAt: contact.lastContactedAt ?? null,
					unsubscribedAt: contact.unsubscribedAt ?? null,
					teamId: contact.teamId ?? null,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error fetching contact:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch contact",
					cause: error,
				});
			}
		}),

	/**
	 * List contacts with filters
	 */
	list: protectedProcedure
		.input(contactListFiltersSchema)
		.query(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const where: any = {
					OR: [
						{ userId },
						...(input.teamId
							? [
									{
										teamId: input.teamId,
										team: {
											members: {
												some: { userId },
											},
										},
									},
								]
							: []),
					],
				};

				if (input.status) {
					where.status = input.status;
				}

				if (input.search) {
					where.OR = [
						...(where.OR || []),
						{ email: { contains: input.search, mode: "insensitive" } },
						{ firstName: { contains: input.search, mode: "insensitive" } },
						{ lastName: { contains: input.search, mode: "insensitive" } },
					];
				}

				const [contacts, total] = await Promise.all([
					prisma.contact.findMany({
						where,
						skip: input.offset,
						take: input.limit,
						orderBy: { createdAt: "desc" },
					}),
					prisma.contact.count({ where }),
				]);

				return contactListResponseSchema.parse({
					contacts: contacts.map((c) => ({
						...c,
						firstName: c.firstName ?? null,
						lastName: c.lastName ?? null,
						teamId: c.teamId ?? null,
					})),
					total,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error listing contacts:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to list contacts",
					cause: error,
				});
			}
		}),

	/**
	 * Update contact
	 */
	update: protectedProcedure
		.input(contactUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const contact = await prisma.contact.findUnique({
					where: { id: input.id },
				});

				if (!contact) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Contact not found",
					});
				}

				// Check access
				if (contact.userId !== userId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Access denied",
					});
				}

				// Update contact and create activity log in a single transaction
				const updatedContact = await prisma.$transaction(async (tx) => {
					const updated = await tx.contact.update({
						where: { id: input.id },
						data: {
							...(input.email && { email: input.email }),
							...(input.firstName !== undefined && {
								firstName: input.firstName,
							}),
							...(input.lastName !== undefined && { lastName: input.lastName }),
							...(input.phone !== undefined && { phone: input.phone }),
							...(input.company !== undefined && { company: input.company }),
							...(input.jobTitle !== undefined && { jobTitle: input.jobTitle }),
							...(input.address !== undefined && { address: input.address }),
							...(input.city !== undefined && { city: input.city }),
							...(input.state !== undefined && { state: input.state }),
							...(input.country !== undefined && { country: input.country }),
							...(input.postalCode !== undefined && {
								postalCode: input.postalCode,
							}),
							...(input.status && { status: input.status }),
							...(input.customFields !== undefined && {
								customFields: input.customFields ?? undefined,
							}),
							updatedAt: new Date(),
						},
					});

					await tx.contactActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId,
							contactId: contact.id,
							action: "UPDATE",
							description: `Contact ${contact.email} updated`,
							createdAt: new Date(),
						},
					});

					return updated;
				});

				return contactDetailSchema.parse({
					...updatedContact,
					firstName: updatedContact.firstName ?? null,
					lastName: updatedContact.lastName ?? null,
					phone: updatedContact.phone ?? null,
					company: updatedContact.company ?? null,
					jobTitle: updatedContact.jobTitle ?? null,
					address: updatedContact.address ?? null,
					city: updatedContact.city ?? null,
					state: updatedContact.state ?? null,
					country: updatedContact.country ?? null,
					postalCode: updatedContact.postalCode ?? null,
					customFields: updatedContact.customFields ?? null,
					lastContactedAt: updatedContact.lastContactedAt ?? null,
					unsubscribedAt: updatedContact.unsubscribedAt ?? null,
					teamId: updatedContact.teamId ?? null,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error updating contact:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update contact",
					cause: error,
				});
			}
		}),

	/**
	 * Delete contact
	 */
	delete: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const contact = await prisma.contact.findUnique({
					where: { id: input.id },
				});

				if (!contact) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Contact not found",
					});
				}

				// Check access
				if (contact.userId !== userId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Access denied",
					});
				}

				await prisma.contact.delete({
					where: { id: input.id },
				});

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error deleting contact:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete contact",
					cause: error,
				});
			}
		}),

	/**
	 * Unsubscribe contact
	 */
	unsubscribe: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "User session not found",
					});
				}

				const contact = await prisma.contact.findUnique({
					where: { id: input.id },
				});

				if (!contact) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Contact not found",
					});
				}

				// Update contact and create activity log in a single transaction
				const updatedContact = await prisma.$transaction(async (tx) => {
					const updated = await tx.contact.update({
						where: { id: input.id },
						data: {
							status: "UNSUBSCRIBED",
							unsubscribedAt: new Date(),
							updatedAt: new Date(),
						},
					});

					await tx.contactActivityLog.create({
						data: {
							id: crypto.randomUUID(),
							userId,
							contactId: contact.id,
							action: "UNSUBSCRIBE",
							description: `Contact ${contact.email} unsubscribed`,
							createdAt: new Date(),
						},
					});

					return updated;
				});

				return contactDetailSchema.parse({
					...updatedContact,
					firstName: updatedContact.firstName ?? null,
					lastName: updatedContact.lastName ?? null,
					phone: updatedContact.phone ?? null,
					company: updatedContact.company ?? null,
					jobTitle: updatedContact.jobTitle ?? null,
					address: updatedContact.address ?? null,
					city: updatedContact.city ?? null,
					state: updatedContact.state ?? null,
					country: updatedContact.country ?? null,
					postalCode: updatedContact.postalCode ?? null,
					customFields: updatedContact.customFields ?? null,
					lastContactedAt: updatedContact.lastContactedAt ?? null,
					unsubscribedAt: updatedContact.unsubscribedAt ?? null,
					teamId: updatedContact.teamId ?? null,
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error unsubscribing contact:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to unsubscribe contact",
					cause: error,
				});
			}
		}),
});
