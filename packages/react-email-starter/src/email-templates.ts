import { render } from "@react-email/render";
import {
  EmailOtpEmail,
  PasswordResetSuccessEmail,
  ResetPasswordEmail,
  TeamInviteEmail,
  WelcomeEmail,
} from "react-email-starter/emails";

export async function renderResetPasswordEmail({
  userFirstname,
  resetPasswordLink,
}: {
  userFirstname: string;
  resetPasswordLink: string;
}) {
  return render(ResetPasswordEmail({
    userFirstname,
    resetPasswordLink,
  }));
}

export async function renderPasswordResetSuccessEmail({
  userFirstname,
  loginLink,
}: {
  userFirstname: string;
  loginLink: string;
}) {
  return render(PasswordResetSuccessEmail({
    userFirstname,
    loginLink,
  }));
}

export async function renderEmailVerificationEmail({
  userFirstname,
  verificationLink,
}: {
  userFirstname: string;
  verificationLink: string;
}) {
  return render(WelcomeEmail({
    userFirstname,
    loginLink: verificationLink,
  }));
}

export async function renderTeamInviteEmail({
  invitedUserEmail,
  inviterName,
  teamName,
  teamRole,
  acceptInviteLink,
  expiresInDays,
}: {
  invitedUserEmail: string;
  inviterName: string;
  teamName: string;
  teamRole?: string;
  acceptInviteLink: string;
  expiresInDays?: number;
}) {
  return render(TeamInviteEmail({
    invitedUserEmail,
    inviterName,
    teamName,
    teamRole,
    acceptInviteLink,
    expiresInDays,
  }));
}

export async function renderEmailOtpEmail({
  userFirstname,
  otpCode,
  expiresInMinutes,
}: {
  userFirstname: string;
  otpCode: string;
  expiresInMinutes?: number;
}) {
  return render(
    EmailOtpEmail({
      userFirstname,
      otpCode,
      expiresInMinutes,
    }),
  );
}
