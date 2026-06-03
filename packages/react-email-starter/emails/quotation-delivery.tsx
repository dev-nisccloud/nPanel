import { Section } from "@react-email/components";
import {
	EmailLayout,
	EmailHeader,
	EmailFooter,
	EmailText,
	EmailLink,
	EmailSignature,
} from "./components";

interface QuotationDeliveryEmailProps {
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
}

export const QuotationDeliveryEmail = ({
	customerName = "Valued Customer",
	quotationNumber = "QUOT-0001",
	issueDate = "January 1, 2024",
	totalAmount = "0.00",
	currency = "KES",
	services = [],
	supportEmail = "billing@nisccloud.com",
	supportPhone = "+254 748 777 666",
}: QuotationDeliveryEmailProps) => {
	const formattedAmount = `${currency} ${totalAmount}`;

	return (
		<EmailLayout preview={`Quotation ${quotationNumber} from Nisc Cloud®`}>
			<EmailHeader />
			<Section>
				<EmailText>Dear {customerName},</EmailText>
				<EmailText>
					Please find your quotation from <strong>Nisc Cloud®</strong> for the services outlined below.
				</EmailText>

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
						Quotation details
					</EmailText>
					<EmailText style={{ margin: "8px 0" }}>
						<strong>Quotation number:</strong> {quotationNumber}
					</EmailText>
					<EmailText style={{ margin: "8px 0" }}>
						<strong>Issue date:</strong> {issueDate}
					</EmailText>
					<EmailText style={{ margin: "8px 0", fontSize: "18px", fontWeight: "bold", color: "#059669" }}>
						<strong>Total amount:</strong> {formattedAmount}
					</EmailText>
				</div>

				{services.length > 0 && (
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
							Items quoted
						</EmailText>
						{services.map((service, index) => (
							<div
								key={index}
								style={{
									marginBottom: "12px",
									paddingBottom: "12px",
									borderBottom: index < services.length - 1 ? "1px solid #e2e8f0" : "none",
								}}
							>
								<EmailText style={{ margin: "0 0 4px 0", fontWeight: "600" }}>
									{service.name}
								</EmailText>
								{service.description && (
									<EmailText style={{ margin: "4px 0", color: "#64748b", fontSize: "14px" }}>
										{service.description}
									</EmailText>
								)}
								{(service.quantity || service.price) && (
									<EmailText style={{ margin: "4px 0", fontSize: "14px" }}>
										{service.quantity != null && `Quantity: ${service.quantity}`}
										{service.quantity != null && service.price && " • "}
										{service.price && `Price: ${service.price}`}
									</EmailText>
								)}
							</div>
						))}
					</div>
				)}

				<EmailText>
					<strong>Quotation attachment:</strong> Your detailed quotation is attached to this email as a PDF. You can download and save it for your records.
				</EmailText>

				<EmailText>
					If you have any questions or would like to proceed, please contact us:
				</EmailText>
				<EmailText>
					• Email:{" "}
					<EmailLink href={`mailto:${supportEmail}`}>{supportEmail}</EmailLink>
				</EmailText>
				<EmailText>
					• Phone: <EmailLink href={`tel:${supportPhone}`}>{supportPhone}</EmailLink>
				</EmailText>
				<EmailText>Thank you for your interest. We look forward to working with you.</EmailText>
				<EmailSignature />
			</Section>
			<EmailFooter />
		</EmailLayout>
	);
};

QuotationDeliveryEmail.PreviewProps = {
	customerName: "John Doe",
	quotationNumber: "QUOT-0001",
	issueDate: "January 1, 2024",
	totalAmount: "29,999.00",
	currency: "KES",
	services: [
		{ name: "Web Hosting Plan", description: "Premium hosting package", quantity: 1, price: "KES 15,000.00" },
		{ name: "Domain Registration", quantity: 2, price: "KES 2,500.00" },
	],
	supportEmail: "billing@nisccloud.com",
	supportPhone: "+254 748 777 666",
} as QuotationDeliveryEmailProps;

export default QuotationDeliveryEmail;
