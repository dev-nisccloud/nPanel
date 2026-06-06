export type CopyToClipboardOptions = {
	/** When set, select/copy from this element first (reliable inside modals). */
	sourceElement?: HTMLTextAreaElement | HTMLInputElement | null;
};

function copyFromTextFieldElement(element: HTMLTextAreaElement | HTMLInputElement): boolean {
	if (typeof document === "undefined") return false;

	const previousFocus = document.activeElement;
	element.focus({ preventScroll: true });
	element.select();
	if (element instanceof HTMLTextAreaElement) {
		element.setSelectionRange(0, element.value.length);
	}

	let success = false;
	try {
		success = document.execCommand("copy");
	} catch {
		success = false;
	}

	if (previousFocus instanceof HTMLElement && previousFocus !== element) {
		try {
			previousFocus.focus({ preventScroll: true });
		} catch {
			// ignore
		}
	}

	return success;
}

function copyViaExecCommand(text: string): boolean {
	if (typeof document === "undefined") return false;

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("aria-hidden", "true");
	textarea.style.position = "fixed";
	textarea.style.top = "0";
	textarea.style.left = "0";
	textarea.style.width = "1px";
	textarea.style.height = "1px";
	textarea.style.padding = "0";
	textarea.style.border = "none";
	textarea.style.opacity = "0";
	textarea.style.pointerEvents = "none";
	document.body.appendChild(textarea);

	const success = copyFromTextFieldElement(textarea);
	document.body.removeChild(textarea);
	return success;
}

export async function copyTextToClipboard(
	text: string,
	options?: CopyToClipboardOptions,
): Promise<boolean> {
	if (!text) return false;

	const source = options?.sourceElement;
	if (source && source.value === text) {
		if (copyFromTextFieldElement(source)) return true;
	}

	if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fall through to execCommand.
		}
	}

	return copyViaExecCommand(text);
}
