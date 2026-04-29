import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
export const apiRequestLog = pgTable("api_request_log", {
    id: text("id").primaryKey(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    path: text("path").notNull(),
    type: text("type").notNull(), // query or mutation
    userId: text("user_id"),
    teamId: text("team_id"),
    apiKeyId: text("api_key_id"),
    input: jsonb("input"),
    status: text("status").notNull(), // SUCCESS or ERROR
    errorCode: text("error_code"),
    durationMs: integer("duration_ms").notNull(),
    ipAddress: text("ip_address"),
}, (table) => {
    return {
        pathIdx: index("api_log_path_idx").on(table.path),
        timestampIdx: index("api_log_timestamp_idx").on(table.timestamp),
        userIdIdx: index("api_log_user_id_idx").on(table.userId),
    };
});
