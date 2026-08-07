import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
import { user } from "./auth";
/**
 * Browser guest support sessions for the marketing-site FAB.
 * Opaque token is stored only as a hash; raw token lives in an httpOnly cookie.
 */
export const supportGuestSession = pgTable("support_guest_session", {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    guestUserId: text("guest_user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    createdIpHash: text("created_ip_hash"),
    userAgentHash: text("user_agent_hash"),
    claimedByUserId: text("claimed_by_user_id").references(() => user.id, {
        onDelete: "set null",
    }),
    claimedAt: timestamp("claimed_at"),
    expiresAt: timestamp("expires_at").notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("support_guest_session_token_hash_uidx").on(table.tokenHash),
    index("support_guest_session_guest_user_id_idx").on(table.guestUserId),
    index("support_guest_session_email_idx").on(table.email),
    index("support_guest_session_expires_at_idx").on(table.expiresAt),
]);
export const supportGuestSessionRelations = relations(supportGuestSession, ({ one }) => ({
    guestUser: one(user, {
        fields: [supportGuestSession.guestUserId],
        references: [user.id],
        relationName: "SupportGuestSessionUser",
    }),
    claimedBy: one(user, {
        fields: [supportGuestSession.claimedByUserId],
        references: [user.id],
        relationName: "SupportGuestSessionClaimedBy",
    }),
}));
