
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/util.js
const nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
nameStartChar + "";
const nameRegexp = "[" + nameStartChar + "][:A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*";
const regexName = /* @__PURE__ */ new RegExp("^" + nameRegexp + "$");
function getAllMatches(string, regex) {
	const matches = [];
	let match = regex.exec(string);
	while (match) {
		const allmatches = [];
		allmatches.startIndex = regex.lastIndex - match[0].length;
		const len = match.length;
		for (let index = 0; index < len; index++) allmatches.push(match[index]);
		matches.push(allmatches);
		match = regex.exec(string);
	}
	return matches;
}
const isName = function(string) {
	const match = regexName.exec(string);
	return !(match === null || typeof match === "undefined");
};
function isExist(v) {
	return typeof v !== "undefined";
}
/**
* Dangerous property names that could lead to prototype pollution or security issues
*/
const DANGEROUS_PROPERTY_NAMES = [
	"hasOwnProperty",
	"toString",
	"valueOf",
	"__defineGetter__",
	"__defineSetter__",
	"__lookupGetter__",
	"__lookupSetter__"
];
const criticalProperties = [
	"__proto__",
	"constructor",
	"prototype"
];

//#endregion
//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/validator.js
const defaultOptions$1 = {
	allowBooleanAttributes: false,
	unpairedTags: []
};
function validate(xmlData, options) {
	options = Object.assign({}, defaultOptions$1, options);
	const tags = [];
	let tagFound = false;
	let reachedRoot = false;
	if (xmlData[0] === "﻿") xmlData = xmlData.substr(1);
	for (let i = 0; i < xmlData.length; i++) if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
		i += 2;
		i = readPI(xmlData, i);
		if (i.err) return i;
	} else if (xmlData[i] === "<") {
		let tagStartPos = i;
		i++;
		if (xmlData[i] === "!") {
			i = readCommentAndCDATA(xmlData, i);
			continue;
		} else {
			let closingTag = false;
			if (xmlData[i] === "/") {
				closingTag = true;
				i++;
			}
			let tagName = "";
			for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) tagName += xmlData[i];
			tagName = tagName.trim();
			if (tagName[tagName.length - 1] === "/") {
				tagName = tagName.substring(0, tagName.length - 1);
				i--;
			}
			if (!validateTagName(tagName)) {
				let msg;
				if (tagName.trim().length === 0) msg = "Invalid space after '<'.";
				else msg = "Tag '" + tagName + "' is an invalid name.";
				return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
			}
			const result = readAttributeStr(xmlData, i);
			if (result === false) return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
			let attrStr = result.value;
			i = result.index;
			if (attrStr[attrStr.length - 1] === "/") {
				const attrStrStart = i - attrStr.length;
				attrStr = attrStr.substring(0, attrStr.length - 1);
				const isValid = validateAttributeString(attrStr, options);
				if (isValid === true) tagFound = true;
				else return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
			} else if (closingTag) if (!result.tagClosed) return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
			else if (attrStr.trim().length > 0) return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
			else if (tags.length === 0) return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
			else {
				const otg = tags.pop();
				if (tagName !== otg.tagName) {
					let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
					return getErrorObject("InvalidTag", "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.", getLineNumberForPosition(xmlData, tagStartPos));
				}
				if (tags.length == 0) reachedRoot = true;
			}
			else {
				const isValid = validateAttributeString(attrStr, options);
				if (isValid !== true) return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
				if (reachedRoot === true) return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
				else if (options.unpairedTags.indexOf(tagName) !== -1) {} else tags.push({
					tagName,
					tagStartPos
				});
				tagFound = true;
			}
			for (i++; i < xmlData.length; i++) if (xmlData[i] === "<") if (xmlData[i + 1] === "!") {
				i++;
				i = readCommentAndCDATA(xmlData, i);
				continue;
			} else if (xmlData[i + 1] === "?") {
				i = readPI(xmlData, ++i);
				if (i.err) return i;
			} else break;
			else if (xmlData[i] === "&") {
				const afterAmp = validateAmpersand(xmlData, i);
				if (afterAmp == -1) return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
				i = afterAmp;
			} else if (reachedRoot === true && !isWhiteSpace(xmlData[i])) return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
			if (xmlData[i] === "<") i--;
		}
	} else {
		if (isWhiteSpace(xmlData[i])) continue;
		return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
	}
	if (!tagFound) return getErrorObject("InvalidXml", "Start tag expected.", 1);
	else if (tags.length == 1) return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
	else if (tags.length > 0) return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", {
		line: 1,
		col: 1
	});
	return true;
}
function isWhiteSpace(char) {
	return char === " " || char === "	" || char === "\n" || char === "\r";
}
/**
* Read Processing insstructions and skip
* @param {*} xmlData
* @param {*} i
*/
function readPI(xmlData, i) {
	const start = i;
	for (; i < xmlData.length; i++) if (xmlData[i] == "?" || xmlData[i] == " ") {
		const tagname = xmlData.substr(start, i - start);
		if (i > 5 && tagname === "xml") return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
		else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
			i++;
			break;
		} else continue;
	}
	return i;
}
function readCommentAndCDATA(xmlData, i) {
	if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
		for (i += 3; i < xmlData.length; i++) if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
			i += 2;
			break;
		}
	} else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
		let angleBracketsCount = 1;
		for (i += 8; i < xmlData.length; i++) if (xmlData[i] === "<") angleBracketsCount++;
		else if (xmlData[i] === ">") {
			angleBracketsCount--;
			if (angleBracketsCount === 0) break;
		}
	} else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
		for (i += 8; i < xmlData.length; i++) if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
			i += 2;
			break;
		}
	}
	return i;
}
const doubleQuote = "\"";
const singleQuote = "'";
/**
* Keep reading xmlData until '<' is found outside the attribute value.
* @param {string} xmlData
* @param {number} i
*/
function readAttributeStr(xmlData, i) {
	let attrStr = "";
	let startChar = "";
	let tagClosed = false;
	for (; i < xmlData.length; i++) {
		if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) if (startChar === "") startChar = xmlData[i];
		else if (startChar !== xmlData[i]) {} else startChar = "";
		else if (xmlData[i] === ">") {
			if (startChar === "") {
				tagClosed = true;
				break;
			}
		}
		attrStr += xmlData[i];
	}
	if (startChar !== "") return false;
	return {
		value: attrStr,
		index: i,
		tagClosed
	};
}
/**
* Select all the attributes whether valid or invalid.
*/
const validAttrStrRegxp = new RegExp("(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['\"])(([\\s\\S])*?)\\5)?", "g");
function validateAttributeString(attrStr, options) {
	const matches = getAllMatches(attrStr, validAttrStrRegxp);
	const attrNames = {};
	for (let i = 0; i < matches.length; i++) {
		if (matches[i][1].length === 0) return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
		else if (matches[i][3] !== void 0 && matches[i][4] === void 0) return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
		else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
		const attrName = matches[i][2];
		if (!validateAttrName(attrName)) return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
		if (!Object.prototype.hasOwnProperty.call(attrNames, attrName)) attrNames[attrName] = 1;
		else return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
	}
	return true;
}
function validateNumberAmpersand(xmlData, i) {
	let re = /\d/;
	if (xmlData[i] === "x") {
		i++;
		re = /[\da-fA-F]/;
	}
	for (; i < xmlData.length; i++) {
		if (xmlData[i] === ";") return i;
		if (!xmlData[i].match(re)) break;
	}
	return -1;
}
function validateAmpersand(xmlData, i) {
	i++;
	if (xmlData[i] === ";") return -1;
	if (xmlData[i] === "#") {
		i++;
		return validateNumberAmpersand(xmlData, i);
	}
	let count = 0;
	for (; i < xmlData.length; i++, count++) {
		if (xmlData[i].match(/\w/) && count < 20) continue;
		if (xmlData[i] === ";") break;
		return -1;
	}
	return i;
}
function getErrorObject(code, message, lineNumber) {
	return { err: {
		code,
		msg: message,
		line: lineNumber.line || lineNumber,
		col: lineNumber.col
	} };
}
function validateAttrName(attrName) {
	return isName(attrName);
}
function validateTagName(tagname) {
	return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
	const lines = xmlData.substring(0, index).split(/\r?\n/);
	return {
		line: lines.length,
		col: lines[lines.length - 1].length + 1
	};
}
function getPositionFromMatch(match) {
	return match.startIndex + match[1].length;
}

