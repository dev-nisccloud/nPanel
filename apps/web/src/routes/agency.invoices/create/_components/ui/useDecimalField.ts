import * as React from "react";

const DECIMAL_INPUT = /^-?\d*\.?\d*$/;

/** Keep a typed decimal such as "10." or "10.06" while the stored value stays numeric. */
export function useDecimalField(value: number | undefined) {
	const [text, setText] = React.useState<string | null>(null);

	React.useEffect(() => {
		setText((current) => {
			if (current === null) return null;
			if (value == null) {
				if (current === "" || current === "-" || current === "." || current === "-.") return current;
				return null;
			}
			if (current === "-" || current === "." || current === "-." || current.endsWith(".")) {
				const head = current.endsWith(".") ? current.slice(0, -1) : current;
				if (head === "" || head === "-" || Number(head) === value) return current;
			}
			if (Number(current) === value) return current;
			return null;
		});
	}, [value]);

	const shown = text !== null ? text : value != null ? String(value) : "";

	const onChange = (raw: string, commit: (next: number | undefined) => void) => {
		if (raw !== "" && !DECIMAL_INPUT.test(raw)) return;
		setText(raw);
		if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
			commit(undefined);
			return;
		}
		const next = Number(raw);
		commit(Number.isFinite(next) ? next : undefined);
	};

	return { shown, onChange };
}
