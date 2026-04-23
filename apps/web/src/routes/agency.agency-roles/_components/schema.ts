import { z } from "zod";
import { agencysidebarItems } from "@/navigation/sidebar/sidebar-items";

// UI-layer enums and schemas – independent from API and DB.
// Sidebar keys are derived from agency sidebar config so role access
// options stay in sync with navigation changes.

function getAgencyMenuKeysFromSidebar(): string[] {
	const keySet = new Set<string>();

	for (const group of agencysidebarItems) {
		for (const item of group.items) {
			if (item.url.startsWith("/agency/")) {
				keySet.add(item.url);
			}
			for (const subItem of item.subItems ?? []) {
				if (subItem.url.startsWith("/agency/")) {
					keySet.add(subItem.url);
				}
			}
		}
	}

	return Array.from(keySet);
}

export const agencyMenuKeysUi = getAgencyMenuKeysFromSidebar();

export const agencyRoleUiSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	menus: z.array(z.string()),
	isSystem: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type AgencyRoleUi = z.infer<typeof agencyRoleUiSchema>;

export const agencyPermissionUiSchema = z.object({
	id: z.string(),
	key: z.string(),
	description: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type AgencyPermissionUi = z.infer<typeof agencyPermissionUiSchema>;

export const agencyRoleWithPermissionsUiSchema = agencyRoleUiSchema.extend({
	permissionKeys: z.array(z.string()),
	menus: z.array(z.string()),
});

export type AgencyRoleWithPermissionsUi = z.infer<typeof agencyRoleWithPermissionsUiSchema>;

export const createRoleFormSchema = z.object({
	name: z.string().min(2, "Role name is required").max(80),
	description: z.string().max(400).optional(),
	permissionKeys: z.array(z.string()).default([]),
	menus: z.array(z.string()).default([]),
});

export type CreateRoleFormData = z.infer<typeof createRoleFormSchema>;