//#endregion
//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
const defaultOnDangerousProperty = (name) => {
	if (DANGEROUS_PROPERTY_NAMES.includes(name)) return "__" + name;
	return name;
};
const defaultOptions = {
	preserveOrder: false,
	attributeNamePrefix: "@_",
	attributesGroupName: false,
	textNodeName: "#text",
	ignoreAttributes: true,
	removeNSPrefix: false,
	allowBooleanAttributes: false,
	parseTagValue: true,
	parseAttributeValue: false,
	trimValues: true,
	cdataPropName: false,
	numberParseOptions: {
		hex: true,
		leadingZeros: true,
		eNotation: true
	},
	tagValueProcessor: function(tagName, val) {
		return val;
	},
	attributeValueProcessor: function(attrName, val) {
		return val;
	},
	stopNodes: [],
	alwaysCreateTextNode: false,
	isArray: () => false,
	commentPropName: false,
	unpairedTags: [],
	processEntities: true,
	htmlEntities: false,
	ignoreDeclaration: false,
	ignorePiTags: false,
	transformTagName: false,
	transformAttributeName: false,
	updateTag: function(tagName, jPath, attrs) {
		return tagName;
	},
	captureMetaData: false,
	maxNestedTags: 100,
	strictReservedNames: true,
	jPath: true,
	onDangerousProperty: defaultOnDangerousProperty
};
/**
* Validates that a property name is safe to use
* @param {string} propertyName - The property name to validate
* @param {string} optionName - The option field name (for error message)
* @throws {Error} If property name is dangerous
*/
function validatePropertyName(propertyName, optionName) {
	if (typeof propertyName !== "string") return;
	const normalized = propertyName.toLowerCase();
	if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) throw new Error(`[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`);
	if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) throw new Error(`[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`);
}
/**
* Normalizes processEntities option for backward compatibility
* @param {boolean|object} value 
* @returns {object} Always returns normalized object
*/
function normalizeProcessEntities(value) {
	if (typeof value === "boolean") return {
		enabled: value,
		maxEntitySize: 1e4,
		maxExpansionDepth: 10,
		maxTotalExpansions: 1e3,
		maxExpandedLength: 1e5,
		maxEntityCount: 100,
		allowedTags: null,
		tagFilter: null
	};
	if (typeof value === "object" && value !== null) return {
		enabled: value.enabled !== false,
		maxEntitySize: value.maxEntitySize ?? 1e4,
		maxExpansionDepth: value.maxExpansionDepth ?? 10,
		maxTotalExpansions: value.maxTotalExpansions ?? 1e3,
		maxExpandedLength: value.maxExpandedLength ?? 1e5,
		maxEntityCount: value.maxEntityCount ?? 100,
		allowedTags: value.allowedTags ?? null,
		tagFilter: value.tagFilter ?? null
	};
	return normalizeProcessEntities(true);
}
const buildOptions = function(options) {
	const built = Object.assign({}, defaultOptions, options);
	const propertyNameOptions = [
		{
			value: built.attributeNamePrefix,
			name: "attributeNamePrefix"
		},
		{
			value: built.attributesGroupName,
			name: "attributesGroupName"
		},
		{
			value: built.textNodeName,
			name: "textNodeName"
		},
		{
			value: built.cdataPropName,
			name: "cdataPropName"
		},
		{
			value: built.commentPropName,
			name: "commentPropName"
		}
	];
	for (const { value, name } of propertyNameOptions) if (value) validatePropertyName(value, name);
	if (built.onDangerousProperty === null) built.onDangerousProperty = defaultOnDangerousProperty;
	built.processEntities = normalizeProcessEntities(built.processEntities);
	if (built.stopNodes && Array.isArray(built.stopNodes)) built.stopNodes = built.stopNodes.map((node) => {
		if (typeof node === "string" && node.startsWith("*.")) return ".." + node.substring(2);
		return node;
	});
	return built;
};

//#endregion
//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
let METADATA_SYMBOL$1;
if (typeof Symbol !== "function") METADATA_SYMBOL$1 = "@@xmlMetadata";
else METADATA_SYMBOL$1 = Symbol("XML Node Metadata");
var XmlNode = class {
	constructor(tagname) {
		this.tagname = tagname;
		this.child = [];
		this[":@"] = Object.create(null);
	}
	add(key, val) {
		if (key === "__proto__") key = "#__proto__";
		this.child.push({ [key]: val });
	}
	addChild(node, startIndex) {
		if (node.tagname === "__proto__") node.tagname = "#__proto__";
		if (node[":@"] && Object.keys(node[":@"]).length > 0) this.child.push({
			[node.tagname]: node.child,
			[":@"]: node[":@"]
		});
		else this.child.push({ [node.tagname]: node.child });
		if (startIndex !== void 0) this.child[this.child.length - 1][METADATA_SYMBOL$1] = { startIndex };
	}
	/** symbol used for metadata */
	static getMetaDataSymbol() {
		return METADATA_SYMBOL$1;
	}
};

