import { isUnderPrefix } from "./keys";

export type FolderCapability = "list" | "get" | "put" | "delete";

export type FolderGrant = {
	prefix: string;
	canList: boolean;
	canGet: boolean;
	canPut: boolean;
	canDelete: boolean;
};

const FIELD: Record<FolderCapability, keyof FolderGrant> = {
	list: "canList",
	get: "canGet",
	put: "canPut",
	delete: "canDelete",
};

export function grantAllows(
	grants: readonly FolderGrant[],
	capability: FolderCapability,
	objectKey: string,
): boolean {
	const key = objectKey.replace(/\/+$/, "");
	return grants.some((grant) => {
		if (grant[FIELD[capability]] !== true) return false;
		return isUnderPrefix(grant.prefix, key);
	});
}

/** `s3` lists that prefix. `synthetic` shows only the next folder the member was granted. */
export function listAccess(
	grants: readonly FolderGrant[],
	prefix: string,
): "s3" | "synthetic" | "none" {
	const folder = prefix.replace(/\/+$/, "");
	const listing = grants.filter((grant) => grant.canList);
	if (
		listing.some(
			(grant) =>
				grant.prefix === "" ||
				grant.prefix === folder ||
				(grant.prefix !== "" && folder.startsWith(`${grant.prefix}/`)),
		)
	) {
		return "s3";
	}
	if (
		listing.some((grant) =>
			folder === "" ? grant.prefix !== "" : grant.prefix.startsWith(`${folder}/`),
		)
	) {
		return "synthetic";
	}
	return "none";
}

export function syntheticFolders(grants: readonly FolderGrant[], prefix: string): string[] {
	const folder = prefix.replace(/\/+$/, "");
	const names = new Set<string>();
	for (const grant of grants) {
		if (!grant.canList || grant.prefix === "") continue;
		if (folder === "") {
			const segment = grant.prefix.split("/")[0];
			if (segment) names.add(segment);
			continue;
		}
		if (!grant.prefix.startsWith(`${folder}/`)) continue;
		const segment = grant.prefix.slice(folder.length + 1).split("/")[0];
		if (segment) names.add(`${folder}/${segment}`);
	}
	return [...names].sort();
}

export function capabilitiesAt(grants: readonly FolderGrant[], prefix: string): Omit<FolderGrant, "prefix"> {
	const folder = prefix.replace(/\/+$/, "");
	const matched = grants.filter((grant) => isUnderPrefix(grant.prefix, folder));
	return {
		canList: matched.some((grant) => grant.canList),
		canGet: matched.some((grant) => grant.canGet),
		canPut: matched.some((grant) => grant.canPut),
		canDelete: matched.some((grant) => grant.canDelete),
	};
}

export function grantCoversPrefix(grants: readonly FolderGrant[], prefix: string): boolean {
	return grants.some(
		(grant) =>
			(grant.canList || grant.canGet || grant.canPut || grant.canDelete) &&
			isUnderPrefix(grant.prefix, prefix.replace(/\/+$/, "")),
	);
}
