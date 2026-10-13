import { TRPCError } from "@trpc/server";
import { and, db, eq, ilike, inArray, sql } from "@npanel/db";
import { ensureWebsiteLeadsPipeline } from "@npanel/db/crm/website-leads";
import { crmCompany, crmContact, crmDeal, crmNote, user } from "@npanel/db/schema";
import { nanoid } from "nanoid";

const SERVICES: Record<string, string> = {
  create: "Brand & Web Design",
  launch: "Cloud Hosting",
  market: "Digital Marketing",
  automate: "Marketing Automation",
  full: "Full Growth Stack",
  custom: "Custom / Not sure yet",
};

const BUDGETS: Record<string, { label: string; amount: string | null }> = {
  "under-50k": { label: "Under KES 50,000", amount: "25000.00" },
  "50k-150k": { label: "KES 50,000 – 150,000", amount: "100000.00" },
  "150k-500k": { label: "KES 150,000 – 500,000", amount: "325000.00" },
  "500k-plus": { label: "KES 500,000+", amount: "500000.00" },
  "not-sure": { label: "Not sure yet", amount: null },
};

const COMPANY_SUFFIX =
  /^(limited|ltd|llc|inc|incorporated|company|co|plc|corp|corporation)$/;

export type WebsiteLeadInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  serviceName?: string;
  budget?: string;
  message?: string;
  plan?: string;
  planPrice?: string;
  source: "contact" | "chat";
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? name.trim();
  const lastName = parts.slice(1).join(" ") || "-";
  return { firstName, lastName, fullName: parts.join(" ") };
}

export function normalizeCompanyName(name: string) {
  const words = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words[0] === "the" && words.length > 1) words.shift();
  while (words.length > 1 && COMPANY_SUFFIX.test(words[words.length - 1] ?? "")) {
    words.pop();
  }
  return words.join(" ");
}

function serviceLabel(input: WebsiteLeadInput) {
  if (input.serviceName?.trim()) return input.serviceName.trim();
  const service = input.service?.trim();
  if (!service) return input.source === "chat" ? "Website chat" : "Website enquiry";
  return SERVICES[service] ?? service;
}

function budgetInfo(budget: string | undefined) {
  const key = budget?.trim();
  if (!key) return { label: null as string | null, amount: null as string | null };
  return BUDGETS[key] ?? { label: key, amount: null };
}

async function agencyOwnerId() {
  const agencyUsers = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(inArray(user.role, ["AGENCY_SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_USER"]));

  const owner =
    agencyUsers.find((row) => row.role === "AGENCY_SUPER_ADMIN") ??
    agencyUsers.find((row) => row.role === "AGENCY_ADMIN") ??
    agencyUsers[0];

  if (!owner) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Website leads are not configured yet.",
    });
  }
  return owner.id;
}

async function findSimilarCompany(
  database: Pick<typeof db, "select">,
  name: string,
) {
  const normalized = normalizeCompanyName(name);
  const token = normalized.split(" ")[0]?.replace(/[%_\\]/g, "") ?? "";
  const needle = token.length >= 2 ? token : name.trim().replace(/[%_\\]/g, "");
  if (!needle) return null;

  const candidates = await database
    .select({
      id: crmCompany.id,
      name: crmCompany.name,
      phone: crmCompany.phone,
      email: crmCompany.email,
      isActive: crmCompany.isActive,
    })
    .from(crmCompany)
    .where(ilike(crmCompany.name, `%${needle}%`))
    .limit(40);

  const matches = candidates.filter((row) => normalizeCompanyName(row.name) === normalized);
  return matches.find((row) => row.isActive) ?? matches[0] ?? null;
}

