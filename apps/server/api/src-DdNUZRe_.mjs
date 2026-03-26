
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { n as __export, r as __reExport } from "./chunk-DduSDN3j.mjs";
import "dotenv/config";
import { z } from "zod";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations, sql } from "drizzle-orm";
import { boolean, decimal, doublePrecision, foreignKey, index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

//#region ../../node_modules/.bun/@t3-oss+env-core@0.13.10+b5f3870e1fe10169/node_modules/@t3-oss/env-core/dist/standard.js
function ensureSynchronous(value, message) {
	if (value instanceof Promise) throw new Error(message);
}
function parseWithDictionary(dictionary, value) {
	const result = {};
	const issues = [];
	for (const key in dictionary) {
		const propResult = dictionary[key]["~standard"].validate(value[key]);
		ensureSynchronous(propResult, `Validation must be synchronous, but ${key} returned a Promise.`);
		if (propResult.issues) {
			issues.push(...propResult.issues.map((issue) => ({
				...issue,
				message: issue.message,
				path: [key, ...issue.path ?? []]
			})));
			continue;
		}
		result[key] = propResult.value;
	}
	if (issues.length) return { issues };
	return { value: result };
}

//#endregion
//#region ../../node_modules/.bun/@t3-oss+env-core@0.13.10+b5f3870e1fe10169/node_modules/@t3-oss/env-core/dist/index.js
/**
* Create a new environment variable schema.
*/
function createEnv(opts) {
	const runtimeEnv = opts.runtimeEnvStrict ?? opts.runtimeEnv ?? process.env;
	if (opts.emptyStringAsUndefined ?? false) {
		for (const [key, value] of Object.entries(runtimeEnv)) if (value === "") delete runtimeEnv[key];
	}
	if (!!opts.skipValidation) {
		if (opts.extends) for (const preset of opts.extends) preset.skipValidation = true;
		return runtimeEnv;
	}
	const _client = typeof opts.client === "object" ? opts.client : {};
	const _server = typeof opts.server === "object" ? opts.server : {};
	const _shared = typeof opts.shared === "object" ? opts.shared : {};
	const isServer = opts.isServer ?? (typeof window === "undefined" || "Deno" in window);
	const finalSchemaShape = isServer ? {
		..._server,
		..._shared,
		..._client
	} : {
		..._client,
		..._shared
	};
	const parsed = (opts.createFinalSchema?.(finalSchemaShape, isServer))?.["~standard"].validate(runtimeEnv) ?? parseWithDictionary(finalSchemaShape, runtimeEnv);
	ensureSynchronous(parsed, "Validation must be synchronous");
	const onValidationError = opts.onValidationError ?? ((issues) => {
		console.error("❌ Invalid environment variables:", issues);
		throw new Error("Invalid environment variables");
	});
	const onInvalidAccess = opts.onInvalidAccess ?? (() => {
		throw new Error("❌ Attempted to access a server-side environment variable on the client");
	});
	if (parsed.issues) return onValidationError(parsed.issues);
	const isServerAccess = (prop) => {
		if (!opts.clientPrefix) return true;
		return !prop.startsWith(opts.clientPrefix) && !(prop in _shared);
	};
	const isValidServerAccess = (prop) => {
		return isServer || !isServerAccess(prop);
	};
	const ignoreProp = (prop) => {
		return prop === "__esModule" || prop === "$$typeof";
	};
	const extendedObj = (opts.extends ?? []).reduce((acc, curr) => {
		return Object.assign(acc, curr);
	}, {});
	const fullObj = Object.assign(extendedObj, parsed.value);
	return new Proxy(fullObj, { get(target, prop) {
		if (typeof prop !== "string") return void 0;
		if (ignoreProp(prop)) return void 0;
		if (!isValidServerAccess(prop)) return onInvalidAccess(prop);
		return Reflect.get(target, prop);
	} });
}

//#endregion
//#region ../../packages/env/src/server.ts
const env = createEnv({
	clientPrefix: "PUBLIC_",
	client: {},
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z.enum([
			"development",
			"production",
			"test"
		]).default("development")
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
});

//#endregion
//#region ../../packages/db/src/schema/agency-rbac.ts
const agencyRole = pgTable("agency_role", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
	isSystem: boolean("is_system").default(false).notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("agency_role_name_idx").on(table.name)]);
