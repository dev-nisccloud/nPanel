import { renderEmailOtpEmail } from "react-email-starter/src/email-templates";
import { sendAuthEmail } from "./transactional-email";

export async function sendMfaEmailOtp(params: {
  userId: string;
  to: string;
  userFirstname: string;
  otpCode: string;
  expiresInMinutes: number;
}) {
  const html = await renderEmailOtpEmail({
    userFirstname: params.userFirstname,
    otpCode: params.otpCode,
    expiresInMinutes: params.expiresInMinutes,
  });

  await sendAuthEmail({
    to: params.to,
    subject: "Your nPanel verification code",
    html,
  });
}
