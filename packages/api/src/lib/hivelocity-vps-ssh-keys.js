/**
 * Hivelocity account SSH keys and VPS key deployment.
 * @see https://developers.hivelocity.net/docs/ssh-keys
 * @see https://developers.hivelocity.net/docs/vps-device-management
 * @see https://developers.hivelocity.net/reference/get_vps_current_product_resource
 *
 * Account keys: GET/POST/DELETE `/ssh_key/`
 * VPS deploy: PUT `/vps/{deviceId}` with `sshKeyIds` + VPS catalog `productId` from `/vps/{deviceId}/current-product`
 */
import { TRPCError } from "@trpc/server";
import { hivelocityRequest } from "./hivelocity-client";
import { assertVpsPoweredOffForUpgrade } from "./hivelocity-vps-upgrade";
function normalizeSshKey(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const row = raw;
    const sshKeyId = Number(row.sshKeyId);
    if (!Number.isFinite(sshKeyId))
        return null;
    const name = String(row.name ?? "").trim();
    const publicKey = String(row.publicKey ?? "").trim();
    if (!name || !publicKey)
        return null;
    return { sshKeyId, name, publicKey };
}
export function normalizeSshKeyList(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.map(normalizeSshKey).filter((k) => k != null);
}
const SSH_PUBLIC_KEY_PREFIX = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521|ssh-dss)\s+/;
export function assertValidSshPublicKey(publicKey) {
    const trimmed = publicKey.trim();
    if (!trimmed) {
        throw new Error("Public key is required.");
    }
    if (!SSH_PUBLIC_KEY_PREFIX.test(trimmed)) {
        throw new Error("Public key must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2-nistp256.");
    }
}
export async function listHivelocitySshKeys() {
    const raw = await hivelocityRequest("/ssh_key/", { requireApiKey: true });
    return normalizeSshKeyList(raw);
}
export async function createHivelocitySshKey(name, publicKey) {
    const trimmedName = name.trim();
    const trimmedKey = publicKey.trim();
    if (!trimmedName)
        throw new Error("Key name is required.");
    assertValidSshPublicKey(trimmedKey);
    const raw = await hivelocityRequest("/ssh_key/", {
        method: "POST",
        body: { name: trimmedName, publicKey: trimmedKey },
        requireApiKey: true,
    });
    const created = normalizeSshKey(raw);
    if (!created)
        throw new Error("SSH key was created but the response was invalid.");
    return created;
}
export async function deleteHivelocitySshKey(sshKeyId) {
    await hivelocityRequest(`/ssh_key/${sshKeyId}`, {
        method: "DELETE",
        requireApiKey: true,
    });
}
function extractErrorMessage(err) {
    if (err instanceof TRPCError)
        return err.message;
    if (err instanceof Error)
        return err.message;
    return String(err);
}
function pickPositiveInt(...values) {
    for (const value of values) {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0)
            return n;
    }
    return null;
}
/** VPS catalog product for PUT /vps/{deviceId} — not the generic /device/ productId. */
export async function resolveVpsCurrentProductId(deviceId) {
    const current = await hivelocityRequest(`/vps/${deviceId}/current-product`, {
        requireApiKey: true,
    });
    const productId = pickPositiveInt(current.productId);
    if (productId)
        return productId;
    throw new Error("Could not resolve the VPS product for this instance.");
}
function buildSshKeysCloudInit(publicKeys) {
    const lines = publicKeys.map((key) => `  - ${key.trim()}`);
    return `#cloud-config\nssh_authorized_keys:\n${lines.join("\n")}\n`;
}
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
/** Run over an existing SSH session (Terminal tab) when provider PUT deploy is unavailable. */
export function buildAuthorizedKeysInstallScript(publicKeys) {
    const unique = [...new Set(publicKeys.map((k) => k.trim()).filter(Boolean))];
    if (!unique.length)
        return "";
    const lines = [
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh",
        "touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys",
        ...unique.map((key) => `grep -qxF ${shellQuote(key)} ~/.ssh/authorized_keys || echo ${shellQuote(key)} >> ~/.ssh/authorized_keys`),
    ];
    return lines.join("\n");
}
async function resolvePublicKeysForIds(sshKeyIds) {
    const accountKeys = await listHivelocitySshKeys();
    const byId = new Map(accountKeys.map((key) => [key.sshKeyId, key.publicKey]));
    const keys = sshKeyIds.map((id) => byId.get(id)?.trim()).filter((key) => Boolean(key));
    if (keys.length !== sshKeyIds.length) {
        throw new Error("One or more selected SSH keys could not be found on your account.");
    }
    return keys;
}
async function putVpsUpdate(deviceId, body) {
    return hivelocityRequest(`/vps/${deviceId}`, {
        method: "PUT",
        body,
        requireApiKey: true,
    });
}
function isProductResolutionError(message) {
    const m = message.toLowerCase();
    return m.includes("could not find product") || m.includes("find product");
}
function isSpecsAlreadyMatchError(message) {
    return message.toLowerCase().includes("specs already match");
}
export async function updateVpsDeployedSshKeys(deviceId, sshKeyIds) {
    await assertVpsPoweredOffForUpgrade(deviceId);
    if (!sshKeyIds.length) {
        throw new Error("Select at least one SSH key to deploy.");
    }
    const [productId, publicKeys, vpsDetails] = await Promise.all([
        resolveVpsCurrentProductId(deviceId),
        resolvePublicKeysForIds(sshKeyIds),
        hivelocityRequest(`/vps/${deviceId}`, { requireApiKey: true }).catch(() => ({})),
    ]);
    const existingCloudInit = typeof vpsDetails.cloudInit === "string" && vpsDetails.cloudInit.trim() ? vpsDetails.cloudInit : undefined;
    const keysCloudInit = buildSshKeysCloudInit(publicKeys);
    const payloads = [
        { sshKeyIds, productId, cloudInit: keysCloudInit },
        { sshKeyIds, productId, ...(existingCloudInit ? { cloudInit: existingCloudInit } : {}) },
        { sshKeyIds, productId },
    ];
    let lastError;
    for (const body of payloads) {
        try {
            return await putVpsUpdate(deviceId, body);
        }
        catch (err) {
            lastError = err;
            const message = extractErrorMessage(err);
            if (isSpecsAlreadyMatchError(message) || isProductResolutionError(message))
                continue;
            throw err;
        }
    }
    const manualScript = buildAuthorizedKeysInstallScript(publicKeys);
    throw new Error(`Provider API could not deploy SSH keys to this VPS (${extractErrorMessage(lastError)}). ` +
        `Add keys manually after logging in via the Terminal tab:\n${manualScript}`);
}
export function fingerprintSshPublicKey(publicKey) {
    const parts = publicKey.trim().split(/\s+/);
    if (parts.length < 2)
        return publicKey.slice(0, 24);
    const blob = parts[1] ?? "";
    if (blob.length <= 16)
        return blob;
    return `${blob.slice(0, 8)}…${blob.slice(-8)}`;
}
