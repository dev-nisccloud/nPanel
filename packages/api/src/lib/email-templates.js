import { render } from '@react-email/render';
import { ResetPasswordEmail, PasswordResetSuccessEmail, WelcomeEmail, TeamInviteEmail, AccountCreatedEmail, AgencyUserCreatedEmail, InvoiceDeliveryEmail, InvoiceSuccessEmail, QuotationDeliveryEmail, OrderConfirmationEmail, OrderReceivedEmail, OrderFailedEmail, NiscAdminOrderConfirmedEmail, PaymentReceiptEmail, CampaignCreatedEmail, CampaignCompletedEmail, CampaignScheduledEmail, CampaignCancelledEmail, ServiceRenewalReminderEmail, } from "react-email-starter/emails";
export async function renderResetPasswordEmail({ userFirstname, resetPasswordLink, }) {
    return render(ResetPasswordEmail({
        userFirstname,
        resetPasswordLink,
    }));
}
export async function renderPasswordResetSuccessEmail({ userFirstname, loginLink, }) {
    return render(PasswordResetSuccessEmail({
        userFirstname,
        loginLink,
    }));
}
export async function renderEmailVerificationEmail({ userFirstname, verificationLink, }) {
    return render(WelcomeEmail({
        userFirstname,
        loginLink: verificationLink,
    }));
}
export async function renderTeamInviteEmail({ invitedUserEmail, inviterName, teamName, teamRole, acceptInviteLink, expiresInDays, }) {
    return render(TeamInviteEmail({
        invitedUserEmail,
        inviterName,
        teamName,
        teamRole,
        acceptInviteLink,
        expiresInDays,
    }));
}
export async function renderAccountCreatedEmail({ userFirstname, email, password, loginLink, }) {
    return render(AccountCreatedEmail({
        userFirstname,
        email,
        password,
        loginLink,
    }));
}
export async function renderAgencyUserCreatedEmail({ userFirstname, email, password, role, loginLink, }) {
    return render(AgencyUserCreatedEmail({
        userFirstname,
        email,
        password,
        role,
        loginLink,
    }));
}
export async function renderInvoiceDeliveryEmail({ customerName, invoiceNumber, issueDate, dueDate, totalAmount, currency, supportEmail, supportPhone, }) {
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
export async function renderInvoiceSuccessEmail({ customerName, invoiceNumber, orderNumber, totalAmount, currency, supportEmail, supportPhone, invoiceLink, }) {
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
export async function renderQuotationDeliveryEmail({ customerName, quotationNumber, issueDate, totalAmount, currency, services, supportEmail, supportPhone, }) {
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
export async function renderOrderConfirmationEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems, supportEmail, supportPhone, orderLink, }) {
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
export async function renderPaymentReceiptEmail({ customerName, receiptNumber, transactionDate, amount, currency, paymentMethod, supportEmail, supportPhone, }) {
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
export async function renderCampaignCreatedEmail({ recipientName, campaignName, subject, recipientCount, viewCampaignLink, }) {
    return render(CampaignCreatedEmail({
        recipientName,
        campaignName,
        subject,
        recipientCount: recipientCount ?? 0,
        viewCampaignLink,
    }));
}
export async function renderCampaignCompletedEmail({ recipientName, campaignName, subject, sentAt, totalRecipients, viewCampaignLink, }) {
    return render(CampaignCompletedEmail({
        recipientName,
        campaignName,
        subject,
        sentAt,
        totalRecipients: totalRecipients ?? 0,
        viewCampaignLink,
    }));
}
export async function renderCampaignScheduledEmail({ recipientName, campaignName, subject, scheduledAt, recipientCount, viewCampaignLink, }) {
    return render(CampaignScheduledEmail({
        recipientName,
        campaignName,
        subject,
        scheduledAt,
        recipientCount: recipientCount ?? 0,
        viewCampaignLink,
    }));
}
export async function renderCampaignCancelledEmail({ recipientName, campaignName, subject, cancelledAt, viewCampaignLink, }) {
    return render(CampaignCancelledEmail({
        recipientName,
        campaignName,
        subject,
        cancelledAt,
        viewCampaignLink,
    }));
}
export async function renderServiceRenewalReminderEmail({ recipientName, serviceName, subscriptionName, subscriptionDate, expiryDate, gracePeriodText, supportEmail, supportPhone, }) {
    return render(ServiceRenewalReminderEmail({
        recipientName,
        serviceName,
        subscriptionName,
        subscriptionDate,
        expiryDate,
        gracePeriodText,
        supportEmail,
        supportPhone,
    }));
}
// --- Nisc order & OpenProvider verification ---
/** Super-admin email when QStash processing completes successfully (same layout family as OrderFailedEmail). */
export async function renderNiscOrderConfirmationEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems, orderLink, }) {
    return render(NiscAdminOrderConfirmedEmail({
        customerName,
        orderNumber,
        orderDate,
        totalAmount,
        currency,
        orderItems,
        orderLink,
    }));
}
/** "Order received" email   React template; sent when order is created from payment; user will get another email when processed. */
export async function renderNiscOrderReceivedEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems, }) {
    return render(OrderReceivedEmail({
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
    }));
}
/** Admin "order failed" email   React template; sent to super admins when a Nisc order fails or is partial. */
export async function renderNiscOrderFailedEmail({ customerName, orderNumber, failedItems, failureReason, retryLink, }) {
    return render(OrderFailedEmail({
        customerName,
        orderNumber,
        failedItems,
        failureReason,
        retryLink,
    }));
}
export async function renderOpenProviderVerifyEmail({ recipientName, domainName, }) {
    const placeholderImageUrl = "https://via.placeholder.com/120x60?text=Nisc";
    return `<div style="font-family:sans-serif;max-width:600px;">
  <p>Hi ${escapeHtml(recipientName ?? "Customer")},</p>
  <p>To complete your domain purchase for <strong>${escapeHtml(domainName ?? "")}</strong>, please verify your email address.</p>
  <p>OpenProvider has sent a verification email to this address. Click the link in that email to verify and complete your domain registration.</p>
  <p><img src="${placeholderImageUrl}" alt="Nisc" width="120" height="60" style="display:block;margin:1em 0;" /></p>
  <p>If you did not request this, you can ignore this message.</p>
</div>`;
}
function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
