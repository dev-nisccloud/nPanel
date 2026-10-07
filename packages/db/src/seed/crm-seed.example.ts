/**
 * Example seed file for CRM data
 * This demonstrates how to populate the CRM with initial data
 */

import { db } from "../index";
import {
  crmPipeline,
  crmPipelineStage,
  crmCustomFieldDefinition,
  crmCompany,
  crmContact,
  crmDeal,
  crmActivity,
  crmTask,
  crmTag,
  crmAiConfig,
} from "../schema";
import { nanoid } from "nanoid";

interface SeedOptions {
  userId: string; // Agency user who creates the seed data
  includeTestData?: boolean; // Include sample companies/contacts for testing
}

export async function seedCrmData(options: SeedOptions) {
  const { userId, includeTestData = false } = options;

  console.log("🌱 Starting CRM seed...");

  // ========================================
  // 1. Create Default Pipeline & Stages
  // ========================================
  console.log("📊 Creating default sales pipeline...");
  
  const pipelineId = nanoid();
  await db.insert(crmPipeline).values({
    id: pipelineId,
    name: "Default Sales Pipeline",
    description: "Standard B2B sales process for agency services",
    isDefault: true,
    isActive: true,
    displayOrder: 0,
    createdById: userId,
  });

  const stages = [
    {
      name: "Lead",
      description: "Initial contact or inbound lead",
      probability: 10,
      color: "#6B7280",
      aiConfig: {
        autoActions: ["send_welcome_email"],
        requiredFields: ["email", "phone"],
        suggestions: ["Qualify the lead", "Schedule discovery call"],
      },
    },
    {
      name: "Qualified",
      description: "Lead has been qualified and shows genuine interest",
      probability: 25,
      color: "#3B82F6",
      aiConfig: {
        requiredFields: ["company_id", "budget"],
        suggestions: ["Prepare proposal", "Identify decision makers"],
      },
    },
    {
      name: "Proposal",
      description: "Proposal sent to prospect",
      probability: 50,
      color: "#F59E0B",
      aiConfig: {
        suggestions: ["Schedule follow-up call", "Address concerns"],
      },
    },
    {
      name: "Negotiation",
      description: "In active negotiation",
      probability: 75,
      color: "#8B5CF6",
      aiConfig: {
        suggestions: ["Negotiate terms", "Get legal review"],
      },
    },
    {
      name: "Closed Won",
      description: "Deal successfully closed",
      probability: 100,
      color: "#10B981",
      aiConfig: {
        autoActions: ["create_onboarding_tasks", "send_welcome_package"],
      },
    },
    {
      name: "Closed Lost",
      description: "Deal lost to competitor or no decision",
      probability: 0,
      color: "#EF4444",
      aiConfig: {
        requiredFields: ["lost_reason"],
      },
    },
  ];

  const stageIds: Record<string, string> = {};
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const stageId = nanoid();
    stageIds[stage.name] = stageId;
    
    await db.insert(crmPipelineStage).values({
      id: stageId,
      pipelineId,
      name: stage.name,
      description: stage.description,
      probability: stage.probability,
      displayOrder: i,
      color: stage.color,
      isActive: true,
      aiConfig: stage.aiConfig,
    });
  }

  // ========================================
  // 2. Create Custom Field Definitions
  // ========================================
  console.log("📝 Creating custom field definitions...");

  // Contact Custom Fields
  const contactFields = [
    {
      fieldName: "linkedin_profile_url",
      fieldLabel: "LinkedIn Profile",
      fieldType: "url" as const,
      description: "URL to LinkedIn profile",
      fieldConfig: {
        placeholder: "https://linkedin.com/in/...",
        helpText: "Enter the full LinkedIn profile URL",
      },
      aiConfig: {
        autoEnrich: true,
        enrichmentSource: ["linkedin_api", "web_scraping"],
      },
    },
    {
      fieldName: "preferred_contact_time",
      fieldLabel: "Preferred Contact Time",
      fieldType: "select" as const,
      description: "Best time to reach the contact",
      fieldConfig: {
        options: [
          { value: "morning", label: "Morning (9-12)", color: "#FEF3C7" },
          { value: "afternoon", label: "Afternoon (12-5)", color: "#DBEAFE" },
          { value: "evening", label: "Evening (5-8)", color: "#E0E7FF" },
        ],
        defaultValue: "morning",
      },
    },
    {
      fieldName: "decision_maker",
      fieldLabel: "Decision Maker",
      fieldType: "boolean" as const,
      description: "Is this person a decision maker?",
      fieldConfig: {
        defaultValue: false,
      },
    },
    {
      fieldName: "interests",
      fieldLabel: "Professional Interests",
      fieldType: "multiselect" as const,
      description: "Areas of interest",
      fieldConfig: {
        options: [
          { value: "marketing", label: "Marketing", color: "#F59E0B" },
          { value: "sales", label: "Sales", color: "#10B981" },
          { value: "tech", label: "Technology", color: "#3B82F6" },
          { value: "design", label: "Design", color: "#8B5CF6" },
          { value: "analytics", label: "Analytics", color: "#6366F1" },
        ],
      },
    },
    {
      fieldName: "engagement_score",
      fieldLabel: "Engagement Score",
      fieldType: "rating" as const,
      description: "How engaged is this contact (1-5 stars)",
      fieldConfig: {
        min: 1,
        max: 5,
        defaultValue: 3,
      },
    },
  ];

  for (const field of contactFields) {
    await db.insert(crmCustomFieldDefinition).values({
      id: nanoid(),
      entityType: "contact",
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      description: field.description,
      isRequired: false,
      isActive: true,
      isSystem: true, // System fields
      displayOrder: 0,
      fieldConfig: field.fieldConfig,
      aiConfig: field.aiConfig,
      createdById: userId,
    });
  }

  // Company Custom Fields
  const companyFields = [
    {
      fieldName: "company_stage",
      fieldLabel: "Company Stage",
      fieldType: "select" as const,
      description: "Current stage of the company",
      fieldConfig: {
        options: [
          { value: "startup", label: "Startup", color: "#FEF3C7" },
          { value: "growth", label: "Growth", color: "#D1FAE5" },
          { value: "enterprise", label: "Enterprise", color: "#DBEAFE" },
        ],
      },
    },
    {
      fieldName: "technologies_used",
      fieldLabel: "Technologies Used",
      fieldType: "multiselect" as const,
      description: "Technologies the company uses",
      fieldConfig: {
        options: [
          { value: "react", label: "React" },
          { value: "vue", label: "Vue" },
          { value: "angular", label: "Angular" },
          { value: "node", label: "Node.js" },
          { value: "python", label: "Python" },
          { value: "java", label: "Java" },
        ],
      },
    },
    {
      fieldName: "target_market",
      fieldLabel: "Target Market",
      fieldType: "text" as const,
      description: "Primary target market",
    },
  ];

  for (const field of companyFields) {
    await db.insert(crmCustomFieldDefinition).values({
      id: nanoid(),
      entityType: "company",
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      description: field.description,
      isRequired: false,
      isActive: true,
      isSystem: true,
      displayOrder: 0,
      fieldConfig: field.fieldConfig || {},
      createdById: userId,
    });
  }

  // Deal Custom Fields
  const dealFields = [
    {
      fieldName: "deal_source",
      fieldLabel: "Deal Source",
      fieldType: "select" as const,
      description: "How this deal originated",
      fieldConfig: {
        options: [
          { value: "inbound", label: "Inbound Lead" },
          { value: "outbound", label: "Outbound Prospecting" },
          { value: "referral", label: "Referral" },
          { value: "partner", label: "Partner" },
          { value: "event", label: "Event/Conference" },
        ],
      },
    },
    {
      fieldName: "competitors",
      fieldLabel: "Competitors",
      fieldType: "multiselect" as const,
      description: "Other companies being considered",
      fieldConfig: {
        options: [
          { value: "competitor_a", label: "Competitor A" },
          { value: "competitor_b", label: "Competitor B" },
          { value: "competitor_c", label: "Competitor C" },
        ],
      },
    },
    {
      fieldName: "contract_length",
      fieldLabel: "Contract Length (months)",
      fieldType: "number" as const,
      description: "Length of contract in months",
      fieldConfig: {
        min: 1,
        max: 36,
        defaultValue: 12,
      },
    },
  ];

  for (const field of dealFields) {
    await db.insert(crmCustomFieldDefinition).values({
      id: nanoid(),
      entityType: "deal",
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      description: field.description,
      isRequired: false,
      isActive: true,
      isSystem: true,
      displayOrder: 0,
      fieldConfig: field.fieldConfig || {},
      createdById: userId,
    });
  }

  // ========================================
  // 3. Create Default Tags
  // ========================================
  console.log("🏷️  Creating default tags...");

  const tags = [
    { name: "Hot Lead", color: "#EF4444" },
    { name: "Cold Lead", color: "#3B82F6" },
    { name: "Partnership", color: "#8B5CF6" },
    { name: "High Value", color: "#10B981" },
    { name: "Needs Follow-up", color: "#F59E0B" },
    { name: "Technical Buyer", color: "#6366F1" },
    { name: "Economic Buyer", color: "#EC4899" },
    { name: "Champion", color: "#14B8A6" },
  ];

  for (const tag of tags) {
    await db.insert(crmTag).values({
      id: nanoid(),
      name: tag.name,
      color: tag.color,
      createdById: userId,
    });
  }

  // ========================================
  // 4. Create AI Configuration
  // ========================================
  console.log("🤖 Creating AI configuration...");

  await db.insert(crmAiConfig).values({
    id: nanoid(),
    enableContactEnrichment: true,
    enableDealScoring: true,
    enableNextBestAction: true,
    enableSentimentAnalysis: true,
    enableActivitySummaries: true,
    enableAutoTagging: false, // Start disabled
    modelSettings: {
      provider: "openai",
      model: "gpt-4-turbo",
      temperature: 0.7,
      maxTokens: 2000,
    },
    customPrompts: {
      contactEnrichment: `Analyze this contact's information and enrich with additional relevant details from public sources. Focus on professional background, interests, and potential pain points related to our services.`,
      dealScoring: `Score this deal from 0-100 based on: engagement level, budget fit, decision maker access, timeline urgency, and competitive position. Provide reasoning for the score.`,
      nextBestAction: `Based on the deal stage, last activity, and contact engagement, suggest the next best action to move this deal forward.`,
      activitySummary: `Summarize this activity highlighting: key discussion points, decisions made, action items, and next steps.`,
    },
    updatedById: userId,
  });

  // ========================================
  // 5. Create Test Data (Optional)
  // ========================================
  if (includeTestData) {
    console.log("🧪 Creating test data...");

    // Create test companies
    const testCompanies = [
      {
        name: "Acme Corporation",
        website: "https://acme.com",
        industry: "Technology",
        size: "51-200",
        email: "info@acme.com",
        phone: "+1-555-0100",
        customFields: {
          company_stage: "growth",
          technologies_used: ["react", "node"],
        },
      },
      {
        name: "TechStart Inc",
        website: "https://techstart.io",
        industry: "SaaS",
        size: "11-50",
        email: "hello@techstart.io",
        phone: "+1-555-0200",
        customFields: {
          company_stage: "startup",
          technologies_used: ["vue", "python"],
        },
      },
    ];

    const companyIds: string[] = [];
    for (const company of testCompanies) {
      const companyId = nanoid();
      companyIds.push(companyId);
      
      await db.insert(crmCompany).values({
        id: companyId,
        name: company.name,
        website: company.website,
        industry: company.industry,
        size: company.size,
        email: company.email,
        phone: company.phone,
        isActive: true,
        customFields: company.customFields,
        createdById: userId,
        ownerId: userId,
      });
    }

    // Create test contacts
    const testContacts = [
      {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@acme.com",
        title: "CTO",
        companyId: companyIds[0],
        customFields: {
          linkedin_profile_url: "https://linkedin.com/in/johnsmith",
          decision_maker: true,
          interests: ["tech", "analytics"],
        },
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah@techstart.io",
        title: "CEO",
        companyId: companyIds[1],
        customFields: {
          decision_maker: true,
          interests: ["marketing", "sales"],
        },
      },
    ];

    const contactIds: string[] = [];
    for (const contact of testContacts) {
      const contactId = nanoid();
      contactIds.push(contactId);
      
      await db.insert(crmContact).values({
        id: contactId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        title: contact.title,
        companyId: contact.companyId,
        isActive: true,
        customFields: contact.customFields,
        createdById: userId,
        ownerId: userId,
      });
    }

    // Create test deals
    const testDeals = [
      {
        name: "Acme Corp - Marketing Services",
        companyId: companyIds[0],
        primaryContactId: contactIds[0],
        amount: "50000.00",
        stageId: stageIds["Qualified"],
        customFields: {
          deal_source: "inbound",
          contract_length: 12,
        },
      },
      {
        name: "TechStart - Website Redesign",
        companyId: companyIds[1],
        primaryContactId: contactIds[1],
        amount: "25000.00",
        stageId: stageIds["Proposal"],
        customFields: {
          deal_source: "referral",
          contract_length: 6,
        },
      },
    ];

    for (const deal of testDeals) {
      await db.insert(crmDeal).values({
        id: nanoid(),
        name: deal.name,
        companyId: deal.companyId,
        primaryContactId: deal.primaryContactId,
        pipelineId,
        stageId: deal.stageId,
        amount: deal.amount,
        currency: "USD",
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        customFields: deal.customFields,
        createdById: userId,
        ownerId: userId,
      });
    }

    console.log("✅ Test data created successfully");
  }

  console.log("✅ CRM seed completed successfully!");
  
  return {
    pipelineId,
    stageIds,
    message: "CRM seeded successfully",
  };
}

// Example usage:
// import { seedCrmData } from './seed/crm-seed.example';
// await seedCrmData({ userId: 'agency_user_id', includeTestData: true });
