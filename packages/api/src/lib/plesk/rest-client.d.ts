export interface PleskRestResult {
    data: any | null;
    isAuthError: boolean;
    isHostUnreachable: boolean;
    statusCode: number;
}
export declare function sendPleskRestRequest(endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', body?: any): Promise<PleskRestResult>;
