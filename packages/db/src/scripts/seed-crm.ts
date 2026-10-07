import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { user } from "../schema/auth";
import {
  crmActivity,
  crmActivityLog,
  crmCompany,
  crmCompanyTag,
  crmContact,
  crmContactTag,
  crmDeal,
  crmDealTag,
  crmNote,
  crmPipeline,
  crmPipelineStage,
  crmTag,
  crmTask,
} from "../schema/crm";

const COUNT = 100;
const SEED_SOURCE = "seed";
const SAMPLE_PREFIX = "[Sample]";
const PIPELINE_NAME = "Sample Sales Pipeline";

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Education",
  "Hospitality",
  "Logistics",
  "Media",
  "Real Estate",
  "Agriculture",
];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const CITIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Kampala",
  "Kigali",
  "Dar es Salaam",
  "Lagos",
  "Accra",
];
const NAME_A = [
  "Acme",
  "Northwind",
  "Brightpath",
  "Harbor",
  "Lumen",
  "Summit",
  "Cedar",
  "Orbit",
  "Kindred",
  "Pinnacle",
];
const NAME_B = [
  "Digital",
  "Studios",
  "Logistics",
  "Health",
  "Foods",
  "Capital",
  "Media",
  "Farms",
  "Retail",
  "Labs",
];
const FIRST_NAMES = [
  "Amina",
  "Brian",
  "Cynthia",
  "David",
  "Esther",
  "Felix",
  "Grace",
  "Hassan",
  "Imani",
  "James",
];
const LAST_NAMES = [
  "Otieno",
  "Wanjiku",
  "Mwangi",
  "Achieng",
  "Kamau",
  "Njeri",
  "Omondi",
  "Chebet",
  "Mutua",
  "Akinyi",
];
const SERVICES = [
  "Website redesign",
  "SEO retainer",
  "Meta ads",
  "Email programme",
  "Brand identity",
  "Hosting migration",
  "Content studio",
  "Google ads",
  "CRM setup",
  "Annual support",
];
const STAGES = [
  { name: "Lead", probability: 10, color: "#6B7280" },
  { name: "Qualified", probability: 25, color: "#3B82F6" },
  { name: "Proposal", probability: 50, color: "#F59E0B" },
  { name: "Negotiation", probability: 75, color: "#8B5CF6" },
  { name: "Closed Won", probability: 100, color: "#10B981" },
  { name: "Closed Lost", probability: 0, color: "#EF4444" },
];
const ACTIVITY_TYPES = [
  "call",
  "email",
  "meeting",
  "note",
  "linkedin_message",
  "whatsapp",
] as const;
const TASK_STATUSES = ["todo", "in_progress", "completed", "cancelled"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const TAGS = [
  "Hot lead",
  "Enterprise",
  "Retainer",
  "Inbound",
  "Referral",
  "At risk",
  "Upsell",
  "New logo",
];

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

if (!process.env.DATABASE_URL) {
  const envPath =
    process.env.DOTENV_PATH ?? resolve(import.meta.dir, "../../../../apps/server/.env");
  dotenv.config({ path: envPath });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Ensure apps/server/.env exists.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const db = drizzle(pool);

const agencyUsers = await db
  .select({ id: user.id, role: user.role })
  .from(user)
  .where(inArray(user.role, ["AGENCY_SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_USER"]));

const owner =
  agencyUsers.find((row) => row.role === "AGENCY_SUPER_ADMIN") ??
  agencyUsers.find((row) => row.role === "AGENCY_ADMIN") ??
  agencyUsers[0];

if (!owner) {
  console.error("No agency user found. Sign in as an agency user before seeding CRM data.");
  await pool.end();
  process.exit(1);
}

console.log(`Seeding CRM sample data for agency role ${owner.role}.`);

await db.transaction(async (tx) => {
  await tx.delete(crmActivityLog).where(sql`${crmActivityLog.description} like ${`${SAMPLE_PREFIX}%`}`);
  await tx.delete(crmDeal).where(eq(crmDeal.externalSystem, SEED_SOURCE));
  await tx.delete(crmContact).where(eq(crmContact.externalSystem, SEED_SOURCE));
  await tx.delete(crmCompany).where(eq(crmCompany.externalSystem, SEED_SOURCE));
  await tx.delete(crmActivity).where(eq(crmActivity.externalSystem, SEED_SOURCE));
  await tx.delete(crmTask).where(eq(crmTask.externalSystem, SEED_SOURCE));
  await tx.delete(crmTag).where(sql`${crmTag.name} like ${"Sample %"}`);

  const [existingPipeline] = await tx
    .select()
    .from(crmPipeline)
    .where(eq(crmPipeline.name, PIPELINE_NAME))
    .limit(1);

  const pipelineId = existingPipeline?.id ?? randomUUID();
  if (!existingPipeline) {
    await tx.insert(crmPipeline).values({
      id: pipelineId,
      name: PIPELINE_NAME,
      description: "Sample pipeline used to preview the CRM.",
      isDefault: true,
      isActive: true,
      displayOrder: 0,
      createdById: owner.id,
    });
  }

  const existingStages = await tx
    .select()
    .from(crmPipelineStage)
    .where(eq(crmPipelineStage.pipelineId, pipelineId));

  const stageIds: string[] = [];
  for (let index = 0; index < STAGES.length; index++) {
    const definition = STAGES[index];
    if (!definition) continue;
    const found = existingStages.find((stage) => stage.name === definition.name);
    if (found) {
      stageIds.push(found.id);
      continue;
    }
    const id = randomUUID();
    stageIds.push(id);
    await tx.insert(crmPipelineStage).values({
      id,
      pipelineId,
      name: definition.name,
      description: definition.name,
      probability: definition.probability,
      displayOrder: index,
      color: definition.color,
      isActive: true,
    });
  }

  const companies = Array.from({ length: COUNT }, (_, index) => {
    const industry = INDUSTRIES[index % INDUSTRIES.length] ?? "Technology";
    const city = CITIES[index % CITIES.length] ?? "Nairobi";
    const left = NAME_A[index % NAME_A.length] ?? "Acme";
    const right = NAME_B[Math.floor(index / NAME_A.length) % NAME_B.length] ?? "Digital";
    return {
      id: randomUUID(),
      name: `${left} ${right} ${String(index + 1).padStart(3, "0")}`,
      website: `https://sample-${index + 1}.example.com`,
      industry,
      size: SIZES[index % SIZES.length] ?? "11-50",
      description: `${SAMPLE_PREFIX} ${industry} company based in ${city}.`,
      email: `hello${index + 1}@example.com`,
      phone: `+254700${String(100000 + index)}`,
      city,
      country: city === "Kampala" ? "Uganda" : city === "Kigali" ? "Rwanda" : city === "Lagos" ? "Nigeria" : city === "Accra" ? "Ghana" : city === "Dar es Salaam" ? "Tanzania" : "Kenya",
      isActive: true,
      customFields: {},
      externalId: `seed-company-${index + 1}`,
      externalSystem: SEED_SOURCE,
      createdById: owner.id,
      ownerId: owner.id,
    };
  });

  const contacts = companies.map((company, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length] ?? "Amina";
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length] ?? "Otieno";
    return {
      id: randomUUID(),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      title: index % 3 === 0 ? "Managing Director" : index % 3 === 1 ? "Marketing Lead" : "Operations Manager",
      companyId: company.id,
      email: `${firstName}.${lastName}.${index + 1}@example.com`.toLowerCase(),
      phone: `+254711${String(100000 + index)}`,
      city: company.city,
      country: company.country,
      leadSource: index % 2 === 0 ? "Referral" : "Website",
      leadStatus: index % 4 === 0 ? "New" : index % 4 === 1 ? "Contacted" : "Qualified",
      isActive: true,
      customFields: {},
      externalId: `seed-contact-${index + 1}`,
      externalSystem: SEED_SOURCE,
      createdById: owner.id,
      ownerId: owner.id,
    };
  });

  const deals = companies.map((company, index) => {
    const stage = STAGES[index % STAGES.length];
    const stageId = stageIds[index % stageIds.length];
    const closed = stage?.name === "Closed Won" || stage?.name === "Closed Lost";
    const won = stage?.name === "Closed Won";
    return {
      id: randomUUID(),
      name: `${company.name} — ${SERVICES[index % SERVICES.length] ?? "Website redesign"}`,
      description: `${SAMPLE_PREFIX} Opportunity linked to ${company.name}.`,
      companyId: company.id,
      primaryContactId: contacts[index]?.id,
      pipelineId,
      stageId: stageId ?? stageIds[0] ?? pipelineId,
      amount: ((index + 1) * 25000).toFixed(2),
      currency: "KES",
      probability: stage?.probability ?? 10,
      expectedCloseDate: daysFromNow((index % 60) - 10),
      actualCloseDate: closed ? daysFromNow(-((index % 20) + 1)) : null,
      isActive: true,
      isClosed: closed,
      isWon: won,
      lostReason: stage?.name === "Closed Lost" ? "Budget postponed" : null,
      customFields: {},
      externalId: `seed-deal-${index + 1}`,
      externalSystem: SEED_SOURCE,
      createdById: owner.id,
      ownerId: owner.id,
    };
  });

  await tx.insert(crmCompany).values(companies);
  await tx.insert(crmContact).values(contacts);
  await tx.insert(crmDeal).values(deals);

  await tx.insert(crmActivity).values(
    companies.map((company, index) => ({
      id: randomUUID(),
      activityType: ACTIVITY_TYPES[index % ACTIVITY_TYPES.length] ?? "call",
      subject: `${SAMPLE_PREFIX} Follow up with ${company.name}`,
      description: "Sample activity created so the CRM timeline has content.",
      companyId: company.id,
      contactId: contacts[index]?.id,
      dealId: deals[index]?.id,
      isCompleted: index % 3 === 0,
      completedAt: index % 3 === 0 ? daysFromNow(-index % 14) : null,
      scheduledAt: daysFromNow(index % 21),
      customFields: {},
      externalId: `seed-activity-${index + 1}`,
      externalSystem: SEED_SOURCE,
      createdById: owner.id,
    })),
  );

  await tx.insert(crmTask).values(
    companies.map((company, index) => ({
      id: randomUUID(),
      title: `${SAMPLE_PREFIX} Next step for ${company.name}`,
      description: "Sample task created for CRM previews.",
      status: TASK_STATUSES[index % TASK_STATUSES.length] ?? "todo",
      priority: TASK_PRIORITIES[index % TASK_PRIORITIES.length] ?? "medium",
      companyId: company.id,
      contactId: contacts[index]?.id,
      dealId: deals[index]?.id,
      assignedToId: owner.id,
      dueDate: daysFromNow((index % 30) - 5),
      completedAt: TASK_STATUSES[index % TASK_STATUSES.length] === "completed" ? daysFromNow(-2) : null,
      customFields: {},
      externalId: `seed-task-${index + 1}`,
      externalSystem: SEED_SOURCE,
      createdById: owner.id,
    })),
  );

  await tx.insert(crmNote).values(
    companies.map((company, index) => ({
      id: randomUUID(),
      content: `${SAMPLE_PREFIX} Note for ${company.name}. Interested in ${SERVICES[index % SERVICES.length] ?? "support"}.`,
      companyId: company.id,
      contactId: contacts[index]?.id,
      dealId: deals[index]?.id,
      isPinned: index % 10 === 0,
      createdById: owner.id,
    })),
  );

  const tags = TAGS.map((name) => ({
    id: randomUUID(),
    name: `Sample ${name}`,
    color: "#0F766E",
    description: `${SAMPLE_PREFIX} tag`,
    createdById: owner.id,
  }));
  await tx.insert(crmTag).values(tags);

  await tx.insert(crmCompanyTag).values(
    companies.map((company, index) => ({
      id: randomUUID(),
      companyId: company.id,
      tagId: tags[index % tags.length]?.id ?? tags[0]!.id,
    })),
  );
  await tx.insert(crmContactTag).values(
    contacts.map((contact, index) => ({
      id: randomUUID(),
      contactId: contact.id,
      tagId: tags[(index + 1) % tags.length]?.id ?? tags[0]!.id,
    })),
  );
  await tx.insert(crmDealTag).values(
    deals.map((deal, index) => ({
      id: randomUUID(),
      dealId: deal.id,
      tagId: tags[(index + 2) % tags.length]?.id ?? tags[0]!.id,
    })),
  );

  await tx.insert(crmActivityLog).values(
    companies.map((company) => ({
      id: randomUUID(),
      entityType: "company" as const,
      entityId: company.id,
      action: "created",
      description: `${SAMPLE_PREFIX} Company "${company.name}" created`,
      createdById: owner.id,
    })),
  );
});

console.log(
  `Seeded ${COUNT} companies, contacts, deals, activities, tasks, and notes, plus ${TAGS.length} tags.`,
);
await pool.end();