const agencyPermission = pgTable("agency_permission", {
	id: text("id").primaryKey(),
	key: text("key").notNull().unique(),
	description: text("description"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("agency_permission_key_idx").on(table.key)]);
const agencyRolePermission = pgTable("agency_role_permission", {
	id: text("id").primaryKey(),
	roleId: text("role_id").notNull().references(() => agencyRole.id, { onDelete: "cascade" }),
	permissionId: text("permission_id").notNull().references(() => agencyPermission.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	uniqueIndex("agency_role_permission_roleId_permissionId_unique").on(table.roleId, table.permissionId),
	index("agency_role_permission_roleId_idx").on(table.roleId),
	index("agency_role_permission_permissionId_idx").on(table.permissionId)
]);
const agencyRoleRelations = relations(agencyRole, ({ many }) => ({
	permissions: many(agencyRolePermission),
	users: many(user)
}));
const agencyPermissionRelations = relations(agencyPermission, ({ many }) => ({ roles: many(agencyRolePermission) }));
const agencyRolePermissionRelations = relations(agencyRolePermission, ({ one }) => ({
	role: one(agencyRole, {
		fields: [agencyRolePermission.roleId],
		references: [agencyRole.id]
	}),
	permission: one(agencyPermission, {
		fields: [agencyRolePermission.permissionId],
		references: [agencyPermission.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/auth.ts
var auth_exports = /* @__PURE__ */ __export({
	account: () => account,
	accountRelations: () => accountRelations,
	session: () => session,
	sessionRelations: () => sessionRelations,
	user: () => user,
	userRelations: () => userRelations,
	verification: () => verification
});
const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	role: text("role").default("CUSTOMER").notNull(),
	agencyRoleId: text("agency_role_id"),
	status: text("status").default("ACTIVE").notNull(),
	lastAccessedTeamId: text("last_accessed_team_id"),
	lastLoginAt: timestamp("last_login_at"),
	image: text("image"),
	notificationSoundEnabled: boolean("notification_sound_enabled").default(true),
	browserNotificationsEnabled: boolean("browser_notifications_enabled").default(false),
	notificationSoundVolume: integer("notification_sound_volume").default(100),
	browserNotificationPermission: text("browser_notification_permission").default("default"),
	notificationPreferencesUpdatedAt: timestamp("notification_preferences_updated_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("user_role_idx").on(table.role),
	index("user_agencyRoleId_idx").on(table.agencyRoleId),
	index("user_status_idx").on(table.status),
	index("user_lastAccessedTeamId_idx").on(table.lastAccessedTeamId)
]);
const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
}, (table) => [index("session_userId_idx").on(table.userId)]);
const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("account_userId_idx").on(table.userId)]);
const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);
const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	accounts: many(account),
	agencyRole: one(agencyRole, {
		fields: [user.agencyRoleId],
		references: [agencyRole.id]
	})
}));
const sessionRelations = relations(session, ({ one }) => ({ user: one(user, {
	fields: [session.userId],
	references: [user.id]
}) }));
const accountRelations = relations(account, ({ one }) => ({ user: one(user, {
	fields: [account.userId],
	references: [user.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/teams.ts
const team = pgTable("team", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	baseCurrency: text("base_currency").default("KES").notNull(),
	logoUrl: text("logo_url"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).defaultNow().notNull(),
	createdById: text("created_by_id").notNull()
}, (table) => [
	index("team_slug_idx").on(table.slug),
	index("team_createdById_idx").on(table.createdById),
	index("team_isActive_idx").on(table.isActive)
]);
const teamMember = pgTable("team_member", {
	id: text("id").primaryKey(),
	teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	role: text("role").default("MEMBER").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).defaultNow().notNull()
}, (table) => [index("team_member_teamId_idx").on(table.teamId), index("team_member_userId_idx").on(table.userId)]);
const teamInvite = pgTable("team_invite", {
	id: text("id").primaryKey(),
	code: text("code").notNull().unique(),
	teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	role: text("role").default("MEMBER").notNull(),
	status: text("status").default("PENDING").notNull(),
	invitedById: text("invited_by_id").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	acceptedAt: timestamp("accepted_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).defaultNow().notNull()
}, (table) => [
	index("team_invite_code_idx").on(table.code),
	index("team_invite_teamId_idx").on(table.teamId),
	index("team_invite_email_idx").on(table.email),
	index("team_invite_status_idx").on(table.status),
	index("team_invite_expiresAt_idx").on(table.expiresAt)
]);
const teamBillingSettings = pgTable("team_billing_settings", {
	id: text("id").primaryKey(),
	teamId: text("team_id").notNull().unique().references(() => team.id, { onDelete: "cascade" }),
	legalName: text("legal_name").notNull(),
	billingEmail: text("billing_email").notNull(),
	billingPhone: text("billing_phone"),
	addressLine1: text("address_line1").notNull(),
	addressLine2: text("address_line2"),
	city: text("city").notNull(),
	state: text("state"),
	country: text("country").notNull(),
	postalCode: text("postal_code"),
	taxId: text("tax_id"),
	additionalNotes: text("additional_notes"),
	updatedBy: text("updated_by").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).defaultNow().notNull()
}, (table) => [index("team_billing_settings_teamId_idx").on(table.teamId)]);
const teamBillingSettingsActivityLog = pgTable("team_billing_settings_activity_log", {
	id: text("id").primaryKey(),
	teamBillingSettingsId: text("team_billing_settings_id").notNull().references(() => teamBillingSettings.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("team_billing_settings_activity_teamBillingSettingsId_idx").on(table.teamBillingSettingsId),
	index("team_billing_settings_activity_userId_idx").on(table.userId),
	index("team_billing_settings_activity_action_idx").on(table.action),
	index("team_billing_settings_activity_createdAt_idx").on(table.createdAt)
]);
const teamRelations = relations(team, ({ many }) => ({
	members: many(teamMember),
	invites: many(teamInvite),
	billingSettings: many(teamBillingSettings)
}));
const teamMemberRelations = relations(teamMember, ({ one }) => ({
	team: one(team, {
		fields: [teamMember.teamId],
		references: [team.id]
	}),
	user: one(user, {
		fields: [teamMember.userId],
		references: [user.id]
	})
}));
const teamInviteRelations = relations(teamInvite, ({ one }) => ({ team: one(team, {
	fields: [teamInvite.teamId],
	references: [team.id]
}) }));
const teamBillingSettingsRelations = relations(teamBillingSettings, ({ one }) => ({ team: one(team, {
	fields: [teamBillingSettings.teamId],
	references: [team.id]
}) }));
const teamBillingSettingsActivityLogRelations = relations(teamBillingSettingsActivityLog, ({ one }) => ({ teamBillingSettings: one(teamBillingSettings, {
	fields: [teamBillingSettingsActivityLog.teamBillingSettingsId],
	references: [teamBillingSettings.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/ai.ts
const aiChat = pgTable("ai_chat", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	title: text("title"),
	status: text("status").default("ACTIVE").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).defaultNow().notNull(),
	closedAt: timestamp("closed_at")
}, (table) => [
	index("ai_chat_userId_idx").on(table.userId),
	index("ai_chat_teamId_idx").on(table.teamId),
	index("ai_chat_status_idx").on(table.status),
	index("ai_chat_createdAt_idx").on(table.createdAt),
	index("ai_chat_userId_status_createdAt_idx").on(table.userId, table.status, table.createdAt)
]);
const aiChatMessage = pgTable("ai_chat_message", {
	id: text("id").primaryKey(),
	chatId: text("chat_id").notNull().references(() => aiChat.id, { onDelete: "cascade" }),
	role: text("role").notNull(),
	content: text("content"),
	toolCalls: jsonb("tool_calls"),
	toolCallId: text("tool_call_id"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("ai_chat_message_chatId_idx").on(table.chatId),
	index("ai_chat_message_createdAt_idx").on(table.createdAt),
	index("ai_chat_message_chatId_createdAt_idx").on(table.chatId, table.createdAt)
]);
const aiChatRelations = relations(aiChat, ({ many, one }) => ({
	messages: many(aiChatMessage),
	user: one(user, {
		fields: [aiChat.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [aiChat.teamId],
		references: [team.id]
	})
}));
const aiChatMessageRelations = relations(aiChatMessage, ({ one }) => ({ chat: one(aiChat, {
	fields: [aiChatMessage.chatId],
	references: [aiChat.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/invoicing.ts
const invoice = pgTable("invoice", {
	id: text("id").primaryKey(),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	customerId: text("customer_id"),
	customerName: text("customer_name"),
	customerEmail: text("customer_email"),
	invoiceNumber: text("invoice_number"),
	token: text("token").notNull().unique(),
	status: text("status").default("DRAFT").notNull(),
	amount: text("amount"),
	subtotal: text("subtotal"),
	tax: text("tax"),
	taxPercentage: doublePrecision("tax_percentage"),
	vat: text("vat"),
	discount: text("discount"),
	currency: text("currency").default("KES").notNull(),
	creditedAmount: text("credited_amount"),
	creditBalance: text("credit_balance"),
	issueDate: timestamp("issue_date"),
	dueDate: timestamp("due_date"),
	paidAt: timestamp("paid_at"),
	sentAt: timestamp("sent_at"),
	reminderSentAt: timestamp("reminder_sent_at"),
	viewedAt: timestamp("viewed_at"),
	note: text("note"),
	internalNote: text("internal_note"),
	fromDetails: jsonb("from_details"),
	customerDetails: jsonb("customer_details"),
	paymentDetails: jsonb("payment_details"),
	noteDetails: jsonb("note_details"),
	template: jsonb("template"),
	topBlock: jsonb("top_block"),
	bottomBlock: jsonb("bottom_block"),
	metadata: jsonb("metadata"),
	createdBy: text("created_by").notNull(),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	kraInvoiceNumber: text("kra_invoice_number"),
	kraReceiptNumber: text("kra_receipt_number"),
	kraSignature: text("kra_signature"),
	kraQrCode: text("kra_qr_code"),
	kraVerifiedDate: timestamp("kra_verified_date"),
	kraStatus: text("kra_status"),
	kraError: text("kra_error")
}, (table) => [
	uniqueIndex("invoice_teamId_invoiceNumber_unique").on(table.teamId, table.invoiceNumber),
	index("invoice_teamId_idx").on(table.teamId),
	index("invoice_status_idx").on(table.status),
	index("invoice_dueDate_idx").on(table.dueDate),
	index("invoice_sentAt_idx").on(table.sentAt),
	index("invoice_invoiceNumber_idx").on(table.invoiceNumber)
]);
const invoiceLineItem = pgTable("invoice_line_item", {
	id: text("id").primaryKey(),
	invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "cascade" }),
	position: integer("position").default(0).notNull(),
	name: text("name"),
	description: text("description"),
	quantity: doublePrecision("quantity"),
	unit: text("unit"),
	price: text("price"),
	discount: text("discount"),
	total: text("total"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("invoice_line_item_invoiceId_idx").on(table.invoiceId), index("invoice_line_item_position_idx").on(table.position)]);
const invoiceTransaction = pgTable("invoice_transaction", {
	id: text("id").primaryKey(),
	invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "cascade" }),
	reference: text("reference"),
	providerReference: text("provider_reference"),
	status: text("status").default("PENDING").notNull(),
	method: text("method").notNull(),
	amount: text("amount").notNull(),
	currency: text("currency").default("KES").notNull(),
	paidAt: timestamp("paid_at"),
	notes: text("notes"),
	metadata: jsonb("metadata"),
	recordedBy: text("recorded_by"),
	balanceBefore: text("balance_before"),
	balanceAfter: text("balance_after"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("invoice_transaction_invoiceId_idx").on(table.invoiceId),
	index("invoice_transaction_status_idx").on(table.status),
	index("invoice_transaction_paidAt_idx").on(table.paidAt)
]);
const creditNote = pgTable("invoice_credit_note", {
	id: text("id").primaryKey(),
	invoiceId: text("invoice_id").notNull().unique().references(() => invoice.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	creditNumber: text("credit_number"),
	status: text("status").default("DRAFT").notNull(),
	amount: text("amount").notNull(),
	currency: text("currency").default("KES").notNull(),
	reason: text("reason"),
	note: text("note"),
	metadata: jsonb("metadata"),
	issuedAt: timestamp("issued_at"),
	appliedAt: timestamp("applied_at"),
	createdBy: text("created_by").notNull(),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("credit_note_teamId_idx").on(table.teamId),
	index("credit_note_status_idx").on(table.status),
	index("credit_note_issuedAt_idx").on(table.issuedAt)
]);
const invoiceActivityLog = pgTable("invoice_activity_log", {
	id: text("id").primaryKey(),
	invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("invoice_activity_log_invoiceId_idx").on(table.invoiceId),
	index("invoice_activity_log_userId_idx").on(table.userId),
	index("invoice_activity_log_action_idx").on(table.action),
	index("invoice_activity_log_createdAt_idx").on(table.createdAt)
]);
const invoiceTransactionActivityLog = pgTable("invoice_transaction_activity_log", {
	id: text("id").primaryKey(),
	invoiceTransactionId: text("invoice_transaction_id").notNull().references(() => invoiceTransaction.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("invoice_transaction_activity_log_invoiceTransactionId_idx").on(table.invoiceTransactionId),
	index("invoice_transaction_activity_log_userId_idx").on(table.userId),
	index("invoice_transaction_activity_log_action_idx").on(table.action),
	index("invoice_transaction_activity_log_createdAt_idx").on(table.createdAt)
]);
const creditNoteActivityLog = pgTable("invoice_credit_note_activity_log", {
	id: text("id").primaryKey(),
	creditNoteId: text("credit_note_id").notNull().references(() => creditNote.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("credit_note_activity_log_creditNoteId_idx").on(table.creditNoteId),
	index("credit_note_activity_log_userId_idx").on(table.userId),
	index("credit_note_activity_log_action_idx").on(table.action),
	index("credit_note_activity_log_createdAt_idx").on(table.createdAt)
]);
const invoiceCounter = pgTable("invoice_counter", {
	id: text("id").primaryKey().default("invoice-counter"),
	lastNumber: integer("last_number").default(0).notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
}, () => []);
const invoiceRelations = relations(invoice, ({ one, many }) => ({
	team: one(team, {
		fields: [invoice.teamId],
		references: [team.id]
	}),
	lineItems: many(invoiceLineItem),
	transactions: many(invoiceTransaction),
	creditNote: one(creditNote, {
		fields: [invoice.id],
		references: [creditNote.invoiceId]
	}),
	activityLogs: many(invoiceActivityLog)
}));
const invoiceLineItemRelations = relations(invoiceLineItem, ({ one }) => ({ invoice: one(invoice, {
	fields: [invoiceLineItem.invoiceId],
	references: [invoice.id]
}) }));
const invoiceTransactionRelations = relations(invoiceTransaction, ({ one, many }) => ({
	invoice: one(invoice, {
		fields: [invoiceTransaction.invoiceId],
		references: [invoice.id]
	}),
	activityLogs: many(invoiceTransactionActivityLog)
}));
const creditNoteRelations = relations(creditNote, ({ one, many }) => ({
	invoice: one(invoice, {
		fields: [creditNote.invoiceId],
		references: [invoice.id]
	}),
	team: one(team, {
		fields: [creditNote.teamId],
		references: [team.id]
	}),
	activityLogs: many(creditNoteActivityLog)
}));
const invoiceActivityLogRelations = relations(invoiceActivityLog, ({ one }) => ({ invoice: one(invoice, {
	fields: [invoiceActivityLog.invoiceId],
	references: [invoice.id]
}) }));
const invoiceTransactionActivityLogRelations = relations(invoiceTransactionActivityLog, ({ one }) => ({ invoiceTransaction: one(invoiceTransaction, {
	fields: [invoiceTransactionActivityLog.invoiceTransactionId],
	references: [invoiceTransaction.id]
}) }));
const creditNoteActivityLogRelations = relations(creditNoteActivityLog, ({ one }) => ({ creditNote: one(creditNote, {
	fields: [creditNoteActivityLog.creditNoteId],
	references: [creditNote.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/tickets.ts
const ticket = pgTable("ticket", {
	id: text("_id").primaryKey(),
	ticketNumber: text("ticket_number").notNull().unique(),
	subject: text("subject"),
	description: text("description"),
	type: text("type").default("GENERAL").notNull(),
	priority: text("priority").default("NORMAL").notNull(),
	status: text("status").default("OPEN").notNull(),
	source: text("source").default("WEB").notNull(),
	createdById: text("created_by_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	assignedToId: text("assigned_to_id").references(() => user.id, { onDelete: "set null" }),
	lastMessageId: text("last_message_id"),
	lastMessageAt: timestamp("last_message_at"),
	lastMessagePreview: text("last_message_preview"),
	unreadCount: integer("unread_count").default(0).notNull(),
	customerUnreadCount: integer("customer_unread_count").default(0).notNull(),
	metadata: jsonb("metadata"),
	internalNotes: text("internal_notes"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	resolvedAt: timestamp("resolved_at"),
	closedAt: timestamp("closed_at"),
	firstResponseAt: timestamp("first_response_at"),
	lastResponseAt: timestamp("last_response_at"),
	lastCustomerResponseAt: timestamp("last_customer_response_at"),
	lastAgentResponseAt: timestamp("last_agent_response_at")
}, (table) => [
	index("ticket_createdById_idx").on(table.createdById),
	index("ticket_teamId_idx").on(table.teamId),
	index("ticket_assignedToId_idx").on(table.assignedToId),
	index("ticket_status_idx").on(table.status),
	index("ticket_priority_idx").on(table.priority),
	index("ticket_type_idx").on(table.type),
	index("ticket_ticketNumber_idx").on(table.ticketNumber),
	index("ticket_createdAt_idx").on(table.createdAt),
	index("ticket_lastMessageAt_idx").on(table.lastMessageAt),
	index("ticket_status_priority_idx").on(table.status, table.priority),
	index("ticket_teamId_status_idx").on(table.teamId, table.status),
	index("ticket_assignedToId_status_idx").on(table.assignedToId, table.status)
]);
const ticketMessage = pgTable("ticket_message", {
	id: text("_id").primaryKey(),
	ticketId: text("ticket_id").notNull().references(() => ticket.id, { onDelete: "cascade" }),
	senderId: text("sender_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	content: text("content").notNull(),
	isInternal: boolean("is_internal").default(false).notNull(),
	isSystem: boolean("is_system").default(false).notNull(),
	readStatus: text("read_status").default("SENT").notNull(),
	readAt: timestamp("read_at"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	editedAt: timestamp("edited_at"),
	deletedAt: timestamp("deleted_at")
}, (table) => [
	index("ticket_message_ticketId_idx").on(table.ticketId),
	index("ticket_message_senderId_idx").on(table.senderId),
	index("ticket_message_createdAt_idx").on(table.createdAt),
	index("ticket_message_ticketId_createdAt_idx").on(table.ticketId, table.createdAt),
	index("ticket_message_isInternal_idx").on(table.isInternal),
	index("ticket_message_deletedAt_idx").on(table.deletedAt),
	index("ticket_message_readStatus_idx").on(table.readStatus)
]);
const ticketAttachment = pgTable("ticket_attachment", {
	id: text("_id").primaryKey(),
	ticketId: text("ticket_id").references(() => ticket.id, { onDelete: "cascade" }),
	messageId: text("message_id").references(() => ticketMessage.id, { onDelete: "cascade" }),
	uploadedById: text("uploaded_by_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	fileName: text("file_name").notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: text("mime_type").notNull(),
	fileUrl: text("file_url").notNull(),
	storageKey: text("storage_key"),
	description: text("description"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("ticket_attachment_ticketId_idx").on(table.ticketId),
	index("ticket_attachment_messageId_idx").on(table.messageId),
	index("ticket_attachment_uploadedById_idx").on(table.uploadedById),
	index("ticket_attachment_createdAt_idx").on(table.createdAt)
]);
const ticketTag = pgTable("ticket_tag", {
	id: text("_id").primaryKey(),
	name: text("name").notNull().unique(),
	color: text("color"),
	description: text("description"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("ticket_tag_name_idx").on(table.name)]);
const ticketTagRelation = pgTable("ticket_tag_relation", {
	id: text("_id").primaryKey(),
	ticketId: text("ticket_id").notNull().references(() => ticket.id, { onDelete: "cascade" }),
	tagId: text("tag_id").notNull().references(() => ticketTag.id, { onDelete: "cascade" }),
	addedById: text("added_by_id"),
	addedAt: timestamp("added_at").notNull()
}, (table) => [
	uniqueIndex("ticket_tag_relation_ticketId_tagId_unique").on(table.ticketId, table.tagId),
	index("ticket_tag_relation_ticketId_idx").on(table.ticketId),
	index("ticket_tag_relation_tagId_idx").on(table.tagId)
]);
const ticketActivityLog = pgTable("ticket_activity_log", {
	id: text("_id").primaryKey(),
	ticketId: text("ticket_id").notNull().references(() => ticket.id, { onDelete: "cascade" }),
	userId: text("user_id"),
	action: text("action").notNull(),
	description: text("description"),
	oldValue: jsonb("old_value"),
	newValue: jsonb("new_value"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("ticket_activity_log_ticketId_idx").on(table.ticketId),
	index("ticket_activity_log_userId_idx").on(table.userId),
	index("ticket_activity_log_action_idx").on(table.action),
	index("ticket_activity_log_createdAt_idx").on(table.createdAt),
	index("ticket_activity_log_ticketId_createdAt_idx").on(table.ticketId, table.createdAt)
]);
const ticketRelations = relations(ticket, ({ many, one }) => ({
	createdBy: one(user, {
		fields: [ticket.createdById],
		references: [user.id],
		relationName: "CreatedTickets"
	}),
	team: one(team, {
		fields: [ticket.teamId],
		references: [team.id]
	}),
	assignedTo: one(user, {
		fields: [ticket.assignedToId],
		references: [user.id],
		relationName: "AssignedTickets"
	}),
	messages: many(ticketMessage),
	attachments: many(ticketAttachment),
	tags: many(ticketTagRelation),
	activityLogs: many(ticketActivityLog)
}));
const ticketMessageRelations = relations(ticketMessage, ({ one, many }) => ({
	ticket: one(ticket, {
		fields: [ticketMessage.ticketId],
		references: [ticket.id]
	}),
	sender: one(user, {
		fields: [ticketMessage.senderId],
		references: [user.id]
	}),
	attachments: many(ticketAttachment)
}));
const ticketAttachmentRelations = relations(ticketAttachment, ({ one }) => ({
	ticket: one(ticket, {
		fields: [ticketAttachment.ticketId],
		references: [ticket.id]
	}),
	message: one(ticketMessage, {
		fields: [ticketAttachment.messageId],
		references: [ticketMessage.id]
	}),
	uploadedBy: one(user, {
		fields: [ticketAttachment.uploadedById],
		references: [user.id]
	})
}));
const ticketTagRelations = relations(ticketTag, ({ many }) => ({ tickets: many(ticketTagRelation) }));
const ticketTagRelationRelations = relations(ticketTagRelation, ({ one }) => ({
	ticket: one(ticket, {
		fields: [ticketTagRelation.ticketId],
		references: [ticket.id]
	}),
	tag: one(ticketTag, {
		fields: [ticketTagRelation.tagId],
		references: [ticketTag.id]
	})
}));
const ticketActivityLogRelations = relations(ticketActivityLog, ({ one }) => ({ ticket: one(ticket, {
	fields: [ticketActivityLog.ticketId],
	references: [ticket.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/web-design-quotes.ts
const webDesignQuoteRequest = pgTable("web_design_quote_request", {
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
	submittedById: text("submitted_by_id").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("web_design_quote_request_status_idx").on(table.status),
	index("web_design_quote_request_submittedById_idx").on(table.submittedById),
	index("web_design_quote_request_createdAt_idx").on(table.createdAt),
	index("web_design_quote_request_email_idx").on(table.email)
]);
const webDesignQuoteRequestRelations = relations(webDesignQuoteRequest, ({ one }) => ({ submittedBy: one(user, {
	fields: [webDesignQuoteRequest.submittedById],
	references: [user.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/products.ts
/** Prisma `Json[]` / `String[]` @default([]) → jsonb (project convention). */
const emptyJsonbArray = sql`'[]'::jsonb`;
const niscProduct = pgTable("nisc_product", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	category: text("category").notNull(),
	serviceType: text("service_type").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	features: jsonb("features").notNull().default(emptyJsonbArray),
	highlights: jsonb("highlights").notNull().default(emptyJsonbArray),
	isAddOn: boolean("is_add_on").default(false).notNull(),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("nisc_product_category_idx").on(table.category),
	index("nisc_product_serviceType_idx").on(table.serviceType),
	index("nisc_product_isActive_idx").on(table.isActive),
	index("nisc_product_isAddOn_idx").on(table.isAddOn)
]);
const niscProductAddOn = pgTable("nisc_product_add_on", {
	id: text("id").primaryKey(),
	productId: text("product_id").notNull().references(() => niscProduct.id, { onDelete: "cascade" }),
	baseProductId: text("base_product_id").notNull().references(() => niscProduct.id, { onDelete: "cascade" }),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("nisc_product_add_on_productId_baseProductId_unique").on(table.productId, table.baseProductId),
	index("nisc_product_add_on_productId_idx").on(table.productId),
	index("nisc_product_add_on_baseProductId_idx").on(table.baseProductId)
]);
const niscProductPlan = pgTable("nisc_product_plan", {
	id: text("id").primaryKey(),
	productId: text("product_id").notNull().references(() => niscProduct.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	pricingModel: text("pricing_model").notNull(),
	billingCycle: text("billing_cycle"),
	price: text("price"),
	currency: text("currency").default("KES"),
	setupFee: text("setup_fee"),
	cost: text("cost"),
	costCurrency: text("cost_currency").default("KES"),
	commissionRate: decimal("commission_rate", {
		precision: 10,
		scale: 4
	}),
	commissionBase: text("commission_base"),
	commissionBaseDescription: text("commission_base_description"),
	planFeatures: jsonb("plan_features").notNull().default(emptyJsonbArray),
	highlights: jsonb("highlights").notNull().default(emptyJsonbArray),
	isPopular: boolean("is_popular").default(false).notNull(),
	isRecommended: boolean("is_recommended").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	pleskServicePlanId: text("plesk_service_plan_id"),
	pleskFilterId: text("plesk_filter_id"),
	pleskIpAddress: text("plesk_ip_address"),
	hostingType: text("hosting_type"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("nisc_product_plan_productId_idx").on(table.productId),
	index("nisc_product_plan_pricingModel_idx").on(table.pricingModel),
	index("nisc_product_plan_isActive_idx").on(table.isActive),
	index("nisc_product_plan_isDefault_idx").on(table.isDefault)
]);
const niscProductPlanUsage = pgTable("nisc_product_plan_usage", {
	id: text("id").primaryKey(),
	productId: text("product_id").notNull().references(() => niscProduct.id, { onDelete: "cascade" }),
	productPlanId: text("product_plan_id").notNull().references(() => niscProductPlan.id, { onDelete: "cascade" }),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	usageKind: text("usage_kind").notNull(),
	limitValue: text("limit_value").notNull(),
	overuse: text("overuse").notNull(),
	period: text("period"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("nisc_product_plan_usage_productId_idx").on(table.productId),
	index("nisc_product_plan_usage_productPlanId_idx").on(table.productPlanId),
	index("nisc_product_plan_usage_usageKind_idx").on(table.usageKind),
	index("nisc_product_plan_usage_userId_idx").on(table.userId),
	index("nisc_product_plan_usage_teamId_idx").on(table.teamId)
]);
const niscClientSubscription = pgTable("nisc_client_subscription", {
	id: text("id").primaryKey(),
	name: text("name"),
	description: text("description"),
	userId: text("user_id"),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	productId: text("product_id").notNull().references(() => niscProduct.id, { onDelete: "restrict" }),
	productPlanId: text("product_plan_id").references(() => niscProductPlan.id, { onDelete: "set null" }),
	orderId: text("order_id"),
	niscOrderId: text("nisc_order_id"),
	subscribedBy: text("subscribed_by"),
	recordedBy: text("recorded_by"),
	status: text("status").default("PENDING").notNull(),
	subscriptionDate: timestamp("subscription_date"),
	billingCycle: text("billing_cycle"),
	nextRenewalDate: timestamp("next_renewal_date"),
	expiryDate: timestamp("expiry_date"),
	autoRenew: boolean("auto_renew").default(false).notNull(),
	upgradedToSubscriptionId: text("upgraded_to_subscription_id").unique(),
	upgradedAt: timestamp("upgraded_at"),
	downgradedToSubscriptionId: text("downgraded_to_subscription_id").unique(),
	downgradedAt: timestamp("downgraded_at"),
	pricingModel: text("pricing_model").notNull(),
	agreedPrice: text("agreed_price"),
	agreedCurrency: text("agreed_currency").default("KES"),
	agreedCost: text("agreed_cost"),
	agreedCostCurrency: text("agreed_cost_currency").default("KES"),
	providerCost: text("provider_cost"),
	providerCostCurrency: text("provider_cost_currency").default("KES"),
	agreedCommissionRate: decimal("agreed_commission_rate", {
		precision: 10,
		scale: 4
	}),
	agreedCommissionBase: text("agreed_commission_base"),
	primaryDomain: text("primary_domain"),
	pleskFilterId: text("plesk_filter_id"),
	pleskOwnerId: text("plesk_owner_id"),
	pleskFtpLogin: text("plesk_ftp_login"),
	pleskFtpPassword: text("plesk_ftp_password"),
	hostingType: text("hosting_type"),
	openProviderId: integer("open_provider_id"),
	domainAuthCode: text("domain_auth_code"),
	nameserverGroupId: text("nameserver_group_id"),
	wpInstallationId: integer("wp_installation_id"),
	serviceRefs: jsonb("service_refs"),
	hostingSubscriptionId: text("hosting_subscription_id").unique(),
	notes: text("notes"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	foreignKey({
		columns: [table.upgradedToSubscriptionId],
		foreignColumns: [table.id]
	}).onDelete("set null"),
	foreignKey({
		columns: [table.downgradedToSubscriptionId],
		foreignColumns: [table.id]
	}).onDelete("set null"),
	index("nisc_client_subscription_userId_idx").on(table.userId),
	index("nisc_client_subscription_teamId_idx").on(table.teamId),
	index("nisc_client_subscription_productId_idx").on(table.productId),
	index("nisc_client_subscription_productPlanId_idx").on(table.productPlanId),
	index("nisc_client_subscription_orderId_idx").on(table.orderId),
	index("nisc_client_subscription_niscOrderId_idx").on(table.niscOrderId),
	index("nisc_client_subscription_status_idx").on(table.status),
	index("nisc_client_subscription_upgradedToSubscriptionId_idx").on(table.upgradedToSubscriptionId),
	index("nisc_client_subscription_downgradedToSubscriptionId_idx").on(table.downgradedToSubscriptionId),
	index("nisc_client_subscription_pricingModel_idx").on(table.pricingModel),
	index("nisc_client_subscription_pleskFilterId_idx").on(table.pleskFilterId),
	index("nisc_client_subscription_openProviderId_idx").on(table.openProviderId),
	index("nisc_client_subscription_primaryDomain_idx").on(table.primaryDomain),
	index("nisc_client_subscription_nextRenewalDate_idx").on(table.nextRenewalDate),
	index("nisc_client_subscription_expiryDate_idx").on(table.expiryDate),
	index("nisc_client_subscription_subscriptionDate_idx").on(table.subscriptionDate)
]);
const niscClientSubscriptionUsage = pgTable("nisc_client_subscription_usage", {
	id: text("id").primaryKey(),
	subscriptionId: text("subscription_id").notNull().references(() => niscClientSubscription.id, { onDelete: "cascade" }),
	usageKind: text("usage_kind").notNull(),
	credits: text("credits").notNull(),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("nisc_client_subscription_usage_subscriptionId_usageKind_unique").on(table.subscriptionId, table.usageKind),
	index("nisc_client_subscription_usage_subscriptionId_idx").on(table.subscriptionId),
	index("nisc_client_subscription_usage_usageKind_idx").on(table.usageKind)
]);
const niscClientSubscriptionUsageActivityLog = pgTable("nisc_client_subscription_usage_activity_log", {
	id: text("id").primaryKey(),
	subscriptionUsageId: text("subscription_usage_id").notNull().references(() => niscClientSubscriptionUsage.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("nisc_client_sub_usage_activity_subscriptionUsageId_idx").on(table.subscriptionUsageId),
	index("nisc_client_sub_usage_activity_userId_idx").on(table.userId),
	index("nisc_client_sub_usage_activity_action_idx").on(table.action),
	index("nisc_client_sub_usage_activity_createdAt_idx").on(table.createdAt)
]);
const niscClientSubscriptionRenewal = pgTable("nisc_client_subscription_renewal", {
	id: text("id").primaryKey(),
	subscriptionId: text("subscription_id").notNull().references(() => niscClientSubscription.id, { onDelete: "cascade" }),
	renewalType: text("renewal_type").notNull(),
	renewedBy: text("renewed_by"),
	renewalDate: timestamp("renewal_date").notNull(),
	newExpiryDate: timestamp("new_expiry_date"),
	newNextRenewalDate: timestamp("new_next_renewal_date"),
	billingCycle: text("billing_cycle"),
	status: text("status").default("ACTIVE").notNull(),
	renewalPrice: text("renewal_price"),
	renewalCurrency: text("renewal_currency").default("KES"),
	providerRenewalPrice: text("provider_renewal_price"),
	providerRenewalCurrency: text("provider_renewal_currency").default("KES"),
	orderId: text("order_id"),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("nisc_client_subscription_renewal_subscriptionId_idx").on(table.subscriptionId),
	index("nisc_client_subscription_renewal_renewalType_idx").on(table.renewalType),
	index("nisc_client_subscription_renewal_renewalDate_idx").on(table.renewalDate),
	index("nisc_client_subscription_renewal_newExpiryDate_idx").on(table.newExpiryDate),
	index("nisc_client_subscription_renewal_status_idx").on(table.status)
]);
const niscClientSubscriptionActivityLog = pgTable("nisc_client_subscription_activity_log", {
	id: text("id").primaryKey(),
	subscriptionId: text("subscription_id").notNull().references(() => niscClientSubscription.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("nisc_client_sub_activity_subscriptionId_idx").on(table.subscriptionId),
	index("nisc_client_sub_activity_userId_idx").on(table.userId),
	index("nisc_client_sub_activity_action_idx").on(table.action),
	index("nisc_client_sub_activity_createdAt_idx").on(table.createdAt)
]);
const niscClientSubscriptionRenewalActivityLog = pgTable("nisc_client_subscription_renewal_activity_log", {
	id: text("id").primaryKey(),
	renewalId: text("renewal_id").notNull().references(() => niscClientSubscriptionRenewal.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("nisc_client_sub_renewal_activity_renewalId_idx").on(table.renewalId),
	index("nisc_client_sub_renewal_activity_userId_idx").on(table.userId),
	index("nisc_client_sub_renewal_activity_action_idx").on(table.action),
	index("nisc_client_sub_renewal_activity_createdAt_idx").on(table.createdAt)
]);
/** Commission billing rows for COMMISSION-priced NISC client subscriptions (legacy Prisma: NiscCommissionEntry). */
const niscCommissionEntry = pgTable("nisc_commission_entry", {
	id: text("id").primaryKey(),
	subscriptionId: text("subscription_id").notNull().references(() => niscClientSubscription.id, { onDelete: "cascade" }),
	productPlanId: text("product_plan_id").notNull().references(() => niscProductPlan.id, { onDelete: "restrict" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	period: text("period").notNull(),
	baseAmount: decimal("base_amount", {
		precision: 18,
		scale: 4
	}).notNull(),
	baseAmountDescription: text("base_amount_description"),
	commissionRate: decimal("commission_rate", {
		precision: 10,
		scale: 4
	}).notNull(),
	commissionAmount: decimal("commission_amount", {
		precision: 18,
		scale: 4
	}).notNull(),
	currency: text("currency").default("KES").notNull(),
	status: text("status").default("DRAFT").notNull(),
	invoiceId: text("invoice_id"),
	notes: text("notes"),
	createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "restrict" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("nisc_commission_entry_subscriptionId_idx").on(table.subscriptionId),
	index("nisc_commission_entry_teamId_idx").on(table.teamId),
	index("nisc_commission_entry_period_idx").on(table.period),
	index("nisc_commission_entry_status_idx").on(table.status)
]);
const niscProductPromo = pgTable("nisc_product_promo", {
	id: text("id").primaryKey(),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
	description: text("description"),
	discountType: text("discount_type").notNull(),
	discountValue: text("discount_value"),
	discountCurrency: text("discount_currency").default("KES"),
	productId: text("product_id").references(() => niscProduct.id, { onDelete: "set null" }),
	productPlanId: text("product_plan_id").references(() => niscProductPlan.id, { onDelete: "set null" }),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	usageLimit: integer("usage_limit"),
	usageCount: integer("usage_count").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	minOrderValue: text("min_order_value"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("nisc_product_promo_code_idx").on(table.code),
	index("nisc_product_promo_productId_idx").on(table.productId),
	index("nisc_product_promo_productPlanId_idx").on(table.productPlanId),
	index("nisc_product_promo_isActive_idx").on(table.isActive),
	index("nisc_product_promo_startDate_idx").on(table.startDate),
	index("nisc_product_promo_endDate_idx").on(table.endDate)
]);
const niscProductPromoRedeem = pgTable("nisc_product_promo_redeem", {
	id: text("id").primaryKey(),
	promoId: text("promo_id").notNull().references(() => niscProductPromo.id, { onDelete: "cascade" }),
	redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
	userId: text("user_id"),
	teamId: text("team_id"),
	orderId: text("order_id"),
	subscriptionId: text("subscription_id").references(() => niscClientSubscription.id, { onDelete: "set null" }),
	renewalId: text("renewal_id").references(() => niscClientSubscriptionRenewal.id, { onDelete: "set null" }),
	discountApplied: text("discount_applied"),
	orderValue: text("order_value"),
	currency: text("currency").default("KES"),
	notes: text("notes"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("nisc_product_promo_redeem_promoId_idx").on(table.promoId),
	index("nisc_product_promo_redeem_redeemedAt_idx").on(table.redeemedAt),
	index("nisc_product_promo_redeem_userId_idx").on(table.userId),
	index("nisc_product_promo_redeem_teamId_idx").on(table.teamId),
	index("nisc_product_promo_redeem_orderId_idx").on(table.orderId),
	index("nisc_product_promo_redeem_subscriptionId_idx").on(table.subscriptionId),
	index("nisc_product_promo_redeem_renewalId_idx").on(table.renewalId)
]);
const niscProductRelations = relations(niscProduct, ({ many }) => ({
	plans: many(niscProductPlan),
	planUsages: many(niscProductPlanUsage),
	subscriptions: many(niscClientSubscription),
	addOnAsProduct: many(niscProductAddOn, { relationName: "addOnProduct" }),
	addOnAsBase: many(niscProductAddOn, { relationName: "baseProduct" }),
	promos: many(niscProductPromo)
}));
const niscProductAddOnRelations = relations(niscProductAddOn, ({ one }) => ({
	addOnProduct: one(niscProduct, {
		fields: [niscProductAddOn.productId],
		references: [niscProduct.id],
		relationName: "addOnProduct"
	}),
	baseProduct: one(niscProduct, {
		fields: [niscProductAddOn.baseProductId],
		references: [niscProduct.id],
		relationName: "baseProduct"
	})
}));
const niscProductPlanRelations = relations(niscProductPlan, ({ one, many }) => ({
	product: one(niscProduct, {
		fields: [niscProductPlan.productId],
		references: [niscProduct.id]
	}),
	planUsages: many(niscProductPlanUsage),
	subscriptions: many(niscClientSubscription),
	promos: many(niscProductPromo)
}));
const niscProductPlanUsageRelations = relations(niscProductPlanUsage, ({ one }) => ({
	product: one(niscProduct, {
		fields: [niscProductPlanUsage.productId],
		references: [niscProduct.id]
	}),
	productPlan: one(niscProductPlan, {
		fields: [niscProductPlanUsage.productPlanId],
		references: [niscProductPlan.id]
	}),
	user: one(user, {
		fields: [niscProductPlanUsage.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [niscProductPlanUsage.teamId],
		references: [team.id]
	})
}));
const niscClientSubscriptionRelations = relations(niscClientSubscription, ({ one, many }) => ({
	team: one(team, {
		fields: [niscClientSubscription.teamId],
		references: [team.id]
	}),
	product: one(niscProduct, {
		fields: [niscClientSubscription.productId],
		references: [niscProduct.id]
	}),
	productPlan: one(niscProductPlan, {
		fields: [niscClientSubscription.productPlanId],
		references: [niscProductPlan.id]
	}),
	upgradedTo: one(niscClientSubscription, {
		fields: [niscClientSubscription.upgradedToSubscriptionId],
		references: [niscClientSubscription.id],
		relationName: "subscriptionUpgrade"
	}),
	upgradedFrom: many(niscClientSubscription, { relationName: "subscriptionUpgrade" }),
	downgradedTo: one(niscClientSubscription, {
		fields: [niscClientSubscription.downgradedToSubscriptionId],
		references: [niscClientSubscription.id],
		relationName: "subscriptionDowngrade"
	}),
	downgradedFrom: many(niscClientSubscription, { relationName: "subscriptionDowngrade" }),
	usageRecords: many(niscClientSubscriptionUsage),
	renewals: many(niscClientSubscriptionRenewal),
	activityLogs: many(niscClientSubscriptionActivityLog),
	promoRedeems: many(niscProductPromoRedeem),
	commissionEntries: many(niscCommissionEntry)
}));
const niscClientSubscriptionUsageRelations = relations(niscClientSubscriptionUsage, ({ one, many }) => ({
	subscription: one(niscClientSubscription, {
		fields: [niscClientSubscriptionUsage.subscriptionId],
		references: [niscClientSubscription.id]
	}),
	activityLogs: many(niscClientSubscriptionUsageActivityLog)
}));
const niscClientSubscriptionUsageActivityLogRelations = relations(niscClientSubscriptionUsageActivityLog, ({ one }) => ({ subscriptionUsage: one(niscClientSubscriptionUsage, {
	fields: [niscClientSubscriptionUsageActivityLog.subscriptionUsageId],
	references: [niscClientSubscriptionUsage.id]
}) }));
const niscClientSubscriptionRenewalRelations = relations(niscClientSubscriptionRenewal, ({ one, many }) => ({
	subscription: one(niscClientSubscription, {
		fields: [niscClientSubscriptionRenewal.subscriptionId],
		references: [niscClientSubscription.id]
	}),
	activityLogs: many(niscClientSubscriptionRenewalActivityLog),
	promoRedeems: many(niscProductPromoRedeem)
}));
const niscClientSubscriptionActivityLogRelations = relations(niscClientSubscriptionActivityLog, ({ one }) => ({ subscription: one(niscClientSubscription, {
	fields: [niscClientSubscriptionActivityLog.subscriptionId],
	references: [niscClientSubscription.id]
}) }));
const niscClientSubscriptionRenewalActivityLogRelations = relations(niscClientSubscriptionRenewalActivityLog, ({ one }) => ({ renewal: one(niscClientSubscriptionRenewal, {
	fields: [niscClientSubscriptionRenewalActivityLog.renewalId],
	references: [niscClientSubscriptionRenewal.id]
}) }));
const niscCommissionEntryRelations = relations(niscCommissionEntry, ({ one }) => ({
	subscription: one(niscClientSubscription, {
		fields: [niscCommissionEntry.subscriptionId],
		references: [niscClientSubscription.id]
	}),
	productPlan: one(niscProductPlan, {
		fields: [niscCommissionEntry.productPlanId],
		references: [niscProductPlan.id]
	}),
	team: one(team, {
		fields: [niscCommissionEntry.teamId],
		references: [team.id]
	}),
	creator: one(user, {
		fields: [niscCommissionEntry.createdBy],
		references: [user.id]
	})
}));
const niscProductPromoRelations = relations(niscProductPromo, ({ one, many }) => ({
	product: one(niscProduct, {
		fields: [niscProductPromo.productId],
		references: [niscProduct.id]
	}),
	productPlan: one(niscProductPlan, {
		fields: [niscProductPromo.productPlanId],
		references: [niscProductPlan.id]
	}),
	redeems: many(niscProductPromoRedeem)
}));
const niscProductPromoRedeemRelations = relations(niscProductPromoRedeem, ({ one }) => ({
	promo: one(niscProductPromo, {
		fields: [niscProductPromoRedeem.promoId],
		references: [niscProductPromo.id]
	}),
	subscription: one(niscClientSubscription, {
		fields: [niscProductPromoRedeem.subscriptionId],
		references: [niscClientSubscription.id]
	}),
	renewal: one(niscClientSubscriptionRenewal, {
		fields: [niscProductPromoRedeem.renewalId],
		references: [niscClientSubscriptionRenewal.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/auth-extras.ts
const customerIntegration = pgTable("customer_integration", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	platform: text("platform").notNull(),
	platformCustomerId: text("platform_customer_id"),
	isActive: boolean("is_active").default(true).notNull(),
	isCreated: boolean("is_created").default(false).notNull(),
	createdBy: text("created_by"),
	createdAt: timestamp("created_at").notNull(),
	lastSyncedAt: timestamp("last_synced_at"),
	platformData: jsonb("platform_data"),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	uniqueIndex("customer_integration_userId_platform_unique").on(table.userId, table.platform),
	index("customer_integration_userId_idx").on(table.userId),
	index("customer_integration_platform_idx").on(table.platform),
	index("customer_integration_platformCustomerId_idx").on(table.platformCustomerId),
	index("customer_integration_isActive_idx").on(table.isActive),
	index("customer_integration_isCreated_idx").on(table.isCreated)
]);
const customerIntegrationActivityLog = pgTable("customer_integration_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	customerIntegrationId: text("customer_integration_id").notNull().references(() => customerIntegration.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("customer_integration_activity_userId_idx").on(table.userId),
	index("customer_integration_activity_customerIntegrationId_idx").on(table.customerIntegrationId),
	index("customer_integration_activity_action_idx").on(table.action),
	index("customer_integration_activity_createdAt_idx").on(table.createdAt)
]);
const userProfile = pgTable("user_profile", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
	firstName: text("first_name"),
	lastName: text("last_name"),
	phone: text("phone"),
	address: text("address"),
	city: text("city"),
	state: text("state"),
	country: text("country"),
	postalCode: text("postal_code"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("user_profile_userId_idx").on(table.userId)]);
const userActivityLog = pgTable("user_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("user_activity_log_userId_idx").on(table.userId),
	index("user_activity_log_action_idx").on(table.action),
	index("user_activity_log_createdAt_idx").on(table.createdAt)
]);
const customerIntegrationRelations = relations(customerIntegration, ({ one, many }) => ({
	user: one(user, {
		fields: [customerIntegration.userId],
		references: [user.id]
	}),
	activityLogs: many(customerIntegrationActivityLog)
}));
const customerIntegrationActivityLogRelations = relations(customerIntegrationActivityLog, ({ one }) => ({ customerIntegration: one(customerIntegration, {
	fields: [customerIntegrationActivityLog.customerIntegrationId],
	references: [customerIntegration.id]
}) }));
const userProfileRelations = relations(userProfile, ({ one }) => ({ user: one(user, {
	fields: [userProfile.userId],
	references: [user.id]
}) }));
const userActivityLogRelations = relations(userActivityLog, ({ one }) => ({ user: one(user, {
	fields: [userActivityLog.userId],
	references: [user.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/nameservers.ts
const nameserverGroup = pgTable("nameserver_group", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	userId: text("user_id").notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("nameserver_group_userId_idx").on(table.userId), index("nameserver_group_isDefault_idx").on(table.isDefault)]);
const nameserver = pgTable("nameserver", {
	id: text("id").primaryKey(),
	nameserverGroupId: text("nameserver_group_id").notNull().references(() => nameserverGroup.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	ipv4: text("ipv4"),
	ipv6: text("ipv6"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("nameserver_nameserverGroupId_idx").on(table.nameserverGroupId), index("nameserver_name_idx").on(table.name)]);
const tldSettings = pgTable("tld_settings", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	userId: text("user_id").notNull(),
	nameserverGroupId: text("nameserver_group_id").references(() => nameserverGroup.id, { onDelete: "set null" }),
	marginType: text("margin_type"),
	percentageMargin: text("percentage_margin"),
	fixedMargin: text("fixed_margin"),
	roundOff: text("round_off"),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("tld_settings_userId_idx").on(table.userId),
	index("tld_settings_nameserverGroupId_idx").on(table.nameserverGroupId),
	index("tld_settings_marginType_idx").on(table.marginType),
	index("tld_settings_isDefault_idx").on(table.isDefault)
]);
const tldSettingsActivityLog = pgTable("tld_settings_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	tldSettingId: text("tld_setting_id").notNull().references(() => tldSettings.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("tld_settings_activity_userId_idx").on(table.userId),
	index("tld_settings_activity_tldSettingId_idx").on(table.tldSettingId),
	index("tld_settings_activity_action_idx").on(table.action),
	index("tld_settings_activity_createdAt_idx").on(table.createdAt)
]);
const nameserverActivityLog = pgTable("nameserver_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	nameserverId: text("nameserver_id").notNull().references(() => nameserver.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("nameserver_activity_userId_idx").on(table.userId),
	index("nameserver_activity_nameserverId_idx").on(table.nameserverId),
	index("nameserver_activity_action_idx").on(table.action),
	index("nameserver_activity_createdAt_idx").on(table.createdAt)
]);
const nameserverGroupActivityLog = pgTable("nameserver_group_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	nameserverGroupId: text("nameserver_group_id").notNull().references(() => nameserverGroup.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("nameserver_group_activity_userId_idx").on(table.userId),
	index("nameserver_group_activity_nameserverGroupId_idx").on(table.nameserverGroupId),
	index("nameserver_group_activity_action_idx").on(table.action),
	index("nameserver_group_activity_createdAt_idx").on(table.createdAt)
]);
const nameserverGroupRelations = relations(nameserverGroup, ({ many }) => ({
	nameservers: many(nameserver),
	tldSettings: many(tldSettings),
	activityLogs: many(nameserverGroupActivityLog)
}));
const nameserverRelations = relations(nameserver, ({ one, many }) => ({
	nameserverGroup: one(nameserverGroup, {
		fields: [nameserver.nameserverGroupId],
		references: [nameserverGroup.id]
	}),
	activityLogs: many(nameserverActivityLog)
}));
const tldSettingsRelations = relations(tldSettings, ({ one, many }) => ({
	nameserverGroup: one(nameserverGroup, {
		fields: [tldSettings.nameserverGroupId],
		references: [nameserverGroup.id]
	}),
	activityLogs: many(tldSettingsActivityLog)
}));
const tldSettingsActivityLogRelations = relations(tldSettingsActivityLog, ({ one }) => ({ tldSettings: one(tldSettings, {
	fields: [tldSettingsActivityLog.tldSettingId],
	references: [tldSettings.id]
}) }));
const nameserverActivityLogRelations = relations(nameserverActivityLog, ({ one }) => ({ nameserver: one(nameserver, {
	fields: [nameserverActivityLog.nameserverId],
	references: [nameserver.id]
}) }));
const nameserverGroupActivityLogRelations = relations(nameserverGroupActivityLog, ({ one }) => ({ nameserverGroup: one(nameserverGroup, {
	fields: [nameserverGroupActivityLog.nameserverGroupId],
	references: [nameserverGroup.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/domains.ts
const domain = pgTable("domain", {
	id: text("id").primaryKey(),
	domainName: text("domain_name").notNull().unique(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	openProviderId: integer("open_provider_id").notNull(),
	activationDate: timestamp("activation_date"),
	expirationDate: timestamp("expiration_date"),
	renewalDate: timestamp("renewal_date"),
	registrationDate: timestamp("registration_date").notNull(),
	openProviderPrice: text("open_provider_price"),
	niscPrice: text("nisc_price"),
	notes: text("notes"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	customerIntegrationId: text("customer_integration_id").references(() => customerIntegration.id, { onDelete: "set null" }),
	nameserverGroupId: text("nameserver_group_id").references(() => nameserverGroup.id, { onDelete: "set null" })
}, (table) => [
	index("domain_domainName_idx").on(table.domainName),
	index("domain_userId_idx").on(table.userId),
	index("domain_teamId_idx").on(table.teamId),
	index("domain_openProviderId_idx").on(table.openProviderId),
	index("domain_registrationDate_idx").on(table.registrationDate),
	index("domain_expirationDate_idx").on(table.expirationDate)
]);
const domainRenewal = pgTable("domain_renewal", {
	id: text("id").primaryKey(),
	domainId: text("domain_id").notNull().unique().references(() => domain.id, { onDelete: "cascade" }),
	renewedBy: text("renewed_by").notNull(),
	renewalDate: timestamp("renewal_date").notNull(),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	openProviderPrice: text("open_provider_price"),
	niscPrice: text("nisc_price"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("domain_renewal_domainId_idx").on(table.domainId),
	index("domain_renewal_renewalDate_idx").on(table.renewalDate),
	index("domain_renewal_renewedBy_idx").on(table.renewedBy),
	index("domain_renewal_teamId_idx").on(table.teamId)
]);
const domainTransfer = pgTable("domain_transfer", {
	id: text("id").primaryKey(),
	domainId: text("domain_id").notNull().references(() => domain.id, { onDelete: "cascade" }),
	createdById: text("created_by_id").notNull(),
	transferredBy: text("transferred_by"),
	authCode: text("auth_code").notNull(),
	status: text("status").default("PENDING_TRANSFER").notNull(),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	transferRequestedAt: timestamp("transfer_requested_at").notNull(),
	transferCompletedAt: timestamp("transfer_completed_at"),
	openProviderPrice: text("open_provider_price"),
	niscPrice: text("nisc_price"),
	notes: text("notes"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	nameserverGroupId: text("nameserver_group_id").references(() => nameserverGroup.id, { onDelete: "set null" })
}, (table) => [
	index("domain_transfer_domainId_idx").on(table.domainId),
	index("domain_transfer_status_idx").on(table.status),
	index("domain_transfer_transferRequestedAt_idx").on(table.transferRequestedAt),
	index("domain_transfer_transferredBy_idx").on(table.transferredBy),
	index("domain_transfer_createdById_idx").on(table.createdById),
	index("domain_transfer_teamId_idx").on(table.teamId)
]);
const domainActivityLog = pgTable("domain_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	domainId: text("domain_id").notNull().references(() => domain.id, { onDelete: "cascade" }),
	teamId: text("team_id"),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("domain_activity_log_userId_idx").on(table.userId),
	index("domain_activity_log_domainId_idx").on(table.domainId),
	index("domain_activity_log_teamId_idx").on(table.teamId),
	index("domain_activity_log_action_idx").on(table.action),
	index("domain_activity_log_createdAt_idx").on(table.createdAt)
]);
const domainRenewalActivityLog = pgTable("domain_renewal_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	domainRenewalId: text("domain_renewal_id").notNull().references(() => domainRenewal.id, { onDelete: "cascade" }),
	teamId: text("team_id"),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("domain_renewal_activity_log_userId_idx").on(table.userId),
	index("domain_renewal_activity_log_domainRenewalId_idx").on(table.domainRenewalId),
	index("domain_renewal_activity_log_teamId_idx").on(table.teamId),
	index("domain_renewal_activity_log_action_idx").on(table.action),
	index("domain_renewal_activity_log_createdAt_idx").on(table.createdAt)
]);
const domainTransferActivityLog = pgTable("domain_transfer_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	domainTransferId: text("domain_transfer_id").notNull().references(() => domainTransfer.id, { onDelete: "cascade" }),
	teamId: text("team_id"),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("domain_transfer_activity_log_userId_idx").on(table.userId),
	index("domain_transfer_activity_log_domainTransferId_idx").on(table.domainTransferId),
	index("domain_transfer_activity_log_teamId_idx").on(table.teamId),
	index("domain_transfer_activity_log_action_idx").on(table.action),
	index("domain_transfer_activity_log_createdAt_idx").on(table.createdAt)
]);
const domainRelations = relations(domain, ({ one, many }) => ({
	user: one(user, {
		fields: [domain.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [domain.teamId],
		references: [team.id]
	}),
	customerIntegration: one(customerIntegration, {
		fields: [domain.customerIntegrationId],
		references: [customerIntegration.id]
	}),
	nameserverGroup: one(nameserverGroup, {
		fields: [domain.nameserverGroupId],
		references: [nameserverGroup.id]
	}),
	renewals: many(domainRenewal),
	transfers: many(domainTransfer),
	activityLogs: many(domainActivityLog)
}));
const domainRenewalRelations = relations(domainRenewal, ({ one, many }) => ({
	domain: one(domain, {
		fields: [domainRenewal.domainId],
		references: [domain.id]
	}),
	team: one(team, {
		fields: [domainRenewal.teamId],
		references: [team.id]
	}),
	activityLogs: many(domainRenewalActivityLog)
}));
const domainTransferRelations = relations(domainTransfer, ({ one, many }) => ({
	domain: one(domain, {
		fields: [domainTransfer.domainId],
		references: [domain.id]
	}),
	team: one(team, {
		fields: [domainTransfer.teamId],
		references: [team.id]
	}),
	nameserverGroup: one(nameserverGroup, {
		fields: [domainTransfer.nameserverGroupId],
		references: [nameserverGroup.id]
	}),
	activityLogs: many(domainTransferActivityLog)
}));
const domainActivityLogRelations = relations(domainActivityLog, ({ one }) => ({ domain: one(domain, {
	fields: [domainActivityLog.domainId],
	references: [domain.id]
}) }));
const domainRenewalActivityLogRelations = relations(domainRenewalActivityLog, ({ one }) => ({ domainRenewal: one(domainRenewal, {
	fields: [domainRenewalActivityLog.domainRenewalId],
	references: [domainRenewal.id]
}) }));
const domainTransferActivityLogRelations = relations(domainTransferActivityLog, ({ one }) => ({ domainTransfer: one(domainTransfer, {
	fields: [domainTransferActivityLog.domainTransferId],
	references: [domainTransfer.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/hosting.ts
const hostingPlan = pgTable("hosting_plan", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	hostingType: text("hosting_type").notNull(),
	pleskServicePlanId: text("plesk_service_plan_id"),
	pleskFilterId: text("plesk_filter_id"),
	pleskIpAddress: text("plesk_ip_address"),
	features: jsonb("features").notNull(),
	highlights: jsonb("highlights").notNull(),
	isPopular: boolean("is_popular").default(false).notNull(),
	isRecommended: boolean("is_recommended").default(false).notNull(),
	niscPrice: text("nisc_price"),
	niscCurrency: text("nisc_currency").default("KES"),
	billingCycle: text("billing_cycle").default("MONTHLY").notNull(),
	setupFee: text("setup_fee"),
	isActive: boolean("is_active").default(true).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("hosting_plan_hostingType_idx").on(table.hostingType), index("hosting_plan_isActive_idx").on(table.isActive)]);
const niscServicePlan = pgTable("nisc_service_plan", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	planType: text("plan_type").notNull(),
	hostingSubType: text("hosting_sub_type"),
	pleskServicePlanId: text("plesk_service_plan_id"),
	pleskFilterId: text("plesk_filter_id"),
	pleskIpAddress: text("plesk_ip_address"),
	features: jsonb("features").notNull(),
	highlights: jsonb("highlights").notNull(),
	isPopular: boolean("is_popular").default(false).notNull(),
	isRecommended: boolean("is_recommended").default(false).notNull(),
	niscPrice: text("nisc_price"),
	niscCurrency: text("nisc_currency").default("KES"),
	billingCycle: text("billing_cycle").default("MONTHLY").notNull(),
	setupFee: text("setup_fee"),
	isActive: boolean("is_active").default(true).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("nisc_service_plan_planType_idx").on(table.planType),
	index("nisc_service_plan_hostingSubType_idx").on(table.hostingSubType),
	index("nisc_service_plan_isActive_idx").on(table.isActive),
	index("nisc_service_plan_isDefault_idx").on(table.isDefault)
]);
const niscServicePlanActivityLog = pgTable("nisc_service_plan_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	niscServicePlanId: text("nisc_service_plan_id").notNull().references(() => niscServicePlan.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("nisc_service_plan_activity_userId_idx").on(table.userId),
	index("nisc_service_plan_activity_niscServicePlanId_idx").on(table.niscServicePlanId),
	index("nisc_service_plan_activity_action_idx").on(table.action),
	index("nisc_service_plan_activity_createdAt_idx").on(table.createdAt)
]);
const hostingSubscription = pgTable("hosting_subscription", {
	id: text("id").primaryKey(),
	hostingPlanId: text("hosting_plan_id").notNull().references(() => hostingPlan.id, { onDelete: "restrict" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	provisionedBy: text("provisioned_by"),
	pleskFilterId: text("plesk_filter_id").notNull().unique(),
	pleskOwnerId: text("plesk_owner_id"),
	pleskServiceId: text("plesk_service_id"),
	pleskName: text("plesk_name"),
	pleskStatus: integer("plesk_status"),
	pleskDescription: text("plesk_description"),
	pleskAdminDescription: text("plesk_admin_description"),
	pleskFtpLogin: text("plesk_ftp_login"),
	pleskFtpPassword: text("plesk_ftp_password"),
	primaryDomain: text("primary_domain"),
	domainId: text("domain_id").references(() => domain.id, { onDelete: "set null" }),
	operation: text("operation").default("PROVISION").notNull(),
	provisioningMethod: text("provisioning_method").default("AUTOMATIC").notNull(),
	status: text("status").default("PENDING").notNull(),
	hostingType: text("hosting_type").notNull(),
	billingCycle: text("billing_cycle").default("MONTHLY").notNull(),
	nextRenewalDate: timestamp("next_renewal_date"),
	expiryDate: timestamp("expiry_date"),
	niscPrice: text("nisc_price"),
	niscCurrency: text("nisc_currency").default("KES"),
	invoiceNumber: text("invoice_number"),
	customerIntegrationId: text("customer_integration_id").references(() => customerIntegration.id, { onDelete: "set null" }),
	notes: text("notes"),
	autoRenew: boolean("auto_renew").default(true).notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("hosting_subscription_hostingPlanId_idx").on(table.hostingPlanId),
	index("hosting_subscription_teamId_idx").on(table.teamId),
	index("hosting_subscription_pleskFilterId_idx").on(table.pleskFilterId),
	index("hosting_subscription_status_idx").on(table.status),
	index("hosting_subscription_nextRenewalDate_idx").on(table.nextRenewalDate),
	index("hosting_subscription_expiryDate_idx").on(table.expiryDate),
	index("hosting_subscription_primaryDomain_idx").on(table.primaryDomain)
]);
const hostingRenewal = pgTable("hosting_renewal", {
	id: text("id").primaryKey(),
	hostingSubscriptionId: text("hosting_subscription_id").notNull().references(() => hostingSubscription.id, { onDelete: "cascade" }),
	renewedBy: text("renewed_by"),
	renewalDate: timestamp("renewal_date").notNull(),
	expiryDate: timestamp("expiry_date").notNull(),
	billingCycle: text("billing_cycle").notNull(),
	status: text("status").default("ACTIVE").notNull(),
	niscPrice: text("nisc_price"),
	niscCurrency: text("nisc_currency").default("KES"),
	invoiceNumber: text("invoice_number"),
	notes: text("notes"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("hosting_renewal_hostingSubscriptionId_idx").on(table.hostingSubscriptionId),
	index("hosting_renewal_renewalDate_idx").on(table.renewalDate),
	index("hosting_renewal_expiryDate_idx").on(table.expiryDate),
	index("hosting_renewal_renewedBy_idx").on(table.renewedBy)
]);
const hostingPlanActivityLog = pgTable("hosting_plan_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	hostingPlanId: text("hosting_plan_id").notNull().references(() => hostingPlan.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("hosting_plan_activity_userId_idx").on(table.userId),
	index("hosting_plan_activity_hostingPlanId_idx").on(table.hostingPlanId),
	index("hosting_plan_activity_action_idx").on(table.action),
	index("hosting_plan_activity_createdAt_idx").on(table.createdAt)
]);
const hostingSubscriptionActivityLog = pgTable("hosting_subscription_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	hostingSubscriptionId: text("hosting_subscription_id").notNull().references(() => hostingSubscription.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("hosting_subscription_activity_userId_idx").on(table.userId),
	index("hosting_subscription_activity_hostingSubscriptionId_idx").on(table.hostingSubscriptionId),
	index("hosting_subscription_activity_action_idx").on(table.action),
	index("hosting_subscription_activity_createdAt_idx").on(table.createdAt)
]);
const hostingRenewalActivityLog = pgTable("hosting_renewal_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	hostingRenewalId: text("hosting_renewal_id").notNull().references(() => hostingRenewal.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("hosting_renewal_activity_userId_idx").on(table.userId),
	index("hosting_renewal_activity_hostingRenewalId_idx").on(table.hostingRenewalId),
	index("hosting_renewal_activity_action_idx").on(table.action),
	index("hosting_renewal_activity_createdAt_idx").on(table.createdAt)
]);
const wordPressInstance = pgTable("wordpress_instance", {
	id: text("id").primaryKey(),
	teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
	hostingSubscriptionId: text("hosting_subscription_id").references(() => hostingSubscription.id, { onDelete: "set null" }),
	installationId: integer("installation_id").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("wordpress_instance_teamId_idx").on(table.teamId), index("wordpress_instance_installationId_idx").on(table.installationId)]);
const wordPressInstanceActivityLog = pgTable("wordpress_instance_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	wordpressInstanceId: text("wordpress_instance_id").notNull().references(() => wordPressInstance.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("wordpress_instance_activity_userId_idx").on(table.userId),
	index("wordpress_instance_activity_wordpressInstanceId_idx").on(table.wordpressInstanceId),
	index("wordpress_instance_activity_action_idx").on(table.action),
	index("wordpress_instance_activity_createdAt_idx").on(table.createdAt)
]);
const hostingPlanRelations = relations(hostingPlan, ({ many }) => ({
	subscriptions: many(hostingSubscription),
	activityLogs: many(hostingPlanActivityLog)
}));
const niscServicePlanRelations = relations(niscServicePlan, ({ many }) => ({ activityLogs: many(niscServicePlanActivityLog) }));
const niscServicePlanActivityLogRelations = relations(niscServicePlanActivityLog, ({ one }) => ({ niscServicePlan: one(niscServicePlan, {
	fields: [niscServicePlanActivityLog.niscServicePlanId],
	references: [niscServicePlan.id]
}) }));
const hostingSubscriptionRelations = relations(hostingSubscription, ({ one, many }) => ({
	hostingPlan: one(hostingPlan, {
		fields: [hostingSubscription.hostingPlanId],
		references: [hostingPlan.id]
	}),
	team: one(team, {
		fields: [hostingSubscription.teamId],
		references: [team.id]
	}),
	domain: one(domain, {
		fields: [hostingSubscription.domainId],
		references: [domain.id]
	}),
	customerIntegration: one(customerIntegration, {
		fields: [hostingSubscription.customerIntegrationId],
		references: [customerIntegration.id]
	}),
	renewals: many(hostingRenewal),
	wordpressInstances: many(wordPressInstance),
	activityLogs: many(hostingSubscriptionActivityLog)
}));
const hostingRenewalRelations = relations(hostingRenewal, ({ one, many }) => ({
	hostingSubscription: one(hostingSubscription, {
		fields: [hostingRenewal.hostingSubscriptionId],
		references: [hostingSubscription.id]
	}),
	activityLogs: many(hostingRenewalActivityLog)
}));
const hostingPlanActivityLogRelations = relations(hostingPlanActivityLog, ({ one }) => ({ hostingPlan: one(hostingPlan, {
	fields: [hostingPlanActivityLog.hostingPlanId],
	references: [hostingPlan.id]
}) }));
const hostingSubscriptionActivityLogRelations = relations(hostingSubscriptionActivityLog, ({ one }) => ({ hostingSubscription: one(hostingSubscription, {
	fields: [hostingSubscriptionActivityLog.hostingSubscriptionId],
	references: [hostingSubscription.id]
}) }));
const hostingRenewalActivityLogRelations = relations(hostingRenewalActivityLog, ({ one }) => ({ hostingRenewal: one(hostingRenewal, {
	fields: [hostingRenewalActivityLog.hostingRenewalId],
	references: [hostingRenewal.id]
}) }));
const wordPressInstanceRelations = relations(wordPressInstance, ({ one, many }) => ({
	team: one(team, {
		fields: [wordPressInstance.teamId],
		references: [team.id]
	}),
	hostingSubscription: one(hostingSubscription, {
		fields: [wordPressInstance.hostingSubscriptionId],
		references: [hostingSubscription.id]
	}),
	activityLogs: many(wordPressInstanceActivityLog)
}));
const wordPressInstanceActivityLogRelations = relations(wordPressInstanceActivityLog, ({ one }) => ({ wordPressInstance: one(wordPressInstance, {
	fields: [wordPressInstanceActivityLog.wordpressInstanceId],
	references: [wordPressInstance.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/promos.ts
const promo = pgTable("promo", {
	id: text("id").primaryKey(),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
	description: text("description"),
	type: text("type").notNull(),
	scope: text("scope").notNull(),
	target: text("target").notNull(),
	discountValue: text("discount_value").notNull(),
	currency: text("currency").default("KES"),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	usageLimit: integer("usage_limit"),
	usageCount: integer("usage_count").default(0).notNull(),
	minOrderValue: text("min_order_value"),
	hostingPlanId: text("hosting_plan_id").references(() => hostingPlan.id, { onDelete: "set null" }),
	userId: text("user_id"),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("promo_code_idx").on(table.code),
	index("promo_target_idx").on(table.target),
	index("promo_scope_idx").on(table.scope),
	index("promo_isActive_idx").on(table.isActive),
	index("promo_startDate_idx").on(table.startDate),
	index("promo_endDate_idx").on(table.endDate),
	index("promo_hostingPlanId_idx").on(table.hostingPlanId),
	index("promo_userId_idx").on(table.userId)
]);
const promoActivityLog = pgTable("promo_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	promoId: text("promo_id").notNull().references(() => promo.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("promo_activity_log_userId_idx").on(table.userId),
	index("promo_activity_log_promoId_idx").on(table.promoId),
	index("promo_activity_log_action_idx").on(table.action),
	index("promo_activity_log_createdAt_idx").on(table.createdAt)
]);
const promoRelations = relations(promo, ({ one, many }) => ({
	hostingPlan: one(hostingPlan, {
		fields: [promo.hostingPlanId],
		references: [hostingPlan.id]
	}),
	team: one(team, {
		fields: [promo.teamId],
		references: [team.id]
	}),
	activityLogs: many(promoActivityLog)
}));
const promoActivityLogRelations = relations(promoActivityLog, ({ one }) => ({ promo: one(promo, {
	fields: [promoActivityLog.promoId],
	references: [promo.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/creative-assets.ts
const creativeAsset = pgTable("creative_asset", {
	id: text("id").primaryKey(),
	teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	category: text("category"),
	status: text("status").default("DRAFT").notNull(),
	currentInternalVersion: integer("current_internal_version"),
	currentPublicVersion: integer("current_public_version"),
	isPublic: boolean("is_public").default(false).notNull(),
	createdBy: text("created_by").notNull(),
	lastModifiedBy: text("last_modified_by").notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("creative_asset_teamId_idx").on(table.teamId),
	index("creative_asset_status_idx").on(table.status),
	index("creative_asset_createdBy_idx").on(table.createdBy),
	index("creative_asset_isPublic_idx").on(table.isPublic),
	index("creative_asset_createdAt_idx").on(table.createdAt)
]);
const creativeAssetVersion = pgTable("creative_asset_version", {
	id: text("id").primaryKey(),
	creativeAssetId: text("creative_asset_id").notNull().references(() => creativeAsset.id, { onDelete: "cascade" }),
	internalVersionNumber: integer("internal_version_number").notNull(),
	publicVersionNumber: integer("public_version_number"),
	isPublic: boolean("is_public").default(false).notNull(),
	internalApprovalStatus: text("internal_approval_status").default("PENDING").notNull(),
	publicApprovalStatus: text("public_approval_status").default("NOT_APPLICABLE").notNull(),
	fileUrl: text("file_url").notNull(),
	fileKey: text("file_key").notNull(),
	fileName: text("file_name").notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: text("mime_type").notNull(),
	fileMetadata: jsonb("file_metadata"),
	versionNotes: text("version_notes"),
	changesSummary: text("changes_summary"),
	previousVersionId: text("previous_version_id"),
	internalApprovedBy: text("internal_approved_by"),
	internalApprovedAt: timestamp("internal_approved_at"),
	internalRejectedBy: text("internal_rejected_by"),
	internalRejectedAt: timestamp("internal_rejected_at"),
	internalRejectionReason: text("internal_rejection_reason"),
	publicApprovedBy: text("public_approved_by"),
	publicApprovedAt: timestamp("public_approved_at"),
	publicRejectedBy: text("public_rejected_by"),
	publicRejectedAt: timestamp("public_rejected_at"),
	publicRejectionReason: text("public_rejection_reason"),
	madePublicBy: text("made_public_by"),
	madePublicAt: timestamp("made_public_at"),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	uniqueIndex("creative_asset_version_creativeAssetId_internalVersionNumber_unique").on(table.creativeAssetId, table.internalVersionNumber),
	index("creative_asset_version_creativeAssetId_idx").on(table.creativeAssetId),
	index("creative_asset_version_internalVersionNumber_idx").on(table.internalVersionNumber),
	index("creative_asset_version_publicVersionNumber_idx").on(table.publicVersionNumber),
	index("creative_asset_version_isPublic_idx").on(table.isPublic),
	index("creative_asset_version_internalApprovalStatus_idx").on(table.internalApprovalStatus),
	index("creative_asset_version_publicApprovalStatus_idx").on(table.publicApprovalStatus),
	index("creative_asset_version_createdAt_idx").on(table.createdAt)
]);
const creativeAssetPermission = pgTable("creative_asset_permission", {
	id: text("id").primaryKey(),
	creativeAssetId: text("creative_asset_id").notNull().references(() => creativeAsset.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	canView: boolean("can_view").default(true).notNull(),
	canEdit: boolean("can_edit").default(false).notNull(),
	canComment: boolean("can_comment").default(true).notNull(),
	canApprove: boolean("can_approve").default(false).notNull(),
	canPublish: boolean("can_publish").default(false).notNull(),
	canDelete: boolean("can_delete").default(false).notNull(),
	grantedBy: text("granted_by").notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	uniqueIndex("creative_asset_permission_creativeAssetId_userId_unique").on(table.creativeAssetId, table.userId),
	index("creative_asset_permission_creativeAssetId_idx").on(table.creativeAssetId),
	index("creative_asset_permission_userId_idx").on(table.userId)
]);
const creativeAssetComment = pgTable("creative_asset_comment", {
	id: text("id").primaryKey(),
	creativeAssetVersionId: text("creative_asset_version_id").notNull().references(() => creativeAssetVersion.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	content: text("content").notNull(),
	isInternal: boolean("is_internal").notNull(),
	isResolved: boolean("is_resolved").default(false).notNull(),
	resolvedBy: text("resolved_by"),
	resolvedAt: timestamp("resolved_at"),
	parentCommentId: text("parent_comment_id"),
	replyCount: integer("reply_count").default(0).notNull(),
	mentions: jsonb("mentions").notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	editedAt: timestamp("edited_at")
}, (table) => [
	foreignKey({
		columns: [table.parentCommentId],
		foreignColumns: [table.id]
	}).onDelete("cascade"),
	index("creative_asset_comment_creativeAssetVersionId_idx").on(table.creativeAssetVersionId),
	index("creative_asset_comment_userId_idx").on(table.userId),
	index("creative_asset_comment_isInternal_idx").on(table.isInternal),
	index("creative_asset_comment_parentCommentId_idx").on(table.parentCommentId),
	index("creative_asset_comment_isResolved_idx").on(table.isResolved),
	index("creative_asset_comment_createdAt_idx").on(table.createdAt)
]);
const creativeAssetActivityLog = pgTable("creative_asset_activity_log", {
	id: text("id").primaryKey(),
	creativeAssetId: text("creative_asset_id").notNull().references(() => creativeAsset.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("creative_asset_activity_log_creativeAssetId_idx").on(table.creativeAssetId),
	index("creative_asset_activity_log_userId_idx").on(table.userId),
	index("creative_asset_activity_log_action_idx").on(table.action),
	index("creative_asset_activity_log_createdAt_idx").on(table.createdAt)
]);
const creativeAssetVersionActivityLog = pgTable("creative_asset_version_activity_log", {
	id: text("id").primaryKey(),
	creativeAssetVersionId: text("creative_asset_version_id").notNull().references(() => creativeAssetVersion.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("creative_asset_version_activity_creativeAssetVersionId_idx").on(table.creativeAssetVersionId),
	index("creative_asset_version_activity_userId_idx").on(table.userId),
	index("creative_asset_version_activity_action_idx").on(table.action),
	index("creative_asset_version_activity_createdAt_idx").on(table.createdAt)
]);
const creativeAssetRelations = relations(creativeAsset, ({ one, many }) => ({
	team: one(team, {
		fields: [creativeAsset.teamId],
		references: [team.id]
	}),
	versions: many(creativeAssetVersion),
	permissions: many(creativeAssetPermission),
	activityLogs: many(creativeAssetActivityLog)
}));
const creativeAssetVersionRelations = relations(creativeAssetVersion, ({ one, many }) => ({
	creativeAsset: one(creativeAsset, {
		fields: [creativeAssetVersion.creativeAssetId],
		references: [creativeAsset.id]
	}),
	comments: many(creativeAssetComment),
	activityLogs: many(creativeAssetVersionActivityLog)
}));
const creativeAssetPermissionRelations = relations(creativeAssetPermission, ({ one }) => ({ creativeAsset: one(creativeAsset, {
	fields: [creativeAssetPermission.creativeAssetId],
	references: [creativeAsset.id]
}) }));
const creativeAssetCommentRelations = relations(creativeAssetComment, ({ one, many }) => ({
	creativeAssetVersion: one(creativeAssetVersion, {
		fields: [creativeAssetComment.creativeAssetVersionId],
		references: [creativeAssetVersion.id]
	}),
	parentComment: one(creativeAssetComment, {
		fields: [creativeAssetComment.parentCommentId],
		references: [creativeAssetComment.id],
		relationName: "CommentReplies"
	}),
	replies: many(creativeAssetComment, { relationName: "CommentReplies" })
}));
const creativeAssetActivityLogRelations = relations(creativeAssetActivityLog, ({ one }) => ({ creativeAsset: one(creativeAsset, {
	fields: [creativeAssetActivityLog.creativeAssetId],
	references: [creativeAsset.id]
}) }));
const creativeAssetVersionActivityLogRelations = relations(creativeAssetVersionActivityLog, ({ one }) => ({ creativeAssetVersion: one(creativeAssetVersion, {
	fields: [creativeAssetVersionActivityLog.creativeAssetVersionId],
	references: [creativeAssetVersion.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/creative-briefs.ts
const creativeBrief = pgTable("creative_brief", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	status: text("status").default("DRAFT").notNull(),
	background: text("background").notNull(),
	objectives: text("objectives").notNull(),
	requirements: text("requirements").notNull(),
	comments: text("comments"),
	style: text("style"),
	copy: text("copy"),
	mandatoryElements: text("mandatory_elements"),
	designPreference: text("design_preference"),
	approverUserId: text("approver_user_id").references(() => user.id, { onDelete: "set null" }),
	approvedBy: text("approved_by"),
	approvedAt: timestamp("approved_at"),
	rejectedBy: text("rejected_by"),
	rejectedAt: timestamp("rejected_at"),
	timelineStartDate: timestamp("timeline_start_date"),
	timelineEndDate: timestamp("timeline_end_date"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("creative_brief_userId_idx").on(table.userId),
	index("creative_brief_approverUserId_idx").on(table.approverUserId),
	index("creative_brief_teamId_idx").on(table.teamId),
	index("creative_brief_status_idx").on(table.status),
	index("creative_brief_createdAt_idx").on(table.createdAt)
]);
const creativeBriefReferenceImage = pgTable("creative_brief_reference_image", {
	id: text("id").primaryKey(),
	creativeBriefId: text("creative_brief_id").notNull().references(() => creativeBrief.id, { onDelete: "cascade" }),
	fileUrl: text("file_url").notNull(),
	fileKey: text("file_key").notNull(),
	fileName: text("file_name").notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: text("mime_type").notNull(),
	fileMetadata: jsonb("file_metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("creative_brief_reference_image_creativeBriefId_idx").on(table.creativeBriefId), index("creative_brief_reference_image_createdAt_idx").on(table.createdAt)]);
const creativeBriefActivityLog = pgTable("creative_brief_activity_log", {
	id: text("id").primaryKey(),
	creativeBriefId: text("creative_brief_id").notNull().references(() => creativeBrief.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	comment: text("comment"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("creative_brief_activity_log_creativeBriefId_idx").on(table.creativeBriefId),
	index("creative_brief_activity_log_userId_idx").on(table.userId),
	index("creative_brief_activity_log_action_idx").on(table.action),
	index("creative_brief_activity_log_createdAt_idx").on(table.createdAt)
]);
const creativeBriefRelations = relations(creativeBrief, ({ one, many }) => ({
	user: one(user, {
		fields: [creativeBrief.userId],
		references: [user.id],
		relationName: "CreatedBriefs"
	}),
	approver: one(user, {
		fields: [creativeBrief.approverUserId],
		references: [user.id],
		relationName: "ApprovedBriefs"
	}),
	team: one(team, {
		fields: [creativeBrief.teamId],
		references: [team.id]
	}),
	referenceImages: many(creativeBriefReferenceImage),
	activityLogs: many(creativeBriefActivityLog)
}));
const creativeBriefReferenceImageRelations = relations(creativeBriefReferenceImage, ({ one }) => ({ creativeBrief: one(creativeBrief, {
	fields: [creativeBriefReferenceImage.creativeBriefId],
	references: [creativeBrief.id]
}) }));
const creativeBriefActivityLogRelations = relations(creativeBriefActivityLog, ({ one }) => ({ creativeBrief: one(creativeBrief, {
	fields: [creativeBriefActivityLog.creativeBriefId],
	references: [creativeBrief.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/nisc-orders.ts
const niscOrder = pgTable("nisc_order", {
	id: text("id").primaryKey(),
	orderNumber: text("order_number").notNull().unique(),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	createdBy: text("created_by"),
	status: text("status").default("PENDING").notNull(),
	subtotal: text("subtotal").notNull(),
	total: text("total").notNull(),
	currency: text("currency").default("KES").notNull(),
	notes: text("notes"),
	metadata: jsonb("metadata"),
	niscProductPromoId: text("nisc_product_promo_id").references(() => niscProductPromo.id, { onDelete: "set null" }),
	invoiceId: text("invoice_id").references(() => invoice.id, { onDelete: "set null" }),
	invoiceNumber: text("invoice_number"),
	processedAt: timestamp("processed_at"),
	completedAt: timestamp("completed_at"),
	failureReason: text("failure_reason"),
	qstashMessageId: text("qstash_message_id"),
	paymentTransactionId: text("payment_transaction_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("nisc_order_userId_idx").on(table.userId),
	index("nisc_order_teamId_idx").on(table.teamId),
	index("nisc_order_status_idx").on(table.status),
	index("nisc_order_createdAt_idx").on(table.createdAt),
	index("nisc_order_qstashMessageId_idx").on(table.qstashMessageId),
	index("nisc_order_paymentTransactionId_idx").on(table.paymentTransactionId)
]);
const niscOrderProcessingLog = pgTable("nisc_order_processing_log", {
	id: text("id").primaryKey(),
	niscOrderId: text("nisc_order_id").notNull().references(() => niscOrder.id, { onDelete: "cascade" }),
	step: text("step").notNull(),
	payload: jsonb("payload").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("nisc_order_processing_log_niscOrderId_idx").on(table.niscOrderId), index("nisc_order_processing_log_niscOrderId_createdAt_idx").on(table.niscOrderId, table.createdAt)]);
const niscOrderItem = pgTable("nisc_order_item", {
	id: text("id").primaryKey(),
	niscOrderId: text("nisc_order_id").notNull().references(() => niscOrder.id, { onDelete: "cascade" }),
	productId: text("product_id").notNull().references(() => niscProduct.id, { onDelete: "restrict" }),
	productPlanId: text("product_plan_id").references(() => niscProductPlan.id, { onDelete: "set null" }),
	billingCycle: text("billing_cycle"),
	itemPrice: text("item_price").notNull(),
	itemSubtotal: text("item_subtotal").notNull(),
	itemCurrency: text("item_currency").default("KES").notNull(),
	status: text("status").default("PENDING").notNull(),
	provisioningError: text("provisioning_error"),
	provisioningErrorDetails: jsonb("provisioning_error_details"),
	niscClientSubscriptionId: text("nisc_client_subscription_id").references(() => niscClientSubscription.id, { onDelete: "set null" }),
	primaryDomain: text("primary_domain"),
	domainSubscriptionId: text("domain_subscription_id").references(() => niscClientSubscription.id, { onDelete: "set null" }),
	description: text("description"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("nisc_order_item_niscOrderId_idx").on(table.niscOrderId),
	index("nisc_order_item_productId_idx").on(table.productId),
	index("nisc_order_item_productPlanId_idx").on(table.productPlanId),
	index("nisc_order_item_status_idx").on(table.status),
	index("nisc_order_item_niscClientSubscriptionId_idx").on(table.niscClientSubscriptionId)
]);
const niscOrderRelations = relations(niscOrder, ({ one, many }) => ({
	user: one(user, {
		fields: [niscOrder.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [niscOrder.teamId],
		references: [team.id]
	}),
	niscProductPromo: one(niscProductPromo, {
		fields: [niscOrder.niscProductPromoId],
		references: [niscProductPromo.id]
	}),
	invoice: one(invoice, {
		fields: [niscOrder.invoiceId],
		references: [invoice.id]
	}),
	orderItems: many(niscOrderItem),
	processingLogs: many(niscOrderProcessingLog)
}));
const niscOrderProcessingLogRelations = relations(niscOrderProcessingLog, ({ one }) => ({ niscOrder: one(niscOrder, {
	fields: [niscOrderProcessingLog.niscOrderId],
	references: [niscOrder.id]
}) }));
const niscOrderItemRelations = relations(niscOrderItem, ({ one }) => ({
	niscOrder: one(niscOrder, {
		fields: [niscOrderItem.niscOrderId],
		references: [niscOrder.id]
	}),
	product: one(niscProduct, {
		fields: [niscOrderItem.productId],
		references: [niscProduct.id]
	}),
	productPlan: one(niscProductPlan, {
		fields: [niscOrderItem.productPlanId],
		references: [niscProductPlan.id]
	}),
	niscClientSubscription: one(niscClientSubscription, {
		fields: [niscOrderItem.niscClientSubscriptionId],
		references: [niscClientSubscription.id],
		relationName: "OrderItemSubscription"
	}),
	domainSubscription: one(niscClientSubscription, {
		fields: [niscOrderItem.domainSubscriptionId],
		references: [niscClientSubscription.id],
		relationName: "OrderItemDomainSubscription"
	})
}));

//#endregion
//#region ../../packages/db/src/schema/notifications.ts
const notification = pgTable("notification", {
	id: text("_id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	type: text("type").default("GENERAL").notNull(),
	priority: text("priority").default("NORMAL").notNull(),
	title: text("title"),
	message: text("message").notNull(),
	link: text("link"),
	metadata: jsonb("metadata"),
	seen: boolean("seen").default(false).notNull(),
	readAt: timestamp("read_at"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("notification_userId_idx").on(table.userId),
	index("notification_teamId_idx").on(table.teamId),
	index("notification_type_idx").on(table.type),
	index("notification_seen_idx").on(table.seen),
	index("notification_priority_idx").on(table.priority),
	index("notification_createdAt_idx").on(table.createdAt),
	index("notification_userId_seen_idx").on(table.userId, table.seen),
	index("notification_teamId_seen_idx").on(table.teamId, table.seen)
]);
const notificationActivityLog = pgTable("notification_activity_log", {
	id: text("_id").primaryKey(),
	notificationId: text("notification_id").notNull().references(() => notification.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("notification_activity_log_notificationId_idx").on(table.notificationId),
	index("notification_activity_log_userId_idx").on(table.userId),
	index("notification_activity_log_action_idx").on(table.action),
	index("notification_activity_log_createdAt_idx").on(table.createdAt)
]);
const notificationRelations = relations(notification, ({ one, many }) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [notification.teamId],
		references: [team.id]
	}),
	activityLogs: many(notificationActivityLog)
}));
const notificationActivityLogRelations = relations(notificationActivityLog, ({ one }) => ({ notification: one(notification, {
	fields: [notificationActivityLog.notificationId],
	references: [notification.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/orders.ts
const order = pgTable("order", {
	id: text("_id").primaryKey(),
	orderNumber: text("order_number").notNull().unique(),
	userId: text("user_id"),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	createdBy: text("created_by"),
	type: text("type").default("CUSTOM_SERVICE").notNull(),
	status: text("status").default("PENDING").notNull(),
	description: text("description"),
	domainId: text("domain_id").references(() => domain.id, { onDelete: "set null" }),
	domainRenewalId: text("domain_renewal_id").references(() => domainRenewal.id, { onDelete: "set null" }),
	domainTransferId: text("domain_transfer_id").references(() => domainTransfer.id, { onDelete: "set null" }),
	hostingSubscriptionId: text("hosting_subscription_id").references(() => hostingSubscription.id, { onDelete: "set null" }),
	hostingRenewalId: text("hosting_renewal_id").references(() => hostingRenewal.id, { onDelete: "set null" }),
	subtotal: text("subtotal"),
	discount: text("discount"),
	isTaxable: boolean("is_taxable"),
	taxPercentage: doublePrecision("tax_percentage"),
	taxAmount: text("tax_amount"),
	total: text("total"),
	currency: text("currency").default("KES").notNull(),
	promoCode: text("promo_code"),
	promoId: text("promo_id").references(() => promo.id, { onDelete: "set null" }),
	niscProductPromoId: text("nisc_product_promo_id").references(() => niscProductPromo.id, { onDelete: "set null" }),
	invoiceNumber: text("invoice_number"),
	invoiceId: text("invoice_id").references(() => invoice.id, { onDelete: "set null" }),
	processedBy: text("processed_by"),
	processedAt: timestamp("processed_at"),
	completedAt: timestamp("completed_at"),
	notes: text("notes"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("order_orderNumber_idx").on(table.orderNumber),
	index("order_teamId_idx").on(table.teamId),
	index("order_type_idx").on(table.type),
	index("order_status_idx").on(table.status),
	index("order_createdAt_idx").on(table.createdAt),
	index("order_processedAt_idx").on(table.processedAt),
	index("order_completedAt_idx").on(table.completedAt),
	index("order_invoiceId_idx").on(table.invoiceId),
	index("order_niscProductPromoId_idx").on(table.niscProductPromoId)
]);
const orderItem = pgTable("order_item", {
	id: text("_id").primaryKey(),
	orderId: text("order_id").notNull().references(() => order.id, { onDelete: "cascade" }),
	niscServicePlanId: text("nisc_service_plan_id").notNull().references(() => niscServicePlan.id, { onDelete: "restrict" }),
	billingCycle: text("billing_cycle").notNull(),
	itemPrice: text("item_price").notNull(),
	itemSubtotal: text("item_subtotal").notNull(),
	itemCurrency: text("item_currency").default("KES").notNull(),
	domainName: text("domain_name"),
	description: text("description"),
	adminDescription: text("admin_description"),
	notes: text("notes"),
	status: text("status").default("PENDING").notNull(),
	isProvisioned: boolean("is_provisioned").default(false).notNull(),
	provisioningError: text("provisioning_error"),
	hostingSubscriptionId: text("hosting_subscription_id").references(() => hostingSubscription.id, { onDelete: "set null" }),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("order_item_orderId_idx").on(table.orderId),
	index("order_item_niscServicePlanId_idx").on(table.niscServicePlanId),
	index("order_item_status_idx").on(table.status),
	index("order_item_isProvisioned_idx").on(table.isProvisioned),
	index("order_item_hostingSubscriptionId_idx").on(table.hostingSubscriptionId)
]);
const orderItemActivityLog = pgTable("order_item_activity_log", {
	id: text("_id").primaryKey(),
	orderItemId: text("order_item_id").notNull().references(() => orderItem.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("order_item_activity_log_orderItemId_idx").on(table.orderItemId),
	index("order_item_activity_log_userId_idx").on(table.userId),
	index("order_item_activity_log_action_idx").on(table.action),
	index("order_item_activity_log_createdAt_idx").on(table.createdAt)
]);
const orderActivityLog = pgTable("order_activity_log", {
	id: text("_id").primaryKey(),
	userId: text("user_id").notNull(),
	orderId: text("order_id").notNull().references(() => order.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("order_activity_log_userId_idx").on(table.userId),
	index("order_activity_log_orderId_idx").on(table.orderId),
	index("order_activity_log_action_idx").on(table.action),
	index("order_activity_log_createdAt_idx").on(table.createdAt)
]);
const orderRelations = relations(order, ({ one, many }) => ({
	team: one(team, {
		fields: [order.teamId],
		references: [team.id]
	}),
	domain: one(domain, {
		fields: [order.domainId],
		references: [domain.id]
	}),
	domainRenewal: one(domainRenewal, {
		fields: [order.domainRenewalId],
		references: [domainRenewal.id]
	}),
	domainTransfer: one(domainTransfer, {
		fields: [order.domainTransferId],
		references: [domainTransfer.id]
	}),
	hostingSubscription: one(hostingSubscription, {
		fields: [order.hostingSubscriptionId],
		references: [hostingSubscription.id]
	}),
	hostingRenewal: one(hostingRenewal, {
		fields: [order.hostingRenewalId],
		references: [hostingRenewal.id]
	}),
	promo: one(promo, {
		fields: [order.promoId],
		references: [promo.id]
	}),
	niscProductPromo: one(niscProductPromo, {
		fields: [order.niscProductPromoId],
		references: [niscProductPromo.id]
	}),
	invoice: one(invoice, {
		fields: [order.invoiceId],
		references: [invoice.id]
	}),
	orderItems: many(orderItem),
	activityLogs: many(orderActivityLog)
}));
const orderItemRelations = relations(orderItem, ({ one, many }) => ({
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
	niscServicePlan: one(niscServicePlan, {
		fields: [orderItem.niscServicePlanId],
		references: [niscServicePlan.id]
	}),
	hostingSubscription: one(hostingSubscription, {
		fields: [orderItem.hostingSubscriptionId],
		references: [hostingSubscription.id]
	}),
	activityLogs: many(orderItemActivityLog)
}));
const orderItemActivityLogRelations = relations(orderItemActivityLog, ({ one }) => ({ orderItem: one(orderItem, {
	fields: [orderItemActivityLog.orderItemId],
	references: [orderItem.id]
}) }));
const orderActivityLogRelations = relations(orderActivityLog, ({ one }) => ({ order: one(order, {
	fields: [orderActivityLog.orderId],
	references: [order.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/payment-transactions.ts
const paymentTransaction = pgTable("payment_transaction", {
	id: text("_id").primaryKey(),
	userId: text("user_id").notNull(),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	gateway: text("gateway").notNull(),
	gatewayStatus: text("gateway_status"),
	gatewayMessage: text("gateway_message"),
	gatewayTransactionId: text("gateway_transaction_id"),
	merchantRequestId: text("merchant_request_id"),
	checkoutRequestId: text("checkout_request_id"),
	receiptNumber: text("receipt_number"),
	amount: text("amount").notNull(),
	paidAmount: text("paid_amount"),
	currency: text("currency").default("KES").notNull(),
	accountReference: text("account_reference"),
	transactionDesc: text("transaction_desc"),
	phoneNumber: text("phone_number"),
	status: text("status").default("PENDING").notNull(),
	rawResponse: jsonb("raw_response"),
	rawError: jsonb("raw_error"),
	initiatedAt: timestamp("initiated_at").notNull(),
	processedAt: timestamp("processed_at"),
	failedAt: timestamp("failed_at"),
	refundedAt: timestamp("refunded_at"),
	notes: text("notes"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("payment_transaction_userId_idx").on(table.userId),
	index("payment_transaction_teamId_idx").on(table.teamId),
	index("payment_transaction_gateway_idx").on(table.gateway),
	index("payment_transaction_status_idx").on(table.status),
	index("payment_transaction_gatewayTransactionId_idx").on(table.gatewayTransactionId),
	index("payment_transaction_checkoutRequestId_idx").on(table.checkoutRequestId),
	index("payment_transaction_merchantRequestId_idx").on(table.merchantRequestId),
	index("payment_transaction_receiptNumber_idx").on(table.receiptNumber),
	index("payment_transaction_accountReference_idx").on(table.accountReference),
	index("payment_transaction_initiatedAt_idx").on(table.initiatedAt),
	index("payment_transaction_processedAt_idx").on(table.processedAt),
	index("payment_transaction_createdAt_idx").on(table.createdAt)
]);
const paymentTransactionActivityLog = pgTable("payment_transaction_activity_log", {
	id: text("_id").primaryKey(),
	transactionId: text("transaction_id").notNull().references(() => paymentTransaction.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("payment_transaction_activity_log_transactionId_idx").on(table.transactionId),
	index("payment_transaction_activity_log_userId_idx").on(table.userId),
	index("payment_transaction_activity_log_action_idx").on(table.action),
	index("payment_transaction_activity_log_createdAt_idx").on(table.createdAt)
]);
const paymentTransactionRelations = relations(paymentTransaction, ({ one, many }) => ({
	team: one(team, {
		fields: [paymentTransaction.teamId],
		references: [team.id]
	}),
	activityLogs: many(paymentTransactionActivityLog)
}));
const paymentTransactionActivityLogRelations = relations(paymentTransactionActivityLog, ({ one }) => ({ transaction: one(paymentTransaction, {
	fields: [paymentTransactionActivityLog.transactionId],
	references: [paymentTransaction.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/quotations.ts
const quotation = pgTable("quotation", {
	id: text("_id").primaryKey(),
	quotationNumber: text("quotation_number"),
	customerName: text("customer_name"),
	customerEmail: text("customer_email"),
	token: text("token").notNull().unique(),
	status: text("status").default("DRAFT").notNull(),
	amount: text("amount"),
	subtotal: text("subtotal"),
	tax: text("tax"),
	taxPercentage: doublePrecision("tax_percentage"),
	vat: text("vat"),
	discount: text("discount"),
	currency: text("currency").default("KES").notNull(),
	issueDate: timestamp("issue_date"),
	note: text("note"),
	internalNote: text("internal_note"),
	fromDetails: jsonb("from_details"),
	customerDetails: jsonb("customer_details"),
	noteDetails: jsonb("note_details"),
	template: jsonb("template"),
	topBlock: jsonb("top_block"),
	bottomBlock: jsonb("bottom_block"),
	metadata: jsonb("metadata"),
	createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("quotation_quotationNumber_idx").on(table.quotationNumber),
	index("quotation_status_idx").on(table.status),
	index("quotation_createdBy_idx").on(table.createdBy),
	index("quotation_issueDate_idx").on(table.issueDate)
]);
const quotationLineItem = pgTable("quotation_line_item", {
	id: text("_id").primaryKey(),
	quotationId: text("quotation_id").notNull().references(() => quotation.id, { onDelete: "cascade" }),
	position: integer("position").default(0).notNull(),
	name: text("name"),
	description: text("description"),
	quantity: doublePrecision("quantity"),
	unit: text("unit"),
	price: text("price"),
	discount: text("discount"),
	total: text("total"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("quotation_line_item_quotationId_idx").on(table.quotationId), index("quotation_line_item_position_idx").on(table.position)]);
const quotationActivityLog = pgTable("quotation_activity_log", {
	id: text("_id").primaryKey(),
	quotationId: text("quotation_id").notNull().references(() => quotation.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("quotation_activity_log_quotationId_idx").on(table.quotationId),
	index("quotation_activity_log_userId_idx").on(table.userId),
	index("quotation_activity_log_action_idx").on(table.action),
	index("quotation_activity_log_createdAt_idx").on(table.createdAt)
]);
const quotationCounter = pgTable("quotation_counter", {
	id: text("id").primaryKey().default("quotation-counter"),
	lastNumber: integer("last_number").default(0).notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
});
const quotationRelations = relations(quotation, ({ one, many }) => ({
	createdByUser: one(user, {
		fields: [quotation.createdBy],
		references: [user.id]
	}),
	lineItems: many(quotationLineItem),
	activityLogs: many(quotationActivityLog)
}));
const quotationLineItemRelations = relations(quotationLineItem, ({ one }) => ({ quotation: one(quotation, {
	fields: [quotationLineItem.quotationId],
	references: [quotation.id]
}) }));
const quotationActivityLogRelations = relations(quotationActivityLog, ({ one }) => ({ quotation: one(quotation, {
	fields: [quotationActivityLog.quotationId],
	references: [quotation.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/reporting.ts
const salesReportSnapshot = pgTable("sales_report_snapshot", {
	id: text("id").primaryKey(),
	date: timestamp("date").notNull(),
	period: text("period").notNull(),
	totalRevenue: decimal("total_revenue", {
		precision: 20,
		scale: 2
	}).default("0").notNull(),
	totalInvoiced: decimal("total_invoiced", {
		precision: 20,
		scale: 2
	}).default("0").notNull(),
	totalPaid: decimal("total_paid", {
		precision: 20,
		scale: 2
	}).default("0").notNull(),
	taxableAmount: decimal("taxable_amount", {
		precision: 20,
		scale: 2
	}).default("0").notNull(),
	taxAmount: decimal("tax_amount", {
		precision: 20,
		scale: 2
	}).default("0").notNull(),
	pendingAmount: decimal("pending_amount", {
		precision: 20,
		scale: 2
	}).default("0").notNull(),
	invoiceCount: integer("invoice_count").default(0).notNull(),
	paidInvoiceCount: integer("paid_invoice_count").default(0).notNull(),
	currency: text("currency").default("KES").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [uniqueIndex("sales_report_snapshot_date_period_currency_unique").on(table.date, table.period, table.currency), index("sales_report_snapshot_date_period_idx").on(table.date, table.period)]);
const revenueByServiceSnapshot = pgTable("revenue_by_service_snapshot", {
	id: text("id").primaryKey(),
	date: timestamp("date").notNull(),
	period: text("period").notNull(),
	serviceType: text("service_type").notNull(),
	amount: decimal("amount", {
		precision: 20,
		scale: 2
	}).default("0").notNull(),
	currency: text("currency").default("KES").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [uniqueIndex("revenue_by_service_snapshot_date_period_serviceType_currency_unique").on(table.date, table.period, table.serviceType, table.currency), index("revenue_by_service_snapshot_date_period_serviceType_idx").on(table.date, table.period, table.serviceType)]);
const revenueByTeamSnapshot = pgTable("revenue_by_team_snapshot", {
	id: text("id").primaryKey(),
	date: timestamp("date").notNull(),
	period: text("period").notNull(),
	teamId: text("team_id").notNull(),
	teamName: text("team_name").notNull(),
	amount: decimal("amount", {
		precision: 20,
		scale: 2
	}).default("0").notNull(),
	currency: text("currency").default("KES").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [uniqueIndex("revenue_by_team_snapshot_date_period_teamId_currency_unique").on(table.date, table.period, table.teamId, table.currency), index("revenue_by_team_snapshot_date_period_idx").on(table.date, table.period)]);
const creativeProductionSnapshot = pgTable("creative_production_snapshot", {
	id: text("id").primaryKey(),
	date: timestamp("date").notNull(),
	period: text("period").notNull(),
	assetsCreated: integer("assets_created").default(0).notNull(),
	assetsApproved: integer("assets_approved").default(0).notNull(),
	versionsCreated: integer("versions_created").default(0).notNull(),
	avgVelocityDays: real("avg_velocity_days"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [uniqueIndex("creative_production_snapshot_date_period_unique").on(table.date, table.period), index("creative_production_snapshot_date_period_idx").on(table.date, table.period)]);

//#endregion
//#region ../../packages/db/src/schema/seo-reports.ts
const seoReport = pgTable("seo_report", {
	id: text("_id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	reportName: text("report_name").default("").notNull(),
	reportMonth: text("report_month").notNull(),
	reportYear: text("report_year").notNull(),
	websiteUrl: text("website_url"),
	status: text("status").default("DRAFT").notNull(),
	recommendations: text("recommendations"),
	sessions: text("sessions"),
	totalWebTraffic: text("total_web_traffic"),
	totalViews: text("total_views"),
	bounceRate: text("bounce_rate"),
	users: text("users"),
	returningUsers: text("returning_users"),
	eventCount: text("event_count"),
	conversions: text("conversions"),
	sessionDuration: text("session_duration"),
	engagedSessions: text("engaged_sessions"),
	sessionsDesktop: text("sessions_desktop"),
	sessionsMobile: text("sessions_mobile"),
	sessionsTablet: text("sessions_tablet"),
	formSubmissions: text("form_submissions"),
	impressions: text("impressions"),
	clicks: text("clicks"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("seo_report_userId_idx").on(table.userId),
	index("seo_report_teamId_idx").on(table.teamId),
	index("seo_report_reportYear_reportMonth_idx").on(table.reportYear, table.reportMonth),
	index("seo_report_reportName_idx").on(table.reportName),
	index("seo_report_status_idx").on(table.status),
	index("seo_report_createdAt_idx").on(table.createdAt),
	index("seo_report_teamId_reportYear_reportMonth_idx").on(table.teamId, table.reportYear, table.reportMonth)
]);
const seoReportActivityLog = pgTable("seo_report_activity_log", {
	id: text("_id").primaryKey(),
	seoReportId: text("seo_report_id").notNull().references(() => seoReport.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("seo_report_activity_log_seoReportId_idx").on(table.seoReportId),
	index("seo_report_activity_log_userId_idx").on(table.userId),
	index("seo_report_activity_log_action_idx").on(table.action),
	index("seo_report_activity_log_createdAt_idx").on(table.createdAt)
]);
const seoReportRelations = relations(seoReport, ({ one, many }) => ({
	user: one(user, {
		fields: [seoReport.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [seoReport.teamId],
		references: [team.id]
	}),
	activityLogs: many(seoReportActivityLog)
}));
const seoReportActivityLogRelations = relations(seoReportActivityLog, ({ one }) => ({ seoReport: one(seoReport, {
	fields: [seoReportActivityLog.seoReportId],
	references: [seoReport.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/service-subscriptions.ts
const serviceSubscription = pgTable("service_subscription", {
	id: text("_id").primaryKey(),
	niscServicePlanId: text("nisc_service_plan_id").notNull().references(() => niscServicePlan.id, { onDelete: "restrict" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
	subscribedBy: text("subscribed_by"),
	subscriptionDate: timestamp("subscription_date"),
	billingCycle: text("billing_cycle").notNull(),
	nextRenewalDate: timestamp("next_renewal_date"),
	status: text("status").notNull(),
	autoRenew: boolean("auto_renew").default(false).notNull(),
	hostingSubscriptionId: text("hosting_subscription_id").unique().references(() => hostingSubscription.id, { onDelete: "set null" }),
	notes: text("notes"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("service_subscription_niscServicePlanId_idx").on(table.niscServicePlanId),
	index("service_subscription_teamId_idx").on(table.teamId),
	index("service_subscription_orderId_idx").on(table.orderId),
	index("service_subscription_status_idx").on(table.status),
	index("service_subscription_nextRenewalDate_idx").on(table.nextRenewalDate),
	index("service_subscription_subscriptionDate_idx").on(table.subscriptionDate),
	index("service_subscription_hostingSubscriptionId_idx").on(table.hostingSubscriptionId)
]);
const serviceSubscriptionRenewal = pgTable("service_subscription_renewal", {
	id: text("_id").primaryKey(),
	serviceSubscriptionId: text("service_subscription_id").notNull().references(() => serviceSubscription.id, { onDelete: "cascade" }),
	orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
	renewedBy: text("renewed_by"),
	renewalDate: timestamp("renewal_date").notNull(),
	billingCycle: text("billing_cycle").notNull(),
	nextRenewalDate: timestamp("next_renewal_date"),
	status: text("status").notNull(),
	notes: text("notes"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("service_subscription_renewal_serviceSubscriptionId_idx").on(table.serviceSubscriptionId),
	index("service_subscription_renewal_orderId_idx").on(table.orderId),
	index("service_subscription_renewal_renewalDate_idx").on(table.renewalDate),
	index("service_subscription_renewal_nextRenewalDate_idx").on(table.nextRenewalDate)
]);
const serviceSubscriptionActivityLog = pgTable("service_subscription_activity_log", {
	id: text("_id").primaryKey(),
	serviceSubscriptionId: text("service_subscription_id").notNull().references(() => serviceSubscription.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("service_subscription_activity_log_serviceSubscriptionId_idx").on(table.serviceSubscriptionId),
	index("service_subscription_activity_log_userId_idx").on(table.userId),
	index("service_subscription_activity_log_action_idx").on(table.action),
	index("service_subscription_activity_log_createdAt_idx").on(table.createdAt)
]);
const serviceSubscriptionRenewalActivityLog = pgTable("service_subscription_renewal_activity_log", {
	id: text("_id").primaryKey(),
	serviceSubscriptionRenewalId: text("service_subscription_renewal_id").notNull().references(() => serviceSubscriptionRenewal.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("service_sub_renewal_activity_log_serviceSubscriptionRenewalId_idx").on(table.serviceSubscriptionRenewalId),
	index("service_sub_renewal_activity_log_userId_idx").on(table.userId),
	index("service_sub_renewal_activity_log_action_idx").on(table.action),
	index("service_sub_renewal_activity_log_createdAt_idx").on(table.createdAt)
]);
const serviceSubscriptionRelations = relations(serviceSubscription, ({ one, many }) => ({
	niscServicePlan: one(niscServicePlan, {
		fields: [serviceSubscription.niscServicePlanId],
		references: [niscServicePlan.id]
	}),
	team: one(team, {
		fields: [serviceSubscription.teamId],
		references: [team.id]
	}),
	order: one(order, {
		fields: [serviceSubscription.orderId],
		references: [order.id]
	}),
	hostingSubscription: one(hostingSubscription, {
		fields: [serviceSubscription.hostingSubscriptionId],
		references: [hostingSubscription.id]
	}),
	renewals: many(serviceSubscriptionRenewal),
	activityLogs: many(serviceSubscriptionActivityLog)
}));
const serviceSubscriptionRenewalRelations = relations(serviceSubscriptionRenewal, ({ one, many }) => ({
	serviceSubscription: one(serviceSubscription, {
		fields: [serviceSubscriptionRenewal.serviceSubscriptionId],
		references: [serviceSubscription.id]
	}),
	order: one(order, {
		fields: [serviceSubscriptionRenewal.orderId],
		references: [order.id]
	}),
	activityLogs: many(serviceSubscriptionRenewalActivityLog)
}));
const serviceSubscriptionActivityLogRelations = relations(serviceSubscriptionActivityLog, ({ one }) => ({ serviceSubscription: one(serviceSubscription, {
	fields: [serviceSubscriptionActivityLog.serviceSubscriptionId],
	references: [serviceSubscription.id]
}) }));
const serviceSubscriptionRenewalActivityLogRelations = relations(serviceSubscriptionRenewalActivityLog, ({ one }) => ({ serviceSubscriptionRenewal: one(serviceSubscriptionRenewal, {
	fields: [serviceSubscriptionRenewalActivityLog.serviceSubscriptionRenewalId],
	references: [serviceSubscriptionRenewal.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/meta-ads.ts
const metaAdsAccount = pgTable("meta_ads_account", {
	id: text("id").primaryKey(),
	integrationId: text("integration_id").notNull(),
	accountId: text("account_id").notNull().unique(),
	accountName: text("account_name"),
	currency: text("currency"),
	timezone: text("timezone"),
	status: text("status").default("ACTIVE").notNull(),
	spendLimit: text("spend_limit"),
	amountSpent: text("amount_spent"),
	balance: text("balance"),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("meta_ads_account_integrationId_accountId_unique").on(table.integrationId, table.accountId),
	index("meta_ads_account_integrationId_idx").on(table.integrationId),
	index("meta_ads_account_accountId_idx").on(table.accountId),
	index("meta_ads_account_teamId_idx").on(table.teamId),
	index("meta_ads_account_status_idx").on(table.status)
]);
const metaAdsCampaign = pgTable("meta_ads_campaign", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull().references(() => metaAdsAccount.id, { onDelete: "cascade" }),
	campaignId: text("campaign_id").notNull(),
	campaignName: text("campaign_name"),
	objective: text("objective"),
	status: text("status").default("ACTIVE").notNull(),
	dailyBudget: text("daily_budget"),
	lifetimeBudget: text("lifetime_budget"),
	budgetRemaining: text("budget_remaining"),
	startTime: timestamp("start_time"),
	stopTime: timestamp("stop_time"),
	createdTime: timestamp("created_time"),
	updatedTime: timestamp("updated_time"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("meta_ads_campaign_accountId_campaignId_unique").on(table.accountId, table.campaignId),
	index("meta_ads_campaign_accountId_idx").on(table.accountId),
	index("meta_ads_campaign_campaignId_idx").on(table.campaignId),
	index("meta_ads_campaign_status_idx").on(table.status),
	index("meta_ads_campaign_objective_idx").on(table.objective)
]);
const metaAdsAdSet = pgTable("meta_ads_ad_set", {
	id: text("id").primaryKey(),
	campaignId: text("campaign_id").notNull().references(() => metaAdsCampaign.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull().references(() => metaAdsAccount.id, { onDelete: "cascade" }),
	adSetId: text("ad_set_id").notNull(),
	adSetName: text("ad_set_name"),
	status: text("status").default("ACTIVE").notNull(),
	dailyBudget: text("daily_budget"),
	lifetimeBudget: text("lifetime_budget"),
	budgetRemaining: text("budget_remaining"),
	bidAmount: text("bid_amount"),
	targeting: jsonb("targeting"),
	startTime: timestamp("start_time"),
	stopTime: timestamp("stop_time"),
	createdTime: timestamp("created_time"),
	updatedTime: timestamp("updated_time"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("meta_ads_ad_set_campaignId_adSetId_unique").on(table.campaignId, table.adSetId),
	index("meta_ads_ad_set_campaignId_idx").on(table.campaignId),
	index("meta_ads_ad_set_accountId_idx").on(table.accountId),
	index("meta_ads_ad_set_adSetId_idx").on(table.adSetId),
	index("meta_ads_ad_set_status_idx").on(table.status)
]);
const metaAdsAd = pgTable("meta_ads_ad", {
	id: text("id").primaryKey(),
	adSetId: text("ad_set_id").notNull().references(() => metaAdsAdSet.id, { onDelete: "cascade" }),
	campaignId: text("campaign_id").notNull().references(() => metaAdsCampaign.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull().references(() => metaAdsAccount.id, { onDelete: "cascade" }),
	adId: text("ad_id").notNull(),
	adName: text("ad_name"),
	status: text("status").default("ACTIVE").notNull(),
	creative: jsonb("creative"),
	createdTime: timestamp("created_time"),
	updatedTime: timestamp("updated_time"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	uniqueIndex("meta_ads_ad_adSetId_adId_unique").on(table.adSetId, table.adId),
	index("meta_ads_ad_adSetId_idx").on(table.adSetId),
	index("meta_ads_ad_campaignId_idx").on(table.campaignId),
	index("meta_ads_ad_accountId_idx").on(table.accountId),
	index("meta_ads_ad_adId_idx").on(table.adId),
	index("meta_ads_ad_status_idx").on(table.status)
]);
const metaAdsInsight = pgTable("meta_ads_insight", {
	id: text("id").primaryKey(),
	accountId: text("account_id").references(() => metaAdsAccount.id, { onDelete: "cascade" }),
	campaignId: text("campaign_id").references(() => metaAdsCampaign.id, { onDelete: "cascade" }),
	adSetId: text("ad_set_id").references(() => metaAdsAdSet.id, { onDelete: "cascade" }),
	adId: text("ad_id").references(() => metaAdsAd.id, { onDelete: "cascade" }),
	dateStart: timestamp("date_start").notNull(),
	dateEnd: timestamp("date_end").notNull(),
	breakdown: jsonb("breakdown"),
	metrics: jsonb("metrics").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("meta_ads_insight_accountId_idx").on(table.accountId),
	index("meta_ads_insight_campaignId_idx").on(table.campaignId),
	index("meta_ads_insight_adSetId_idx").on(table.adSetId),
	index("meta_ads_insight_adId_idx").on(table.adId),
	index("meta_ads_insight_dateStart_idx").on(table.dateStart),
	index("meta_ads_insight_dateEnd_idx").on(table.dateEnd)
]);
const metaAdsAccountActivityLog = pgTable("meta_ads_account_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	accountId: text("account_id").notNull().references(() => metaAdsAccount.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("meta_ads_account_activity_userId_idx").on(table.userId),
	index("meta_ads_account_activity_accountId_idx").on(table.accountId),
	index("meta_ads_account_activity_action_idx").on(table.action),
	index("meta_ads_account_activity_createdAt_idx").on(table.createdAt)
]);
const metaAdsCampaignActivityLog = pgTable("meta_ads_campaign_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	campaignId: text("campaign_id").notNull().references(() => metaAdsCampaign.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("meta_ads_campaign_activity_userId_idx").on(table.userId),
	index("meta_ads_campaign_activity_campaignId_idx").on(table.campaignId),
	index("meta_ads_campaign_activity_action_idx").on(table.action),
	index("meta_ads_campaign_activity_createdAt_idx").on(table.createdAt)
]);
const metaAdsAdSetActivityLog = pgTable("meta_ads_ad_set_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	adSetId: text("ad_set_id").notNull().references(() => metaAdsAdSet.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("meta_ads_ad_set_activity_userId_idx").on(table.userId),
	index("meta_ads_ad_set_activity_adSetId_idx").on(table.adSetId),
	index("meta_ads_ad_set_activity_action_idx").on(table.action),
	index("meta_ads_ad_set_activity_createdAt_idx").on(table.createdAt)
]);
const metaAdsAdActivityLog = pgTable("meta_ads_ad_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	adId: text("ad_id").notNull().references(() => metaAdsAd.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("meta_ads_ad_activity_userId_idx").on(table.userId),
	index("meta_ads_ad_activity_adId_idx").on(table.adId),
	index("meta_ads_ad_activity_action_idx").on(table.action),
	index("meta_ads_ad_activity_createdAt_idx").on(table.createdAt)
]);
const metaAdsAccountRelations = relations(metaAdsAccount, ({ one, many }) => ({
	team: one(team, {
		fields: [metaAdsAccount.teamId],
		references: [team.id]
	}),
	campaigns: many(metaAdsCampaign),
	adSets: many(metaAdsAdSet),
	ads: many(metaAdsAd),
	insights: many(metaAdsInsight),
	activityLogs: many(metaAdsAccountActivityLog)
}));
const metaAdsCampaignRelations = relations(metaAdsCampaign, ({ one, many }) => ({
	account: one(metaAdsAccount, {
		fields: [metaAdsCampaign.accountId],
		references: [metaAdsAccount.id]
	}),
	adSets: many(metaAdsAdSet),
	ads: many(metaAdsAd),
	insights: many(metaAdsInsight),
	activityLogs: many(metaAdsCampaignActivityLog)
}));
const metaAdsAdSetRelations = relations(metaAdsAdSet, ({ one, many }) => ({
	campaign: one(metaAdsCampaign, {
		fields: [metaAdsAdSet.campaignId],
		references: [metaAdsCampaign.id]
	}),
	account: one(metaAdsAccount, {
		fields: [metaAdsAdSet.accountId],
		references: [metaAdsAccount.id]
	}),
	ads: many(metaAdsAd),
	insights: many(metaAdsInsight),
	activityLogs: many(metaAdsAdSetActivityLog)
}));
const metaAdsAdRelations = relations(metaAdsAd, ({ one, many }) => ({
	adSet: one(metaAdsAdSet, {
		fields: [metaAdsAd.adSetId],
		references: [metaAdsAdSet.id]
	}),
	campaign: one(metaAdsCampaign, {
		fields: [metaAdsAd.campaignId],
		references: [metaAdsCampaign.id]
	}),
	account: one(metaAdsAccount, {
		fields: [metaAdsAd.accountId],
		references: [metaAdsAccount.id]
	}),
	insights: many(metaAdsInsight),
	activityLogs: many(metaAdsAdActivityLog)
}));
const metaAdsInsightRelations = relations(metaAdsInsight, ({ one }) => ({
	account: one(metaAdsAccount, {
		fields: [metaAdsInsight.accountId],
		references: [metaAdsAccount.id]
	}),
	campaign: one(metaAdsCampaign, {
		fields: [metaAdsInsight.campaignId],
		references: [metaAdsCampaign.id]
	}),
	adSet: one(metaAdsAdSet, {
		fields: [metaAdsInsight.adSetId],
		references: [metaAdsAdSet.id]
	}),
	ad: one(metaAdsAd, {
		fields: [metaAdsInsight.adId],
		references: [metaAdsAd.id]
	})
}));
const metaAdsAccountActivityLogRelations = relations(metaAdsAccountActivityLog, ({ one }) => ({
	user: one(user, {
		fields: [metaAdsAccountActivityLog.userId],
		references: [user.id]
	}),
	account: one(metaAdsAccount, {
		fields: [metaAdsAccountActivityLog.accountId],
		references: [metaAdsAccount.id]
	})
}));
const metaAdsCampaignActivityLogRelations = relations(metaAdsCampaignActivityLog, ({ one }) => ({
	user: one(user, {
		fields: [metaAdsCampaignActivityLog.userId],
		references: [user.id]
	}),
	campaign: one(metaAdsCampaign, {
		fields: [metaAdsCampaignActivityLog.campaignId],
		references: [metaAdsCampaign.id]
	})
}));
const metaAdsAdSetActivityLogRelations = relations(metaAdsAdSetActivityLog, ({ one }) => ({
	user: one(user, {
		fields: [metaAdsAdSetActivityLog.userId],
		references: [user.id]
	}),
	adSet: one(metaAdsAdSet, {
		fields: [metaAdsAdSetActivityLog.adSetId],
		references: [metaAdsAdSet.id]
	})
}));
const metaAdsAdActivityLogRelations = relations(metaAdsAdActivityLog, ({ one }) => ({
	user: one(user, {
		fields: [metaAdsAdActivityLog.userId],
		references: [user.id]
	}),
	ad: one(metaAdsAd, {
		fields: [metaAdsAdActivityLog.adId],
		references: [metaAdsAd.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/social-media-marketing.ts
const socialMediaIntegration = pgTable("social_media_integration", {
	id: text("_id").primaryKey(),
	platform: text("platform").notNull(),
	status: text("status").default("PENDING").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token").notNull(),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshToken: text("refresh_token"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	tokenType: text("token_type"),
	lastTokenRefreshAt: timestamp("last_token_refresh_at"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("social_media_integration_platform_idx").on(table.platform),
	index("social_media_integration_status_idx").on(table.status),
	index("social_media_integration_userId_idx").on(table.userId)
]);
const socialMediaPageToken = pgTable("social_media_page_token", {
	id: text("_id").primaryKey(),
	integrationId: text("integration_id").notNull().references(() => socialMediaIntegration.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	platform: text("platform").notNull(),
	pageId: text("page_id").notNull(),
	pageName: text("page_name"),
	pageUsername: text("page_username"),
	pagePicture: text("page_picture"),
	pageCategory: text("page_category"),
	accessToken: text("access_token").notNull(),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	isActive: boolean("is_active").default(true).notNull(),
	lastTokenRefreshAt: timestamp("last_token_refresh_at"),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	uniqueIndex("social_media_page_token_integrationId_pageId_unique").on(table.integrationId, table.pageId),
	index("social_media_page_token_integrationId_idx").on(table.integrationId),
	index("social_media_page_token_pageId_idx").on(table.pageId),
	index("social_media_page_token_platform_idx").on(table.platform),
	index("social_media_page_token_teamId_idx").on(table.teamId),
	index("social_media_page_token_isActive_idx").on(table.isActive),
	index("social_media_page_token_accessTokenExpiresAt_idx").on(table.accessTokenExpiresAt)
]);
const socialMediaIntegrationActivityLog = pgTable("social_media_integration_activity_log", {
	id: text("_id").primaryKey(),
	userId: text("user_id").notNull(),
	integrationId: text("integration_id").notNull().references(() => socialMediaIntegration.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("social_media_integration_activity_log_userId_idx").on(table.userId),
	index("social_media_integration_activity_log_integrationId_idx").on(table.integrationId),
	index("social_media_integration_activity_log_action_idx").on(table.action),
	index("social_media_integration_activity_log_createdAt_idx").on(table.createdAt)
]);
const socialMediaPageTokenActivityLog = pgTable("social_media_page_token_activity_log", {
	id: text("_id").primaryKey(),
	userId: text("user_id").notNull(),
	pageTokenId: text("page_token_id").notNull().references(() => socialMediaPageToken.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("social_media_page_token_activity_log_userId_idx").on(table.userId),
	index("social_media_page_token_activity_log_pageTokenId_idx").on(table.pageTokenId),
	index("social_media_page_token_activity_log_action_idx").on(table.action),
	index("social_media_page_token_activity_log_createdAt_idx").on(table.createdAt)
]);
const metaContentCalendar = pgTable("meta_content_calendar", {
	id: text("_id").primaryKey(),
	pageTokenId: text("page_token_id").references(() => socialMediaPageToken.id, { onDelete: "set null" }),
	message: text("message"),
	scheduledPublishTime: timestamp("scheduled_publish_time").notNull(),
	status: text("status").default("SCHEDULED").notNull(),
	published: boolean("published").default(false).notNull(),
	publishedAt: timestamp("published_at"),
	publishedPostId: text("published_post_id"),
	publishedPermalink: text("published_permalink"),
	lastError: text("last_error"),
	retryCount: integer("retry_count").default(0).notNull(),
	lastRetryAt: timestamp("last_retry_at"),
	qstashJobId: text("qstash_job_id"),
	createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("meta_content_calendar_pageTokenId_idx").on(table.pageTokenId),
	index("meta_content_calendar_status_idx").on(table.status),
	index("meta_content_calendar_scheduledPublishTime_idx").on(table.scheduledPublishTime),
	index("meta_content_calendar_published_idx").on(table.published),
	index("meta_content_calendar_createdBy_idx").on(table.createdBy),
	index("meta_content_calendar_createdAt_idx").on(table.createdAt)
]);
const metaContentCalendarMedia = pgTable("meta_content_calendar_media", {
	id: text("_id").primaryKey(),
	calendarPostId: text("calendar_post_id").notNull().references(() => metaContentCalendar.id, { onDelete: "cascade" }),
	mediaType: text("media_type").notNull(),
	url: text("url").notNull(),
	fileName: text("file_name"),
	fileSize: integer("file_size"),
	caption: text("caption"),
	description: text("description"),
	order: integer("order").default(0).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("meta_content_calendar_media_calendarPostId_idx").on(table.calendarPostId),
	index("meta_content_calendar_media_mediaType_idx").on(table.mediaType),
	index("meta_content_calendar_media_order_idx").on(table.order)
]);
const metaContentCalendarActivityLog = pgTable("meta_content_calendar_activity_log", {
	id: text("_id").primaryKey(),
	userId: text("user_id").notNull(),
	calendarPostId: text("calendar_post_id").notNull().references(() => metaContentCalendar.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("meta_content_calendar_activity_log_userId_idx").on(table.userId),
	index("meta_content_calendar_activity_log_calendarPostId_idx").on(table.calendarPostId),
	index("meta_content_calendar_activity_log_action_idx").on(table.action),
	index("meta_content_calendar_activity_log_createdAt_idx").on(table.createdAt)
]);
const linkedInContentCalendar = pgTable("linkedin_content_calendar", {
	id: text("_id").primaryKey(),
	pageTokenId: text("page_token_id").references(() => socialMediaPageToken.id, { onDelete: "set null" }),
	message: text("message"),
	scheduledPublishTime: timestamp("scheduled_publish_time").notNull(),
	status: text("status").default("SCHEDULED").notNull(),
	published: boolean("published").default(false).notNull(),
	publishedAt: timestamp("published_at"),
	publishedPostId: text("published_post_id"),
	publishedPermalink: text("published_permalink"),
	lastError: text("last_error"),
	retryCount: integer("retry_count").default(0).notNull(),
	lastRetryAt: timestamp("last_retry_at"),
	qstashJobId: text("qstash_job_id"),
	createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("linkedin_content_calendar_pageTokenId_idx").on(table.pageTokenId),
	index("linkedin_content_calendar_status_idx").on(table.status),
	index("linkedin_content_calendar_scheduledPublishTime_idx").on(table.scheduledPublishTime),
	index("linkedin_content_calendar_published_idx").on(table.published),
	index("linkedin_content_calendar_createdBy_idx").on(table.createdBy),
	index("linkedin_content_calendar_createdAt_idx").on(table.createdAt)
]);
const linkedInContentCalendarMedia = pgTable("linkedin_content_calendar_media", {
	id: text("_id").primaryKey(),
	calendarPostId: text("calendar_post_id").notNull().references(() => linkedInContentCalendar.id, { onDelete: "cascade" }),
	mediaType: text("media_type").notNull(),
	url: text("url").notNull(),
	fileName: text("file_name"),
	fileSize: integer("file_size"),
	caption: text("caption"),
	description: text("description"),
	order: integer("order").default(0).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("linkedin_content_calendar_media_calendarPostId_idx").on(table.calendarPostId),
	index("linkedin_content_calendar_media_mediaType_idx").on(table.mediaType),
	index("linkedin_content_calendar_media_order_idx").on(table.order)
]);
const linkedInContentCalendarActivityLog = pgTable("linkedin_content_calendar_activity_log", {
	id: text("_id").primaryKey(),
	userId: text("user_id").notNull(),
	calendarPostId: text("calendar_post_id").notNull().references(() => linkedInContentCalendar.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("linkedin_content_calendar_activity_log_userId_idx").on(table.userId),
	index("linkedin_content_calendar_activity_log_calendarPostId_idx").on(table.calendarPostId),
	index("linkedin_content_calendar_activity_log_action_idx").on(table.action),
	index("linkedin_content_calendar_activity_log_createdAt_idx").on(table.createdAt)
]);
const socialMediaIntegrationRelations = relations(socialMediaIntegration, ({ one, many }) => ({
	user: one(user, {
		fields: [socialMediaIntegration.userId],
		references: [user.id]
	}),
	pageTokens: many(socialMediaPageToken),
	activityLogs: many(socialMediaIntegrationActivityLog),
	metaAdsAccounts: many(metaAdsAccount)
}));
const socialMediaPageTokenRelations = relations(socialMediaPageToken, ({ one, many }) => ({
	integration: one(socialMediaIntegration, {
		fields: [socialMediaPageToken.integrationId],
		references: [socialMediaIntegration.id]
	}),
	team: one(team, {
		fields: [socialMediaPageToken.teamId],
		references: [team.id]
	}),
	user: one(user, {
		fields: [socialMediaPageToken.userId],
		references: [user.id]
	}),
	activityLogs: many(socialMediaPageTokenActivityLog),
	contentCalendarPosts: many(metaContentCalendar),
	linkedInContentCalendarPosts: many(linkedInContentCalendar)
}));
const socialMediaIntegrationActivityLogRelations = relations(socialMediaIntegrationActivityLog, ({ one }) => ({ integration: one(socialMediaIntegration, {
	fields: [socialMediaIntegrationActivityLog.integrationId],
	references: [socialMediaIntegration.id]
}) }));
const socialMediaPageTokenActivityLogRelations = relations(socialMediaPageTokenActivityLog, ({ one }) => ({ pageToken: one(socialMediaPageToken, {
	fields: [socialMediaPageTokenActivityLog.pageTokenId],
	references: [socialMediaPageToken.id]
}) }));
const metaContentCalendarRelations = relations(metaContentCalendar, ({ one, many }) => ({
	pageToken: one(socialMediaPageToken, {
		fields: [metaContentCalendar.pageTokenId],
		references: [socialMediaPageToken.id]
	}),
	user: one(user, {
		fields: [metaContentCalendar.createdBy],
		references: [user.id]
	}),
	mediaItems: many(metaContentCalendarMedia),
	activityLogs: many(metaContentCalendarActivityLog)
}));
const metaContentCalendarMediaRelations = relations(metaContentCalendarMedia, ({ one }) => ({ calendarPost: one(metaContentCalendar, {
	fields: [metaContentCalendarMedia.calendarPostId],
	references: [metaContentCalendar.id]
}) }));
const metaContentCalendarActivityLogRelations = relations(metaContentCalendarActivityLog, ({ one }) => ({ calendarPost: one(metaContentCalendar, {
	fields: [metaContentCalendarActivityLog.calendarPostId],
	references: [metaContentCalendar.id]
}) }));
const linkedInContentCalendarRelations = relations(linkedInContentCalendar, ({ one, many }) => ({
	pageToken: one(socialMediaPageToken, {
		fields: [linkedInContentCalendar.pageTokenId],
		references: [socialMediaPageToken.id]
	}),
	user: one(user, {
		fields: [linkedInContentCalendar.createdBy],
		references: [user.id]
	}),
	mediaItems: many(linkedInContentCalendarMedia),
	activityLogs: many(linkedInContentCalendarActivityLog)
}));
const linkedInContentCalendarMediaRelations = relations(linkedInContentCalendarMedia, ({ one }) => ({ calendarPost: one(linkedInContentCalendar, {
	fields: [linkedInContentCalendarMedia.calendarPostId],
	references: [linkedInContentCalendar.id]
}) }));
const linkedInContentCalendarActivityLogRelations = relations(linkedInContentCalendarActivityLog, ({ one }) => ({ calendarPost: one(linkedInContentCalendar, {
	fields: [linkedInContentCalendarActivityLog.calendarPostId],
	references: [linkedInContentCalendar.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/domain-transfer-requests.ts
const domainTransferRequest = pgTable("domain_transfer_request", {
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
	niscOrderId: text("nisc_order_id").references(() => niscOrder.id, { onDelete: "set null" }),
	createdById: text("created_by_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("domain_transfer_request_domainName_idx").on(table.domainName),
	index("domain_transfer_request_status_idx").on(table.status),
	index("domain_transfer_request_createdById_idx").on(table.createdById),
	index("domain_transfer_request_teamId_idx").on(table.teamId),
	index("domain_transfer_request_createdAt_idx").on(table.createdAt),
	index("domain_transfer_request_niscOrderId_idx").on(table.niscOrderId)
]);
const domainTransferRequestRelations = relations(domainTransferRequest, ({ one }) => ({
	team: one(team, {
		fields: [domainTransferRequest.teamId],
		references: [team.id]
	}),
	createdBy: one(user, {
		fields: [domainTransferRequest.createdById],
		references: [user.id],
		relationName: "DomainTransferRequestCreatedBy"
	}),
	niscOrder: one(niscOrder, {
		fields: [domainTransferRequest.niscOrderId],
		references: [niscOrder.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/email-builder-design.ts
const emailBuilderDesign = pgTable("email_builder_design", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	json: text("json").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	isPublic: boolean("is_public").default(false).notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("email_builder_design_userId_idx").on(table.userId),
	index("email_builder_design_teamId_idx").on(table.teamId),
	index("email_builder_design_isPublic_idx").on(table.isPublic)
]);
const emailBuilderDesignActivityLog = pgTable("email_builder_design_activity_log", {
	id: text("id").primaryKey(),
	emailBuilderDesignId: text("email_builder_design_id").notNull().references(() => emailBuilderDesign.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("email_builder_design_activity_emailBuilderDesignId_idx").on(table.emailBuilderDesignId),
	index("email_builder_design_activity_userId_idx").on(table.userId),
	index("email_builder_design_activity_action_idx").on(table.action),
	index("email_builder_design_activity_createdAt_idx").on(table.createdAt)
]);
const emailBuilderLibrary = pgTable("email_builder_library", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	fileName: text("file_name").notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: text("mime_type").notNull(),
	fileUrl: text("file_url").notNull(),
	storageKey: text("storage_key"),
	description: text("description"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("email_builder_library_userId_idx").on(table.userId),
	index("email_builder_library_teamId_idx").on(table.teamId),
	index("email_builder_library_createdAt_idx").on(table.createdAt)
]);
const emailBuilderDesignRelations = relations(emailBuilderDesign, ({ one, many }) => ({
	user: one(user, {
		fields: [emailBuilderDesign.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [emailBuilderDesign.teamId],
		references: [team.id]
	}),
	activityLogs: many(emailBuilderDesignActivityLog)
}));
const emailBuilderDesignActivityLogRelations = relations(emailBuilderDesignActivityLog, ({ one }) => ({ emailBuilderDesign: one(emailBuilderDesign, {
	fields: [emailBuilderDesignActivityLog.emailBuilderDesignId],
	references: [emailBuilderDesign.id]
}) }));
const emailBuilderLibraryRelations = relations(emailBuilderLibrary, ({ one }) => ({
	user: one(user, {
		fields: [emailBuilderLibrary.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [emailBuilderLibrary.teamId],
		references: [team.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/email-marketing.ts
const emailDomain = pgTable("email_domain", {
	id: text("id").primaryKey(),
	domainName: text("domain_name").notNull().unique(),
	resendDomainId: text("resend_domain_id"),
	status: text("status").default("PENDING").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	verificationStatus: text("verification_status"),
	verificationData: jsonb("verification_data"),
	dnsRecords: jsonb("dns_records"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	verifiedAt: timestamp("verified_at")
}, (table) => [
	index("email_domain_userId_idx").on(table.userId),
	index("email_domain_teamId_idx").on(table.teamId),
	index("email_domain_status_idx").on(table.status),
	index("email_domain_domainName_idx").on(table.domainName)
]);
const emailCampaign = pgTable("email_campaign", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	subject: text("subject").notNull(),
	fromEmail: text("from_email").notNull(),
	fromName: text("from_name"),
	status: text("status").default("DRAFT").notNull(),
	htmlContent: text("html_content"),
	textContent: text("text_content"),
	scheduledAt: timestamp("scheduled_at"),
	sentAt: timestamp("sent_at"),
	emailDomainId: text("email_domain_id").references(() => emailDomain.id, { onDelete: "set null" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("email_campaign_emailDomainId_idx").on(table.emailDomainId),
	index("email_campaign_userId_idx").on(table.userId),
	index("email_campaign_teamId_idx").on(table.teamId),
	index("email_campaign_status_idx").on(table.status),
	index("email_campaign_scheduledAt_idx").on(table.scheduledAt)
]);
const emailCampaignSendJob = pgTable("email_campaign_send_job", {
	id: text("id").primaryKey(),
	campaignId: text("campaign_id").notNull().references(() => emailCampaign.id, { onDelete: "cascade" }),
	status: text("status").default("QUEUED").notNull(),
	qstashMessageId: text("qstash_message_id"),
	scheduledFor: timestamp("scheduled_for"),
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("email_campaign_send_job_campaignId_idx").on(table.campaignId),
	index("email_campaign_send_job_status_idx").on(table.status),
	index("email_campaign_send_job_scheduledFor_idx").on(table.scheduledFor),
	index("email_campaign_send_job_qstashMessageId_idx").on(table.qstashMessageId)
]);
const campaignRecipient = pgTable("campaign_recipient", {
	id: text("id").primaryKey(),
	campaignId: text("campaign_id").notNull().references(() => emailCampaign.id, { onDelete: "cascade" }),
	toEmail: text("to_email").notNull(),
	resendId: text("resend_id"),
	resendMessageId: text("resend_message_id"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("campaign_recipient_campaignId_idx").on(table.campaignId),
	index("campaign_recipient_toEmail_idx").on(table.toEmail),
	index("campaign_recipient_resendId_idx").on(table.resendId)
]);
const emailAudience = pgTable("email_audience", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("email_audience_userId_idx").on(table.userId),
	index("email_audience_teamId_idx").on(table.teamId),
	index("email_audience_createdAt_idx").on(table.createdAt)
]);
const emailAudienceContact = pgTable("email_audience_contact", {
	id: text("id").primaryKey(),
	audienceId: text("audience_id").notNull().references(() => emailAudience.id, { onDelete: "cascade" }),
	name: text("name"),
	phoneNumber: text("phone_number"),
	emailAddress: text("email_address"),
	description: text("description"),
	company: text("company"),
	status: text("status").default("SUBSCRIBED"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("email_audience_contact_audienceId_idx").on(table.audienceId),
	index("email_audience_contact_emailAddress_idx").on(table.emailAddress),
	index("email_audience_contact_status_idx").on(table.status)
]);
const emailEvent = pgTable("email_event", {
	id: text("id").primaryKey(),
	campaignRecipientId: text("campaign_recipient_id").notNull().references(() => campaignRecipient.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	eventCreatedAt: timestamp("event_created_at").notNull(),
	resendEmailId: text("resend_email_id"),
	data: jsonb("data").notNull(),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("email_event_campaignRecipientId_idx").on(table.campaignRecipientId),
	index("email_event_type_idx").on(table.type),
	index("email_event_eventCreatedAt_idx").on(table.eventCreatedAt),
	index("email_event_resendEmailId_idx").on(table.resendEmailId)
]);
const emailEventActivityLog = pgTable("email_event_activity_log", {
	id: text("id").primaryKey(),
	emailEventId: text("email_event_id").notNull().references(() => emailEvent.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("email_event_activity_log_emailEventId_idx").on(table.emailEventId),
	index("email_event_activity_log_action_idx").on(table.action),
	index("email_event_activity_log_createdAt_idx").on(table.createdAt)
]);
const emailDomainActivityLog = pgTable("email_domain_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	emailDomainId: text("email_domain_id").notNull().references(() => emailDomain.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("email_domain_activity_log_userId_idx").on(table.userId),
	index("email_domain_activity_log_emailDomainId_idx").on(table.emailDomainId),
	index("email_domain_activity_log_action_idx").on(table.action),
	index("email_domain_activity_log_createdAt_idx").on(table.createdAt)
]);
const emailCampaignActivityLog = pgTable("email_campaign_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	campaignId: text("campaign_id").notNull().references(() => emailCampaign.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("email_campaign_activity_log_userId_idx").on(table.userId),
	index("email_campaign_activity_log_campaignId_idx").on(table.campaignId),
	index("email_campaign_activity_log_action_idx").on(table.action),
	index("email_campaign_activity_log_createdAt_idx").on(table.createdAt)
]);
const emailDomainRelations = relations(emailDomain, ({ one, many }) => ({
	user: one(user, {
		fields: [emailDomain.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [emailDomain.teamId],
		references: [team.id]
	}),
	campaigns: many(emailCampaign),
	activityLogs: many(emailDomainActivityLog)
}));
const emailCampaignRelations = relations(emailCampaign, ({ one, many }) => ({
	emailDomain: one(emailDomain, {
		fields: [emailCampaign.emailDomainId],
		references: [emailDomain.id]
	}),
	user: one(user, {
		fields: [emailCampaign.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [emailCampaign.teamId],
		references: [team.id]
	}),
	recipients: many(campaignRecipient),
	sendJobs: many(emailCampaignSendJob),
	activityLogs: many(emailCampaignActivityLog)
}));
const emailCampaignSendJobRelations = relations(emailCampaignSendJob, ({ one }) => ({ campaign: one(emailCampaign, {
	fields: [emailCampaignSendJob.campaignId],
	references: [emailCampaign.id]
}) }));
const campaignRecipientRelations = relations(campaignRecipient, ({ one, many }) => ({
	campaign: one(emailCampaign, {
		fields: [campaignRecipient.campaignId],
		references: [emailCampaign.id]
	}),
	emailEvents: many(emailEvent)
}));
const emailAudienceRelations = relations(emailAudience, ({ one, many }) => ({
	user: one(user, {
		fields: [emailAudience.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [emailAudience.teamId],
		references: [team.id]
	}),
	contacts: many(emailAudienceContact)
}));
const emailAudienceContactRelations = relations(emailAudienceContact, ({ one }) => ({ audience: one(emailAudience, {
	fields: [emailAudienceContact.audienceId],
	references: [emailAudience.id]
}) }));
const emailEventRelations = relations(emailEvent, ({ one, many }) => ({
	campaignRecipient: one(campaignRecipient, {
		fields: [emailEvent.campaignRecipientId],
		references: [campaignRecipient.id]
	}),
	activityLogs: many(emailEventActivityLog)
}));
const emailEventActivityLogRelations = relations(emailEventActivityLog, ({ one }) => ({ emailEvent: one(emailEvent, {
	fields: [emailEventActivityLog.emailEventId],
	references: [emailEvent.id]
}) }));
const emailDomainActivityLogRelations = relations(emailDomainActivityLog, ({ one }) => ({ emailDomain: one(emailDomain, {
	fields: [emailDomainActivityLog.emailDomainId],
	references: [emailDomain.id]
}) }));
const emailCampaignActivityLogRelations = relations(emailCampaignActivityLog, ({ one }) => ({ campaign: one(emailCampaign, {
	fields: [emailCampaignActivityLog.campaignId],
	references: [emailCampaign.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/etims.ts
const eTimsConfiguration = pgTable("etims_configuration", {
	id: text("id").primaryKey(),
	kraPin: text("kra_pin").notNull(),
	branchId: text("branch_id").default("00").notNull(),
	branchName: text("branch_name"),
	deviceSerialNumber: text("device_serial_number").notNull(),
	cmcKey: text("cmc_key"),
	isSandbox: boolean("is_sandbox").default(true).notNull(),
	isInitialized: boolean("is_initialized").default(false).notNull(),
	lastSyncAt: timestamp("last_sync_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("etims_configuration_kraPin_branchId_idx").on(table.kraPin, table.branchId)]);
const eTimsItem = pgTable("etims_item", {
	id: text("id").primaryKey(),
	localItemId: text("local_item_id"),
	itemCd: text("item_cd").notNull(),
	itemClsCd: text("item_cls_cd").notNull(),
	itemNm: text("item_nm").notNull(),
	taxTyCd: text("tax_ty_cd").default("A").notNull(),
	pkgUnitCd: text("pkg_unit_cd").default("OU").notNull(),
	originCountryCd: text("origin_country_cd"),
	packagingUnit: text("packaging_unit"),
	quantityUnit: text("quantity_unit"),
	unitPrice: text("unit_price"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [uniqueIndex("etims_item_itemCd_unique").on(table.itemCd)]);

//#endregion
//#region ../../packages/db/src/schema/google-ads.ts
const googleAdsIntegration = pgTable("google_ads_integration", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	status: text("status").default("PENDING").notNull(),
	refreshToken: text("refresh_token").notNull(),
	accessToken: text("access_token").notNull(),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	scope: text("scope"),
	tokenType: text("token_type"),
	lastTokenRefreshAt: timestamp("last_token_refresh_at"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("google_ads_integration_status_idx").on(table.status), index("google_ads_integration_userId_idx").on(table.userId)]);
const googleAdsAccount = pgTable("google_ads_account", {
	id: text("id").primaryKey(),
	integrationId: text("integration_id").notNull().references(() => googleAdsIntegration.id, { onDelete: "cascade" }),
	customerId: text("customer_id").notNull(),
	accountName: text("account_name"),
	currencyCode: text("currency_code"),
	timeZone: text("time_zone"),
	status: text("status").default("ACTIVE").notNull(),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	uniqueIndex("google_ads_account_integrationId_customerId_unique").on(table.integrationId, table.customerId),
	index("google_ads_account_integrationId_idx").on(table.integrationId),
	index("google_ads_account_customerId_idx").on(table.customerId),
	index("google_ads_account_status_idx").on(table.status),
	index("google_ads_account_teamId_idx").on(table.teamId)
]);
const googleAdsIntegrationActivityLog = pgTable("google_ads_integration_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	integrationId: text("integration_id").notNull().references(() => googleAdsIntegration.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("google_ads_integration_activity_log_userId_idx").on(table.userId),
	index("google_ads_integration_activity_log_integrationId_idx").on(table.integrationId),
	index("google_ads_integration_activity_log_action_idx").on(table.action),
	index("google_ads_integration_activity_log_createdAt_idx").on(table.createdAt)
]);
const googleAdsAccountActivityLog = pgTable("google_ads_account_activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	accountId: text("account_id").notNull().references(() => googleAdsAccount.id, { onDelete: "cascade" }),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("google_ads_account_activity_log_userId_idx").on(table.userId),
	index("google_ads_account_activity_log_accountId_idx").on(table.accountId),
	index("google_ads_account_activity_log_action_idx").on(table.action),
	index("google_ads_account_activity_log_createdAt_idx").on(table.createdAt)
]);
const googleAdsIntegrationRelations = relations(googleAdsIntegration, ({ one, many }) => ({
	user: one(user, {
		fields: [googleAdsIntegration.userId],
		references: [user.id]
	}),
	accounts: many(googleAdsAccount),
	activityLogs: many(googleAdsIntegrationActivityLog)
}));
const googleAdsAccountRelations = relations(googleAdsAccount, ({ one, many }) => ({
	integration: one(googleAdsIntegration, {
		fields: [googleAdsAccount.integrationId],
		references: [googleAdsIntegration.id]
	}),
	team: one(team, {
		fields: [googleAdsAccount.teamId],
		references: [team.id]
	}),
	activityLogs: many(googleAdsAccountActivityLog)
}));
const googleAdsIntegrationActivityLogRelations = relations(googleAdsIntegrationActivityLog, ({ one }) => ({ integration: one(googleAdsIntegration, {
	fields: [googleAdsIntegrationActivityLog.integrationId],
	references: [googleAdsIntegration.id]
}) }));
const googleAdsAccountActivityLogRelations = relations(googleAdsAccountActivityLog, ({ one }) => ({ account: one(googleAdsAccount, {
	fields: [googleAdsAccountActivityLog.accountId],
	references: [googleAdsAccount.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/image-generator.ts
const imageGeneratorGeneration = pgTable("image_generator_generation", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	prompt: text("prompt").notNull(),
	referenceImageUrls: jsonb("reference_image_urls"),
	aspectRatio: text("aspect_ratio").notNull(),
	outputFormat: text("output_format").notNull(),
	resolution: text("resolution").notNull(),
	variationsCount: integer("variations_count").notNull(),
	modelId: text("model_id").notNull(),
	modelName: text("model_name"),
	status: text("status").default("QUEUED").notNull(),
	errorMessage: text("error_message"),
	qstashMessageId: text("qstash_message_id"),
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("image_generator_generation_userId_idx").on(table.userId),
	index("image_generator_generation_teamId_idx").on(table.teamId),
	index("image_generator_generation_createdAt_idx").on(table.createdAt),
	index("image_generator_generation_modelId_idx").on(table.modelId),
	index("image_generator_generation_status_idx").on(table.status)
]);
const imageGeneratorVariation = pgTable("image_generator_variation", {
	id: text("id").primaryKey(),
	imageGeneratorGenerationId: text("image_generator_generation_id").notNull().references(() => imageGeneratorGeneration.id, { onDelete: "cascade" }),
	variationIndex: integer("variation_index").notNull(),
	status: text("status").default("PROCESSING").notNull(),
	errorMessage: text("error_message"),
	predictionId: text("prediction_id"),
	imageUrl: text("image_url"),
	imageKey: text("image_key"),
	imageFileName: text("image_file_name"),
	imageSize: integer("image_size"),
	imageMimeType: text("image_mime_type"),
	imageMetadata: jsonb("image_metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("image_generator_variation_imageGeneratorGenerationId_idx").on(table.imageGeneratorGenerationId),
	index("image_generator_variation_variationIndex_idx").on(table.variationIndex),
	index("image_generator_variation_status_idx").on(table.status),
	index("image_generator_variation_predictionId_idx").on(table.predictionId)
]);
const imageGeneratorGenerationActivityLog = pgTable("image_generator_generation_activity_log", {
	id: text("id").primaryKey(),
	imageGeneratorGenerationId: text("image_generator_generation_id").notNull().references(() => imageGeneratorGeneration.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("image_gen_generation_activity_imageGeneratorGenerationId_idx").on(table.imageGeneratorGenerationId),
	index("image_gen_generation_activity_userId_idx").on(table.userId),
	index("image_gen_generation_activity_action_idx").on(table.action),
	index("image_gen_generation_activity_createdAt_idx").on(table.createdAt)
]);
const backgroundRemoverGeneration = pgTable("background_remover_generation", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	originalImageUrl: text("original_image_url").notNull(),
	originalImageKey: text("original_image_key").notNull(),
	originalImageFileName: text("original_image_file_name").notNull(),
	originalImageSize: integer("original_image_size").notNull(),
	originalImageMimeType: text("original_image_mime_type").notNull(),
	originalImageMetadata: jsonb("original_image_metadata"),
	processedImageUrl: text("processed_image_url"),
	processedImageKey: text("processed_image_key"),
	processedImageFileName: text("processed_image_file_name"),
	processedImageSize: integer("processed_image_size"),
	processedImageMimeType: text("processed_image_mime_type"),
	processedImageMetadata: jsonb("processed_image_metadata"),
	modelId: text("model_id").notNull(),
	modelName: text("model_name"),
	status: text("status").default("QUEUED").notNull(),
	errorMessage: text("error_message"),
	qstashMessageId: text("qstash_message_id"),
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("background_remover_generation_userId_idx").on(table.userId),
	index("background_remover_generation_teamId_idx").on(table.teamId),
	index("background_remover_generation_createdAt_idx").on(table.createdAt),
	index("background_remover_generation_modelId_idx").on(table.modelId),
	index("background_remover_generation_status_idx").on(table.status)
]);
const backgroundRemoverGenerationActivityLog = pgTable("background_remover_generation_activity_log", {
	id: text("id").primaryKey(),
	backgroundRemoverGenerationId: text("background_remover_generation_id").notNull().references(() => backgroundRemoverGeneration.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("background_remover_activity_backgroundRemoverGenerationId_idx").on(table.backgroundRemoverGenerationId),
	index("background_remover_activity_userId_idx").on(table.userId),
	index("background_remover_activity_action_idx").on(table.action),
	index("background_remover_activity_createdAt_idx").on(table.createdAt)
]);
const imageGeneratorGenerationRelations = relations(imageGeneratorGeneration, ({ one, many }) => ({
	user: one(user, {
		fields: [imageGeneratorGeneration.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [imageGeneratorGeneration.teamId],
		references: [team.id]
	}),
	variations: many(imageGeneratorVariation),
	activityLogs: many(imageGeneratorGenerationActivityLog)
}));
const imageGeneratorVariationRelations = relations(imageGeneratorVariation, ({ one }) => ({ imageGeneratorGeneration: one(imageGeneratorGeneration, {
	fields: [imageGeneratorVariation.imageGeneratorGenerationId],
	references: [imageGeneratorGeneration.id]
}) }));
const imageGeneratorGenerationActivityLogRelations = relations(imageGeneratorGenerationActivityLog, ({ one }) => ({ imageGeneratorGeneration: one(imageGeneratorGeneration, {
	fields: [imageGeneratorGenerationActivityLog.imageGeneratorGenerationId],
	references: [imageGeneratorGeneration.id]
}) }));
const backgroundRemoverGenerationRelations = relations(backgroundRemoverGeneration, ({ one, many }) => ({
	user: one(user, {
		fields: [backgroundRemoverGeneration.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [backgroundRemoverGeneration.teamId],
		references: [team.id]
	}),
	activityLogs: many(backgroundRemoverGenerationActivityLog)
}));
const backgroundRemoverGenerationActivityLogRelations = relations(backgroundRemoverGenerationActivityLog, ({ one }) => ({ backgroundRemoverGeneration: one(backgroundRemoverGeneration, {
	fields: [backgroundRemoverGenerationActivityLog.backgroundRemoverGenerationId],
	references: [backgroundRemoverGeneration.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/imagegen-studio.ts
const imageGenProject = pgTable("imagegen_project", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	json: text("json").notNull(),
	height: integer("height").notNull(),
	width: integer("width").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("imagegen_project_userId_idx").on(table.userId), index("imagegen_project_teamId_idx").on(table.teamId)]);
const imageGenTemplate = pgTable("imagegen_template", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	json: text("json").notNull(),
	height: integer("height").notNull(),
	width: integer("width").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	isPublic: boolean("is_public").default(true).notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [index("imagegen_template_userId_idx").on(table.userId), index("imagegen_template_isPublic_idx").on(table.isPublic)]);
const imageGenProjectActivityLog = pgTable("imagegen_project_activity_log", {
	id: text("id").primaryKey(),
	imageGenProjectId: text("image_gen_project_id").notNull().references(() => imageGenProject.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("imagegen_project_activity_log_imageGenProjectId_idx").on(table.imageGenProjectId),
	index("imagegen_project_activity_log_userId_idx").on(table.userId),
	index("imagegen_project_activity_log_action_idx").on(table.action),
	index("imagegen_project_activity_log_createdAt_idx").on(table.createdAt)
]);
const imageGenTemplateActivityLog = pgTable("imagegen_template_activity_log", {
	id: text("id").primaryKey(),
	imageGenTemplateId: text("image_gen_template_id").notNull().references(() => imageGenTemplate.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("imagegen_template_activity_log_imageGenTemplateId_idx").on(table.imageGenTemplateId),
	index("imagegen_template_activity_log_userId_idx").on(table.userId),
	index("imagegen_template_activity_log_action_idx").on(table.action),
	index("imagegen_template_activity_log_createdAt_idx").on(table.createdAt)
]);
const imageGenUpload = pgTable("imagegen_upload", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	fileUrl: text("file_url").notNull(),
	fileKey: text("file_key").notNull(),
	fileName: text("file_name").notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: text("mime_type").notNull(),
	fileMetadata: jsonb("file_metadata"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("imagegen_upload_userId_idx").on(table.userId),
	index("imagegen_upload_teamId_idx").on(table.teamId),
	index("imagegen_upload_createdAt_idx").on(table.createdAt)
]);
const imageGenUploadActivityLog = pgTable("imagegen_upload_activity_log", {
	id: text("id").primaryKey(),
	imageGenUploadId: text("image_gen_upload_id").notNull().references(() => imageGenUpload.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("imagegen_upload_activity_log_imageGenUploadId_idx").on(table.imageGenUploadId),
	index("imagegen_upload_activity_log_userId_idx").on(table.userId),
	index("imagegen_upload_activity_log_action_idx").on(table.action),
	index("imagegen_upload_activity_log_createdAt_idx").on(table.createdAt)
]);
const imageGenAiGeneration = pgTable("imagegen_ai_generation", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
	prompt: text("prompt").notNull(),
	referenceImageUrls: jsonb("reference_image_urls"),
	imageUrl: text("image_url").notNull(),
	imageKey: text("image_key").notNull(),
	imageFileName: text("image_file_name").notNull(),
	imageSize: integer("image_size").notNull(),
	imageMimeType: text("image_mime_type").notNull(),
	imageMetadata: jsonb("image_metadata"),
	modelId: text("model_id").notNull(),
	modelName: text("model_name"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index("imagegen_ai_generation_userId_idx").on(table.userId),
	index("imagegen_ai_generation_teamId_idx").on(table.teamId),
	index("imagegen_ai_generation_createdAt_idx").on(table.createdAt),
	index("imagegen_ai_generation_modelId_idx").on(table.modelId)
]);
const imageGenAiGenerationActivityLog = pgTable("imagegen_ai_generation_activity_log", {
	id: text("id").primaryKey(),
	imageGenAiGenerationId: text("image_gen_ai_generation_id").notNull().references(() => imageGenAiGeneration.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull(),
	action: text("action").notNull(),
	description: text("description"),
	metadata: jsonb("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull()
}, (table) => [
	index("imagegen_ai_generation_activity_log_imageGenAiGenerationId_idx").on(table.imageGenAiGenerationId),
	index("imagegen_ai_generation_activity_log_userId_idx").on(table.userId),
	index("imagegen_ai_generation_activity_log_action_idx").on(table.action),
	index("imagegen_ai_generation_activity_log_createdAt_idx").on(table.createdAt)
]);
const imageGenProjectRelations = relations(imageGenProject, ({ one, many }) => ({
	user: one(user, {
		fields: [imageGenProject.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [imageGenProject.teamId],
		references: [team.id]
	}),
	activityLogs: many(imageGenProjectActivityLog)
}));
const imageGenTemplateRelations = relations(imageGenTemplate, ({ one, many }) => ({
	user: one(user, {
		fields: [imageGenTemplate.userId],
		references: [user.id]
	}),
	activityLogs: many(imageGenTemplateActivityLog)
}));
const imageGenProjectActivityLogRelations = relations(imageGenProjectActivityLog, ({ one }) => ({ imageGenProject: one(imageGenProject, {
	fields: [imageGenProjectActivityLog.imageGenProjectId],
	references: [imageGenProject.id]
}) }));
const imageGenTemplateActivityLogRelations = relations(imageGenTemplateActivityLog, ({ one }) => ({ imageGenTemplate: one(imageGenTemplate, {
	fields: [imageGenTemplateActivityLog.imageGenTemplateId],
	references: [imageGenTemplate.id]
}) }));
const imageGenUploadRelations = relations(imageGenUpload, ({ one, many }) => ({
	user: one(user, {
		fields: [imageGenUpload.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [imageGenUpload.teamId],
		references: [team.id]
	}),
	activityLogs: many(imageGenUploadActivityLog)
}));
const imageGenUploadActivityLogRelations = relations(imageGenUploadActivityLog, ({ one }) => ({ imageGenUpload: one(imageGenUpload, {
	fields: [imageGenUploadActivityLog.imageGenUploadId],
	references: [imageGenUpload.id]
}) }));
const imageGenAiGenerationRelations = relations(imageGenAiGeneration, ({ one, many }) => ({
	user: one(user, {
		fields: [imageGenAiGeneration.userId],
		references: [user.id]
	}),
	team: one(team, {
		fields: [imageGenAiGeneration.teamId],
		references: [team.id]
	}),
	activityLogs: many(imageGenAiGenerationActivityLog)
}));
const imageGenAiGenerationActivityLogRelations = relations(imageGenAiGenerationActivityLog, ({ one }) => ({ imageGenAiGeneration: one(imageGenAiGeneration, {
	fields: [imageGenAiGenerationActivityLog.imageGenAiGenerationId],
	references: [imageGenAiGeneration.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/index.ts
var schema_exports = /* @__PURE__ */ __export({
	account: () => account,
	accountRelations: () => accountRelations,
	agencyPermission: () => agencyPermission,
	agencyPermissionRelations: () => agencyPermissionRelations,
	agencyRole: () => agencyRole,
	agencyRolePermission: () => agencyRolePermission,
	agencyRolePermissionRelations: () => agencyRolePermissionRelations,
	agencyRoleRelations: () => agencyRoleRelations,
	aiChat: () => aiChat,
	aiChatMessage: () => aiChatMessage,
	aiChatMessageRelations: () => aiChatMessageRelations,
	aiChatRelations: () => aiChatRelations,
	backgroundRemoverGeneration: () => backgroundRemoverGeneration,
	backgroundRemoverGenerationActivityLog: () => backgroundRemoverGenerationActivityLog,
	backgroundRemoverGenerationActivityLogRelations: () => backgroundRemoverGenerationActivityLogRelations,
	backgroundRemoverGenerationRelations: () => backgroundRemoverGenerationRelations,
	campaignRecipient: () => campaignRecipient,
	campaignRecipientRelations: () => campaignRecipientRelations,
	creativeAsset: () => creativeAsset,
	creativeAssetActivityLog: () => creativeAssetActivityLog,
	creativeAssetActivityLogRelations: () => creativeAssetActivityLogRelations,
	creativeAssetComment: () => creativeAssetComment,
	creativeAssetCommentRelations: () => creativeAssetCommentRelations,
	creativeAssetPermission: () => creativeAssetPermission,
	creativeAssetPermissionRelations: () => creativeAssetPermissionRelations,
	creativeAssetRelations: () => creativeAssetRelations,
	creativeAssetVersion: () => creativeAssetVersion,
	creativeAssetVersionActivityLog: () => creativeAssetVersionActivityLog,
	creativeAssetVersionActivityLogRelations: () => creativeAssetVersionActivityLogRelations,
	creativeAssetVersionRelations: () => creativeAssetVersionRelations,
	creativeBrief: () => creativeBrief,
	creativeBriefActivityLog: () => creativeBriefActivityLog,
	creativeBriefActivityLogRelations: () => creativeBriefActivityLogRelations,
	creativeBriefReferenceImage: () => creativeBriefReferenceImage,
	creativeBriefReferenceImageRelations: () => creativeBriefReferenceImageRelations,
	creativeBriefRelations: () => creativeBriefRelations,
	creativeProductionSnapshot: () => creativeProductionSnapshot,
	creditNote: () => creditNote,
	creditNoteActivityLog: () => creditNoteActivityLog,
	creditNoteActivityLogRelations: () => creditNoteActivityLogRelations,
	creditNoteRelations: () => creditNoteRelations,
	customerIntegration: () => customerIntegration,
	customerIntegrationActivityLog: () => customerIntegrationActivityLog,
	customerIntegrationActivityLogRelations: () => customerIntegrationActivityLogRelations,
	customerIntegrationRelations: () => customerIntegrationRelations,
	domain: () => domain,
	domainActivityLog: () => domainActivityLog,
	domainActivityLogRelations: () => domainActivityLogRelations,
	domainRelations: () => domainRelations,
	domainRenewal: () => domainRenewal,
	domainRenewalActivityLog: () => domainRenewalActivityLog,
	domainRenewalActivityLogRelations: () => domainRenewalActivityLogRelations,
	domainRenewalRelations: () => domainRenewalRelations,
	domainTransfer: () => domainTransfer,
	domainTransferActivityLog: () => domainTransferActivityLog,
	domainTransferActivityLogRelations: () => domainTransferActivityLogRelations,
	domainTransferRelations: () => domainTransferRelations,
	domainTransferRequest: () => domainTransferRequest,
	domainTransferRequestRelations: () => domainTransferRequestRelations,
	eTimsConfiguration: () => eTimsConfiguration,
	eTimsItem: () => eTimsItem,
	emailAudience: () => emailAudience,
	emailAudienceContact: () => emailAudienceContact,
	emailAudienceContactRelations: () => emailAudienceContactRelations,
	emailAudienceRelations: () => emailAudienceRelations,
	emailBuilderDesign: () => emailBuilderDesign,
	emailBuilderDesignActivityLog: () => emailBuilderDesignActivityLog,
	emailBuilderDesignActivityLogRelations: () => emailBuilderDesignActivityLogRelations,
	emailBuilderDesignRelations: () => emailBuilderDesignRelations,
	emailBuilderLibrary: () => emailBuilderLibrary,
	emailBuilderLibraryRelations: () => emailBuilderLibraryRelations,
	emailCampaign: () => emailCampaign,
	emailCampaignActivityLog: () => emailCampaignActivityLog,
	emailCampaignActivityLogRelations: () => emailCampaignActivityLogRelations,
	emailCampaignRelations: () => emailCampaignRelations,
	emailCampaignSendJob: () => emailCampaignSendJob,
	emailCampaignSendJobRelations: () => emailCampaignSendJobRelations,
	emailDomain: () => emailDomain,
	emailDomainActivityLog: () => emailDomainActivityLog,
	emailDomainActivityLogRelations: () => emailDomainActivityLogRelations,
	emailDomainRelations: () => emailDomainRelations,
	emailEvent: () => emailEvent,
	emailEventActivityLog: () => emailEventActivityLog,
	emailEventActivityLogRelations: () => emailEventActivityLogRelations,
	emailEventRelations: () => emailEventRelations,
	googleAdsAccount: () => googleAdsAccount,
	googleAdsAccountActivityLog: () => googleAdsAccountActivityLog,
	googleAdsAccountActivityLogRelations: () => googleAdsAccountActivityLogRelations,
	googleAdsAccountRelations: () => googleAdsAccountRelations,
	googleAdsIntegration: () => googleAdsIntegration,
	googleAdsIntegrationActivityLog: () => googleAdsIntegrationActivityLog,
	googleAdsIntegrationActivityLogRelations: () => googleAdsIntegrationActivityLogRelations,
	googleAdsIntegrationRelations: () => googleAdsIntegrationRelations,
	hostingPlan: () => hostingPlan,
	hostingPlanActivityLog: () => hostingPlanActivityLog,
	hostingPlanActivityLogRelations: () => hostingPlanActivityLogRelations,
	hostingPlanRelations: () => hostingPlanRelations,
	hostingRenewal: () => hostingRenewal,
	hostingRenewalActivityLog: () => hostingRenewalActivityLog,
	hostingRenewalActivityLogRelations: () => hostingRenewalActivityLogRelations,
	hostingRenewalRelations: () => hostingRenewalRelations,
	hostingSubscription: () => hostingSubscription,
	hostingSubscriptionActivityLog: () => hostingSubscriptionActivityLog,
	hostingSubscriptionActivityLogRelations: () => hostingSubscriptionActivityLogRelations,
	hostingSubscriptionRelations: () => hostingSubscriptionRelations,
	imageGenAiGeneration: () => imageGenAiGeneration,
	imageGenAiGenerationActivityLog: () => imageGenAiGenerationActivityLog,
	imageGenAiGenerationActivityLogRelations: () => imageGenAiGenerationActivityLogRelations,
	imageGenAiGenerationRelations: () => imageGenAiGenerationRelations,
	imageGenProject: () => imageGenProject,
	imageGenProjectActivityLog: () => imageGenProjectActivityLog,
	imageGenProjectActivityLogRelations: () => imageGenProjectActivityLogRelations,
	imageGenProjectRelations: () => imageGenProjectRelations,
	imageGenTemplate: () => imageGenTemplate,
	imageGenTemplateActivityLog: () => imageGenTemplateActivityLog,
	imageGenTemplateActivityLogRelations: () => imageGenTemplateActivityLogRelations,
	imageGenTemplateRelations: () => imageGenTemplateRelations,
	imageGenUpload: () => imageGenUpload,
	imageGenUploadActivityLog: () => imageGenUploadActivityLog,
	imageGenUploadActivityLogRelations: () => imageGenUploadActivityLogRelations,
	imageGenUploadRelations: () => imageGenUploadRelations,
	imageGeneratorGeneration: () => imageGeneratorGeneration,
	imageGeneratorGenerationActivityLog: () => imageGeneratorGenerationActivityLog,
	imageGeneratorGenerationActivityLogRelations: () => imageGeneratorGenerationActivityLogRelations,
	imageGeneratorGenerationRelations: () => imageGeneratorGenerationRelations,
	imageGeneratorVariation: () => imageGeneratorVariation,
	imageGeneratorVariationRelations: () => imageGeneratorVariationRelations,
	invoice: () => invoice,
	invoiceActivityLog: () => invoiceActivityLog,
	invoiceActivityLogRelations: () => invoiceActivityLogRelations,
	invoiceCounter: () => invoiceCounter,
	invoiceLineItem: () => invoiceLineItem,
	invoiceLineItemRelations: () => invoiceLineItemRelations,
	invoiceRelations: () => invoiceRelations,
	invoiceTransaction: () => invoiceTransaction,
	invoiceTransactionActivityLog: () => invoiceTransactionActivityLog,
	invoiceTransactionActivityLogRelations: () => invoiceTransactionActivityLogRelations,
	invoiceTransactionRelations: () => invoiceTransactionRelations,
	linkedInContentCalendar: () => linkedInContentCalendar,
	linkedInContentCalendarActivityLog: () => linkedInContentCalendarActivityLog,
	linkedInContentCalendarActivityLogRelations: () => linkedInContentCalendarActivityLogRelations,
	linkedInContentCalendarMedia: () => linkedInContentCalendarMedia,
	linkedInContentCalendarMediaRelations: () => linkedInContentCalendarMediaRelations,
	linkedInContentCalendarRelations: () => linkedInContentCalendarRelations,
	metaAdsAccount: () => metaAdsAccount,
	metaAdsAccountActivityLog: () => metaAdsAccountActivityLog,
	metaAdsAccountActivityLogRelations: () => metaAdsAccountActivityLogRelations,
	metaAdsAccountRelations: () => metaAdsAccountRelations,
	metaAdsAd: () => metaAdsAd,
	metaAdsAdActivityLog: () => metaAdsAdActivityLog,
	metaAdsAdActivityLogRelations: () => metaAdsAdActivityLogRelations,
	metaAdsAdRelations: () => metaAdsAdRelations,
	metaAdsAdSet: () => metaAdsAdSet,
	metaAdsAdSetActivityLog: () => metaAdsAdSetActivityLog,
	metaAdsAdSetActivityLogRelations: () => metaAdsAdSetActivityLogRelations,
	metaAdsAdSetRelations: () => metaAdsAdSetRelations,
	metaAdsCampaign: () => metaAdsCampaign,
	metaAdsCampaignActivityLog: () => metaAdsCampaignActivityLog,
	metaAdsCampaignActivityLogRelations: () => metaAdsCampaignActivityLogRelations,
	metaAdsCampaignRelations: () => metaAdsCampaignRelations,
	metaAdsInsight: () => metaAdsInsight,
	metaAdsInsightRelations: () => metaAdsInsightRelations,
	metaContentCalendar: () => metaContentCalendar,
	metaContentCalendarActivityLog: () => metaContentCalendarActivityLog,
	metaContentCalendarActivityLogRelations: () => metaContentCalendarActivityLogRelations,
	metaContentCalendarMedia: () => metaContentCalendarMedia,
	metaContentCalendarMediaRelations: () => metaContentCalendarMediaRelations,
	metaContentCalendarRelations: () => metaContentCalendarRelations,
	nameserver: () => nameserver,
	nameserverActivityLog: () => nameserverActivityLog,
	nameserverActivityLogRelations: () => nameserverActivityLogRelations,
	nameserverGroup: () => nameserverGroup,
	nameserverGroupActivityLog: () => nameserverGroupActivityLog,
	nameserverGroupActivityLogRelations: () => nameserverGroupActivityLogRelations,
	nameserverGroupRelations: () => nameserverGroupRelations,
	nameserverRelations: () => nameserverRelations,
	niscClientSubscription: () => niscClientSubscription,
	niscClientSubscriptionActivityLog: () => niscClientSubscriptionActivityLog,
	niscClientSubscriptionActivityLogRelations: () => niscClientSubscriptionActivityLogRelations,
	niscClientSubscriptionRelations: () => niscClientSubscriptionRelations,
	niscClientSubscriptionRenewal: () => niscClientSubscriptionRenewal,
	niscClientSubscriptionRenewalActivityLog: () => niscClientSubscriptionRenewalActivityLog,
	niscClientSubscriptionRenewalActivityLogRelations: () => niscClientSubscriptionRenewalActivityLogRelations,
	niscClientSubscriptionRenewalRelations: () => niscClientSubscriptionRenewalRelations,
	niscClientSubscriptionUsage: () => niscClientSubscriptionUsage,
	niscClientSubscriptionUsageActivityLog: () => niscClientSubscriptionUsageActivityLog,
	niscClientSubscriptionUsageActivityLogRelations: () => niscClientSubscriptionUsageActivityLogRelations,
	niscClientSubscriptionUsageRelations: () => niscClientSubscriptionUsageRelations,
	niscCommissionEntry: () => niscCommissionEntry,
	niscCommissionEntryRelations: () => niscCommissionEntryRelations,
	niscOrder: () => niscOrder,
	niscOrderItem: () => niscOrderItem,
	niscOrderItemRelations: () => niscOrderItemRelations,
	niscOrderProcessingLog: () => niscOrderProcessingLog,
	niscOrderProcessingLogRelations: () => niscOrderProcessingLogRelations,
	niscOrderRelations: () => niscOrderRelations,
	niscProduct: () => niscProduct,
	niscProductAddOn: () => niscProductAddOn,
	niscProductAddOnRelations: () => niscProductAddOnRelations,
	niscProductPlan: () => niscProductPlan,
	niscProductPlanRelations: () => niscProductPlanRelations,
	niscProductPlanUsage: () => niscProductPlanUsage,
	niscProductPlanUsageRelations: () => niscProductPlanUsageRelations,
	niscProductPromo: () => niscProductPromo,
	niscProductPromoRedeem: () => niscProductPromoRedeem,
	niscProductPromoRedeemRelations: () => niscProductPromoRedeemRelations,
	niscProductPromoRelations: () => niscProductPromoRelations,
	niscProductRelations: () => niscProductRelations,
	niscServicePlan: () => niscServicePlan,
	niscServicePlanActivityLog: () => niscServicePlanActivityLog,
	niscServicePlanActivityLogRelations: () => niscServicePlanActivityLogRelations,
	niscServicePlanRelations: () => niscServicePlanRelations,
	notification: () => notification,
	notificationActivityLog: () => notificationActivityLog,
	notificationActivityLogRelations: () => notificationActivityLogRelations,
	notificationRelations: () => notificationRelations,
	order: () => order,
	orderActivityLog: () => orderActivityLog,
	orderActivityLogRelations: () => orderActivityLogRelations,
	orderItem: () => orderItem,
	orderItemActivityLog: () => orderItemActivityLog,
	orderItemActivityLogRelations: () => orderItemActivityLogRelations,
	orderItemRelations: () => orderItemRelations,
	orderRelations: () => orderRelations,
	paymentTransaction: () => paymentTransaction,
	paymentTransactionActivityLog: () => paymentTransactionActivityLog,
	paymentTransactionActivityLogRelations: () => paymentTransactionActivityLogRelations,
	paymentTransactionRelations: () => paymentTransactionRelations,
	promo: () => promo,
	promoActivityLog: () => promoActivityLog,
	promoActivityLogRelations: () => promoActivityLogRelations,
	promoRelations: () => promoRelations,
	quotation: () => quotation,
	quotationActivityLog: () => quotationActivityLog,
	quotationActivityLogRelations: () => quotationActivityLogRelations,
	quotationCounter: () => quotationCounter,
	quotationLineItem: () => quotationLineItem,
	quotationLineItemRelations: () => quotationLineItemRelations,
	quotationRelations: () => quotationRelations,
	revenueByServiceSnapshot: () => revenueByServiceSnapshot,
	revenueByTeamSnapshot: () => revenueByTeamSnapshot,
	salesReportSnapshot: () => salesReportSnapshot,
	seoReport: () => seoReport,
	seoReportActivityLog: () => seoReportActivityLog,
	seoReportActivityLogRelations: () => seoReportActivityLogRelations,
	seoReportRelations: () => seoReportRelations,
	serviceSubscription: () => serviceSubscription,
	serviceSubscriptionActivityLog: () => serviceSubscriptionActivityLog,
	serviceSubscriptionActivityLogRelations: () => serviceSubscriptionActivityLogRelations,
	serviceSubscriptionRelations: () => serviceSubscriptionRelations,
	serviceSubscriptionRenewal: () => serviceSubscriptionRenewal,
	serviceSubscriptionRenewalActivityLog: () => serviceSubscriptionRenewalActivityLog,
	serviceSubscriptionRenewalActivityLogRelations: () => serviceSubscriptionRenewalActivityLogRelations,
	serviceSubscriptionRenewalRelations: () => serviceSubscriptionRenewalRelations,
	session: () => session,
	sessionRelations: () => sessionRelations,
	socialMediaIntegration: () => socialMediaIntegration,
	socialMediaIntegrationActivityLog: () => socialMediaIntegrationActivityLog,
	socialMediaIntegrationActivityLogRelations: () => socialMediaIntegrationActivityLogRelations,
	socialMediaIntegrationRelations: () => socialMediaIntegrationRelations,
	socialMediaPageToken: () => socialMediaPageToken,
	socialMediaPageTokenActivityLog: () => socialMediaPageTokenActivityLog,
	socialMediaPageTokenActivityLogRelations: () => socialMediaPageTokenActivityLogRelations,
	socialMediaPageTokenRelations: () => socialMediaPageTokenRelations,
	team: () => team,
	teamBillingSettings: () => teamBillingSettings,
	teamBillingSettingsActivityLog: () => teamBillingSettingsActivityLog,
	teamBillingSettingsActivityLogRelations: () => teamBillingSettingsActivityLogRelations,
	teamBillingSettingsRelations: () => teamBillingSettingsRelations,
	teamInvite: () => teamInvite,
	teamInviteRelations: () => teamInviteRelations,
	teamMember: () => teamMember,
	teamMemberRelations: () => teamMemberRelations,
	teamRelations: () => teamRelations,
	ticket: () => ticket,
	ticketActivityLog: () => ticketActivityLog,
	ticketActivityLogRelations: () => ticketActivityLogRelations,
	ticketAttachment: () => ticketAttachment,
	ticketAttachmentRelations: () => ticketAttachmentRelations,
	ticketMessage: () => ticketMessage,
	ticketMessageRelations: () => ticketMessageRelations,
	ticketRelations: () => ticketRelations,
	ticketTag: () => ticketTag,
	ticketTagRelation: () => ticketTagRelation,
	ticketTagRelationRelations: () => ticketTagRelationRelations,
	ticketTagRelations: () => ticketTagRelations,
	tldSettings: () => tldSettings,
	tldSettingsActivityLog: () => tldSettingsActivityLog,
	tldSettingsActivityLogRelations: () => tldSettingsActivityLogRelations,
	tldSettingsRelations: () => tldSettingsRelations,
	user: () => user,
	userActivityLog: () => userActivityLog,
	userActivityLogRelations: () => userActivityLogRelations,
	userProfile: () => userProfile,
	userProfileRelations: () => userProfileRelations,
	userRelations: () => userRelations,
	verification: () => verification,
	webDesignQuoteRequest: () => webDesignQuoteRequest,
	webDesignQuoteRequestRelations: () => webDesignQuoteRequestRelations,
	wordPressInstance: () => wordPressInstance,
	wordPressInstanceActivityLog: () => wordPressInstanceActivityLog,
	wordPressInstanceActivityLogRelations: () => wordPressInstanceActivityLogRelations,
	wordPressInstanceRelations: () => wordPressInstanceRelations
});

//#endregion
//#region ../../packages/db/src/index.ts
var src_exports = /* @__PURE__ */ __export({ db: () => db });
import * as import_drizzle_orm from "drizzle-orm";
__reExport(src_exports, import_drizzle_orm);
const db = drizzle(env.DATABASE_URL, { schema: schema_exports });

//#endregion
export { quotationActivityLog as $, ticket as $t, emailBuilderDesignActivityLog as A, domainActivityLog as At, socialMediaIntegrationActivityLog as B, userProfile as Bt, emailCampaign as C, agencyRolePermission as Cn, hostingSubscription as Ct, emailDomainActivityLog as D, wordPressInstance as Dt, emailDomain as E, niscServicePlanActivityLog as Et, linkedInContentCalendarMedia as F, tldSettings as Ft, serviceSubscriptionActivityLog as G, niscClientSubscriptionUsageActivityLog as Gt, socialMediaPageTokenActivityLog as H, niscClientSubscriptionActivityLog as Ht, metaContentCalendar as I, tldSettingsActivityLog as It, creativeProductionSnapshot as J, niscProductAddOn as Jt, seoReport as K, niscCommissionEntry as Kt, metaContentCalendarActivityLog as L, customerIntegration as Lt, domainTransferRequest as M, nameserver as Mt, linkedInContentCalendar as N, nameserverGroup as Nt, emailEvent as O, wordPressInstanceActivityLog as Ot, linkedInContentCalendarActivityLog as P, nameserverGroupActivityLog as Pt, quotation as Q, webDesignQuoteRequest as Qt, metaContentCalendarMedia as R, customerIntegrationActivityLog as Rt, emailAudienceContact as S, agencyRole as Sn, hostingPlan as St, emailCampaignSendJob as T, niscServicePlan as Tt, metaAdsAccount as U, niscClientSubscriptionRenewal as Ut, socialMediaPageToken as V, niscClientSubscription as Vt, serviceSubscription as W, niscClientSubscriptionUsage as Wt, revenueByTeamSnapshot as X, niscProductPlanUsage as Xt, revenueByServiceSnapshot as Y, niscProductPlan as Yt, salesReportSnapshot as Z, niscProductPromoRedeem as Zt, googleAdsIntegrationActivityLog as _, teamMember as _n, creativeAssetActivityLog as _t, imageGenProject as a, invoice as an, orderActivityLog as at, campaignRecipient as b, user as bn, creativeAssetVersion as bt, imageGenUploadActivityLog as c, invoiceLineItem as cn, notification as ct, imageGeneratorGeneration as d, aiChat as dn, niscOrderItem as dt, ticketActivityLog as en, quotationCounter as et, imageGeneratorGenerationActivityLog as f, aiChatMessage as fn, niscOrderProcessingLog as ft, googleAdsIntegration as g, teamInvite as gn, creativeAsset as gt, googleAdsAccountActivityLog as h, teamBillingSettingsActivityLog as hn, creativeBriefReferenceImage as ht, imageGenAiGenerationActivityLog as i, creditNoteActivityLog as in, order as it, emailBuilderLibrary as j, domainTransfer as jt, emailBuilderDesign as k, domain as kt, backgroundRemoverGeneration as l, invoiceTransaction as ln, notificationActivityLog as lt, googleAdsAccount as m, teamBillingSettings as mn, creativeBriefActivityLog as mt, src_exports as n, ticketMessage as nn, paymentTransaction as nt, imageGenTemplate as o, invoiceActivityLog as on, orderItem as ot, imageGeneratorVariation as p, team as pn, creativeBrief as pt, seoReportActivityLog as q, niscProduct as qt, imageGenAiGeneration as r, creditNote as rn, paymentTransactionActivityLog as rt, imageGenUpload as s, invoiceCounter as sn, orderItemActivityLog as st, db as t, ticketAttachment as tn, quotationLineItem as tt, backgroundRemoverGenerationActivityLog as u, invoiceTransactionActivityLog as un, niscOrder as ut, eTimsConfiguration as v, auth_exports as vn, creativeAssetComment as vt, emailCampaignActivityLog as w, env as wn, hostingSubscriptionActivityLog as wt, emailAudience as x, agencyPermission as xn, creativeAssetVersionActivityLog as xt, eTimsItem as y, session as yn, creativeAssetPermission as yt, socialMediaIntegration as z, userActivityLog as zt };