//#endregion
//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var DocTypeReader = class {
	constructor(options) {
		this.suppressValidationErr = !options;
		this.options = options;
	}
	readDocType(xmlData, i) {
		const entities = Object.create(null);
		let entityCount = 0;
		if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
			i = i + 9;
			let angleBracketsCount = 1;
			let hasBody = false, comment = false;
			let exp = "";
			for (; i < xmlData.length; i++) if (xmlData[i] === "<" && !comment) {
				if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
					i += 7;
					let entityName, val;
					[entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
					if (val.indexOf("&") === -1) {
						if (this.options.enabled !== false && this.options.maxEntityCount && entityCount >= this.options.maxEntityCount) throw new Error(`Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`);
						const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
						entities[entityName] = {
							regx: RegExp(`&${escaped};`, "g"),
							val
						};
						entityCount++;
					}
				} else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
					i += 8;
					const { index } = this.readElementExp(xmlData, i + 1);
					i = index;
				} else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) i += 8;
				else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
					i += 9;
					const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
					i = index;
				} else if (hasSeq(xmlData, "!--", i)) comment = true;
				else throw new Error(`Invalid DOCTYPE`);
				angleBracketsCount++;
				exp = "";
			} else if (xmlData[i] === ">") {
				if (comment) {
					if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
						comment = false;
						angleBracketsCount--;
					}
				} else angleBracketsCount--;
				if (angleBracketsCount === 0) break;
			} else if (xmlData[i] === "[") hasBody = true;
			else exp += xmlData[i];
			if (angleBracketsCount !== 0) throw new Error(`Unclosed DOCTYPE`);
		} else throw new Error(`Invalid Tag instead of DOCTYPE`);
		return {
			entities,
			i
		};
	}
	readEntityExp(xmlData, i) {
		i = skipWhitespace(xmlData, i);
		let entityName = "";
		while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== "\"" && xmlData[i] !== "'") {
			entityName += xmlData[i];
			i++;
		}
		validateEntityName(entityName);
		i = skipWhitespace(xmlData, i);
		if (!this.suppressValidationErr) {
			if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") throw new Error("External entities are not supported");
			else if (xmlData[i] === "%") throw new Error("Parameter entities are not supported");
		}
		let entityValue = "";
		[i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
		if (this.options.enabled !== false && this.options.maxEntitySize && entityValue.length > this.options.maxEntitySize) throw new Error(`Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`);
		i--;
		return [
			entityName,
			entityValue,
			i
		];
	}
	readNotationExp(xmlData, i) {
		i = skipWhitespace(xmlData, i);
		let notationName = "";
		while (i < xmlData.length && !/\s/.test(xmlData[i])) {
			notationName += xmlData[i];
			i++;
		}
		!this.suppressValidationErr && validateEntityName(notationName);
		i = skipWhitespace(xmlData, i);
		const identifierType = xmlData.substring(i, i + 6).toUpperCase();
		if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
		i += identifierType.length;
		i = skipWhitespace(xmlData, i);
		let publicIdentifier = null;
		let systemIdentifier = null;
		if (identifierType === "PUBLIC") {
			[i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
			i = skipWhitespace(xmlData, i);
			if (xmlData[i] === "\"" || xmlData[i] === "'") [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
		} else if (identifierType === "SYSTEM") {
			[i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
			if (!this.suppressValidationErr && !systemIdentifier) throw new Error("Missing mandatory system identifier for SYSTEM notation");
		}
		return {
			notationName,
			publicIdentifier,
			systemIdentifier,
			index: --i
		};
	}
	readIdentifierVal(xmlData, i, type) {
		let identifierVal = "";
		const startChar = xmlData[i];
		if (startChar !== "\"" && startChar !== "'") throw new Error(`Expected quoted string, found "${startChar}"`);
		i++;
		while (i < xmlData.length && xmlData[i] !== startChar) {
			identifierVal += xmlData[i];
			i++;
		}
		if (xmlData[i] !== startChar) throw new Error(`Unterminated ${type} value`);
		i++;
		return [i, identifierVal];
	}
	readElementExp(xmlData, i) {
		i = skipWhitespace(xmlData, i);
		let elementName = "";
		while (i < xmlData.length && !/\s/.test(xmlData[i])) {
			elementName += xmlData[i];
			i++;
		}
		if (!this.suppressValidationErr && !isName(elementName)) throw new Error(`Invalid element name: "${elementName}"`);
		i = skipWhitespace(xmlData, i);
		let contentModel = "";
		if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) i += 4;
		else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) i += 2;
		else if (xmlData[i] === "(") {
			i++;
			while (i < xmlData.length && xmlData[i] !== ")") {
				contentModel += xmlData[i];
				i++;
			}
			if (xmlData[i] !== ")") throw new Error("Unterminated content model");
		} else if (!this.suppressValidationErr) throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
		return {
			elementName,
			contentModel: contentModel.trim(),
			index: i
		};
	}
	readAttlistExp(xmlData, i) {
		i = skipWhitespace(xmlData, i);
		let elementName = "";
		while (i < xmlData.length && !/\s/.test(xmlData[i])) {
			elementName += xmlData[i];
			i++;
		}
		validateEntityName(elementName);
		i = skipWhitespace(xmlData, i);
		let attributeName = "";
		while (i < xmlData.length && !/\s/.test(xmlData[i])) {
			attributeName += xmlData[i];
			i++;
		}
		if (!validateEntityName(attributeName)) throw new Error(`Invalid attribute name: "${attributeName}"`);
		i = skipWhitespace(xmlData, i);
		let attributeType = "";
		if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
			attributeType = "NOTATION";
			i += 8;
			i = skipWhitespace(xmlData, i);
			if (xmlData[i] !== "(") throw new Error(`Expected '(', found "${xmlData[i]}"`);
			i++;
			let allowedNotations = [];
			while (i < xmlData.length && xmlData[i] !== ")") {
				let notation = "";
				while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
					notation += xmlData[i];
					i++;
				}
				notation = notation.trim();
				if (!validateEntityName(notation)) throw new Error(`Invalid notation name: "${notation}"`);
				allowedNotations.push(notation);
				if (xmlData[i] === "|") {
					i++;
					i = skipWhitespace(xmlData, i);
				}
			}
			if (xmlData[i] !== ")") throw new Error("Unterminated list of notations");
			i++;
			attributeType += " (" + allowedNotations.join("|") + ")";
		} else {
			while (i < xmlData.length && !/\s/.test(xmlData[i])) {
				attributeType += xmlData[i];
				i++;
			}
			if (!this.suppressValidationErr && ![
				"CDATA",
				"ID",
				"IDREF",
				"IDREFS",
				"ENTITY",
				"ENTITIES",
				"NMTOKEN",
				"NMTOKENS"
			].includes(attributeType.toUpperCase())) throw new Error(`Invalid attribute type: "${attributeType}"`);
		}
		i = skipWhitespace(xmlData, i);
		let defaultValue = "";
		if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
			defaultValue = "#REQUIRED";
			i += 8;
		} else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
			defaultValue = "#IMPLIED";
			i += 7;
		} else [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
		return {
			elementName,
			attributeName,
			attributeType,
			defaultValue,
			index: i
		};
	}
};
const skipWhitespace = (data, index) => {
	while (index < data.length && /\s/.test(data[index])) index++;
	return index;
};
function hasSeq(data, seq, i) {
	for (let j = 0; j < seq.length; j++) if (seq[j] !== data[i + j + 1]) return false;
	return true;
}
function validateEntityName(name) {
	if (isName(name)) return name;
	else throw new Error(`Invalid entity name ${name}`);
}

//#endregion
//#region ../../node_modules/.bun/strnum@2.2.1/node_modules/strnum/strnum.js
const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
const consider = {
	hex: true,
	leadingZeros: true,
	decimalPoint: ".",
	eNotation: true,
	infinity: "original"
};
function toNumber(str, options = {}) {
	options = Object.assign({}, consider, options);
	if (!str || typeof str !== "string") return str;
	let trimmedStr = str.trim();
	if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
	else if (str === "0") return 0;
	else if (options.hex && hexRegex.test(trimmedStr)) return parse_int(trimmedStr, 16);
	else if (!isFinite(trimmedStr)) return handleInfinity(str, Number(trimmedStr), options);
	else if (trimmedStr.includes("e") || trimmedStr.includes("E")) return resolveEnotation(str, trimmedStr, options);
	else {
		const match = numRegex.exec(trimmedStr);
		if (match) {
			const sign = match[1] || "";
			const leadingZeros = match[2];
			let numTrimmedByZeros = trimZeros(match[3]);
			const decimalAdjacentToLeadingZeros = sign ? str[leadingZeros.length + 1] === "." : str[leadingZeros.length] === ".";
			if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) return str;
			else {
				const num = Number(trimmedStr);
				const parsedStr = String(num);
				if (num === 0) return num;
				if (parsedStr.search(/[eE]/) !== -1) if (options.eNotation) return num;
				else return str;
				else if (trimmedStr.indexOf(".") !== -1) if (parsedStr === "0") return num;
				else if (parsedStr === numTrimmedByZeros) return num;
				else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
				else return str;
				let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
				if (leadingZeros) return n === parsedStr || sign + n === parsedStr ? num : str;
				else return n === parsedStr || n === sign + parsedStr ? num : str;
			}
		} else return str;
	}
}
const eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str, trimmedStr, options) {
	if (!options.eNotation) return str;
	const notation = trimmedStr.match(eNotationRegx);
	if (notation) {
		let sign = notation[1] || "";
		const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
		const leadingZeros = notation[2];
		const eAdjacentToLeadingZeros = sign ? str[leadingZeros.length + 1] === eChar : str[leadingZeros.length] === eChar;
		if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
		else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) return Number(trimmedStr);
		else if (leadingZeros.length > 0) if (options.leadingZeros && !eAdjacentToLeadingZeros) {
			trimmedStr = (notation[1] || "") + notation[3];
			return Number(trimmedStr);
		} else return str;
		else return Number(trimmedStr);
	} else return str;
}
/**
* 
* @param {string} numStr without leading zeros
* @returns 
*/
function trimZeros(numStr) {
	if (numStr && numStr.indexOf(".") !== -1) {
		numStr = numStr.replace(/0+$/, "");
		if (numStr === ".") numStr = "0";
		else if (numStr[0] === ".") numStr = "0" + numStr;
		else if (numStr[numStr.length - 1] === ".") numStr = numStr.substring(0, numStr.length - 1);
		return numStr;
	}
	return numStr;
}
function parse_int(numStr, base) {
	if (parseInt) return parseInt(numStr, base);
	else if (Number.parseInt) return Number.parseInt(numStr, base);
	else if (window && window.parseInt) return window.parseInt(numStr, base);
	else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}
/**
* Handle infinite values based on user option
* @param {string} str - original input string
* @param {number} num - parsed number (Infinity or -Infinity)
* @param {object} options - user options
* @returns {string|number|null} based on infinity option
*/
function handleInfinity(str, num, options) {
	const isPositive = num === Infinity;
	switch (options.infinity.toLowerCase()) {
		case "null": return null;
		case "infinity": return num;
		case "string": return isPositive ? "Infinity" : "-Infinity";
		case "original":
		default: return str;
	}
}

//#endregion
//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/ignoreAttributes.js
function getIgnoreAttributesFn(ignoreAttributes) {
	if (typeof ignoreAttributes === "function") return ignoreAttributes;
	if (Array.isArray(ignoreAttributes)) return (attrName) => {
		for (const pattern of ignoreAttributes) {
			if (typeof pattern === "string" && attrName === pattern) return true;
			if (pattern instanceof RegExp && pattern.test(attrName)) return true;
		}
	};
	return () => false;
}

