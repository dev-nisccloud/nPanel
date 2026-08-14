export type ProcessNiscOrderResult = {
    ok: true;
    status: "COMPLETED" | "PARTIAL" | "PROCESSING";
    failureReason?: string;
} | {
    ok: false;
    status: "FAILED";
    failureReason: string;
};
export declare function processNiscOrder(niscOrderId: string): Promise<ProcessNiscOrderResult>;
