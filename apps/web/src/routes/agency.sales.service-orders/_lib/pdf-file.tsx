import type { ServiceOrderDetail } from "@npanel/api/routers/sales-service-orders/schemas";
import { formValuesToPreview, orderToFormValues } from "../create/mapOrder";

let fontsRegistered = false;
let fontsRegistering: Promise<boolean> | null = null;

async function registerFonts() {
	if (fontsRegistered) return true;
	if (fontsRegistering) return fontsRegistering;
	fontsRegistering = (async () => {
		try {
			const { Font } = await import("@react-pdf/renderer");
			const weights = [
				{ name: "Geist-Regular.ttf", weight: "normal" as const },
				{ name: "Geist-Medium.ttf", weight: "medium" as const },
				{ name: "Geist-SemiBold.ttf", weight: "semibold" as const },
				{ name: "Geist-Bold.ttf", weight: "bold" as const },
			];
			const fonts = (
				await Promise.all(
					weights.map(async ({ name, weight }) => {
						try {
							const res = await fetch(`/font/${name}`);
							if (!res.ok) return null;
							const buf = await res.arrayBuffer();
							const base64 = btoa(
								new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ""),
							);
							return { src: `data:font/truetype;base64,${base64}`, fontWeight: weight };
						} catch {
							return null;
						}
					}),
				)
			).filter((font): font is NonNullable<typeof font> => font != null);
			if (fonts.length > 0) {
				Font.register({ family: "Geist", fonts });
				fontsRegistered = true;
			}
			return fontsRegistered;
		} catch {
			return false;
		}
	})();
	try {
		return await fontsRegistering;
	} finally {
		fontsRegistering = null;
	}
}

export async function renderServiceOrderPdf(order: ServiceOrderDetail) {
	await registerFonts();
	const preview = formValuesToPreview(orderToFormValues(order));
	const [{ Document, Page, pdf }, { ServiceOrderPdfDetails }, { pdfContainers }] = await Promise.all([
		import("@react-pdf/renderer"),
		import("../create/_components/form/serviceOrderPdfDetails"),
		import("@/lib/pdfStyles"),
	]);
	return pdf(
		<Document>
			<Page size="A4" style={pdfContainers.page}>
				<ServiceOrderPdfDetails {...preview} />
			</Page>
		</Document>,
	).toBlob();
}

export async function downloadServiceOrderPdf(order: ServiceOrderDetail) {
	const blob = await renderServiceOrderPdf(order);
	const url = URL.createObjectURL(blob);
	const anchor = window.document.createElement("a");
	anchor.href = url;
	anchor.download = `${order.orderNumber || "Service-order"}.pdf`;
	window.document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

export async function serviceOrderPdfBase64(order: ServiceOrderDetail) {
	const blob = await renderServiceOrderPdf(order);
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(((reader.result as string) ?? "").split(",")[1] ?? "");
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}
