import { render } from '@react-email/render';
import {
	ResetPasswordEmail,
	PasswordResetSuccessEmail,
	WelcomeEmail,
	TeamInviteEmail,
	AccountCreatedEmail,
	AgencyUserCreatedEmail,
	InvoiceDeliveryEmail,
	QuotationDeliveryEmail,
	OrderConfirmationEmail,
	PaymentReceiptEmail,
	CampaignCreatedEmail,
	CampaignCompletedEmail,
	CampaignScheduledEmail,
	CampaignCancelledEmail,
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

export async function renderQuotationDeliveryEmail({
  customerName,
  quotationNumber,
  issueDate,
  totalAmount,
  currency,
  services,
  supportEmail,
  supportPhone,
}: {
  customerName?: string;
  quotationNumber?: string;
  issueDate?: string;
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
  return render(QuotationDeliveryEmail({
    customerName,
    quotationNumber,
    issueDate,
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

export async function renderPaymentReceiptEmail({
  customerName,
  receiptNumber,
  transactionDate,
  amount,
  currency,
  paymentMethod,
  supportEmail,
  supportPhone,
}: {
  customerName?: string;
  receiptNumber?: string;
  transactionDate?: string;
  amount?: string;
  currency?: string;
  paymentMethod?: string;
  supportEmail?: string;
  supportPhone?: string;
}) {
  return render(PaymentReceiptEmail({
    customerName,
    receiptNumber,
    transactionDate,
    amount,
    currency,
    paymentMethod,
    supportEmail,
    supportPhone,
  }));
}

export async function renderCampaignCreatedEmail({
  recipientName,
  campaignName,
  subject,
  recipientCount,
  viewCampaignLink,
}: {
  recipientName?: string;
  campaignName?: string;
  subject?: string;
  recipientCount?: number;
  viewCampaignLink?: string;
}) {
  return render(
    CampaignCreatedEmail({
      recipientName,
      campaignName,
      subject,
      recipientCount: recipientCount ?? 0,
      viewCampaignLink,
    })
  );
}

export async function renderCampaignCompletedEmail({
  recipientName,
  campaignName,
  subject,
  sentAt,
  totalRecipients,
  viewCampaignLink,
}: {
  recipientName?: string;
  campaignName?: string;
  subject?: string;
  sentAt?: string;
  totalRecipients?: number;
  viewCampaignLink?: string;
}) {
  return render(
    CampaignCompletedEmail({
      recipientName,
      campaignName,
      subject,
      sentAt,
      totalRecipients: totalRecipients ?? 0,
      viewCampaignLink,
    })
  );
}

export async function renderCampaignScheduledEmail({
  recipientName,
  campaignName,
  subject,
  scheduledAt,
  recipientCount,
  viewCampaignLink,
}: {
  recipientName?: string;
  campaignName?: string;
  subject?: string;
  scheduledAt?: string;
  recipientCount?: number;
  viewCampaignLink?: string;
}) {
  return render(
    CampaignScheduledEmail({
      recipientName,
      campaignName,
      subject,
      scheduledAt,
      recipientCount: recipientCount ?? 0,
      viewCampaignLink,
    })
  );
}

export async function renderCampaignCancelledEmail({
  recipientName,
  campaignName,
  subject,
  cancelledAt,
  viewCampaignLink,
}: {
  recipientName?: string;
  campaignName?: string;
  subject?: string;
  cancelledAt?: string;
  viewCampaignLink?: string;
}) {
  return render(
    CampaignCancelledEmail({
      recipientName,
      campaignName,
      subject,
      cancelledAt,
      viewCampaignLink,
    })
  );
}

// --- NISC order & OpenProvider verification (HTML, no React component) ---

export async function renderNiscOrderConfirmationEmail({
  customerName,
  orderNumber,
  orderDate,
  totalAmount,
  currency,
  orderItems,
  orderLink,
}: {
  customerName?: string;
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: string;
  currency?: string;
  orderItems?: Array<{ name: string; description?: string; price?: string }>;
  orderLink?: string;
}): Promise<string> {
  const itemsHtml =
    orderItems?.map(
      (i) =>
        `<tr><td>${escapeHtml(i.name)}</td><td>${i.description ? escapeHtml(i.description) : ""}</td><td>${i.price ?? ""} ${currency ?? ""}</td></tr>`
    ).join("") ?? "";
  return `<div style="font-family:sans-serif;max-width:600px;">
  <h2>Order confirmed</h2>
  <p>Hi ${escapeHtml(customerName ?? "Customer")},</p>
  <p>Your NISC service order has been processed successfully.</p>
  <p><strong>Order number:</strong> ${escapeHtml(orderNumber ?? "")}</p>
  <p><strong>Date:</strong> ${orderDate ?? ""}</p>
  <table style="border-collapse:collapse;width:100%;"><thead><tr><th style="text-align:left;">Item</th><th style="text-align:left;">Details</th><th style="text-align:right;">Price</th></tr></thead><tbody>${itemsHtml}</tbody></table>
  <p><strong>Total:</strong> ${totalAmount ?? ""} ${currency ?? "KES"}</p>
  ${orderLink ? `<p><a href="${escapeHtml(orderLink)}">View order</a></p>` : ""}
  <p>Thank you for your business.</p>
</div>`;
}

export async function renderNiscOrderFailedEmail({
  customerName,
  orderNumber,
  failedItems,
  failureReason,
  retryLink,
}: {
  customerName?: string;
  orderNumber?: string;
  failedItems?: Array<{ name: string; error?: string }>;
  failureReason?: string;
  retryLink?: string;
}): Promise<string> {
  const itemsHtml =
    failedItems?.map(
      (i) => `<li>${escapeHtml(i.name)}${i.error ? `: ${escapeHtml(i.error)}` : ""}</li>`
    ).join("") ?? "";
  return `<div style="font-family:sans-serif;max-width:600px;">
  <h2>Order could not be completed</h2>
  <p>Hi ${escapeHtml(customerName ?? "Customer")},</p>
  <p>Your NISC service order could not be fully processed.</p>
  <p><strong>Order number:</strong> ${escapeHtml(orderNumber ?? "")}</p>
  ${failureReason ? `<p><strong>Reason:</strong> ${escapeHtml(failureReason)}</p>` : ""}
  ${itemsHtml ? `<ul>${itemsHtml}</ul>` : ""}
  ${retryLink ? `<p>You can retry from the <a href="${escapeHtml(retryLink)}">NISC Service Orders</a> page.</p>` : "<p>You can retry from the NISC Service Orders page.</p>"}
  <p>If you need help, please contact support.</p>
</div>`;
}

export async function renderOpenProviderVerifyEmail({
  recipientName,
  domainName,
}: {
  recipientName?: string;
  domainName?: string;
}): Promise<string> {
  const placeholderImageUrl = "https://via.placeholder.com/120x60?text=NISC";
  return `<div style="font-family:sans-serif;max-width:600px;">
  <p>Hi ${escapeHtml(recipientName ?? "Customer")},</p>
  <p>To complete your domain purchase for <strong>${escapeHtml(domainName ?? "")}</strong>, please verify your email address.</p>
  <p>OpenProvider has sent a verification email to this address. Click the link in that email to verify and complete your domain registration.</p>
  <p><img src="${placeholderImageUrl}" alt="NISC" width="120" height="60" style="display:block;margin:1em 0;" /></p>
  <p>If you did not request this, you can ignore this message.</p>
</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
