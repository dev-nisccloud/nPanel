import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

// --- WebDesignQuoteRequest ---------------------------------------------------
// Parity: previous_codebase/

export const webDesignQuoteRequest = pgTable(
  "web_design_quote_request",
  {
    id: text("_id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    companyName: text("company_name").notNull(),
    domain: text("domain"),
    projectType: text("project_type").notNull(),
    projectDescription: text("project_description").notNull(),
    budget: text("budget").notNull(),
    targetLaunchDate: timestamp("target_launch_date"),
    status: text("status").default("PENDING").notNull(),

    submittedById: text("submitted_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("web_design_quote_request_status_idx").on(table.status),
    index("web_design_quote_request_submittedById_idx").on(table.submittedById),
    index("web_design_quote_request_createdAt_idx").on(table.createdAt),
    index("web_design_quote_request_email_idx").on(table.email),
  ],
);

export const webDesignQuoteRequestRelations = relations(
  webDesignQuoteRequest,
  ({ one }) => ({
    submittedBy: one(user, {
      fields: [webDesignQuoteRequest.submittedById],
      references: [user.id],
    }),
  }),
);