//#endregion
//#region ../../node_modules/.bun/path-expression-matcher@1.1.3/node_modules/path-expression-matcher/src/Expression.js
/**
* Expression - Parses and stores a tag pattern expression
* 
* Patterns are parsed once and stored in an optimized structure for fast matching.
* 
* @example
* const expr = new Expression("root.users.user");
* const expr2 = new Expression("..user[id]:first");
* const expr3 = new Expression("root/users/user", { separator: '/' });
*/
var Expression = class {
	/**
	* Create a new Expression
	* @param {string} pattern - Pattern string (e.g., "root.users.user", "..user[id]")
	* @param {Object} options - Configuration options
	* @param {string} options.separator - Path separator (default: '.')
	*/
	constructor(pattern, options = {}) {
		this.pattern = pattern;
		this.separator = options.separator || ".";
		this.segments = this._parse(pattern);
		this._hasDeepWildcard = this.segments.some((seg) => seg.type === "deep-wildcard");
		this._hasAttributeCondition = this.segments.some((seg) => seg.attrName !== void 0);
		this._hasPositionSelector = this.segments.some((seg) => seg.position !== void 0);
	}
	/**
	* Parse pattern string into segments
	* @private
	* @param {string} pattern - Pattern to parse
	* @returns {Array} Array of segment objects
	*/
	_parse(pattern) {
		const segments = [];
		let i = 0;
		let currentPart = "";
		while (i < pattern.length) if (pattern[i] === this.separator) if (i + 1 < pattern.length && pattern[i + 1] === this.separator) {
			if (currentPart.trim()) {
				segments.push(this._parseSegment(currentPart.trim()));
				currentPart = "";
			}
			segments.push({ type: "deep-wildcard" });
			i += 2;
		} else {
			if (currentPart.trim()) segments.push(this._parseSegment(currentPart.trim()));
			currentPart = "";
			i++;
		}
		else {
			currentPart += pattern[i];
			i++;
		}
		if (currentPart.trim()) segments.push(this._parseSegment(currentPart.trim()));
		return segments;
	}
	/**
	* Parse a single segment
	* @private
	* @param {string} part - Segment string (e.g., "user", "ns::user", "user[id]", "ns::user:first")
	* @returns {Object} Segment object
	*/
	_parseSegment(part) {
		const segment = { type: "tag" };
		let bracketContent = null;
		let withoutBrackets = part;
		const bracketMatch = part.match(/^([^\[]+)(\[[^\]]*\])(.*)$/);
		if (bracketMatch) {
			withoutBrackets = bracketMatch[1] + bracketMatch[3];
			if (bracketMatch[2]) {
				const content = bracketMatch[2].slice(1, -1);
				if (content) bracketContent = content;
			}
		}
		let namespace = void 0;
		let tagAndPosition = withoutBrackets;
		if (withoutBrackets.includes("::")) {
			const nsIndex = withoutBrackets.indexOf("::");
			namespace = withoutBrackets.substring(0, nsIndex).trim();
			tagAndPosition = withoutBrackets.substring(nsIndex + 2).trim();
			if (!namespace) throw new Error(`Invalid namespace in pattern: ${part}`);
		}
		let tag = void 0;
		let positionMatch = null;
		if (tagAndPosition.includes(":")) {
			const colonIndex = tagAndPosition.lastIndexOf(":");
			const tagPart = tagAndPosition.substring(0, colonIndex).trim();
			const posPart = tagAndPosition.substring(colonIndex + 1).trim();
			if ([
				"first",
				"last",
				"odd",
				"even"
			].includes(posPart) || /^nth\(\d+\)$/.test(posPart)) {
				tag = tagPart;
				positionMatch = posPart;
			} else tag = tagAndPosition;
		} else tag = tagAndPosition;
		if (!tag) throw new Error(`Invalid segment pattern: ${part}`);
		segment.tag = tag;
		if (namespace) segment.namespace = namespace;
		if (bracketContent) if (bracketContent.includes("=")) {
			const eqIndex = bracketContent.indexOf("=");
			segment.attrName = bracketContent.substring(0, eqIndex).trim();
			segment.attrValue = bracketContent.substring(eqIndex + 1).trim();
		} else segment.attrName = bracketContent.trim();
		if (positionMatch) {
			const nthMatch = positionMatch.match(/^nth\((\d+)\)$/);
			if (nthMatch) {
				segment.position = "nth";
				segment.positionValue = parseInt(nthMatch[1], 10);
			} else segment.position = positionMatch;
		}
		return segment;
	}
	/**
	* Get the number of segments
	* @returns {number}
	*/
	get length() {
		return this.segments.length;
	}
	/**
	* Check if expression contains deep wildcard
	* @returns {boolean}
	*/
	hasDeepWildcard() {
		return this._hasDeepWildcard;
	}
	/**
	* Check if expression has attribute conditions
	* @returns {boolean}
	*/
	hasAttributeCondition() {
		return this._hasAttributeCondition;
	}
	/**
	* Check if expression has position selectors
	* @returns {boolean}
	*/
	hasPositionSelector() {
		return this._hasPositionSelector;
	}
	/**
	* Get string representation
	* @returns {string}
	*/
	toString() {
		return this.pattern;
	}
};

