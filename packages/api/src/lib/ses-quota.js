import { getSesClient } from "./ses-client";
export async function getSesSendQuotaSnapshot() {
    const ses = getSesClient();
    const res = await ses.getSendQuota({});
    const maxSendRate = res.MaxSendRate;
    const max24HourSend = res.Max24HourSend;
    const sentLast24Hours = res.SentLast24Hours;
    if (maxSendRate == null || max24HourSend == null || sentLast24Hours == null) {
        // Treat missing fields as a hard failure so we never operate with bogus quota.
        throw new Error("SES GetSendQuota returned incomplete fields");
    }
    return {
        maxSendRate,
        max24HourSend,
        sentLast24Hours,
    };
}
