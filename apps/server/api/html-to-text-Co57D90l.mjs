
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { o as __toESM, t as __commonJSMin } from "./chunk-DduSDN3j.mjs";

//#region ../../node_modules/.bun/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js
/** Types of elements found in htmlparser2's DOM */
var ElementType;
(function(ElementType$1) {
	/** Type for the root element of a document */
	ElementType$1["Root"] = "root";
	/** Type for Text */
	ElementType$1["Text"] = "text";
	/** Type for <? ... ?> */
	ElementType$1["Directive"] = "directive";
	/** Type for <!-- ... --> */
	ElementType$1["Comment"] = "comment";
	/** Type for <script> tags */
	ElementType$1["Script"] = "script";
	/** Type for <style> tags */
	ElementType$1["Style"] = "style";
	/** Type for Any tag */
	ElementType$1["Tag"] = "tag";
	/** Type for <![CDATA[ ... ]]> */
	ElementType$1["CDATA"] = "cdata";
	/** Type for <!doctype ...> */
	ElementType$1["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
/**
* Tests whether an element is a tag or not.
*
* @param elem Element to test
*/
function isTag$1(elem) {
	return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
/** Type for the root element of a document */
const Root = ElementType.Root;
/** Type for Text */
const Text$1 = ElementType.Text;
/** Type for <? ... ?> */
const Directive = ElementType.Directive;
/** Type for <!-- ... --> */
const Comment$1 = ElementType.Comment;
/** Type for <script> tags */
const Script = ElementType.Script;
/** Type for <style> tags */
const Style = ElementType.Style;
/** Type for Any tag */
const Tag = ElementType.Tag;
/** Type for <![CDATA[ ... ]]> */
const CDATA$1 = ElementType.CDATA;
/** Type for <!doctype ...> */
const Doctype = ElementType.Doctype;

//#endregion
//#region ../../node_modules/.bun/domhandler@5.0.3/node_modules/domhandler/lib/esm/node.js
/**
* This object will be used as the prototype for Nodes when creating a
* DOM-Level-1-compliant structure.
*/
var Node = class {
	constructor() {
		/** Parent of the node */
		this.parent = null;
		/** Previous sibling */
		this.prev = null;
		/** Next sibling */
		this.next = null;
		/** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
		this.startIndex = null;
		/** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
		this.endIndex = null;
	}
	/**
	* Same as {@link parent}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get parentNode() {
		return this.parent;
	}
	set parentNode(parent) {
		this.parent = parent;
	}
	/**
	* Same as {@link prev}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get previousSibling() {
		return this.prev;
	}
	set previousSibling(prev) {
		this.prev = prev;
	}
	/**
	* Same as {@link next}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get nextSibling() {
		return this.next;
	}
	set nextSibling(next) {
		this.next = next;
	}
	/**
	* Clone this node, and optionally its children.
	*
	* @param recursive Clone child nodes as well.
	* @returns A clone of the node.
	*/
	cloneNode(recursive = false) {
		return cloneNode(this, recursive);
	}
};
/**
* A node that contains some data.
*/
var DataNode = class extends Node {
	/**
	* @param data The content of the data node
	*/
	constructor(data) {
		super();
		this.data = data;
	}
	/**
	* Same as {@link data}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get nodeValue() {
		return this.data;
	}
	set nodeValue(data) {
		this.data = data;
	}
};
/**
* Text within the document.
*/
var Text = class extends DataNode {
	constructor() {
		super(...arguments);
		this.type = ElementType.Text;
	}
	get nodeType() {
		return 3;
	}
};
/**
* Comments within the document.
*/
var Comment = class extends DataNode {
	constructor() {
		super(...arguments);
		this.type = ElementType.Comment;
	}
	get nodeType() {
		return 8;
	}
};
/**
* Processing instructions, including doc types.
*/
var ProcessingInstruction = class extends DataNode {
	constructor(name$1, data) {
		super(data);
		this.name = name$1;
		this.type = ElementType.Directive;
	}
	get nodeType() {
		return 1;
	}
};
/**
* A `Node` that can have children.
*/
var NodeWithChildren = class extends Node {
	/**
	* @param children Children of the node. Only certain node types can have children.
	*/
	constructor(children) {
		super();
		this.children = children;
	}
	/** First child of the node. */
	get firstChild() {
		var _a$1;
		return (_a$1 = this.children[0]) !== null && _a$1 !== void 0 ? _a$1 : null;
	}
	/** Last child of the node. */
	get lastChild() {
		return this.children.length > 0 ? this.children[this.children.length - 1] : null;
	}
	/**
	* Same as {@link children}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get childNodes() {
		return this.children;
	}
	set childNodes(children) {
		this.children = children;
	}
};
var CDATA = class extends NodeWithChildren {
	constructor() {
		super(...arguments);
		this.type = ElementType.CDATA;
	}
	get nodeType() {
		return 4;
	}
};
/**
* The root node of the document.
*/
var Document = class extends NodeWithChildren {
	constructor() {
		super(...arguments);
		this.type = ElementType.Root;
	}
	get nodeType() {
		return 9;
	}
};
/**
* An element within the DOM.
*/
var Element = class extends NodeWithChildren {
	/**
	* @param name Name of the tag, eg. `div`, `span`.
	* @param attribs Object mapping attribute names to attribute values.
	* @param children Children of the node.
	*/
	constructor(name$1, attribs, children = [], type = name$1 === "script" ? ElementType.Script : name$1 === "style" ? ElementType.Style : ElementType.Tag) {
		super(children);
		this.name = name$1;
		this.attribs = attribs;
		this.type = type;
	}
	get nodeType() {
		return 1;
	}
	/**
	* Same as {@link name}.
	* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
	*/
	get tagName() {
		return this.name;
	}
	set tagName(name$1) {
		this.name = name$1;
	}
	get attributes() {
		return Object.keys(this.attribs).map((name$1) => {
			var _a$1, _b;
			return {
				name: name$1,
				value: this.attribs[name$1],
				namespace: (_a$1 = this["x-attribsNamespace"]) === null || _a$1 === void 0 ? void 0 : _a$1[name$1],
				prefix: (_b = this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name$1]
			};
		});
	}
};
/**
* @param node Node to check.
* @returns `true` if the node is a `Element`, `false` otherwise.
*/
function isTag(node) {
	return isTag$1(node);
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `CDATA`, `false` otherwise.
*/
function isCDATA(node) {
	return node.type === ElementType.CDATA;
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `Text`, `false` otherwise.
*/
function isText(node) {
	return node.type === ElementType.Text;
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `Comment`, `false` otherwise.
*/
function isComment(node) {
	return node.type === ElementType.Comment;
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
*/
function isDirective(node) {
	return node.type === ElementType.Directive;
}
/**
* @param node Node to check.
* @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
*/
function isDocument(node) {
	return node.type === ElementType.Root;
}
/**
* Clone a node, and optionally its children.
*
* @param recursive Clone child nodes as well.
* @returns A clone of the node.
*/
function cloneNode(node, recursive = false) {
	let result;
	if (isText(node)) result = new Text(node.data);
	else if (isComment(node)) result = new Comment(node.data);
	else if (isTag(node)) {
		const children = recursive ? cloneChildren(node.children) : [];
		const clone = new Element(node.name, { ...node.attribs }, children);
		children.forEach((child) => child.parent = clone);
		if (node.namespace != null) clone.namespace = node.namespace;
		if (node["x-attribsNamespace"]) clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
		if (node["x-attribsPrefix"]) clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
		result = clone;
	} else if (isCDATA(node)) {
		const children = recursive ? cloneChildren(node.children) : [];
		const clone = new CDATA(children);
		children.forEach((child) => child.parent = clone);
		result = clone;
	} else if (isDocument(node)) {
		const children = recursive ? cloneChildren(node.children) : [];
		const clone = new Document(children);
		children.forEach((child) => child.parent = clone);
		if (node["x-mode"]) clone["x-mode"] = node["x-mode"];
		result = clone;
	} else if (isDirective(node)) {
		const instruction = new ProcessingInstruction(node.name, node.data);
		if (node["x-name"] != null) {
			instruction["x-name"] = node["x-name"];
			instruction["x-publicId"] = node["x-publicId"];
			instruction["x-systemId"] = node["x-systemId"];
		}
		result = instruction;
	} else throw new Error(`Not implemented yet: ${node.type}`);
	result.startIndex = node.startIndex;
	result.endIndex = node.endIndex;
	if (node.sourceCodeLocation != null) result.sourceCodeLocation = node.sourceCodeLocation;
	return result;
}
function cloneChildren(childs) {
	const children = childs.map((child) => cloneNode(child, true));
	for (let i = 1; i < children.length; i++) {
		children[i].prev = children[i - 1];
		children[i - 1].next = children[i];
	}
	return children;
}

//#endregion
//#region ../../node_modules/.bun/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js
const defaultOpts = {
	withStartIndices: false,
	withEndIndices: false,
	xmlMode: false
};
var DomHandler = class {
	/**
	* @param callback Called once parsing has completed.
	* @param options Settings for the handler.
	* @param elementCB Callback whenever a tag is closed.
	*/
	constructor(callback, options, elementCB) {
		/** The elements of the DOM */
		this.dom = [];
		/** The root element for the DOM */
		this.root = new Document(this.dom);
		/** Indicated whether parsing has been completed. */
		this.done = false;
		/** Stack of open tags. */
		this.tagStack = [this.root];
		/** A data node that is still being written to. */
		this.lastNode = null;
		/** Reference to the parser instance. Used for location information. */
		this.parser = null;
		if (typeof options === "function") {
			elementCB = options;
			options = defaultOpts;
		}
		if (typeof callback === "object") {
			options = callback;
			callback = void 0;
		}
		this.callback = callback !== null && callback !== void 0 ? callback : null;
		this.options = options !== null && options !== void 0 ? options : defaultOpts;
		this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
	}
	onparserinit(parser) {
		this.parser = parser;
	}
	onreset() {
		this.dom = [];
		this.root = new Document(this.dom);
		this.done = false;
		this.tagStack = [this.root];
		this.lastNode = null;
		this.parser = null;
	}
	onend() {
		if (this.done) return;
		this.done = true;
		this.parser = null;
		this.handleCallback(null);
	}
	onerror(error) {
		this.handleCallback(error);
	}
	onclosetag() {
		this.lastNode = null;
		const elem = this.tagStack.pop();
		if (this.options.withEndIndices) elem.endIndex = this.parser.endIndex;
		if (this.elementCB) this.elementCB(elem);
	}
	onopentag(name$1, attribs) {
		const element = new Element(name$1, attribs, void 0, this.options.xmlMode ? ElementType.Tag : void 0);
		this.addNode(element);
		this.tagStack.push(element);
	}
	ontext(data) {
		const { lastNode } = this;
		if (lastNode && lastNode.type === ElementType.Text) {
			lastNode.data += data;
			if (this.options.withEndIndices) lastNode.endIndex = this.parser.endIndex;
		} else {
			const node = new Text(data);
			this.addNode(node);
			this.lastNode = node;
		}
	}
	oncomment(data) {
		if (this.lastNode && this.lastNode.type === ElementType.Comment) {
			this.lastNode.data += data;
			return;
		}
		const node = new Comment(data);
		this.addNode(node);
		this.lastNode = node;
	}
	oncommentend() {
		this.lastNode = null;
	}
	oncdatastart() {
		const text = new Text("");
		const node = new CDATA([text]);
		this.addNode(node);
		text.parent = node;
		this.lastNode = text;
	}
	oncdataend() {
		this.lastNode = null;
	}
	onprocessinginstruction(name$1, data) {
		const node = new ProcessingInstruction(name$1, data);
		this.addNode(node);
	}
	handleCallback(error) {
		if (typeof this.callback === "function") this.callback(error, this.dom);
		else if (error) throw error;
	}
	addNode(node) {
		const parent = this.tagStack[this.tagStack.length - 1];
		const previousSibling = parent.children[parent.children.length - 1];
		if (this.options.withStartIndices) node.startIndex = this.parser.startIndex;
		if (this.options.withEndIndices) node.endIndex = this.parser.endIndex;
		parent.children.push(node);
		if (previousSibling) {
			node.prev = previousSibling;
			previousSibling.next = node;
		}
		node.parent = parent;
		this.lastNode = null;
	}
};

//#endregion
//#region ../../node_modules/.bun/leac@0.6.0/node_modules/leac/lib/leac.mjs
const e = /\n/g;
function n(n$1) {
	const o$1 = [...n$1.matchAll(e)].map(((e$1) => e$1.index || 0));
	o$1.unshift(-1);
	const s$1 = t(o$1, 0, o$1.length);
	return (e$1) => r(s$1, e$1);
}
function t(e$1, n$1, r$1) {
	if (r$1 - n$1 == 1) return {
		offset: e$1[n$1],
		index: n$1 + 1
	};
	const o$1 = Math.ceil((n$1 + r$1) / 2), s$1 = t(e$1, n$1, o$1), l$1 = t(e$1, o$1, r$1);
	return {
		offset: s$1.offset,
		low: s$1,
		high: l$1
	};
}
function r(e$1, n$1) {
	return function(e$2) {
		return Object.prototype.hasOwnProperty.call(e$2, "index");
	}(e$1) ? {
		line: e$1.index,
		column: n$1 - e$1.offset
	} : r(e$1.high.offset < n$1 ? e$1.high : e$1.low, n$1);
}
function o(e$1, t$1 = "", r$1 = {}) {
	const o$1 = "string" != typeof t$1 ? t$1 : r$1, l$1 = "string" == typeof t$1 ? t$1 : "", c$1 = e$1.map(s), f = !!o$1.lineNumbers;
	return function(e$2, t$2 = 0) {
		const r$2 = f ? n(e$2) : () => ({
			line: 0,
			column: 0
		});
		let o$2 = t$2;
		const s$1 = [];
		e: for (; o$2 < e$2.length;) {
			let n$1 = !1;
			for (const t$3 of c$1) {
				t$3.regex.lastIndex = o$2;
				const c$2 = t$3.regex.exec(e$2);
				if (c$2 && c$2[0].length > 0) {
					if (!t$3.discard) {
						const e$3 = r$2(o$2), n$2 = "string" == typeof t$3.replace ? c$2[0].replace(new RegExp(t$3.regex.source, t$3.regex.flags), t$3.replace) : c$2[0];
						s$1.push({
							state: l$1,
							name: t$3.name,
							text: n$2,
							offset: o$2,
							len: c$2[0].length,
							line: e$3.line,
							column: e$3.column
						});
					}
					if (o$2 = t$3.regex.lastIndex, n$1 = !0, t$3.push) {
						const n$2 = t$3.push(e$2, o$2);
						s$1.push(...n$2.tokens), o$2 = n$2.offset;
					}
					if (t$3.pop) break e;
					break;
				}
			}
			if (!n$1) break;
		}
		return {
			tokens: s$1,
			offset: o$2,
			complete: e$2.length <= o$2
		};
	};
}
function s(e$1, n$1) {
	return {
		...e$1,
		regex: l(e$1, n$1)
	};
}
function l(e$1, n$1) {
	if (0 === e$1.name.length) throw new Error(`Rule #${n$1} has empty name, which is not allowed.`);
	if (function(e$2) {
		return Object.prototype.hasOwnProperty.call(e$2, "regex");
	}(e$1)) return function(e$2) {
		if (e$2.global) throw new Error(`Regular expression /${e$2.source}/${e$2.flags} contains the global flag, which is not allowed.`);
		return e$2.sticky ? e$2 : new RegExp(e$2.source, e$2.flags + "y");
	}(e$1.regex);
	if (function(e$2) {
		return Object.prototype.hasOwnProperty.call(e$2, "str");
	}(e$1)) {
		if (0 === e$1.str.length) throw new Error(`Rule #${n$1} ("${e$1.name}") has empty "str" property, which is not allowed.`);
		return new RegExp(c(e$1.str), "y");
	}
	return new RegExp(c(e$1.name), "y");
}
function c(e$1) {
	return e$1.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, "\\$&");
}

//#endregion
//#region ../../node_modules/.bun/peberminta@0.9.0/node_modules/peberminta/lib/core.mjs
function token(onToken, onEnd) {
	return (data, i) => {
		let position = i;
		let value = void 0;
		if (i < data.tokens.length) {
			value = onToken(data.tokens[i], data, i);
			if (value !== void 0) position++;
		} else onEnd?.(data, i);
		return value === void 0 ? { matched: false } : {
			matched: true,
			position,
			value
		};
	};
}
function mapInner(r$1, f) {
	return r$1.matched ? {
		matched: true,
		position: r$1.position,
		value: f(r$1.value, r$1.position)
	} : r$1;
}
function mapOuter(r$1, f) {
	return r$1.matched ? f(r$1) : r$1;
}
function map(p, mapper) {
	return (data, i) => mapInner(p(data, i), (v, j) => mapper(v, data, i, j));
}
function option(p, def) {
	return (data, i) => {
		const r$1 = p(data, i);
		return r$1.matched ? r$1 : {
			matched: true,
			position: i,
			value: def
		};
	};
}
function choice(...ps) {
	return (data, i) => {
		for (const p of ps) {
			const result = p(data, i);
			if (result.matched) return result;
		}
		return { matched: false };
	};
}
function otherwise(pa, pb) {
	return (data, i) => {
		const r1 = pa(data, i);
		return r1.matched ? r1 : pb(data, i);
	};
}
function takeWhile(p, test) {
	return (data, i) => {
		const values = [];
		let success = true;
		do {
			const r$1 = p(data, i);
			if (r$1.matched && test(r$1.value, values.length + 1, data, i, r$1.position)) {
				values.push(r$1.value);
				i = r$1.position;
			} else success = false;
		} while (success);
		return {
			matched: true,
			position: i,
			value: values
		};
	};
}
function many(p) {
	return takeWhile(p, () => true);
}
function many1(p) {
	return ab(p, many(p), (head, tail) => [head, ...tail]);
}
function ab(pa, pb, join) {
	return (data, i) => mapOuter(pa(data, i), (ma) => mapInner(pb(data, ma.position), (vb, j) => join(ma.value, vb, data, i, j)));
}
function left(pa, pb) {
	return ab(pa, pb, (va) => va);
}
function right(pa, pb) {
	return ab(pa, pb, (va, vb) => vb);
}
function abc(pa, pb, pc, join) {
	return (data, i) => mapOuter(pa(data, i), (ma) => mapOuter(pb(data, ma.position), (mb) => mapInner(pc(data, mb.position), (vc, j) => join(ma.value, mb.value, vc, data, i, j))));
}
function middle(pa, pb, pc) {
	return abc(pa, pb, pc, (ra, rb) => rb);
}
function all(...ps) {
	return (data, i) => {
		const result = [];
		let position = i;
		for (const p of ps) {
			const r1 = p(data, position);
			if (r1.matched) {
				result.push(r1.value);
				position = r1.position;
			} else return { matched: false };
		}
		return {
			matched: true,
			position,
			value: result
		};
	};
}
function flatten(...ps) {
	return flatten1(all(...ps));
}
function flatten1(p) {
	return map(p, (vs) => vs.flatMap((v) => v));
}
function chainReduce(acc, f) {
	return (data, i) => {
		let loop = true;
		let acc1 = acc;
		let pos = i;
		do {
			const r$1 = f(acc1, data, pos)(data, pos);
			if (r$1.matched) {
				acc1 = r$1.value;
				pos = r$1.position;
			} else loop = false;
		} while (loop);
		return {
			matched: true,
			position: pos,
			value: acc1
		};
	};
}
function reduceLeft(acc, p, reducer) {
	return chainReduce(acc, (acc$1) => map(p, (v, data, i, j) => reducer(acc$1, v, data, i, j)));
}
function leftAssoc2(pLeft, pOper, pRight) {
	return chain(pLeft, (v0) => reduceLeft(v0, ab(pOper, pRight, (f, y) => [f, y]), (acc, [f, y]) => f(acc, y)));
}
function chain(p, f) {
	return (data, i) => mapOuter(p(data, i), (m1) => f(m1.value, data, i, m1.position)(data, m1.position));
}

//#endregion
//#region ../../node_modules/.bun/parseley@0.12.1/node_modules/parseley/lib/parseley.mjs
const ws = `(?:[ \\t\\r\\n\\f]*)`;
const nl = `(?:\\n|\\r\\n|\\r|\\f)`;
const nonascii = `[^\\x00-\\x7F]`;
const unicode = `(?:\\\\[0-9a-f]{1,6}(?:\\r\\n|[ \\n\\r\\t\\f])?)`;
const escape = `(?:\\\\[^\\n\\r\\f0-9a-f])`;
const nmstart = `(?:[_a-z]|${nonascii}|${unicode}|${escape})`;
const nmchar = `(?:[_a-z0-9-]|${nonascii}|${unicode}|${escape})`;
const name = `(?:${nmchar}+)`;
const ident = `(?:[-]?${nmstart}${nmchar}*)`;
const string1 = `'([^\\n\\r\\f\\\\']|\\\\${nl}|${nonascii}|${unicode}|${escape})*'`;
const string2 = `"([^\\n\\r\\f\\\\"]|\\\\${nl}|${nonascii}|${unicode}|${escape})*"`;
const lexSelector = o([
	{
		name: "ws",
		regex: new RegExp(ws)
	},
	{
		name: "hash",
		regex: new RegExp(`#${name}`, "i")
	},
	{
		name: "ident",
		regex: new RegExp(ident, "i")
	},
	{
		name: "str1",
		regex: new RegExp(string1, "i")
	},
	{
		name: "str2",
		regex: new RegExp(string2, "i")
	},
	{ name: "*" },
	{ name: "." },
	{ name: "," },
	{ name: "[" },
	{ name: "]" },
	{ name: "=" },
	{ name: ">" },
	{ name: "|" },
	{ name: "+" },
	{ name: "~" },
	{ name: "^" },
	{ name: "$" }
]);
const lexEscapedString = o([
	{
		name: "unicode",
		regex: new RegExp(unicode, "i")
	},
	{
		name: "escape",
		regex: new RegExp(escape, "i")
	},
	{
		name: "any",
		regex: new RegExp("[\\s\\S]", "i")
	}
]);
function sumSpec([a0, a1, a2], [b0, b1, b2]) {
	return [
		a0 + b0,
		a1 + b1,
		a2 + b2
	];
}
function sumAllSpec(ss) {
	return ss.reduce(sumSpec, [
		0,
		0,
		0
	]);
}
const unicodeEscapedSequence_ = token((t$1) => t$1.name === "unicode" ? String.fromCodePoint(parseInt(t$1.text.slice(1), 16)) : void 0);
const escapedSequence_ = token((t$1) => t$1.name === "escape" ? t$1.text.slice(1) : void 0);
const anyChar_ = token((t$1) => t$1.name === "any" ? t$1.text : void 0);
const escapedString_ = map(many(choice(unicodeEscapedSequence_, escapedSequence_, anyChar_)), (cs) => cs.join(""));
function unescape(escapedString) {
	return escapedString_({
		tokens: lexEscapedString(escapedString).tokens,
		options: void 0
	}, 0).value;
}
function literal(name$1) {
	return token((t$1) => t$1.name === name$1 ? true : void 0);
}
const whitespace_ = token((t$1) => t$1.name === "ws" ? null : void 0);
const optionalWhitespace_ = option(whitespace_, null);
function optionallySpaced(parser) {
	return middle(optionalWhitespace_, parser, optionalWhitespace_);
}
const identifier_ = token((t$1) => t$1.name === "ident" ? unescape(t$1.text) : void 0);
const hashId_ = token((t$1) => t$1.name === "hash" ? unescape(t$1.text.slice(1)) : void 0);
const string_ = token((t$1) => t$1.name.startsWith("str") ? unescape(t$1.text.slice(1, -1)) : void 0);
const namespace_ = left(option(identifier_, ""), literal("|"));
const qualifiedName_ = otherwise(ab(namespace_, identifier_, (ns, name$1) => ({
	name: name$1,
	namespace: ns
})), map(identifier_, (name$1) => ({
	name: name$1,
	namespace: null
})));
const uniSelector_ = otherwise(ab(namespace_, literal("*"), (ns) => ({
	type: "universal",
	namespace: ns,
	specificity: [
		0,
		0,
		0
	]
})), map(literal("*"), () => ({
	type: "universal",
	namespace: null,
	specificity: [
		0,
		0,
		0
	]
})));
const tagSelector_ = map(qualifiedName_, ({ name: name$1, namespace }) => ({
	type: "tag",
	name: name$1,
	namespace,
	specificity: [
		0,
		0,
		1
	]
}));
const classSelector_ = ab(literal("."), identifier_, (fullstop, name$1) => ({
	type: "class",
	name: name$1,
	specificity: [
		0,
		1,
		0
	]
}));
const idSelector_ = map(hashId_, (name$1) => ({
	type: "id",
	name: name$1,
	specificity: [
		1,
		0,
		0
	]
}));
const attrModifier_ = token((t$1) => {
	if (t$1.name === "ident") {
		if (t$1.text === "i" || t$1.text === "I") return "i";
		if (t$1.text === "s" || t$1.text === "S") return "s";
	}
});
const attrValue_ = otherwise(ab(string_, option(right(optionalWhitespace_, attrModifier_), null), (v, mod) => ({
	value: v,
	modifier: mod
})), ab(identifier_, option(right(whitespace_, attrModifier_), null), (v, mod) => ({
	value: v,
	modifier: mod
})));
const attrMatcher_ = choice(map(literal("="), () => "="), ab(literal("~"), literal("="), () => "~="), ab(literal("|"), literal("="), () => "|="), ab(literal("^"), literal("="), () => "^="), ab(literal("$"), literal("="), () => "$="), ab(literal("*"), literal("="), () => "*="));
const attrPresenceSelector_ = abc(literal("["), optionallySpaced(qualifiedName_), literal("]"), (lbr, { name: name$1, namespace }) => ({
	type: "attrPresence",
	name: name$1,
	namespace,
	specificity: [
		0,
		1,
		0
	]
}));
const attrValueSelector_ = middle(literal("["), abc(optionallySpaced(qualifiedName_), attrMatcher_, optionallySpaced(attrValue_), ({ name: name$1, namespace }, matcher, { value, modifier }) => ({
	type: "attrValue",
	name: name$1,
	namespace,
	matcher,
	value,
	modifier,
	specificity: [
		0,
		1,
		0
	]
})), literal("]"));
const attrSelector_ = otherwise(attrPresenceSelector_, attrValueSelector_);
const typeSelector_ = otherwise(uniSelector_, tagSelector_);
const subclassSelector_ = choice(idSelector_, classSelector_, attrSelector_);
const compoundSelector_ = map(otherwise(flatten(typeSelector_, many(subclassSelector_)), many1(subclassSelector_)), (ss) => {
	return {
		type: "compound",
		list: ss,
		specificity: sumAllSpec(ss.map((s$1) => s$1.specificity))
	};
});
const combinator_ = choice(map(literal(">"), () => ">"), map(literal("+"), () => "+"), map(literal("~"), () => "~"), ab(literal("|"), literal("|"), () => "||"));
const combinatorSeparator_ = otherwise(optionallySpaced(combinator_), map(whitespace_, () => " "));
const complexSelector_ = leftAssoc2(compoundSelector_, map(combinatorSeparator_, (c$1) => (left$1, right$1) => ({
	type: "compound",
	list: [...right$1.list, {
		type: "combinator",
		combinator: c$1,
		left: left$1,
		specificity: left$1.specificity
	}],
	specificity: sumSpec(left$1.specificity, right$1.specificity)
})), compoundSelector_);
const listSelector_ = leftAssoc2(map(complexSelector_, (s$1) => ({
	type: "list",
	list: [s$1]
})), map(optionallySpaced(literal(",")), () => (acc, next) => ({
	type: "list",
	list: [...acc.list, next]
})), complexSelector_);
function parse_(parser, str) {
	if (!(typeof str === "string" || str instanceof String)) throw new Error("Expected a selector string. Actual input is not a string!");
	const lexerResult = lexSelector(str);
	if (!lexerResult.complete) throw new Error(`The input "${str}" was only partially tokenized, stopped at offset ${lexerResult.offset}!\n` + prettyPrintPosition(str, lexerResult.offset));
	const result = optionallySpaced(parser)({
		tokens: lexerResult.tokens,
		options: void 0
	}, 0);
	if (!result.matched) throw new Error(`No match for "${str}" input!`);
	if (result.position < lexerResult.tokens.length) {
		const token$1 = lexerResult.tokens[result.position];
		throw new Error(`The input "${str}" was only partially parsed, stopped at offset ${token$1.offset}!\n` + prettyPrintPosition(str, token$1.offset, token$1.len));
	}
	return result.value;
}
function prettyPrintPosition(str, offset, len = 1) {
	return `${str.replace(/(\t)|(\r)|(\n)/g, (m, t$1, r$1) => t$1 ? "␉" : r$1 ? "␍" : "␊")}\n${"".padEnd(offset)}${"^".repeat(len)}`;
}
function parse1(str) {
	return parse_(complexSelector_, str);
}
function serialize(selector) {
	if (!selector.type) throw new Error("This is not an AST node.");
	switch (selector.type) {
		case "universal": return _serNs(selector.namespace) + "*";
		case "tag": return _serNs(selector.namespace) + _serIdent(selector.name);
		case "class": return "." + _serIdent(selector.name);
		case "id": return "#" + _serIdent(selector.name);
		case "attrPresence": return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}]`;
		case "attrValue": return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}${selector.matcher}"${_serStr(selector.value)}"${selector.modifier ? selector.modifier : ""}]`;
		case "combinator": return serialize(selector.left) + selector.combinator;
		case "compound": return selector.list.reduce((acc, node) => {
			if (node.type === "combinator") return serialize(node) + acc;
			else return acc + serialize(node);
		}, "");
		case "list": return selector.list.map(serialize).join(",");
	}
}
function _serNs(ns) {
	return ns || ns === "" ? _serIdent(ns) + "|" : "";
}
function _codePoint(char) {
	return `\\${char.codePointAt(0).toString(16)} `;
}
function _serIdent(str) {
	return str.replace(/(^[0-9])|(^-[0-9])|(^-$)|([-0-9a-zA-Z_]|[^\x00-\x7F])|(\x00)|([\x01-\x1f]|\x7f)|([\s\S])/g, (m, d1, d2, hy, safe, nl$1, ctrl, other) => d1 ? _codePoint(d1) : d2 ? "-" + _codePoint(d2.slice(1)) : hy ? "\\-" : safe ? safe : nl$1 ? "�" : ctrl ? _codePoint(ctrl) : "\\" + other);
}
function _serStr(str) {
	return str.replace(/(")|(\\)|(\x00)|([\x01-\x1f]|\x7f)/g, (m, dq, bs, nl$1, ctrl) => dq ? "\\\"" : bs ? "\\\\" : nl$1 ? "�" : _codePoint(ctrl));
}
function normalize(selector) {
	if (!selector.type) throw new Error("This is not an AST node.");
	switch (selector.type) {
		case "compound":
			selector.list.forEach(normalize);
			selector.list.sort((a, b) => _compareArrays(_getSelectorPriority(a), _getSelectorPriority(b)));
			break;
		case "combinator":
			normalize(selector.left);
			break;
		case "list":
			selector.list.forEach(normalize);
			selector.list.sort((a, b) => serialize(a) < serialize(b) ? -1 : 1);
			break;
	}
	return selector;
}
function _getSelectorPriority(selector) {
	switch (selector.type) {
		case "universal": return [1];
		case "tag": return [1];
		case "id": return [2];
		case "class": return [3, selector.name];
		case "attrPresence": return [4, serialize(selector)];
		case "attrValue": return [5, serialize(selector)];
		case "combinator": return [15, serialize(selector)];
	}
}
function compareSpecificity(a, b) {
	return _compareArrays(a, b);
}
function _compareArrays(a, b) {
	if (!Array.isArray(a) || !Array.isArray(b)) throw new Error("Arguments must be arrays.");
	const shorter = a.length < b.length ? a.length : b.length;
	for (let i = 0; i < shorter; i++) {
		if (a[i] === b[i]) continue;
		return a[i] < b[i] ? -1 : 1;
	}
	return a.length - b.length;
}

//#endregion
//#region ../../node_modules/.bun/selderee@0.11.0/node_modules/selderee/lib/selderee.mjs
var DecisionTree = class {
	constructor(input) {
		this.branches = weave(toAstTerminalPairs(input));
	}
	build(builder) {
		return builder(this.branches);
	}
};
function toAstTerminalPairs(array) {
	const len = array.length;
	const results = new Array(len);
	for (let i = 0; i < len; i++) {
		const [selectorString, val] = array[i];
		const ast = preprocess(parse1(selectorString));
		results[i] = {
			ast,
			terminal: {
				type: "terminal",
				valueContainer: {
					index: i,
					value: val,
					specificity: ast.specificity
				}
			}
		};
	}
	return results;
}
function preprocess(ast) {
	reduceSelectorVariants(ast);
	normalize(ast);
	return ast;
}
function reduceSelectorVariants(ast) {
	const newList = [];
	ast.list.forEach((sel) => {
		switch (sel.type) {
			case "class":
				newList.push({
					matcher: "~=",
					modifier: null,
					name: "class",
					namespace: null,
					specificity: sel.specificity,
					type: "attrValue",
					value: sel.name
				});
				break;
			case "id":
				newList.push({
					matcher: "=",
					modifier: null,
					name: "id",
					namespace: null,
					specificity: sel.specificity,
					type: "attrValue",
					value: sel.name
				});
				break;
			case "combinator":
				reduceSelectorVariants(sel.left);
				newList.push(sel);
				break;
			case "universal": break;
			default:
				newList.push(sel);
				break;
		}
	});
	ast.list = newList;
}
function weave(items) {
	const branches = [];
	while (items.length) {
		const topKind = findTopKey(items, (sel) => true, getSelectorKind);
		const { matches, nonmatches, empty } = breakByKind(items, topKind);
		items = nonmatches;
		if (matches.length) branches.push(branchOfKind(topKind, matches));
		if (empty.length) branches.push(...terminate(empty));
	}
	return branches;
}
function terminate(items) {
	const results = [];
	for (const item of items) {
		const terminal = item.terminal;
		if (terminal.type === "terminal") results.push(terminal);
		else {
			const { matches, rest } = partition(terminal.cont, (node) => node.type === "terminal");
			matches.forEach((node) => results.push(node));
			if (rest.length) {
				terminal.cont = rest;
				results.push(terminal);
			}
		}
	}
	return results;
}
function breakByKind(items, selectedKind) {
	const matches = [];
	const nonmatches = [];
	const empty = [];
	for (const item of items) {
		const simpsels = item.ast.list;
		if (simpsels.length) (simpsels.some((node) => getSelectorKind(node) === selectedKind) ? matches : nonmatches).push(item);
		else empty.push(item);
	}
	return {
		matches,
		nonmatches,
		empty
	};
}
function getSelectorKind(sel) {
	switch (sel.type) {
		case "attrPresence": return `attrPresence ${sel.name}`;
		case "attrValue": return `attrValue ${sel.name}`;
		case "combinator": return `combinator ${sel.combinator}`;
		default: return sel.type;
	}
}
function branchOfKind(kind, items) {
	if (kind === "tag") return tagNameBranch(items);
	if (kind.startsWith("attrValue ")) return attrValueBranch(kind.substring(10), items);
	if (kind.startsWith("attrPresence ")) return attrPresenceBranch(kind.substring(13), items);
	if (kind === "combinator >") return combinatorBranch(">", items);
	if (kind === "combinator +") return combinatorBranch("+", items);
	throw new Error(`Unsupported selector kind: ${kind}`);
}
function tagNameBranch(items) {
	const groups = spliceAndGroup(items, (x) => x.type === "tag", (x) => x.name);
	return {
		type: "tagName",
		variants: Object.entries(groups).map(([name$1, group]) => ({
			type: "variant",
			value: name$1,
			cont: weave(group.items)
		}))
	};
}
function attrPresenceBranch(name$1, items) {
	for (const item of items) spliceSimpleSelector(item, (x) => x.type === "attrPresence" && x.name === name$1);
	return {
		type: "attrPresence",
		name: name$1,
		cont: weave(items)
	};
}
function attrValueBranch(name$1, items) {
	const groups = spliceAndGroup(items, (x) => x.type === "attrValue" && x.name === name$1, (x) => `${x.matcher} ${x.modifier || ""} ${x.value}`);
	const matchers = [];
	for (const group of Object.values(groups)) {
		const sel = group.oneSimpleSelector;
		const predicate = getAttrPredicate(sel);
		const continuation = weave(group.items);
		matchers.push({
			type: "matcher",
			matcher: sel.matcher,
			modifier: sel.modifier,
			value: sel.value,
			predicate,
			cont: continuation
		});
	}
	return {
		type: "attrValue",
		name: name$1,
		matchers
	};
}
function getAttrPredicate(sel) {
	if (sel.modifier === "i") {
		const expected = sel.value.toLowerCase();
		switch (sel.matcher) {
			case "=": return (actual) => expected === actual.toLowerCase();
			case "~=": return (actual) => actual.toLowerCase().split(/[ \t]+/).includes(expected);
			case "^=": return (actual) => actual.toLowerCase().startsWith(expected);
			case "$=": return (actual) => actual.toLowerCase().endsWith(expected);
			case "*=": return (actual) => actual.toLowerCase().includes(expected);
			case "|=": return (actual) => {
				const lower = actual.toLowerCase();
				return expected === lower || lower.startsWith(expected) && lower[expected.length] === "-";
			};
		}
	} else {
		const expected = sel.value;
		switch (sel.matcher) {
			case "=": return (actual) => expected === actual;
			case "~=": return (actual) => actual.split(/[ \t]+/).includes(expected);
			case "^=": return (actual) => actual.startsWith(expected);
			case "$=": return (actual) => actual.endsWith(expected);
			case "*=": return (actual) => actual.includes(expected);
			case "|=": return (actual) => expected === actual || actual.startsWith(expected) && actual[expected.length] === "-";
		}
	}
}
function combinatorBranch(combinator, items) {
	const groups = spliceAndGroup(items, (x) => x.type === "combinator" && x.combinator === combinator, (x) => serialize(x.left));
	const leftItems = [];
	for (const group of Object.values(groups)) {
		const rightCont = weave(group.items);
		const leftAst = group.oneSimpleSelector.left;
		leftItems.push({
			ast: leftAst,
			terminal: {
				type: "popElement",
				cont: rightCont
			}
		});
	}
	return {
		type: "pushElement",
		combinator,
		cont: weave(leftItems)
	};
}
function spliceAndGroup(items, predicate, keyCallback) {
	const groups = {};
	while (items.length) {
		const bestKey = findTopKey(items, predicate, keyCallback);
		const bestKeyPredicate = (sel) => predicate(sel) && keyCallback(sel) === bestKey;
		const hasBestKeyPredicate = (item) => item.ast.list.some(bestKeyPredicate);
		const { matches, rest } = partition1(items, hasBestKeyPredicate);
		let oneSimpleSelector = null;
		for (const item of matches) {
			const splicedNode = spliceSimpleSelector(item, bestKeyPredicate);
			if (!oneSimpleSelector) oneSimpleSelector = splicedNode;
		}
		if (oneSimpleSelector == null) throw new Error("No simple selector is found.");
		groups[bestKey] = {
			oneSimpleSelector,
			items: matches
		};
		items = rest;
	}
	return groups;
}
function spliceSimpleSelector(item, predicate) {
	const simpsels = item.ast.list;
	const matches = new Array(simpsels.length);
	let firstIndex = -1;
	for (let i = simpsels.length; i-- > 0;) if (predicate(simpsels[i])) {
		matches[i] = true;
		firstIndex = i;
	}
	if (firstIndex == -1) throw new Error(`Couldn't find the required simple selector.`);
	const result = simpsels[firstIndex];
	item.ast.list = simpsels.filter((sel, i) => !matches[i]);
	return result;
}
function findTopKey(items, predicate, keyCallback) {
	const candidates = {};
	for (const item of items) {
		const candidates1 = {};
		for (const node of item.ast.list.filter(predicate)) candidates1[keyCallback(node)] = true;
		for (const key of Object.keys(candidates1)) if (candidates[key]) candidates[key]++;
		else candidates[key] = 1;
	}
	let topKind = "";
	let topCounter = 0;
	for (const entry of Object.entries(candidates)) if (entry[1] > topCounter) {
		topKind = entry[0];
		topCounter = entry[1];
	}
	return topKind;
}
function partition(src, predicate) {
	const matches = [];
	const rest = [];
	for (const x of src) if (predicate(x)) matches.push(x);
	else rest.push(x);
	return {
		matches,
		rest
	};
}
function partition1(src, predicate) {
	const matches = [];
	const rest = [];
	for (const x of src) if (predicate(x)) matches.push(x);
	else rest.push(x);
	return {
		matches,
		rest
	};
}
var Picker = class {
	constructor(f) {
		this.f = f;
	}
	pickAll(el) {
		return this.f(el);
	}
	pick1(el, preferFirst = false) {
		const results = this.f(el);
		const len = results.length;
		if (len === 0) return null;
		if (len === 1) return results[0].value;
		const comparator = preferFirst ? comparatorPreferFirst : comparatorPreferLast;
		let result = results[0];
		for (let i = 1; i < len; i++) {
			const next = results[i];
			if (comparator(result, next)) result = next;
		}
		return result.value;
	}
};
function comparatorPreferFirst(acc, next) {
	const diff = compareSpecificity(next.specificity, acc.specificity);
	return diff > 0 || diff === 0 && next.index < acc.index;
}
function comparatorPreferLast(acc, next) {
	const diff = compareSpecificity(next.specificity, acc.specificity);
	return diff > 0 || diff === 0 && next.index > acc.index;
}

//#endregion
//#region ../../node_modules/.bun/@selderee+plugin-htmlparser2@0.11.0/node_modules/@selderee/plugin-htmlparser2/lib/hp2-builder.mjs
function hp2Builder(nodes) {
	return new Picker(handleArray(nodes));
}
function handleArray(nodes) {
	const matchers = nodes.map(handleNode);
	return (el, ...tail) => matchers.flatMap((m) => m(el, ...tail));
}
function handleNode(node) {
	switch (node.type) {
		case "terminal": {
			const result = [node.valueContainer];
			return (el, ...tail) => result;
		}
		case "tagName": return handleTagName(node);
		case "attrValue": return handleAttrValueName(node);
		case "attrPresence": return handleAttrPresenceName(node);
		case "pushElement": return handlePushElementNode(node);
		case "popElement": return handlePopElementNode(node);
	}
}
function handleTagName(node) {
	const variants = {};
	for (const variant of node.variants) variants[variant.value] = handleArray(variant.cont);
	return (el, ...tail) => {
		const continuation = variants[el.name];
		return continuation ? continuation(el, ...tail) : [];
	};
}
function handleAttrPresenceName(node) {
	const attrName = node.name;
	const continuation = handleArray(node.cont);
	return (el, ...tail) => Object.prototype.hasOwnProperty.call(el.attribs, attrName) ? continuation(el, ...tail) : [];
}
function handleAttrValueName(node) {
	const callbacks = [];
	for (const matcher of node.matchers) {
		const predicate = matcher.predicate;
		const continuation = handleArray(matcher.cont);
		callbacks.push((attr, el, ...tail) => predicate(attr) ? continuation(el, ...tail) : []);
	}
	const attrName = node.name;
	return (el, ...tail) => {
		const attr = el.attribs[attrName];
		return attr || attr === "" ? callbacks.flatMap((cb) => cb(attr, el, ...tail)) : [];
	};
}
function handlePushElementNode(node) {
	const continuation = handleArray(node.cont);
	const leftElementGetter = node.combinator === "+" ? getPrecedingElement : getParentElement;
	return (el, ...tail) => {
		const next = leftElementGetter(el);
		if (next === null) return [];
		return continuation(next, el, ...tail);
	};
}
const getPrecedingElement = (el) => {
	const prev = el.prev;
	if (prev === null) return null;
	return isTag(prev) ? prev : getPrecedingElement(prev);
};
const getParentElement = (el) => {
	const parent = el.parent;
	return parent && isTag(parent) ? parent : null;
};
function handlePopElementNode(node) {
	const continuation = handleArray(node.cont);
	return (el, next, ...tail) => continuation(next, ...tail);
}

//#endregion
//#region ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-html.js
var decode_data_html_default = new Uint16Array("ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻\"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻\xA0ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌".split("").map((c$1) => c$1.charCodeAt(0)));

//#endregion
//#region ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-xml.js
var decode_data_xml_default = new Uint16Array("Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((c$1) => c$1.charCodeAt(0)));

//#endregion
//#region ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/decode_codepoint.js
var _a;
const decodeMap = new Map([
	[0, 65533],
	[128, 8364],
	[130, 8218],
	[131, 402],
	[132, 8222],
	[133, 8230],
	[134, 8224],
	[135, 8225],
	[136, 710],
	[137, 8240],
	[138, 352],
	[139, 8249],
	[140, 338],
	[142, 381],
	[145, 8216],
	[146, 8217],
	[147, 8220],
	[148, 8221],
	[149, 8226],
	[150, 8211],
	[151, 8212],
	[152, 732],
	[153, 8482],
	[154, 353],
	[155, 8250],
	[156, 339],
	[158, 382],
	[159, 376]
]);
/**
* Polyfill for `String.fromCodePoint`. It is used to create a string from a Unicode code point.
*/
const fromCodePoint = (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function(codePoint) {
	let output = "";
	if (codePoint > 65535) {
		codePoint -= 65536;
		output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
		codePoint = 56320 | codePoint & 1023;
	}
	output += String.fromCharCode(codePoint);
	return output;
};
/**
* Replace the given code point with a replacement character if it is a
* surrogate or is outside the valid range. Otherwise return the code
* point unchanged.
*/
function replaceCodePoint(codePoint) {
	var _a$1;
	if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) return 65533;
	return (_a$1 = decodeMap.get(codePoint)) !== null && _a$1 !== void 0 ? _a$1 : codePoint;
}

//#endregion
//#region ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/decode.js
var CharCodes$1;
(function(CharCodes$2) {
	CharCodes$2[CharCodes$2["NUM"] = 35] = "NUM";
	CharCodes$2[CharCodes$2["SEMI"] = 59] = "SEMI";
	CharCodes$2[CharCodes$2["EQUALS"] = 61] = "EQUALS";
	CharCodes$2[CharCodes$2["ZERO"] = 48] = "ZERO";
	CharCodes$2[CharCodes$2["NINE"] = 57] = "NINE";
	CharCodes$2[CharCodes$2["LOWER_A"] = 97] = "LOWER_A";
	CharCodes$2[CharCodes$2["LOWER_F"] = 102] = "LOWER_F";
	CharCodes$2[CharCodes$2["LOWER_X"] = 120] = "LOWER_X";
	CharCodes$2[CharCodes$2["LOWER_Z"] = 122] = "LOWER_Z";
	CharCodes$2[CharCodes$2["UPPER_A"] = 65] = "UPPER_A";
	CharCodes$2[CharCodes$2["UPPER_F"] = 70] = "UPPER_F";
	CharCodes$2[CharCodes$2["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes$1 || (CharCodes$1 = {}));
/** Bit that needs to be set to convert an upper case ASCII character to lower case */
const TO_LOWER_BIT = 32;
var BinTrieFlags;
(function(BinTrieFlags$1) {
	BinTrieFlags$1[BinTrieFlags$1["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
	BinTrieFlags$1[BinTrieFlags$1["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
	BinTrieFlags$1[BinTrieFlags$1["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));
function isNumber$1(code) {
	return code >= CharCodes$1.ZERO && code <= CharCodes$1.NINE;
}
function isHexadecimalCharacter(code) {
	return code >= CharCodes$1.UPPER_A && code <= CharCodes$1.UPPER_F || code >= CharCodes$1.LOWER_A && code <= CharCodes$1.LOWER_F;
}
function isAsciiAlphaNumeric(code) {
	return code >= CharCodes$1.UPPER_A && code <= CharCodes$1.UPPER_Z || code >= CharCodes$1.LOWER_A && code <= CharCodes$1.LOWER_Z || isNumber$1(code);
}
/**
* Checks if the given character is a valid end character for an entity in an attribute.
*
* Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
* See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
*/
function isEntityInAttributeInvalidEnd(code) {
	return code === CharCodes$1.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function(EntityDecoderState$1) {
	EntityDecoderState$1[EntityDecoderState$1["EntityStart"] = 0] = "EntityStart";
	EntityDecoderState$1[EntityDecoderState$1["NumericStart"] = 1] = "NumericStart";
	EntityDecoderState$1[EntityDecoderState$1["NumericDecimal"] = 2] = "NumericDecimal";
	EntityDecoderState$1[EntityDecoderState$1["NumericHex"] = 3] = "NumericHex";
	EntityDecoderState$1[EntityDecoderState$1["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode$1) {
	/** Entities in text nodes that can end with any character. */
	DecodingMode$1[DecodingMode$1["Legacy"] = 0] = "Legacy";
	/** Only allow entities terminated with a semicolon. */
	DecodingMode$1[DecodingMode$1["Strict"] = 1] = "Strict";
	/** Entities in attributes have limitations on ending characters. */
	DecodingMode$1[DecodingMode$1["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
/**
* Token decoder with support of writing partial entities.
*/
var EntityDecoder = class {
	constructor(decodeTree, emitCodePoint, errors) {
		this.decodeTree = decodeTree;
		this.emitCodePoint = emitCodePoint;
		this.errors = errors;
		/** The current state of the decoder. */
		this.state = EntityDecoderState.EntityStart;
		/** Characters that were consumed while parsing an entity. */
		this.consumed = 1;
		/**
		* The result of the entity.
		*
		* Either the result index of a numeric entity, or the codepoint of a
		* numeric entity.
		*/
		this.result = 0;
		/** The current index in the decode tree. */
		this.treeIndex = 0;
		/** The number of characters that were consumed in excess. */
		this.excess = 1;
		/** The mode in which the decoder is operating. */
		this.decodeMode = DecodingMode.Strict;
	}
	/** Resets the instance to make it reusable. */
	startEntity(decodeMode) {
		this.decodeMode = decodeMode;
		this.state = EntityDecoderState.EntityStart;
		this.result = 0;
		this.treeIndex = 0;
		this.excess = 1;
		this.consumed = 1;
	}
	/**
	* Write an entity to the decoder. This can be called multiple times with partial entities.
	* If the entity is incomplete, the decoder will return -1.
	*
	* Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
	* entity is incomplete, and resume when the next string is written.
	*
	* @param string The string containing the entity (or a continuation of the entity).
	* @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	write(str, offset) {
		switch (this.state) {
			case EntityDecoderState.EntityStart:
				if (str.charCodeAt(offset) === CharCodes$1.NUM) {
					this.state = EntityDecoderState.NumericStart;
					this.consumed += 1;
					return this.stateNumericStart(str, offset + 1);
				}
				this.state = EntityDecoderState.NamedEntity;
				return this.stateNamedEntity(str, offset);
			case EntityDecoderState.NumericStart: return this.stateNumericStart(str, offset);
			case EntityDecoderState.NumericDecimal: return this.stateNumericDecimal(str, offset);
			case EntityDecoderState.NumericHex: return this.stateNumericHex(str, offset);
			case EntityDecoderState.NamedEntity: return this.stateNamedEntity(str, offset);
		}
	}
	/**
	* Switches between the numeric decimal and hexadecimal states.
	*
	* Equivalent to the `Numeric character reference state` in the HTML spec.
	*
	* @param str The string containing the entity (or a continuation of the entity).
	* @param offset The current offset.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	stateNumericStart(str, offset) {
		if (offset >= str.length) return -1;
		if ((str.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes$1.LOWER_X) {
			this.state = EntityDecoderState.NumericHex;
			this.consumed += 1;
			return this.stateNumericHex(str, offset + 1);
		}
		this.state = EntityDecoderState.NumericDecimal;
		return this.stateNumericDecimal(str, offset);
	}
	addToNumericResult(str, start, end, base) {
		if (start !== end) {
			const digitCount = end - start;
			this.result = this.result * Math.pow(base, digitCount) + parseInt(str.substr(start, digitCount), base);
			this.consumed += digitCount;
		}
	}
	/**
	* Parses a hexadecimal numeric entity.
	*
	* Equivalent to the `Hexademical character reference state` in the HTML spec.
	*
	* @param str The string containing the entity (or a continuation of the entity).
	* @param offset The current offset.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	stateNumericHex(str, offset) {
		const startIdx = offset;
		while (offset < str.length) {
			const char = str.charCodeAt(offset);
			if (isNumber$1(char) || isHexadecimalCharacter(char)) offset += 1;
			else {
				this.addToNumericResult(str, startIdx, offset, 16);
				return this.emitNumericEntity(char, 3);
			}
		}
		this.addToNumericResult(str, startIdx, offset, 16);
		return -1;
	}
	/**
	* Parses a decimal numeric entity.
	*
	* Equivalent to the `Decimal character reference state` in the HTML spec.
	*
	* @param str The string containing the entity (or a continuation of the entity).
	* @param offset The current offset.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	stateNumericDecimal(str, offset) {
		const startIdx = offset;
		while (offset < str.length) {
			const char = str.charCodeAt(offset);
			if (isNumber$1(char)) offset += 1;
			else {
				this.addToNumericResult(str, startIdx, offset, 10);
				return this.emitNumericEntity(char, 2);
			}
		}
		this.addToNumericResult(str, startIdx, offset, 10);
		return -1;
	}
	/**
	* Validate and emit a numeric entity.
	*
	* Implements the logic from the `Hexademical character reference start
	* state` and `Numeric character reference end state` in the HTML spec.
	*
	* @param lastCp The last code point of the entity. Used to see if the
	*               entity was terminated with a semicolon.
	* @param expectedLength The minimum number of characters that should be
	*                       consumed. Used to validate that at least one digit
	*                       was consumed.
	* @returns The number of characters that were consumed.
	*/
	emitNumericEntity(lastCp, expectedLength) {
		var _a$1;
		if (this.consumed <= expectedLength) {
			(_a$1 = this.errors) === null || _a$1 === void 0 || _a$1.absenceOfDigitsInNumericCharacterReference(this.consumed);
			return 0;
		}
		if (lastCp === CharCodes$1.SEMI) this.consumed += 1;
		else if (this.decodeMode === DecodingMode.Strict) return 0;
		this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
		if (this.errors) {
			if (lastCp !== CharCodes$1.SEMI) this.errors.missingSemicolonAfterCharacterReference();
			this.errors.validateNumericCharacterReference(this.result);
		}
		return this.consumed;
	}
	/**
	* Parses a named entity.
	*
	* Equivalent to the `Named character reference state` in the HTML spec.
	*
	* @param str The string containing the entity (or a continuation of the entity).
	* @param offset The current offset.
	* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
	*/
	stateNamedEntity(str, offset) {
		const { decodeTree } = this;
		let current = decodeTree[this.treeIndex];
		let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
		for (; offset < str.length; offset++, this.excess++) {
			const char = str.charCodeAt(offset);
			this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
			if (this.treeIndex < 0) return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
			current = decodeTree[this.treeIndex];
			valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
			if (valueLength !== 0) {
				if (char === CharCodes$1.SEMI) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
				if (this.decodeMode !== DecodingMode.Strict) {
					this.result = this.treeIndex;
					this.consumed += this.excess;
					this.excess = 0;
				}
			}
		}
		return -1;
	}
	/**
	* Emit a named entity that was not terminated with a semicolon.
	*
	* @returns The number of characters consumed.
	*/
	emitNotTerminatedNamedEntity() {
		var _a$1;
		const { result, decodeTree } = this;
		const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
		this.emitNamedEntityData(result, valueLength, this.consumed);
		(_a$1 = this.errors) === null || _a$1 === void 0 || _a$1.missingSemicolonAfterCharacterReference();
		return this.consumed;
	}
	/**
	* Emit a named entity.
	*
	* @param result The index of the entity in the decode tree.
	* @param valueLength The number of bytes in the entity.
	* @param consumed The number of characters consumed.
	*
	* @returns The number of characters consumed.
	*/
	emitNamedEntityData(result, valueLength, consumed) {
		const { decodeTree } = this;
		this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH : decodeTree[result + 1], consumed);
		if (valueLength === 3) this.emitCodePoint(decodeTree[result + 2], consumed);
		return consumed;
	}
	/**
	* Signal to the parser that the end of the input was reached.
	*
	* Remaining data will be emitted and relevant errors will be produced.
	*
	* @returns The number of characters consumed.
	*/
	end() {
		var _a$1;
		switch (this.state) {
			case EntityDecoderState.NamedEntity: return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
			case EntityDecoderState.NumericDecimal: return this.emitNumericEntity(0, 2);
			case EntityDecoderState.NumericHex: return this.emitNumericEntity(0, 3);
			case EntityDecoderState.NumericStart:
				(_a$1 = this.errors) === null || _a$1 === void 0 || _a$1.absenceOfDigitsInNumericCharacterReference(this.consumed);
				return 0;
			case EntityDecoderState.EntityStart: return 0;
		}
	}
};
/**
* Creates a function that decodes entities in a string.
*
* @param decodeTree The decode tree.
* @returns A function that decodes entities in a string.
*/
function getDecoder(decodeTree) {
	let ret = "";
	const decoder = new EntityDecoder(decodeTree, (str) => ret += fromCodePoint(str));
	return function decodeWithTrie(str, decodeMode) {
		let lastIndex = 0;
		let offset = 0;
		while ((offset = str.indexOf("&", offset)) >= 0) {
			ret += str.slice(lastIndex, offset);
			decoder.startEntity(decodeMode);
			const len = decoder.write(str, offset + 1);
			if (len < 0) {
				lastIndex = offset + decoder.end();
				break;
			}
			lastIndex = offset + len;
			offset = len === 0 ? lastIndex + 1 : lastIndex;
		}
		const result = ret + str.slice(lastIndex);
		ret = "";
		return result;
	};
}
/**
* Determines the branch of the current node that is taken given the current
* character. This function is used to traverse the trie.
*
* @param decodeTree The trie.
* @param current The current node.
* @param nodeIdx The index right after the current node and its value.
* @param char The current character.
* @returns The index of the next node, or -1 if no branch is taken.
*/
function determineBranch(decodeTree, current, nodeIdx, char) {
	const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
	const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
	if (branchCount === 0) return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
	if (jumpOffset) {
		const value = char - jumpOffset;
		return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
	}
	let lo = nodeIdx;
	let hi = lo + branchCount - 1;
	while (lo <= hi) {
		const mid = lo + hi >>> 1;
		const midVal = decodeTree[mid];
		if (midVal < char) lo = mid + 1;
		else if (midVal > char) hi = mid - 1;
		else return decodeTree[mid + branchCount];
	}
	return -1;
}
const htmlDecoder = getDecoder(decode_data_html_default);
const xmlDecoder = getDecoder(decode_data_xml_default);

//#endregion
//#region ../../node_modules/.bun/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/Tokenizer.js
var CharCodes;
(function(CharCodes$2) {
	CharCodes$2[CharCodes$2["Tab"] = 9] = "Tab";
	CharCodes$2[CharCodes$2["NewLine"] = 10] = "NewLine";
	CharCodes$2[CharCodes$2["FormFeed"] = 12] = "FormFeed";
	CharCodes$2[CharCodes$2["CarriageReturn"] = 13] = "CarriageReturn";
	CharCodes$2[CharCodes$2["Space"] = 32] = "Space";
	CharCodes$2[CharCodes$2["ExclamationMark"] = 33] = "ExclamationMark";
	CharCodes$2[CharCodes$2["Number"] = 35] = "Number";
	CharCodes$2[CharCodes$2["Amp"] = 38] = "Amp";
	CharCodes$2[CharCodes$2["SingleQuote"] = 39] = "SingleQuote";
	CharCodes$2[CharCodes$2["DoubleQuote"] = 34] = "DoubleQuote";
	CharCodes$2[CharCodes$2["Dash"] = 45] = "Dash";
	CharCodes$2[CharCodes$2["Slash"] = 47] = "Slash";
	CharCodes$2[CharCodes$2["Zero"] = 48] = "Zero";
	CharCodes$2[CharCodes$2["Nine"] = 57] = "Nine";
	CharCodes$2[CharCodes$2["Semi"] = 59] = "Semi";
	CharCodes$2[CharCodes$2["Lt"] = 60] = "Lt";
	CharCodes$2[CharCodes$2["Eq"] = 61] = "Eq";
	CharCodes$2[CharCodes$2["Gt"] = 62] = "Gt";
	CharCodes$2[CharCodes$2["Questionmark"] = 63] = "Questionmark";
	CharCodes$2[CharCodes$2["UpperA"] = 65] = "UpperA";
	CharCodes$2[CharCodes$2["LowerA"] = 97] = "LowerA";
	CharCodes$2[CharCodes$2["UpperF"] = 70] = "UpperF";
	CharCodes$2[CharCodes$2["LowerF"] = 102] = "LowerF";
	CharCodes$2[CharCodes$2["UpperZ"] = 90] = "UpperZ";
	CharCodes$2[CharCodes$2["LowerZ"] = 122] = "LowerZ";
	CharCodes$2[CharCodes$2["LowerX"] = 120] = "LowerX";
	CharCodes$2[CharCodes$2["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
})(CharCodes || (CharCodes = {}));
/** All the states the tokenizer can be in. */
var State;
(function(State$1) {
	State$1[State$1["Text"] = 1] = "Text";
	State$1[State$1["BeforeTagName"] = 2] = "BeforeTagName";
	State$1[State$1["InTagName"] = 3] = "InTagName";
	State$1[State$1["InSelfClosingTag"] = 4] = "InSelfClosingTag";
	State$1[State$1["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
	State$1[State$1["InClosingTagName"] = 6] = "InClosingTagName";
	State$1[State$1["AfterClosingTagName"] = 7] = "AfterClosingTagName";
	State$1[State$1["BeforeAttributeName"] = 8] = "BeforeAttributeName";
	State$1[State$1["InAttributeName"] = 9] = "InAttributeName";
	State$1[State$1["AfterAttributeName"] = 10] = "AfterAttributeName";
	State$1[State$1["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
	State$1[State$1["InAttributeValueDq"] = 12] = "InAttributeValueDq";
	State$1[State$1["InAttributeValueSq"] = 13] = "InAttributeValueSq";
	State$1[State$1["InAttributeValueNq"] = 14] = "InAttributeValueNq";
	State$1[State$1["BeforeDeclaration"] = 15] = "BeforeDeclaration";
	State$1[State$1["InDeclaration"] = 16] = "InDeclaration";
	State$1[State$1["InProcessingInstruction"] = 17] = "InProcessingInstruction";
	State$1[State$1["BeforeComment"] = 18] = "BeforeComment";
	State$1[State$1["CDATASequence"] = 19] = "CDATASequence";
	State$1[State$1["InSpecialComment"] = 20] = "InSpecialComment";
	State$1[State$1["InCommentLike"] = 21] = "InCommentLike";
	State$1[State$1["BeforeSpecialS"] = 22] = "BeforeSpecialS";
	State$1[State$1["SpecialStartSequence"] = 23] = "SpecialStartSequence";
	State$1[State$1["InSpecialTag"] = 24] = "InSpecialTag";
	State$1[State$1["BeforeEntity"] = 25] = "BeforeEntity";
	State$1[State$1["BeforeNumericEntity"] = 26] = "BeforeNumericEntity";
	State$1[State$1["InNamedEntity"] = 27] = "InNamedEntity";
	State$1[State$1["InNumericEntity"] = 28] = "InNumericEntity";
	State$1[State$1["InHexEntity"] = 29] = "InHexEntity";
})(State || (State = {}));
function isWhitespace(c$1) {
	return c$1 === CharCodes.Space || c$1 === CharCodes.NewLine || c$1 === CharCodes.Tab || c$1 === CharCodes.FormFeed || c$1 === CharCodes.CarriageReturn;
}
function isEndOfTagSection(c$1) {
	return c$1 === CharCodes.Slash || c$1 === CharCodes.Gt || isWhitespace(c$1);
}
function isNumber(c$1) {
	return c$1 >= CharCodes.Zero && c$1 <= CharCodes.Nine;
}
function isASCIIAlpha(c$1) {
	return c$1 >= CharCodes.LowerA && c$1 <= CharCodes.LowerZ || c$1 >= CharCodes.UpperA && c$1 <= CharCodes.UpperZ;
}
function isHexDigit(c$1) {
	return c$1 >= CharCodes.UpperA && c$1 <= CharCodes.UpperF || c$1 >= CharCodes.LowerA && c$1 <= CharCodes.LowerF;
}
var QuoteType;
(function(QuoteType$1) {
	QuoteType$1[QuoteType$1["NoValue"] = 0] = "NoValue";
	QuoteType$1[QuoteType$1["Unquoted"] = 1] = "Unquoted";
	QuoteType$1[QuoteType$1["Single"] = 2] = "Single";
	QuoteType$1[QuoteType$1["Double"] = 3] = "Double";
})(QuoteType || (QuoteType = {}));
/**
* Sequences used to match longer strings.
*
* We don't have `Script`, `Style`, or `Title` here. Instead, we re-use the *End
* sequences with an increased offset.
*/
const Sequences = {
	Cdata: new Uint8Array([
		67,
		68,
		65,
		84,
		65,
		91
	]),
	CdataEnd: new Uint8Array([
		93,
		93,
		62
	]),
	CommentEnd: new Uint8Array([
		45,
		45,
		62
	]),
	ScriptEnd: new Uint8Array([
		60,
		47,
		115,
		99,
		114,
		105,
		112,
		116
	]),
	StyleEnd: new Uint8Array([
		60,
		47,
		115,
		116,
		121,
		108,
		101
	]),
	TitleEnd: new Uint8Array([
		60,
		47,
		116,
		105,
		116,
		108,
		101
	])
};
var Tokenizer = class {
	constructor({ xmlMode = false, decodeEntities = true }, cbs) {
		this.cbs = cbs;
		/** The current state the tokenizer is in. */
		this.state = State.Text;
		/** The read buffer. */
		this.buffer = "";
		/** The beginning of the section that is currently being read. */
		this.sectionStart = 0;
		/** The index within the buffer that we are currently looking at. */
		this.index = 0;
		/** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
		this.baseState = State.Text;
		/** For special parsing behavior inside of script and style tags. */
		this.isSpecial = false;
		/** Indicates whether the tokenizer has been paused. */
		this.running = true;
		/** The offset of the current buffer. */
		this.offset = 0;
		this.currentSequence = void 0;
		this.sequenceIndex = 0;
		this.trieIndex = 0;
		this.trieCurrent = 0;
		/** For named entities, the index of the value. For numeric entities, the code point. */
		this.entityResult = 0;
		this.entityExcess = 0;
		this.xmlMode = xmlMode;
		this.decodeEntities = decodeEntities;
		this.entityTrie = xmlMode ? decode_data_xml_default : decode_data_html_default;
	}
	reset() {
		this.state = State.Text;
		this.buffer = "";
		this.sectionStart = 0;
		this.index = 0;
		this.baseState = State.Text;
		this.currentSequence = void 0;
		this.running = true;
		this.offset = 0;
	}
	write(chunk) {
		this.offset += this.buffer.length;
		this.buffer = chunk;
		this.parse();
	}
	end() {
		if (this.running) this.finish();
	}
	pause() {
		this.running = false;
	}
	resume() {
		this.running = true;
		if (this.index < this.buffer.length + this.offset) this.parse();
	}
	/**
	* The current index within all of the written data.
	*/
	getIndex() {
		return this.index;
	}
	/**
	* The start of the current section.
	*/
	getSectionStart() {
		return this.sectionStart;
	}
	stateText(c$1) {
		if (c$1 === CharCodes.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes.Lt)) {
			if (this.index > this.sectionStart) this.cbs.ontext(this.sectionStart, this.index);
			this.state = State.BeforeTagName;
			this.sectionStart = this.index;
		} else if (this.decodeEntities && c$1 === CharCodes.Amp) this.state = State.BeforeEntity;
	}
	stateSpecialStartSequence(c$1) {
		const isEnd = this.sequenceIndex === this.currentSequence.length;
		if (!(isEnd ? isEndOfTagSection(c$1) : (c$1 | 32) === this.currentSequence[this.sequenceIndex])) this.isSpecial = false;
		else if (!isEnd) {
			this.sequenceIndex++;
			return;
		}
		this.sequenceIndex = 0;
		this.state = State.InTagName;
		this.stateInTagName(c$1);
	}
	/** Look for an end tag. For <title> tags, also decode entities. */
	stateInSpecialTag(c$1) {
		if (this.sequenceIndex === this.currentSequence.length) {
			if (c$1 === CharCodes.Gt || isWhitespace(c$1)) {
				const endOfText = this.index - this.currentSequence.length;
				if (this.sectionStart < endOfText) {
					const actualIndex = this.index;
					this.index = endOfText;
					this.cbs.ontext(this.sectionStart, endOfText);
					this.index = actualIndex;
				}
				this.isSpecial = false;
				this.sectionStart = endOfText + 2;
				this.stateInClosingTagName(c$1);
				return;
			}
			this.sequenceIndex = 0;
		}
		if ((c$1 | 32) === this.currentSequence[this.sequenceIndex]) this.sequenceIndex += 1;
		else if (this.sequenceIndex === 0) {
			if (this.currentSequence === Sequences.TitleEnd) {
				if (this.decodeEntities && c$1 === CharCodes.Amp) this.state = State.BeforeEntity;
			} else if (this.fastForwardTo(CharCodes.Lt)) this.sequenceIndex = 1;
		} else this.sequenceIndex = Number(c$1 === CharCodes.Lt);
	}
	stateCDATASequence(c$1) {
		if (c$1 === Sequences.Cdata[this.sequenceIndex]) {
			if (++this.sequenceIndex === Sequences.Cdata.length) {
				this.state = State.InCommentLike;
				this.currentSequence = Sequences.CdataEnd;
				this.sequenceIndex = 0;
				this.sectionStart = this.index + 1;
			}
		} else {
			this.sequenceIndex = 0;
			this.state = State.InDeclaration;
			this.stateInDeclaration(c$1);
		}
	}
	/**
	* When we wait for one specific character, we can speed things up
	* by skipping through the buffer until we find it.
	*
	* @returns Whether the character was found.
	*/
	fastForwardTo(c$1) {
		while (++this.index < this.buffer.length + this.offset) if (this.buffer.charCodeAt(this.index - this.offset) === c$1) return true;
		this.index = this.buffer.length + this.offset - 1;
		return false;
	}
	/**
	* Comments and CDATA end with `-->` and `]]>`.
	*
	* Their common qualities are:
	* - Their end sequences have a distinct character they start with.
	* - That character is then repeated, so we have to check multiple repeats.
	* - All characters but the start character of the sequence can be skipped.
	*/
	stateInCommentLike(c$1) {
		if (c$1 === this.currentSequence[this.sequenceIndex]) {
			if (++this.sequenceIndex === this.currentSequence.length) {
				if (this.currentSequence === Sequences.CdataEnd) this.cbs.oncdata(this.sectionStart, this.index, 2);
				else this.cbs.oncomment(this.sectionStart, this.index, 2);
				this.sequenceIndex = 0;
				this.sectionStart = this.index + 1;
				this.state = State.Text;
			}
		} else if (this.sequenceIndex === 0) {
			if (this.fastForwardTo(this.currentSequence[0])) this.sequenceIndex = 1;
		} else if (c$1 !== this.currentSequence[this.sequenceIndex - 1]) this.sequenceIndex = 0;
	}
	/**
	* HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
	*
	* XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
	* We allow anything that wouldn't end the tag.
	*/
	isTagStartChar(c$1) {
		return this.xmlMode ? !isEndOfTagSection(c$1) : isASCIIAlpha(c$1);
	}
	startSpecial(sequence, offset) {
		this.isSpecial = true;
		this.currentSequence = sequence;
		this.sequenceIndex = offset;
		this.state = State.SpecialStartSequence;
	}
	stateBeforeTagName(c$1) {
		if (c$1 === CharCodes.ExclamationMark) {
			this.state = State.BeforeDeclaration;
			this.sectionStart = this.index + 1;
		} else if (c$1 === CharCodes.Questionmark) {
			this.state = State.InProcessingInstruction;
			this.sectionStart = this.index + 1;
		} else if (this.isTagStartChar(c$1)) {
			const lower = c$1 | 32;
			this.sectionStart = this.index;
			if (!this.xmlMode && lower === Sequences.TitleEnd[2]) this.startSpecial(Sequences.TitleEnd, 3);
			else this.state = !this.xmlMode && lower === Sequences.ScriptEnd[2] ? State.BeforeSpecialS : State.InTagName;
		} else if (c$1 === CharCodes.Slash) this.state = State.BeforeClosingTagName;
		else {
			this.state = State.Text;
			this.stateText(c$1);
		}
	}
	stateInTagName(c$1) {
		if (isEndOfTagSection(c$1)) {
			this.cbs.onopentagname(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(c$1);
		}
	}
	stateBeforeClosingTagName(c$1) {
		if (isWhitespace(c$1)) {} else if (c$1 === CharCodes.Gt) this.state = State.Text;
		else {
			this.state = this.isTagStartChar(c$1) ? State.InClosingTagName : State.InSpecialComment;
			this.sectionStart = this.index;
		}
	}
	stateInClosingTagName(c$1) {
		if (c$1 === CharCodes.Gt || isWhitespace(c$1)) {
			this.cbs.onclosetag(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.state = State.AfterClosingTagName;
			this.stateAfterClosingTagName(c$1);
		}
	}
	stateAfterClosingTagName(c$1) {
		if (c$1 === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
			this.state = State.Text;
			this.baseState = State.Text;
			this.sectionStart = this.index + 1;
		}
	}
	stateBeforeAttributeName(c$1) {
		if (c$1 === CharCodes.Gt) {
			this.cbs.onopentagend(this.index);
			if (this.isSpecial) {
				this.state = State.InSpecialTag;
				this.sequenceIndex = 0;
			} else this.state = State.Text;
			this.baseState = this.state;
			this.sectionStart = this.index + 1;
		} else if (c$1 === CharCodes.Slash) this.state = State.InSelfClosingTag;
		else if (!isWhitespace(c$1)) {
			this.state = State.InAttributeName;
			this.sectionStart = this.index;
		}
	}
	stateInSelfClosingTag(c$1) {
		if (c$1 === CharCodes.Gt) {
			this.cbs.onselfclosingtag(this.index);
			this.state = State.Text;
			this.baseState = State.Text;
			this.sectionStart = this.index + 1;
			this.isSpecial = false;
		} else if (!isWhitespace(c$1)) {
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(c$1);
		}
	}
	stateInAttributeName(c$1) {
		if (c$1 === CharCodes.Eq || isEndOfTagSection(c$1)) {
			this.cbs.onattribname(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.state = State.AfterAttributeName;
			this.stateAfterAttributeName(c$1);
		}
	}
	stateAfterAttributeName(c$1) {
		if (c$1 === CharCodes.Eq) this.state = State.BeforeAttributeValue;
		else if (c$1 === CharCodes.Slash || c$1 === CharCodes.Gt) {
			this.cbs.onattribend(QuoteType.NoValue, this.index);
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(c$1);
		} else if (!isWhitespace(c$1)) {
			this.cbs.onattribend(QuoteType.NoValue, this.index);
			this.state = State.InAttributeName;
			this.sectionStart = this.index;
		}
	}
	stateBeforeAttributeValue(c$1) {
		if (c$1 === CharCodes.DoubleQuote) {
			this.state = State.InAttributeValueDq;
			this.sectionStart = this.index + 1;
		} else if (c$1 === CharCodes.SingleQuote) {
			this.state = State.InAttributeValueSq;
			this.sectionStart = this.index + 1;
		} else if (!isWhitespace(c$1)) {
			this.sectionStart = this.index;
			this.state = State.InAttributeValueNq;
			this.stateInAttributeValueNoQuotes(c$1);
		}
	}
	handleInAttributeValue(c$1, quote) {
		if (c$1 === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
			this.cbs.onattribdata(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.cbs.onattribend(quote === CharCodes.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index);
			this.state = State.BeforeAttributeName;
		} else if (this.decodeEntities && c$1 === CharCodes.Amp) {
			this.baseState = this.state;
			this.state = State.BeforeEntity;
		}
	}
	stateInAttributeValueDoubleQuotes(c$1) {
		this.handleInAttributeValue(c$1, CharCodes.DoubleQuote);
	}
	stateInAttributeValueSingleQuotes(c$1) {
		this.handleInAttributeValue(c$1, CharCodes.SingleQuote);
	}
	stateInAttributeValueNoQuotes(c$1) {
		if (isWhitespace(c$1) || c$1 === CharCodes.Gt) {
			this.cbs.onattribdata(this.sectionStart, this.index);
			this.sectionStart = -1;
			this.cbs.onattribend(QuoteType.Unquoted, this.index);
			this.state = State.BeforeAttributeName;
			this.stateBeforeAttributeName(c$1);
		} else if (this.decodeEntities && c$1 === CharCodes.Amp) {
			this.baseState = this.state;
			this.state = State.BeforeEntity;
		}
	}
	stateBeforeDeclaration(c$1) {
		if (c$1 === CharCodes.OpeningSquareBracket) {
			this.state = State.CDATASequence;
			this.sequenceIndex = 0;
		} else this.state = c$1 === CharCodes.Dash ? State.BeforeComment : State.InDeclaration;
	}
	stateInDeclaration(c$1) {
		if (c$1 === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
			this.cbs.ondeclaration(this.sectionStart, this.index);
			this.state = State.Text;
			this.sectionStart = this.index + 1;
		}
	}
	stateInProcessingInstruction(c$1) {
		if (c$1 === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
			this.cbs.onprocessinginstruction(this.sectionStart, this.index);
			this.state = State.Text;
			this.sectionStart = this.index + 1;
		}
	}
	stateBeforeComment(c$1) {
		if (c$1 === CharCodes.Dash) {
			this.state = State.InCommentLike;
			this.currentSequence = Sequences.CommentEnd;
			this.sequenceIndex = 2;
			this.sectionStart = this.index + 1;
		} else this.state = State.InDeclaration;
	}
	stateInSpecialComment(c$1) {
		if (c$1 === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
			this.cbs.oncomment(this.sectionStart, this.index, 0);
			this.state = State.Text;
			this.sectionStart = this.index + 1;
		}
	}
	stateBeforeSpecialS(c$1) {
		const lower = c$1 | 32;
		if (lower === Sequences.ScriptEnd[3]) this.startSpecial(Sequences.ScriptEnd, 4);
		else if (lower === Sequences.StyleEnd[3]) this.startSpecial(Sequences.StyleEnd, 4);
		else {
			this.state = State.InTagName;
			this.stateInTagName(c$1);
		}
	}
	stateBeforeEntity(c$1) {
		this.entityExcess = 1;
		this.entityResult = 0;
		if (c$1 === CharCodes.Number) this.state = State.BeforeNumericEntity;
		else if (c$1 === CharCodes.Amp) {} else {
			this.trieIndex = 0;
			this.trieCurrent = this.entityTrie[0];
			this.state = State.InNamedEntity;
			this.stateInNamedEntity(c$1);
		}
	}
	stateInNamedEntity(c$1) {
		this.entityExcess += 1;
		this.trieIndex = determineBranch(this.entityTrie, this.trieCurrent, this.trieIndex + 1, c$1);
		if (this.trieIndex < 0) {
			this.emitNamedEntity();
			this.index--;
			return;
		}
		this.trieCurrent = this.entityTrie[this.trieIndex];
		const masked = this.trieCurrent & BinTrieFlags.VALUE_LENGTH;
		if (masked) {
			const valueLength = (masked >> 14) - 1;
			if (!this.allowLegacyEntity() && c$1 !== CharCodes.Semi) this.trieIndex += valueLength;
			else {
				const entityStart = this.index - this.entityExcess + 1;
				if (entityStart > this.sectionStart) this.emitPartial(this.sectionStart, entityStart);
				this.entityResult = this.trieIndex;
				this.trieIndex += valueLength;
				this.entityExcess = 0;
				this.sectionStart = this.index + 1;
				if (valueLength === 0) this.emitNamedEntity();
			}
		}
	}
	emitNamedEntity() {
		this.state = this.baseState;
		if (this.entityResult === 0) return;
		switch ((this.entityTrie[this.entityResult] & BinTrieFlags.VALUE_LENGTH) >> 14) {
			case 1:
				this.emitCodePoint(this.entityTrie[this.entityResult] & ~BinTrieFlags.VALUE_LENGTH);
				break;
			case 2:
				this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
				break;
			case 3:
				this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
				this.emitCodePoint(this.entityTrie[this.entityResult + 2]);
		}
	}
	stateBeforeNumericEntity(c$1) {
		if ((c$1 | 32) === CharCodes.LowerX) {
			this.entityExcess++;
			this.state = State.InHexEntity;
		} else {
			this.state = State.InNumericEntity;
			this.stateInNumericEntity(c$1);
		}
	}
	emitNumericEntity(strict) {
		const entityStart = this.index - this.entityExcess - 1;
		if (entityStart + 2 + Number(this.state === State.InHexEntity) !== this.index) {
			if (entityStart > this.sectionStart) this.emitPartial(this.sectionStart, entityStart);
			this.sectionStart = this.index + Number(strict);
			this.emitCodePoint(replaceCodePoint(this.entityResult));
		}
		this.state = this.baseState;
	}
	stateInNumericEntity(c$1) {
		if (c$1 === CharCodes.Semi) this.emitNumericEntity(true);
		else if (isNumber(c$1)) {
			this.entityResult = this.entityResult * 10 + (c$1 - CharCodes.Zero);
			this.entityExcess++;
		} else {
			if (this.allowLegacyEntity()) this.emitNumericEntity(false);
			else this.state = this.baseState;
			this.index--;
		}
	}
	stateInHexEntity(c$1) {
		if (c$1 === CharCodes.Semi) this.emitNumericEntity(true);
		else if (isNumber(c$1)) {
			this.entityResult = this.entityResult * 16 + (c$1 - CharCodes.Zero);
			this.entityExcess++;
		} else if (isHexDigit(c$1)) {
			this.entityResult = this.entityResult * 16 + ((c$1 | 32) - CharCodes.LowerA + 10);
			this.entityExcess++;
		} else {
			if (this.allowLegacyEntity()) this.emitNumericEntity(false);
			else this.state = this.baseState;
			this.index--;
		}
	}
	allowLegacyEntity() {
		return !this.xmlMode && (this.baseState === State.Text || this.baseState === State.InSpecialTag);
	}
	/**
	* Remove data that has already been consumed from the buffer.
	*/
	cleanup() {
		if (this.running && this.sectionStart !== this.index) {
			if (this.state === State.Text || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
				this.cbs.ontext(this.sectionStart, this.index);
				this.sectionStart = this.index;
			} else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
				this.cbs.onattribdata(this.sectionStart, this.index);
				this.sectionStart = this.index;
			}
		}
	}
	shouldContinue() {
		return this.index < this.buffer.length + this.offset && this.running;
	}
	/**
	* Iterates through the buffer, calling the function corresponding to the current state.
	*
	* States that are more likely to be hit are higher up, as a performance improvement.
	*/
	parse() {
		while (this.shouldContinue()) {
			const c$1 = this.buffer.charCodeAt(this.index - this.offset);
			switch (this.state) {
				case State.Text:
					this.stateText(c$1);
					break;
				case State.SpecialStartSequence:
					this.stateSpecialStartSequence(c$1);
					break;
				case State.InSpecialTag:
					this.stateInSpecialTag(c$1);
					break;
				case State.CDATASequence:
					this.stateCDATASequence(c$1);
					break;
				case State.InAttributeValueDq:
					this.stateInAttributeValueDoubleQuotes(c$1);
					break;
				case State.InAttributeName:
					this.stateInAttributeName(c$1);
					break;
				case State.InCommentLike:
					this.stateInCommentLike(c$1);
					break;
				case State.InSpecialComment:
					this.stateInSpecialComment(c$1);
					break;
				case State.BeforeAttributeName:
					this.stateBeforeAttributeName(c$1);
					break;
				case State.InTagName:
					this.stateInTagName(c$1);
					break;
				case State.InClosingTagName:
					this.stateInClosingTagName(c$1);
					break;
				case State.BeforeTagName:
					this.stateBeforeTagName(c$1);
					break;
				case State.AfterAttributeName:
					this.stateAfterAttributeName(c$1);
					break;
				case State.InAttributeValueSq:
					this.stateInAttributeValueSingleQuotes(c$1);
					break;
				case State.BeforeAttributeValue:
					this.stateBeforeAttributeValue(c$1);
					break;
				case State.BeforeClosingTagName:
					this.stateBeforeClosingTagName(c$1);
					break;
				case State.AfterClosingTagName:
					this.stateAfterClosingTagName(c$1);
					break;
				case State.BeforeSpecialS:
					this.stateBeforeSpecialS(c$1);
					break;
				case State.InAttributeValueNq:
					this.stateInAttributeValueNoQuotes(c$1);
					break;
				case State.InSelfClosingTag:
					this.stateInSelfClosingTag(c$1);
					break;
				case State.InDeclaration:
					this.stateInDeclaration(c$1);
					break;
				case State.BeforeDeclaration:
					this.stateBeforeDeclaration(c$1);
					break;
				case State.BeforeComment:
					this.stateBeforeComment(c$1);
					break;
				case State.InProcessingInstruction:
					this.stateInProcessingInstruction(c$1);
					break;
				case State.InNamedEntity:
					this.stateInNamedEntity(c$1);
					break;
				case State.BeforeEntity:
					this.stateBeforeEntity(c$1);
					break;
				case State.InHexEntity:
					this.stateInHexEntity(c$1);
					break;
				case State.InNumericEntity:
					this.stateInNumericEntity(c$1);
					break;
				default: this.stateBeforeNumericEntity(c$1);
			}
			this.index++;
		}
		this.cleanup();
	}
	finish() {
		if (this.state === State.InNamedEntity) this.emitNamedEntity();
		if (this.sectionStart < this.index) this.handleTrailingData();
		this.cbs.onend();
	}
	/** Handle any trailing data. */
	handleTrailingData() {
		const endIndex = this.buffer.length + this.offset;
		if (this.state === State.InCommentLike) if (this.currentSequence === Sequences.CdataEnd) this.cbs.oncdata(this.sectionStart, endIndex, 0);
		else this.cbs.oncomment(this.sectionStart, endIndex, 0);
		else if (this.state === State.InNumericEntity && this.allowLegacyEntity()) this.emitNumericEntity(false);
		else if (this.state === State.InHexEntity && this.allowLegacyEntity()) this.emitNumericEntity(false);
		else if (this.state === State.InTagName || this.state === State.BeforeAttributeName || this.state === State.BeforeAttributeValue || this.state === State.AfterAttributeName || this.state === State.InAttributeName || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueDq || this.state === State.InAttributeValueNq || this.state === State.InClosingTagName) {} else this.cbs.ontext(this.sectionStart, endIndex);
	}
	emitPartial(start, endIndex) {
		if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) this.cbs.onattribdata(start, endIndex);
		else this.cbs.ontext(start, endIndex);
	}
	emitCodePoint(cp) {
		if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) this.cbs.onattribentity(cp);
		else this.cbs.ontextentity(cp);
	}
};

//#endregion
//#region ../../node_modules/.bun/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/Parser.js
const formTags = new Set([
	"input",
	"option",
	"optgroup",
	"select",
	"button",
	"datalist",
	"textarea"
]);
const pTag = new Set(["p"]);
const tableSectionTags = new Set(["thead", "tbody"]);
const ddtTags = new Set(["dd", "dt"]);
const rtpTags = new Set(["rt", "rp"]);
const openImpliesClose = new Map([
	["tr", new Set([
		"tr",
		"th",
		"td"
	])],
	["th", new Set(["th"])],
	["td", new Set([
		"thead",
		"th",
		"td"
	])],
	["body", new Set([
		"head",
		"link",
		"script"
	])],
	["li", new Set(["li"])],
	["p", pTag],
	["h1", pTag],
	["h2", pTag],
	["h3", pTag],
	["h4", pTag],
	["h5", pTag],
	["h6", pTag],
	["select", formTags],
	["input", formTags],
	["output", formTags],
	["button", formTags],
	["datalist", formTags],
	["textarea", formTags],
	["option", new Set(["option"])],
	["optgroup", new Set(["optgroup", "option"])],
	["dd", ddtTags],
	["dt", ddtTags],
	["address", pTag],
	["article", pTag],
	["aside", pTag],
	["blockquote", pTag],
	["details", pTag],
	["div", pTag],
	["dl", pTag],
	["fieldset", pTag],
	["figcaption", pTag],
	["figure", pTag],
	["footer", pTag],
	["form", pTag],
	["header", pTag],
	["hr", pTag],
	["main", pTag],
	["nav", pTag],
	["ol", pTag],
	["pre", pTag],
	["section", pTag],
	["table", pTag],
	["ul", pTag],
	["rt", rtpTags],
	["rp", rtpTags],
	["tbody", tableSectionTags],
	["tfoot", tableSectionTags]
]);
const voidElements = new Set([
	"area",
	"base",
	"basefont",
	"br",
	"col",
	"command",
	"embed",
	"frame",
	"hr",
	"img",
	"input",
	"isindex",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]);
const foreignContextElements = new Set(["math", "svg"]);
const htmlIntegrationElements = new Set([
	"mi",
	"mo",
	"mn",
	"ms",
	"mtext",
	"annotation-xml",
	"foreignobject",
	"desc",
	"title"
]);
const reNameEnd = /\s|\//;
var Parser = class {
	constructor(cbs, options = {}) {
		var _a$1, _b, _c, _d, _e;
		this.options = options;
		/** The start index of the last event. */
		this.startIndex = 0;
		/** The end index of the last event. */
		this.endIndex = 0;
		/**
		* Store the start index of the current open tag,
		* so we can update the start index for attributes.
		*/
		this.openTagStart = 0;
		this.tagname = "";
		this.attribname = "";
		this.attribvalue = "";
		this.attribs = null;
		this.stack = [];
		this.foreignContext = [];
		this.buffers = [];
		this.bufferOffset = 0;
		/** The index of the last written buffer. Used when resuming after a `pause()`. */
		this.writeIndex = 0;
		/** Indicates whether the parser has finished running / `.end` has been called. */
		this.ended = false;
		this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
		this.lowerCaseTagNames = (_a$1 = options.lowerCaseTags) !== null && _a$1 !== void 0 ? _a$1 : !options.xmlMode;
		this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : !options.xmlMode;
		this.tokenizer = new ((_c = options.Tokenizer) !== null && _c !== void 0 ? _c : Tokenizer)(this.options, this);
		(_e = (_d = this.cbs).onparserinit) === null || _e === void 0 || _e.call(_d, this);
	}
	/** @internal */
	ontext(start, endIndex) {
		var _a$1, _b;
		const data = this.getSlice(start, endIndex);
		this.endIndex = endIndex - 1;
		(_b = (_a$1 = this.cbs).ontext) === null || _b === void 0 || _b.call(_a$1, data);
		this.startIndex = endIndex;
	}
	/** @internal */
	ontextentity(cp) {
		var _a$1, _b;
		const index = this.tokenizer.getSectionStart();
		this.endIndex = index - 1;
		(_b = (_a$1 = this.cbs).ontext) === null || _b === void 0 || _b.call(_a$1, fromCodePoint(cp));
		this.startIndex = index;
	}
	isVoidElement(name$1) {
		return !this.options.xmlMode && voidElements.has(name$1);
	}
	/** @internal */
	onopentagname(start, endIndex) {
		this.endIndex = endIndex;
		let name$1 = this.getSlice(start, endIndex);
		if (this.lowerCaseTagNames) name$1 = name$1.toLowerCase();
		this.emitOpenTag(name$1);
	}
	emitOpenTag(name$1) {
		var _a$1, _b, _c, _d;
		this.openTagStart = this.startIndex;
		this.tagname = name$1;
		const impliesClose = !this.options.xmlMode && openImpliesClose.get(name$1);
		if (impliesClose) while (this.stack.length > 0 && impliesClose.has(this.stack[this.stack.length - 1])) {
			const element = this.stack.pop();
			(_b = (_a$1 = this.cbs).onclosetag) === null || _b === void 0 || _b.call(_a$1, element, true);
		}
		if (!this.isVoidElement(name$1)) {
			this.stack.push(name$1);
			if (foreignContextElements.has(name$1)) this.foreignContext.push(true);
			else if (htmlIntegrationElements.has(name$1)) this.foreignContext.push(false);
		}
		(_d = (_c = this.cbs).onopentagname) === null || _d === void 0 || _d.call(_c, name$1);
		if (this.cbs.onopentag) this.attribs = {};
	}
	endOpenTag(isImplied) {
		var _a$1, _b;
		this.startIndex = this.openTagStart;
		if (this.attribs) {
			(_b = (_a$1 = this.cbs).onopentag) === null || _b === void 0 || _b.call(_a$1, this.tagname, this.attribs, isImplied);
			this.attribs = null;
		}
		if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) this.cbs.onclosetag(this.tagname, true);
		this.tagname = "";
	}
	/** @internal */
	onopentagend(endIndex) {
		this.endIndex = endIndex;
		this.endOpenTag(false);
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	onclosetag(start, endIndex) {
		var _a$1, _b, _c, _d, _e, _f;
		this.endIndex = endIndex;
		let name$1 = this.getSlice(start, endIndex);
		if (this.lowerCaseTagNames) name$1 = name$1.toLowerCase();
		if (foreignContextElements.has(name$1) || htmlIntegrationElements.has(name$1)) this.foreignContext.pop();
		if (!this.isVoidElement(name$1)) {
			const pos = this.stack.lastIndexOf(name$1);
			if (pos !== -1) if (this.cbs.onclosetag) {
				let count = this.stack.length - pos;
				while (count--) this.cbs.onclosetag(this.stack.pop(), count !== 0);
			} else this.stack.length = pos;
			else if (!this.options.xmlMode && name$1 === "p") {
				this.emitOpenTag("p");
				this.closeCurrentTag(true);
			}
		} else if (!this.options.xmlMode && name$1 === "br") {
			(_b = (_a$1 = this.cbs).onopentagname) === null || _b === void 0 || _b.call(_a$1, "br");
			(_d = (_c = this.cbs).onopentag) === null || _d === void 0 || _d.call(_c, "br", {}, true);
			(_f = (_e = this.cbs).onclosetag) === null || _f === void 0 || _f.call(_e, "br", false);
		}
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	onselfclosingtag(endIndex) {
		this.endIndex = endIndex;
		if (this.options.xmlMode || this.options.recognizeSelfClosing || this.foreignContext[this.foreignContext.length - 1]) {
			this.closeCurrentTag(false);
			this.startIndex = endIndex + 1;
		} else this.onopentagend(endIndex);
	}
	closeCurrentTag(isOpenImplied) {
		var _a$1, _b;
		const name$1 = this.tagname;
		this.endOpenTag(isOpenImplied);
		if (this.stack[this.stack.length - 1] === name$1) {
			(_b = (_a$1 = this.cbs).onclosetag) === null || _b === void 0 || _b.call(_a$1, name$1, !isOpenImplied);
			this.stack.pop();
		}
	}
	/** @internal */
	onattribname(start, endIndex) {
		this.startIndex = start;
		const name$1 = this.getSlice(start, endIndex);
		this.attribname = this.lowerCaseAttributeNames ? name$1.toLowerCase() : name$1;
	}
	/** @internal */
	onattribdata(start, endIndex) {
		this.attribvalue += this.getSlice(start, endIndex);
	}
	/** @internal */
	onattribentity(cp) {
		this.attribvalue += fromCodePoint(cp);
	}
	/** @internal */
	onattribend(quote, endIndex) {
		var _a$1, _b;
		this.endIndex = endIndex;
		(_b = (_a$1 = this.cbs).onattribute) === null || _b === void 0 || _b.call(_a$1, this.attribname, this.attribvalue, quote === QuoteType.Double ? "\"" : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? void 0 : null);
		if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) this.attribs[this.attribname] = this.attribvalue;
		this.attribvalue = "";
	}
	getInstructionName(value) {
		const index = value.search(reNameEnd);
		let name$1 = index < 0 ? value : value.substr(0, index);
		if (this.lowerCaseTagNames) name$1 = name$1.toLowerCase();
		return name$1;
	}
	/** @internal */
	ondeclaration(start, endIndex) {
		this.endIndex = endIndex;
		const value = this.getSlice(start, endIndex);
		if (this.cbs.onprocessinginstruction) {
			const name$1 = this.getInstructionName(value);
			this.cbs.onprocessinginstruction(`!${name$1}`, `!${value}`);
		}
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	onprocessinginstruction(start, endIndex) {
		this.endIndex = endIndex;
		const value = this.getSlice(start, endIndex);
		if (this.cbs.onprocessinginstruction) {
			const name$1 = this.getInstructionName(value);
			this.cbs.onprocessinginstruction(`?${name$1}`, `?${value}`);
		}
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	oncomment(start, endIndex, offset) {
		var _a$1, _b, _c, _d;
		this.endIndex = endIndex;
		(_b = (_a$1 = this.cbs).oncomment) === null || _b === void 0 || _b.call(_a$1, this.getSlice(start, endIndex - offset));
		(_d = (_c = this.cbs).oncommentend) === null || _d === void 0 || _d.call(_c);
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	oncdata(start, endIndex, offset) {
		var _a$1, _b, _c, _d, _e, _f, _g, _h, _j, _k;
		this.endIndex = endIndex;
		const value = this.getSlice(start, endIndex - offset);
		if (this.options.xmlMode || this.options.recognizeCDATA) {
			(_b = (_a$1 = this.cbs).oncdatastart) === null || _b === void 0 || _b.call(_a$1);
			(_d = (_c = this.cbs).ontext) === null || _d === void 0 || _d.call(_c, value);
			(_f = (_e = this.cbs).oncdataend) === null || _f === void 0 || _f.call(_e);
		} else {
			(_h = (_g = this.cbs).oncomment) === null || _h === void 0 || _h.call(_g, `[CDATA[${value}]]`);
			(_k = (_j = this.cbs).oncommentend) === null || _k === void 0 || _k.call(_j);
		}
		this.startIndex = endIndex + 1;
	}
	/** @internal */
	onend() {
		var _a$1, _b;
		if (this.cbs.onclosetag) {
			this.endIndex = this.startIndex;
			for (let index = this.stack.length; index > 0; this.cbs.onclosetag(this.stack[--index], true));
		}
		(_b = (_a$1 = this.cbs).onend) === null || _b === void 0 || _b.call(_a$1);
	}
	/**
	* Resets the parser to a blank state, ready to parse a new HTML document
	*/
	reset() {
		var _a$1, _b, _c, _d;
		(_b = (_a$1 = this.cbs).onreset) === null || _b === void 0 || _b.call(_a$1);
		this.tokenizer.reset();
		this.tagname = "";
		this.attribname = "";
		this.attribs = null;
		this.stack.length = 0;
		this.startIndex = 0;
		this.endIndex = 0;
		(_d = (_c = this.cbs).onparserinit) === null || _d === void 0 || _d.call(_c, this);
		this.buffers.length = 0;
		this.bufferOffset = 0;
		this.writeIndex = 0;
		this.ended = false;
	}
	/**
	* Resets the parser, then parses a complete document and
	* pushes it to the handler.
	*
	* @param data Document to parse.
	*/
	parseComplete(data) {
		this.reset();
		this.end(data);
	}
	getSlice(start, end) {
		while (start - this.bufferOffset >= this.buffers[0].length) this.shiftBuffer();
		let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
		while (end - this.bufferOffset > this.buffers[0].length) {
			this.shiftBuffer();
			slice += this.buffers[0].slice(0, end - this.bufferOffset);
		}
		return slice;
	}
	shiftBuffer() {
		this.bufferOffset += this.buffers[0].length;
		this.writeIndex--;
		this.buffers.shift();
	}
	/**
	* Parses a chunk of data and calls the corresponding callbacks.
	*
	* @param chunk Chunk to parse.
	*/
	write(chunk) {
		var _a$1, _b;
		if (this.ended) {
			(_b = (_a$1 = this.cbs).onerror) === null || _b === void 0 || _b.call(_a$1, /* @__PURE__ */ new Error(".write() after done!"));
			return;
		}
		this.buffers.push(chunk);
		if (this.tokenizer.running) {
			this.tokenizer.write(chunk);
			this.writeIndex++;
		}
	}
	/**
	* Parses the end of the buffer and clears the stack, calls onend.
	*
	* @param chunk Optional final chunk to parse.
	*/
	end(chunk) {
		var _a$1, _b;
		if (this.ended) {
			(_b = (_a$1 = this.cbs).onerror) === null || _b === void 0 || _b.call(_a$1, /* @__PURE__ */ new Error(".end() after done!"));
			return;
		}
		if (chunk) this.write(chunk);
		this.ended = true;
		this.tokenizer.end();
	}
	/**
	* Pauses parsing. The parser won't emit events until `resume` is called.
	*/
	pause() {
		this.tokenizer.pause();
	}
	/**
	* Resumes parsing after `pause` was called.
	*/
	resume() {
		this.tokenizer.resume();
		while (this.tokenizer.running && this.writeIndex < this.buffers.length) this.tokenizer.write(this.buffers[this.writeIndex++]);
		if (this.ended) this.tokenizer.end();
	}
	/**
	* Alias of `write`, for backwards compatibility.
	*
	* @param chunk Chunk to parse.
	* @deprecated
	*/
	parseChunk(chunk) {
		this.write(chunk);
	}
	/**
	* Alias of `end`, for backwards compatibility.
	*
	* @param chunk Optional final chunk to parse.
	* @deprecated
	*/
	done(chunk) {
		this.end(chunk);
	}
};

//#endregion
//#region ../../node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/escape.js
const xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
const xmlCodeMap = new Map([
	[34, "&quot;"],
	[38, "&amp;"],
	[39, "&apos;"],
	[60, "&lt;"],
	[62, "&gt;"]
]);
const getCodePoint = String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (c$1, index) => (c$1.charCodeAt(index) & 64512) === 55296 ? (c$1.charCodeAt(index) - 55296) * 1024 + c$1.charCodeAt(index + 1) - 56320 + 65536 : c$1.charCodeAt(index);
/**
* Encodes all non-ASCII characters, as well as characters not valid in XML
* documents using XML entities.
*
* If a character has no equivalent entity, a
* numeric hexadecimal reference (eg. `&#xfc;`) will be used.
*/
function encodeXML(str) {
	let ret = "";
	let lastIdx = 0;
	let match;
	while ((match = xmlReplacer.exec(str)) !== null) {
		const i = match.index;
		const char = str.charCodeAt(i);
		const next = xmlCodeMap.get(char);
		if (next !== void 0) {
			ret += str.substring(lastIdx, i) + next;
			lastIdx = i + 1;
		} else {
			ret += `${str.substring(lastIdx, i)}&#x${getCodePoint(str, i).toString(16)};`;
			lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
		}
	}
	return ret + str.substr(lastIdx);
}
/**
* Creates a function that escapes all characters matched by the given regular
* expression using the given map of characters to escape to their entities.
*
* @param regex Regular expression to match characters to escape.
* @param map Map of characters to escape to their entities.
*
* @returns Function that escapes all characters matched by the given regular
* expression using the given map of characters to escape to their entities.
*/
function getEscaper(regex, map$1) {
	return function escape$1(data) {
		let match;
		let lastIdx = 0;
		let result = "";
		while (match = regex.exec(data)) {
			if (lastIdx !== match.index) result += data.substring(lastIdx, match.index);
			result += map$1.get(match[0].charCodeAt(0));
			lastIdx = match.index + 1;
		}
		return result + data.substring(lastIdx);
	};
}
/**
* Encodes all characters not valid in XML documents using XML entities.
*
* Note that the output will be character-set dependent.
*
* @param data String to escape.
*/
const escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
/**
* Encodes all characters that have to be escaped in HTML attributes,
* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
*
* @param data String to escape.
*/
const escapeAttribute = getEscaper(/["&\u00A0]/g, new Map([
	[34, "&quot;"],
	[38, "&amp;"],
	[160, "&nbsp;"]
]));
/**
* Encodes all characters that have to be escaped in HTML text,
* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
*
* @param data String to escape.
*/
const escapeText = getEscaper(/[&<>\u00A0]/g, new Map([
	[38, "&amp;"],
	[60, "&lt;"],
	[62, "&gt;"],
	[160, "&nbsp;"]
]));

//#endregion
//#region ../../node_modules/.bun/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/foreignNames.js
const elementNames = new Map([
	"altGlyph",
	"altGlyphDef",
	"altGlyphItem",
	"animateColor",
	"animateMotion",
	"animateTransform",
	"clipPath",
	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feComposite",
	"feConvolveMatrix",
	"feDiffuseLighting",
	"feDisplacementMap",
	"feDistantLight",
	"feDropShadow",
	"feFlood",
	"feFuncA",
	"feFuncB",
	"feFuncG",
	"feFuncR",
	"feGaussianBlur",
	"feImage",
	"feMerge",
	"feMergeNode",
	"feMorphology",
	"feOffset",
	"fePointLight",
	"feSpecularLighting",
	"feSpotLight",
	"feTile",
	"feTurbulence",
	"foreignObject",
	"glyphRef",
	"linearGradient",
	"radialGradient",
	"textPath"
].map((val) => [val.toLowerCase(), val]));
const attributeNames = new Map([
	"definitionURL",
	"attributeName",
	"attributeType",
	"baseFrequency",
	"baseProfile",
	"calcMode",
	"clipPathUnits",
	"diffuseConstant",
	"edgeMode",
	"filterUnits",
	"glyphRef",
	"gradientTransform",
	"gradientUnits",
	"kernelMatrix",
	"kernelUnitLength",
	"keyPoints",
	"keySplines",
	"keyTimes",
	"lengthAdjust",
	"limitingConeAngle",
	"markerHeight",
	"markerUnits",
	"markerWidth",
	"maskContentUnits",
	"maskUnits",
	"numOctaves",
	"pathLength",
	"patternContentUnits",
	"patternTransform",
	"patternUnits",
	"pointsAtX",
	"pointsAtY",
	"pointsAtZ",
	"preserveAlpha",
	"preserveAspectRatio",
	"primitiveUnits",
	"refX",
	"refY",
	"repeatCount",
	"repeatDur",
	"requiredExtensions",
	"requiredFeatures",
	"specularConstant",
	"specularExponent",
	"spreadMethod",
	"startOffset",
	"stdDeviation",
	"stitchTiles",
	"surfaceScale",
	"systemLanguage",
	"tableValues",
	"targetX",
	"targetY",
	"textLength",
	"viewBox",
	"viewTarget",
	"xChannelSelector",
	"yChannelSelector",
	"zoomAndPan"
].map((val) => [val.toLowerCase(), val]));

//#endregion
//#region ../../node_modules/.bun/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js
/**
* Mixed-case SVG and MathML tags & attributes
* recognized by the HTML parser.
*
* @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
*/
const unencodedElements = new Set([
	"style",
	"script",
	"xmp",
	"iframe",
	"noembed",
	"noframes",
	"plaintext",
	"noscript"
]);
function replaceQuotes(value) {
	return value.replace(/"/g, "&quot;");
}
/**
* Format attributes
*/
function formatAttributes(attributes, opts) {
	var _a$1;
	if (!attributes) return;
	const encode = ((_a$1 = opts.encodeEntities) !== null && _a$1 !== void 0 ? _a$1 : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
	return Object.keys(attributes).map((key) => {
		var _a$2, _b;
		const value = (_a$2 = attributes[key]) !== null && _a$2 !== void 0 ? _a$2 : "";
		if (opts.xmlMode === "foreign") key = (_b = attributeNames.get(key)) !== null && _b !== void 0 ? _b : key;
		if (!opts.emptyAttrs && !opts.xmlMode && value === "") return key;
		return `${key}="${encode(value)}"`;
	}).join(" ");
}
/**
* Self-enclosing tags
*/
const singleTag = new Set([
	"area",
	"base",
	"basefont",
	"br",
	"col",
	"command",
	"embed",
	"frame",
	"hr",
	"img",
	"input",
	"isindex",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]);
/**
* Renders a DOM node or an array of DOM nodes to a string.
*
* Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
*
* @param node Node to be rendered.
* @param options Changes serialization behavior
*/
function render(node, options = {}) {
	const nodes = "length" in node ? node : [node];
	let output = "";
	for (let i = 0; i < nodes.length; i++) output += renderNode(nodes[i], options);
	return output;
}
function renderNode(node, options) {
	switch (node.type) {
		case Root: return render(node.children, options);
		case Doctype:
		case Directive: return renderDirective(node);
		case Comment$1: return renderComment(node);
		case CDATA$1: return renderCdata(node);
		case Script:
		case Style:
		case Tag: return renderTag(node, options);
		case Text$1: return renderText(node, options);
	}
}
const foreignModeIntegrationPoints = new Set([
	"mi",
	"mo",
	"mn",
	"ms",
	"mtext",
	"annotation-xml",
	"foreignObject",
	"desc",
	"title"
]);
const foreignElements = new Set(["svg", "math"]);
function renderTag(elem, opts) {
	var _a$1;
	if (opts.xmlMode === "foreign") {
		elem.name = (_a$1 = elementNames.get(elem.name)) !== null && _a$1 !== void 0 ? _a$1 : elem.name;
		if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) opts = {
			...opts,
			xmlMode: false
		};
	}
	if (!opts.xmlMode && foreignElements.has(elem.name)) opts = {
		...opts,
		xmlMode: "foreign"
	};
	let tag = `<${elem.name}`;
	const attribs = formatAttributes(elem.attribs, opts);
	if (attribs) tag += ` ${attribs}`;
	if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
		if (!opts.xmlMode) tag += " ";
		tag += "/>";
	} else {
		tag += ">";
		if (elem.children.length > 0) tag += render(elem.children, opts);
		if (opts.xmlMode || !singleTag.has(elem.name)) tag += `</${elem.name}>`;
	}
	return tag;
}
function renderDirective(elem) {
	return `<${elem.data}>`;
}
function renderText(elem, opts) {
	var _a$1;
	let data = elem.data || "";
	if (((_a$1 = opts.encodeEntities) !== null && _a$1 !== void 0 ? _a$1 : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
	return data;
}
function renderCdata(elem) {
	return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
	return `<!--${elem.data}-->`;
}

//#endregion
//#region ../../node_modules/.bun/htmlparser2@8.0.2/node_modules/htmlparser2/lib/esm/index.js
/**
* Parses the data, returns the resulting document.
*
* @param data The data that should be parsed.
* @param options Optional options for the parser and DOM builder.
*/
function parseDocument(data, options) {
	const handler = new DomHandler(void 0, options);
	new Parser(handler, options).end(data);
	return handler.root;
}

//#endregion
//#region ../../node_modules/.bun/deepmerge@4.3.1/node_modules/deepmerge/dist/cjs.js
var require_cjs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isMergeableObject = function isMergeableObject$1(value) {
		return isNonNullObject(value) && !isSpecial(value);
	};
	function isNonNullObject(value) {
		return !!value && typeof value === "object";
	}
	function isSpecial(value) {
		var stringValue = Object.prototype.toString.call(value);
		return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
	}
	var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for ? Symbol.for("react.element") : 60103;
	function isReactElement(value) {
		return value.$$typeof === REACT_ELEMENT_TYPE;
	}
	function emptyTarget(val) {
		return Array.isArray(val) ? [] : {};
	}
	function cloneUnlessOtherwiseSpecified(value, options) {
		return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
	}
	function defaultArrayMerge(target, source, options) {
		return target.concat(source).map(function(element) {
			return cloneUnlessOtherwiseSpecified(element, options);
		});
	}
	function getMergeFunction(key, options) {
		if (!options.customMerge) return deepmerge;
		var customMerge = options.customMerge(key);
		return typeof customMerge === "function" ? customMerge : deepmerge;
	}
	function getEnumerableOwnPropertySymbols(target) {
		return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return Object.propertyIsEnumerable.call(target, symbol);
		}) : [];
	}
	function getKeys(target) {
		return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
	}
	function propertyIsOnObject(object, property) {
		try {
			return property in object;
		} catch (_) {
			return false;
		}
	}
	function propertyIsUnsafe(target, key) {
		return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
	}
	function mergeObject(target, source, options) {
		var destination = {};
		if (options.isMergeableObject(target)) getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
		getKeys(source).forEach(function(key) {
			if (propertyIsUnsafe(target, key)) return;
			if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
			else destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		});
		return destination;
	}
	function deepmerge(target, source, options) {
		options = options || {};
		options.arrayMerge = options.arrayMerge || defaultArrayMerge;
		options.isMergeableObject = options.isMergeableObject || isMergeableObject;
		options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
		var sourceIsArray = Array.isArray(source);
		if (!(sourceIsArray === Array.isArray(target))) return cloneUnlessOtherwiseSpecified(source, options);
		else if (sourceIsArray) return options.arrayMerge(target, source, options);
		else return mergeObject(target, source, options);
	}
	deepmerge.all = function deepmergeAll(array, options) {
		if (!Array.isArray(array)) throw new Error("first argument should be an array");
		return array.reduce(function(prev, next) {
			return deepmerge(prev, next, options);
		}, {});
	};
	var deepmerge_1 = deepmerge;
	module.exports = deepmerge_1;
}));

//#endregion
//#region ../../node_modules/.bun/html-to-text@9.0.5/node_modules/html-to-text/lib/html-to-text.mjs
var import_cjs = /* @__PURE__ */ __toESM(require_cjs(), 1);
/**
* Make a recursive function that will only run to a given depth
* and switches to an alternative function at that depth. \
* No limitation if `n` is `undefined` (Just wraps `f` in that case).
*
* @param   { number | undefined } n   Allowed depth of recursion. `undefined` for no limitation.
* @param   { Function }           f   Function that accepts recursive callback as the first argument.
* @param   { Function }           [g] Function to run instead, when maximum depth was reached. Do nothing by default.
* @returns { Function }
*/
function limitedDepthRecursive(n$1, f, g = () => void 0) {
	if (n$1 === void 0) {
		const f1 = function(...args) {
			return f(f1, ...args);
		};
		return f1;
	}
	if (n$1 >= 0) return function(...args) {
		return f(limitedDepthRecursive(n$1 - 1, f, g), ...args);
	};
	return g;
}
/**
* Return the same string or a substring with
* the given character occurrences removed from each side.
*
* @param   { string } str  A string to trim.
* @param   { string } char A character to be trimmed.
* @returns { string }
*/
function trimCharacter(str, char) {
	let start = 0;
	let end = str.length;
	while (start < end && str[start] === char) ++start;
	while (end > start && str[end - 1] === char) --end;
	return start > 0 || end < str.length ? str.substring(start, end) : str;
}
/**
* Return the same string or a substring with
* the given character occurrences removed from the end only.
*
* @param   { string } str  A string to trim.
* @param   { string } char A character to be trimmed.
* @returns { string }
*/
function trimCharacterEnd(str, char) {
	let end = str.length;
	while (end > 0 && str[end - 1] === char) --end;
	return end < str.length ? str.substring(0, end) : str;
}
/**
* Return a new string will all characters replaced with unicode escape sequences.
* This extreme kind of escaping can used to be safely compose regular expressions.
*
* @param { string } str A string to escape.
* @returns { string } A string of unicode escape sequences.
*/
function unicodeEscape(str) {
	return str.replace(/[\s\S]/g, (c$1) => "\\u" + c$1.charCodeAt().toString(16).padStart(4, "0"));
}
/**
* Deduplicate an array by a given key callback.
* Item properties are merged recursively and with the preference for last defined values.
* Of items with the same key, merged item takes the place of the last item,
* others are omitted.
*
* @param { any[] } items An array to deduplicate.
* @param { (x: any) => string } getKey Callback to get a value that distinguishes unique items.
* @returns { any[] }
*/
function mergeDuplicatesPreferLast(items, getKey) {
	const map$1 = /* @__PURE__ */ new Map();
	for (let i = items.length; i-- > 0;) {
		const item = items[i];
		const key = getKey(item);
		map$1.set(key, map$1.has(key) ? (0, import_cjs.default)(item, map$1.get(key), { arrayMerge: overwriteMerge$1 }) : item);
	}
	return [...map$1.values()].reverse();
}
const overwriteMerge$1 = (acc, src, options) => [...src];
/**
* Get a nested property from an object.
*
* @param   { object }   obj  The object to query for the value.
* @param   { string[] } path The path to the property.
* @returns { any }
*/
function get(obj, path) {
	for (const key of path) {
		if (!obj) return;
		obj = obj[key];
	}
	return obj;
}
/**
* Convert a number into alphabetic sequence representation (Sequence without zeroes).
*
* For example: `a, ..., z, aa, ..., zz, aaa, ...`.
*
* @param   { number } num              Number to convert. Must be >= 1.
* @param   { string } [baseChar = 'a'] Character for 1 in the sequence.
* @param   { number } [base = 26]      Number of characters in the sequence.
* @returns { string }
*/
function numberToLetterSequence(num, baseChar = "a", base = 26) {
	const digits = [];
	do {
		num -= 1;
		digits.push(num % base);
		num = num / base >> 0;
	} while (num > 0);
	const baseCode = baseChar.charCodeAt(0);
	return digits.reverse().map((n$1) => String.fromCharCode(baseCode + n$1)).join("");
}
const I = [
	"I",
	"X",
	"C",
	"M"
];
const V = [
	"V",
	"L",
	"D"
];
/**
* Convert a number to it's Roman representation. No large numbers extension.
*
* @param   { number } num Number to convert. `0 < num <= 3999`.
* @returns { string }
*/
function numberToRoman(num) {
	return [...num + ""].map((n$1) => +n$1).reverse().map((v, i) => v % 5 < 4 ? (v < 5 ? "" : V[i]) + I[i].repeat(v % 5) : I[i] + (v < 5 ? V[i] : I[i + 1])).reverse().join("");
}
/**
* Helps to build text from words.
*/
var InlineTextBuilder = class {
	/**
	* Creates an instance of InlineTextBuilder.
	*
	* If `maxLineLength` is not provided then it is either `options.wordwrap` or unlimited.
	*
	* @param { Options } options           HtmlToText options.
	* @param { number }  [ maxLineLength ] This builder will try to wrap text to fit this line length.
	*/
	constructor(options, maxLineLength = void 0) {
		/** @type { string[][] } */
		this.lines = [];
		/** @type { string[] }   */
		this.nextLineWords = [];
		this.maxLineLength = maxLineLength || options.wordwrap || Number.MAX_VALUE;
		this.nextLineAvailableChars = this.maxLineLength;
		this.wrapCharacters = get(options, ["longWordSplit", "wrapCharacters"]) || [];
		this.forceWrapOnLimit = get(options, ["longWordSplit", "forceWrapOnLimit"]) || false;
		this.stashedSpace = false;
		this.wordBreakOpportunity = false;
	}
	/**
	* Add a new word.
	*
	* @param { string } word A word to add.
	* @param { boolean } [noWrap] Don't wrap text even if the line is too long.
	*/
	pushWord(word, noWrap = false) {
		if (this.nextLineAvailableChars <= 0 && !noWrap) this.startNewLine();
		const isLineStart = this.nextLineWords.length === 0;
		const cost = word.length + (isLineStart ? 0 : 1);
		if (cost <= this.nextLineAvailableChars || noWrap) {
			this.nextLineWords.push(word);
			this.nextLineAvailableChars -= cost;
		} else {
			const [first, ...rest] = this.splitLongWord(word);
			if (!isLineStart) this.startNewLine();
			this.nextLineWords.push(first);
			this.nextLineAvailableChars -= first.length;
			for (const part of rest) {
				this.startNewLine();
				this.nextLineWords.push(part);
				this.nextLineAvailableChars -= part.length;
			}
		}
	}
	/**
	* Pop a word from the currently built line.
	* This doesn't affect completed lines.
	*
	* @returns { string }
	*/
	popWord() {
		const lastWord = this.nextLineWords.pop();
		if (lastWord !== void 0) {
			const isLineStart = this.nextLineWords.length === 0;
			const cost = lastWord.length + (isLineStart ? 0 : 1);
			this.nextLineAvailableChars += cost;
		}
		return lastWord;
	}
	/**
	* Concat a word to the last word already in the builder.
	* Adds a new word in case there are no words yet in the last line.
	*
	* @param { string } word A word to be concatenated.
	* @param { boolean } [noWrap] Don't wrap text even if the line is too long.
	*/
	concatWord(word, noWrap = false) {
		if (this.wordBreakOpportunity && word.length > this.nextLineAvailableChars) {
			this.pushWord(word, noWrap);
			this.wordBreakOpportunity = false;
		} else {
			const lastWord = this.popWord();
			this.pushWord(lastWord ? lastWord.concat(word) : word, noWrap);
		}
	}
	/**
	* Add current line (and more empty lines if provided argument > 1) to the list of complete lines and start a new one.
	*
	* @param { number } n Number of line breaks that will be added to the resulting string.
	*/
	startNewLine(n$1 = 1) {
		this.lines.push(this.nextLineWords);
		if (n$1 > 1) this.lines.push(...Array.from({ length: n$1 - 1 }, () => []));
		this.nextLineWords = [];
		this.nextLineAvailableChars = this.maxLineLength;
	}
	/**
	* No words in this builder.
	*
	* @returns { boolean }
	*/
	isEmpty() {
		return this.lines.length === 0 && this.nextLineWords.length === 0;
	}
	clear() {
		this.lines.length = 0;
		this.nextLineWords.length = 0;
		this.nextLineAvailableChars = this.maxLineLength;
	}
	/**
	* Join all lines of words inside the InlineTextBuilder into a complete string.
	*
	* @returns { string }
	*/
	toString() {
		return [...this.lines, this.nextLineWords].map((words) => words.join(" ")).join("\n");
	}
	/**
	* Split a long word up to fit within the word wrap limit.
	* Use either a character to split looking back from the word wrap limit,
	* or truncate to the word wrap limit.
	*
	* @param   { string }   word Input word.
	* @returns { string[] }      Parts of the word.
	*/
	splitLongWord(word) {
		const parts = [];
		let idx = 0;
		while (word.length > this.maxLineLength) {
			const firstLine = word.substring(0, this.maxLineLength);
			const remainingChars = word.substring(this.maxLineLength);
			const splitIndex = firstLine.lastIndexOf(this.wrapCharacters[idx]);
			if (splitIndex > -1) {
				word = firstLine.substring(splitIndex + 1) + remainingChars;
				parts.push(firstLine.substring(0, splitIndex + 1));
			} else {
				idx++;
				if (idx < this.wrapCharacters.length) word = firstLine + remainingChars;
				else {
					if (this.forceWrapOnLimit) {
						parts.push(firstLine);
						word = remainingChars;
						if (word.length > this.maxLineLength) continue;
					} else word = firstLine + remainingChars;
					break;
				}
			}
		}
		parts.push(word);
		return parts;
	}
};
var StackItem = class {
	constructor(next = null) {
		this.next = next;
	}
	getRoot() {
		return this.next ? this.next : this;
	}
};
var BlockStackItem = class extends StackItem {
	constructor(options, next = null, leadingLineBreaks = 1, maxLineLength = void 0) {
		super(next);
		this.leadingLineBreaks = leadingLineBreaks;
		this.inlineTextBuilder = new InlineTextBuilder(options, maxLineLength);
		this.rawText = "";
		this.stashedLineBreaks = 0;
		this.isPre = next && next.isPre;
		this.isNoWrap = next && next.isNoWrap;
	}
};
var ListStackItem = class extends BlockStackItem {
	constructor(options, next = null, { interRowLineBreaks = 1, leadingLineBreaks = 2, maxLineLength = void 0, maxPrefixLength = 0, prefixAlign = "left" } = {}) {
		super(options, next, leadingLineBreaks, maxLineLength);
		this.maxPrefixLength = maxPrefixLength;
		this.prefixAlign = prefixAlign;
		this.interRowLineBreaks = interRowLineBreaks;
	}
};
var ListItemStackItem = class extends BlockStackItem {
	constructor(options, next = null, { leadingLineBreaks = 1, maxLineLength = void 0, prefix = "" } = {}) {
		super(options, next, leadingLineBreaks, maxLineLength);
		this.prefix = prefix;
	}
};
var TableStackItem = class extends StackItem {
	constructor(next = null) {
		super(next);
		this.rows = [];
		this.isPre = next && next.isPre;
		this.isNoWrap = next && next.isNoWrap;
	}
};
var TableRowStackItem = class extends StackItem {
	constructor(next = null) {
		super(next);
		this.cells = [];
		this.isPre = next && next.isPre;
		this.isNoWrap = next && next.isNoWrap;
	}
};
var TableCellStackItem = class extends StackItem {
	constructor(options, next = null, maxColumnWidth = void 0) {
		super(next);
		this.inlineTextBuilder = new InlineTextBuilder(options, maxColumnWidth);
		this.rawText = "";
		this.stashedLineBreaks = 0;
		this.isPre = next && next.isPre;
		this.isNoWrap = next && next.isNoWrap;
	}
};
var TransformerStackItem = class extends StackItem {
	constructor(next = null, transform) {
		super(next);
		this.transform = transform;
	}
};
function charactersToCodes(str) {
	return [...str].map((c$1) => "\\u" + c$1.charCodeAt(0).toString(16).padStart(4, "0")).join("");
}
/**
* Helps to handle HTML whitespaces.
*
* @class WhitespaceProcessor
*/
var WhitespaceProcessor = class {
	/**
	* Creates an instance of WhitespaceProcessor.
	*
	* @param { Options } options    HtmlToText options.
	* @memberof WhitespaceProcessor
	*/
	constructor(options) {
		this.whitespaceChars = options.preserveNewlines ? options.whitespaceCharacters.replace(/\n/g, "") : options.whitespaceCharacters;
		const whitespaceCodes = charactersToCodes(this.whitespaceChars);
		this.leadingWhitespaceRe = /* @__PURE__ */ new RegExp(`^[${whitespaceCodes}]`);
		this.trailingWhitespaceRe = /* @__PURE__ */ new RegExp(`[${whitespaceCodes}]$`);
		this.allWhitespaceOrEmptyRe = /* @__PURE__ */ new RegExp(`^[${whitespaceCodes}]*$`);
		this.newlineOrNonWhitespaceRe = new RegExp(`(\\n|[^\\n${whitespaceCodes}])`, "g");
		this.newlineOrNonNewlineStringRe = new RegExp(`(\\n|[^\\n]+)`, "g");
		if (options.preserveNewlines) {
			const wordOrNewlineRe = new RegExp(`\\n|[^\\n${whitespaceCodes}]+`, "gm");
			/**
			* Shrink whitespaces and wrap text, add to the builder.
			*
			* @param { string }                  text              Input text.
			* @param { InlineTextBuilder }       inlineTextBuilder A builder to receive processed text.
			* @param { (str: string) => string } [ transform ]     A transform to be applied to words.
			* @param { boolean }                 [noWrap] Don't wrap text even if the line is too long.
			*/
			this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = ((str) => str), noWrap = false) {
				if (!text) return;
				const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
				let anyMatch = false;
				let m = wordOrNewlineRe.exec(text);
				if (m) {
					anyMatch = true;
					if (m[0] === "\n") inlineTextBuilder.startNewLine();
					else if (previouslyStashedSpace || this.testLeadingWhitespace(text)) inlineTextBuilder.pushWord(transform(m[0]), noWrap);
					else inlineTextBuilder.concatWord(transform(m[0]), noWrap);
					while ((m = wordOrNewlineRe.exec(text)) !== null) if (m[0] === "\n") inlineTextBuilder.startNewLine();
					else inlineTextBuilder.pushWord(transform(m[0]), noWrap);
				}
				inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
			};
		} else {
			const wordRe = new RegExp(`[^${whitespaceCodes}]+`, "g");
			this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = ((str) => str), noWrap = false) {
				if (!text) return;
				const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
				let anyMatch = false;
				let m = wordRe.exec(text);
				if (m) {
					anyMatch = true;
					if (previouslyStashedSpace || this.testLeadingWhitespace(text)) inlineTextBuilder.pushWord(transform(m[0]), noWrap);
					else inlineTextBuilder.concatWord(transform(m[0]), noWrap);
					while ((m = wordRe.exec(text)) !== null) inlineTextBuilder.pushWord(transform(m[0]), noWrap);
				}
				inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
			};
		}
	}
	/**
	* Add text with only minimal processing.
	* Everything between newlines considered a single word.
	* No whitespace is trimmed.
	* Not affected by preserveNewlines option - `\n` always starts a new line.
	*
	* `noWrap` argument is `true` by default - this won't start a new line
	* even if there is not enough space left in the current line.
	*
	* @param { string }            text              Input text.
	* @param { InlineTextBuilder } inlineTextBuilder A builder to receive processed text.
	* @param { boolean }           [noWrap] Don't wrap text even if the line is too long.
	*/
	addLiteral(text, inlineTextBuilder, noWrap = true) {
		if (!text) return;
		const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
		let anyMatch = false;
		let m = this.newlineOrNonNewlineStringRe.exec(text);
		if (m) {
			anyMatch = true;
			if (m[0] === "\n") inlineTextBuilder.startNewLine();
			else if (previouslyStashedSpace) inlineTextBuilder.pushWord(m[0], noWrap);
			else inlineTextBuilder.concatWord(m[0], noWrap);
			while ((m = this.newlineOrNonNewlineStringRe.exec(text)) !== null) if (m[0] === "\n") inlineTextBuilder.startNewLine();
			else inlineTextBuilder.pushWord(m[0], noWrap);
		}
		inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch;
	}
	/**
	* Test whether the given text starts with HTML whitespace character.
	*
	* @param   { string }  text  The string to test.
	* @returns { boolean }
	*/
	testLeadingWhitespace(text) {
		return this.leadingWhitespaceRe.test(text);
	}
	/**
	* Test whether the given text ends with HTML whitespace character.
	*
	* @param   { string }  text  The string to test.
	* @returns { boolean }
	*/
	testTrailingWhitespace(text) {
		return this.trailingWhitespaceRe.test(text);
	}
	/**
	* Test whether the given text contains any non-whitespace characters.
	*
	* @param   { string }  text  The string to test.
	* @returns { boolean }
	*/
	testContainsWords(text) {
		return !this.allWhitespaceOrEmptyRe.test(text);
	}
	/**
	* Return the number of newlines if there are no words.
	*
	* If any word is found then return zero regardless of the actual number of newlines.
	*
	* @param   { string }  text  Input string.
	* @returns { number }
	*/
	countNewlinesNoWords(text) {
		this.newlineOrNonWhitespaceRe.lastIndex = 0;
		let counter = 0;
		let match;
		while ((match = this.newlineOrNonWhitespaceRe.exec(text)) !== null) if (match[0] === "\n") counter++;
		else return 0;
		return counter;
	}
};
/**
* Helps to build text from inline and block elements.
*
* @class BlockTextBuilder
*/
var BlockTextBuilder = class {
	/**
	* Creates an instance of BlockTextBuilder.
	*
	* @param { Options } options HtmlToText options.
	* @param { import('selderee').Picker<DomNode, TagDefinition> } picker Selectors decision tree picker.
	* @param { any} [metadata] Optional metadata for HTML document, for use in formatters.
	*/
	constructor(options, picker, metadata = void 0) {
		this.options = options;
		this.picker = picker;
		this.metadata = metadata;
		this.whitespaceProcessor = new WhitespaceProcessor(options);
		/** @type { StackItem } */
		this._stackItem = new BlockStackItem(options);
		/** @type { TransformerStackItem } */
		this._wordTransformer = void 0;
	}
	/**
	* Put a word-by-word transform function onto the transformations stack.
	*
	* Mainly used for uppercasing. Can be bypassed to add unformatted text such as URLs.
	*
	* Word transformations applied before wrapping.
	*
	* @param { (str: string) => string } wordTransform Word transformation function.
	*/
	pushWordTransform(wordTransform) {
		this._wordTransformer = new TransformerStackItem(this._wordTransformer, wordTransform);
	}
	/**
	* Remove a function from the word transformations stack.
	*
	* @returns { (str: string) => string } A function that was removed.
	*/
	popWordTransform() {
		if (!this._wordTransformer) return;
		const transform = this._wordTransformer.transform;
		this._wordTransformer = this._wordTransformer.next;
		return transform;
	}
	/**
	* Ignore wordwrap option in followup inline additions and disable automatic wrapping.
	*/
	startNoWrap() {
		this._stackItem.isNoWrap = true;
	}
	/**
	* Return automatic wrapping to behavior defined by options.
	*/
	stopNoWrap() {
		this._stackItem.isNoWrap = false;
	}
	/** @returns { (str: string) => string } */
	_getCombinedWordTransformer() {
		const wt = this._wordTransformer ? ((str) => applyTransformer(str, this._wordTransformer)) : void 0;
		const ce = this.options.encodeCharacters;
		return wt ? ce ? (str) => ce(wt(str)) : wt : ce;
	}
	_popStackItem() {
		const item = this._stackItem;
		this._stackItem = item.next;
		return item;
	}
	/**
	* Add a line break into currently built block.
	*/
	addLineBreak() {
		if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) return;
		if (this._stackItem.isPre) this._stackItem.rawText += "\n";
		else this._stackItem.inlineTextBuilder.startNewLine();
	}
	/**
	* Allow to break line in case directly following text will not fit.
	*/
	addWordBreakOpportunity() {
		if (this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem) this._stackItem.inlineTextBuilder.wordBreakOpportunity = true;
	}
	/**
	* Add a node inline into the currently built block.
	*
	* @param { string } str
	* Text content of a node to add.
	*
	* @param { object } [param1]
	* Object holding the parameters of the operation.
	*
	* @param { boolean } [param1.noWordTransform]
	* Ignore word transformers if there are any.
	* Don't encode characters as well.
	* (Use this for things like URL addresses).
	*/
	addInline(str, { noWordTransform = false } = {}) {
		if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) return;
		if (this._stackItem.isPre) {
			this._stackItem.rawText += str;
			return;
		}
		if (str.length === 0 || this._stackItem.stashedLineBreaks && !this.whitespaceProcessor.testContainsWords(str)) return;
		if (this.options.preserveNewlines) {
			const newlinesNumber = this.whitespaceProcessor.countNewlinesNoWords(str);
			if (newlinesNumber > 0) {
				this._stackItem.inlineTextBuilder.startNewLine(newlinesNumber);
				return;
			}
		}
		if (this._stackItem.stashedLineBreaks) this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
		this.whitespaceProcessor.shrinkWrapAdd(str, this._stackItem.inlineTextBuilder, noWordTransform ? void 0 : this._getCombinedWordTransformer(), this._stackItem.isNoWrap);
		this._stackItem.stashedLineBreaks = 0;
	}
	/**
	* Add a string inline into the currently built block.
	*
	* Use this for markup elements that don't have to adhere
	* to text layout rules.
	*
	* @param { string } str Text to add.
	*/
	addLiteral(str) {
		if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) return;
		if (str.length === 0) return;
		if (this._stackItem.isPre) {
			this._stackItem.rawText += str;
			return;
		}
		if (this._stackItem.stashedLineBreaks) this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
		this.whitespaceProcessor.addLiteral(str, this._stackItem.inlineTextBuilder, this._stackItem.isNoWrap);
		this._stackItem.stashedLineBreaks = 0;
	}
	/**
	* Start building a new block.
	*
	* @param { object } [param0]
	* Object holding the parameters of the block.
	*
	* @param { number } [param0.leadingLineBreaks]
	* This block should have at least this number of line breaks to separate it from any preceding block.
	*
	* @param { number }  [param0.reservedLineLength]
	* Reserve this number of characters on each line for block markup.
	*
	* @param { boolean } [param0.isPre]
	* Should HTML whitespace be preserved inside this block.
	*/
	openBlock({ leadingLineBreaks = 1, reservedLineLength = 0, isPre = false } = {}) {
		const maxLineLength = Math.max(20, this._stackItem.inlineTextBuilder.maxLineLength - reservedLineLength);
		this._stackItem = new BlockStackItem(this.options, this._stackItem, leadingLineBreaks, maxLineLength);
		if (isPre) this._stackItem.isPre = true;
	}
	/**
	* Finalize currently built block, add it's content to the parent block.
	*
	* @param { object } [param0]
	* Object holding the parameters of the block.
	*
	* @param { number } [param0.trailingLineBreaks]
	* This block should have at least this number of line breaks to separate it from any following block.
	*
	* @param { (str: string) => string } [param0.blockTransform]
	* A function to transform the block text before adding to the parent block.
	* This happens after word wrap and should be used in combination with reserved line length
	* in order to keep line lengths correct.
	* Used for whole block markup.
	*/
	closeBlock({ trailingLineBreaks = 1, blockTransform = void 0 } = {}) {
		const block = this._popStackItem();
		const blockText = blockTransform ? blockTransform(getText(block)) : getText(block);
		addText(this._stackItem, blockText, block.leadingLineBreaks, Math.max(block.stashedLineBreaks, trailingLineBreaks));
	}
	/**
	* Start building a new list.
	*
	* @param { object } [param0]
	* Object holding the parameters of the list.
	*
	* @param { number } [param0.maxPrefixLength]
	* Length of the longest list item prefix.
	* If not supplied or too small then list items won't be aligned properly.
	*
	* @param { 'left' | 'right' } [param0.prefixAlign]
	* Specify how prefixes of different lengths have to be aligned
	* within a column.
	*
	* @param { number } [param0.interRowLineBreaks]
	* Minimum number of line breaks between list items.
	*
	* @param { number } [param0.leadingLineBreaks]
	* This list should have at least this number of line breaks to separate it from any preceding block.
	*/
	openList({ maxPrefixLength = 0, prefixAlign = "left", interRowLineBreaks = 1, leadingLineBreaks = 2 } = {}) {
		this._stackItem = new ListStackItem(this.options, this._stackItem, {
			interRowLineBreaks,
			leadingLineBreaks,
			maxLineLength: this._stackItem.inlineTextBuilder.maxLineLength,
			maxPrefixLength,
			prefixAlign
		});
	}
	/**
	* Start building a new list item.
	*
	* @param {object} param0
	* Object holding the parameters of the list item.
	*
	* @param { string } [param0.prefix]
	* Prefix for this list item (item number, bullet point, etc).
	*/
	openListItem({ prefix = "" } = {}) {
		if (!(this._stackItem instanceof ListStackItem)) throw new Error("Can't add a list item to something that is not a list! Check the formatter.");
		const list = this._stackItem;
		const prefixLength = Math.max(prefix.length, list.maxPrefixLength);
		const maxLineLength = Math.max(20, list.inlineTextBuilder.maxLineLength - prefixLength);
		this._stackItem = new ListItemStackItem(this.options, list, {
			prefix,
			maxLineLength,
			leadingLineBreaks: list.interRowLineBreaks
		});
	}
	/**
	* Finalize currently built list item, add it's content to the parent list.
	*/
	closeListItem() {
		const listItem = this._popStackItem();
		const list = listItem.next;
		const prefixLength = Math.max(listItem.prefix.length, list.maxPrefixLength);
		const spacing = "\n" + " ".repeat(prefixLength);
		addText(list, (list.prefixAlign === "right" ? listItem.prefix.padStart(prefixLength) : listItem.prefix.padEnd(prefixLength)) + getText(listItem).replace(/\n/g, spacing), listItem.leadingLineBreaks, Math.max(listItem.stashedLineBreaks, list.interRowLineBreaks));
	}
	/**
	* Finalize currently built list, add it's content to the parent block.
	*
	* @param { object } param0
	* Object holding the parameters of the list.
	*
	* @param { number } [param0.trailingLineBreaks]
	* This list should have at least this number of line breaks to separate it from any following block.
	*/
	closeList({ trailingLineBreaks = 2 } = {}) {
		const list = this._popStackItem();
		const text = getText(list);
		if (text) addText(this._stackItem, text, list.leadingLineBreaks, trailingLineBreaks);
	}
	/**
	* Start building a table.
	*/
	openTable() {
		this._stackItem = new TableStackItem(this._stackItem);
	}
	/**
	* Start building a table row.
	*/
	openTableRow() {
		if (!(this._stackItem instanceof TableStackItem)) throw new Error("Can't add a table row to something that is not a table! Check the formatter.");
		this._stackItem = new TableRowStackItem(this._stackItem);
	}
	/**
	* Start building a table cell.
	*
	* @param { object } [param0]
	* Object holding the parameters of the cell.
	*
	* @param { number } [param0.maxColumnWidth]
	* Wrap cell content to this width. Fall back to global wordwrap value if undefined.
	*/
	openTableCell({ maxColumnWidth = void 0 } = {}) {
		if (!(this._stackItem instanceof TableRowStackItem)) throw new Error("Can't add a table cell to something that is not a table row! Check the formatter.");
		this._stackItem = new TableCellStackItem(this.options, this._stackItem, maxColumnWidth);
	}
	/**
	* Finalize currently built table cell and add it to parent table row's cells.
	*
	* @param { object } [param0]
	* Object holding the parameters of the cell.
	*
	* @param { number } [param0.colspan] How many columns this cell should occupy.
	* @param { number } [param0.rowspan] How many rows this cell should occupy.
	*/
	closeTableCell({ colspan = 1, rowspan = 1 } = {}) {
		const cell = this._popStackItem();
		const text = trimCharacter(getText(cell), "\n");
		cell.next.cells.push({
			colspan,
			rowspan,
			text
		});
	}
	/**
	* Finalize currently built table row and add it to parent table's rows.
	*/
	closeTableRow() {
		const row = this._popStackItem();
		row.next.rows.push(row.cells);
	}
	/**
	* Finalize currently built table and add the rendered text to the parent block.
	*
	* @param { object } param0
	* Object holding the parameters of the table.
	*
	* @param { TablePrinter } param0.tableToString
	* A function to convert a table of stringified cells into a complete table.
	*
	* @param { number } [param0.leadingLineBreaks]
	* This table should have at least this number of line breaks to separate if from any preceding block.
	*
	* @param { number } [param0.trailingLineBreaks]
	* This table should have at least this number of line breaks to separate it from any following block.
	*/
	closeTable({ tableToString: tableToString$1, leadingLineBreaks = 2, trailingLineBreaks = 2 }) {
		const output = tableToString$1(this._popStackItem().rows);
		if (output) addText(this._stackItem, output, leadingLineBreaks, trailingLineBreaks);
	}
	/**
	* Return the rendered text content of this builder.
	*
	* @returns { string }
	*/
	toString() {
		return getText(this._stackItem.getRoot());
	}
};
function getText(stackItem) {
	if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) throw new Error("Only blocks, list items and table cells can be requested for text contents.");
	return stackItem.inlineTextBuilder.isEmpty() ? stackItem.rawText : stackItem.rawText + stackItem.inlineTextBuilder.toString();
}
function addText(stackItem, text, leadingLineBreaks, trailingLineBreaks) {
	if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) throw new Error("Only blocks, list items and table cells can contain text.");
	const parentText = getText(stackItem);
	const lineBreaks = Math.max(stackItem.stashedLineBreaks, leadingLineBreaks);
	stackItem.inlineTextBuilder.clear();
	if (parentText) stackItem.rawText = parentText + "\n".repeat(lineBreaks) + text;
	else {
		stackItem.rawText = text;
		stackItem.leadingLineBreaks = lineBreaks;
	}
	stackItem.stashedLineBreaks = trailingLineBreaks;
}
/**
* @param { string } str A string to transform.
* @param { TransformerStackItem } transformer A transformer item (with possible continuation).
* @returns { string }
*/
function applyTransformer(str, transformer) {
	return transformer ? applyTransformer(transformer.transform(str), transformer.next) : str;
}
/**
* Compile selectors into a decision tree,
* return a function intended for batch processing.
*
* @param   { Options } [options = {}]   HtmlToText options (defaults, formatters, user options merged, deduplicated).
* @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
* @static
*/
function compile$1(options = {}) {
	const selectorsWithoutFormat = options.selectors.filter((s$1) => !s$1.format);
	if (selectorsWithoutFormat.length) throw new Error("Following selectors have no specified format: " + selectorsWithoutFormat.map((s$1) => `\`${s$1.selector}\``).join(", "));
	const picker = new DecisionTree(options.selectors.map((s$1) => [s$1.selector, s$1])).build(hp2Builder);
	if (typeof options.encodeCharacters !== "function") options.encodeCharacters = makeReplacerFromDict(options.encodeCharacters);
	const baseSelectorsPicker = new DecisionTree(options.baseElements.selectors.map((s$1, i) => [s$1, i + 1])).build(hp2Builder);
	function findBaseElements(dom) {
		return findBases(dom, options, baseSelectorsPicker);
	}
	const limitedWalk = limitedDepthRecursive(options.limits.maxDepth, recursiveWalk, function(dom, builder) {
		builder.addInline(options.limits.ellipsis || "");
	});
	return function(html, metadata = void 0) {
		return process(html, metadata, options, picker, findBaseElements, limitedWalk);
	};
}
/**
* Convert given HTML according to preprocessed options.
*
* @param { string } html HTML content to convert.
* @param { any } metadata Optional metadata for HTML document, for use in formatters.
* @param { Options } options HtmlToText options (preprocessed).
* @param { import('selderee').Picker<DomNode, TagDefinition> } picker
* Tag definition picker for DOM nodes processing.
* @param { (dom: DomNode[]) => DomNode[] } findBaseElements
* Function to extract elements from HTML DOM
* that will only be present in the output text.
* @param { RecursiveCallback } walk Recursive callback.
* @returns { string }
*/
function process(html, metadata, options, picker, findBaseElements, walk) {
	const maxInputLength = options.limits.maxInputLength;
	if (maxInputLength && html && html.length > maxInputLength) {
		console.warn(`Input length ${html.length} is above allowed limit of ${maxInputLength}. Truncating without ellipsis.`);
		html = html.substring(0, maxInputLength);
	}
	const bases = findBaseElements(parseDocument(html, { decodeEntities: options.decodeEntities }).children);
	const builder = new BlockTextBuilder(options, picker, metadata);
	walk(bases, builder);
	return builder.toString();
}
function findBases(dom, options, baseSelectorsPicker) {
	const results = [];
	function recursiveWalk$1(walk, dom$1) {
		dom$1 = dom$1.slice(0, options.limits.maxChildNodes);
		for (const elem of dom$1) {
			if (elem.type !== "tag") continue;
			const pickedSelectorIndex = baseSelectorsPicker.pick1(elem);
			if (pickedSelectorIndex > 0) results.push({
				selectorIndex: pickedSelectorIndex,
				element: elem
			});
			else if (elem.children) walk(elem.children);
			if (results.length >= options.limits.maxBaseElements) return;
		}
	}
	limitedDepthRecursive(options.limits.maxDepth, recursiveWalk$1)(dom);
	if (options.baseElements.orderBy !== "occurrence") results.sort((a, b) => a.selectorIndex - b.selectorIndex);
	return options.baseElements.returnDomByDefault && results.length === 0 ? dom : results.map((x) => x.element);
}
/**
* Function to walk through DOM nodes and accumulate their string representations.
*
* @param   { RecursiveCallback } walk    Recursive callback.
* @param   { DomNode[] }         [dom]   Nodes array to process.
* @param   { BlockTextBuilder }  builder Passed around to accumulate output text.
* @private
*/
function recursiveWalk(walk, dom, builder) {
	if (!dom) return;
	const options = builder.options;
	if (dom.length > options.limits.maxChildNodes) {
		dom = dom.slice(0, options.limits.maxChildNodes);
		dom.push({
			data: options.limits.ellipsis,
			type: "text"
		});
	}
	for (const elem of dom) switch (elem.type) {
		case "text":
			builder.addInline(elem.data);
			break;
		case "tag": {
			const tagDefinition = builder.picker.pick1(elem);
			const format = options.formatters[tagDefinition.format];
			format(elem, walk, builder, tagDefinition.options || {});
			break;
		}
	}
}
/**
* @param { Object<string,string | false> } dict
* A dictionary where keys are characters to replace
* and values are replacement strings.
*
* First code point from dict keys is used.
* Compound emojis with ZWJ are not supported (not until Node 16).
*
* @returns { ((str: string) => string) | undefined }
*/
function makeReplacerFromDict(dict) {
	if (!dict || Object.keys(dict).length === 0) return;
	/** @type { [string, string][] } */
	const entries = Object.entries(dict).filter(([, v]) => v !== false);
	const regex = new RegExp(entries.map(([c$1]) => `(${unicodeEscape([...c$1][0])})`).join("|"), "g");
	const values = entries.map(([, v]) => v);
	const replacer = (m, ...cgs) => values[cgs.findIndex((cg) => cg)];
	return (str) => str.replace(regex, replacer);
}
/**
* Dummy formatter that discards the input and does nothing.
*
* @type { FormatCallback }
*/
function formatSkip(elem, walk, builder, formatOptions) {}
/**
* Insert the given string literal inline instead of a tag.
*
* @type { FormatCallback }
*/
function formatInlineString(elem, walk, builder, formatOptions) {
	builder.addLiteral(formatOptions.string || "");
}
/**
* Insert a block with the given string literal instead of a tag.
*
* @type { FormatCallback }
*/
function formatBlockString(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	builder.addLiteral(formatOptions.string || "");
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process an inline-level element.
*
* @type { FormatCallback }
*/
function formatInline(elem, walk, builder, formatOptions) {
	walk(elem.children, builder);
}
/**
* Process a block-level container.
*
* @type { FormatCallback }
*/
function formatBlock$1(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function renderOpenTag(elem) {
	const attrs = elem.attribs && elem.attribs.length ? " " + Object.entries(elem.attribs).map(([k, v]) => v === "" ? k : `${k}=${v.replace(/"/g, "&quot;")}`).join(" ") : "";
	return `<${elem.name}${attrs}>`;
}
function renderCloseTag(elem) {
	return `</${elem.name}>`;
}
/**
* Render an element as inline HTML tag, walk through it's children.
*
* @type { FormatCallback }
*/
function formatInlineTag(elem, walk, builder, formatOptions) {
	builder.startNoWrap();
	builder.addLiteral(renderOpenTag(elem));
	builder.stopNoWrap();
	walk(elem.children, builder);
	builder.startNoWrap();
	builder.addLiteral(renderCloseTag(elem));
	builder.stopNoWrap();
}
/**
* Render an element as HTML block bag, walk through it's children.
*
* @type { FormatCallback }
*/
function formatBlockTag(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	builder.startNoWrap();
	builder.addLiteral(renderOpenTag(elem));
	builder.stopNoWrap();
	walk(elem.children, builder);
	builder.startNoWrap();
	builder.addLiteral(renderCloseTag(elem));
	builder.stopNoWrap();
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Render an element with all it's children as inline HTML.
*
* @type { FormatCallback }
*/
function formatInlineHtml(elem, walk, builder, formatOptions) {
	builder.startNoWrap();
	builder.addLiteral(render(elem, { decodeEntities: builder.options.decodeEntities }));
	builder.stopNoWrap();
}
/**
* Render an element with all it's children as HTML block.
*
* @type { FormatCallback }
*/
function formatBlockHtml(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	builder.startNoWrap();
	builder.addLiteral(render(elem, { decodeEntities: builder.options.decodeEntities }));
	builder.stopNoWrap();
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Render inline element wrapped with given strings.
*
* @type { FormatCallback }
*/
function formatInlineSurround(elem, walk, builder, formatOptions) {
	builder.addLiteral(formatOptions.prefix || "");
	walk(elem.children, builder);
	builder.addLiteral(formatOptions.suffix || "");
}
var genericFormatters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	block: formatBlock$1,
	blockHtml: formatBlockHtml,
	blockString: formatBlockString,
	blockTag: formatBlockTag,
	inline: formatInline,
	inlineHtml: formatInlineHtml,
	inlineString: formatInlineString,
	inlineSurround: formatInlineSurround,
	inlineTag: formatInlineTag,
	skip: formatSkip
});
function getRow(matrix, j) {
	if (!matrix[j]) matrix[j] = [];
	return matrix[j];
}
function findFirstVacantIndex(row, x = 0) {
	while (row[x]) x++;
	return x;
}
function transposeInPlace(matrix, maxSize) {
	for (let i = 0; i < maxSize; i++) {
		const rowI = getRow(matrix, i);
		for (let j = 0; j < i; j++) {
			const rowJ = getRow(matrix, j);
			if (rowI[j] || rowJ[i]) {
				const temp = rowI[j];
				rowI[j] = rowJ[i];
				rowJ[i] = temp;
			}
		}
	}
}
function putCellIntoLayout(cell, layout, baseRow, baseCol) {
	for (let r$1 = 0; r$1 < cell.rowspan; r$1++) {
		const layoutRow = getRow(layout, baseRow + r$1);
		for (let c$1 = 0; c$1 < cell.colspan; c$1++) layoutRow[baseCol + c$1] = cell;
	}
}
function getOrInitOffset(offsets, index) {
	if (offsets[index] === void 0) offsets[index] = index === 0 ? 0 : 1 + getOrInitOffset(offsets, index - 1);
	return offsets[index];
}
function updateOffset(offsets, base, span, value) {
	offsets[base + span] = Math.max(getOrInitOffset(offsets, base + span), getOrInitOffset(offsets, base) + value);
}
/**
* Render a table into a string.
* Cells can contain multiline text and span across multiple rows and columns.
*
* Modifies cells to add lines array.
*
* @param { TablePrinterCell[][] } tableRows Table to render.
* @param { number } rowSpacing Number of spaces between columns.
* @param { number } colSpacing Number of empty lines between rows.
* @returns { string }
*/
function tableToString(tableRows, rowSpacing, colSpacing) {
	const layout = [];
	let colNumber = 0;
	const rowNumber = tableRows.length;
	const rowOffsets = [0];
	for (let j = 0; j < rowNumber; j++) {
		const layoutRow = getRow(layout, j);
		const cells = tableRows[j];
		let x = 0;
		for (let i = 0; i < cells.length; i++) {
			const cell = cells[i];
			x = findFirstVacantIndex(layoutRow, x);
			putCellIntoLayout(cell, layout, j, x);
			x += cell.colspan;
			cell.lines = cell.text.split("\n");
			const cellHeight = cell.lines.length;
			updateOffset(rowOffsets, j, cell.rowspan, cellHeight + rowSpacing);
		}
		colNumber = layoutRow.length > colNumber ? layoutRow.length : colNumber;
	}
	transposeInPlace(layout, rowNumber > colNumber ? rowNumber : colNumber);
	const outputLines = [];
	const colOffsets = [0];
	for (let x = 0; x < colNumber; x++) {
		let y = 0;
		let cell;
		const rowsInThisColumn = Math.min(rowNumber, layout[x].length);
		while (y < rowsInThisColumn) {
			cell = layout[x][y];
			if (cell) {
				if (!cell.rendered) {
					let cellWidth = 0;
					for (let j = 0; j < cell.lines.length; j++) {
						const line = cell.lines[j];
						const lineOffset = rowOffsets[y] + j;
						outputLines[lineOffset] = (outputLines[lineOffset] || "").padEnd(colOffsets[x]) + line;
						cellWidth = line.length > cellWidth ? line.length : cellWidth;
					}
					updateOffset(colOffsets, x, cell.colspan, cellWidth + colSpacing);
					cell.rendered = true;
				}
				y += cell.rowspan;
			} else {
				const lineOffset = rowOffsets[y];
				outputLines[lineOffset] = outputLines[lineOffset] || "";
				y++;
			}
		}
	}
	return outputLines.join("\n");
}
/**
* Process a line-break.
*
* @type { FormatCallback }
*/
function formatLineBreak(elem, walk, builder, formatOptions) {
	builder.addLineBreak();
}
/**
* Process a `wbr` tag (word break opportunity).
*
* @type { FormatCallback }
*/
function formatWbr(elem, walk, builder, formatOptions) {
	builder.addWordBreakOpportunity();
}
/**
* Process a horizontal line.
*
* @type { FormatCallback }
*/
function formatHorizontalLine(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	builder.addInline("-".repeat(formatOptions.length || builder.options.wordwrap || 40));
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process a paragraph.
*
* @type { FormatCallback }
*/
function formatParagraph(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process a preformatted content.
*
* @type { FormatCallback }
*/
function formatPre(elem, walk, builder, formatOptions) {
	builder.openBlock({
		isPre: true,
		leadingLineBreaks: formatOptions.leadingLineBreaks || 2
	});
	walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process a heading.
*
* @type { FormatCallback }
*/
function formatHeading(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
	if (formatOptions.uppercase !== false) {
		builder.pushWordTransform((str) => str.toUpperCase());
		walk(elem.children, builder);
		builder.popWordTransform();
	} else walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
/**
* Process a blockquote.
*
* @type { FormatCallback }
*/
function formatBlockquote(elem, walk, builder, formatOptions) {
	builder.openBlock({
		leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
		reservedLineLength: 2
	});
	walk(elem.children, builder);
	builder.closeBlock({
		trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
		blockTransform: (str) => (formatOptions.trimEmptyLines !== false ? trimCharacter(str, "\n") : str).split("\n").map((line) => "> " + line).join("\n")
	});
}
function withBrackets(str, brackets) {
	if (!brackets) return str;
	const lbr = typeof brackets[0] === "string" ? brackets[0] : "[";
	const rbr = typeof brackets[1] === "string" ? brackets[1] : "]";
	return lbr + str + rbr;
}
function pathRewrite(path, rewriter, baseUrl, metadata, elem) {
	const modifiedPath = typeof rewriter === "function" ? rewriter(path, metadata, elem) : path;
	return modifiedPath[0] === "/" && baseUrl ? trimCharacterEnd(baseUrl, "/") + modifiedPath : modifiedPath;
}
/**
* Process an image.
*
* @type { FormatCallback }
*/
function formatImage(elem, walk, builder, formatOptions) {
	const attribs = elem.attribs || {};
	const alt = attribs.alt ? attribs.alt : "";
	const src = !attribs.src ? "" : pathRewrite(attribs.src, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
	const text = !src ? alt : !alt ? withBrackets(src, formatOptions.linkBrackets) : alt + " " + withBrackets(src, formatOptions.linkBrackets);
	builder.addInline(text, { noWordTransform: true });
}
/**
* Process an anchor.
*
* @type { FormatCallback }
*/
function formatAnchor(elem, walk, builder, formatOptions) {
	function getHref() {
		if (formatOptions.ignoreHref) return "";
		if (!elem.attribs || !elem.attribs.href) return "";
		let href$1 = elem.attribs.href.replace(/^mailto:/, "");
		if (formatOptions.noAnchorUrl && href$1[0] === "#") return "";
		href$1 = pathRewrite(href$1, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
		return href$1;
	}
	const href = getHref();
	if (!href) walk(elem.children, builder);
	else {
		let text = "";
		builder.pushWordTransform((str) => {
			if (str) text += str;
			return str;
		});
		walk(elem.children, builder);
		builder.popWordTransform();
		if (!(formatOptions.hideLinkHrefIfSameAsText && href === text)) builder.addInline(!text ? href : " " + withBrackets(href, formatOptions.linkBrackets), { noWordTransform: true });
	}
}
/**
* @param { DomNode }           elem               List items with their prefixes.
* @param { RecursiveCallback } walk               Recursive callback to process child nodes.
* @param { BlockTextBuilder }  builder            Passed around to accumulate output text.
* @param { FormatOptions }     formatOptions      Options specific to a formatter.
* @param { () => string }      nextPrefixCallback Function that returns increasing index each time it is called.
*/
function formatList(elem, walk, builder, formatOptions, nextPrefixCallback) {
	const isNestedList = get(elem, ["parent", "name"]) === "li";
	let maxPrefixLength = 0;
	const listItems = (elem.children || []).filter((child) => child.type !== "text" || !/^\s*$/.test(child.data)).map(function(child) {
		if (child.name !== "li") return {
			node: child,
			prefix: ""
		};
		const prefix = isNestedList ? nextPrefixCallback().trimStart() : nextPrefixCallback();
		if (prefix.length > maxPrefixLength) maxPrefixLength = prefix.length;
		return {
			node: child,
			prefix
		};
	});
	if (!listItems.length) return;
	builder.openList({
		interRowLineBreaks: 1,
		leadingLineBreaks: isNestedList ? 1 : formatOptions.leadingLineBreaks || 2,
		maxPrefixLength,
		prefixAlign: "left"
	});
	for (const { node, prefix } of listItems) {
		builder.openListItem({ prefix });
		walk([node], builder);
		builder.closeListItem();
	}
	builder.closeList({ trailingLineBreaks: isNestedList ? 1 : formatOptions.trailingLineBreaks || 2 });
}
/**
* Process an unordered list.
*
* @type { FormatCallback }
*/
function formatUnorderedList(elem, walk, builder, formatOptions) {
	const prefix = formatOptions.itemPrefix || " * ";
	return formatList(elem, walk, builder, formatOptions, () => prefix);
}
/**
* Process an ordered list.
*
* @type { FormatCallback }
*/
function formatOrderedList(elem, walk, builder, formatOptions) {
	let nextIndex = Number(elem.attribs.start || "1");
	const indexFunction = getOrderedListIndexFunction(elem.attribs.type);
	const nextPrefixCallback = () => " " + indexFunction(nextIndex++) + ". ";
	return formatList(elem, walk, builder, formatOptions, nextPrefixCallback);
}
/**
* Return a function that can be used to generate index markers of a specified format.
*
* @param   { string } [olType='1'] Marker type.
* @returns { (i: number) => string }
*/
function getOrderedListIndexFunction(olType = "1") {
	switch (olType) {
		case "a": return (i) => numberToLetterSequence(i, "a");
		case "A": return (i) => numberToLetterSequence(i, "A");
		case "i": return (i) => numberToRoman(i).toLowerCase();
		case "I": return (i) => numberToRoman(i);
		case "1":
		default: return (i) => i.toString();
	}
}
/**
* Given a list of class and ID selectors (prefixed with '.' and '#'),
* return them as separate lists of names without prefixes.
*
* @param { string[] } selectors Class and ID selectors (`[".class", "#id"]` etc).
* @returns { { classes: string[], ids: string[] } }
*/
function splitClassesAndIds(selectors) {
	const classes = [];
	const ids = [];
	for (const selector of selectors) if (selector.startsWith(".")) classes.push(selector.substring(1));
	else if (selector.startsWith("#")) ids.push(selector.substring(1));
	return {
		classes,
		ids
	};
}
function isDataTable(attr, tables) {
	if (tables === true) return true;
	if (!attr) return false;
	const { classes, ids } = splitClassesAndIds(tables);
	const attrClasses = (attr["class"] || "").split(" ");
	const attrIds = (attr["id"] || "").split(" ");
	return attrClasses.some((x) => classes.includes(x)) || attrIds.some((x) => ids.includes(x));
}
/**
* Process a table (either as a container or as a data table, depending on options).
*
* @type { FormatCallback }
*/
function formatTable(elem, walk, builder, formatOptions) {
	return isDataTable(elem.attribs, builder.options.tables) ? formatDataTable(elem, walk, builder, formatOptions) : formatBlock(elem, walk, builder, formatOptions);
}
function formatBlock(elem, walk, builder, formatOptions) {
	builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks });
	walk(elem.children, builder);
	builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks });
}
/**
* Process a data table.
*
* @type { FormatCallback }
*/
function formatDataTable(elem, walk, builder, formatOptions) {
	builder.openTable();
	elem.children.forEach(walkTable);
	builder.closeTable({
		tableToString: (rows) => tableToString(rows, formatOptions.rowSpacing ?? 0, formatOptions.colSpacing ?? 3),
		leadingLineBreaks: formatOptions.leadingLineBreaks,
		trailingLineBreaks: formatOptions.trailingLineBreaks
	});
	function formatCell(cellNode) {
		const colspan = +get(cellNode, ["attribs", "colspan"]) || 1;
		const rowspan = +get(cellNode, ["attribs", "rowspan"]) || 1;
		builder.openTableCell({ maxColumnWidth: formatOptions.maxColumnWidth });
		walk(cellNode.children, builder);
		builder.closeTableCell({
			colspan,
			rowspan
		});
	}
	function walkTable(elem$1) {
		if (elem$1.type !== "tag") return;
		const formatHeaderCell = formatOptions.uppercaseHeaderCells !== false ? (cellNode) => {
			builder.pushWordTransform((str) => str.toUpperCase());
			formatCell(cellNode);
			builder.popWordTransform();
		} : formatCell;
		switch (elem$1.name) {
			case "thead":
			case "tbody":
			case "tfoot":
			case "center":
				elem$1.children.forEach(walkTable);
				return;
			case "tr":
				builder.openTableRow();
				for (const childOfTr of elem$1.children) {
					if (childOfTr.type !== "tag") continue;
					switch (childOfTr.name) {
						case "th":
							formatHeaderCell(childOfTr);
							break;
						case "td":
							formatCell(childOfTr);
							break;
					}
				}
				builder.closeTableRow();
				break;
		}
	}
}
var textFormatters = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	anchor: formatAnchor,
	blockquote: formatBlockquote,
	dataTable: formatDataTable,
	heading: formatHeading,
	horizontalLine: formatHorizontalLine,
	image: formatImage,
	lineBreak: formatLineBreak,
	orderedList: formatOrderedList,
	paragraph: formatParagraph,
	pre: formatPre,
	table: formatTable,
	unorderedList: formatUnorderedList,
	wbr: formatWbr
});
/**
* Default options.
*
* @constant
* @type { Options }
* @default
* @private
*/
const DEFAULT_OPTIONS = {
	baseElements: {
		selectors: ["body"],
		orderBy: "selectors",
		returnDomByDefault: true
	},
	decodeEntities: true,
	encodeCharacters: {},
	formatters: {},
	limits: {
		ellipsis: "...",
		maxBaseElements: void 0,
		maxChildNodes: void 0,
		maxDepth: void 0,
		maxInputLength: 1 << 24
	},
	longWordSplit: {
		forceWrapOnLimit: false,
		wrapCharacters: []
	},
	preserveNewlines: false,
	selectors: [
		{
			selector: "*",
			format: "inline"
		},
		{
			selector: "a",
			format: "anchor",
			options: {
				baseUrl: null,
				hideLinkHrefIfSameAsText: false,
				ignoreHref: false,
				linkBrackets: ["[", "]"],
				noAnchorUrl: true
			}
		},
		{
			selector: "article",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "aside",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "blockquote",
			format: "blockquote",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2,
				trimEmptyLines: true
			}
		},
		{
			selector: "br",
			format: "lineBreak"
		},
		{
			selector: "div",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "footer",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "form",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "h1",
			format: "heading",
			options: {
				leadingLineBreaks: 3,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h2",
			format: "heading",
			options: {
				leadingLineBreaks: 3,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h3",
			format: "heading",
			options: {
				leadingLineBreaks: 3,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h4",
			format: "heading",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h5",
			format: "heading",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "h6",
			format: "heading",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2,
				uppercase: true
			}
		},
		{
			selector: "header",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "hr",
			format: "horizontalLine",
			options: {
				leadingLineBreaks: 2,
				length: void 0,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "img",
			format: "image",
			options: {
				baseUrl: null,
				linkBrackets: ["[", "]"]
			}
		},
		{
			selector: "main",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "nav",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "ol",
			format: "orderedList",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "p",
			format: "paragraph",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "pre",
			format: "pre",
			options: {
				leadingLineBreaks: 2,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "section",
			format: "block",
			options: {
				leadingLineBreaks: 1,
				trailingLineBreaks: 1
			}
		},
		{
			selector: "table",
			format: "table",
			options: {
				colSpacing: 3,
				leadingLineBreaks: 2,
				maxColumnWidth: 60,
				rowSpacing: 0,
				trailingLineBreaks: 2,
				uppercaseHeaderCells: true
			}
		},
		{
			selector: "ul",
			format: "unorderedList",
			options: {
				itemPrefix: " * ",
				leadingLineBreaks: 2,
				trailingLineBreaks: 2
			}
		},
		{
			selector: "wbr",
			format: "wbr"
		}
	],
	tables: [],
	whitespaceCharacters: " 	\r\n\f​",
	wordwrap: 80
};
const concatMerge = (acc, src, options) => [...acc, ...src];
const overwriteMerge = (acc, src, options) => [...src];
const selectorsMerge = (acc, src, options) => acc.some((s$1) => typeof s$1 === "object") ? concatMerge(acc, src) : overwriteMerge(acc, src);
/**
* Preprocess options, compile selectors into a decision tree,
* return a function intended for batch processing.
*
* @param   { Options } [options = {}]   HtmlToText options.
* @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
* @static
*/
function compile(options = {}) {
	options = (0, import_cjs.default)(DEFAULT_OPTIONS, options, {
		arrayMerge: overwriteMerge,
		customMerge: (key) => key === "selectors" ? selectorsMerge : void 0
	});
	options.formatters = Object.assign({}, genericFormatters, textFormatters, options.formatters);
	options.selectors = mergeDuplicatesPreferLast(options.selectors, ((s$1) => s$1.selector));
	handleDeprecatedOptions(options);
	return compile$1(options);
}
/**
* Convert given HTML content to plain text string.
*
* @param   { string }  html           HTML content to convert.
* @param   { Options } [options = {}] HtmlToText options.
* @param   { any }     [metadata]     Optional metadata for HTML document, for use in formatters.
* @returns { string }                 Plain text string.
* @static
*
* @example
* const { convert } = require('html-to-text');
* const text = convert('<h1>Hello World</h1>', {
*   wordwrap: 130
* });
* console.log(text); // HELLO WORLD
*/
function convert(html, options = {}, metadata = void 0) {
	return compile(options)(html, metadata);
}
/**
* Map previously existing and now deprecated options to the new options layout.
* This is a subject for cleanup in major releases.
*
* @param { Options } options HtmlToText options.
*/
function handleDeprecatedOptions(options) {
	if (options.tags) {
		const tagDefinitions = Object.entries(options.tags).map(([selector, definition]) => ({
			...definition,
			selector: selector || "*"
		}));
		options.selectors.push(...tagDefinitions);
		options.selectors = mergeDuplicatesPreferLast(options.selectors, ((s$1) => s$1.selector));
	}
	function set(obj, path, value) {
		const valueKey = path.pop();
		for (const key of path) {
			let nested = obj[key];
			if (!nested) {
				nested = {};
				obj[key] = nested;
			}
			obj = nested;
		}
		obj[valueKey] = value;
	}
	if (options["baseElement"]) {
		const baseElement = options["baseElement"];
		set(options, ["baseElements", "selectors"], Array.isArray(baseElement) ? baseElement : [baseElement]);
	}
	if (options["returnDomByDefault"] !== void 0) set(options, ["baseElements", "returnDomByDefault"], options["returnDomByDefault"]);
	for (const definition of options.selectors) if (definition.format === "anchor" && get(definition, ["options", "noLinkBrackets"])) set(definition, ["options", "linkBrackets"], false);
}

//#endregion
export { convert as t };