export async function ingestWebsiteLead(input: WebsiteLeadInput) {
  const ownerId = await agencyOwnerId();
  const person = splitName(input.name);
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const companyName = input.company?.trim() || "";
  const label = serviceLabel(input);
  const budget = budgetInfo(input.budget);
  const message = input.message?.trim() || "";
  const planBits = [
    input.plan?.trim() ? `Plan: ${input.plan.trim()}` : null,
    input.planPrice?.trim() ? `Quoted price: KES ${input.planPrice.trim()}` : null,
  ].filter(Boolean);
  const detailLines = [
    message,
    `Service: ${label}`,
    budget.label ? `Budget: ${budget.label}` : null,
    ...planBits,
    input.source === "chat" ? "Submitted from the website chat form." : "Submitted from the website contact form.",
  ].filter(Boolean);
  const details = detailLines.join("\n");
  const dealName = `${label} — ${companyName || person.fullName}`.slice(0, 180);
  const amount = budget.amount;

  return db.transaction(async (tx) => {
    const pipeline = await ensureWebsiteLeadsPipeline(tx, ownerId);
    const expectedRevenue =
      amount && pipeline.probability > 0
        ? ((Number(amount) * pipeline.probability) / 100).toFixed(2)
        : null;

    let companyId: string | null = null;
    if (companyName) {
      const existingCompany = await findSimilarCompany(tx, companyName);
      if (existingCompany) {
        companyId = existingCompany.id;
        const patch: { phone?: string; isActive?: boolean; updatedAt: Date } = {
          updatedAt: new Date(),
        };
        if (!existingCompany.phone && phone) patch.phone = phone;
        if (!existingCompany.isActive) patch.isActive = true;
        if (patch.phone || patch.isActive) {
          await tx.update(crmCompany).set(patch).where(eq(crmCompany.id, existingCompany.id));
        }
      } else {
        companyId = nanoid();
        await tx.insert(crmCompany).values({
          id: companyId,
          name: companyName,
          phone,
          isActive: true,
          customFields: {},
          externalSystem: "website",
          createdById: ownerId,
          ownerId,
        });
      }
    }

    const [existingContact] = await tx
      .select({
        id: crmContact.id,
        phone: crmContact.phone,
        companyId: crmContact.companyId,
        leadSource: crmContact.leadSource,
        leadStatus: crmContact.leadStatus,
      })
      .from(crmContact)
      .where(ilike(crmContact.email, email))
      .limit(1);

    let contactId: string;
    if (!existingContact) {
      contactId = nanoid();
      await tx.insert(crmContact).values({
        id: contactId,
        firstName: person.firstName,
        lastName: person.lastName,
        fullName: person.fullName,
        email,
        phone,
        companyId,
        leadSource: "Website",
        leadStatus: "New",
        isActive: true,
        customFields: { form: input.source },
        externalSystem: "website",
        createdById: ownerId,
        ownerId,
      });
    } else {
      contactId = existingContact.id;
      await tx
        .update(crmContact)
        .set({
          phone: existingContact.phone || phone,
          companyId: existingContact.companyId || companyId,
          leadSource: existingContact.leadSource || "Website",
          leadStatus: existingContact.leadStatus || "New",
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(crmContact.id, contactId));
    }

    const [recentDeal] = await tx
      .select({ id: crmDeal.id })
      .from(crmDeal)
      .where(
        and(
          eq(crmDeal.primaryContactId, contactId),
          eq(crmDeal.name, dealName),
          eq(crmDeal.pipelineId, pipeline.pipelineId),
          sql`${crmDeal.createdAt} > now() - interval '2 minutes'`,
        ),
      )
      .limit(1);

    if (!recentDeal) {
      const dealId = nanoid();
      await tx.insert(crmDeal).values({
        id: dealId,
        name: dealName,
        description: details,
        companyId,
        primaryContactId: contactId,
        pipelineId: pipeline.pipelineId,
        stageId: pipeline.stageId,
        amount,
        currency: "KES",
        probability: pipeline.probability,
        expectedRevenue,
        isActive: true,
        customFields: {
          form: input.source,
          service: input.service ?? null,
          serviceLabel: label,
          budget: input.budget ?? null,
          budgetLabel: budget.label,
          plan: input.plan ?? null,
        },
        externalSystem: "website",
        createdById: ownerId,
        ownerId,
      });

      await tx.insert(crmNote).values({
        id: nanoid(),
        content: details,
        contactId,
        companyId,
        dealId,
        createdById: ownerId,
      });
    }

    return { ok: true as const };
  });
}
