import { TRPCError } from "@trpc/server";
import { City, Country } from "country-state-city";
import { and, db, desc, eq } from "@npanel/db";
import { careerApplication, careerOpening } from "@npanel/db/schema/careers";
import { CareerCvError, inspectCareerCv } from "./cv";
import { careerOpeningIsPublic } from "./visibility";
import { readCareerCv, storeCareerCv } from "./cv-store";

export const HEARD_ABOUT_OPTIONS = [
	"Nisc Cloud website",
	"LinkedIn",
	"Referral",
	"Social media",
	"Job board",
	"Other",
] as const;

const cityCache = new Map<string, string[]>();

export function listCareerCountries() {
	return Country.getAllCountries()
		.map((country) => ({ code: country.isoCode, name: country.name }))
		.filter((country) => country.code && country.name)
		.sort((a, b) => a.name.localeCompare(b.name));
}

function citiesFor(countryCode: string) {
	const code = countryCode.toUpperCase();
	let names = cityCache.get(code);
	if (!names) {
		const rows = City.getCitiesOfCountry(code) ?? [];
		names = [...new Set(rows.map((city) => city.name).filter(Boolean))].sort((a, b) =>
			a.localeCompare(b),
		);
		cityCache.set(code, names);
	}
	return names;
}

export function searchCareerCities(countryCode: string, query: string) {
	const names = citiesFor(countryCode);
	const needle = query.trim().toLowerCase();
	if (!needle) return { freeText: names.length === 0, cities: [] as string[] };
	return {
		freeText: names.length === 0,
		cities: names.filter((name) => name.toLowerCase().includes(needle)).slice(0, 40),
	};
}

function countryByCode(code: string) {
	return listCareerCountries().find((country) => country.code === code.toUpperCase()) ?? null;
}

function cityIsAllowed(countryCode: string, city: string) {
	const names = citiesFor(countryCode);
	if (names.length === 0) return city.trim().length >= 2 && city.trim().length <= 120;
	return names.some((name) => name.toLowerCase() === city.trim().toLowerCase());
}

function linkedinOrNull(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a LinkedIn profile link, starting with https://." });
	}
	if (url.protocol !== "https:" || !/^(www\.)?linkedin\.com$/i.test(url.hostname)) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a linkedin.com profile link." });
	}
	if (!/^\/(in|pub)\//i.test(url.pathname)) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Enter the link to your LinkedIn profile." });
	}
	return url.toString();
}

function startDateOrThrow(value: string) {
	const trimmed = value.trim();
	const message = "Choose the date you could start.";
	if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) throw new TRPCError({ code: "BAD_REQUEST", message });
	const day = new Date(`${trimmed}T00:00:00Z`).getTime();
	if (Number.isNaN(day)) throw new TRPCError({ code: "BAD_REQUEST", message });
	const today = new Date();
	const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
	if (day < todayUtc - 24 * 60 * 60 * 1000 || day > todayUtc + 2 * 365 * 24 * 60 * 60 * 1000) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a start date between today and two years from now." });
	}
	return trimmed;
}

function safeDownloadName(name: string) {
	const base = name.split(/[/\\]/).pop()?.replace(/[^\w.\- ]+/g, "") ?? "cv";
	return base.slice(0, 120) || "cv";
}

export async function submitCareerApplication(input: {
	slug: string;
	fullName: string;
	email: string;
	phone: string;
	availableFrom: string;
	countryCode: string;
	city: string;
	heardFrom: string;
	heardOther: string;
	linkedinUrl: string;
	salaryRange: string;
	notes: string;
	fileName: string;
	bytes: Buffer;
}) {
	const fullName = input.fullName.trim();
	const email = input.email.trim().toLowerCase();
	const salaryRange = input.salaryRange.trim();
	const city = input.city.trim();
	const notes = input.notes.trim();
	if (fullName.length < 2 || fullName.length > 120) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Enter your name." });
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid email address." });
	}
	const phone = input.phone.trim().replace(/\s+/g, " ");
	if (!/^\+?[0-9 ()-]{7,20}$/.test(phone) || phone.replace(/\D/g, "").length < 7) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a phone number we can call, including the country code." });
	}
	const availableFrom = startDateOrThrow(input.availableFrom);
	if (salaryRange.length < 2 || salaryRange.length > 120) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Enter your desired salary range." });
	}
	if (!HEARD_ABOUT_OPTIONS.includes(input.heardFrom as (typeof HEARD_ABOUT_OPTIONS)[number])) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Choose how you heard about this job." });
	}
	const heardFrom =
		input.heardFrom === "Other"
			? `Other: ${input.heardOther.trim().slice(0, 160) || "not specified"}`
			: input.heardFrom;
	const country = countryByCode(input.countryCode);
	if (!country) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a country." });
	if (!cityIsAllowed(country.code, city) || city.length > 120) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a city in the selected country." });
	}
	if (notes.length > 2000) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "Keep the extra note under 2,000 characters." });
	}

	const [opening] = await db
		.select()
		.from(careerOpening)
		.where(and(eq(careerOpening.slug, input.slug), careerOpeningIsPublic))
		.limit(1);
	if (!opening) throw new TRPCError({ code: "NOT_FOUND", message: "This role is not open." });

	let inspected;
	try {
		inspected = inspectCareerCv(input.fileName, input.bytes);
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: error instanceof CareerCvError ? error.message : "Upload a PDF or DOCX.",
		});
	}

	const id = crypto.randomUUID();
	const storageKey = await storeCareerCv({
		id,
		extension: inspected.extension,
		contentType: inspected.contentType,
		bytes: input.bytes,
	});
	await db.insert(careerApplication).values({
		id,
		openingId: opening.id,
		openingTitle: opening.title,
		fullName,
		email,
		phone,
		availableFrom,
		countryCode: country.code,
		countryName: country.name,
		city,
		heardFrom,
		linkedinUrl: linkedinOrNull(input.linkedinUrl),
		salaryRange,
		notes: notes || null,
		cvStorageKey: storageKey,
		cvFileName: safeDownloadName(input.fileName),
		cvContentType: inspected.contentType,
	});
	return { id };
}

export async function listCareerApplications() {
	const rows = await db.select().from(careerApplication).orderBy(desc(careerApplication.createdAt));
	return rows.map((row) => ({
		id: row.id,
		openingTitle: row.openingTitle,
		fullName: row.fullName,
		email: row.email,
		phone: row.phone,
		availableFrom: row.availableFrom,
		countryName: row.countryName,
		city: row.city,
		heardFrom: row.heardFrom,
		linkedinUrl: row.linkedinUrl,
		salaryRange: row.salaryRange,
		notes: row.notes,
		cvFileName: row.cvFileName,
		createdOn: row.createdAt.toISOString(),
	}));
}

export async function readCareerApplicationFile(id: string) {
	const [row] = await db
		.select()
		.from(careerApplication)
		.where(eq(careerApplication.id, id))
		.limit(1);
	if (!row) return null;
	const bytes = await readCareerCv(row.cvStorageKey);
	return {
		bytes,
		contentType: row.cvContentType,
		fileName: row.cvFileName,
	};
}
