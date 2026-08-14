export type PleskDatabaseType = "mysql" | "postgresql" | "mssql" | string;
export interface PleskDatabase {
    id: number;
    name: string;
    type: PleskDatabaseType;
    status?: string;
    webspaceId?: number;
    dbServerId?: number;
}
export interface PleskDatabaseUser {
    id: number;
    login: string;
    dbId?: number;
}
export declare function getSharedHostingDbHost(): string;
export declare function portForDatabaseType(type: string | undefined): number;
export declare function isMysqlFamily(type: string | undefined): boolean;
export declare function generateDatabasePassword(): string;
export declare function fetchPleskDatabasesBySiteId(siteId: number): Promise<PleskDatabase[]>;
export declare function fetchPleskDatabaseById(siteId: number, databaseId: number): Promise<PleskDatabase>;
export declare function fetchPleskDatabaseUsers(databaseId: number): Promise<PleskDatabaseUser[]>;
export declare function fetchPleskDefaultUserId(databaseId: number): Promise<number | null>;
export declare function addPleskDatabaseUser(params: {
    databaseId: number;
    login: string;
    password: string;
}): Promise<number>;
export declare function setPleskDefaultDatabaseUser(databaseId: number, userId: number): Promise<void>;
export declare function setPleskDatabaseUser(params: {
    userId: number;
    password?: string;
    passwordType?: "plain" | "crypt";
    role?: "readWrite" | "readOnly" | "writeOnly";
    acl?: string[];
    allowAccessFrom?: string[];
}): Promise<{
    xml: string;
    parsed: Record<string, unknown>;
}>;
export declare function getPleskDatabaseConnectionInfo(params: {
    siteId: number;
    databaseId: number;
}): Promise<{
    databaseId: number;
    name: string;
    type: string;
    localHost: string;
    remoteHost: string;
    port: number;
    users: {
        id: number;
        login: string;
    }[];
    defaultUserId: number | null;
    defaultUserLogin: string | null;
}>;
