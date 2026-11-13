import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, db, desc, eq } from "@npanel/db";
import { careerOpening } from "@npanel/db/schema/careers";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { HEARD_ABOUT_OPTIONS, listCareerCountries, listCareerApplications, searchCareerCities } from "../lib/careers/applications";
import { CAREER_STATUSES, careerOpeningIsPublic, careerStatusOnWebsite, type CareerStatus } from "../lib/careers/visibility";

const whenInput = z.string().trim().min(8).max(40).nullable();

const openingFields = z.object({
	title: z.string().trim().min(2).max(160),
	location: z.string().trim().min(2).max(120),
	employmentType: z.string().trim().min(2).max(60),
	summary: z.string().trim().min(10).max(400),
	description: z.string().trim().min(20).max(8000),
	responsibilities: z.string().trim().max(6000).nullable().default(null),
	requirements: z.string().trim().max(6000).nullable().default(null),
	niceToHave: z.string().trim().max(4000).nullable().default(null),
	salaryRange: z.string().trim().max(120).nullable().default(null),
	applyEmail: z.string().trim().email().max(200),
	status: z.enum(CAREER_STATUSES),
	opensOn: whenInput,
	closesOn: whenInput,
});

function instant(value: Date | null): string | null {
	if (!value) return null;
	return value.toISOString();
}

function prepareStatus(input: { status: CareerStatus; opensOn: string | null; closesOn: string | null }) {
	if (input.status === "scheduled") {
		const opens = input.opensOn ? new Date(input.opensOn).getTime() : Number.NaN;
		if (Number.isNaN(opens)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Choose the date and time a scheduled role should appear.",
			});
		}
		if (opens <= Date.now()) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Choose a future date and time. Publish is the action that shows a role immediately.",
			});
		}
		if (input.closesOn && new Date(input.closesOn).getTime() <= opens) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "The closing time has to be after the role appears.",
			});
		}
	}
	return {
		status: input.status,
		published: input.status === "published" || input.status === "scheduled",
	};
}

function dateOrNull(value: string | null): Date | null {
	if (!value) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid date and time." });
	}
	return parsed;
}

function detailFields(input: z.infer<typeof openingFields>) {
	return {
		responsibilities: input.responsibilities || null,
		requirements: input.requirements || null,
		niceToHave: input.niceToHave || null,
		salaryRange: input.salaryRange || null,
	};
}

function slugify(title: string): string {
	const base = title
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
	return base || "role";
}

async function uniqueSlug(title: string, ignoreId?: string): Promise<string> {
	const base = slugify(title);
	for (let n = 0; n < 50; n += 1) {
		const slug = n === 0 ? base : `${base}-${n + 1}`;
		const [existing] = await db
			.select({ id: careerOpening.id })
			.from(careerOpening)
			.where(eq(careerOpening.slug, slug))
			.limit(1);
		if (!existing || existing.id === ignoreId) return slug;
	}
	throw new TRPCError({ code: "CONFLICT", message: "Could not create a unique link for this role." });
}

function toPublic(row: typeof careerOpening.$inferSelect) {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		location: row.location,
		employmentType: row.employmentType,
		summary: row.summary,
		description: row.description,
		responsibilities: row.responsibilities,
		requirements: row.requirements,
		niceToHave: row.niceToHave,
		salaryRange: row.salaryRange,
		applyEmail: row.applyEmail,
		opensOn: instant(row.opensOn),
		closesOn: instant(row.closesOn),
	};
}

const openNow = careerOpeningIsPublic;

export const careersRouter = router({
	list: publicProcedure.query(async () => {
		const rows = await db
			.select()
			.from(careerOpening)
			.where(openNow)
			.orderBy(desc(careerOpening.createdAt));
		return rows.map(toPublic);
	}),

	bySlug: publicProcedure
		.input(z.object({ slug: z.string().trim().min(1).max(120) }))
		.query(async ({ input }) => {
			const [row] = await db
				.select()
				.from(careerOpening)
				.where(and(eq(careerOpening.slug, input.slug), openNow))
				.limit(1);
			return row ? toPublic(row) : null;
		}),

	countries: publicProcedure.query(() => listCareerCountries()),

	cities: publicProcedure
		.input(
			z.object({
				countryCode: z.string().trim().length(2),
				query: z.string().trim().max(60).default(""),
			}),
		)
		.query(({ input }) => searchCareerCities(input.countryCode, input.query)),

	heardAboutOptions: publicProcedure.query(() => [...HEARD_ABOUT_OPTIONS]),

	applications: protectedProcedure.query(() => listCareerApplications()),

	adminList: protectedProcedure.query(async () => {
		const rows = await db.select().from(careerOpening).orderBy(desc(careerOpening.createdAt));
		return rows.map((row) => {
			const item = {
				...toPublic(row),
				status: row.status,
				createdOn: instant(row.createdAt),
			};
			return {
				...item,
				onWebsite: careerStatusOnWebsite(item),
			};
		});
	}),

	create: protectedProcedure.input(openingFields).mutation(async ({ input }) => {
		const id = crypto.randomUUID();
		const slug = await uniqueSlug(input.title);
		const prepared = prepareStatus(input);
		await db.insert(careerOpening).values({
			id,
			slug,
			title: input.title,
			location: input.location,
			employmentType: input.employmentType,
			summary: input.summary,
			description: input.description,
			...detailFields(input),
			applyEmail: input.applyEmail,
			published: prepared.published,
			status: prepared.status,
			opensOn: dateOrNull(input.opensOn),
			closesOn: dateOrNull(input.closesOn),
		});
		return { id, slug, status: prepared.status };
	}),

	update: protectedProcedure
		.input(openingFields.extend({ id: z.string().min(1) }))
		.mutation(async ({ input }) => {
			const [existing] = await db
				.select({ id: careerOpening.id })
				.from(careerOpening)
				.where(eq(careerOpening.id, input.id))
				.limit(1);
			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Role not found." });
			}
			const prepared = prepareStatus(input);
			await db
				.update(careerOpening)
				.set({
					title: input.title,
					location: input.location,
					employmentType: input.employmentType,
					summary: input.summary,
					description: input.description,
					...detailFields(input),
					applyEmail: input.applyEmail,
					published: prepared.published,
					status: prepared.status,
					opensOn: dateOrNull(input.opensOn),
					closesOn: dateOrNull(input.closesOn),
					updatedAt: new Date(),
				})
				.where(eq(careerOpening.id, input.id));
			return { id: input.id, status: prepared.status };
		}),

	remove: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ input }) => {
			await db.delete(careerOpening).where(eq(careerOpening.id, input.id));
			return { id: input.id };
		}),
});