//#endregion
//#region ../../node_modules/.bun/path-expression-matcher@1.1.3/node_modules/path-expression-matcher/src/Matcher.js
/**
* Matcher - Tracks current path in XML/JSON tree and matches against Expressions
* 
* The matcher maintains a stack of nodes representing the current path from root to
* current tag. It only stores attribute values for the current (top) node to minimize
* memory usage. Sibling tracking is used to auto-calculate position and counter.
* 
* @example
* const matcher = new Matcher();
* matcher.push("root", {});
* matcher.push("users", {});
* matcher.push("user", { id: "123", type: "admin" });
* 
* const expr = new Expression("root.users.user");
* matcher.matches(expr); // true
*/
var Matcher = class {
	/**
	* Create a new Matcher
	* @param {Object} options - Configuration options
	* @param {string} options.separator - Default path separator (default: '.')
	*/
	constructor(options = {}) {
		this.separator = options.separator || ".";
		this.path = [];
		this.siblingStacks = [];
	}
	/**
	* Push a new tag onto the path
	* @param {string} tagName - Name of the tag
	* @param {Object} attrValues - Attribute key-value pairs for current node (optional)
	* @param {string} namespace - Namespace for the tag (optional)
	*/
	push(tagName, attrValues = null, namespace = null) {
		if (this.path.length > 0) {
			const prev = this.path[this.path.length - 1];
			prev.values = void 0;
		}
		const currentLevel = this.path.length;
		if (!this.siblingStacks[currentLevel]) this.siblingStacks[currentLevel] = /* @__PURE__ */ new Map();
		const siblings = this.siblingStacks[currentLevel];
		const siblingKey = namespace ? `${namespace}:${tagName}` : tagName;
		const counter = siblings.get(siblingKey) || 0;
		let position = 0;
		for (const count of siblings.values()) position += count;
		siblings.set(siblingKey, counter + 1);
		const node = {
			tag: tagName,
			position,
			counter
		};
		if (namespace !== null && namespace !== void 0) node.namespace = namespace;
		if (attrValues !== null && attrValues !== void 0) node.values = attrValues;
		this.path.push(node);
	}
	/**
	* Pop the last tag from the path
	* @returns {Object|undefined} The popped node
	*/
	pop() {
		if (this.path.length === 0) return;
		const node = this.path.pop();
		if (this.siblingStacks.length > this.path.length + 1) this.siblingStacks.length = this.path.length + 1;
		return node;
	}
	/**
	* Update current node's attribute values
	* Useful when attributes are parsed after push
	* @param {Object} attrValues - Attribute values
	*/
	updateCurrent(attrValues) {
		if (this.path.length > 0) {
			const current = this.path[this.path.length - 1];
			if (attrValues !== null && attrValues !== void 0) current.values = attrValues;
		}
	}
	/**
	* Get current tag name
	* @returns {string|undefined}
	*/
	getCurrentTag() {
		return this.path.length > 0 ? this.path[this.path.length - 1].tag : void 0;
	}
	/**
	* Get current namespace
	* @returns {string|undefined}
	*/
	getCurrentNamespace() {
		return this.path.length > 0 ? this.path[this.path.length - 1].namespace : void 0;
	}
	/**
	* Get current node's attribute value
	* @param {string} attrName - Attribute name
	* @returns {*} Attribute value or undefined
	*/
	getAttrValue(attrName) {
		if (this.path.length === 0) return void 0;
		return this.path[this.path.length - 1].values?.[attrName];
	}
	/**
	* Check if current node has an attribute
	* @param {string} attrName - Attribute name
	* @returns {boolean}
	*/
	hasAttr(attrName) {
		if (this.path.length === 0) return false;
		const current = this.path[this.path.length - 1];
		return current.values !== void 0 && attrName in current.values;
	}
	/**
	* Get current node's sibling position (child index in parent)
	* @returns {number}
	*/
	getPosition() {
		if (this.path.length === 0) return -1;
		return this.path[this.path.length - 1].position ?? 0;
	}
	/**
	* Get current node's repeat counter (occurrence count of this tag name)
	* @returns {number}
	*/
	getCounter() {
		if (this.path.length === 0) return -1;
		return this.path[this.path.length - 1].counter ?? 0;
	}
	/**
	* Get current node's sibling index (alias for getPosition for backward compatibility)
	* @returns {number}
	* @deprecated Use getPosition() or getCounter() instead
	*/
	getIndex() {
		return this.getPosition();
	}
	/**
	* Get current path depth
	* @returns {number}
	*/
	getDepth() {
		return this.path.length;
	}
	/**
	* Get path as string
	* @param {string} separator - Optional separator (uses default if not provided)
	* @param {boolean} includeNamespace - Whether to include namespace in output (default: true)
	* @returns {string}
	*/
	toString(separator, includeNamespace = true) {
		const sep = separator || this.separator;
		return this.path.map((n) => {
			if (includeNamespace && n.namespace) return `${n.namespace}:${n.tag}`;
			return n.tag;
		}).join(sep);
	}
	/**
	* Get path as array of tag names
	* @returns {string[]}
	*/
	toArray() {
		return this.path.map((n) => n.tag);
	}
	/**
	* Reset the path to empty
	*/
	reset() {
		this.path = [];
		this.siblingStacks = [];
	}
	/**
	* Match current path against an Expression
	* @param {Expression} expression - The expression to match against
	* @returns {boolean} True if current path matches the expression
	*/
	matches(expression) {
		const segments = expression.segments;
		if (segments.length === 0) return false;
		if (expression.hasDeepWildcard()) return this._matchWithDeepWildcard(segments);
		return this._matchSimple(segments);
	}
	/**
	* Match simple path (no deep wildcards)
	* @private
	*/
	_matchSimple(segments) {
		if (this.path.length !== segments.length) return false;
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const node = this.path[i];
			const isCurrentNode = i === this.path.length - 1;
			if (!this._matchSegment(segment, node, isCurrentNode)) return false;
		}
		return true;
	}
	/**
	* Match path with deep wildcards
	* @private
	*/
	_matchWithDeepWildcard(segments) {
		let pathIdx = this.path.length - 1;
		let segIdx = segments.length - 1;
		while (segIdx >= 0 && pathIdx >= 0) {
			const segment = segments[segIdx];
			if (segment.type === "deep-wildcard") {
				segIdx--;
				if (segIdx < 0) return true;
				const nextSeg = segments[segIdx];
				let found = false;
				for (let i = pathIdx; i >= 0; i--) {
					const isCurrentNode = i === this.path.length - 1;
					if (this._matchSegment(nextSeg, this.path[i], isCurrentNode)) {
						pathIdx = i - 1;
						segIdx--;
						found = true;
						break;
					}
				}
				if (!found) return false;
			} else {
				const isCurrentNode = pathIdx === this.path.length - 1;
				if (!this._matchSegment(segment, this.path[pathIdx], isCurrentNode)) return false;
				pathIdx--;
				segIdx--;
			}
		}
		return segIdx < 0;
	}
	/**
	* Match a single segment against a node
	* @private
	* @param {Object} segment - Segment from Expression
	* @param {Object} node - Node from path
	* @param {boolean} isCurrentNode - Whether this is the current (last) node
	* @returns {boolean}
	*/
	_matchSegment(segment, node, isCurrentNode) {
		if (segment.tag !== "*" && segment.tag !== node.tag) return false;
		if (segment.namespace !== void 0) {
			if (segment.namespace !== "*" && segment.namespace !== node.namespace) return false;
		}
		if (segment.attrName !== void 0) {
			if (!isCurrentNode) return false;
			if (!node.values || !(segment.attrName in node.values)) return false;
			if (segment.attrValue !== void 0) {
				const actualValue = node.values[segment.attrName];
				if (String(actualValue) !== String(segment.attrValue)) return false;
			}
		}
		if (segment.position !== void 0) {
			if (!isCurrentNode) return false;
			const counter = node.counter ?? 0;
			if (segment.position === "first" && counter !== 0) return false;
			else if (segment.position === "odd" && counter % 2 !== 1) return false;
			else if (segment.position === "even" && counter % 2 !== 0) return false;
			else if (segment.position === "nth") {
				if (counter !== segment.positionValue) return false;
			}
		}
		return true;
	}
	/**
	* Create a snapshot of current state
	* @returns {Object} State snapshot
	*/
	snapshot() {
		return {
			path: this.path.map((node) => ({ ...node })),
			siblingStacks: this.siblingStacks.map((map) => new Map(map))
		};
	}
	/**
	* Restore state from snapshot
	* @param {Object} snapshot - State snapshot
	*/
	restore(snapshot) {
		this.path = snapshot.path.map((node) => ({ ...node }));
		this.siblingStacks = snapshot.siblingStacks.map((map) => new Map(map));
	}
};

