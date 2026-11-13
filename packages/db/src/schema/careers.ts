import { boolean, date, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/** Roles the agency publishes to the public careers page. */
export const careerOpening = pgTable(
	"career_opening",
	{
		id: text("_id").primaryKey(),
		slug: text("slug").notNull(),
		title: text("title").notNull(),
		location: text("location").notNull(),
		employmentType: text("employment_type").notNull(),
		summary: text("summary").notNull(),
		description: text("description").notNull(),
		responsibilities: text("responsibilities"),
		requirements: text("requirements"),
		niceToHave: text("nice_to_have"),
		salaryRange: text("salary_range"),
		applyEmail: text("apply_email").default("sales@nisccloud.com").notNull(),
		published: boolean("published").default(false).notNull(),
		/** draft | scheduled | published | closed */
		status: text("status").default("draft").notNull(),
		opensOn: timestamp("opens_on"),
		closesOn: timestamp("closes_on"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("career_opening_slug_unique").on(table.slug),
		index("career_opening_published_idx").on(table.published),
	],
);

/** Applications submitted on the public careers page. CV bytes are stored outside this row. */
export const careerApplication = pgTable(
	"career_application",
	{
		id: text("_id").primaryKey(),
		openingId: text("opening_id").references(() => careerOpening.id, { onDelete: "set null" }),
		openingTitle: text("opening_title").notNull(),
		fullName: text("full_name").notNull(),
		email: text("email").notNull(),
		phone: text("phone"),
		availableFrom: date("available_from"),
		countryCode: text("country_code").notNull(),
		countryName: text("country_name").notNull(),
		city: text("city").notNull(),
		heardFrom: text("heard_from").notNull(),
		linkedinUrl: text("linkedin_url"),
		salaryRange: text("salary_range").notNull(),
		notes: text("notes"),
		cvStorageKey: text("cv_storage_key").notNull(),
		cvFileName: text("cv_file_name").notNull(),
		cvContentType: text("cv_content_type").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("career_application_opening_id_idx").on(table.openingId),
		index("career_application_created_at_idx").on(table.createdAt),
	],
);
