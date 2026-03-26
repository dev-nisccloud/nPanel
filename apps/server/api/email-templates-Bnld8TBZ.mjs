
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { r as render } from "./node-CfzFMRmY.mjs";
import * as React$1 from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

//#region ../../node_modules/.bun/@react-email+body@0.1.0+6ccf2a00d98a8a5e/node_modules/@react-email/body/dist/index.mjs
var __defProp$10 = Object.defineProperty;
var __defProps$10 = Object.defineProperties;
var __getOwnPropDescs$10 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$10 = Object.getOwnPropertySymbols;
var __hasOwnProp$10 = Object.prototype.hasOwnProperty;
var __propIsEnum$10 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$10 = (obj, key, value) => key in obj ? __defProp$10(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$10 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$10.call(b, prop)) __defNormalProp$10(a, prop, b[prop]);
	if (__getOwnPropSymbols$10) {
		for (var prop of __getOwnPropSymbols$10(b)) if (__propIsEnum$10.call(b, prop)) __defNormalProp$10(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$10 = (a, b) => __defProps$10(a, __getOwnPropDescs$10(b));
var __objRest$10 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$10.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$10) {
		for (var prop of __getOwnPropSymbols$10(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$10.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Body = React$1.forwardRef((_a, ref) => {
	var _b = _a, { children, style } = _b;
	return /* @__PURE__ */ jsx("body", __spreadProps$10(__spreadValues$10({}, __objRest$10(_b, ["children", "style"])), {
		style: {
			background: style == null ? void 0 : style.background,
			backgroundColor: style == null ? void 0 : style.backgroundColor
		},
		ref,
		children: /* @__PURE__ */ jsx("table", {
			border: 0,
			width: "100%",
			cellPadding: "0",
			cellSpacing: "0",
			role: "presentation",
			align: "center",
			children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
				style,
				children
			}) }) })
		})
	}));
});
Body.displayName = "Body";

