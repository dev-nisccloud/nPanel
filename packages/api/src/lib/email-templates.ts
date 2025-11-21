import { render } from '@react-email/render';
import { ResetPasswordEmail, PasswordResetSuccessEmail, WelcomeEmail, TeamInviteEmail, AccountCreatedEmail, AgencyUserCreatedEmail, InvoiceDeliveryEmail, OrderConfirmationEmail } from 'react-email-starter/emails';

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

export async function renderAccountCreatedEmail({
  userFirstname,
  email,
  password,
  loginLink,
}: {
  userFirstname: string;
  email: string;
  password: string;
  loginLink: string;
}) {
  return render(AccountCreatedEmail({
    userFirstname,
    email,
    password,
    loginLink,
  }));
}

export async function renderAgencyUserCreatedEmail({
  userFirstname,
  email,
  password,
  role,
  loginLink,
}: {
  userFirstname: string;
  email: string;
  password: string;
  role: string;
  loginLink: string;
}) {
  return render(AgencyUserCreatedEmail({
    userFirstname,
    email,
    password,
    role,
    loginLink,
  }));
}

export async function renderInvoiceDeliveryEmail({
  customerName,
  invoiceNumber,
  issueDate,
  dueDate,
  totalAmount,
  currency,
  services,
  supportEmail,
  supportPhone,
}: {
  customerName?: string;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount?: string;
  currency?: string;
  services?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    price?: string;
  }>;
  supportEmail?: string;
  supportPhone?: string;
}) {
  return render(InvoiceDeliveryEmail({
    customerName,
    invoiceNumber,
    issueDate,
    dueDate,
    totalAmount,
    currency,
    services,
    supportEmail,
    supportPhone,
  }));
}

export async function renderOrderConfirmationEmail({
  customerName,
  orderNumber,
  orderDate,
  totalAmount,
  currency,
  orderItems,
  supportEmail,
  supportPhone,
  orderLink,
}: {
  customerName?: string;
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: string;
  currency?: string;
  orderItems?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    price?: string;
    status?: string;
  }>;
  supportEmail?: string;
  supportPhone?: string;
  orderLink?: string;
}) {
  return render(OrderConfirmationEmail({
    customerName,
    orderNumber,
    orderDate,
    totalAmount,
    currency,
    orderItems,
    supportEmail,
    supportPhone,
    orderLink,
  }));
}
