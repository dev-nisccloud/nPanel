import { Section } from "@react-email/components";
import {
	EmailLayout,
	EmailHeader,
	EmailFooter,
	EmailText,
	EmailButton,
	EmailSignature,
} from "./components";

export interface NiscAdminOrderConfirmedEmailProps {
	/** Customer / purchaser display name (for admin context). */
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
}

export const NiscAdminOrderConfirmedEmail = ({
	customerName = "Customer",
	orderNumber = "Nisc-000000-000000-000",
	orderDate = "",
	totalAmount = "0",
	currency = "KES",
	orderItems = [],
	orderLink = "https://app.nisccloud.com/agency/nisc-service-orders",
}: NiscAdminOrderConfirmedEmailProps) => {
	const formattedTotal = `${currency} ${totalAmount}`;

	return (
		<EmailLayout preview={`[Nisc Admin] Order confirmed: ${orderNumber}`}>
			<EmailHeader />
			<Section>
				<EmailText>Hello,</EmailText>
				<EmailText>
					A Nisc service order has been <strong>fully processed</strong> and all items are provisioned. Summary below for your records.
				</EmailText>

				<div
					style={{
						backgroundColor: "#f0fdf4",
						border: "1px solid #86efac",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0",
					}}
				>
					<EmailText
						style={{
							margin: "0 0 12px 0",
							fontWeight: "bold",
							fontSize: "18px",
							color: "#047857",
						}}
					>
						Order completed successfully
					</EmailText>
					<EmailText style={{ margin: "0", color: "#166534", fontSize: "15px" }}>
						Provisioning finished with no failures. The customer-facing flow can proceed as normal (invoice and notifications where configured).
					</EmailText>
				</div>

				<div
					style={{
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0",
					}}
				>
					<EmailText style={{ margin: "0 0 15px 0", fontWeight: "bold", fontSize: "16px" }}>
						Order information
					</EmailText>
					<EmailText style={{ margin: "8px 0" }}>
						<strong>Order number:</strong> {orderNumber}
					</EmailText>
					<EmailText style={{ margin: "8px 0" }}>
						<strong>Date:</strong> {orderDate}
					</EmailText>
					<EmailText style={{ margin: "8px 0" }}>
						<strong>Customer:</strong> {customerName}
					</EmailText>
					<EmailText
						style={{
							margin: "12px 0 0 0",
							fontSize: "17px",
							fontWeight: "bold",
							color: "#047857",
						}}
					>
						<strong>Total:</strong> {formattedTotal}
					</EmailText>
				</div>

				{orderItems.length > 0 && (
					<div
						style={{
							backgroundColor: "#ffffff",
							border: "1px solid #e2e8f0",
							borderRadius: "8px",
							padding: "20px",
							margin: "20px 0",
						}}
					>
						<EmailText style={{ margin: "0 0 15px 0", fontWeight: "bold" }}>
							Line items
						</EmailText>
						{orderItems.map((item, index) => (
							<div
								key={index}
								style={{
									marginBottom: "12px",
									paddingBottom: "12px",
									borderBottom:
										index < orderItems.length - 1 ? "1px solid #e2e8f0" : "none",
								}}
							>
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										justifyContent: "space-between",
										alignItems: "flex-start",
										gap: "8px",
									}}
								>
									<EmailText style={{ margin: "0 0 4px 0", fontWeight: 600, flex: "1 1 auto" }}>
										{item.name}
									</EmailText>
									{item.status && (
										<EmailText
											style={{
												margin: "0",
												fontSize: "12px",
												fontWeight: 600,
												color: "#047857",
												backgroundColor: "#d1fae5",
												padding: "4px 10px",
												borderRadius: "6px",
												whiteSpace: "nowrap",
											}}
										>
											{item.status}
										</EmailText>
									)}
								</div>
								{item.description && (
									<EmailText style={{ margin: "4px 0", color: "#64748b", fontSize: "14px" }}>
										{item.description}
									</EmailText>
								)}
								{item.price && (
									<EmailText
										style={{
											margin: "6px 0 0 0",
											fontSize: "14px",
											fontWeight: 600,
											color: "#0f172a",
										}}
									>
										{item.price}
									</EmailText>
								)}
							</div>
						))}
					</div>
				)}

				<EmailText>Open the order in the agency dashboard to view full details, logs, and linked subscriptions.</EmailText>

				<EmailButton href={orderLink}>View order in Nisc Service Orders</EmailButton>

				<EmailSignature />
			</Section>
			<EmailFooter />
		</EmailLayout>
	);
};

NiscAdminOrderConfirmedEmail.PreviewProps = {
	customerName: "Finey Akwoyo",
	orderNumber: "Nisc-2026-235933-462",
	orderDate: "2026-05-14",
	totalAmount: "1350",
	currency: "KES",
	orderItems: [
		{
			name: "Domains",
			description: "example.co.ke",
			price: "KES 1350",
			status: "PROVISIONED",
		},
		{
			name: "Web Hosting - Business",
			description: "Primary domain: clientsite.com",
			price: "KES 4999",
			status: "PROVISIONED",
		},
	],
	orderLink: "https://app.nisccloud.com/agency/nisc-service-orders?order=nisc_123",
} as NiscAdminOrderConfirmedEmailProps;

export default NiscAdminOrderConfirmedEmail;
