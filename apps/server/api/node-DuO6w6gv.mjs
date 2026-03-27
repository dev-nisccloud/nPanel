
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { t as convert } from "./html-to-text-Co57D90l.mjs";
import { Suspense } from "react";
import * as html from "prettier/plugins/html";
import { format } from "prettier/standalone";
import { Writable } from "node:stream";
import { jsx } from "react/jsx-runtime";

//#region ../../node_modules/.bun/@react-email+render@1.4.0+8f708e3022b846db/node_modules/@react-email/render/dist/node/index.mjs
function recursivelyMapDoc(doc, callback) {
	if (Array.isArray(doc)) return doc.map((innerDoc) => recursivelyMapDoc(innerDoc, callback));
	if (typeof doc === "object") {
		if (doc.type === "group") return {
			...doc,
			contents: recursivelyMapDoc(doc.contents, callback),
			expandedStates: recursivelyMapDoc(doc.expandedStates, callback)
		};
		if ("contents" in doc) return {
			...doc,
			contents: recursivelyMapDoc(doc.contents, callback)
		};
		if ("parts" in doc) return {
			...doc,
			parts: recursivelyMapDoc(doc.parts, callback)
		};
		if (doc.type === "if-break") return {
			...doc,
			breakContents: recursivelyMapDoc(doc.breakContents, callback),
			flatContents: recursivelyMapDoc(doc.flatContents, callback)
		};
	}
	return callback(doc);
}
const modifiedHtml = { ...html };
if (modifiedHtml.printers) {
	const previousPrint = modifiedHtml.printers.html.print;
	modifiedHtml.printers.html.print = (path, options, print, args) => {
		const node = path.getNode();
		const rawPrintingResult = previousPrint(path, options, print, args);
		if (node.type === "ieConditionalComment") return recursivelyMapDoc(rawPrintingResult, (doc) => {
			if (typeof doc === "object" && doc.type === "line") return doc.soft ? "" : " ";
			return doc;
		});
		return rawPrintingResult;
	};
}
const defaults = {
	endOfLine: "lf",
	tabWidth: 2,
	plugins: [modifiedHtml],
	bracketSameLine: true,
	parser: "html"
};
const pretty = (str, options = {}) => {
	return format(str.replaceAll("\0", ""), {
		...defaults,
		...options
	});
};
const plainTextSelectors = [
	{
		selector: "img",
		format: "skip"
	},
	{
		selector: "[data-skip-in-text=true]",
		format: "skip"
	},
	{
		selector: "a",
		options: {
			linkBrackets: false,
			hideLinkHrefIfSameAsText: true
		}
	}
];
function toPlainText(html$1, options) {
	return convert(html$1, {
		selectors: plainTextSelectors,
		wordwrap: false,
		...options
	});
}
const readStream = async (stream) => {
	let result = "";
	const decoder = new TextDecoder("utf-8");
	if ("pipeTo" in stream) {
		const writableStream = new WritableStream({
			write(chunk) {
				result += decoder.decode(chunk, { stream: true });
			},
			close() {
				result += decoder.decode();
			}
		});
		await stream.pipeTo(writableStream);
	} else {
		const writable = new Writable({
			write(chunk, _encoding, callback) {
				result += decoder.decode(chunk, { stream: true });
				callback();
			},
			final(callback) {
				result += decoder.decode();
				callback();
			}
		});
		stream.pipe(writable);
		await new Promise((resolve, reject) => {
			writable.on("error", reject);
			writable.on("close", () => {
				resolve();
			});
		});
	}
	return result;
};
const render = async (node, options) => {
	const suspendedElement = /* @__PURE__ */ jsx(Suspense, { children: node });
	const reactDOMServer = await import("react-dom/server").then((m) => m.default);
	let html$1;
	if (Object.hasOwn(reactDOMServer, "renderToReadableStream") && typeof WritableStream !== "undefined") html$1 = await readStream(await reactDOMServer.renderToReadableStream(suspendedElement, { progressiveChunkSize: Number.POSITIVE_INFINITY }));
	else await new Promise((resolve, reject) => {
		const stream = reactDOMServer.renderToPipeableStream(suspendedElement, {
			async onAllReady() {
				html$1 = await readStream(stream);
				resolve();
			},
			onError(error) {
				reject(error);
			},
			progressiveChunkSize: Number.POSITIVE_INFINITY
		});
	});
	if (options?.plainText) return toPlainText(html$1, options.htmlToTextOptions);
	const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html$1.replace(/<!DOCTYPE.*?>/, "")}`;
	if (options?.pretty) return pretty(document);
	return document;
};
/**
* @deprecated use {@link render}
*/
const renderAsync = (element, options) => {
	return render(element, options);
};

//#endregion
export { toPlainText as a, renderAsync as i, pretty as n, render as r, plainTextSelectors as t };