//#endregion
//#region ../../node_modules/.bun/@react-email+button@0.2.0+6ccf2a00d98a8a5e/node_modules/@react-email/button/dist/index.mjs
var __defProp$9 = Object.defineProperty;
var __defProps$9 = Object.defineProperties;
var __getOwnPropDescs$9 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$9 = Object.getOwnPropertySymbols;
var __hasOwnProp$9 = Object.prototype.hasOwnProperty;
var __propIsEnum$9 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$9 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$9.call(b, prop)) __defNormalProp$9(a, prop, b[prop]);
	if (__getOwnPropSymbols$9) {
		for (var prop of __getOwnPropSymbols$9(b)) if (__propIsEnum$9.call(b, prop)) __defNormalProp$9(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$9 = (a, b) => __defProps$9(a, __getOwnPropDescs$9(b));
var __objRest$9 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$9.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$9) {
		for (var prop of __getOwnPropSymbols$9(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$9.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
function convertToPx(value) {
	let px = 0;
	if (!value) return px;
	if (typeof value === "number") return value;
	const matches = /^([\d.]+)(px|em|rem|%)$/.exec(value);
	if (matches && matches.length === 3) {
		const numValue = Number.parseFloat(matches[1]);
		switch (matches[2]) {
			case "px": return numValue;
			case "em":
			case "rem":
				px = numValue * 16;
				return px;
			case "%":
				px = numValue / 100 * 600;
				return px;
			default: return numValue;
		}
	}
	return 0;
}
function parsePaddingValue(value) {
	if (typeof value === "number") return {
		paddingTop: value,
		paddingBottom: value,
		paddingLeft: value,
		paddingRight: value
	};
	if (typeof value === "string") {
		const values = value.toString().trim().split(/\s+/);
		if (values.length === 1) return {
			paddingTop: values[0],
			paddingBottom: values[0],
			paddingLeft: values[0],
			paddingRight: values[0]
		};
		if (values.length === 2) return {
			paddingTop: values[0],
			paddingRight: values[1],
			paddingBottom: values[0],
			paddingLeft: values[1]
		};
		if (values.length === 3) return {
			paddingTop: values[0],
			paddingRight: values[1],
			paddingBottom: values[2],
			paddingLeft: values[1]
		};
		if (values.length === 4) return {
			paddingTop: values[0],
			paddingRight: values[1],
			paddingBottom: values[2],
			paddingLeft: values[3]
		};
	}
	return {
		paddingTop: void 0,
		paddingBottom: void 0,
		paddingLeft: void 0,
		paddingRight: void 0
	};
}
function parsePadding(properties) {
	let paddingTop;
	let paddingRight;
	let paddingBottom;
	let paddingLeft;
	for (const [key, value] of Object.entries(properties)) if (key === "padding") ({paddingTop, paddingBottom, paddingLeft, paddingRight} = parsePaddingValue(value));
	else if (key === "paddingTop") paddingTop = value;
	else if (key === "paddingRight") paddingRight = value;
	else if (key === "paddingBottom") paddingBottom = value;
	else if (key === "paddingLeft") paddingLeft = value;
	return {
		paddingTop: paddingTop ? convertToPx(paddingTop) : void 0,
		paddingRight: paddingRight ? convertToPx(paddingRight) : void 0,
		paddingBottom: paddingBottom ? convertToPx(paddingBottom) : void 0,
		paddingLeft: paddingLeft ? convertToPx(paddingLeft) : void 0
	};
}
var pxToPt = (px) => typeof px === "number" && !Number.isNaN(Number(px)) ? px * 3 / 4 : void 0;
var maxFontWidth = 5;
function computeFontWidthAndSpaceCount(expectedWidth) {
	if (expectedWidth === 0) return [0, 0];
	let smallestSpaceCount = 0;
	const computeRequiredFontWidth = () => {
		if (smallestSpaceCount > 0) return expectedWidth / smallestSpaceCount / 2;
		return Number.POSITIVE_INFINITY;
	};
	while (computeRequiredFontWidth() > maxFontWidth) smallestSpaceCount++;
	return [computeRequiredFontWidth(), smallestSpaceCount];
}
var Button = React$1.forwardRef((_a, ref) => {
	var _b = _a, { children, style, target = "_blank" } = _b, props = __objRest$9(_b, [
		"children",
		"style",
		"target"
	]);
	const { paddingTop, paddingRight, paddingBottom, paddingLeft } = parsePadding(style != null ? style : {});
	const textRaise = pxToPt((paddingTop != null ? paddingTop : 0) + (paddingBottom != null ? paddingBottom : 0));
	const [plFontWidth, plSpaceCount] = computeFontWidthAndSpaceCount(paddingLeft != null ? paddingLeft : 0);
	const [prFontWidth, prSpaceCount] = computeFontWidthAndSpaceCount(paddingRight != null ? paddingRight : 0);
	return /* @__PURE__ */ jsxs("a", __spreadProps$9(__spreadValues$9({}, props), {
		ref,
		style: __spreadProps$9(__spreadValues$9({
			lineHeight: "100%",
			textDecoration: "none",
			display: "inline-block",
			maxWidth: "100%",
			msoPaddingAlt: "0px"
		}, style), {
			paddingTop,
			paddingRight,
			paddingBottom,
			paddingLeft
		}),
		target,
		children: [
			/* @__PURE__ */ jsx("span", { dangerouslySetInnerHTML: { __html: `<!--[if mso]><i style="mso-font-width:${plFontWidth * 100}%;mso-text-raise:${textRaise}" hidden>${"&#8202;".repeat(plSpaceCount)}</i><![endif]-->` } }),
			/* @__PURE__ */ jsx("span", {
				style: {
					maxWidth: "100%",
					display: "inline-block",
					lineHeight: "120%",
					msoPaddingAlt: "0px",
					msoTextRaise: pxToPt(paddingBottom)
				},
				children
			}),
			/* @__PURE__ */ jsx("span", { dangerouslySetInnerHTML: { __html: `<!--[if mso]><i style="mso-font-width:${prFontWidth * 100}%" hidden>${"&#8202;".repeat(prSpaceCount)}&#8203;</i><![endif]-->` } })
		]
	}));
});
Button.displayName = "Button";

//#endregion
//#region ../../node_modules/.bun/@react-email+column@0.0.13+6ccf2a00d98a8a5e/node_modules/@react-email/column/dist/index.mjs
var __defProp$8 = Object.defineProperty;
var __defProps$8 = Object.defineProperties;
var __getOwnPropDescs$8 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$8 = Object.getOwnPropertySymbols;
var __hasOwnProp$8 = Object.prototype.hasOwnProperty;
var __propIsEnum$8 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$8 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$8.call(b, prop)) __defNormalProp$8(a, prop, b[prop]);
	if (__getOwnPropSymbols$8) {
		for (var prop of __getOwnPropSymbols$8(b)) if (__propIsEnum$8.call(b, prop)) __defNormalProp$8(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$8 = (a, b) => __defProps$8(a, __getOwnPropDescs$8(b));
var __objRest$8 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$8.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$8) {
		for (var prop of __getOwnPropSymbols$8(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$8.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Column = React$1.forwardRef((_a, ref) => {
	var _b = _a, { children, style } = _b;
	return /* @__PURE__ */ jsx("td", __spreadProps$8(__spreadValues$8({}, __objRest$8(_b, ["children", "style"])), {
		"data-id": "__react-email-column",
		ref,
		style,
		children
	}));
});
Column.displayName = "Column";

//#endregion
//#region ../../node_modules/.bun/@react-email+container@0.0.15+6ccf2a00d98a8a5e/node_modules/@react-email/container/dist/index.mjs
var __defProp$7 = Object.defineProperty;
var __defProps$7 = Object.defineProperties;
var __getOwnPropDescs$7 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$7 = Object.getOwnPropertySymbols;
var __hasOwnProp$7 = Object.prototype.hasOwnProperty;
var __propIsEnum$7 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$7 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$7.call(b, prop)) __defNormalProp$7(a, prop, b[prop]);
	if (__getOwnPropSymbols$7) {
		for (var prop of __getOwnPropSymbols$7(b)) if (__propIsEnum$7.call(b, prop)) __defNormalProp$7(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$7 = (a, b) => __defProps$7(a, __getOwnPropDescs$7(b));
var __objRest$7 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$7.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$7) {
		for (var prop of __getOwnPropSymbols$7(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$7.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Container = React$1.forwardRef((_a, ref) => {
	var _b = _a, { children, style } = _b;
	return /* @__PURE__ */ jsx("table", __spreadProps$7(__spreadValues$7({
		align: "center",
		width: "100%"
	}, __objRest$7(_b, ["children", "style"])), {
		border: 0,
		cellPadding: "0",
		cellSpacing: "0",
		ref,
		role: "presentation",
		style: __spreadValues$7({ maxWidth: "37.5em" }, style),
		children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", {
			style: { width: "100%" },
			children: /* @__PURE__ */ jsx("td", { children })
		}) })
	}));
});
Container.displayName = "Container";

//#endregion
//#region ../../node_modules/.bun/@react-email+head@0.0.12+6ccf2a00d98a8a5e/node_modules/@react-email/head/dist/index.mjs
var __defProp$6 = Object.defineProperty;
var __defProps$6 = Object.defineProperties;
var __getOwnPropDescs$6 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$6 = Object.getOwnPropertySymbols;
var __hasOwnProp$6 = Object.prototype.hasOwnProperty;
var __propIsEnum$6 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$6 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$6.call(b, prop)) __defNormalProp$6(a, prop, b[prop]);
	if (__getOwnPropSymbols$6) {
		for (var prop of __getOwnPropSymbols$6(b)) if (__propIsEnum$6.call(b, prop)) __defNormalProp$6(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$6 = (a, b) => __defProps$6(a, __getOwnPropDescs$6(b));
var __objRest$6 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$6.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$6) {
		for (var prop of __getOwnPropSymbols$6(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$6.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Head = React$1.forwardRef((_a, ref) => {
	var _b = _a, { children } = _b;
	return /* @__PURE__ */ jsxs("head", __spreadProps$6(__spreadValues$6({}, __objRest$6(_b, ["children"])), {
		ref,
		children: [
			/* @__PURE__ */ jsx("meta", {
				content: "text/html; charset=UTF-8",
				httpEquiv: "Content-Type"
			}),
			/* @__PURE__ */ jsx("meta", { name: "x-apple-disable-message-reformatting" }),
			children
		]
	}));
});
Head.displayName = "Head";

//#endregion
//#region ../../node_modules/.bun/@react-email+html@0.0.11+6ccf2a00d98a8a5e/node_modules/@react-email/html/dist/index.mjs
var __defProp$5 = Object.defineProperty;
var __defProps$5 = Object.defineProperties;
var __getOwnPropDescs$5 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$5 = Object.getOwnPropertySymbols;
var __hasOwnProp$5 = Object.prototype.hasOwnProperty;
var __propIsEnum$5 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$5 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$5.call(b, prop)) __defNormalProp$5(a, prop, b[prop]);
	if (__getOwnPropSymbols$5) {
		for (var prop of __getOwnPropSymbols$5(b)) if (__propIsEnum$5.call(b, prop)) __defNormalProp$5(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$5 = (a, b) => __defProps$5(a, __getOwnPropDescs$5(b));
var __objRest$5 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$5.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$5) {
		for (var prop of __getOwnPropSymbols$5(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$5.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Html = React$1.forwardRef((_a, ref) => {
	var _b = _a, { children, lang = "en", dir = "ltr" } = _b;
	return /* @__PURE__ */ jsx("html", __spreadProps$5(__spreadValues$5({}, __objRest$5(_b, [
		"children",
		"lang",
		"dir"
	])), {
		dir,
		lang,
		ref,
		children
	}));
});
Html.displayName = "Html";

//#endregion
//#region ../../node_modules/.bun/@react-email+img@0.0.11+6ccf2a00d98a8a5e/node_modules/@react-email/img/dist/index.mjs
var __defProp$4 = Object.defineProperty;
var __defProps$4 = Object.defineProperties;
var __getOwnPropDescs$4 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$4 = Object.getOwnPropertySymbols;
var __hasOwnProp$4 = Object.prototype.hasOwnProperty;
var __propIsEnum$4 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$4 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$4.call(b, prop)) __defNormalProp$4(a, prop, b[prop]);
	if (__getOwnPropSymbols$4) {
		for (var prop of __getOwnPropSymbols$4(b)) if (__propIsEnum$4.call(b, prop)) __defNormalProp$4(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$4 = (a, b) => __defProps$4(a, __getOwnPropDescs$4(b));
var __objRest$4 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$4.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$4) {
		for (var prop of __getOwnPropSymbols$4(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$4.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Img = React$1.forwardRef((_a, ref) => {
	var _b = _a, { alt, src, width, height, style } = _b;
	return /* @__PURE__ */ jsx("img", __spreadProps$4(__spreadValues$4({}, __objRest$4(_b, [
		"alt",
		"src",
		"width",
		"height",
		"style"
	])), {
		alt,
		height,
		ref,
		src,
		style: __spreadValues$4({
			display: "block",
			outline: "none",
			border: "none",
			textDecoration: "none"
		}, style),
		width
	}));
});
Img.displayName = "Img";

//#endregion
//#region ../../node_modules/.bun/@react-email+link@0.0.12+6ccf2a00d98a8a5e/node_modules/@react-email/link/dist/index.mjs
var __defProp$3 = Object.defineProperty;
var __defProps$3 = Object.defineProperties;
var __getOwnPropDescs$3 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$3 = Object.getOwnPropertySymbols;
var __hasOwnProp$3 = Object.prototype.hasOwnProperty;
var __propIsEnum$3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$3 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$3.call(b, prop)) __defNormalProp$3(a, prop, b[prop]);
	if (__getOwnPropSymbols$3) {
		for (var prop of __getOwnPropSymbols$3(b)) if (__propIsEnum$3.call(b, prop)) __defNormalProp$3(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$3 = (a, b) => __defProps$3(a, __getOwnPropDescs$3(b));
var __objRest$3 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$3.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$3) {
		for (var prop of __getOwnPropSymbols$3(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$3.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Link = React$1.forwardRef((_a, ref) => {
	var _b = _a, { target = "_blank", style } = _b, props = __objRest$3(_b, ["target", "style"]);
	return /* @__PURE__ */ jsx("a", __spreadProps$3(__spreadValues$3({}, props), {
		ref,
		style: __spreadValues$3({
			color: "#067df7",
			textDecorationLine: "none"
		}, style),
		target,
		children: props.children
	}));
});
Link.displayName = "Link";

//#endregion
//#region ../../node_modules/.bun/@react-email+row@0.0.12+6ccf2a00d98a8a5e/node_modules/@react-email/row/dist/index.mjs
var __defProp$2 = Object.defineProperty;
var __defProps$2 = Object.defineProperties;
var __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$2 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$2.call(b, prop)) __defNormalProp$2(a, prop, b[prop]);
	if (__getOwnPropSymbols$2) {
		for (var prop of __getOwnPropSymbols$2(b)) if (__propIsEnum$2.call(b, prop)) __defNormalProp$2(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
var __objRest$2 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$2.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$2) {
		for (var prop of __getOwnPropSymbols$2(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$2.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Row = React$1.forwardRef((_a, ref) => {
	var _b = _a, { children, style } = _b;
	return /* @__PURE__ */ jsx("table", __spreadProps$2(__spreadValues$2({
		align: "center",
		width: "100%",
		border: 0,
		cellPadding: "0",
		cellSpacing: "0",
		role: "presentation"
	}, __objRest$2(_b, ["children", "style"])), {
		ref,
		style,
		children: /* @__PURE__ */ jsx("tbody", {
			style: { width: "100%" },
			children: /* @__PURE__ */ jsx("tr", {
				style: { width: "100%" },
				children
			})
		})
	}));
});
Row.displayName = "Row";

//#endregion
//#region ../../node_modules/.bun/@react-email+section@0.0.16+6ccf2a00d98a8a5e/node_modules/@react-email/section/dist/index.mjs
var __defProp$1 = Object.defineProperty;
var __defProps$1 = Object.defineProperties;
var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues$1 = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp$1.call(b, prop)) __defNormalProp$1(a, prop, b[prop]);
	if (__getOwnPropSymbols$1) {
		for (var prop of __getOwnPropSymbols$1(b)) if (__propIsEnum$1.call(b, prop)) __defNormalProp$1(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
var __objRest$1 = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp$1.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols$1) {
		for (var prop of __getOwnPropSymbols$1(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum$1.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var Section = React$1.forwardRef((_a, ref) => {
	var _b = _a, { children, style } = _b;
	return /* @__PURE__ */ jsx("table", __spreadProps$1(__spreadValues$1({
		align: "center",
		width: "100%",
		border: 0,
		cellPadding: "0",
		cellSpacing: "0",
		role: "presentation"
	}, __objRest$1(_b, ["children", "style"])), {
		ref,
		style,
		children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { children }) }) })
	}));
});
Section.displayName = "Section";

//#endregion
//#region ../../node_modules/.bun/@react-email+text@0.1.5+6ccf2a00d98a8a5e/node_modules/@react-email/text/dist/index.mjs
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
	if (__getOwnPropSymbols) {
		for (var prop of __getOwnPropSymbols(b)) if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols) {
		for (var prop of __getOwnPropSymbols(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
function parseMarginValue(value) {
	if (typeof value === "number") return {
		marginTop: value,
		marginBottom: value,
		marginLeft: value,
		marginRight: value
	};
	if (typeof value === "string") {
		const values = value.toString().trim().split(/\s+/);
		if (values.length === 1) return {
			marginTop: values[0],
			marginBottom: values[0],
			marginLeft: values[0],
			marginRight: values[0]
		};
		if (values.length === 2) return {
			marginTop: values[0],
			marginRight: values[1],
			marginBottom: values[0],
			marginLeft: values[1]
		};
		if (values.length === 3) return {
			marginTop: values[0],
			marginRight: values[1],
			marginBottom: values[2],
			marginLeft: values[1]
		};
		if (values.length === 4) return {
			marginTop: values[0],
			marginRight: values[1],
			marginBottom: values[2],
			marginLeft: values[3]
		};
	}
	return {
		marginTop: void 0,
		marginBottom: void 0,
		marginLeft: void 0,
		marginRight: void 0
	};
}
function computeMargins(properties) {
	let result = {
		marginTop: void 0,
		marginRight: void 0,
		marginBottom: void 0,
		marginLeft: void 0
	};
	for (const [key, value] of Object.entries(properties)) if (key === "margin") result = parseMarginValue(value);
	else if (key === "marginTop") result.marginTop = value;
	else if (key === "marginRight") result.marginRight = value;
	else if (key === "marginBottom") result.marginBottom = value;
	else if (key === "marginLeft") result.marginLeft = value;
	return result;
}
var Text = React$1.forwardRef((_a, ref) => {
	var _b = _a, { style } = _b, props = __objRest(_b, ["style"]);
	const defaultMargins = {};
	if ((style == null ? void 0 : style.marginTop) === void 0) defaultMargins.marginTop = "16px";
	if ((style == null ? void 0 : style.marginBottom) === void 0) defaultMargins.marginBottom = "16px";
	const margins = computeMargins(__spreadValues(__spreadValues({}, defaultMargins), style));
	return /* @__PURE__ */ jsx("p", __spreadProps(__spreadValues({}, props), {
		ref,
		style: __spreadValues(__spreadValues({
			fontSize: "14px",
			lineHeight: "24px"
		}, style), margins)
	}));
});
Text.displayName = "Text";

//#endregion
//#region ../../packages/react-email-starter/emails/components/shared-styles.ts
const emailStyles = {
	main: {
		backgroundColor: "#f6f9fc",
		padding: "10px 0"
	},
	container: {
		backgroundColor: "#ffffff",
		border: "1px solid #f0f0f0",
		padding: "45px"
	},
	text: {
		fontSize: "16px",
		fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		fontWeight: "500",
		color: "#404040",
		lineHeight: "26px"
	},
	button: {
		backgroundColor: "#38b6ff",
		borderRadius: "4px",
		color: "#fff",
		fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		fontSize: "15px",
		fontWeight: "bold",
		textDecoration: "none",
		textAlign: "center",
		display: "block",
		width: "210px",
		padding: "14px 7px",
		margin: "0 auto"
	},
	anchor: { textDecoration: "underline" },
	salutation: {
		fontSize: "16px",
		fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		fontWeight: "500",
		color: "#404040",
		lineHeight: "26px",
		marginTop: "24px",
		marginBottom: "8px"
	},
	signature: {
		fontSize: "16px",
		fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		fontWeight: "500",
		color: "#404040",
		lineHeight: "26px",
		marginBottom: "8px"
	},
	footerSection: {
		marginTop: "32px",
		paddingTop: "24px",
		borderTop: "1px solid #e5e7eb"
	},
	footerLeftColumn: {
		width: "50%",
		paddingRight: "40px"
	},
	footerRightColumn: {
		width: "50%",
		verticalAlign: "bottom"
	},
	footerCompanyName: {
		fontSize: "16px",
		fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		fontWeight: "600",
		color: "#111827",
		lineHeight: "24px",
		margin: "8px 0 4px 0"
	},
	footerTagline: {
		fontSize: "16px",
		fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		fontWeight: "400",
		color: "#6b7280",
		lineHeight: "24px",
		margin: "4px 0 0 0"
	},
	socialRow: {
		height: "44px",
		width: "56px",
		verticalAlign: "bottom",
		textAlign: "left"
	},
	socialColumn: { paddingRight: "8px" },
	footerAddress: {
		fontSize: "14px",
		fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		fontWeight: "500",
		color: "#6b7280",
		lineHeight: "20px",
		margin: "0 0 8px 0",
		textAlign: "left"
	},
	footerContact: {
		fontSize: "14px",
		fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		fontWeight: "500",
		color: "#6b7280",
		lineHeight: "20px",
		margin: "0 0 4px 0",
		textAlign: "left"
	}
};
const companyBranding = {
	logo: {
		src: "https://res.cloudinary.com/df5ntv9gb/image/upload/v1758621603/Nisc_Logo_Original_im5pgk.png",
		alt: "Nisc Cloud Limited",
		width: "175",
		height: "50"
	},
	footerLogo: {
		src: "https://res.cloudinary.com/df5ntv9gb/image/upload/v1758621603/Nisc_Logo_Original_im5pgk.png",
		alt: "Nisc Cloud Limited",
		height: "42"
	},
	name: "Nisc Cloud Limited",
	tagline: "Transforming Businesses to stand out and succeed",
	website: "https://www.nisccloud.com",
	email: "info@nisccloud.com",
	phone: "+254 748 777 666",
	address: "Applewood Adams Suite 805 - Ngong Road, Nairobi, Kenya",
	socialLinks: {
		facebook: "https://www.facebook.com/nisccloud",
		twitter: "https://www.twitter.com/nisccloud",
		instagram: "https://www.instagram.com/nisccloud"
	}
};

//#endregion
//#region ../../packages/react-email-starter/emails/components/EmailLayout.tsx
const EmailLayout = ({ children, preview }) => {
	return /* @__PURE__ */ jsxs(Html, { children: [/* @__PURE__ */ jsx(Head, {}), /* @__PURE__ */ jsxs(Body, {
		style: emailStyles.main,
		children: [preview && /* @__PURE__ */ jsx("div", {
			style: { display: "none" },
			children: preview
		}), /* @__PURE__ */ jsx(Container, {
			style: emailStyles.container,
			children
		})]
	})] });
};

//#endregion
//#region ../../packages/react-email-starter/emails/components/EmailHeader.tsx
const EmailHeader = ({ logoWidth = companyBranding.logo.width, logoHeight = companyBranding.logo.height }) => {
	return /* @__PURE__ */ jsx(Img, {
		src: companyBranding.logo.src,
		width: logoWidth,
		height: logoHeight,
		alt: companyBranding.logo.alt
	});
};

//#endregion
//#region ../../packages/react-email-starter/emails/components/EmailFooter.tsx
const EmailFooter = ({ showSocialLinks = true, customAddress, customEmail, customPhone }) => {
	const address = customAddress || companyBranding.address;
	const email = customEmail || companyBranding.email;
	const phone = customPhone || companyBranding.phone;
	return /* @__PURE__ */ jsx(Section, {
		style: emailStyles.footerSection,
		children: /* @__PURE__ */ jsxs(Row, { children: [/* @__PURE__ */ jsxs(Column, {
			style: emailStyles.footerLeftColumn,
			children: [/* @__PURE__ */ jsx(Img, {
				alt: companyBranding.footerLogo.alt,
				height: companyBranding.footerLogo.height,
				src: companyBranding.footerLogo.src
			}), /* @__PURE__ */ jsx(Text, {
				style: emailStyles.footerTagline,
				children: companyBranding.tagline
			})]
		}), /* @__PURE__ */ jsxs(Column, {
			align: "left",
			style: emailStyles.footerRightColumn,
			children: [/* @__PURE__ */ jsxs(Row, { children: [
				/* @__PURE__ */ jsx(Text, {
					style: emailStyles.footerAddress,
					children: address
				}),
				/* @__PURE__ */ jsx(Text, {
					style: emailStyles.footerContact,
					children: email
				}),
				/* @__PURE__ */ jsx(Text, {
					style: emailStyles.footerContact,
					children: phone
				})
			] }), showSocialLinks && /* @__PURE__ */ jsxs(Row, {
				style: emailStyles.socialRow,
				children: [
					/* @__PURE__ */ jsx(Column, {
						style: emailStyles.socialColumn,
						children: /* @__PURE__ */ jsx(Link, {
							href: companyBranding.socialLinks.facebook,
							children: /* @__PURE__ */ jsx(Img, {
								alt: "Facebook",
								height: "36",
								src: "https://react.email/static/facebook-logo.png",
								width: "36"
							})
						})
					}),
					/* @__PURE__ */ jsx(Column, {
						style: emailStyles.socialColumn,
						children: /* @__PURE__ */ jsx(Link, {
							href: companyBranding.socialLinks.twitter,
							children: /* @__PURE__ */ jsx(Img, {
								alt: "X",
								height: "36",
								src: "https://react.email/static/x-logo.png",
								width: "36"
							})
						})
					}),
					/* @__PURE__ */ jsx(Column, {
						style: emailStyles.socialColumn,
						children: /* @__PURE__ */ jsx(Link, {
							href: companyBranding.socialLinks.instagram,
							children: /* @__PURE__ */ jsx(Img, {
								alt: "Instagram",
								height: "36",
								src: "https://react.email/static/instagram-logo.png",
								width: "36"
							})
						})
					})
				]
			})]
		})] })
	});
};

//#endregion
//#region ../../packages/react-email-starter/emails/components/EmailText.tsx
const EmailText = ({ children, style }) => {
	return /* @__PURE__ */ jsx(Text, {
		style: {
			...emailStyles.text,
			...style
		},
		children
	});
};

//#endregion
//#region ../../packages/react-email-starter/emails/components/EmailButton.tsx
const EmailButton = ({ children, href, style }) => {
	return /* @__PURE__ */ jsx(Button, {
		style: {
			...emailStyles.button,
			...style
		},
		href,
		children
	});
};

//#endregion
//#region ../../packages/react-email-starter/emails/components/EmailLink.tsx
const EmailLink = ({ children, href, style }) => {
	return /* @__PURE__ */ jsx(Link, {
		style: {
			...emailStyles.anchor,
			...style
		},
		href,
		children
	});
};

//#endregion
//#region ../../packages/react-email-starter/emails/components/EmailSignature.tsx
const EmailSignature = ({ salutation = "Best regards,", signature = "The Nisc Cloud Team", website = "https://www.nisccloud.com" }) => {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(Text, {
			style: emailStyles.salutation,
			children: salutation
		}),
		/* @__PURE__ */ jsx(Text, {
			style: emailStyles.signature,
			children: signature
		}),
		/* @__PURE__ */ jsx(Text, {
			style: emailStyles.text,
			children: /* @__PURE__ */ jsx("a", {
				style: emailStyles.anchor,
				href: website,
				children: "www.nisccloud.com"
			})
		})
	] });
};

//#endregion
//#region ../../packages/react-email-starter/emails/reset-password.tsx
const ResetPasswordEmail = ({ userFirstname, resetPasswordLink }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: "Reset your password",
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Someone recently requested a password change for your Nisc Cloud account. If this was you, you can set a new password here:" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: resetPasswordLink || "#",
					children: "Reset password"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: "If you don't want to change your password or didn't request this, just ignore this message, no changes will be made to your account." }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"To keep your account secure, please don't forward this email to anyone. See our Help Center for",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: resetPasswordLink || "#",
						children: "more security tips."
					})
				] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
ResetPasswordEmail.PreviewProps = {
	userFirstname: "John Doe",
	resetPasswordLink: "https://www.nisccloud.com"
};

//#endregion
//#region ../../packages/react-email-starter/emails/password-reset-success.tsx
const PasswordResetSuccessEmail = ({ userFirstname, loginLink, supportEmail = "support@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: "Password reset successful",
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Your password has been successfully reset for your Nisc Cloud account. You can now log in using your new password." }),
				/* @__PURE__ */ jsx(EmailText, { children: "If you did not request this password change, please contact our support team immediately as your account may have been compromised." }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: loginLink || "https://app.nisccloud.com/login",
					children: "Log In to Your Account"
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Security Notice:" }), " If you did not make this change, please:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Contact us immediately at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Call our support team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Change your password again from a secure device" }),
				/* @__PURE__ */ jsx(EmailText, { children: "We take account security seriously and will help you secure your account immediately." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
PasswordResetSuccessEmail.PreviewProps = {
	userFirstname: "John Doe",
	loginLink: "https://app.nisccloud.com/login",
	supportEmail: "support@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/welcome-email.tsx
const WelcomeEmail = ({ userFirstname, loginLink }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: "Welcome to Nisc Cloud",
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Welcome to Nisc Cloud, ",
					userFirstname,
					"!"
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Thank you for joining our platform. We're excited to help you transform your business and stand out in the market." }),
				/* @__PURE__ */ jsx(EmailText, { children: "To get started, please log in to your account and complete your profile setup." }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: loginLink || "#",
					children: "Get Started"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: "If you have any questions, feel free to reach out to our support team. We're here to help!" }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
WelcomeEmail.PreviewProps = {
	userFirstname: "John Doe",
	loginLink: "https://app.nisccloud.com/login"
};

//#endregion
//#region ../../packages/react-email-starter/emails/security-alert.tsx
const SecurityAlertEmail = ({ userFirstname, resetPasswordLink, supportEmail = "security@nisccloud.com", supportPhone = "+254 748 777 666", suspiciousActivity = "password reset" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: "Security Alert - Unauthorized Account Activity",
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, {
					style: {
						color: "#dc2626",
						fontWeight: "bold"
					},
					children: "SECURITY ALERT"
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"We detected suspicious activity on your Nisc Cloud account. Someone recently requested a ",
					suspiciousActivity,
					" for your account."
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "If this was NOT you:" }), " Your account may have been compromised. Please take immediate action to secure your account."] }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: resetPasswordLink || "https://app.nisccloud.com/reset-password",
					children: "Secure My Account Now"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Immediate Actions Required:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "1. Change your password immediately using the button above" }),
				/* @__PURE__ */ jsx(EmailText, { children: "2. Enable two-factor authentication if not already enabled" }),
				/* @__PURE__ */ jsx(EmailText, { children: "3. Review your recent account activity" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"4. Contact our security team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Emergency Support:" }),
					" Call us immediately at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "We're monitoring your account and will help you secure it. If you initiated this action, you can safely ignore this alert." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
SecurityAlertEmail.PreviewProps = {
	userFirstname: "John Doe",
	resetPasswordLink: "https://app.nisccloud.com/reset-password",
	supportEmail: "security@nisccloud.com",
	supportPhone: "+254 748 777 666",
	suspiciousActivity: "password reset"
};

//#endregion
//#region ../../packages/react-email-starter/emails/domain-expiration-reminder.tsx
const DomainExpirationReminderEmail = ({ userFirstname, domainName = "example.com", expirationDate = "March 15, 2024", daysUntilExpiration = 30, renewalLink, supportEmail = "domains@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Domain ${domainName} expires in ${daysUntilExpiration} days`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"This is a friendly reminder that your domain ",
					/* @__PURE__ */ jsx("strong", { children: domainName }),
					"is set to expire on ",
					/* @__PURE__ */ jsx("strong", { children: expirationDate }),
					"(",
					daysUntilExpiration,
					" days from now)."
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "To ensure uninterrupted service for your website and email, please renew your domain before the expiration date." }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold"
							},
							children: "Domain Details:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Domain Name: ", domainName]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Expiration Date: ", expirationDate]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Days Remaining: ", daysUntilExpiration]
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What happens if you don't renew?" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Your website will become inaccessible" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Email services will stop working" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Your domain may become available for others to register" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Additional fees may apply for redemption after expiration" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: renewalLink || "https://app.nisccloud.com/domains/renew",
					children: "Renew Domain Now"
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Help?" }), " Our domain experts are here to assist you:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Email us at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Call our support team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "We recommend renewing your domain for multiple years to avoid future interruptions and often at a better rate." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
DomainExpirationReminderEmail.PreviewProps = {
	userFirstname: "John Doe",
	domainName: "example.com",
	expirationDate: "March 15, 2024",
	daysUntilExpiration: 30,
	renewalLink: "https://app.nisccloud.com/domains/renew",
	supportEmail: "domains@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/domain-expired.tsx
const DomainExpiredEmail = ({ userFirstname, domainName = "example.com", expirationDate = "March 15, 2024", daysSinceExpiration = 1, renewalLink, supportEmail = "domains@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `URGENT: Domain ${domainName} has expired`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", {
						style: { color: "#dc2626" },
						children: "URGENT NOTICE:"
					}),
					" Your domain",
					" ",
					/* @__PURE__ */ jsx("strong", { children: domainName }),
					" expired on ",
					/* @__PURE__ */ jsx("strong", { children: expirationDate }),
					"(",
					daysSinceExpiration,
					" day",
					daysSinceExpiration !== 1 ? "s" : "",
					" ago)."
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Your website and email services are currently unavailable due to this expiration. Immediate action is required to restore your services." }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#fef2f2",
						border: "2px solid #dc2626",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold",
								color: "#dc2626"
							},
							children: "Expired Domain Details:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Domain Name: ", domainName]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Expiration Date: ", expirationDate]
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "5px 0",
								color: "#dc2626",
								fontWeight: "bold"
							},
							children: "Status: EXPIRED"
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Immediate Impact:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Your website is no longer accessible" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Email services have been suspended" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• DNS services are no longer active" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Your domain is at risk of being released to the public" }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What you need to do:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Renew your domain immediately to restore services" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Check if additional redemption fees apply" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Update your DNS settings if needed after renewal" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: renewalLink || "https://app.nisccloud.com/domains/renew",
					style: {
						backgroundColor: "#dc2626",
						color: "#fff",
						textDecoration: "none",
						textAlign: "center",
						display: "block",
						width: "250px",
						padding: "16px 7px",
						margin: "0 auto",
						borderRadius: "4px",
						fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
						fontSize: "16px",
						fontWeight: "bold"
					},
					children: "RENEW DOMAIN NOW"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Important Timeline:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Days 1-30: Grace period (renewal at standard rate)" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Days 31-60: Redemption period (additional fees apply)" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• After 60 days: Domain may be released to public registration" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Immediate Assistance?" }), " Contact our domain specialists:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Email us at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Call our support team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "We understand the urgency and are here to help you restore your services as quickly as possible." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
DomainExpiredEmail.PreviewProps = {
	userFirstname: "John Doe",
	domainName: "example.com",
	expirationDate: "March 15, 2024",
	daysSinceExpiration: 1,
	renewalLink: "https://app.nisccloud.com/domains/renew",
	supportEmail: "domains@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/domain-redemption-period.tsx
const DomainRedemptionPeriodEmail = ({ userFirstname, domainName = "example.com", expirationDate = "March 15, 2024", daysInRedemption = 35, redemptionFee = "$80.00", renewalLink, supportEmail = "domains@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `FINAL CHANCE: Domain ${domainName} in redemption period`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", {
						style: { color: "#dc2626" },
						children: "FINAL CHANCE:"
					}),
					" Your domain",
					" ",
					/* @__PURE__ */ jsx("strong", { children: domainName }),
					" is now in the redemption period. This is your last opportunity to restore your domain before it becomes available for public registration."
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Your domain expired on ",
					/* @__PURE__ */ jsx("strong", { children: expirationDate }),
					" and has been in the redemption period for ",
					/* @__PURE__ */ jsxs("strong", { children: [daysInRedemption, " days"] }),
					"."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#fef2f2",
						border: "2px solid #dc2626",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold",
								color: "#dc2626"
							},
							children: "Redemption Period Details:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Domain Name: ", domainName]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Expiration Date: ", expirationDate]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Days in Redemption: ", daysInRedemption]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Redemption Fee: ", redemptionFee]
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "5px 0",
								color: "#dc2626",
								fontWeight: "bold"
							},
							children: "Status: REDEMPTION PERIOD"
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What is the Redemption Period?" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "The redemption period is a 30-day grace period after domain expiration where you can still restore your domain, but additional fees apply. After this period, your domain will be released and available for anyone to register." }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Time Remaining:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• You have approximately ",
					Math.max(0, 60 - daysInRedemption),
					" days left to restore your domain"
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• After the redemption period, your domain will be permanently lost" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Restoration requires payment of the redemption fee plus renewal fees" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: renewalLink || "https://app.nisccloud.com/domains/redeem",
					style: {
						backgroundColor: "#dc2626",
						color: "#fff",
						textDecoration: "none",
						textAlign: "center",
						display: "block",
						width: "280px",
						padding: "16px 7px",
						margin: "0 auto",
						borderRadius: "4px",
						fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
						fontSize: "16px",
						fontWeight: "bold"
					},
					children: "RESTORE DOMAIN NOW"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Restoration Costs:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Redemption Fee: ", redemptionFee] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Annual Renewal Fee: Standard renewal rate" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Total Cost: Redemption fee + renewal fee" }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Important Notes:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Restoration must be completed before the redemption period ends" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Once released, your domain may be registered by anyone" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• We cannot guarantee domain availability after release" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Consider registering alternative domains as backup" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Immediate Help?" }), " Contact our domain restoration specialists:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Email us at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Call our support team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "We strongly recommend acting quickly to restore your domain and avoid permanent loss." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
DomainRedemptionPeriodEmail.PreviewProps = {
	userFirstname: "John Doe",
	domainName: "example.com",
	expirationDate: "March 15, 2024",
	daysInRedemption: 35,
	redemptionFee: "$80.00",
	renewalLink: "https://app.nisccloud.com/domains/redeem",
	supportEmail: "domains@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/domain-renewal-success.tsx
const DomainRenewalSuccessEmail = ({ userFirstname, domainName = "example.com", renewalDate = "March 10, 2024", nextExpirationDate = "March 10, 2025", renewalPeriod = "1 year", amount = "$15.99", accountLink, supportEmail = "domains@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Domain ${domainName} successfully renewed`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Great news! Your domain ",
					/* @__PURE__ */ jsx("strong", { children: domainName }),
					" has been successfully renewed on ",
					/* @__PURE__ */ jsx("strong", { children: renewalDate }),
					"."
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Thank you for choosing Nisc Cloud for your domain services. Your domain is now secure and will remain active until ",
					/* @__PURE__ */ jsx("strong", { children: nextExpirationDate }),
					"."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f0fdf4",
						border: "2px solid #22c55e",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold",
								color: "#16a34a"
							},
							children: "Renewal Confirmation:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Domain Name: ", domainName]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Renewal Date: ", renewalDate]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Next Expiration: ", nextExpirationDate]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Renewal Period: ", renewalPeriod]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Amount Paid: ", amount]
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "5px 0",
								color: "#16a34a",
								fontWeight: "bold"
							},
							children: "Status: ACTIVE"
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What's Next?" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Your website and email services are fully operational" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• DNS settings remain unchanged" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• You can manage your domain settings anytime" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Consider enabling auto-renewal for future convenience" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: accountLink || "https://app.nisccloud.com/domains",
					children: "Manage Domain Settings"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Pro Tips for Domain Management:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Enable auto-renewal to avoid future expiration" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Keep your contact information up to date" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Consider multi-year renewals for better rates" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Set up domain monitoring for important domains" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Assistance?" }), " Our domain experts are here to help:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Email us at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Call our support team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "We appreciate your business and look forward to continuing to serve your domain management needs." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
DomainRenewalSuccessEmail.PreviewProps = {
	userFirstname: "John Doe",
	domainName: "example.com",
	renewalDate: "March 10, 2024",
	nextExpirationDate: "March 10, 2025",
	renewalPeriod: "1 year",
	amount: "$15.99",
	accountLink: "https://app.nisccloud.com/domains",
	supportEmail: "domains@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/domain-transfer-initiated.tsx
const DomainTransferInitiatedEmail = ({ userFirstname, domainName = "example.com", transferDate = "March 20, 2024", newRegistrar = "New Registrar Inc.", authorizationCode = "ABC123XYZ", transferLink, supportEmail = "domains@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Domain transfer initiated for ${domainName}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"A domain transfer has been initiated for ",
					/* @__PURE__ */ jsx("strong", { children: domainName }),
					" on",
					" ",
					/* @__PURE__ */ jsx("strong", { children: transferDate }),
					". The domain is being transferred to",
					" ",
					/* @__PURE__ */ jsx("strong", { children: newRegistrar }),
					"."
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "If you initiated this transfer, please complete the authorization process to proceed. If you did not request this transfer, please contact us immediately." }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold"
							},
							children: "Transfer Details:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Domain Name: ", domainName]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Transfer Date: ", transferDate]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["New Registrar: ", newRegistrar]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Authorization Code: ", authorizationCode]
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "5px 0",
								color: "#059669",
								fontWeight: "bold"
							},
							children: "Status: PENDING AUTHORIZATION"
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What happens next?" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• You will receive an authorization email from the new registrar" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Click the authorization link to approve the transfer" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• The transfer will complete within 5-7 days after authorization" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Your domain services will remain active during the transfer" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: transferLink || "https://app.nisccloud.com/domains/transfer",
					children: "View Transfer Status"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Important Information:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Keep your authorization code safe: ", authorizationCode] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Do not change nameservers during the transfer process" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Contact the new registrar if you don't receive authorization emails" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Transfers can be cancelled within 5 days if needed" }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "If you did NOT request this transfer:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Contact us immediately to cancel the transfer" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• This may indicate unauthorized access to your account" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• We can help secure your account and prevent future unauthorized transfers" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Assistance?" }), " Our domain specialists are here to help:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Email us at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Call our support team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "We're here to ensure your domain transfer process goes smoothly and securely." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
DomainTransferInitiatedEmail.PreviewProps = {
	userFirstname: "John Doe",
	domainName: "example.com",
	transferDate: "March 20, 2024",
	newRegistrar: "New Registrar Inc.",
	authorizationCode: "ABC123XYZ",
	transferLink: "https://app.nisccloud.com/domains/transfer",
	supportEmail: "domains@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/invoice-final-notice.tsx
const InvoiceFinalNoticeEmail = ({ userFirstname, invoiceNumber = "INV-2024-001", amount = "$299.00", dueDate = "January 15, 2024", daysOverdue = 15, downloadLink, paymentLink, supportEmail = "billing@nisccloud.com", supportPhone = "+254 748 777 666", suspensionDate = "February 1, 2024" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `FINAL NOTICE - Invoice ${invoiceNumber} - Service Suspension Imminent`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, {
					style: {
						color: "#dc2626",
						fontWeight: "bold",
						fontSize: "18px"
					},
					children: "FINAL NOTICE - IMMEDIATE ACTION REQUIRED"
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"This is your ",
					/* @__PURE__ */ jsx("strong", { children: "FINAL NOTICE" }),
					" regarding outstanding invoice",
					" ",
					/* @__PURE__ */ jsx("strong", { children: invoiceNumber }),
					" for ",
					/* @__PURE__ */ jsx("strong", { children: amount }),
					"."
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Invoice Details:" }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Invoice Number: ", invoiceNumber] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Amount Due: ", amount] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Due Date: ", dueDate] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Days Overdue: ", /* @__PURE__ */ jsxs("strong", {
					style: { color: "#dc2626" },
					children: [daysOverdue, " days"]
				})] }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsxs("strong", {
					style: { color: "#dc2626" },
					children: [
						"SERVICE SUSPENSION NOTICE: Your account will be suspended on ",
						suspensionDate,
						"if payment is not received by that date."
					]
				}) }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "REQUIRED ACTIONS:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "1. Process payment immediately to prevent service suspension" }),
				/* @__PURE__ */ jsx(EmailText, { children: "2. Download your invoice for your records" }),
				/* @__PURE__ */ jsx(EmailText, { children: "3. Contact our billing department if you need payment arrangements" }),
				/* @__PURE__ */ jsx(EmailText, { children: "4. Update your payment method if there are billing issues" }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						margin: "30px 0",
						textAlign: "center"
					},
					children: [/* @__PURE__ */ jsx(EmailButton, {
						href: paymentLink || "https://app.nisccloud.com/billing",
						style: {
							backgroundColor: "#dc2626",
							color: "#fff",
							textDecoration: "none",
							textAlign: "center",
							display: "block",
							width: "280px",
							padding: "16px 7px",
							margin: "0 auto 15px auto",
							borderRadius: "4px",
							fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
							fontSize: "16px",
							fontWeight: "bold"
						},
						children: "PROCESS PAYMENT NOW"
					}), /* @__PURE__ */ jsx(EmailButton, {
						href: downloadLink || "#",
						children: "Download Invoice"
					})]
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Billing Support:" }), " For immediate assistance with payment or to discuss payment arrangements, contact our billing department:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Email: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `mailto:${supportEmail}`,
					children: supportEmail
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Phone: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `tel:${supportPhone}`,
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", {
					style: { color: "#dc2626" },
					children: "IMPORTANT: Service suspension will result in immediate loss of access to all Nisc Cloud services. Please process payment immediately to prevent service disruption."
				}) }),
				/* @__PURE__ */ jsx(EmailText, { children: "We value your business and are committed to helping you maintain uninterrupted service. Please contact us immediately if you have any questions or need assistance with payment." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
InvoiceFinalNoticeEmail.PreviewProps = {
	userFirstname: "John Doe",
	invoiceNumber: "INV-2024-001",
	amount: "$299.00",
	dueDate: "January 15, 2024",
	daysOverdue: 15,
	downloadLink: "https://app.nisccloud.com/invoices/INV-2024-001/download",
	paymentLink: "https://app.nisccloud.com/billing/pay",
	supportEmail: "billing@nisccloud.com",
	supportPhone: "+254 748 777 666",
	suspensionDate: "February 1, 2024"
};

//#endregion
//#region ../../packages/react-email-starter/emails/invoice-overdue.tsx
const InvoiceOverdueEmail = ({ userFirstname, invoiceNumber = "INV-2024-001", amount = "$299.00", dueDate = "January 15, 2024", daysOverdue = 5, downloadLink, paymentLink, supportEmail = "billing@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Invoice ${invoiceNumber} is ${daysOverdue} days overdue`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"This is a friendly reminder that your invoice ",
					/* @__PURE__ */ jsx("strong", { children: invoiceNumber }),
					"for ",
					/* @__PURE__ */ jsx("strong", { children: amount }),
					" was due on ",
					/* @__PURE__ */ jsx("strong", { children: dueDate }),
					" and is now",
					" ",
					/* @__PURE__ */ jsxs("strong", {
						style: { color: "#dc2626" },
						children: [daysOverdue, " days overdue"]
					}),
					"."
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "To avoid any service interruptions, please process your payment as soon as possible." }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold"
							},
							children: "Invoice Details:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Invoice Number: ", invoiceNumber]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Amount Due: ", amount]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Due Date: ", dueDate]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "5px 0",
								color: "#dc2626",
								fontWeight: "bold"
							},
							children: ["Days Overdue: ", daysOverdue]
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What you can do:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Download your invoice for your records" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Log in to your account to view payment options" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Contact our billing team if you have any questions" }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						margin: "30px 0",
						textAlign: "center"
					},
					children: [
						/* @__PURE__ */ jsx(EmailButton, {
							href: downloadLink || "#",
							children: "Download Invoice"
						}),
						/* @__PURE__ */ jsx("div", { style: { margin: "15px 0" } }),
						/* @__PURE__ */ jsx(EmailButton, {
							href: paymentLink || "https://app.nisccloud.com/billing",
							style: {
								backgroundColor: "#059669",
								color: "#fff",
								textDecoration: "none",
								textAlign: "center",
								display: "block",
								width: "210px",
								padding: "14px 7px",
								margin: "0 auto",
								borderRadius: "4px",
								fontFamily: "'Inter', 'Inter Sans Serif', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
								fontSize: "15px",
								fontWeight: "bold"
							},
							children: "Pay Now"
						})
					]
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Help?" }), " If you're experiencing any issues with payment or have questions about this invoice, please don't hesitate to contact us:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Email us at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Call our billing team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "We're here to help and can work with you to resolve any payment concerns." }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Important:" }), " Continued non-payment may result in service suspension. Please contact us immediately if you need to discuss payment arrangements."] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
InvoiceOverdueEmail.PreviewProps = {
	userFirstname: "John Doe",
	invoiceNumber: "INV-2024-001",
	amount: "$299.00",
	dueDate: "January 15, 2024",
	daysOverdue: 5,
	downloadLink: "https://app.nisccloud.com/invoices/INV-2024-001/download",
	paymentLink: "https://app.nisccloud.com/billing/pay",
	supportEmail: "billing@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/invoice-delivery.tsx
const InvoiceDeliveryEmail = ({ customerName = "Valued Customer", invoiceNumber = "INV-001", issueDate = "January 1, 2024", dueDate = "January 15, 2024", totalAmount = "0.00", currency = "KES", services = [], supportEmail = "billing@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	const formattedAmount = `${currency} ${totalAmount}`;
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Invoice ${invoiceNumber} from Nisc Cloud Limited`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					customerName,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"You have received an invoice from ",
					/* @__PURE__ */ jsx("strong", { children: "Nisc Cloud Limited" }),
					" for the services provided."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								fontSize: "16px"
							},
							children: "Invoice Information:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Invoice Number:" }),
								" ",
								invoiceNumber
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Issue Date:" }),
								" ",
								issueDate
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Due Date:" }),
								" ",
								dueDate
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "8px 0",
								fontSize: "18px",
								fontWeight: "bold",
								color: "#059669"
							},
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Total Amount:" }),
								" ",
								formattedAmount
							]
						})
					]
				}),
				services.length > 0 && /* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#ffffff",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [/* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "0 0 15px 0",
							fontWeight: "bold"
						},
						children: "Services Included:"
					}), services.map((service, index) => /* @__PURE__ */ jsxs("div", {
						style: {
							marginBottom: "12px",
							paddingBottom: "12px",
							borderBottom: index < services.length - 1 ? "1px solid #e2e8f0" : "none"
						},
						children: [
							/* @__PURE__ */ jsx(EmailText, {
								style: {
									margin: "0 0 4px 0",
									fontWeight: "600"
								},
								children: service.name
							}),
							service.description && /* @__PURE__ */ jsx(EmailText, {
								style: {
									margin: "4px 0",
									color: "#64748b",
									fontSize: "14px"
								},
								children: service.description
							}),
							(service.quantity || service.price) && /* @__PURE__ */ jsxs(EmailText, {
								style: {
									margin: "4px 0",
									fontSize: "14px"
								},
								children: [
									service.quantity && `Quantity: ${service.quantity}`,
									service.quantity && service.price && " • ",
									service.price && `Price: ${service.price}`
								]
							})
						]
					}, index))]
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Invoice Attachment:" }), " Please find your detailed invoice attached to this email as a PDF document. You can download and save it for your records."] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Payment Instructions:" }), " Please review the payment details included in the attached invoice. If you have any questions about this invoice or need assistance with payment, please don't hesitate to contact us."] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Help?" }), " Our billing team is here to assist you:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Email: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `mailto:${supportEmail}`,
					children: supportEmail
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Phone: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `tel:${supportPhone}`,
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Thank you for choosing Nisc Cloud Limited. We appreciate your business." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
InvoiceDeliveryEmail.PreviewProps = {
	customerName: "John Doe",
	invoiceNumber: "INV-001",
	issueDate: "January 1, 2024",
	dueDate: "January 15, 2024",
	totalAmount: "29,999.00",
	currency: "KES",
	services: [
		{
			name: "Web Hosting Plan",
			description: "Premium hosting package with 24/7 support",
			quantity: 1,
			price: "KES 15,000.00"
		},
		{
			name: "Domain Registration",
			description: "Annual domain registration",
			quantity: 2,
			price: "KES 2,500.00"
		},
		{
			name: "SSL Certificate",
			description: "Standard SSL certificate",
			quantity: 1,
			price: "KES 12,499.00"
		}
	],
	supportEmail: "billing@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/invoice-success.tsx
const InvoiceSuccessEmail = ({ customerName = "Valued Customer", invoiceNumber = "INV-001", orderNumber, totalAmount = "0.00", currency = "KES", supportEmail = "accounts@nisccloud.com", supportPhone = "+254 748 777 666", invoiceLink }) => {
	const formattedAmount = `${currency} ${totalAmount}`;
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Your invoice ${invoiceNumber} from Nisc Cloud Limited`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					customerName,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Thank you for your order. This is the ",
					/* @__PURE__ */ jsx("strong", { children: "invoice" }),
					" for the service you ordered."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f0fdf4",
						border: "1px solid #86efac",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								fontSize: "16px",
								color: "#059669"
							},
							children: "Invoice attached"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Invoice Number:" }),
								" ",
								invoiceNumber
							]
						}),
						orderNumber && /* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Order Number:" }),
								" ",
								orderNumber
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "8px 0",
								fontSize: "16px",
								fontWeight: "bold",
								color: "#059669"
							},
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Total Amount:" }),
								" ",
								formattedAmount
							]
						})
					]
				}),
				invoiceLink && /* @__PURE__ */ jsxs(EmailText, { children: [
					"You can view the invoice in your dashboard:",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: invoiceLink,
						children: "View invoice in dashboard"
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Need help?" }),
					" Contact us at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					}),
					supportPhone && ` or ${supportPhone}`,
					"."
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Thank you for choosing Nisc Cloud Limited." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
InvoiceSuccessEmail.PreviewProps = {
	customerName: "John Doe",
	invoiceNumber: "INV-001",
	orderNumber: "NISC-00042",
	totalAmount: "29,999.00",
	currency: "KES",
	supportEmail: "accounts@nisccloud.com",
	supportPhone: "+254 748 777 666",
	invoiceLink: void 0
};

//#endregion
//#region ../../packages/react-email-starter/emails/quotation-delivery.tsx
const QuotationDeliveryEmail = ({ customerName = "Valued Customer", quotationNumber = "QUOT-0001", issueDate = "January 1, 2024", totalAmount = "0.00", currency = "KES", services = [], supportEmail = "billing@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	const formattedAmount = `${currency} ${totalAmount}`;
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Quotation ${quotationNumber} from Nisc Cloud Limited`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					customerName,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Please find your quotation from ",
					/* @__PURE__ */ jsx("strong", { children: "Nisc Cloud Limited" }),
					" for the services outlined below."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								fontSize: "16px"
							},
							children: "Quotation details"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Quotation number:" }),
								" ",
								quotationNumber
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Issue date:" }),
								" ",
								issueDate
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "8px 0",
								fontSize: "18px",
								fontWeight: "bold",
								color: "#059669"
							},
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Total amount:" }),
								" ",
								formattedAmount
							]
						})
					]
				}),
				services.length > 0 && /* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#ffffff",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [/* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "0 0 15px 0",
							fontWeight: "bold"
						},
						children: "Items quoted"
					}), services.map((service, index) => /* @__PURE__ */ jsxs("div", {
						style: {
							marginBottom: "12px",
							paddingBottom: "12px",
							borderBottom: index < services.length - 1 ? "1px solid #e2e8f0" : "none"
						},
						children: [
							/* @__PURE__ */ jsx(EmailText, {
								style: {
									margin: "0 0 4px 0",
									fontWeight: "600"
								},
								children: service.name
							}),
							service.description && /* @__PURE__ */ jsx(EmailText, {
								style: {
									margin: "4px 0",
									color: "#64748b",
									fontSize: "14px"
								},
								children: service.description
							}),
							(service.quantity || service.price) && /* @__PURE__ */ jsxs(EmailText, {
								style: {
									margin: "4px 0",
									fontSize: "14px"
								},
								children: [
									service.quantity != null && `Quantity: ${service.quantity}`,
									service.quantity != null && service.price && " • ",
									service.price && `Price: ${service.price}`
								]
							})
						]
					}, index))]
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Quotation attachment:" }), " Your detailed quotation is attached to this email as a PDF. You can download and save it for your records."] }),
				/* @__PURE__ */ jsx(EmailText, { children: "If you have any questions or would like to proceed, please contact us:" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Email:",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Phone: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `tel:${supportPhone}`,
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Thank you for your interest. We look forward to working with you." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
QuotationDeliveryEmail.PreviewProps = {
	customerName: "John Doe",
	quotationNumber: "QUOT-0001",
	issueDate: "January 1, 2024",
	totalAmount: "29,999.00",
	currency: "KES",
	services: [{
		name: "Web Hosting Plan",
		description: "Premium hosting package",
		quantity: 1,
		price: "KES 15,000.00"
	}, {
		name: "Domain Registration",
		quantity: 2,
		price: "KES 2,500.00"
	}],
	supportEmail: "billing@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/service-restoration-confirmation.tsx
const ServiceRestorationConfirmationEmail = ({ userFirstname, accountId = "ACC-2024-001", restorationDate = "March 20, 2024", serviceName = "Web Hosting", planName = "Business Plan", domain = "example.com", accountLink, supportEmail = "support@nisccloud.com", supportPhone = "+254 748 777 666", nextBillingDate = "April 20, 2024" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Services Restored - Account ${accountId}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, {
					style: {
						color: "#16a34a",
						fontWeight: "bold",
						fontSize: "18px"
					},
					children: "SERVICES SUCCESSFULLY RESTORED"
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Great news! Your ",
					/* @__PURE__ */ jsx("strong", { children: serviceName }),
					" service has been successfully restored as of ",
					/* @__PURE__ */ jsx("strong", { children: restorationDate }),
					"."
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Your account ",
					/* @__PURE__ */ jsx("strong", { children: accountId }),
					" remains active and this service is now fully operational."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f0fdf4",
						border: "2px solid #22c55e",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								color: "#16a34a"
							},
							children: "RESTORED SERVICE:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "5px 0",
								fontWeight: "bold"
							},
							children: [
								serviceName,
								" - ",
								planName
							]
						}),
						domain && /* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "2px 0 0 20px",
								color: "#6b7280"
							},
							children: ["Domain: ", domain]
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "10px 0 0 0",
								color: "#16a34a",
								fontWeight: "bold"
							},
							children: "Status: ACTIVE"
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsxs("strong", { children: [
					"What's Now Available with ",
					serviceName,
					":"
				] }) }),
				serviceName === "Web Hosting" && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx(EmailText, { children: "• Your website is accessible to visitors" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• All hosting resources are online" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• Database connections are active" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• SSL certificates are renewed and active" })
				] }),
				serviceName === "Email Hosting" && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx(EmailText, { children: "• Email services are fully functional" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• Email accounts are accessible" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• Email forwarding is active" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• Email storage is fully available" })
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Next Steps:" }) }),
				serviceName === "Web Hosting" && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx(EmailText, { children: "1. Test your website functionality" }),
					/* @__PURE__ */ jsx(EmailText, { children: "2. Update any DNS settings if needed" }),
					/* @__PURE__ */ jsx(EmailText, { children: "3. Verify SSL certificate is working" }),
					/* @__PURE__ */ jsx(EmailText, { children: "4. Check database connections" })
				] }),
				serviceName === "Email Hosting" && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx(EmailText, { children: "1. Test your email functionality" }),
					/* @__PURE__ */ jsx(EmailText, { children: "2. Verify email accounts are working" }),
					/* @__PURE__ */ jsx(EmailText, { children: "3. Check email forwarding settings" }),
					/* @__PURE__ */ jsx(EmailText, { children: "4. Test email storage access" })
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "5. Review your account settings and billing information" }),
				/* @__PURE__ */ jsx(EmailText, { children: "6. Consider enabling auto-renewal to prevent future suspensions" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: accountLink || "https://app.nisccloud.com/dashboard",
					children: "Access Your Account"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Important Reminders:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Next billing date: ", nextBillingDate] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Keep your payment method up to date" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Monitor your account for any issues" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Contact support if you need assistance" }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Prevent Future Suspensions:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Enable auto-renewal for all services" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Set up payment notifications" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Monitor your account regularly" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Keep contact information current" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Assistance?" }), " Our support team is here to help:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Email: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `mailto:${supportEmail}`,
					children: supportEmail
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Phone: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `tel:${supportPhone}`,
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Live Chat: Available 24/7 in your account dashboard" }),
				/* @__PURE__ */ jsx(EmailText, { children: "Thank you for choosing Nisc Cloud. We appreciate your business and are committed to providing reliable cloud services for your needs." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
ServiceRestorationConfirmationEmail.PreviewProps = {
	userFirstname: "John Doe",
	accountId: "ACC-2024-001",
	restorationDate: "March 20, 2024",
	serviceName: "Web Hosting",
	planName: "Business Plan",
	domain: "example.com",
	accountLink: "https://app.nisccloud.com/dashboard",
	supportEmail: "support@nisccloud.com",
	supportPhone: "+254 748 777 666",
	nextBillingDate: "April 20, 2024"
};

//#endregion
//#region ../../packages/react-email-starter/emails/service-suspension.tsx
const ServiceSuspensionEmail = ({ userFirstname, accountId = "ACC-2024-001", suspensionDate = "March 20, 2024", suspensionReason = "Payment Overdue", serviceName = "Web Hosting", planName = "Business Plan", domain = "example.com", supportEmail = "billing@nisccloud.com", supportPhone = "+254 748 777 666", reactivationFee = "$25.00" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `SERVICE SUSPENDED - Account ${accountId}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, {
					style: {
						color: "#dc2626",
						fontWeight: "bold",
						fontSize: "18px"
					},
					children: "SERVICE SUSPENSION NOTICE"
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"We regret to inform you that your ",
					/* @__PURE__ */ jsx("strong", { children: serviceName }),
					" service has been suspended as of ",
					/* @__PURE__ */ jsx("strong", { children: suspensionDate }),
					" due to",
					" ",
					/* @__PURE__ */ jsx("strong", { children: suspensionReason }),
					"."
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Your account ",
					/* @__PURE__ */ jsx("strong", { children: accountId }),
					" remains active, but this specific service is currently unavailable."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#fef2f2",
						border: "2px solid #dc2626",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								color: "#dc2626"
							},
							children: "SUSPENDED SERVICE:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "5px 0",
								fontWeight: "bold"
							},
							children: [
								serviceName,
								" - ",
								planName
							]
						}),
						domain && /* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "2px 0 0 20px",
								color: "#6b7280"
							},
							children: ["Domain: ", domain]
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "10px 0 0 0",
								color: "#dc2626",
								fontWeight: "bold"
							},
							children: "Status: SUSPENDED"
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsxs("strong", { children: [
					"Impact of ",
					serviceName,
					" Suspension:"
				] }) }),
				serviceName === "Web Hosting" && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx(EmailText, { children: "• Your website is no longer accessible to visitors" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• All hosting resources are offline" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• Database connections are terminated" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• SSL certificates are no longer active" })
				] }),
				serviceName === "Email Hosting" && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx(EmailText, { children: "• Email services have been disabled" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• Email accounts are inaccessible" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• Email forwarding is suspended" }),
					/* @__PURE__ */ jsx(EmailText, { children: "• Email storage is temporarily unavailable" })
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsxs("strong", { children: [
					"To Restore Your ",
					serviceName,
					":"
				] }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "1. Process payment for outstanding invoices" }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["2. Pay reactivation fee: ", reactivationFee] }),
				/* @__PURE__ */ jsx(EmailText, { children: "3. Update payment method if needed" }),
				/* @__PURE__ */ jsx(EmailText, { children: "4. Contact support for assistance with restoration" }),
				/* @__PURE__ */ jsx("div", {
					style: {
						margin: "30px 0",
						textAlign: "center"
					},
					children: /* @__PURE__ */ jsx(EmailButton, {
						href: "https://app.nisccloud.com/billing",
						children: "View Billing Details"
					})
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Reactivation Process:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Payment processing: 1-2 hours" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Service restoration: 2-4 hours" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• DNS propagation: Up to 24 hours" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Full functionality: Within 24 hours" }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Important Information:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Your ",
					serviceName,
					" data is preserved during suspension"
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Backup services remain active for 30 days" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Reactivation fee applies to suspended services" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Service will be permanently deleted after 60 days" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Immediate Assistance?" }), " Contact our support team:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Email: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `mailto:${supportEmail}`,
					children: supportEmail
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Phone: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `tel:${supportPhone}`,
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Live Chat: Available 24/7 in your account dashboard" }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsxs("strong", {
					style: { color: "#dc2626" },
					children: [
						"URGENT: We strongly recommend immediate action to restore your ",
						serviceName,
						"and prevent permanent data loss."
					]
				}) }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"We understand the impact this suspension has on your business and are committed to helping you restore your ",
					serviceName,
					" as quickly as possible."
				] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
