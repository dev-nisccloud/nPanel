declare module "qrcode" {
	export interface QRCodeOptions {
		width?: number;
		margin?: number;
		color?: {
			dark?: string;
			light?: string;
		};
		errorCorrectionLevel?: "L" | "M" | "Q" | "H";
		type?: "image/png" | "image/jpeg" | "image/webp";
		quality?: number;
	}

	export function toDataURL(
		text: string,
		options?: QRCodeOptions
	): Promise<string>;

	export function toBuffer(
		text: string,
		options?: QRCodeOptions
	): Promise<Buffer>;

	export function toString(
		text: string,
		options?: QRCodeOptions
	): Promise<string>;

	export default {
		toDataURL,
		toBuffer,
		toString,
	};
}

