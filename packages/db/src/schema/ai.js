import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, } from "drizzle-orm/pg-core";
import { team } from "./teams";
import { user } from "./auth";
export const aiChat = pgTable("ai_chat", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    title: text("title"),
    // Prisma enums (AiChatStatus) are represented as text values in this Drizzle build.
    // Expected values: "ACTIVE" | "ESCALATED" | "CLOSED"
    status: text("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .defaultNow()
        .notNull(),
    closedAt: timestamp("closed_at"),
}, (table) => [
    index("ai_chat_userId_idx").on(table.userId),
    index("ai_chat_teamId_idx").on(table.teamId),
    index("ai_chat_status_idx").on(table.status),
    index("ai_chat_createdAt_idx").on(table.createdAt),
    index("ai_chat_userId_status_createdAt_idx").on(table.userId, table.status, table.createdAt),
]);
export const aiChatMessage = pgTable("ai_chat_message", {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
        .notNull()
        .references(() => aiChat.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // "system" | "user" | "assistant" | "tool"
    content: text("content"),
    toolCalls: jsonb("tool_calls"),
    toolCallId: text("tool_call_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("ai_chat_message_chatId_idx").on(table.chatId),
    index("ai_chat_message_createdAt_idx").on(table.createdAt),
    index("ai_chat_message_chatId_createdAt_idx").on(table.chatId, table.createdAt),
]);
export const aiChatRelations = relations(aiChat, ({ many, one }) => ({
    messages: many(aiChatMessage),
    user: one(user, {
        fields: [aiChat.userId],
        references: [user.id],
    }),
    team: one(team, {
        fields: [aiChat.teamId],
        references: [team.id],
    }),
}));
export const aiChatMessageRelations = relations(aiChatMessage, ({ one }) => ({
    chat: one(aiChat, {
        fields: [aiChatMessage.chatId],
        references: [aiChat.id],
    }),
}));