ServiceSuspensionEmail.PreviewProps = {
	userFirstname: "John Doe",
	accountId: "ACC-2024-001",
	suspensionDate: "March 20, 2024",
	suspensionReason: "Payment Overdue",
	serviceName: "Web Hosting",
	planName: "Business Plan",
	domain: "example.com",
	paymentLink: "https://app.nisccloud.com/billing/pay",
	supportEmail: "billing@nisccloud.com",
	supportPhone: "+254 748 777 666",
	reactivationFee: "$25.00"
};

//#endregion
//#region ../../packages/react-email-starter/emails/service-renewal-reminder.tsx
const ServiceRenewalReminderEmail = ({ recipientName, serviceName = "Service", subscriptionName, subscriptionDate = "—", expiryDate = "—", gracePeriodText = "Your service will be suspended 7 days after the expiry date if not renewed.", supportEmail = "support@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Renewal reminder: ${subscriptionName || serviceName}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello",
					recipientName ? ` ${recipientName}` : "",
					","
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "This is a reminder that your subscription is approaching or has reached its expiry date." }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold"
							},
							children: "Subscription details"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Service: ", serviceName]
						}),
						subscriptionName && /* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Name: ", subscriptionName]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Subscription date: ", subscriptionDate]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Expiry date: ", expiryDate]
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: gracePeriodText }),
				/* @__PURE__ */ jsx(EmailText, { children: "To renew your service, please log in to the panel." }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need help?" }), " Contact us:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Email: ", /* @__PURE__ */ jsx("a", {
					href: `mailto:${supportEmail}`,
					style: { color: "#38b6ff" },
					children: supportEmail
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Phone: ", /* @__PURE__ */ jsx("a", {
					href: `tel:${supportPhone}`,
					style: { color: "#38b6ff" },
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
ServiceRenewalReminderEmail.PreviewProps = {
	recipientName: "Customer",
	serviceName: "Domains",
	subscriptionName: "example.com",
	subscriptionDate: "15 Jan 2024",
	expiryDate: "15 Jan 2025",
	gracePeriodText: "For domain services, suspension is immediate after expiry."
};

//#endregion
//#region ../../packages/react-email-starter/emails/domain-auto-renewal-reminder.tsx
const DomainAutoRenewalReminderEmail = ({ userFirstname, domainName = "example.com", renewalDate = "March 15, 2024", renewalAmount = "$15.99", paymentMethod = "Visa ending in 1234", settingsLink, supportEmail = "domains@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Auto-renewal reminder for ${domainName}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"This is a friendly reminder that your domain ",
					/* @__PURE__ */ jsx("strong", { children: domainName }),
					"is set to auto-renew on ",
					/* @__PURE__ */ jsx("strong", { children: renewalDate }),
					"."
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"The renewal fee of ",
					/* @__PURE__ */ jsx("strong", { children: renewalAmount }),
					" will be automatically charged to your payment method on file."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f0f9ff",
						border: "1px solid #0ea5e9",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold",
								color: "#0369a1"
							},
							children: "Auto-Renewal Details:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Domain Name: ", domainName]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Renewal Date: ", renewalDate]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Renewal Amount: ", renewalAmount]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "5px 0" },
							children: ["Payment Method: ", paymentMethod]
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "5px 0",
								color: "#0369a1",
								fontWeight: "bold"
							},
							children: "Status: AUTO-RENEWAL ENABLED"
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What happens with auto-renewal?" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Your domain will be automatically renewed before expiration" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Payment will be processed using your saved payment method" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• You'll receive a confirmation email after successful renewal" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• No action is required on your part" }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Want to make changes?" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Update your payment method if needed" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Change renewal period (1, 2, or 3 years)" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Disable auto-renewal if you prefer manual renewal" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Review your domain settings and DNS configuration" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: settingsLink || "https://app.nisccloud.com/domains/settings",
					children: "Manage Auto-Renewal Settings"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Benefits of Auto-Renewal:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Never worry about domain expiration" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Avoid service interruptions" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Save time with automatic processing" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Often receive better renewal rates" }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Payment Information:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• We'll charge ",
					renewalAmount,
					" to ",
					paymentMethod
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Payment will be processed on ", renewalDate] }),
				/* @__PURE__ */ jsx(EmailText, { children: "• You'll receive a receipt via email" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Update payment method anytime before renewal" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Questions about Auto-Renewal?" }), " Contact our support team:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Email us at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `mailto:${supportEmail}`,
						children: supportEmail
					})
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"• Call our support team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: `tel:${supportPhone}`,
						children: supportPhone
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Thank you for choosing Nisc Cloud for your domain management needs." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
DomainAutoRenewalReminderEmail.PreviewProps = {
	userFirstname: "John Doe",
	domainName: "example.com",
	renewalDate: "March 15, 2024",
	renewalAmount: "$15.99",
	paymentMethod: "Visa ending in 1234",
	settingsLink: "https://app.nisccloud.com/domains/settings",
	supportEmail: "domains@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/team-invite.tsx
const TeamInviteEmail = ({ inviterName, teamName, teamRole = "Member", acceptInviteLink, expiresInDays = 7 }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `You've been invited to join ${teamName} on npanel`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, { children: "Hello," }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					inviterName,
					" has invited you to join ",
					/* @__PURE__ */ jsx("strong", { children: teamName }),
					" on npanel as a ",
					teamRole,
					"."
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "npanel is Nisc Cloud's comprehensive management platform for your cloud services. It helps teams manage domains, hosting services, WordPress installations, and all your Nisc Cloud resources from one centralized dashboard." }),
				/* @__PURE__ */ jsx(EmailText, { children: "By accepting this invitation, you will be able to:" }),
				/* @__PURE__ */ jsxs(EmailText, {
					style: {
						marginLeft: "20px",
						lineHeight: "1.8"
					},
					children: [
						"• Collaborate with your team members",
						/* @__PURE__ */ jsx("br", {}),
						"• Access and manage team resources",
						/* @__PURE__ */ jsx("br", {}),
						"• View invoices and billing information",
						/* @__PURE__ */ jsx("br", {}),
						"• Manage domains and hosting services",
						/* @__PURE__ */ jsx("br", {}),
						"• Monitor team activity and usage"
					]
				}),
				/* @__PURE__ */ jsx(EmailButton, {
					href: acceptInviteLink || "#",
					children: "Accept Invitation"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: "Or copy and paste this link into your browser:" }),
				/* @__PURE__ */ jsx(EmailText, {
					style: {
						wordBreak: "break-all",
						color: "#666",
						fontSize: "14px",
						backgroundColor: "#f4f4f4",
						padding: "10px",
						borderRadius: "4px"
					},
					children: acceptInviteLink
				}),
				/* @__PURE__ */ jsxs(EmailText, {
					style: {
						color: "#666",
						fontSize: "14px"
					},
					children: [
						"This invitation will expire in ",
						expiresInDays,
						" days. If you don't accept it by then, you'll need to request a new invitation from ",
						inviterName,
						"."
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: "If you weren't expecting this invitation or don't want to join this team, you can safely ignore this email. No account will be created without your consent." }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"If you have any questions about this invitation, please contact ",
					inviterName,
					" directly or reach out to our support team at",
					" ",
					/* @__PURE__ */ jsx(EmailLink, {
						href: "mailto:support@nisccloud.com",
						children: "support@nisccloud.com"
					}),
					"."
				] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
TeamInviteEmail.PreviewProps = {
	invitedUserEmail: "john.doe@example.com",
	inviterName: "Jane Smith",
	teamName: "Acme Corporation",
	teamRole: "Member",
	acceptInviteLink: "https://app.nisccloud.com/accept-invite?code=abc123xyz",
	expiresInDays: 7
};

//#endregion
//#region ../../packages/react-email-starter/emails/account-created-email.tsx
const AccountCreatedEmail = ({ userFirstname, email, password, loginLink }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: "Your account has been created - Nisc Cloud",
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "An account has been created for you on Nisc Cloud. You can now access your dashboard and manage your services." }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Your login credentials:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Email:" }),
					" ",
					email
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Password:" }),
					" ",
					password
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "You can log in to your account using the button below:" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: loginLink || "#",
					children: "Log in to Dashboard"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Important Security Notice:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "For security purposes, we strongly recommend that you change your password to a secure one of your choice after your first login." }),
				/* @__PURE__ */ jsx(EmailText, { children: "If you have any questions or need assistance, feel free to reach out to our support team. We're here to help!" }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
AccountCreatedEmail.PreviewProps = {
	userFirstname: "John Doe",
	email: "john.doe@example.com",
	password: "TempPassword123!",
	loginLink: "https://app.nisccloud.com/login"
};

//#endregion
//#region ../../packages/react-email-starter/emails/agency-user-created-email.tsx
const AgencyUserCreatedEmail = ({ userFirstname, email, password, role, loginLink }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: "Your agency account has been created - Nisc Cloud",
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hello ",
					userFirstname,
					","
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "An agency user account has been created for you on Nisc Cloud. You now have access to the agency dashboard where you can manage clients, services, and team resources." }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Your account details:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Email:" }),
					" ",
					email
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Password:" }),
					" ",
					password
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Role:" }),
					" ",
					role
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "You can log in to your agency dashboard using the button below:" }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: loginLink || "#",
					children: "Log in to Agency Dashboard"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Important Security Notice:" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "For security purposes, we strongly recommend that you change your password to a secure one of your choice after your first login." }),
				/* @__PURE__ */ jsx(EmailText, { children: "As an agency user, you have access to various administrative functions. If you have any questions about your role or permissions, please contact your administrator." }),
				/* @__PURE__ */ jsx(EmailText, { children: "If you have any questions or need assistance, feel free to reach out to our support team. We're here to help!" }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
AgencyUserCreatedEmail.PreviewProps = {
	userFirstname: "Jane Smith",
	email: "jane.smith@agency.com",
	password: "TempPassword123!",
	role: "AGENCY_USER",
	loginLink: "https://app.nisccloud.com/login"
};

//#endregion
//#region ../../packages/react-email-starter/emails/order-received-email.tsx
const OrderReceivedEmail = ({ customerName = "Valued Customer", orderNumber = "ORD-001", orderDate = "January 1, 2024", totalAmount = "0.00", currency = "KES", orderItems = [], supportEmail = "support@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	const formattedAmount = `${currency} ${totalAmount}`;
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Order Received - ${orderNumber}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					customerName,
					","
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "We have received your order and payment. Here are the details:" }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								fontSize: "16px"
							},
							children: "Order Information:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Order Number:" }),
								" ",
								orderNumber
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Order Date & Time:" }),
								" ",
								orderDate
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "8px 0",
								fontSize: "18px",
								fontWeight: "bold",
								color: "#059669"
							},
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Total Amount:" }),
								" ",
								formattedAmount
							]
						})
					]
				}),
				orderItems.length > 0 && /* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#ffffff",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [/* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "0 0 15px 0",
							fontWeight: "bold"
						},
						children: "Order Items:"
					}), orderItems.map((item, index) => /* @__PURE__ */ jsxs("div", {
						style: {
							marginBottom: "12px",
							paddingBottom: "12px",
							borderBottom: index < orderItems.length - 1 ? "1px solid #e2e8f0" : "none"
						},
						children: [
							/* @__PURE__ */ jsx(EmailText, {
								style: {
									margin: "0 0 4px 0",
									fontWeight: 600
								},
								children: item.name
							}),
							item.description && /* @__PURE__ */ jsx(EmailText, {
								style: {
									margin: "4px 0",
									color: "#64748b",
									fontSize: "14px"
								},
								children: item.description
							}),
							(item.quantity || item.price) && /* @__PURE__ */ jsxs(EmailText, {
								style: {
									margin: "4px 0",
									fontSize: "14px",
									color: "#64748b"
								},
								children: [
									item.quantity && `Qty: ${item.quantity}`,
									item.quantity && item.price && " • ",
									item.price && `Price: ${item.price}`
								]
							})
						]
					}, index))]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: "You will receive another email once your order has been fully processed and your services have been provisioned." }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Help?" }), " Our support team is here to assist you:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Email: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `mailto:${supportEmail}`,
					children: supportEmail
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Phone: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `tel:${supportPhone}`,
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Thank you for choosing ",
					/* @__PURE__ */ jsx("strong", { children: "Nisc Cloud Limited" }),
					". We appreciate your business!"
				] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
