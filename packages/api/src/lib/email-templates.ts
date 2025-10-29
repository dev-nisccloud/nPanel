import { render } from '@react-email/render';
import { ResetPasswordEmail, PasswordResetSuccessEmail, WelcomeEmail, TeamInviteEmail } from '@nPanel/email/emails';

// Polyfill for WritableStream if not available (needed for React 19 + @react-email/render)
if (typeof (globalThis as any).WritableStream === 'undefined') {
  try {
    const { WritableStream } = require('node:stream/web');
    (globalThis as any).WritableStream = WritableStream;
  } catch (error) {
    console.warn('Could not load WritableStream polyfill:', error);
  }
}

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