//#endregion
//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
/**
* Extract raw attributes (without prefix) from prefixed attribute map
* @param {object} prefixedAttrs - Attributes with prefix from buildAttributesMap
* @param {object} options - Parser options containing attributeNamePrefix
* @returns {object} Raw attributes for matcher
*/
function extractRawAttributes(prefixedAttrs, options) {
	if (!prefixedAttrs) return {};
	const attrs = options.attributesGroupName ? prefixedAttrs[options.attributesGroupName] : prefixedAttrs;
	if (!attrs) return {};
	const rawAttrs = {};
	for (const key in attrs) if (key.startsWith(options.attributeNamePrefix)) {
		const rawName = key.substring(options.attributeNamePrefix.length);
		rawAttrs[rawName] = attrs[key];
	} else rawAttrs[key] = attrs[key];
	return rawAttrs;
}
/**
* Extract namespace from raw tag name
* @param {string} rawTagName - Tag name possibly with namespace (e.g., "soap:Envelope")
* @returns {string|undefined} Namespace or undefined
*/
function extractNamespace(rawTagName) {
	if (!rawTagName || typeof rawTagName !== "string") return void 0;
	const colonIndex = rawTagName.indexOf(":");
	if (colonIndex !== -1 && colonIndex > 0) {
		const ns = rawTagName.substring(0, colonIndex);
		if (ns !== "xmlns") return ns;
	}
}
var OrderedObjParser = class {
	constructor(options) {
		this.options = options;
		this.currentNode = null;
		this.tagsNodeStack = [];
		this.docTypeEntities = {};
		this.lastEntities = {
			"apos": {
				regex: /&(apos|#39|#x27);/g,
				val: "'"
			},
			"gt": {
				regex: /&(gt|#62|#x3E);/g,
				val: ">"
			},
			"lt": {
				regex: /&(lt|#60|#x3C);/g,
				val: "<"
			},
			"quot": {
				regex: /&(quot|#34|#x22);/g,
				val: "\""
			}
		};
		this.ampEntity = {
			regex: /&(amp|#38|#x26);/g,
			val: "&"
		};
		this.htmlEntities = {
			"space": {
				regex: /&(nbsp|#160);/g,
				val: " "
			},
			"cent": {
				regex: /&(cent|#162);/g,
				val: "¢"
			},
			"pound": {
				regex: /&(pound|#163);/g,
				val: "£"
			},
			"yen": {
				regex: /&(yen|#165);/g,
				val: "¥"
			},
			"euro": {
				regex: /&(euro|#8364);/g,
				val: "€"
			},
			"copyright": {
				regex: /&(copy|#169);/g,
				val: "©"
			},
			"reg": {
				regex: /&(reg|#174);/g,
				val: "®"
			},
			"inr": {
				regex: /&(inr|#8377);/g,
				val: "₹"
			},
			"num_dec": {
				regex: /&#([0-9]{1,7});/g,
				val: (_, str) => fromCodePoint(str, 10, "&#")
			},
			"num_hex": {
				regex: /&#x([0-9a-fA-F]{1,6});/g,
				val: (_, str) => fromCodePoint(str, 16, "&#x")
			}
		};
		this.addExternalEntities = addExternalEntities;
		this.parseXml = parseXml;
		this.parseTextData = parseTextData;
		this.resolveNameSpace = resolveNameSpace;
		this.buildAttributesMap = buildAttributesMap;
		this.isItStopNode = isItStopNode;
		this.replaceEntitiesValue = replaceEntitiesValue;
		this.readStopNodeData = readStopNodeData;
		this.saveTextToParentTag = saveTextToParentTag;
		this.addChild = addChild;
		this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
		this.entityExpansionCount = 0;
		this.currentExpandedLength = 0;
		this.matcher = new Matcher();
		this.isCurrentNodeStopNode = false;
		if (this.options.stopNodes && this.options.stopNodes.length > 0) {
			this.stopNodeExpressions = [];
			for (let i = 0; i < this.options.stopNodes.length; i++) {
				const stopNodeExp = this.options.stopNodes[i];
				if (typeof stopNodeExp === "string") this.stopNodeExpressions.push(new Expression(stopNodeExp));
				else if (stopNodeExp instanceof Expression) this.stopNodeExpressions.push(stopNodeExp);
			}
		}
	}
};
function addExternalEntities(externalEntities) {
	const entKeys = Object.keys(externalEntities);
	for (let i = 0; i < entKeys.length; i++) {
		const ent = entKeys[i];
		const escaped = ent.replace(/[.\-+*:]/g, "\\.");
		this.lastEntities[ent] = {
			regex: new RegExp("&" + escaped + ";", "g"),
			val: externalEntities[ent]
		};
	}
}
/**
* @param {string} val
* @param {string} tagName
* @param {string|Matcher} jPath - jPath string or Matcher instance based on options.jPath
* @param {boolean} dontTrim
* @param {boolean} hasAttributes
* @param {boolean} isLeafNode
* @param {boolean} escapeEntities
*/
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
	if (val !== void 0) {
		if (this.options.trimValues && !dontTrim) val = val.trim();
		if (val.length > 0) {
			if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);
			const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
			const newval = this.options.tagValueProcessor(tagName, val, jPathOrMatcher, hasAttributes, isLeafNode);
			if (newval === null || newval === void 0) return val;
			else if (typeof newval !== typeof val || newval !== val) return newval;
			else if (this.options.trimValues) return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
			else if (val.trim() === val) return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
			else return val;
		}
	}
}
function resolveNameSpace(tagname) {
	if (this.options.removeNSPrefix) {
		const tags = tagname.split(":");
		const prefix = tagname.charAt(0) === "/" ? "/" : "";
		if (tags[0] === "xmlns") return "";
		if (tags.length === 2) tagname = prefix + tags[1];
	}
	return tagname;
}
const attrsRegx = new RegExp("([^\\s=]+)\\s*(=\\s*(['\"])([\\s\\S]*?)\\3)?", "gm");
function buildAttributesMap(attrStr, jPath, tagName) {
	if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
		const matches = getAllMatches(attrStr, attrsRegx);
		const len = matches.length;
		const attrs = {};
		const rawAttrsForMatcher = {};
		for (let i = 0; i < len; i++) {
			const attrName = this.resolveNameSpace(matches[i][1]);
			const oldVal = matches[i][4];
			if (attrName.length && oldVal !== void 0) {
				let parsedVal = oldVal;
				if (this.options.trimValues) parsedVal = parsedVal.trim();
				parsedVal = this.replaceEntitiesValue(parsedVal, tagName, jPath);
				rawAttrsForMatcher[attrName] = parsedVal;
			}
		}
		if (Object.keys(rawAttrsForMatcher).length > 0 && typeof jPath === "object" && jPath.updateCurrent) jPath.updateCurrent(rawAttrsForMatcher);
		for (let i = 0; i < len; i++) {
			const attrName = this.resolveNameSpace(matches[i][1]);
			const jPathStr = this.options.jPath ? jPath.toString() : jPath;
			if (this.ignoreAttributesFn(attrName, jPathStr)) continue;
			let oldVal = matches[i][4];
			let aName = this.options.attributeNamePrefix + attrName;
			if (attrName.length) {
				if (this.options.transformAttributeName) aName = this.options.transformAttributeName(aName);
				aName = sanitizeName(aName, this.options);
				if (oldVal !== void 0) {
					if (this.options.trimValues) oldVal = oldVal.trim();
					oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
					const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
					const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPathOrMatcher);
					if (newVal === null || newVal === void 0) attrs[aName] = oldVal;
					else if (typeof newVal !== typeof oldVal || newVal !== oldVal) attrs[aName] = newVal;
					else attrs[aName] = parseValue(oldVal, this.options.parseAttributeValue, this.options.numberParseOptions);
				} else if (this.options.allowBooleanAttributes) attrs[aName] = true;
			}
		}
		if (!Object.keys(attrs).length) return;
		if (this.options.attributesGroupName) {
			const attrCollection = {};
			attrCollection[this.options.attributesGroupName] = attrs;
			return attrCollection;
		}
		return attrs;
	}
}
const parseXml = function(xmlData) {
	xmlData = xmlData.replace(/\r\n?/g, "\n");
	const xmlObj = new XmlNode("!xml");
	let currentNode = xmlObj;
	let textData = "";
	this.matcher.reset();
	this.entityExpansionCount = 0;
	this.currentExpandedLength = 0;
	const docTypeReader = new DocTypeReader(this.options.processEntities);
	for (let i = 0; i < xmlData.length; i++) if (xmlData[i] === "<") if (xmlData[i + 1] === "/") {
		const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
		let tagName = xmlData.substring(i + 2, closeIndex).trim();
		if (this.options.removeNSPrefix) {
			const colonIndex = tagName.indexOf(":");
			if (colonIndex !== -1) tagName = tagName.substr(colonIndex + 1);
		}
		tagName = transformTagName(this.options.transformTagName, tagName, "", this.options).tagName;
		if (currentNode) textData = this.saveTextToParentTag(textData, currentNode, this.matcher);
		const lastTagName = this.matcher.getCurrentTag();
		if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
		if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
			this.matcher.pop();
			this.tagsNodeStack.pop();
		}
		this.matcher.pop();
		this.isCurrentNodeStopNode = false;
		currentNode = this.tagsNodeStack.pop();
		textData = "";
		i = closeIndex;
	} else if (xmlData[i + 1] === "?") {
		let tagData = readTagExp(xmlData, i, false, "?>");
		if (!tagData) throw new Error("Pi Tag is not closed.");
		textData = this.saveTextToParentTag(textData, currentNode, this.matcher);
		if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {} else {
			const childNode = new XmlNode(tagData.tagName);
			childNode.add(this.options.textNodeName, "");
			if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) childNode[":@"] = this.buildAttributesMap(tagData.tagExp, this.matcher, tagData.tagName);
			this.addChild(currentNode, childNode, this.matcher, i);
		}
		i = tagData.closeIndex + 1;
	} else if (xmlData.substr(i + 1, 3) === "!--") {
		const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
		if (this.options.commentPropName) {
			const comment = xmlData.substring(i + 4, endIndex - 2);
			textData = this.saveTextToParentTag(textData, currentNode, this.matcher);
			currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
		}
		i = endIndex;
	} else if (xmlData.substr(i + 1, 2) === "!D") {
		const result = docTypeReader.readDocType(xmlData, i);
		this.docTypeEntities = result.entities;
		i = result.i;
	} else if (xmlData.substr(i + 1, 2) === "![") {
		const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
		const tagExp = xmlData.substring(i + 9, closeIndex);
		textData = this.saveTextToParentTag(textData, currentNode, this.matcher);
		let val = this.parseTextData(tagExp, currentNode.tagname, this.matcher, true, false, true, true);
		if (val == void 0) val = "";
		if (this.options.cdataPropName) currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
		else currentNode.add(this.options.textNodeName, val);
		i = closeIndex + 2;
	} else {
		let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
		if (!result) {
			const context = xmlData.substring(Math.max(0, i - 50), Math.min(xmlData.length, i + 50));
			throw new Error(`readTagExp returned undefined at position ${i}. Context: "${context}"`);
		}
		let tagName = result.tagName;
		const rawTagName = result.rawTagName;
		let tagExp = result.tagExp;
		let attrExpPresent = result.attrExpPresent;
		let closeIndex = result.closeIndex;
		({tagName, tagExp} = transformTagName(this.options.transformTagName, tagName, tagExp, this.options));
		if (this.options.strictReservedNames && (tagName === this.options.commentPropName || tagName === this.options.cdataPropName)) throw new Error(`Invalid tag name: ${tagName}`);
		if (currentNode && textData) {
			if (currentNode.tagname !== "!xml") textData = this.saveTextToParentTag(textData, currentNode, this.matcher, false);
		}
		const lastTag = currentNode;
		if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
			currentNode = this.tagsNodeStack.pop();
			this.matcher.pop();
		}
		let isSelfClosing = false;
		if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
			isSelfClosing = true;
			if (tagName[tagName.length - 1] === "/") {
				tagName = tagName.substr(0, tagName.length - 1);
				tagExp = tagName;
			} else tagExp = tagExp.substr(0, tagExp.length - 1);
			attrExpPresent = tagName !== tagExp;
		}
		let prefixedAttrs = null;
		let namespace = void 0;
		namespace = extractNamespace(rawTagName);
		if (tagName !== xmlObj.tagname) this.matcher.push(tagName, {}, namespace);
		if (tagName !== tagExp && attrExpPresent) {
			prefixedAttrs = this.buildAttributesMap(tagExp, this.matcher, tagName);
			if (prefixedAttrs) extractRawAttributes(prefixedAttrs, this.options);
		}
		if (tagName !== xmlObj.tagname) this.isCurrentNodeStopNode = this.isItStopNode(this.stopNodeExpressions, this.matcher);
		const startIndex = i;
		if (this.isCurrentNodeStopNode) {
			let tagContent = "";
			if (isSelfClosing) i = result.closeIndex;
			else if (this.options.unpairedTags.indexOf(tagName) !== -1) i = result.closeIndex;
			else {
				const result$1 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
				if (!result$1) throw new Error(`Unexpected end of ${rawTagName}`);
				i = result$1.i;
				tagContent = result$1.tagContent;
			}
			const childNode = new XmlNode(tagName);
			if (prefixedAttrs) childNode[":@"] = prefixedAttrs;
			childNode.add(this.options.textNodeName, tagContent);
			this.matcher.pop();
			this.isCurrentNodeStopNode = false;
			this.addChild(currentNode, childNode, this.matcher, startIndex);
		} else {
			if (isSelfClosing) {
				({tagName, tagExp} = transformTagName(this.options.transformTagName, tagName, tagExp, this.options));
				const childNode = new XmlNode(tagName);
				if (prefixedAttrs) childNode[":@"] = prefixedAttrs;
				this.addChild(currentNode, childNode, this.matcher, startIndex);
				this.matcher.pop();
				this.isCurrentNodeStopNode = false;
			} else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
				const childNode = new XmlNode(tagName);
				if (prefixedAttrs) childNode[":@"] = prefixedAttrs;
				this.addChild(currentNode, childNode, this.matcher, startIndex);
				this.matcher.pop();
				this.isCurrentNodeStopNode = false;
				i = result.closeIndex;
				continue;
			} else {
				const childNode = new XmlNode(tagName);
				if (this.tagsNodeStack.length > this.options.maxNestedTags) throw new Error("Maximum nested tags exceeded");
				this.tagsNodeStack.push(currentNode);
				if (prefixedAttrs) childNode[":@"] = prefixedAttrs;
				this.addChild(currentNode, childNode, this.matcher, startIndex);
				currentNode = childNode;
			}
			textData = "";
			i = closeIndex;
		}
	}
	else textData += xmlData[i];
	return xmlObj.child;
};
function addChild(currentNode, childNode, matcher, startIndex) {
	if (!this.options.captureMetaData) startIndex = void 0;
	const jPathOrMatcher = this.options.jPath ? matcher.toString() : matcher;
	const result = this.options.updateTag(childNode.tagname, jPathOrMatcher, childNode[":@"]);
	if (result === false) {} else if (typeof result === "string") {
		childNode.tagname = result;
		currentNode.addChild(childNode, startIndex);
	} else currentNode.addChild(childNode, startIndex);
}
/**
* @param {object} val - Entity object with regex and val properties
* @param {string} tagName - Tag name
* @param {string|Matcher} jPath - jPath string or Matcher instance based on options.jPath
*/
function replaceEntitiesValue(val, tagName, jPath) {
	const entityConfig = this.options.processEntities;
	if (!entityConfig || !entityConfig.enabled) return val;
	if (entityConfig.allowedTags) {
		const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
		if (!(Array.isArray(entityConfig.allowedTags) ? entityConfig.allowedTags.includes(tagName) : entityConfig.allowedTags(tagName, jPathOrMatcher))) return val;
	}
	if (entityConfig.tagFilter) {
		const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
		if (!entityConfig.tagFilter(tagName, jPathOrMatcher)) return val;
	}
	for (const entityName of Object.keys(this.docTypeEntities)) {
		const entity = this.docTypeEntities[entityName];
		const matches = val.match(entity.regx);
		if (matches) {
			this.entityExpansionCount += matches.length;
			if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) throw new Error(`Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`);
			const lengthBefore = val.length;
			val = val.replace(entity.regx, entity.val);
			if (entityConfig.maxExpandedLength) {
				this.currentExpandedLength += val.length - lengthBefore;
				if (this.currentExpandedLength > entityConfig.maxExpandedLength) throw new Error(`Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`);
			}
		}
	}
	for (const entityName of Object.keys(this.lastEntities)) {
		const entity = this.lastEntities[entityName];
		const matches = val.match(entity.regex);
		if (matches) {
			this.entityExpansionCount += matches.length;
			if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) throw new Error(`Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`);
		}
		val = val.replace(entity.regex, entity.val);
	}
	if (val.indexOf("&") === -1) return val;
	if (this.options.htmlEntities) for (const entityName of Object.keys(this.htmlEntities)) {
		const entity = this.htmlEntities[entityName];
		const matches = val.match(entity.regex);
		if (matches) {
			this.entityExpansionCount += matches.length;
			if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) throw new Error(`Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`);
		}
		val = val.replace(entity.regex, entity.val);
	}
	val = val.replace(this.ampEntity.regex, this.ampEntity.val);
	return val;
}
function saveTextToParentTag(textData, parentNode, matcher, isLeafNode) {
	if (textData) {
		if (isLeafNode === void 0) isLeafNode = parentNode.child.length === 0;
		textData = this.parseTextData(textData, parentNode.tagname, matcher, false, parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false, isLeafNode);
		if (textData !== void 0 && textData !== "") parentNode.add(this.options.textNodeName, textData);
		textData = "";
	}
	return textData;
}
/**
* @param {Array<Expression>} stopNodeExpressions - Array of compiled Expression objects
* @param {Matcher} matcher - Current path matcher
*/
function isItStopNode(stopNodeExpressions, matcher) {
	if (!stopNodeExpressions || stopNodeExpressions.length === 0) return false;
	for (let i = 0; i < stopNodeExpressions.length; i++) if (matcher.matches(stopNodeExpressions[i])) return true;
	return false;
}
/**
* Returns the tag Expression and where it is ending handling single-double quotes situation
* @param {string} xmlData 
* @param {number} i starting index
* @returns 
*/
function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
	let attrBoundary;
	let tagExp = "";
	for (let index = i; index < xmlData.length; index++) {
		let ch = xmlData[index];
		if (attrBoundary) {
			if (ch === attrBoundary) attrBoundary = "";
		} else if (ch === "\"" || ch === "'") attrBoundary = ch;
		else if (ch === closingChar[0]) if (closingChar[1]) {
			if (xmlData[index + 1] === closingChar[1]) return {
				data: tagExp,
				index
			};
		} else return {
			data: tagExp,
			index
		};
		else if (ch === "	") ch = " ";
		tagExp += ch;
	}
}
function findClosingIndex(xmlData, str, i, errMsg) {
	const closingIndex = xmlData.indexOf(str, i);
	if (closingIndex === -1) throw new Error(errMsg);
	else return closingIndex + str.length - 1;
}
function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
	const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
	if (!result) return;
	let tagExp = result.data;
	const closeIndex = result.index;
	const separatorIndex = tagExp.search(/\s/);
	let tagName = tagExp;
	let attrExpPresent = true;
	if (separatorIndex !== -1) {
		tagName = tagExp.substring(0, separatorIndex);
		tagExp = tagExp.substring(separatorIndex + 1).trimStart();
	}
	const rawTagName = tagName;
	if (removeNSPrefix) {
		const colonIndex = tagName.indexOf(":");
		if (colonIndex !== -1) {
			tagName = tagName.substr(colonIndex + 1);
			attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
		}
	}
	return {
		tagName,
		tagExp,
		closeIndex,
		attrExpPresent,
		rawTagName
	};
}
/**
* find paired tag for a stop node
* @param {string} xmlData 
* @param {string} tagName 
* @param {number} i 
*/
function readStopNodeData(xmlData, tagName, i) {
	const startIndex = i;
	let openTagCount = 1;
	for (; i < xmlData.length; i++) if (xmlData[i] === "<") if (xmlData[i + 1] === "/") {
		const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
		if (xmlData.substring(i + 2, closeIndex).trim() === tagName) {
			openTagCount--;
			if (openTagCount === 0) return {
				tagContent: xmlData.substring(startIndex, i),
				i: closeIndex
			};
		}
		i = closeIndex;
	} else if (xmlData[i + 1] === "?") i = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
	else if (xmlData.substr(i + 1, 3) === "!--") i = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
	else if (xmlData.substr(i + 1, 2) === "![") i = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
	else {
		const tagData = readTagExp(xmlData, i, ">");
		if (tagData) {
			if ((tagData && tagData.tagName) === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") openTagCount++;
			i = tagData.closeIndex;
		}
	}
}
function parseValue(val, shouldParse, options) {
	if (shouldParse && typeof val === "string") {
		const newval = val.trim();
		if (newval === "true") return true;
		else if (newval === "false") return false;
		else return toNumber(val, options);
	} else if (isExist(val)) return val;
	else return "";
}
function fromCodePoint(str, base, prefix) {
	const codePoint = Number.parseInt(str, base);
	if (codePoint >= 0 && codePoint <= 1114111) return String.fromCodePoint(codePoint);
	else return prefix + str + ";";
}
function transformTagName(fn, tagName, tagExp, options) {
	if (fn) {
		const newTagName = fn(tagName);
		if (tagExp === tagName) tagExp = newTagName;
		tagName = newTagName;
	}
	tagName = sanitizeName(tagName, options);
	return {
		tagName,
		tagExp
	};
}
function sanitizeName(name, options) {
	if (criticalProperties.includes(name)) throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
	else if (DANGEROUS_PROPERTY_NAMES.includes(name)) return options.onDangerousProperty(name);
	return name;
}

//#endregion
//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/xmlparser/node2json.js
const METADATA_SYMBOL = XmlNode.getMetaDataSymbol();
/**
* Helper function to strip attribute prefix from attribute map
* @param {object} attrs - Attributes with prefix (e.g., {"@_class": "code"})
* @param {string} prefix - Attribute prefix to remove (e.g., "@_")
* @returns {object} Attributes without prefix (e.g., {"class": "code"})
*/
function stripAttributePrefix(attrs, prefix) {
	if (!attrs || typeof attrs !== "object") return {};
	if (!prefix) return attrs;
	const rawAttrs = {};
	for (const key in attrs) if (key.startsWith(prefix)) {
		const rawName = key.substring(prefix.length);
		rawAttrs[rawName] = attrs[key];
	} else rawAttrs[key] = attrs[key];
	return rawAttrs;
}
/**
* 
* @param {array} node 
* @param {any} options 
* @param {Matcher} matcher - Path matcher instance
* @returns 
*/
function prettify(node, options, matcher) {
	return compress(node, options, matcher);
}
/**
* 
* @param {array} arr 
* @param {object} options 
* @param {Matcher} matcher - Path matcher instance
* @returns object
*/
function compress(arr, options, matcher) {
	let text;
	const compressedObj = {};
	for (let i = 0; i < arr.length; i++) {
		const tagObj = arr[i];
		const property = propName(tagObj);
		if (property !== void 0 && property !== options.textNodeName) {
			const rawAttrs = stripAttributePrefix(tagObj[":@"] || {}, options.attributeNamePrefix);
			matcher.push(property, rawAttrs);
		}
		if (property === options.textNodeName) if (text === void 0) text = tagObj[property];
		else text += "" + tagObj[property];
		else if (property === void 0) continue;
		else if (tagObj[property]) {
			let val = compress(tagObj[property], options, matcher);
			const isLeaf = isLeafTag(val, options);
			if (tagObj[":@"]) assignAttributes(val, tagObj[":@"], matcher, options);
			else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) val = val[options.textNodeName];
			else if (Object.keys(val).length === 0) if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
			else val = "";
			if (tagObj[METADATA_SYMBOL] !== void 0 && typeof val === "object" && val !== null) val[METADATA_SYMBOL] = tagObj[METADATA_SYMBOL];
			if (compressedObj[property] !== void 0 && Object.prototype.hasOwnProperty.call(compressedObj, property)) {
				if (!Array.isArray(compressedObj[property])) compressedObj[property] = [compressedObj[property]];
				compressedObj[property].push(val);
			} else {
				const jPathOrMatcher = options.jPath ? matcher.toString() : matcher;
				if (options.isArray(property, jPathOrMatcher, isLeaf)) compressedObj[property] = [val];
				else compressedObj[property] = val;
			}
			if (property !== void 0 && property !== options.textNodeName) matcher.pop();
		}
	}
	if (typeof text === "string") {
		if (text.length > 0) compressedObj[options.textNodeName] = text;
	} else if (text !== void 0) compressedObj[options.textNodeName] = text;
	return compressedObj;
}
function propName(obj) {
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (key !== ":@") return key;
	}
}
function assignAttributes(obj, attrMap, matcher, options) {
	if (attrMap) {
		const keys = Object.keys(attrMap);
		const len = keys.length;
		for (let i = 0; i < len; i++) {
			const atrrName = keys[i];
			const rawAttrName = atrrName.startsWith(options.attributeNamePrefix) ? atrrName.substring(options.attributeNamePrefix.length) : atrrName;
			const jPathOrMatcher = options.jPath ? matcher.toString() + "." + rawAttrName : matcher;
			if (options.isArray(atrrName, jPathOrMatcher, true, true)) obj[atrrName] = [attrMap[atrrName]];
			else obj[atrrName] = attrMap[atrrName];
		}
	}
}
function isLeafTag(obj, options) {
	const { textNodeName } = options;
	const propCount = Object.keys(obj).length;
	if (propCount === 0) return true;
	if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) return true;
	return false;
}

