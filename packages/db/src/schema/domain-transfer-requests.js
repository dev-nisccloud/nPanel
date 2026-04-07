import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
import { niscOrder } from "./nisc-orders";
// --- DomainTransferRequest ----------------------------------------------------
export const domainTransferRequest = pgTable("domain_transfer_request", {
    id: text("id").primaryKey(),
    domainName: text("domain_name").notNull(),
    authCode: text("auth_code").notNull(),
    provider: text("provider").notNull(),
    status: text("status").default("PENDING").notNull(),
    providerPriceAmount: text("provider_price_amount"),
    providerPriceCurrency: text("provider_price_currency"),
    customerPriceAmount: text("customer_price_amount"),
    customerPriceCurrency: text("customer_price_currency"),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    submittedToProviderAt: timestamp("submitted_to_provider_at"),
    providerResponse: jsonb("provider_response"),
    niscOrderId: text("nisc_order_id").references(() => niscOrder.id, {
        onDelete: "set null",
    }),
    createdById: text("created_by_id")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
    index("domain_transfer_request_domainName_idx").on(table.domainName),
    index("domain_transfer_request_status_idx").on(table.status),
    index("domain_transfer_request_createdById_idx").on(table.createdById),
    index("domain_transfer_request_teamId_idx").on(table.teamId),
    index("domain_transfer_request_createdAt_idx").on(table.createdAt),
    index("domain_transfer_request_niscOrderId_idx").on(table.niscOrderId),
]);
export const domainTransferRequestRelations = relations(domainTransferRequest, ({ one }) => ({
    team: one(team, {
        fields: [domainTransferRequest.teamId],
        references: [team.id],
    }),
    createdBy: one(user, {
        fields: [domainTransferRequest.createdById],
        references: [user.id],
        relationName: "DomainTransferRequestCreatedBy",
    }),
    niscOrder: one(niscOrder, {
        fields: [domainTransferRequest.niscOrderId],
        references: [niscOrder.id],
    }),
}));