OrderReceivedEmail.PreviewProps = {
	customerName: "Finey Otieno Akwoyo",
	orderNumber: "NISC-2026-034438-309",
	orderDate: "2026-02-25 10:30 AM",
	totalAmount: "2,194.02",
	currency: "KES",
	orderItems: [{
		name: "heliumcreations.com",
		description: "Domain transfer",
		quantity: 1,
		price: "2,194.02 KES"
	}],
	supportEmail: "support@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/order-failed-email.tsx
const OrderFailedEmail = ({ customerName = "Admin", orderNumber = "NISC-000000-000000-000", failedItems = [], failureReason, retryLink = "https://app.nisccloud.com/agency/nisc-service-orders", supportEmail = "support@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `[NISC Admin] Order could not be completed: ${orderNumber}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Hi ",
					customerName,
					","
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "A NISC service order could not be fully processed and requires attention." }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#fef2f2",
						border: "1px solid #fecaca",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [/* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "0 0 15px 0",
							fontWeight: "bold",
							fontSize: "18px",
							color: "#b91c1c"
						},
						children: "Order could not be completed"
					}), /* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "8px 0",
							color: "#991b1b"
						},
						children: "One or more items failed during provisioning. Review the details below and retry from the NISC Service Orders page if needed."
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								fontSize: "16px"
							},
							children: "Order information"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Order number:" }),
								" ",
								orderNumber
							]
						}),
						failureReason && /* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "8px 0",
								color: "#b91c1c",
								fontWeight: "600"
							},
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Reason:" }),
								" ",
								failureReason
							]
						})
					]
				}),
				failedItems.length > 0 && /* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#ffffff",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [/* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "0 0 15px 0",
							fontWeight: "bold"
						},
						children: "Failed items"
					}), failedItems.map((item, index) => /* @__PURE__ */ jsxs("div", {
						style: {
							marginBottom: "12px",
							paddingBottom: "12px",
							borderBottom: index < failedItems.length - 1 ? "1px solid #e2e8f0" : "none"
						},
						children: [/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 4px 0",
								fontWeight: 600
							},
							children: item.name
						}), item.error && /* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "4px 0",
								color: "#b91c1c",
								fontSize: "14px"
							},
							children: item.error
						})]
					}, index))]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: "You can retry failed items from the NISC Service Orders page." }),
				/* @__PURE__ */ jsx(EmailButton, {
					href: retryLink,
					children: "Open NISC Service Orders"
				}),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Need help?" }),
					" Contact support: ",
					supportEmail,
					" / ",
					supportPhone
				] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
OrderFailedEmail.PreviewProps = {
	customerName: "Admin",
	orderNumber: "NISC-2026-034438-309",
	failedItems: [{
		name: "heliumcreations.com - Domain transfer",
		error: "Transfer auth code invalid"
	}, {
		name: "example.com - Web Hosting",
		error: "Domain is required for hosting"
	}],
	failureReason: "One or more items failed during provisioning.",
	retryLink: "https://app.nisccloud.com/agency/nisc-service-orders",
	supportEmail: "support@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/order-confirmation.tsx
const OrderConfirmationEmail = ({ customerName = "Valued Customer", orderNumber = "ORD-001", orderDate = "January 1, 2024", totalAmount = "0.00", currency = "KES", orderItems = [], supportEmail = "support@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	const formattedAmount = `${currency} ${totalAmount}`;
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Order Confirmation - ${orderNumber}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					customerName,
					","
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Thank you for your order! We're pleased to confirm that we have ",
					/* @__PURE__ */ jsx("strong", { children: "successfully received and allocated" }),
					" your order."
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f0fdf4",
						border: "1px solid #86efac",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [/* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "0 0 15px 0",
							fontWeight: "bold",
							fontSize: "18px",
							color: "#059669"
						},
						children: "✓ Order Confirmed & Allocated"
					}), /* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "8px 0",
							color: "#166534"
						},
						children: "Your order has been successfully processed and all services have been allocated to your account."
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								fontSize: "16px"
							},
							children: "Order Information:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Order Number:" }),
								" ",
								orderNumber
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Order Date:" }),
								" ",
								orderDate
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "8px 0",
								fontSize: "18px",
								fontWeight: "bold",
								color: "#059669"
							},
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Total Amount:" }),
								" ",
								formattedAmount
							]
						})
					]
				}),
				orderItems.length > 0 && /* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#ffffff",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [/* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "0 0 15px 0",
							fontWeight: "bold"
						},
						children: "Order Items:"
					}), orderItems.map((item, index) => /* @__PURE__ */ jsxs("div", {
						style: {
							marginBottom: "12px",
							paddingBottom: "12px",
							borderBottom: index < orderItems.length - 1 ? "1px solid #e2e8f0" : "none"
						},
						children: [
							/* @__PURE__ */ jsx(EmailText, {
								style: {
									margin: "0 0 4px 0",
									fontWeight: "600"
								},
								children: item.name
							}),
							item.description && /* @__PURE__ */ jsx(EmailText, {
								style: {
									margin: "4px 0",
									color: "#64748b",
									fontSize: "14px"
								},
								children: item.description
							}),
							/* @__PURE__ */ jsx("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginTop: "8px"
								},
								children: (item.quantity || item.price) && /* @__PURE__ */ jsxs(EmailText, {
									style: {
										margin: "4px 0",
										fontSize: "14px",
										color: "#64748b"
									},
									children: [
										item.quantity && `Qty: ${item.quantity}`,
										item.quantity && item.price && " • ",
										item.price && `Price: ${item.price}`
									]
								})
							})
						]
					}, index))]
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#eff6ff",
						border: "1px solid #bfdbfe",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 10px 0",
								fontWeight: "bold",
								fontSize: "16px",
								color: "#1e40af"
							},
							children: "Invoice Information"
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "8px 0",
								color: "#1e3a8a"
							},
							children: "You will receive a separate email with your detailed invoice for this order. The invoice will include:"
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "4px 0",
								color: "#1e3a8a",
								fontSize: "14px"
							},
							children: "• Complete breakdown of all charges"
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "4px 0",
								color: "#1e3a8a",
								fontSize: "14px"
							},
							children: "• Payment instructions and details"
						}),
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "4px 0",
								color: "#1e3a8a",
								fontSize: "14px"
							},
							children: "• PDF attachment for your records"
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What's Next?" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "• Your services are now active and ready to use" }),
				/* @__PURE__ */ jsx(EmailText, { children: "• You can manage your order and services through your account dashboard" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Help?" }), " Our support team is here to assist you:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Email: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `mailto:${supportEmail}`,
					children: supportEmail
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["• Phone: ", /* @__PURE__ */ jsx(EmailLink, {
					href: `tel:${supportPhone}`,
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Thank you for choosing ",
					/* @__PURE__ */ jsx("strong", { children: "Nisc Cloud Limited" }),
					". We appreciate your business and look forward to serving you!"
				] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
OrderConfirmationEmail.PreviewProps = {
	customerName: "John Doe",
	orderNumber: "ORD-2024-001",
	orderDate: "January 15, 2024",
	totalAmount: "29,999.00",
	currency: "KES",
	orderItems: [
		{
			name: "Web Hosting Plan - Premium",
			description: "Premium hosting package with 24/7 support and unlimited bandwidth",
			quantity: 1,
			price: "KES 15,000.00",
			status: "PROVISIONED"
		},
		{
			name: "Domain Registration - example.com",
			description: "Annual domain registration",
			quantity: 1,
			price: "KES 2,500.00",
			status: "PROVISIONED"
		},
		{
			name: "SSL Certificate - Standard",
			description: "Standard SSL certificate for secure connections",
			quantity: 1,
			price: "KES 12,499.00",
			status: "PROVISIONED"
		}
	],
	supportEmail: "support@nisccloud.com",
	supportPhone: "+254 748 777 666",
	orderLink: "https://app.nisccloud.com/orders/ORD-2024-001"
};

//#endregion
//#region ../../packages/react-email-starter/emails/payment-receipt.tsx
const PaymentReceiptEmail = ({ customerName = "Valued Customer", receiptNumber = "N/A", transactionDate = "N/A", amount = "0.00", currency = "KES", paymentMethod = "M-Pesa", supportEmail = "support@nisccloud.com", supportPhone = "+254 748 777 666" }) => {
	const formattedAmount = `${currency} ${amount}`;
	const mailtoLink = `mailto:${supportEmail}`;
	const telLink = `tel:${supportPhone}`;
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Payment Receipt - ${receiptNumber}`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Dear ",
					customerName,
					","
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "This email confirms that we have successfully received your payment." }),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f0fdf4",
						border: "1px solid #86efac",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [/* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "0 0 15px 0",
							fontWeight: "bold",
							fontSize: "18px",
							color: "#059669"
						},
						children: "Payment Received"
					}), /* @__PURE__ */ jsx(EmailText, {
						style: {
							margin: "8px 0",
							color: "#166534"
						},
						children: "Your payment has been successfully processed and recorded in our system."
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						padding: "20px",
						margin: "20px 0"
					},
					children: [
						/* @__PURE__ */ jsx(EmailText, {
							style: {
								margin: "0 0 15px 0",
								fontWeight: "bold",
								fontSize: "16px"
							},
							children: "Payment Information:"
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Receipt Number:" }),
								" ",
								receiptNumber
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Transaction Date:" }),
								" ",
								transactionDate
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: { margin: "8px 0" },
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Payment Method:" }),
								" ",
								paymentMethod
							]
						}),
						/* @__PURE__ */ jsxs(EmailText, {
							style: {
								margin: "8px 0",
								fontSize: "18px",
								fontWeight: "bold",
								color: "#059669"
							},
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Amount Paid:" }),
								" ",
								formattedAmount
							]
						})
					]
				}),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "What's Next?" }) }),
				/* @__PURE__ */ jsx(EmailText, { children: "Your order is being processed and services will be activated shortly. You will receive a separate confirmation email once your services are ready." }),
				/* @__PURE__ */ jsxs(EmailText, { children: [/* @__PURE__ */ jsx("strong", { children: "Need Help?" }), " Our support team is here to assist you:"] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["Email: ", /* @__PURE__ */ jsx(EmailLink, {
					href: mailtoLink,
					children: supportEmail
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: ["Phone: ", /* @__PURE__ */ jsx(EmailLink, {
					href: telLink,
					children: supportPhone
				})] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					"Thank you for choosing ",
					/* @__PURE__ */ jsx("strong", { children: "Nisc Cloud Limited" }),
					". We appreciate your business!"
				] }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
PaymentReceiptEmail.PreviewProps = {
	customerName: "John Doe",
	receiptNumber: "UADNX3OCC7",
	transactionDate: "January 13, 2025 at 08:00 AM",
	amount: "1,000.00",
	currency: "KES",
	paymentMethod: "M-Pesa",
	supportEmail: "support@nisccloud.com",
	supportPhone: "+254 748 777 666"
};

//#endregion
//#region ../../packages/react-email-starter/emails/campaign-created-email.tsx
const CampaignCreatedEmail = ({ recipientName, campaignName, subject, recipientCount = 0, viewCampaignLink }) => {
	const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Your email campaign "${campaignName ?? "Campaign"}" has been created`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, { children: greeting }),
				/* @__PURE__ */ jsx(EmailText, { children: "Your email campaign has been created successfully and is ready to send or schedule." }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Campaign details:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Campaign name:" }),
					" ",
					campaignName ?? "—"
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Subject:" }),
					" ",
					subject ?? "—"
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Recipients:" }),
					" ",
					recipientCount.toLocaleString()
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "You can review the campaign, send it now, or schedule it for later from your email marketing dashboard." }),
				viewCampaignLink && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx(EmailButton, {
						href: viewCampaignLink,
						children: "View Campaign"
					}),
					/* @__PURE__ */ jsx(EmailText, { children: "Or copy and paste this link into your browser:" }),
					/* @__PURE__ */ jsx(EmailText, {
						style: {
							wordBreak: "break-all",
							color: "#666",
							fontSize: "14px",
							backgroundColor: "#f4f4f4",
							padding: "10px",
							borderRadius: "4px"
						},
						children: viewCampaignLink
					})
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "If you did not create this campaign, please contact your team administrator or support." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
CampaignCreatedEmail.PreviewProps = {
	recipientName: "Jane",
	campaignName: "Product Launch Announcement",
	subject: "Introducing our new product line",
	recipientCount: 1250,
	viewCampaignLink: "https://app.nisccloud.com/agency/email-marketing/campaigns/camp_123"
};

//#endregion
//#region ../../packages/react-email-starter/emails/campaign-completed-email.tsx
const CampaignCompletedEmail = ({ recipientName, campaignName, subject, sentAt, totalRecipients = 0, viewCampaignLink }) => {
	const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Your email campaign "${campaignName ?? "Campaign"}" has finished sending`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, { children: greeting }),
				/* @__PURE__ */ jsx(EmailText, { children: "Your email campaign has finished sending. Here is a brief summary:" }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Campaign:" }),
					" ",
					campaignName ?? "—"
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Subject:" }),
					" ",
					subject ?? "—"
				] }),
				sentAt && /* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Sent at:" }),
					" ",
					sentAt
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Total recipients:" }),
					" ",
					totalRecipients.toLocaleString()
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "Log in to your dashboard to see the full report—including opens, clicks, and delivery details." }),
				viewCampaignLink && /* @__PURE__ */ jsx(EmailButton, {
					href: viewCampaignLink,
					children: "View Campaign Report"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: "If you have any questions about your campaign performance, our support team is here to help." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
CampaignCompletedEmail.PreviewProps = {
	recipientName: "Jane",
	campaignName: "Product Launch Announcement",
	subject: "Introducing our new product line",
	sentAt: "Jan 30, 2026 at 2:45 PM",
	totalRecipients: 1250,
	viewCampaignLink: "https://app.nisccloud.com/agency/email-marketing/campaigns/camp_123"
};

//#endregion
//#region ../../packages/react-email-starter/emails/campaign-scheduled-email.tsx
const CampaignScheduledEmail = ({ recipientName, campaignName, subject, scheduledAt, recipientCount = 0, viewCampaignLink }) => {
	const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Your email campaign "${campaignName ?? "Campaign"}" is scheduled`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, { children: greeting }),
				/* @__PURE__ */ jsx(EmailText, { children: "Your email campaign has been scheduled and will be sent automatically at the date and time you selected." }),
				/* @__PURE__ */ jsx(EmailText, { children: /* @__PURE__ */ jsx("strong", { children: "Campaign details:" }) }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Campaign name:" }),
					" ",
					campaignName ?? "—"
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Subject:" }),
					" ",
					subject ?? "—"
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Scheduled for:" }),
					" ",
					scheduledAt ?? "—"
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Recipients:" }),
					" ",
					recipientCount.toLocaleString()
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "No further action is required. The campaign will be sent at the scheduled time. You can cancel or reschedule it from your dashboard before it sends." }),
				viewCampaignLink && /* @__PURE__ */ jsx(EmailButton, {
					href: viewCampaignLink,
					children: "View Campaign"
				}),
				/* @__PURE__ */ jsx(EmailText, { children: "If you did not schedule this campaign, please contact your team administrator or support to cancel it." }),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
CampaignScheduledEmail.PreviewProps = {
	recipientName: "Jane",
	campaignName: "Weekly Newsletter",
	subject: "This week's updates and tips",
	scheduledAt: "Feb 1, 2026 at 9:00 AM",
	recipientCount: 3200,
	viewCampaignLink: "https://app.nisccloud.com/agency/email-marketing/campaigns/camp_456"
};

//#endregion
//#region ../../packages/react-email-starter/emails/campaign-cancelled-email.tsx
const CampaignCancelledEmail = ({ recipientName, campaignName, subject, cancelledAt, viewCampaignLink }) => {
	const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
	return /* @__PURE__ */ jsxs(EmailLayout, {
		preview: `Your scheduled campaign "${campaignName ?? "Campaign"}" was cancelled`,
		children: [
			/* @__PURE__ */ jsx(EmailHeader, {}),
			/* @__PURE__ */ jsxs(Section, { children: [
				/* @__PURE__ */ jsx(EmailText, { children: greeting }),
				/* @__PURE__ */ jsx(EmailText, { children: "You cancelled your scheduled campaign. It will not be sent." }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Campaign:" }),
					" ",
					campaignName ?? "—"
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Subject:" }),
					" ",
					subject ?? "—"
				] }),
				/* @__PURE__ */ jsxs(EmailText, { children: [
					/* @__PURE__ */ jsx("strong", { children: "Cancelled at:" }),
					" ",
					cancelledAt ?? "—"
				] }),
				/* @__PURE__ */ jsx(EmailText, { children: "No emails will be sent for this scheduled send. You can create or schedule a new campaign anytime from your dashboard." }),
				viewCampaignLink && /* @__PURE__ */ jsx(EmailButton, {
					href: viewCampaignLink,
					children: "View Campaigns"
				}),
				/* @__PURE__ */ jsx(EmailSignature, {})
			] }),
			/* @__PURE__ */ jsx(EmailFooter, {})
		]
	});
};
CampaignCancelledEmail.PreviewProps = {
	recipientName: "Jane",
	campaignName: "Weekly Newsletter",
	subject: "This week's updates and tips",
	cancelledAt: "Jan 30, 2026 at 2:45 PM",
	viewCampaignLink: "https://app.nisccloud.com/agency/email-marketing/campaigns"
};

