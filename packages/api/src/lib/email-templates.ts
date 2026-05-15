import { render } from '@react-email/render';
import {
	ResetPasswordEmail,
	PasswordResetSuccessEmail,
	WelcomeEmail,
	TeamInviteEmail,
	AccountCreatedEmail,
	AgencyUserCreatedEmail,
	InvoiceDeliveryEmail,
	InvoiceSuccessEmail,
	QuotationDeliveryEmail,
	OrderConfirmationEmail,
	OrderReceivedEmail,
	OrderFailedEmail,
	NiscAdminOrderConfirmedEmail,
	PaymentReceiptEmail,
	CampaignCreatedEmail,
	CampaignCompletedEmail,
	CampaignScheduledEmail,
	CampaignCancelledEmail,
	ServiceRenewalReminderEmail,
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
  supportEmail,
  supportPhone,
}: {
  customerName?: string;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount?: string;
  currency?: string;
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
    supportEmail,
    supportPhone,
  }));
}

export async function renderInvoiceSuccessEmail({
  customerName,
  invoiceNumber,
  orderNumber,
  totalAmount,
  currency,
  supportEmail,
  supportPhone,
  invoiceLink,
}: {
  customerName?: string;
  invoiceNumber?: string;
  orderNumber?: string;
  totalAmount?: string;
  currency?: string;
  supportEmail?: string;
  supportPhone?: string;
  invoiceLink?: string;
}) {
  return render(InvoiceSuccessEmail({
    customerName,
    invoiceNumber,
    orderNumber,
    totalAmount,
    currency,
    supportEmail,
    supportPhone,
    invoiceLink,
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

export async function renderServiceRenewalReminderEmail({
  recipientName,
  serviceName,
  subscriptionName,
  subscriptionDate,
  expiryDate,
  gracePeriodText,
  supportEmail,
  supportPhone,
}: {
  recipientName?: string;
  serviceName?: string;
  subscriptionName?: string;
  subscriptionDate?: string;
  expiryDate?: string;
  gracePeriodText?: string;
  supportEmail?: string;
  supportPhone?: string;
}): Promise<string> {
  return render(
    ServiceRenewalReminderEmail({
      recipientName,
      serviceName,
      subscriptionName,
      subscriptionDate,
      expiryDate,
      gracePeriodText,
      supportEmail,
      supportPhone,
    })
  );
}

// --- Nisc order & OpenProvider verification ---

/** Super-admin email when QStash processing completes successfully (same layout family as OrderFailedEmail). */
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
	orderItems?: Array<{ name: string; description?: string; price?: string; status?: string }>;
	orderLink?: string;
}): Promise<string> {
	return render(
		NiscAdminOrderConfirmedEmail({
			customerName,
			orderNumber,
			orderDate,
			totalAmount,
			currency,
			orderItems,
			orderLink,
		}),
	);
}

/** "Order received" email   React template; sent when order is created from payment; user will get another email when processed. */
export async function renderNiscOrderReceivedEmail({
  customerName,
  orderNumber,
  orderDate,
  totalAmount,
  currency,
  orderItems,
}: {
  customerName?: string;
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: string;
  currency?: string;
  orderItems?: Array<{ name: string; description?: string; price?: string }>;
}): Promise<string> {
  return render(
    OrderReceivedEmail({
      customerName,
      orderNumber,
      orderDate,
      totalAmount,
      currency,
      orderItems: orderItems?.map((i) => ({
        name: i.name,
        description: i.description,
        price: i.price,
      })),
    }),
  );
}

/** Admin "order failed" email   React template; sent to super admins when a Nisc order fails or is partial. */
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
  return render(
    OrderFailedEmail({
      customerName,
      orderNumber,
      failedItems,
      failureReason,
      retryLink,
    }),
  );
}

export async function renderOpenProviderVerifyEmail({
  recipientName,
  domainName,
}: {
  recipientName?: string;
  domainName?: string;
}): Promise<string> {
  const placeholderImageUrl = "https://via.placeholder.com/120x60?text=Nisc";
  return `<div style="font-family:sans-serif;max-width:600px;">
  <p>Hi ${escapeHtml(recipientName ?? "Customer")},</p>
  <p>To complete your domain purchase for <strong>${escapeHtml(domainName ?? "")}</strong>, please verify your email address.</p>
  <p>OpenProvider has sent a verification email to this address. Click the link in that email to verify and complete your domain registration.</p>
  <p><img src="${placeholderImageUrl}" alt="Nisc" width="120" height="60" style="display:block;margin:1em 0;" /></p>
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
