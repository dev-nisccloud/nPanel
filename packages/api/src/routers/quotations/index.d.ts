import { type Context } from "../../trpc";
export declare const quotationsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            status?: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED" | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            quotations: {
                id: string;
                status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
                currency: string;
                createdAt: Date;
                updatedAt: Date;
                quotationNumber?: string | null | undefined;
                customerName?: string | null | undefined;
                customerEmail?: string | null | undefined;
                amount?: string | null | undefined;
                subtotal?: string | null | undefined;
            }[];
            total: number;
        };
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
            currency: string;
            createdAt: Date;
            updatedAt: Date;
            issueDate: Date | null;
            lineItems: {
                position: number;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | null | undefined;
                description?: string | null | undefined;
                quantity?: number | null | undefined;
                unit?: string | null | undefined;
                price?: string | null | undefined;
                discount?: string | null | undefined;
                total?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
            }[];
            quotationNumber?: string | null | undefined;
            customerName?: string | null | undefined;
            customerEmail?: string | null | undefined;
            amount?: string | null | undefined;
            subtotal?: string | null | undefined;
            tax?: string | null | undefined;
            taxPercentage?: number | null | undefined;
            vat?: string | null | undefined;
            discount?: string | null | undefined;
            note?: string | null | undefined;
            internalNote?: string | null | undefined;
            metadata?: Record<string, unknown> | unknown[] | null | undefined;
            activityLogs?: {
                id: string;
                userId: string;
                action: string;
                createdAt: Date;
                description?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
            }[] | undefined;
            fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
            customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
            noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
            template?: Record<string, unknown> | unknown[] | null | undefined;
            topBlock?: Record<string, unknown> | unknown[] | null | undefined;
            bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
        };
        meta: object;
    }>;
    getNextQuotationNumber: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            quotationNumber: string;
            nextNumber: number;
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            discount: unknown;
            note: unknown;
            internalNote: unknown;
            fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
            customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
            noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
            template?: Record<string, unknown> | unknown[] | null | undefined;
            topBlock?: Record<string, unknown> | unknown[] | null | undefined;
            bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            status?: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED" | undefined;
            token?: string | undefined;
            lineItems?: {
                id?: string | undefined;
                position?: number | undefined;
                name?: string | null | undefined;
                description?: string | null | undefined;
                quantity?: number | null | undefined;
                unit?: string | null | undefined;
                price?: string | null | undefined;
                discount?: string | null | undefined;
                total?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
            }[] | undefined;
            id?: string | undefined;
            quotationNumber?: string | null | undefined;
            customerName?: string | null | undefined;
            customerEmail?: string | null | undefined;
            amount?: string | null | undefined;
            subtotal?: string | null | undefined;
            tax?: string | null | undefined;
            taxPercentage?: number | null | undefined;
            vat?: string | null | undefined;
            currency?: string | undefined;
            issueDate?: unknown;
            metadata?: Record<string, unknown> | unknown[] | null | undefined;
            createdBy?: string | undefined;
            updatedBy?: string | null | undefined;
        };
        output: {
            id: string;
            status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
            currency: string;
            createdAt: Date;
            updatedAt: Date;
            issueDate: Date | null;
            lineItems: {
                position: number;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | null | undefined;
                description?: string | null | undefined;
                quantity?: number | null | undefined;
                unit?: string | null | undefined;
                price?: string | null | undefined;
                discount?: string | null | undefined;
                total?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
            }[];
            quotationNumber?: string | null | undefined;
            customerName?: string | null | undefined;
            customerEmail?: string | null | undefined;
            amount?: string | null | undefined;
            subtotal?: string | null | undefined;
            tax?: string | null | undefined;
            taxPercentage?: number | null | undefined;
            vat?: string | null | undefined;
            discount?: string | null | undefined;
            note?: string | null | undefined;
            internalNote?: string | null | undefined;
            metadata?: Record<string, unknown> | unknown[] | null | undefined;
            activityLogs?: {
                id: string;
                userId: string;
                action: string;
                createdAt: Date;
                description?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
            }[] | undefined;
            fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
            customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
            noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
            template?: Record<string, unknown> | unknown[] | null | undefined;
            topBlock?: Record<string, unknown> | unknown[] | null | undefined;
            bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            discount: unknown;
            note: unknown;
            internalNote: unknown;
            fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
            customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
            noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
            template?: Record<string, unknown> | unknown[] | null | undefined;
            topBlock?: Record<string, unknown> | unknown[] | null | undefined;
            bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
            lineItems?: {
                id?: string | undefined;
                position?: number | undefined;
                name?: string | null | undefined;
                description?: string | null | undefined;
                quantity?: number | null | undefined;
                unit?: string | null | undefined;
                price?: string | null | undefined;
                discount?: string | null | undefined;
                total?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
            }[] | undefined;
            quotationNumber?: string | null | undefined;
            customerName?: string | null | undefined;
            customerEmail?: string | null | undefined;
            token?: string | null | undefined;
            status?: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED" | undefined;
            amount?: string | null | undefined;
            subtotal?: string | null | undefined;
            tax?: string | null | undefined;
            taxPercentage?: number | null | undefined;
            vat?: string | null | undefined;
            currency?: string | undefined;
            issueDate?: unknown;
            metadata?: Record<string, unknown> | unknown[] | null | undefined;
            createdBy?: string | undefined;
            updatedBy?: string | null | undefined;
        };
        output: {
            id: string;
            status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
            currency: string;
            createdAt: Date;
            updatedAt: Date;
            issueDate: Date | null;
            lineItems: {
                position: number;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | null | undefined;
                description?: string | null | undefined;
                quantity?: number | null | undefined;
                unit?: string | null | undefined;
                price?: string | null | undefined;
                discount?: string | null | undefined;
                total?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
            }[];
            quotationNumber?: string | null | undefined;
            customerName?: string | null | undefined;
            customerEmail?: string | null | undefined;
            amount?: string | null | undefined;
            subtotal?: string | null | undefined;
            tax?: string | null | undefined;
            taxPercentage?: number | null | undefined;
            vat?: string | null | undefined;
            discount?: string | null | undefined;
            note?: string | null | undefined;
            internalNote?: string | null | undefined;
            metadata?: Record<string, unknown> | unknown[] | null | undefined;
            activityLogs?: {
                id: string;
                userId: string;
                action: string;
                createdAt: Date;
                description?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
            }[] | undefined;
            fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
            customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
            noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
            template?: Record<string, unknown> | unknown[] | null | undefined;
            topBlock?: Record<string, unknown> | unknown[] | null | undefined;
            bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
        };
        meta: object;
    }>;
    updateStatus: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
            note?: string | undefined;
        };
        output: {
            id: string;
            status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED" | "CANCELLED";
            currency: string;
            createdAt: Date;
            updatedAt: Date;
            issueDate: Date | null;
            lineItems: {
                position: number;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | null | undefined;
                description?: string | null | undefined;
                quantity?: number | null | undefined;
                unit?: string | null | undefined;
                price?: string | null | undefined;
                discount?: string | null | undefined;
                total?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
            }[];
            quotationNumber?: string | null | undefined;
            customerName?: string | null | undefined;
            customerEmail?: string | null | undefined;
            amount?: string | null | undefined;
            subtotal?: string | null | undefined;
            tax?: string | null | undefined;
            taxPercentage?: number | null | undefined;
            vat?: string | null | undefined;
            discount?: string | null | undefined;
            note?: string | null | undefined;
            internalNote?: string | null | undefined;
            metadata?: Record<string, unknown> | unknown[] | null | undefined;
            activityLogs?: {
                id: string;
                userId: string;
                action: string;
                createdAt: Date;
                description?: string | null | undefined;
                metadata?: Record<string, unknown> | unknown[] | null | undefined;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
            }[] | undefined;
            fromDetails?: Record<string, unknown> | unknown[] | null | undefined;
            customerDetails?: Record<string, unknown> | unknown[] | null | undefined;
            noteDetails?: Record<string, unknown> | unknown[] | null | undefined;
            template?: Record<string, unknown> | unknown[] | null | undefined;
            topBlock?: Record<string, unknown> | unknown[] | null | undefined;
            bottomBlock?: Record<string, unknown> | unknown[] | null | undefined;
        };
        meta: object;
    }>;
    deleteQuotation: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            quotationId: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    sendQuotationEmail: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            quotationId: string;
            toEmail: string;
            pdfBase64: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
}>>;