//#endregion
//#region ../../packages/api/src/lib/email-templates.ts
async function renderTeamInviteEmail({ invitedUserEmail, inviterName, teamName, teamRole, acceptInviteLink, expiresInDays }) {
	return render(TeamInviteEmail({
		invitedUserEmail,
		inviterName,
		teamName,
		teamRole,
		acceptInviteLink,
		expiresInDays
	}));
}
async function renderAccountCreatedEmail({ userFirstname, email, password, loginLink }) {
	return render(AccountCreatedEmail({
		userFirstname,
		email,
		password,
		loginLink
	}));
}
async function renderAgencyUserCreatedEmail({ userFirstname, email, password, role, loginLink }) {
	return render(AgencyUserCreatedEmail({
		userFirstname,
		email,
		password,
		role,
		loginLink
	}));
}
async function renderInvoiceDeliveryEmail({ customerName, invoiceNumber, issueDate, dueDate, totalAmount, currency, services, supportEmail, supportPhone }) {
	return render(InvoiceDeliveryEmail({
		customerName,
		invoiceNumber,
		issueDate,
		dueDate,
		totalAmount,
		currency,
		services,
		supportEmail,
		supportPhone
	}));
}
async function renderInvoiceSuccessEmail({ customerName, invoiceNumber, orderNumber, totalAmount, currency, supportEmail, supportPhone, invoiceLink }) {
	return render(InvoiceSuccessEmail({
		customerName,
		invoiceNumber,
		orderNumber,
		totalAmount,
		currency,
		supportEmail,
		supportPhone,
		invoiceLink
	}));
}
async function renderQuotationDeliveryEmail({ customerName, quotationNumber, issueDate, totalAmount, currency, services, supportEmail, supportPhone }) {
	return render(QuotationDeliveryEmail({
		customerName,
		quotationNumber,
		issueDate,
		totalAmount,
		currency,
		services,
		supportEmail,
		supportPhone
	}));
}
async function renderOrderConfirmationEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems, supportEmail, supportPhone, orderLink }) {
	return render(OrderConfirmationEmail({
		customerName,
		orderNumber,
		orderDate,
		totalAmount,
		currency,
		orderItems,
		supportEmail,
		supportPhone,
		orderLink
	}));
}
async function renderCampaignCreatedEmail({ recipientName, campaignName, subject, recipientCount, viewCampaignLink }) {
	return render(CampaignCreatedEmail({
		recipientName,
		campaignName,
		subject,
		recipientCount: recipientCount ?? 0,
		viewCampaignLink
	}));
}
async function renderCampaignCompletedEmail({ recipientName, campaignName, subject, sentAt, totalRecipients, viewCampaignLink }) {
	return render(CampaignCompletedEmail({
		recipientName,
		campaignName,
		subject,
		sentAt,
		totalRecipients: totalRecipients ?? 0,
		viewCampaignLink
	}));
}
async function renderCampaignScheduledEmail({ recipientName, campaignName, subject, scheduledAt, recipientCount, viewCampaignLink }) {
	return render(CampaignScheduledEmail({
		recipientName,
		campaignName,
		subject,
		scheduledAt,
		recipientCount: recipientCount ?? 0,
		viewCampaignLink
	}));
}
async function renderCampaignCancelledEmail({ recipientName, campaignName, subject, cancelledAt, viewCampaignLink }) {
	return render(CampaignCancelledEmail({
		recipientName,
		campaignName,
		subject,
		cancelledAt,
		viewCampaignLink
	}));
}
async function renderServiceRenewalReminderEmail({ recipientName, serviceName, subscriptionName, subscriptionDate, expiryDate, gracePeriodText, supportEmail, supportPhone }) {
	return render(ServiceRenewalReminderEmail({
		recipientName,
		serviceName,
		subscriptionName,
		subscriptionDate,
		expiryDate,
		gracePeriodText,
		supportEmail,
		supportPhone
	}));
}
async function renderNiscOrderConfirmationEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems, orderLink }) {
	const itemsHtml = orderItems?.map((i) => `<tr><td>${escapeHtml(i.name)}</td><td>${i.description ? escapeHtml(i.description) : ""}</td><td>${i.price ?? ""} ${currency ?? ""}</td></tr>`).join("") ?? "";
	return `<div style="font-family:sans-serif;max-width:600px;">
  <h2>Order confirmed</h2>
  <p>Hi ${escapeHtml(customerName ?? "Customer")},</p>
  <p>Your NISC service order has been processed successfully.</p>
  <p><strong>Order number:</strong> ${escapeHtml(orderNumber ?? "")}</p>
  <p><strong>Date:</strong> ${orderDate ?? ""}</p>
  <table style="border-collapse:collapse;width:100%;"><thead><tr><th style="text-align:left;">Item</th><th style="text-align:left;">Details</th><th style="text-align:right;">Price</th></tr></thead><tbody>${itemsHtml}</tbody></table>
  <p><strong>Total:</strong> ${totalAmount ?? ""} ${currency ?? "KES"}</p>
  ${orderLink ? `<p><a href="${escapeHtml(orderLink)}">View order</a></p>` : ""}
  <p>Thank you for your business.</p>
</div>`;
}
/** "Order received" email — React template; sent when order is created from payment; user will get another email when processed. */
async function renderNiscOrderReceivedEmail({ customerName, orderNumber, orderDate, totalAmount, currency, orderItems }) {
	return render(OrderReceivedEmail({
		customerName,
		orderNumber,
		orderDate,
		totalAmount,
		currency,
		orderItems: orderItems?.map((i) => ({
			name: i.name,
			description: i.description,
			price: i.price
		}))
	}));
}
/** Admin "order failed" email — React template; sent to super admins when a NISC order fails or is partial. */
async function renderNiscOrderFailedEmail({ customerName, orderNumber, failedItems, failureReason, retryLink }) {
	return render(OrderFailedEmail({
		customerName,
		orderNumber,
		failedItems,
		failureReason,
		retryLink
	}));
}
async function renderOpenProviderVerifyEmail({ recipientName, domainName }) {
	return `<div style="font-family:sans-serif;max-width:600px;">
  <p>Hi ${escapeHtml(recipientName ?? "Customer")},</p>
  <p>To complete your domain purchase for <strong>${escapeHtml(domainName ?? "")}</strong>, please verify your email address.</p>
  <p>OpenProvider has sent a verification email to this address. Click the link in that email to verify and complete your domain registration.</p>
  <p><img src="https://via.placeholder.com/120x60?text=NISC" alt="NISC" width="120" height="60" style="display:block;margin:1em 0;" /></p>
  <p>If you did not request this, you can ignore this message.</p>
</div>`;
}
function escapeHtml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

//#endregion
export { WelcomeEmail as _, renderCampaignCreatedEmail as a, renderInvoiceSuccessEmail as c, renderNiscOrderReceivedEmail as d, renderOpenProviderVerifyEmail as f, renderTeamInviteEmail as g, renderServiceRenewalReminderEmail as h, renderCampaignCompletedEmail as i, renderNiscOrderConfirmationEmail as l, renderQuotationDeliveryEmail as m, renderAgencyUserCreatedEmail as n, renderCampaignScheduledEmail as o, renderOrderConfirmationEmail as p, renderCampaignCancelledEmail as r, renderInvoiceDeliveryEmail as s, renderAccountCreatedEmail as t, renderNiscOrderFailedEmail as u, PasswordResetSuccessEmail as v, ResetPasswordEmail as y };