//#endregion
//#region ../../node_modules/.bun/fast-xml-parser@5.5.6/node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var XMLParser = class {
	constructor(options) {
		this.externalEntities = {};
		this.options = buildOptions(options);
	}
	/**
	* Parse XML dats to JS object 
	* @param {string|Uint8Array} xmlData 
	* @param {boolean|Object} validationOption 
	*/
	parse(xmlData, validationOption) {
		if (typeof xmlData !== "string" && xmlData.toString) xmlData = xmlData.toString();
		else if (typeof xmlData !== "string") throw new Error("XML data is accepted in String or Bytes[] form.");
		if (validationOption) {
			if (validationOption === true) validationOption = {};
			const result = validate(xmlData, validationOption);
			if (result !== true) throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
		}
		const orderedObjParser = new OrderedObjParser(this.options);
		orderedObjParser.addExternalEntities(this.externalEntities);
		const orderedResult = orderedObjParser.parseXml(xmlData);
		if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
		else return prettify(orderedResult, this.options, orderedObjParser.matcher);
	}
	/**
	* Add Entity which is not by default supported by this library
	* @param {string} key 
	* @param {string} value 
	*/
	addEntity(key, value) {
		if (value.indexOf("&") !== -1) throw new Error("Entity value can't have '&'");
		else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
		else if (value === "&") throw new Error("An entity with value '&' is not permitted");
		else this.externalEntities[key] = value;
	}
	/**
	* Returns a Symbol that can be used to access the metadata
	* property on a node.
	* 
	* If Symbol is not available in the environment, an ordinary property is used
	* and the name of the property is here returned.
	* 
	* The XMLMetaData property is only present when `captureMetaData`
	* is true in the options.
	*/
	static getMetaDataSymbol() {
		return XmlNode.getMetaDataSymbol();
	}
};

//#endregion
export { XMLParser as t };