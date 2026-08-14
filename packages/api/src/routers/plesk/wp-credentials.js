import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { protectedProcedure, router } from '../../trpc';
const emptyToUndefined = (value) => {
    if (typeof value !== "string")
        return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
};
function asRecord(data) {
    if (!data || typeof data !== "object")
        return null;
    return data;
}
function parseAccountData(data) {
    const record = asRecord(data);
    if (!record)
        return null;
    const availableLogins = Array.isArray(record.availableLogins)
        ? record.availableLogins.flatMap((item) => {
            const loginRecord = asRecord(item);
            if (!loginRecord || typeof loginRecord.login !== "string")
                return [];
            return [
                {
                    login: loginRecord.login,
                    title: typeof loginRecord.title === "string" ? loginRecord.title : loginRecord.login,
                },
            ];
        })
        : undefined;
    return {
        loginUrl: typeof record.loginUrl === "string" ? record.loginUrl : undefined,
        currentLogin: typeof record.currentLogin === "string" ? record.currentLogin : undefined,
        currentPassword: typeof record.currentPassword === "string" ? record.currentPassword : undefined,
        currentEmail: typeof record.currentEmail === "string" ? record.currentEmail : undefined,
        currentLanguage: typeof record.currentLanguage === "string" ? record.currentLanguage : undefined,
        availableLogins,
    };
}
function buildCredentialsFromAccount(accountRaw) {
    const account = parseAccountData(accountRaw);
    if (!account)
        return {};
    const login = extractNonEmptyPassword(account.currentLogin, account.availableLogins?.[0]?.login);
    const password = extractNonEmptyPassword(account.currentPassword);
    return {
        loginUrl: account.loginUrl,
        credentials: login || password ? { login, password } : undefined,
    };
}
function parseCredentialsData(data) {
    const record = asRecord(data);
    if (!record)
        return null;
    const nested = asRecord(record.credentials);
    return {
        loginUrl: typeof record.loginUrl === "string" ? record.loginUrl : undefined,
        credentials: nested
            ? {
                login: typeof nested.login === "string" ? nested.login : undefined,
                password: typeof nested.password === "string" ? nested.password : undefined,
            }
            : undefined,
    };
}
function extractNonEmptyPassword(...candidates) {
    for (const candidate of candidates) {
        if (typeof candidate === "string") {
            const trimmed = candidate.trim();
            if (trimmed.length > 0)
                return trimmed;
        }
    }
    return undefined;
}
async function getWpCredentials(installationId) {
    const endpoint = `/v1/installations/${installationId}/credentials`;
    const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'GET');
    if (isHostUnreachable)
        throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
    if (isAuthError)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
    if (statusCode === 404) {
        const accountRaw = await getWpAccountSettings(installationId);
        return buildCredentialsFromAccount(accountRaw);
    }
    if (statusCode < 200 || statusCode >= 300 || !data)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
    return data;
}
async function getWpAccountSettings(installationId) {
    const endpoint = `/v1/installations/${installationId}/account`;
    const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'GET');
    if (isHostUnreachable)
        throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
    if (isAuthError)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
    if (statusCode === 404)
        throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
    if (statusCode < 200 || statusCode >= 300 || !data)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
    return data;
}
function formatFormErrors(formErrors) {
    if (!formErrors || typeof formErrors !== 'object')
        return 'Validation failed';
    const messages = [];
    for (const [field, errors] of Object.entries(formErrors)) {
        if (errors && typeof errors === 'object') {
            for (const msg of Object.values(errors)) {
                if (typeof msg === 'string')
                    messages.push(`${field}: ${msg}`);
            }
        }
    }
    return messages.length > 0 ? messages.join('; ') : 'Validation failed';
}
/**
 * WP Toolkit account PATCH expects a complete payload (login, password, email, language).
 * Partial bodies are treated as empty required fields.
 */
async function updateWpAccountSettings(installationId, changes) {
    const [accountRaw, credentialsRaw] = await Promise.all([
        getWpAccountSettings(installationId),
        getWpCredentials(installationId),
    ]);
    const account = parseAccountData(accountRaw);
    const credentials = parseCredentialsData(credentialsRaw);
    const login = changes.login ??
        account?.currentLogin ??
        credentials?.credentials?.login;
    const email = changes.email ?? account?.currentEmail;
    const language = changes.language ?? account?.currentLanguage;
    const password = extractNonEmptyPassword(changes.password, changes.retainPassword, account?.currentPassword, credentials?.credentials?.password);
    if (!login?.trim()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Administrator login is required.' });
    }
    if (!email?.trim()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email is required.' });
    }
    if (!language?.trim()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Language is required.' });
    }
    if (!password) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Could not resolve the current WordPress password. Generate a new password or reload the page and try again.',
        });
    }
    const patchBody = {
        login: login.trim(),
        password,
        email: email.trim(),
        language: language.trim(),
    };
    const endpoint = `/v1/installations/${installationId}/account`;
    const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'PATCH', patchBody);
    if (isHostUnreachable)
        throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
    if (isAuthError)
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
    if (statusCode === 404)
        throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
    if (statusCode === 422) {
        const record = data && typeof data === 'object' ? data : {};
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: formatFormErrors(record.formErrors),
        });
    }
    if (statusCode < 200 || statusCode >= 300 || !data) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
    }
    return data;
}
const updateAccountInputSchema = z
    .object({
    installationId: z.number(),
    login: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    password: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    retainPassword: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    email: z.preprocess(emptyToUndefined, z.string().email().optional()),
    language: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
})
    .refine((value) => value.login || value.password || value.email || value.language, { message: 'At least one field must be provided to update account settings' });
export const wpCredentialsRouter = router({
    get: protectedProcedure
        .input(z.object({ installationId: z.number() }))
        .query(async ({ input }) => {
        const data = await getWpCredentials(input.installationId);
        return { data };
    }),
    getAccount: protectedProcedure
        .input(z.object({ installationId: z.number() }))
        .query(async ({ input }) => {
        const data = await getWpAccountSettings(input.installationId);
        return { data };
    }),
    updateAccount: protectedProcedure
        .input(updateAccountInputSchema)
        .mutation(async ({ input }) => {
        const { installationId, login, password, retainPassword, email, language } = input;
        const data = await updateWpAccountSettings(installationId, {
            login,
            password,
            retainPassword,
            email,
            language,
        });
        return { data };
    }),
});
