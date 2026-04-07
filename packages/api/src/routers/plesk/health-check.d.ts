/**
 * Plesk Health Check Router
 * Tests connectivity to Plesk XML and REST APIs without making actual requests
 */
export declare const pleskHealthCheckRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Test Plesk XML API connection
     * Makes a minimal request to verify connectivity and authentication
     */
    testXmlConnection: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            status: string;
            message: string;
            details: {
                has_xml_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                response_time_ms?: undefined;
                is_host_unreachable?: undefined;
                is_auth_error?: undefined;
                parse_error?: undefined;
                raw_xml?: undefined;
                error_code?: undefined;
                error_text?: undefined;
                raw_response?: undefined;
                server_info?: undefined;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                has_xml_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                response_time_ms: number;
                is_host_unreachable: boolean;
                is_auth_error: boolean;
                parse_error?: undefined;
                raw_xml?: undefined;
                error_code?: undefined;
                error_text?: undefined;
                raw_response?: undefined;
                server_info?: undefined;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                has_xml_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                response_time_ms: number;
                is_host_unreachable: boolean;
                is_auth_error: boolean;
                parse_error: string;
                raw_xml: string;
                error_code?: undefined;
                error_text?: undefined;
                raw_response?: undefined;
                server_info?: undefined;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                has_xml_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                error_code: any;
                error_text: any;
                response_time_ms: number;
                is_host_unreachable: boolean;
                is_auth_error: boolean;
                raw_response: any;
                parse_error?: undefined;
                raw_xml?: undefined;
                server_info?: undefined;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                has_xml_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                response_time_ms: number;
                is_host_unreachable: boolean;
                is_auth_error: boolean;
                server_info: any;
                raw_response: any;
                parse_error?: undefined;
                raw_xml?: undefined;
                error_code?: undefined;
                error_text?: undefined;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                error: string;
                error_type: string;
                has_xml_endpoint?: undefined;
                has_secret_key?: undefined;
                has_username?: undefined;
                has_password?: undefined;
                response_time_ms?: undefined;
                is_host_unreachable?: undefined;
                is_auth_error?: undefined;
                parse_error?: undefined;
                raw_xml?: undefined;
                error_code?: undefined;
                error_text?: undefined;
                raw_response?: undefined;
                server_info?: undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Test Plesk REST API connection
     * Makes a minimal request to verify connectivity and authentication
     */
    testRestConnection: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            status: string;
            message: string;
            details: {
                has_rest_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                response_time_ms?: undefined;
                is_host_unreachable?: undefined;
                is_auth_error?: undefined;
                status_code?: undefined;
                response_data?: undefined;
                note?: undefined;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                has_rest_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                response_time_ms: number;
                is_host_unreachable: boolean;
                is_auth_error: boolean;
                status_code: number;
                response_data?: undefined;
                note?: undefined;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                has_rest_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                response_time_ms: number;
                is_host_unreachable: false;
                is_auth_error: false;
                status_code: number;
                response_data: any;
                note?: undefined;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                has_rest_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
                response_time_ms: number;
                is_host_unreachable: boolean;
                is_auth_error: boolean;
                status_code: number;
                note: string;
                response_data: any;
                error?: undefined;
                error_type?: undefined;
            };
        } | {
            status: string;
            message: string;
            details: {
                error: string;
                error_type: string;
                has_rest_endpoint?: undefined;
                has_secret_key?: undefined;
                has_username?: undefined;
                has_password?: undefined;
                response_time_ms?: undefined;
                is_host_unreachable?: undefined;
                is_auth_error?: undefined;
                status_code?: undefined;
                response_data?: undefined;
                note?: undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Test both XML and REST API connections
     * Comprehensive health check for Plesk integration
     */
    testAll: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            status: string;
            message: string;
            timestamp: string;
            xml_api: {
                status: string;
                message: string;
                response_time_ms: number;
                error_code?: undefined;
                server_info?: undefined;
            } | {
                status: string;
                message: string;
                error_code: any;
                response_time_ms: number;
                server_info?: undefined;
            } | {
                status: string;
                message: string;
                response_time_ms: number;
                server_info: any;
                error_code?: undefined;
            } | {
                status: string;
                message: any;
            };
            rest_api: {
                status: string;
                message: string;
                response_time_ms: number;
                status_code?: undefined;
            } | {
                status: string;
                message: string;
                status_code: number;
                response_time_ms: number;
            } | {
                status: string;
                message: any;
            };
            environment: {
                has_xml_endpoint: boolean;
                has_rest_endpoint: boolean;
                has_secret_key: boolean;
                has_username: boolean;
                has_password: boolean;
            };
        };
        meta: object;
    }>;
}>>;
