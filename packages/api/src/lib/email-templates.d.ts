export declare function renderResetPasswordEmail({ userFirstname, resetPasswordLink, }: {
    userFirstname: string;
    resetPasswordLink: string;
}): Promise<string>;
export declare function renderPasswordResetSuccessEmail({ userFirstname, loginLink, }: {
    userFirstname: string;
    loginLink: string;
}): Promise<string>;
export declare function renderEmailVerificationEmail({ userFirstname, verificationLink, }: {
    userFirstname: string;
    verificationLink: string;
}): Promise<string>;
export declare function renderTeamInviteEmail({ invitedUserEmail, inviterName, teamName, teamRole, acceptInviteLink, expiresInDays, }: {
    invitedUserEmail: string;
    inviterName: string;
    teamName: string;
    teamRole?: string;
    acceptInviteLink: string;
    expiresInDays?: number;
}): Promise<string>;
export declare function renderAccountCreatedEmail({ userFirstname, email, password, loginLink, }: {
    userFirstname: string;
    email: string;
    password: string;
    loginLink: string;
}): Promise<string>;
export declare function renderAgencyUserCreatedEmail({ userFirstname, email, password, role, loginLink, }: {
    userFirstname: string;
    email: string;
    password: string;
    role: string;
    loginLink: string;
}): Promise<string>;
export declare function renderInvoiceDeliveryEmail({ customerName, invoiceNumber, issueDate, dueDate, totalAmount, currency, supportEmail, supportPhone, }: {
    customerName?: string;
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
    totalAmount?: string;
    currency?: string;
    supportEmail?: string;
    supportPhone?: string;
}): Promise<string>;
export declare function renderInvoiceSuccessEmail({ customerName, invoiceNumber, orderNumber, totalAmount, currency, supportEmail, supportPhone, invoiceLink, }: {
    customerName?: string;
    invoiceNumber?: string;
    orderNumber?: string;
    totalAmount?: string;
    currency?: string;
    supportEmail?: string;
    supportPhone?: string;
    invoiceLink?: string;
}): Promise<string>;
export declare function renderQuotationDeliveryEmail({ customerName, quotationNumber, issueDate, totalAmount, currency, services, supportEmail, supportPhone, }: {
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
}): Promise<string>;
export declare function renderOrderConfirmationEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems, supportEmail, supportPhone, orderLink, }: {
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
}): Promise<string>;
export declare function renderPaymentReceiptEmail({ customerName, receiptNumber, transactionDate, amount, currency, paymentMethod, supportEmail, supportPhone, }: {
    customerName?: string;
    receiptNumber?: string;
    transactionDate?: string;
    amount?: string;
    currency?: string;
    paymentMethod?: string;
    supportEmail?: string;
    supportPhone?: string;
}): Promise<string>;
export declare function renderCampaignCreatedEmail({ recipientName, campaignName, subject, recipientCount, viewCampaignLink, }: {
    recipientName?: string;
    campaignName?: string;
    subject?: string;
    recipientCount?: number;
    viewCampaignLink?: string;
}): Promise<string>;
export declare function renderCampaignCompletedEmail({ recipientName, campaignName, subject, sentAt, totalRecipients, viewCampaignLink, }: {
    recipientName?: string;
    campaignName?: string;
    subject?: string;
    sentAt?: string;
    totalRecipients?: number;
    viewCampaignLink?: string;
}): Promise<string>;
export declare function renderCampaignScheduledEmail({ recipientName, campaignName, subject, scheduledAt, recipientCount, viewCampaignLink, }: {
    recipientName?: string;
    campaignName?: string;
    subject?: string;
    scheduledAt?: string;
    recipientCount?: number;
    viewCampaignLink?: string;
}): Promise<string>;
export declare function renderCampaignCancelledEmail({ recipientName, campaignName, subject, cancelledAt, viewCampaignLink, }: {
    recipientName?: string;
    campaignName?: string;
    subject?: string;
    cancelledAt?: string;
    viewCampaignLink?: string;
}): Promise<string>;
export declare function renderServiceRenewalReminderEmail({ recipientName, serviceName, subscriptionName, subscriptionDate, expiryDate, gracePeriodText, supportEmail, supportPhone, }: {
    recipientName?: string;
    serviceName?: string;
    subscriptionName?: string;
    subscriptionDate?: string;
    expiryDate?: string;
    gracePeriodText?: string;
    supportEmail?: string;
    supportPhone?: string;
}): Promise<string>;
/** Super-admin email when QStash processing completes successfully (same layout family as OrderFailedEmail). */
export declare function renderNiscOrderConfirmationEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems, orderLink, }: {
    customerName?: string;
    orderNumber?: string;
    orderDate?: string;
    totalAmount?: string;
    currency?: string;
    orderItems?: Array<{
        name: string;
        description?: string;
        price?: string;
        status?: string;
    }>;
    orderLink?: string;
}): Promise<string>;
/** "Order received" email   React template; sent when order is created from payment; user will get another email when processed. */
export declare function renderNiscOrderReceivedEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems, }: {
    customerName?: string;
    orderNumber?: string;
    orderDate?: string;
    totalAmount?: string;
    currency?: string;
    orderItems?: Array<{
        name: string;
        description?: string;
        price?: string;
    }>;
}): Promise<string>;
/** Admin "order failed" email   React template; sent to super admins when a Nisc order fails or is partial. */
export declare function renderNiscOrderFailedEmail({ customerName, orderNumber, failedItems, failureReason, retryLink, }: {
    customerName?: string;
    orderNumber?: string;
    failedItems?: Array<{
        name: string;
        error?: string;
    }>;
    failureReason?: string;
    retryLink?: string;
}): Promise<string>;
export declare function renderOpenProviderVerifyEmail({ recipientName, domainName, }: {
    recipientName?: string;
    domainName?: string;
}): Promise<string>;
export declare function renderStorefrontWelcomeEmail({ firstName, email, temporaryPassword, loginLink, verificationLink, planName, }: {
    firstName: string;
    email: string;
    temporaryPassword: string;
    loginLink: string;
    verificationLink?: string;
    planName?: string;
}): Promise<string>;
