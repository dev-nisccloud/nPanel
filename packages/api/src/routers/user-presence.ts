import { TRPCError } from "@trpc/server";
import { and, eq, gt, inArray, isNotNull, isNull, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { session, user } from "@npanel/db/schema/auth";
import { protectedProcedure, router } from "../trpc";

/** A tab counts as online when its session was refreshed inside this window. */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const RECENT_LOGIN_LIMIT = 40;

async function assertAgencySuperAdmin(userId: string): Promise<void> {
	const [row] = await db
		.select({ role: user.role })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!row) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
	}
	if (!row.role.includes("AGENCY")) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only Nisc HQ staff can see who is signed in.",
		});
	}
}

type PresencePerson = {
	id: string;
	name: string;
	email: string;
	role: string;
	lastLoginAt: string | null;
	lastActiveAt: string | null;
	isOnline: boolean;
};

export const userPresenceRouter = router({
	/**
	 * Who has nPanel open, plus the most recent sign-ins.
	 * "Online" is a live session touched in the last 5 minutes.
	 * Impersonation sessions are ignored so a customer does not look online
	 * while a super admin is signed in as them.
	 */
	snapshot: protectedProcedure.query(async ({ ctx }) => {
		await assertAgencySuperAdmin(ctx.session.user.id);

		const now = new Date();
		const cutoff = now.getTime() - ONLINE_WINDOW_MS;

		const liveSessions = await db
			.select({
				userId: session.userId,
				updatedAt: session.updatedAt,
			})
			.from(session)
			.where(and(gt(session.expiresAt, now), isNull(session.impersonatedBy)));

		const activity = new Map<string, { lastActiveAt: Date; isOnline: boolean }>();
		for (const row of liveSessions) {
			const current = activity.get(row.userId);
			const isOnline = row.updatedAt.getTime() >= cutoff;
			if (!current) {
				activity.set(row.userId, { lastActiveAt: row.updatedAt, isOnline });
				continue;
			}
			if (row.updatedAt > current.lastActiveAt) current.lastActiveAt = row.updatedAt;
			if (isOnline) current.isOnline = true;
		}

		const recent = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				lastLoginAt: user.lastLoginAt,
			})
			.from(user)
			.where(isNotNull(user.lastLoginAt))
			.orderBy(sql`${user.lastLoginAt} desc nulls last`)
			.limit(RECENT_LOGIN_LIMIT);

		const sessionUserIds = [...activity.keys()];
		const known = new Set(recent.map((row) => row.id));
		const missingIds = sessionUserIds.filter((id) => !known.has(id));
		const extra =
			missingIds.length === 0
				? []
				: await db
						.select({
							id: user.id,
							name: user.name,
							email: user.email,
							role: user.role,
							lastLoginAt: user.lastLoginAt,
						})
						.from(user)
						.where(inArray(user.id, missingIds));

		const people: PresencePerson[] = [...recent, ...extra].map((row) => {
			const live = activity.get(row.id);
			return {
				id: row.id,
				name: row.name,
				email: row.email,
				role: row.role,
				lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
				lastActiveAt: live ? live.lastActiveAt.toISOString() : null,
				isOnline: live?.isOnline ?? false,
			};
		});

		people.sort((a, b) => {
			if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
			const aTime = a.lastActiveAt ?? a.lastLoginAt ?? "";
			const bTime = b.lastActiveAt ?? b.lastLoginAt ?? "";
			return bTime.localeCompare(aTime);
		});

		return {
			checkedAt: now.toISOString(),
			onlineWindowMinutes: ONLINE_WINDOW_MS / 60_000,
			onlineCount: people.filter((person) => person.isOnline).length,
			people,
		};
	}),
});
