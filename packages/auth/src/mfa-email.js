import { renderEmailOtpEmail } from "react-email-starter/src/email-templates";
import { sendTransactionalEmail } from "./transactional-email";
export async function sendMfaEmailOtp(params) {
    const html = await renderEmailOtpEmail({
        userFirstname: params.userFirstname,
        otpCode: params.otpCode,
        expiresInMinutes: params.expiresInMinutes,
    });
    await sendTransactionalEmail({
        userId: params.userId,
        to: params.to,
        subject: "Your nPanel verification code",
        html,
    });
}
