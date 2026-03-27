
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __path_dirname } from 'node:path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path_dirname(__filename);

import { i as __require, t as __commonJSMin } from "./chunk-DduSDN3j.mjs";

//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/can-promise.js
var require_can_promise = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function() {
		return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	let toSJISFunction;
	const CODEWORDS_COUNT = [
		0,
		26,
		44,
		70,
		100,
		134,
		172,
		196,
		242,
		292,
		346,
		404,
		466,
		532,
		581,
		655,
		733,
		815,
		901,
		991,
		1085,
		1156,
		1258,
		1364,
		1474,
		1588,
		1706,
		1828,
		1921,
		2051,
		2185,
		2323,
		2465,
		2611,
		2761,
		2876,
		3034,
		3196,
		3362,
		3532,
		3706
	];
	/**
	* Returns the QR Code size for the specified version
	*
	* @param  {Number} version QR Code version
	* @return {Number}         size of QR code
	*/
	exports.getSymbolSize = function getSymbolSize$2(version) {
		if (!version) throw new Error("\"version\" cannot be null or undefined");
		if (version < 1 || version > 40) throw new Error("\"version\" should be in range from 1 to 40");
		return version * 4 + 17;
	};
	/**
	* Returns the total number of codewords used to store data and EC information.
	*
	* @param  {Number} version QR Code version
	* @return {Number}         Data length in bits
	*/
	exports.getSymbolTotalCodewords = function getSymbolTotalCodewords(version) {
		return CODEWORDS_COUNT[version];
	};
	/**
	* Encode data with Bose-Chaudhuri-Hocquenghem
	*
	* @param  {Number} data Value to encode
	* @return {Number}      Encoded value
	*/
	exports.getBCHDigit = function(data) {
		let digit = 0;
		while (data !== 0) {
			digit++;
			data >>>= 1;
		}
		return digit;
	};
	exports.setToSJISFunction = function setToSJISFunction(f) {
		if (typeof f !== "function") throw new Error("\"toSJISFunc\" is not a valid function.");
		toSJISFunction = f;
	};
	exports.isKanjiModeEnabled = function() {
		return typeof toSJISFunction !== "undefined";
	};
	exports.toSJIS = function toSJIS(kanji$1) {
		return toSJISFunction(kanji$1);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.L = { bit: 1 };
	exports.M = { bit: 0 };
	exports.Q = { bit: 3 };
	exports.H = { bit: 2 };
	function fromString$1(string) {
		if (typeof string !== "string") throw new Error("Param is not a string");
		switch (string.toLowerCase()) {
			case "l":
			case "low": return exports.L;
			case "m":
			case "medium": return exports.M;
			case "q":
			case "quartile": return exports.Q;
			case "h":
			case "high": return exports.H;
			default: throw new Error("Unknown EC Level: " + string);
		}
	}
	exports.isValid = function isValid(level) {
		return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
	};
	exports.from = function from(value, defaultValue) {
		if (exports.isValid(value)) return value;
		try {
			return fromString$1(value);
		} catch (e) {
			return defaultValue;
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function BitBuffer$1() {
		this.buffer = [];
		this.length = 0;
	}
	BitBuffer$1.prototype = {
		get: function(index) {
			const bufIndex = Math.floor(index / 8);
			return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
		},
		put: function(num, length) {
			for (let i = 0; i < length; i++) this.putBit((num >>> length - i - 1 & 1) === 1);
		},
		getLengthInBits: function() {
			return this.length;
		},
		putBit: function(bit) {
			const bufIndex = Math.floor(this.length / 8);
			if (this.buffer.length <= bufIndex) this.buffer.push(0);
			if (bit) this.buffer[bufIndex] |= 128 >>> this.length % 8;
			this.length++;
		}
	};
	module.exports = BitBuffer$1;
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helper class to handle QR Code symbol modules
	*
	* @param {Number} size Symbol size
	*/
	function BitMatrix$1(size) {
		if (!size || size < 1) throw new Error("BitMatrix size must be defined and greater than 0");
		this.size = size;
		this.data = new Uint8Array(size * size);
		this.reservedBit = new Uint8Array(size * size);
	}
	/**
	* Set bit value at specified location
	* If reserved flag is set, this bit will be ignored during masking process
	*
	* @param {Number}  row
	* @param {Number}  col
	* @param {Boolean} value
	* @param {Boolean} reserved
	*/
	BitMatrix$1.prototype.set = function(row, col, value, reserved) {
		const index = row * this.size + col;
		this.data[index] = value;
		if (reserved) this.reservedBit[index] = true;
	};
	/**
	* Returns bit value at specified location
	*
	* @param  {Number}  row
	* @param  {Number}  col
	* @return {Boolean}
	*/
	BitMatrix$1.prototype.get = function(row, col) {
		return this.data[row * this.size + col];
	};
	/**
	* Applies xor operator at specified location
	* (used during masking process)
	*
	* @param {Number}  row
	* @param {Number}  col
	* @param {Boolean} value
	*/
	BitMatrix$1.prototype.xor = function(row, col, value) {
		this.data[row * this.size + col] ^= value;
	};
	/**
	* Check if bit at specified location is reserved
	*
	* @param {Number}   row
	* @param {Number}   col
	* @return {Boolean}
	*/
	BitMatrix$1.prototype.isReserved = function(row, col) {
		return this.reservedBit[row * this.size + col];
	};
	module.exports = BitMatrix$1;
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Alignment pattern are fixed reference pattern in defined positions
	* in a matrix symbology, which enables the decode software to re-synchronise
	* the coordinate mapping of the image modules in the event of moderate amounts
	* of distortion of the image.
	*
	* Alignment patterns are present only in QR Code symbols of version 2 or larger
	* and their number depends on the symbol version.
	*/
	const getSymbolSize$1 = require_utils$1().getSymbolSize;
	/**
	* Calculate the row/column coordinates of the center module of each alignment pattern
	* for the specified QR Code version.
	*
	* The alignment patterns are positioned symmetrically on either side of the diagonal
	* running from the top left corner of the symbol to the bottom right corner.
	*
	* Since positions are simmetrical only half of the coordinates are returned.
	* Each item of the array will represent in turn the x and y coordinate.
	* @see {@link getPositions}
	*
	* @param  {Number} version QR Code version
	* @return {Array}          Array of coordinate
	*/
	exports.getRowColCoords = function getRowColCoords(version) {
		if (version === 1) return [];
		const posCount = Math.floor(version / 7) + 2;
		const size = getSymbolSize$1(version);
		const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
		const positions = [size - 7];
		for (let i = 1; i < posCount - 1; i++) positions[i] = positions[i - 1] - intervals;
		positions.push(6);
		return positions.reverse();
	};
	/**
	* Returns an array containing the positions of each alignment pattern.
	* Each array's element represent the center point of the pattern as (x, y) coordinates
	*
	* Coordinates are calculated expanding the row/column coordinates returned by {@link getRowColCoords}
	* and filtering out the items that overlaps with finder pattern
	*
	* @example
	* For a Version 7 symbol {@link getRowColCoords} returns values 6, 22 and 38.
	* The alignment patterns, therefore, are to be centered on (row, column)
	* positions (6,22), (22,6), (22,22), (22,38), (38,22), (38,38).
	* Note that the coordinates (6,6), (6,38), (38,6) are occupied by finder patterns
	* and are not therefore used for alignment patterns.
	*
	* let pos = getPositions(7)
	* // [[6,22], [22,6], [22,22], [22,38], [38,22], [38,38]]
	*
	* @param  {Number} version QR Code version
	* @return {Array}          Array of coordinates
	*/
	exports.getPositions = function getPositions(version) {
		const coords = [];
		const pos = exports.getRowColCoords(version);
		const posLength = pos.length;
		for (let i = 0; i < posLength; i++) for (let j = 0; j < posLength; j++) {
			if (i === 0 && j === 0 || i === 0 && j === posLength - 1 || i === posLength - 1 && j === 0) continue;
			coords.push([pos[i], pos[j]]);
		}
		return coords;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = /* @__PURE__ */ __commonJSMin(((exports) => {
	const getSymbolSize = require_utils$1().getSymbolSize;
	const FINDER_PATTERN_SIZE = 7;
	/**
	* Returns an array containing the positions of each finder pattern.
	* Each array's element represent the top-left point of the pattern as (x, y) coordinates
	*
	* @param  {Number} version QR Code version
	* @return {Array}          Array of coordinates
	*/
	exports.getPositions = function getPositions(version) {
		const size = getSymbolSize(version);
		return [
			[0, 0],
			[size - FINDER_PATTERN_SIZE, 0],
			[0, size - FINDER_PATTERN_SIZE]
		];
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Data mask pattern reference
	* @type {Object}
	*/
	exports.Patterns = {
		PATTERN000: 0,
		PATTERN001: 1,
		PATTERN010: 2,
		PATTERN011: 3,
		PATTERN100: 4,
		PATTERN101: 5,
		PATTERN110: 6,
		PATTERN111: 7
	};
	/**
	* Weighted penalty scores for the undesirable features
	* @type {Object}
	*/
	const PenaltyScores = {
		N1: 3,
		N2: 3,
		N3: 40,
		N4: 10
	};
	/**
	* Check if mask pattern value is valid
	*
	* @param  {Number}  mask    Mask pattern
	* @return {Boolean}         true if valid, false otherwise
	*/
	exports.isValid = function isValid(mask) {
		return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
	};
	/**
	* Returns mask pattern from a value.
	* If value is not valid, returns undefined
	*
	* @param  {Number|String} value        Mask pattern value
	* @return {Number}                     Valid mask pattern or undefined
	*/
	exports.from = function from(value) {
		return exports.isValid(value) ? parseInt(value, 10) : void 0;
	};
	/**
	* Find adjacent modules in row/column with the same color
	* and assign a penalty value.
	*
	* Points: N1 + i
	* i is the amount by which the number of adjacent modules of the same color exceeds 5
	*/
	exports.getPenaltyN1 = function getPenaltyN1(data) {
		const size = data.size;
		let points = 0;
		let sameCountCol = 0;
		let sameCountRow = 0;
		let lastCol = null;
		let lastRow = null;
		for (let row = 0; row < size; row++) {
			sameCountCol = sameCountRow = 0;
			lastCol = lastRow = null;
			for (let col = 0; col < size; col++) {
				let module$1 = data.get(row, col);
				if (module$1 === lastCol) sameCountCol++;
				else {
					if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
					lastCol = module$1;
					sameCountCol = 1;
				}
				module$1 = data.get(col, row);
				if (module$1 === lastRow) sameCountRow++;
				else {
					if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
					lastRow = module$1;
					sameCountRow = 1;
				}
			}
			if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
			if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
		}
		return points;
	};
	/**
	* Find 2x2 blocks with the same color and assign a penalty value
	*
	* Points: N2 * (m - 1) * (n - 1)
	*/
	exports.getPenaltyN2 = function getPenaltyN2(data) {
		const size = data.size;
		let points = 0;
		for (let row = 0; row < size - 1; row++) for (let col = 0; col < size - 1; col++) {
			const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
			if (last === 4 || last === 0) points++;
		}
		return points * PenaltyScores.N2;
	};
	/**
	* Find 1:1:3:1:1 ratio (dark:light:dark:light:dark) pattern in row/column,
	* preceded or followed by light area 4 modules wide
	*
	* Points: N3 * number of pattern found
	*/
	exports.getPenaltyN3 = function getPenaltyN3(data) {
		const size = data.size;
		let points = 0;
		let bitsCol = 0;
		let bitsRow = 0;
		for (let row = 0; row < size; row++) {
			bitsCol = bitsRow = 0;
			for (let col = 0; col < size; col++) {
				bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
				if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
				bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
				if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
			}
		}
		return points * PenaltyScores.N3;
	};
	/**
	* Calculate proportion of dark modules in entire symbol
	*
	* Points: N4 * k
	*
	* k is the rating of the deviation of the proportion of dark modules
	* in the symbol from 50% in steps of 5%
	*/
	exports.getPenaltyN4 = function getPenaltyN4(data) {
		let darkCount = 0;
		const modulesCount = data.data.length;
		for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
		return Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10) * PenaltyScores.N4;
	};
	/**
	* Return mask value at given position
	*
	* @param  {Number} maskPattern Pattern reference value
	* @param  {Number} i           Row
	* @param  {Number} j           Column
	* @return {Boolean}            Mask value
	*/
	function getMaskAt(maskPattern, i, j) {
		switch (maskPattern) {
			case exports.Patterns.PATTERN000: return (i + j) % 2 === 0;
			case exports.Patterns.PATTERN001: return i % 2 === 0;
			case exports.Patterns.PATTERN010: return j % 3 === 0;
			case exports.Patterns.PATTERN011: return (i + j) % 3 === 0;
			case exports.Patterns.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
			case exports.Patterns.PATTERN101: return i * j % 2 + i * j % 3 === 0;
			case exports.Patterns.PATTERN110: return (i * j % 2 + i * j % 3) % 2 === 0;
			case exports.Patterns.PATTERN111: return (i * j % 3 + (i + j) % 2) % 2 === 0;
			default: throw new Error("bad maskPattern:" + maskPattern);
		}
	}
	/**
	* Apply a mask pattern to a BitMatrix
	*
	* @param  {Number}    pattern Pattern reference number
	* @param  {BitMatrix} data    BitMatrix data
	*/
	exports.applyMask = function applyMask(pattern, data) {
		const size = data.size;
		for (let col = 0; col < size; col++) for (let row = 0; row < size; row++) {
			if (data.isReserved(row, col)) continue;
			data.xor(row, col, getMaskAt(pattern, row, col));
		}
	};
	/**
	* Returns the best mask pattern for data
	*
	* @param  {BitMatrix} data
	* @return {Number} Mask pattern reference number
	*/
	exports.getBestMask = function getBestMask(data, setupFormatFunc) {
		const numPatterns = Object.keys(exports.Patterns).length;
		let bestPattern = 0;
		let lowerPenalty = Infinity;
		for (let p = 0; p < numPatterns; p++) {
			setupFormatFunc(p);
			exports.applyMask(p, data);
			const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
			exports.applyMask(p, data);
			if (penalty < lowerPenalty) {
				lowerPenalty = penalty;
				bestPattern = p;
			}
		}
		return bestPattern;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = /* @__PURE__ */ __commonJSMin(((exports) => {
	const ECLevel$2 = require_error_correction_level();
	const EC_BLOCKS_TABLE = [
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		2,
		2,
		1,
		2,
		2,
		4,
		1,
		2,
		4,
		4,
		2,
		4,
		4,
		4,
		2,
		4,
		6,
		5,
		2,
		4,
		6,
		6,
		2,
		5,
		8,
		8,
		4,
		5,
		8,
		8,
		4,
		5,
		8,
		11,
		4,
		8,
		10,
		11,
		4,
		9,
		12,
		16,
		4,
		9,
		16,
		16,
		6,
		10,
		12,
		18,
		6,
		10,
		17,
		16,
		6,
		11,
		16,
		19,
		6,
		13,
		18,
		21,
		7,
		14,
		21,
		25,
		8,
		16,
		20,
		25,
		8,
		17,
		23,
		25,
		9,
		17,
		23,
		34,
		9,
		18,
		25,
		30,
		10,
		20,
		27,
		32,
		12,
		21,
		29,
		35,
		12,
		23,
		34,
		37,
		12,
		25,
		34,
		40,
		13,
		26,
		35,
		42,
		14,
		28,
		38,
		45,
		15,
		29,
		40,
		48,
		16,
		31,
		43,
		51,
		17,
		33,
		45,
		54,
		18,
		35,
		48,
		57,
		19,
		37,
		51,
		60,
		19,
		38,
		53,
		63,
		20,
		40,
		56,
		66,
		21,
		43,
		59,
		70,
		22,
		45,
		62,
		74,
		24,
		47,
		65,
		77,
		25,
		49,
		68,
		81
	];
	const EC_CODEWORDS_TABLE = [
		7,
		10,
		13,
		17,
		10,
		16,
		22,
		28,
		15,
		26,
		36,
		44,
		20,
		36,
		52,
		64,
		26,
		48,
		72,
		88,
		36,
		64,
		96,
		112,
		40,
		72,
		108,
		130,
		48,
		88,
		132,
		156,
		60,
		110,
		160,
		192,
		72,
		130,
		192,
		224,
		80,
		150,
		224,
		264,
		96,
		176,
		260,
		308,
		104,
		198,
		288,
		352,
		120,
		216,
		320,
		384,
		132,
		240,
		360,
		432,
		144,
		280,
		408,
		480,
		168,
		308,
		448,
		532,
		180,
		338,
		504,
		588,
		196,
		364,
		546,
		650,
		224,
		416,
		600,
		700,
		224,
		442,
		644,
		750,
		252,
		476,
		690,
		816,
		270,
		504,
		750,
		900,
		300,
		560,
		810,
		960,
		312,
		588,
		870,
		1050,
		336,
		644,
		952,
		1110,
		360,
		700,
		1020,
		1200,
		390,
		728,
		1050,
		1260,
		420,
		784,
		1140,
		1350,
		450,
		812,
		1200,
		1440,
		480,
		868,
		1290,
		1530,
		510,
		924,
		1350,
		1620,
		540,
		980,
		1440,
		1710,
		570,
		1036,
		1530,
		1800,
		570,
		1064,
		1590,
		1890,
		600,
		1120,
		1680,
		1980,
		630,
		1204,
		1770,
		2100,
		660,
		1260,
		1860,
		2220,
		720,
		1316,
		1950,
		2310,
		750,
		1372,
		2040,
		2430
	];
	/**
	* Returns the number of error correction block that the QR Code should contain
	* for the specified version and error correction level.
	*
	* @param  {Number} version              QR Code version
	* @param  {Number} errorCorrectionLevel Error correction level
	* @return {Number}                      Number of error correction blocks
	*/
	exports.getBlocksCount = function getBlocksCount(version, errorCorrectionLevel) {
		switch (errorCorrectionLevel) {
			case ECLevel$2.L: return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
			case ECLevel$2.M: return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
			case ECLevel$2.Q: return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
			case ECLevel$2.H: return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
			default: return;
		}
	};
	/**
	* Returns the number of error correction codewords to use for the specified
	* version and error correction level.
	*
	* @param  {Number} version              QR Code version
	* @param  {Number} errorCorrectionLevel Error correction level
	* @return {Number}                      Number of error correction codewords
	*/
	exports.getTotalCodewordsCount = function getTotalCodewordsCount(version, errorCorrectionLevel) {
		switch (errorCorrectionLevel) {
			case ECLevel$2.L: return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
			case ECLevel$2.M: return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
			case ECLevel$2.Q: return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
			case ECLevel$2.H: return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
			default: return;
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = /* @__PURE__ */ __commonJSMin(((exports) => {
	const EXP_TABLE = new Uint8Array(512);
	const LOG_TABLE = new Uint8Array(256);
	(function initTables() {
		let x = 1;
		for (let i = 0; i < 255; i++) {
			EXP_TABLE[i] = x;
			LOG_TABLE[x] = i;
			x <<= 1;
			if (x & 256) x ^= 285;
		}
		for (let i = 255; i < 512; i++) EXP_TABLE[i] = EXP_TABLE[i - 255];
	})();
	/**
	* Returns log value of n inside Galois Field
	*
	* @param  {Number} n
	* @return {Number}
	*/
	exports.log = function log(n) {
		if (n < 1) throw new Error("log(" + n + ")");
		return LOG_TABLE[n];
	};
	/**
	* Returns anti-log value of n inside Galois Field
	*
	* @param  {Number} n
	* @return {Number}
	*/
	exports.exp = function exp(n) {
		return EXP_TABLE[n];
	};
	/**
	* Multiplies two number inside Galois Field
	*
	* @param  {Number} x
	* @param  {Number} y
	* @return {Number}
	*/
	exports.mul = function mul(x, y) {
		if (x === 0 || y === 0) return 0;
		return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = /* @__PURE__ */ __commonJSMin(((exports) => {
	const GF = require_galois_field();
	/**
	* Multiplies two polynomials inside Galois Field
	*
	* @param  {Uint8Array} p1 Polynomial
	* @param  {Uint8Array} p2 Polynomial
	* @return {Uint8Array}    Product of p1 and p2
	*/
	exports.mul = function mul(p1, p2) {
		const coeff = new Uint8Array(p1.length + p2.length - 1);
		for (let i = 0; i < p1.length; i++) for (let j = 0; j < p2.length; j++) coeff[i + j] ^= GF.mul(p1[i], p2[j]);
		return coeff;
	};
	/**
	* Calculate the remainder of polynomials division
	*
	* @param  {Uint8Array} divident Polynomial
	* @param  {Uint8Array} divisor  Polynomial
	* @return {Uint8Array}          Remainder
	*/
	exports.mod = function mod(divident, divisor) {
		let result = new Uint8Array(divident);
		while (result.length - divisor.length >= 0) {
			const coeff = result[0];
			for (let i = 0; i < divisor.length; i++) result[i] ^= GF.mul(divisor[i], coeff);
			let offset = 0;
			while (offset < result.length && result[offset] === 0) offset++;
			result = result.slice(offset);
		}
		return result;
	};
	/**
	* Generate an irreducible generator polynomial of specified degree
	* (used by Reed-Solomon encoder)
	*
	* @param  {Number} degree Degree of the generator polynomial
	* @return {Uint8Array}    Buffer containing polynomial coefficients
	*/
	exports.generateECPolynomial = function generateECPolynomial(degree) {
		let poly = new Uint8Array([1]);
		for (let i = 0; i < degree; i++) poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
		return poly;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Polynomial = require_polynomial();
	function ReedSolomonEncoder$1(degree) {
		this.genPoly = void 0;
		this.degree = degree;
		if (this.degree) this.initialize(this.degree);
	}
	/**
	* Initialize the encoder.
	* The input param should correspond to the number of error correction codewords.
	*
	* @param  {Number} degree
	*/
	ReedSolomonEncoder$1.prototype.initialize = function initialize(degree) {
		this.degree = degree;
		this.genPoly = Polynomial.generateECPolynomial(this.degree);
	};
	/**
	* Encodes a chunk of data
	*
	* @param  {Uint8Array} data Buffer containing input data
	* @return {Uint8Array}      Buffer containing encoded data
	*/
	ReedSolomonEncoder$1.prototype.encode = function encode(data) {
		if (!this.genPoly) throw new Error("Encoder not initialized");
		const paddedData = new Uint8Array(data.length + this.degree);
		paddedData.set(data);
		const remainder = Polynomial.mod(paddedData, this.genPoly);
		const start = this.degree - remainder.length;
		if (start > 0) {
			const buff = new Uint8Array(this.degree);
			buff.set(remainder, start);
			return buff;
		}
		return remainder;
	};
	module.exports = ReedSolomonEncoder$1;
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/version-check.js
var require_version_check = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Check if QR Code version is valid
	*
	* @param  {Number}  version QR Code version
	* @return {Boolean}         true if valid version, false otherwise
	*/
	exports.isValid = function isValid(version) {
		return !isNaN(version) && version >= 1 && version <= 40;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/regex.js
var require_regex = /* @__PURE__ */ __commonJSMin(((exports) => {
	const numeric = "[0-9]+";
	const alphanumeric = "[A-Z $%*+\\-./:]+";
	let kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
	kanji = kanji.replace(/u/g, "\\u");
	const byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
	exports.KANJI = new RegExp(kanji, "g");
	exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
	exports.BYTE = new RegExp(byte, "g");
	exports.NUMERIC = new RegExp(numeric, "g");
	exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
	const TEST_KANJI = /* @__PURE__ */ new RegExp("^" + kanji + "$");
	const TEST_NUMERIC = /* @__PURE__ */ new RegExp("^" + numeric + "$");
	const TEST_ALPHANUMERIC = /* @__PURE__ */ new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
	exports.testKanji = function testKanji(str) {
		return TEST_KANJI.test(str);
	};
	exports.testNumeric = function testNumeric(str) {
		return TEST_NUMERIC.test(str);
	};
	exports.testAlphanumeric = function testAlphanumeric(str) {
		return TEST_ALPHANUMERIC.test(str);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/mode.js
var require_mode = /* @__PURE__ */ __commonJSMin(((exports) => {
	const VersionCheck$1 = require_version_check();
	const Regex$1 = require_regex();
	/**
	* Numeric mode encodes data from the decimal digit set (0 - 9)
	* (byte values 30HEX to 39HEX).
	* Normally, 3 data characters are represented by 10 bits.
	*
	* @type {Object}
	*/
	exports.NUMERIC = {
		id: "Numeric",
		bit: 1,
		ccBits: [
			10,
			12,
			14
		]
	};
	/**
	* Alphanumeric mode encodes data from a set of 45 characters,
	* i.e. 10 numeric digits (0 - 9),
	*      26 alphabetic characters (A - Z),
	*   and 9 symbols (SP, $, %, *, +, -, ., /, :).
	* Normally, two input characters are represented by 11 bits.
	*
	* @type {Object}
	*/
	exports.ALPHANUMERIC = {
		id: "Alphanumeric",
		bit: 2,
		ccBits: [
			9,
			11,
			13
		]
	};
	/**
	* In byte mode, data is encoded at 8 bits per character.
	*
	* @type {Object}
	*/
	exports.BYTE = {
		id: "Byte",
		bit: 4,
		ccBits: [
			8,
			16,
			16
		]
	};
	/**
	* The Kanji mode efficiently encodes Kanji characters in accordance with
	* the Shift JIS system based on JIS X 0208.
	* The Shift JIS values are shifted from the JIS X 0208 values.
	* JIS X 0208 gives details of the shift coded representation.
	* Each two-byte character value is compacted to a 13-bit binary codeword.
	*
	* @type {Object}
	*/
	exports.KANJI = {
		id: "Kanji",
		bit: 8,
		ccBits: [
			8,
			10,
			12
		]
	};
	/**
	* Mixed mode will contain a sequences of data in a combination of any of
	* the modes described above
	*
	* @type {Object}
	*/
	exports.MIXED = { bit: -1 };
	/**
	* Returns the number of bits needed to store the data length
	* according to QR Code specifications.
	*
	* @param  {Mode}   mode    Data mode
	* @param  {Number} version QR Code version
	* @return {Number}         Number of bits
	*/
	exports.getCharCountIndicator = function getCharCountIndicator(mode, version) {
		if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
		if (!VersionCheck$1.isValid(version)) throw new Error("Invalid version: " + version);
		if (version >= 1 && version < 10) return mode.ccBits[0];
		else if (version < 27) return mode.ccBits[1];
		return mode.ccBits[2];
	};
	/**
	* Returns the most efficient mode to store the specified data
	*
	* @param  {String} dataStr Input data string
	* @return {Mode}           Best mode
	*/
	exports.getBestModeForData = function getBestModeForData(dataStr) {
		if (Regex$1.testNumeric(dataStr)) return exports.NUMERIC;
		else if (Regex$1.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC;
		else if (Regex$1.testKanji(dataStr)) return exports.KANJI;
		else return exports.BYTE;
	};
	/**
	* Return mode name as string
	*
	* @param {Mode} mode Mode object
	* @returns {String}  Mode name
	*/
	exports.toString = function toString(mode) {
		if (mode && mode.id) return mode.id;
		throw new Error("Invalid mode");
	};
	/**
	* Check if input param is a valid mode object
	*
	* @param   {Mode}    mode Mode object
	* @returns {Boolean} True if valid mode, false otherwise
	*/
	exports.isValid = function isValid(mode) {
		return mode && mode.bit && mode.ccBits;
	};
	/**
	* Get mode object from its name
	*
	* @param   {String} string Mode name
	* @returns {Mode}          Mode object
	*/
	function fromString(string) {
		if (typeof string !== "string") throw new Error("Param is not a string");
		switch (string.toLowerCase()) {
			case "numeric": return exports.NUMERIC;
			case "alphanumeric": return exports.ALPHANUMERIC;
			case "kanji": return exports.KANJI;
			case "byte": return exports.BYTE;
			default: throw new Error("Unknown mode: " + string);
		}
	}
	/**
	* Returns mode from a value.
	* If value is not a valid mode, returns defaultValue
	*
	* @param  {Mode|String} value        Encoding mode
	* @param  {Mode}        defaultValue Fallback value
	* @return {Mode}                     Encoding mode
	*/
	exports.from = function from(value, defaultValue) {
		if (exports.isValid(value)) return value;
		try {
			return fromString(value);
		} catch (e) {
			return defaultValue;
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/version.js
var require_version = /* @__PURE__ */ __commonJSMin(((exports) => {
	const Utils$8 = require_utils$1();
	const ECCode$1 = require_error_correction_code();
	const ECLevel$1 = require_error_correction_level();
	const Mode$6 = require_mode();
	const VersionCheck = require_version_check();
	const G18 = 7973;
	const G18_BCH = Utils$8.getBCHDigit(G18);
	function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
		for (let currentVersion = 1; currentVersion <= 40; currentVersion++) if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) return currentVersion;
	}
	function getReservedBitsCount(mode, version) {
		return Mode$6.getCharCountIndicator(mode, version) + 4;
	}
	function getTotalBitsFromDataArray(segments, version) {
		let totalBits = 0;
		segments.forEach(function(data) {
			const reservedBits = getReservedBitsCount(data.mode, version);
			totalBits += reservedBits + data.getBitsLength();
		});
		return totalBits;
	}
	function getBestVersionForMixedData(segments, errorCorrectionLevel) {
		for (let currentVersion = 1; currentVersion <= 40; currentVersion++) if (getTotalBitsFromDataArray(segments, currentVersion) <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode$6.MIXED)) return currentVersion;
	}
	/**
	* Returns version number from a value.
	* If value is not a valid version, returns defaultValue
	*
	* @param  {Number|String} value        QR Code version
	* @param  {Number}        defaultValue Fallback value
	* @return {Number}                     QR Code version number
	*/
	exports.from = function from(value, defaultValue) {
		if (VersionCheck.isValid(value)) return parseInt(value, 10);
		return defaultValue;
	};
	/**
	* Returns how much data can be stored with the specified QR code version
	* and error correction level
	*
	* @param  {Number} version              QR Code version (1-40)
	* @param  {Number} errorCorrectionLevel Error correction level
	* @param  {Mode}   mode                 Data mode
	* @return {Number}                      Quantity of storable data
	*/
	exports.getCapacity = function getCapacity(version, errorCorrectionLevel, mode) {
		if (!VersionCheck.isValid(version)) throw new Error("Invalid QR Code version");
		if (typeof mode === "undefined") mode = Mode$6.BYTE;
		const dataTotalCodewordsBits = (Utils$8.getSymbolTotalCodewords(version) - ECCode$1.getTotalCodewordsCount(version, errorCorrectionLevel)) * 8;
		if (mode === Mode$6.MIXED) return dataTotalCodewordsBits;
		const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
		switch (mode) {
			case Mode$6.NUMERIC: return Math.floor(usableBits / 10 * 3);
			case Mode$6.ALPHANUMERIC: return Math.floor(usableBits / 11 * 2);
			case Mode$6.KANJI: return Math.floor(usableBits / 13);
			case Mode$6.BYTE:
			default: return Math.floor(usableBits / 8);
		}
	};
	/**
	* Returns the minimum version needed to contain the amount of data
	*
	* @param  {Segment} data                    Segment of data
	* @param  {Number} [errorCorrectionLevel=H] Error correction level
	* @param  {Mode} mode                       Data mode
	* @return {Number}                          QR Code version
	*/
	exports.getBestVersionForData = function getBestVersionForData(data, errorCorrectionLevel) {
		let seg;
		const ecl = ECLevel$1.from(errorCorrectionLevel, ECLevel$1.M);
		if (Array.isArray(data)) {
			if (data.length > 1) return getBestVersionForMixedData(data, ecl);
			if (data.length === 0) return 1;
			seg = data[0];
		} else seg = data;
		return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
	};
	/**
	* Returns version information with relative error correction bits
	*
	* The version information is included in QR Code symbols of version 7 or larger.
	* It consists of an 18-bit sequence containing 6 data bits,
	* with 12 error correction bits calculated using the (18, 6) Golay code.
	*
	* @param  {Number} version QR Code version
	* @return {Number}         Encoded version info bits
	*/
	exports.getEncodedBits = function getEncodedBits(version) {
		if (!VersionCheck.isValid(version) || version < 7) throw new Error("Invalid QR Code version");
		let d = version << 12;
		while (Utils$8.getBCHDigit(d) - G18_BCH >= 0) d ^= G18 << Utils$8.getBCHDigit(d) - G18_BCH;
		return version << 12 | d;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/format-info.js
var require_format_info = /* @__PURE__ */ __commonJSMin(((exports) => {
	const Utils$7 = require_utils$1();
	const G15 = 1335;
	const G15_MASK = 21522;
	const G15_BCH = Utils$7.getBCHDigit(G15);
	/**
	* Returns format information with relative error correction bits
	*
	* The format information is a 15-bit sequence containing 5 data bits,
	* with 10 error correction bits calculated using the (15, 5) BCH code.
	*
	* @param  {Number} errorCorrectionLevel Error correction level
	* @param  {Number} mask                 Mask pattern
	* @return {Number}                      Encoded format information bits
	*/
	exports.getEncodedBits = function getEncodedBits(errorCorrectionLevel, mask) {
		const data = errorCorrectionLevel.bit << 3 | mask;
		let d = data << 10;
		while (Utils$7.getBCHDigit(d) - G15_BCH >= 0) d ^= G15 << Utils$7.getBCHDigit(d) - G15_BCH;
		return (data << 10 | d) ^ G15_MASK;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Mode$5 = require_mode();
	function NumericData$1(data) {
		this.mode = Mode$5.NUMERIC;
		this.data = data.toString();
	}
	NumericData$1.getBitsLength = function getBitsLength(length) {
		return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
	};
	NumericData$1.prototype.getLength = function getLength() {
		return this.data.length;
	};
	NumericData$1.prototype.getBitsLength = function getBitsLength() {
		return NumericData$1.getBitsLength(this.data.length);
	};
	NumericData$1.prototype.write = function write(bitBuffer) {
		let i, group, value;
		for (i = 0; i + 3 <= this.data.length; i += 3) {
			group = this.data.substr(i, 3);
			value = parseInt(group, 10);
			bitBuffer.put(value, 10);
		}
		const remainingNum = this.data.length - i;
		if (remainingNum > 0) {
			group = this.data.substr(i);
			value = parseInt(group, 10);
			bitBuffer.put(value, remainingNum * 3 + 1);
		}
	};
	module.exports = NumericData$1;
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Mode$4 = require_mode();
	/**
	* Array of characters available in alphanumeric mode
	*
	* As per QR Code specification, to each character
	* is assigned a value from 0 to 44 which in this case coincides
	* with the array index
	*
	* @type {Array}
	*/
	const ALPHA_NUM_CHARS = [
		"0",
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"A",
		"B",
		"C",
		"D",
		"E",
		"F",
		"G",
		"H",
		"I",
		"J",
		"K",
		"L",
		"M",
		"N",
		"O",
		"P",
		"Q",
		"R",
		"S",
		"T",
		"U",
		"V",
		"W",
		"X",
		"Y",
		"Z",
		" ",
		"$",
		"%",
		"*",
		"+",
		"-",
		".",
		"/",
		":"
	];
	function AlphanumericData$1(data) {
		this.mode = Mode$4.ALPHANUMERIC;
		this.data = data;
	}
	AlphanumericData$1.getBitsLength = function getBitsLength(length) {
		return 11 * Math.floor(length / 2) + 6 * (length % 2);
	};
	AlphanumericData$1.prototype.getLength = function getLength() {
		return this.data.length;
	};
	AlphanumericData$1.prototype.getBitsLength = function getBitsLength() {
		return AlphanumericData$1.getBitsLength(this.data.length);
	};
	AlphanumericData$1.prototype.write = function write(bitBuffer) {
		let i;
		for (i = 0; i + 2 <= this.data.length; i += 2) {
			let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
			value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
			bitBuffer.put(value, 11);
		}
		if (this.data.length % 2) bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
	};
	module.exports = AlphanumericData$1;
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Mode$3 = require_mode();
	function ByteData$1(data) {
		this.mode = Mode$3.BYTE;
		if (typeof data === "string") this.data = new TextEncoder().encode(data);
		else this.data = new Uint8Array(data);
	}
	ByteData$1.getBitsLength = function getBitsLength(length) {
		return length * 8;
	};
	ByteData$1.prototype.getLength = function getLength() {
		return this.data.length;
	};
	ByteData$1.prototype.getBitsLength = function getBitsLength() {
		return ByteData$1.getBitsLength(this.data.length);
	};
	ByteData$1.prototype.write = function(bitBuffer) {
		for (let i = 0, l = this.data.length; i < l; i++) bitBuffer.put(this.data[i], 8);
	};
	module.exports = ByteData$1;
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Mode$2 = require_mode();
	const Utils$6 = require_utils$1();
	function KanjiData$1(data) {
		this.mode = Mode$2.KANJI;
		this.data = data;
	}
	KanjiData$1.getBitsLength = function getBitsLength(length) {
		return length * 13;
	};
	KanjiData$1.prototype.getLength = function getLength() {
		return this.data.length;
	};
	KanjiData$1.prototype.getBitsLength = function getBitsLength() {
		return KanjiData$1.getBitsLength(this.data.length);
	};
	KanjiData$1.prototype.write = function(bitBuffer) {
		let i;
		for (i = 0; i < this.data.length; i++) {
			let value = Utils$6.toSJIS(this.data[i]);
			if (value >= 33088 && value <= 40956) value -= 33088;
			else if (value >= 57408 && value <= 60351) value -= 49472;
			else throw new Error("Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8");
			value = (value >>> 8 & 255) * 192 + (value & 255);
			bitBuffer.put(value, 13);
		}
	};
	module.exports = KanjiData$1;
}));

//#endregion
//#region ../../node_modules/.bun/dijkstrajs@1.0.3/node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/******************************************************************************
	* Created 2008-08-19.
	*
	* Dijkstra path-finding functions. Adapted from the Dijkstar Python project.
	*
	* Copyright (C) 2008
	*   Wyatt Baldwin <self@wyattbaldwin.com>
	*   All rights reserved
	*
	* Licensed under the MIT license.
	*
	*   http://www.opensource.org/licenses/mit-license.php
	*
	* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	* THE SOFTWARE.
	*****************************************************************************/
	var dijkstra$1 = {
		single_source_shortest_paths: function(graph, s, d) {
			var predecessors = {};
			var costs = {};
			costs[s] = 0;
			var open = dijkstra$1.PriorityQueue.make();
			open.push(s, 0);
			var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
			while (!open.empty()) {
				closest = open.pop();
				u = closest.value;
				cost_of_s_to_u = closest.cost;
				adjacent_nodes = graph[u] || {};
				for (v in adjacent_nodes) if (adjacent_nodes.hasOwnProperty(v)) {
					cost_of_e = adjacent_nodes[v];
					cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
					cost_of_s_to_v = costs[v];
					first_visit = typeof costs[v] === "undefined";
					if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
						costs[v] = cost_of_s_to_u_plus_cost_of_e;
						open.push(v, cost_of_s_to_u_plus_cost_of_e);
						predecessors[v] = u;
					}
				}
			}
			if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
				var msg = [
					"Could not find a path from ",
					s,
					" to ",
					d,
					"."
				].join("");
				throw new Error(msg);
			}
			return predecessors;
		},
		extract_shortest_path_from_predecessor_list: function(predecessors, d) {
			var nodes = [];
			var u = d;
			while (u) {
				nodes.push(u);
				predecessors[u];
				u = predecessors[u];
			}
			nodes.reverse();
			return nodes;
		},
		find_path: function(graph, s, d) {
			var predecessors = dijkstra$1.single_source_shortest_paths(graph, s, d);
			return dijkstra$1.extract_shortest_path_from_predecessor_list(predecessors, d);
		},
		PriorityQueue: {
			make: function(opts) {
				var T = dijkstra$1.PriorityQueue, t = {}, key;
				opts = opts || {};
				for (key in T) if (T.hasOwnProperty(key)) t[key] = T[key];
				t.queue = [];
				t.sorter = opts.sorter || T.default_sorter;
				return t;
			},
			default_sorter: function(a, b) {
				return a.cost - b.cost;
			},
			push: function(value, cost) {
				var item = {
					value,
					cost
				};
				this.queue.push(item);
				this.queue.sort(this.sorter);
			},
			pop: function() {
				return this.queue.shift();
			},
			empty: function() {
				return this.queue.length === 0;
			}
		}
	};
	if (typeof module !== "undefined") module.exports = dijkstra$1;
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/segments.js
var require_segments = /* @__PURE__ */ __commonJSMin(((exports) => {
	const Mode$1 = require_mode();
	const NumericData = require_numeric_data();
	const AlphanumericData = require_alphanumeric_data();
	const ByteData = require_byte_data();
	const KanjiData = require_kanji_data();
	const Regex = require_regex();
	const Utils$5 = require_utils$1();
	const dijkstra = require_dijkstra();
	/**
	* Returns UTF8 byte length
	*
	* @param  {String} str Input string
	* @return {Number}     Number of byte
	*/
	function getStringByteLength(str) {
		return unescape(encodeURIComponent(str)).length;
	}
	/**
	* Get a list of segments of the specified mode
	* from a string
	*
	* @param  {Mode}   mode Segment mode
	* @param  {String} str  String to process
	* @return {Array}       Array of object with segments data
	*/
	function getSegments(regex, mode, str) {
		const segments = [];
		let result;
		while ((result = regex.exec(str)) !== null) segments.push({
			data: result[0],
			index: result.index,
			mode,
			length: result[0].length
		});
		return segments;
	}
	/**
	* Extracts a series of segments with the appropriate
	* modes from a string
	*
	* @param  {String} dataStr Input string
	* @return {Array}          Array of object with segments data
	*/
	function getSegmentsFromString(dataStr) {
		const numSegs = getSegments(Regex.NUMERIC, Mode$1.NUMERIC, dataStr);
		const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode$1.ALPHANUMERIC, dataStr);
		let byteSegs;
		let kanjiSegs;
		if (Utils$5.isKanjiModeEnabled()) {
			byteSegs = getSegments(Regex.BYTE, Mode$1.BYTE, dataStr);
			kanjiSegs = getSegments(Regex.KANJI, Mode$1.KANJI, dataStr);
		} else {
			byteSegs = getSegments(Regex.BYTE_KANJI, Mode$1.BYTE, dataStr);
			kanjiSegs = [];
		}
		return numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs).sort(function(s1, s2) {
			return s1.index - s2.index;
		}).map(function(obj) {
			return {
				data: obj.data,
				mode: obj.mode,
				length: obj.length
			};
		});
	}
	/**
	* Returns how many bits are needed to encode a string of
	* specified length with the specified mode
	*
	* @param  {Number} length String length
	* @param  {Mode} mode     Segment mode
	* @return {Number}        Bit length
	*/
	function getSegmentBitsLength(length, mode) {
		switch (mode) {
			case Mode$1.NUMERIC: return NumericData.getBitsLength(length);
			case Mode$1.ALPHANUMERIC: return AlphanumericData.getBitsLength(length);
			case Mode$1.KANJI: return KanjiData.getBitsLength(length);
			case Mode$1.BYTE: return ByteData.getBitsLength(length);
		}
	}
	/**
	* Merges adjacent segments which have the same mode
	*
	* @param  {Array} segs Array of object with segments data
	* @return {Array}      Array of object with segments data
	*/
	function mergeSegments(segs) {
		return segs.reduce(function(acc, curr) {
			const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
			if (prevSeg && prevSeg.mode === curr.mode) {
				acc[acc.length - 1].data += curr.data;
				return acc;
			}
			acc.push(curr);
			return acc;
		}, []);
	}
	/**
	* Generates a list of all possible nodes combination which
	* will be used to build a segments graph.
	*
	* Nodes are divided by groups. Each group will contain a list of all the modes
	* in which is possible to encode the given text.
	*
	* For example the text '12345' can be encoded as Numeric, Alphanumeric or Byte.
	* The group for '12345' will contain then 3 objects, one for each
	* possible encoding mode.
	*
	* Each node represents a possible segment.
	*
	* @param  {Array} segs Array of object with segments data
	* @return {Array}      Array of object with segments data
	*/
	function buildNodes(segs) {
		const nodes = [];
		for (let i = 0; i < segs.length; i++) {
			const seg = segs[i];
			switch (seg.mode) {
				case Mode$1.NUMERIC:
					nodes.push([
						seg,
						{
							data: seg.data,
							mode: Mode$1.ALPHANUMERIC,
							length: seg.length
						},
						{
							data: seg.data,
							mode: Mode$1.BYTE,
							length: seg.length
						}
					]);
					break;
				case Mode$1.ALPHANUMERIC:
					nodes.push([seg, {
						data: seg.data,
						mode: Mode$1.BYTE,
						length: seg.length
					}]);
					break;
				case Mode$1.KANJI:
					nodes.push([seg, {
						data: seg.data,
						mode: Mode$1.BYTE,
						length: getStringByteLength(seg.data)
					}]);
					break;
				case Mode$1.BYTE: nodes.push([{
					data: seg.data,
					mode: Mode$1.BYTE,
					length: getStringByteLength(seg.data)
				}]);
			}
		}
		return nodes;
	}
	/**
	* Builds a graph from a list of nodes.
	* All segments in each node group will be connected with all the segments of
	* the next group and so on.
	*
	* At each connection will be assigned a weight depending on the
	* segment's byte length.
	*
	* @param  {Array} nodes    Array of object with segments data
	* @param  {Number} version QR Code version
	* @return {Object}         Graph of all possible segments
	*/
	function buildGraph(nodes, version) {
		const table = {};
		const graph = { start: {} };
		let prevNodeIds = ["start"];
		for (let i = 0; i < nodes.length; i++) {
			const nodeGroup = nodes[i];
			const currentNodeIds = [];
			for (let j = 0; j < nodeGroup.length; j++) {
				const node = nodeGroup[j];
				const key = "" + i + j;
				currentNodeIds.push(key);
				table[key] = {
					node,
					lastCount: 0
				};
				graph[key] = {};
				for (let n = 0; n < prevNodeIds.length; n++) {
					const prevNodeId = prevNodeIds[n];
					if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
						graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
						table[prevNodeId].lastCount += node.length;
					} else {
						if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
						graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode$1.getCharCountIndicator(node.mode, version);
					}
				}
			}
			prevNodeIds = currentNodeIds;
		}
		for (let n = 0; n < prevNodeIds.length; n++) graph[prevNodeIds[n]].end = 0;
		return {
			map: graph,
			table
		};
	}
	/**
	* Builds a segment from a specified data and mode.
	* If a mode is not specified, the more suitable will be used.
	*
	* @param  {String} data             Input data
	* @param  {Mode | String} modesHint Data mode
	* @return {Segment}                 Segment
	*/
	function buildSingleSegment(data, modesHint) {
		let mode;
		const bestMode = Mode$1.getBestModeForData(data);
		mode = Mode$1.from(modesHint, bestMode);
		if (mode !== Mode$1.BYTE && mode.bit < bestMode.bit) throw new Error("\"" + data + "\" cannot be encoded with mode " + Mode$1.toString(mode) + ".\n Suggested mode is: " + Mode$1.toString(bestMode));
		if (mode === Mode$1.KANJI && !Utils$5.isKanjiModeEnabled()) mode = Mode$1.BYTE;
		switch (mode) {
			case Mode$1.NUMERIC: return new NumericData(data);
			case Mode$1.ALPHANUMERIC: return new AlphanumericData(data);
			case Mode$1.KANJI: return new KanjiData(data);
			case Mode$1.BYTE: return new ByteData(data);
		}
	}
	/**
	* Builds a list of segments from an array.
	* Array can contain Strings or Objects with segment's info.
	*
	* For each item which is a string, will be generated a segment with the given
	* string and the more appropriate encoding mode.
	*
	* For each item which is an object, will be generated a segment with the given
	* data and mode.
	* Objects must contain at least the property "data".
	* If property "mode" is not present, the more suitable mode will be used.
	*
	* @param  {Array} array Array of objects with segments data
	* @return {Array}       Array of Segments
	*/
	exports.fromArray = function fromArray(array) {
		return array.reduce(function(acc, seg) {
			if (typeof seg === "string") acc.push(buildSingleSegment(seg, null));
			else if (seg.data) acc.push(buildSingleSegment(seg.data, seg.mode));
			return acc;
		}, []);
	};
	/**
	* Builds an optimized sequence of segments from a string,
	* which will produce the shortest possible bitstream.
	*
	* @param  {String} data    Input string
	* @param  {Number} version QR Code version
	* @return {Array}          Array of segments
	*/
	exports.fromString = function fromString$2(data, version) {
		const graph = buildGraph(buildNodes(getSegmentsFromString(data, Utils$5.isKanjiModeEnabled())), version);
		const path = dijkstra.find_path(graph.map, "start", "end");
		const optimizedSegs = [];
		for (let i = 1; i < path.length - 1; i++) optimizedSegs.push(graph.table[path[i]].node);
		return exports.fromArray(mergeSegments(optimizedSegs));
	};
	/**
	* Splits a string in various segments with the modes which
	* best represent their content.
	* The produced segments are far from being optimized.
	* The output of this function is only used to estimate a QR Code version
	* which may contain the data.
	*
	* @param  {string} data Input string
	* @return {Array}       Array of segments
	*/
	exports.rawSplit = function rawSplit(data) {
		return exports.fromArray(getSegmentsFromString(data, Utils$5.isKanjiModeEnabled()));
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = /* @__PURE__ */ __commonJSMin(((exports) => {
	const Utils$4 = require_utils$1();
	const ECLevel = require_error_correction_level();
	const BitBuffer = require_bit_buffer();
	const BitMatrix = require_bit_matrix();
	const AlignmentPattern = require_alignment_pattern();
	const FinderPattern = require_finder_pattern();
	const MaskPattern = require_mask_pattern();
	const ECCode = require_error_correction_code();
	const ReedSolomonEncoder = require_reed_solomon_encoder();
	const Version = require_version();
	const FormatInfo = require_format_info();
	const Mode = require_mode();
	const Segments = require_segments();
	/**
	* QRCode for JavaScript
	*
	* modified by Ryan Day for nodejs support
	* Copyright (c) 2011 Ryan Day
	*
	* Licensed under the MIT license:
	*   http://www.opensource.org/licenses/mit-license.php
	*
	//---------------------------------------------------------------------
	// QRCode for JavaScript
	//
	// Copyright (c) 2009 Kazuhiko Arase
	//
	// URL: http://www.d-project.com/
	//
	// Licensed under the MIT license:
	//   http://www.opensource.org/licenses/mit-license.php
	//
	// The word "QR Code" is registered trademark of
	// DENSO WAVE INCORPORATED
	//   http://www.denso-wave.com/qrcode/faqpatent-e.html
	//
	//---------------------------------------------------------------------
	*/
	/**
	* Add finder patterns bits to matrix
	*
	* @param  {BitMatrix} matrix  Modules matrix
	* @param  {Number}    version QR Code version
	*/
	function setupFinderPattern(matrix, version) {
		const size = matrix.size;
		const pos = FinderPattern.getPositions(version);
		for (let i = 0; i < pos.length; i++) {
			const row = pos[i][0];
			const col = pos[i][1];
			for (let r = -1; r <= 7; r++) {
				if (row + r <= -1 || size <= row + r) continue;
				for (let c = -1; c <= 7; c++) {
					if (col + c <= -1 || size <= col + c) continue;
					if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) matrix.set(row + r, col + c, true, true);
					else matrix.set(row + r, col + c, false, true);
				}
			}
		}
	}
	/**
	* Add timing pattern bits to matrix
	*
	* Note: this function must be called before {@link setupAlignmentPattern}
	*
	* @param  {BitMatrix} matrix Modules matrix
	*/
	function setupTimingPattern(matrix) {
		const size = matrix.size;
		for (let r = 8; r < size - 8; r++) {
			const value = r % 2 === 0;
			matrix.set(r, 6, value, true);
			matrix.set(6, r, value, true);
		}
	}
	/**
	* Add alignment patterns bits to matrix
	*
	* Note: this function must be called after {@link setupTimingPattern}
	*
	* @param  {BitMatrix} matrix  Modules matrix
	* @param  {Number}    version QR Code version
	*/
	function setupAlignmentPattern(matrix, version) {
		const pos = AlignmentPattern.getPositions(version);
		for (let i = 0; i < pos.length; i++) {
			const row = pos[i][0];
			const col = pos[i][1];
			for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) matrix.set(row + r, col + c, true, true);
			else matrix.set(row + r, col + c, false, true);
		}
	}
	/**
	* Add version info bits to matrix
	*
	* @param  {BitMatrix} matrix  Modules matrix
	* @param  {Number}    version QR Code version
	*/
	function setupVersionInfo(matrix, version) {
		const size = matrix.size;
		const bits = Version.getEncodedBits(version);
		let row, col, mod;
		for (let i = 0; i < 18; i++) {
			row = Math.floor(i / 3);
			col = i % 3 + size - 8 - 3;
			mod = (bits >> i & 1) === 1;
			matrix.set(row, col, mod, true);
			matrix.set(col, row, mod, true);
		}
	}
	/**
	* Add format info bits to matrix
	*
	* @param  {BitMatrix} matrix               Modules matrix
	* @param  {ErrorCorrectionLevel}    errorCorrectionLevel Error correction level
	* @param  {Number}    maskPattern          Mask pattern reference value
	*/
	function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
		const size = matrix.size;
		const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
		let i, mod;
		for (i = 0; i < 15; i++) {
			mod = (bits >> i & 1) === 1;
			if (i < 6) matrix.set(i, 8, mod, true);
			else if (i < 8) matrix.set(i + 1, 8, mod, true);
			else matrix.set(size - 15 + i, 8, mod, true);
			if (i < 8) matrix.set(8, size - i - 1, mod, true);
			else if (i < 9) matrix.set(8, 15 - i - 1 + 1, mod, true);
			else matrix.set(8, 15 - i - 1, mod, true);
		}
		matrix.set(size - 8, 8, 1, true);
	}
	/**
	* Add encoded data bits to matrix
	*
	* @param  {BitMatrix}  matrix Modules matrix
	* @param  {Uint8Array} data   Data codewords
	*/
	function setupData(matrix, data) {
		const size = matrix.size;
		let inc = -1;
		let row = size - 1;
		let bitIndex = 7;
		let byteIndex = 0;
		for (let col = size - 1; col > 0; col -= 2) {
			if (col === 6) col--;
			while (true) {
				for (let c = 0; c < 2; c++) if (!matrix.isReserved(row, col - c)) {
					let dark = false;
					if (byteIndex < data.length) dark = (data[byteIndex] >>> bitIndex & 1) === 1;
					matrix.set(row, col - c, dark);
					bitIndex--;
					if (bitIndex === -1) {
						byteIndex++;
						bitIndex = 7;
					}
				}
				row += inc;
				if (row < 0 || size <= row) {
					row -= inc;
					inc = -inc;
					break;
				}
			}
		}
	}
	/**
	* Create encoded codewords from data input
	*
	* @param  {Number}   version              QR Code version
	* @param  {ErrorCorrectionLevel}   errorCorrectionLevel Error correction level
	* @param  {ByteData} data                 Data input
	* @return {Uint8Array}                    Buffer containing encoded codewords
	*/
	function createData(version, errorCorrectionLevel, segments) {
		const buffer = new BitBuffer();
		segments.forEach(function(data) {
			buffer.put(data.mode.bit, 4);
			buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
			data.write(buffer);
		});
		const dataTotalCodewordsBits = (Utils$4.getSymbolTotalCodewords(version) - ECCode.getTotalCodewordsCount(version, errorCorrectionLevel)) * 8;
		if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) buffer.put(0, 4);
		while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(0);
		const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
		for (let i = 0; i < remainingByte; i++) buffer.put(i % 2 ? 17 : 236, 8);
		return createCodewords(buffer, version, errorCorrectionLevel);
	}
	/**
	* Encode input data with Reed-Solomon and return codewords with
	* relative error correction bits
	*
	* @param  {BitBuffer} bitBuffer            Data to encode
	* @param  {Number}    version              QR Code version
	* @param  {ErrorCorrectionLevel} errorCorrectionLevel Error correction level
	* @return {Uint8Array}                     Buffer containing encoded codewords
	*/
	function createCodewords(bitBuffer, version, errorCorrectionLevel) {
		const totalCodewords = Utils$4.getSymbolTotalCodewords(version);
		const dataTotalCodewords = totalCodewords - ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
		const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
		const blocksInGroup1 = ecTotalBlocks - totalCodewords % ecTotalBlocks;
		const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
		const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
		const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
		const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
		const rs = new ReedSolomonEncoder(ecCount);
		let offset = 0;
		const dcData = new Array(ecTotalBlocks);
		const ecData = new Array(ecTotalBlocks);
		let maxDataSize = 0;
		const buffer = new Uint8Array(bitBuffer.buffer);
		for (let b = 0; b < ecTotalBlocks; b++) {
			const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
			dcData[b] = buffer.slice(offset, offset + dataSize);
			ecData[b] = rs.encode(dcData[b]);
			offset += dataSize;
			maxDataSize = Math.max(maxDataSize, dataSize);
		}
		const data = new Uint8Array(totalCodewords);
		let index = 0;
		let i, r;
		for (i = 0; i < maxDataSize; i++) for (r = 0; r < ecTotalBlocks; r++) if (i < dcData[r].length) data[index++] = dcData[r][i];
		for (i = 0; i < ecCount; i++) for (r = 0; r < ecTotalBlocks; r++) data[index++] = ecData[r][i];
		return data;
	}
	/**
	* Build QR Code symbol
	*
	* @param  {String} data                 Input string
	* @param  {Number} version              QR Code version
	* @param  {ErrorCorretionLevel} errorCorrectionLevel Error level
	* @param  {MaskPattern} maskPattern     Mask pattern
	* @return {Object}                      Object containing symbol data
	*/
	function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
		let segments;
		if (Array.isArray(data)) segments = Segments.fromArray(data);
		else if (typeof data === "string") {
			let estimatedVersion = version;
			if (!estimatedVersion) {
				const rawSegments = Segments.rawSplit(data);
				estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
			}
			segments = Segments.fromString(data, estimatedVersion || 40);
		} else throw new Error("Invalid data");
		const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
		if (!bestVersion) throw new Error("The amount of data is too big to be stored in a QR Code");
		if (!version) version = bestVersion;
		else if (version < bestVersion) throw new Error("\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n");
		const dataBits = createData(version, errorCorrectionLevel, segments);
		const modules = new BitMatrix(Utils$4.getSymbolSize(version));
		setupFinderPattern(modules, version);
		setupTimingPattern(modules);
		setupAlignmentPattern(modules, version);
		setupFormatInfo(modules, errorCorrectionLevel, 0);
		if (version >= 7) setupVersionInfo(modules, version);
		setupData(modules, dataBits);
		if (isNaN(maskPattern)) maskPattern = MaskPattern.getBestMask(modules, setupFormatInfo.bind(null, modules, errorCorrectionLevel));
		MaskPattern.applyMask(maskPattern, modules);
		setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
		return {
			modules,
			version,
			errorCorrectionLevel,
			maskPattern,
			segments
		};
	}
	/**
	* QR Code
	*
	* @param {String | Array} data                 Input data
	* @param {Object} options                      Optional configurations
	* @param {Number} options.version              QR Code version
	* @param {String} options.errorCorrectionLevel Error correction level
	* @param {Function} options.toSJISFunc         Helper func to convert utf8 to sjis
	*/
	exports.create = function create(data, options) {
		if (typeof data === "undefined" || data === "") throw new Error("No input text");
		let errorCorrectionLevel = ECLevel.M;
		let version;
		let mask;
		if (typeof options !== "undefined") {
			errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
			version = Version.from(options.version);
			mask = MaskPattern.from(options.maskPattern);
			if (options.toSJISFunc) Utils$4.setToSJISFunction(options.toSJISFunc);
		}
		return createSymbol(data, version, errorCorrectionLevel, mask);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/chunkstream.js
var require_chunkstream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let util$5 = __require("util");
	let Stream$2 = __require("stream");
	let ChunkStream$2 = module.exports = function() {
		Stream$2.call(this);
		this._buffers = [];
		this._buffered = 0;
		this._reads = [];
		this._paused = false;
		this._encoding = "utf8";
		this.writable = true;
	};
	util$5.inherits(ChunkStream$2, Stream$2);
	ChunkStream$2.prototype.read = function(length, callback) {
		this._reads.push({
			length: Math.abs(length),
			allowLess: length < 0,
			func: callback
		});
		process.nextTick(function() {
			this._process();
			if (this._paused && this._reads && this._reads.length > 0) {
				this._paused = false;
				this.emit("drain");
			}
		}.bind(this));
	};
	ChunkStream$2.prototype.write = function(data, encoding) {
		if (!this.writable) {
			this.emit("error", /* @__PURE__ */ new Error("Stream not writable"));
			return false;
		}
		let dataBuffer;
		if (Buffer.isBuffer(data)) dataBuffer = data;
		else dataBuffer = Buffer.from(data, encoding || this._encoding);
		this._buffers.push(dataBuffer);
		this._buffered += dataBuffer.length;
		this._process();
		if (this._reads && this._reads.length === 0) this._paused = true;
		return this.writable && !this._paused;
	};
	ChunkStream$2.prototype.end = function(data, encoding) {
		if (data) this.write(data, encoding);
		this.writable = false;
		if (!this._buffers) return;
		if (this._buffers.length === 0) this._end();
		else {
			this._buffers.push(null);
			this._process();
		}
	};
	ChunkStream$2.prototype.destroySoon = ChunkStream$2.prototype.end;
	ChunkStream$2.prototype._end = function() {
		if (this._reads.length > 0) this.emit("error", /* @__PURE__ */ new Error("Unexpected end of input"));
		this.destroy();
	};
	ChunkStream$2.prototype.destroy = function() {
		if (!this._buffers) return;
		this.writable = false;
		this._reads = null;
		this._buffers = null;
		this.emit("close");
	};
	ChunkStream$2.prototype._processReadAllowingLess = function(read) {
		this._reads.shift();
		let smallerBuf = this._buffers[0];
		if (smallerBuf.length > read.length) {
			this._buffered -= read.length;
			this._buffers[0] = smallerBuf.slice(read.length);
			read.func.call(this, smallerBuf.slice(0, read.length));
		} else {
			this._buffered -= smallerBuf.length;
			this._buffers.shift();
			read.func.call(this, smallerBuf);
		}
	};
	ChunkStream$2.prototype._processRead = function(read) {
		this._reads.shift();
		let pos = 0;
		let count = 0;
		let data = Buffer.alloc(read.length);
		while (pos < read.length) {
			let buf = this._buffers[count++];
			let len = Math.min(buf.length, read.length - pos);
			buf.copy(data, pos, 0, len);
			pos += len;
			if (len !== buf.length) this._buffers[--count] = buf.slice(len);
		}
		if (count > 0) this._buffers.splice(0, count);
		this._buffered -= read.length;
		read.func.call(this, data);
	};
	ChunkStream$2.prototype._process = function() {
		try {
			while (this._buffered > 0 && this._reads && this._reads.length > 0) {
				let read = this._reads[0];
				if (read.allowLess) this._processReadAllowingLess(read);
				else if (this._buffered >= read.length) this._processRead(read);
				else break;
			}
			if (this._buffers && !this.writable) this._end();
		} catch (ex) {
			this.emit("error", ex);
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/interlace.js
var require_interlace = /* @__PURE__ */ __commonJSMin(((exports) => {
	let imagePasses = [
		{
			x: [0],
			y: [0]
		},
		{
			x: [4],
			y: [0]
		},
		{
			x: [0, 4],
			y: [4]
		},
		{
			x: [2, 6],
			y: [0, 4]
		},
		{
			x: [
				0,
				2,
				4,
				6
			],
			y: [2, 6]
		},
		{
			x: [
				1,
				3,
				5,
				7
			],
			y: [
				0,
				2,
				4,
				6
			]
		},
		{
			x: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			y: [
				1,
				3,
				5,
				7
			]
		}
	];
	exports.getImagePasses = function(width, height) {
		let images = [];
		let xLeftOver = width % 8;
		let yLeftOver = height % 8;
		let xRepeats = (width - xLeftOver) / 8;
		let yRepeats = (height - yLeftOver) / 8;
		for (let i = 0; i < imagePasses.length; i++) {
			let pass = imagePasses[i];
			let passWidth = xRepeats * pass.x.length;
			let passHeight = yRepeats * pass.y.length;
			for (let j = 0; j < pass.x.length; j++) if (pass.x[j] < xLeftOver) passWidth++;
			else break;
			for (let j = 0; j < pass.y.length; j++) if (pass.y[j] < yLeftOver) passHeight++;
			else break;
			if (passWidth > 0 && passHeight > 0) images.push({
				width: passWidth,
				height: passHeight,
				index: i
			});
		}
		return images;
	};
	exports.getInterlaceIterator = function(width) {
		return function(x, y, pass) {
			let outerXLeftOver = x % imagePasses[pass].x.length;
			let outerX = (x - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
			let outerYLeftOver = y % imagePasses[pass].y.length;
			let outerY = (y - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
			return outerX * 4 + outerY * width * 4;
		};
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/paeth-predictor.js
var require_paeth_predictor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function paethPredictor$2(left, above, upLeft) {
		let paeth = left + above - upLeft;
		let pLeft = Math.abs(paeth - left);
		let pAbove = Math.abs(paeth - above);
		let pUpLeft = Math.abs(paeth - upLeft);
		if (pLeft <= pAbove && pLeft <= pUpLeft) return left;
		if (pAbove <= pUpLeft) return above;
		return upLeft;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse.js
var require_filter_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let interlaceUtils$1 = require_interlace();
	let paethPredictor$1 = require_paeth_predictor();
	function getByteWidth(width, bpp, depth) {
		let byteWidth = width * bpp;
		if (depth !== 8) byteWidth = Math.ceil(byteWidth / (8 / depth));
		return byteWidth;
	}
	let Filter$2 = module.exports = function(bitmapInfo, dependencies) {
		let width = bitmapInfo.width;
		let height = bitmapInfo.height;
		let interlace = bitmapInfo.interlace;
		let bpp = bitmapInfo.bpp;
		let depth = bitmapInfo.depth;
		this.read = dependencies.read;
		this.write = dependencies.write;
		this.complete = dependencies.complete;
		this._imageIndex = 0;
		this._images = [];
		if (interlace) {
			let passes = interlaceUtils$1.getImagePasses(width, height);
			for (let i = 0; i < passes.length; i++) this._images.push({
				byteWidth: getByteWidth(passes[i].width, bpp, depth),
				height: passes[i].height,
				lineIndex: 0
			});
		} else this._images.push({
			byteWidth: getByteWidth(width, bpp, depth),
			height,
			lineIndex: 0
		});
		if (depth === 8) this._xComparison = bpp;
		else if (depth === 16) this._xComparison = bpp * 2;
		else this._xComparison = 1;
	};
	Filter$2.prototype.start = function() {
		this.read(this._images[this._imageIndex].byteWidth + 1, this._reverseFilterLine.bind(this));
	};
	Filter$2.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {
		let xComparison = this._xComparison;
		let xBiggerThan = xComparison - 1;
		for (let x = 0; x < byteWidth; x++) unfilteredLine[x] = rawData[1 + x] + (x > xBiggerThan ? unfilteredLine[x - xComparison] : 0);
	};
	Filter$2.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {
		let lastLine = this._lastLine;
		for (let x = 0; x < byteWidth; x++) unfilteredLine[x] = rawData[1 + x] + (lastLine ? lastLine[x] : 0);
	};
	Filter$2.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {
		let xComparison = this._xComparison;
		let xBiggerThan = xComparison - 1;
		let lastLine = this._lastLine;
		for (let x = 0; x < byteWidth; x++) {
			let rawByte = rawData[1 + x];
			let f3Up = lastLine ? lastLine[x] : 0;
			let f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
			unfilteredLine[x] = rawByte + Math.floor((f3Left + f3Up) / 2);
		}
	};
	Filter$2.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {
		let xComparison = this._xComparison;
		let xBiggerThan = xComparison - 1;
		let lastLine = this._lastLine;
		for (let x = 0; x < byteWidth; x++) {
			let rawByte = rawData[1 + x];
			let f4Up = lastLine ? lastLine[x] : 0;
			unfilteredLine[x] = rawByte + paethPredictor$1(x > xBiggerThan ? unfilteredLine[x - xComparison] : 0, f4Up, x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0);
		}
	};
	Filter$2.prototype._reverseFilterLine = function(rawData) {
		let filter$1 = rawData[0];
		let unfilteredLine;
		let currentImage = this._images[this._imageIndex];
		let byteWidth = currentImage.byteWidth;
		if (filter$1 === 0) unfilteredLine = rawData.slice(1, byteWidth + 1);
		else {
			unfilteredLine = Buffer.alloc(byteWidth);
			switch (filter$1) {
				case 1:
					this._unFilterType1(rawData, unfilteredLine, byteWidth);
					break;
				case 2:
					this._unFilterType2(rawData, unfilteredLine, byteWidth);
					break;
				case 3:
					this._unFilterType3(rawData, unfilteredLine, byteWidth);
					break;
				case 4:
					this._unFilterType4(rawData, unfilteredLine, byteWidth);
					break;
				default: throw new Error("Unrecognised filter type - " + filter$1);
			}
		}
		this.write(unfilteredLine);
		currentImage.lineIndex++;
		if (currentImage.lineIndex >= currentImage.height) {
			this._lastLine = null;
			this._imageIndex++;
			currentImage = this._images[this._imageIndex];
		} else this._lastLine = unfilteredLine;
		if (currentImage) this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
		else {
			this._lastLine = null;
			this.complete();
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse-async.js
var require_filter_parse_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let util$4 = __require("util");
	let ChunkStream$1 = require_chunkstream();
	let Filter$1 = require_filter_parse();
	let FilterAsync$1 = module.exports = function(bitmapInfo) {
		ChunkStream$1.call(this);
		let buffers = [];
		let that = this;
		this._filter = new Filter$1(bitmapInfo, {
			read: this.read.bind(this),
			write: function(buffer) {
				buffers.push(buffer);
			},
			complete: function() {
				that.emit("complete", Buffer.concat(buffers));
			}
		});
		this._filter.start();
	};
	util$4.inherits(FilterAsync$1, ChunkStream$1);
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		PNG_SIGNATURE: [
			137,
			80,
			78,
			71,
			13,
			10,
			26,
			10
		],
		TYPE_IHDR: 1229472850,
		TYPE_IEND: 1229278788,
		TYPE_IDAT: 1229209940,
		TYPE_PLTE: 1347179589,
		TYPE_tRNS: 1951551059,
		TYPE_gAMA: 1732332865,
		COLORTYPE_GRAYSCALE: 0,
		COLORTYPE_PALETTE: 1,
		COLORTYPE_COLOR: 2,
		COLORTYPE_ALPHA: 4,
		COLORTYPE_PALETTE_COLOR: 3,
		COLORTYPE_COLOR_ALPHA: 6,
		COLORTYPE_TO_BPP_MAP: {
			0: 1,
			2: 3,
			3: 1,
			4: 2,
			6: 4
		},
		GAMMA_DIVISION: 1e5
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/crc.js
var require_crc = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let crcTable = [];
	(function() {
		for (let i = 0; i < 256; i++) {
			let currentCrc = i;
			for (let j = 0; j < 8; j++) if (currentCrc & 1) currentCrc = 3988292384 ^ currentCrc >>> 1;
			else currentCrc = currentCrc >>> 1;
			crcTable[i] = currentCrc;
		}
	})();
	let CrcCalculator$1 = module.exports = function() {
		this._crc = -1;
	};
	CrcCalculator$1.prototype.write = function(data) {
		for (let i = 0; i < data.length; i++) this._crc = crcTable[(this._crc ^ data[i]) & 255] ^ this._crc >>> 8;
		return true;
	};
	CrcCalculator$1.prototype.crc32 = function() {
		return this._crc ^ -1;
	};
	CrcCalculator$1.crc32 = function(buf) {
		let crc = -1;
		for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 255] ^ crc >>> 8;
		return crc ^ -1;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let constants$4 = require_constants();
	let CrcCalculator = require_crc();
	let Parser$3 = module.exports = function(options, dependencies) {
		this._options = options;
		options.checkCRC = options.checkCRC !== false;
		this._hasIHDR = false;
		this._hasIEND = false;
		this._emittedHeadersFinished = false;
		this._palette = [];
		this._colorType = 0;
		this._chunks = {};
		this._chunks[constants$4.TYPE_IHDR] = this._handleIHDR.bind(this);
		this._chunks[constants$4.TYPE_IEND] = this._handleIEND.bind(this);
		this._chunks[constants$4.TYPE_IDAT] = this._handleIDAT.bind(this);
		this._chunks[constants$4.TYPE_PLTE] = this._handlePLTE.bind(this);
		this._chunks[constants$4.TYPE_tRNS] = this._handleTRNS.bind(this);
		this._chunks[constants$4.TYPE_gAMA] = this._handleGAMA.bind(this);
		this.read = dependencies.read;
		this.error = dependencies.error;
		this.metadata = dependencies.metadata;
		this.gamma = dependencies.gamma;
		this.transColor = dependencies.transColor;
		this.palette = dependencies.palette;
		this.parsed = dependencies.parsed;
		this.inflateData = dependencies.inflateData;
		this.finished = dependencies.finished;
		this.simpleTransparency = dependencies.simpleTransparency;
		this.headersFinished = dependencies.headersFinished || function() {};
	};
	Parser$3.prototype.start = function() {
		this.read(constants$4.PNG_SIGNATURE.length, this._parseSignature.bind(this));
	};
	Parser$3.prototype._parseSignature = function(data) {
		let signature = constants$4.PNG_SIGNATURE;
		for (let i = 0; i < signature.length; i++) if (data[i] !== signature[i]) {
			this.error(/* @__PURE__ */ new Error("Invalid file signature"));
			return;
		}
		this.read(8, this._parseChunkBegin.bind(this));
	};
	Parser$3.prototype._parseChunkBegin = function(data) {
		let length = data.readUInt32BE(0);
		let type = data.readUInt32BE(4);
		let name = "";
		for (let i = 4; i < 8; i++) name += String.fromCharCode(data[i]);
		let ancillary = Boolean(data[4] & 32);
		if (!this._hasIHDR && type !== constants$4.TYPE_IHDR) {
			this.error(/* @__PURE__ */ new Error("Expected IHDR on beggining"));
			return;
		}
		this._crc = new CrcCalculator();
		this._crc.write(Buffer.from(name));
		if (this._chunks[type]) return this._chunks[type](length);
		if (!ancillary) {
			this.error(/* @__PURE__ */ new Error("Unsupported critical chunk type " + name));
			return;
		}
		this.read(length + 4, this._skipChunk.bind(this));
	};
	Parser$3.prototype._skipChunk = function() {
		this.read(8, this._parseChunkBegin.bind(this));
	};
	Parser$3.prototype._handleChunkEnd = function() {
		this.read(4, this._parseChunkEnd.bind(this));
	};
	Parser$3.prototype._parseChunkEnd = function(data) {
		let fileCrc = data.readInt32BE(0);
		let calcCrc = this._crc.crc32();
		if (this._options.checkCRC && calcCrc !== fileCrc) {
			this.error(/* @__PURE__ */ new Error("Crc error - " + fileCrc + " - " + calcCrc));
			return;
		}
		if (!this._hasIEND) this.read(8, this._parseChunkBegin.bind(this));
	};
	Parser$3.prototype._handleIHDR = function(length) {
		this.read(length, this._parseIHDR.bind(this));
	};
	Parser$3.prototype._parseIHDR = function(data) {
		this._crc.write(data);
		let width = data.readUInt32BE(0);
		let height = data.readUInt32BE(4);
		let depth = data[8];
		let colorType = data[9];
		let compr = data[10];
		let filter$1 = data[11];
		let interlace = data[12];
		if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
			this.error(/* @__PURE__ */ new Error("Unsupported bit depth " + depth));
			return;
		}
		if (!(colorType in constants$4.COLORTYPE_TO_BPP_MAP)) {
			this.error(/* @__PURE__ */ new Error("Unsupported color type"));
			return;
		}
		if (compr !== 0) {
			this.error(/* @__PURE__ */ new Error("Unsupported compression method"));
			return;
		}
		if (filter$1 !== 0) {
			this.error(/* @__PURE__ */ new Error("Unsupported filter method"));
			return;
		}
		if (interlace !== 0 && interlace !== 1) {
			this.error(/* @__PURE__ */ new Error("Unsupported interlace method"));
			return;
		}
		this._colorType = colorType;
		let bpp = constants$4.COLORTYPE_TO_BPP_MAP[this._colorType];
		this._hasIHDR = true;
		this.metadata({
			width,
			height,
			depth,
			interlace: Boolean(interlace),
			palette: Boolean(colorType & constants$4.COLORTYPE_PALETTE),
			color: Boolean(colorType & constants$4.COLORTYPE_COLOR),
			alpha: Boolean(colorType & constants$4.COLORTYPE_ALPHA),
			bpp,
			colorType
		});
		this._handleChunkEnd();
	};
	Parser$3.prototype._handlePLTE = function(length) {
		this.read(length, this._parsePLTE.bind(this));
	};
	Parser$3.prototype._parsePLTE = function(data) {
		this._crc.write(data);
		let entries = Math.floor(data.length / 3);
		for (let i = 0; i < entries; i++) this._palette.push([
			data[i * 3],
			data[i * 3 + 1],
			data[i * 3 + 2],
			255
		]);
		this.palette(this._palette);
		this._handleChunkEnd();
	};
	Parser$3.prototype._handleTRNS = function(length) {
		this.simpleTransparency();
		this.read(length, this._parseTRNS.bind(this));
	};
	Parser$3.prototype._parseTRNS = function(data) {
		this._crc.write(data);
		if (this._colorType === constants$4.COLORTYPE_PALETTE_COLOR) {
			if (this._palette.length === 0) {
				this.error(/* @__PURE__ */ new Error("Transparency chunk must be after palette"));
				return;
			}
			if (data.length > this._palette.length) {
				this.error(/* @__PURE__ */ new Error("More transparent colors than palette size"));
				return;
			}
			for (let i = 0; i < data.length; i++) this._palette[i][3] = data[i];
			this.palette(this._palette);
		}
		if (this._colorType === constants$4.COLORTYPE_GRAYSCALE) this.transColor([data.readUInt16BE(0)]);
		if (this._colorType === constants$4.COLORTYPE_COLOR) this.transColor([
			data.readUInt16BE(0),
			data.readUInt16BE(2),
			data.readUInt16BE(4)
		]);
		this._handleChunkEnd();
	};
	Parser$3.prototype._handleGAMA = function(length) {
		this.read(length, this._parseGAMA.bind(this));
	};
	Parser$3.prototype._parseGAMA = function(data) {
		this._crc.write(data);
		this.gamma(data.readUInt32BE(0) / constants$4.GAMMA_DIVISION);
		this._handleChunkEnd();
	};
	Parser$3.prototype._handleIDAT = function(length) {
		if (!this._emittedHeadersFinished) {
			this._emittedHeadersFinished = true;
			this.headersFinished();
		}
		this.read(-length, this._parseIDAT.bind(this, length));
	};
	Parser$3.prototype._parseIDAT = function(length, data) {
		this._crc.write(data);
		if (this._colorType === constants$4.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) throw new Error("Expected palette not found");
		this.inflateData(data);
		let leftOverLength = length - data.length;
		if (leftOverLength > 0) this._handleIDAT(leftOverLength);
		else this._handleChunkEnd();
	};
	Parser$3.prototype._handleIEND = function(length) {
		this.read(length, this._parseIEND.bind(this));
	};
	Parser$3.prototype._parseIEND = function(data) {
		this._crc.write(data);
		this._hasIEND = true;
		this._handleChunkEnd();
		if (this.finished) this.finished();
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/bitmapper.js
var require_bitmapper = /* @__PURE__ */ __commonJSMin(((exports) => {
	let interlaceUtils = require_interlace();
	let pixelBppMapper = [
		function() {},
		function(pxData, data, pxPos, rawPos) {
			if (rawPos === data.length) throw new Error("Ran out of data");
			let pixel = data[rawPos];
			pxData[pxPos] = pixel;
			pxData[pxPos + 1] = pixel;
			pxData[pxPos + 2] = pixel;
			pxData[pxPos + 3] = 255;
		},
		function(pxData, data, pxPos, rawPos) {
			if (rawPos + 1 >= data.length) throw new Error("Ran out of data");
			let pixel = data[rawPos];
			pxData[pxPos] = pixel;
			pxData[pxPos + 1] = pixel;
			pxData[pxPos + 2] = pixel;
			pxData[pxPos + 3] = data[rawPos + 1];
		},
		function(pxData, data, pxPos, rawPos) {
			if (rawPos + 2 >= data.length) throw new Error("Ran out of data");
			pxData[pxPos] = data[rawPos];
			pxData[pxPos + 1] = data[rawPos + 1];
			pxData[pxPos + 2] = data[rawPos + 2];
			pxData[pxPos + 3] = 255;
		},
		function(pxData, data, pxPos, rawPos) {
			if (rawPos + 3 >= data.length) throw new Error("Ran out of data");
			pxData[pxPos] = data[rawPos];
			pxData[pxPos + 1] = data[rawPos + 1];
			pxData[pxPos + 2] = data[rawPos + 2];
			pxData[pxPos + 3] = data[rawPos + 3];
		}
	];
	let pixelBppCustomMapper = [
		function() {},
		function(pxData, pixelData, pxPos, maxBit) {
			let pixel = pixelData[0];
			pxData[pxPos] = pixel;
			pxData[pxPos + 1] = pixel;
			pxData[pxPos + 2] = pixel;
			pxData[pxPos + 3] = maxBit;
		},
		function(pxData, pixelData, pxPos) {
			let pixel = pixelData[0];
			pxData[pxPos] = pixel;
			pxData[pxPos + 1] = pixel;
			pxData[pxPos + 2] = pixel;
			pxData[pxPos + 3] = pixelData[1];
		},
		function(pxData, pixelData, pxPos, maxBit) {
			pxData[pxPos] = pixelData[0];
			pxData[pxPos + 1] = pixelData[1];
			pxData[pxPos + 2] = pixelData[2];
			pxData[pxPos + 3] = maxBit;
		},
		function(pxData, pixelData, pxPos) {
			pxData[pxPos] = pixelData[0];
			pxData[pxPos + 1] = pixelData[1];
			pxData[pxPos + 2] = pixelData[2];
			pxData[pxPos + 3] = pixelData[3];
		}
	];
	function bitRetriever(data, depth) {
		let leftOver = [];
		let i = 0;
		function split() {
			if (i === data.length) throw new Error("Ran out of data");
			let byte$1 = data[i];
			i++;
			let byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
			switch (depth) {
				default: throw new Error("unrecognised depth");
				case 16:
					byte2 = data[i];
					i++;
					leftOver.push((byte$1 << 8) + byte2);
					break;
				case 4:
					byte2 = byte$1 & 15;
					byte1 = byte$1 >> 4;
					leftOver.push(byte1, byte2);
					break;
				case 2:
					byte4 = byte$1 & 3;
					byte3 = byte$1 >> 2 & 3;
					byte2 = byte$1 >> 4 & 3;
					byte1 = byte$1 >> 6 & 3;
					leftOver.push(byte1, byte2, byte3, byte4);
					break;
				case 1:
					byte8 = byte$1 & 1;
					byte7 = byte$1 >> 1 & 1;
					byte6 = byte$1 >> 2 & 1;
					byte5 = byte$1 >> 3 & 1;
					byte4 = byte$1 >> 4 & 1;
					byte3 = byte$1 >> 5 & 1;
					byte2 = byte$1 >> 6 & 1;
					byte1 = byte$1 >> 7 & 1;
					leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
					break;
			}
		}
		return {
			get: function(count) {
				while (leftOver.length < count) split();
				let returner = leftOver.slice(0, count);
				leftOver = leftOver.slice(count);
				return returner;
			},
			resetAfterLine: function() {
				leftOver.length = 0;
			},
			end: function() {
				if (i !== data.length) throw new Error("extra data found");
			}
		};
	}
	function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
		let imageWidth = image.width;
		let imageHeight = image.height;
		let imagePass = image.index;
		for (let y = 0; y < imageHeight; y++) for (let x = 0; x < imageWidth; x++) {
			let pxPos = getPxPos(x, y, imagePass);
			pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
			rawPos += bpp;
		}
		return rawPos;
	}
	function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
		let imageWidth = image.width;
		let imageHeight = image.height;
		let imagePass = image.index;
		for (let y = 0; y < imageHeight; y++) {
			for (let x = 0; x < imageWidth; x++) {
				let pixelData = bits.get(bpp);
				let pxPos = getPxPos(x, y, imagePass);
				pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
			}
			bits.resetAfterLine();
		}
	}
	exports.dataToBitMap = function(data, bitmapInfo) {
		let width = bitmapInfo.width;
		let height = bitmapInfo.height;
		let depth = bitmapInfo.depth;
		let bpp = bitmapInfo.bpp;
		let interlace = bitmapInfo.interlace;
		let bits;
		if (depth !== 8) bits = bitRetriever(data, depth);
		let pxData;
		if (depth <= 8) pxData = Buffer.alloc(width * height * 4);
		else pxData = new Uint16Array(width * height * 4);
		let maxBit = Math.pow(2, depth) - 1;
		let rawPos = 0;
		let images;
		let getPxPos;
		if (interlace) {
			images = interlaceUtils.getImagePasses(width, height);
			getPxPos = interlaceUtils.getInterlaceIterator(width, height);
		} else {
			let nonInterlacedPxPos = 0;
			getPxPos = function() {
				let returner = nonInterlacedPxPos;
				nonInterlacedPxPos += 4;
				return returner;
			};
			images = [{
				width,
				height
			}];
		}
		for (let imageIndex = 0; imageIndex < images.length; imageIndex++) if (depth === 8) rawPos = mapImage8Bit(images[imageIndex], pxData, getPxPos, bpp, data, rawPos);
		else mapImageCustomBit(images[imageIndex], pxData, getPxPos, bpp, bits, maxBit);
		if (depth === 8) {
			if (rawPos !== data.length) throw new Error("extra data found");
		} else bits.end();
		return pxData;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/format-normaliser.js
var require_format_normaliser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function dePalette(indata, outdata, width, height, palette) {
		let pxPos = 0;
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			let color = palette[indata[pxPos]];
			if (!color) throw new Error("index " + indata[pxPos] + " not in palette");
			for (let i = 0; i < 4; i++) outdata[pxPos + i] = color[i];
			pxPos += 4;
		}
	}
	function replaceTransparentColor(indata, outdata, width, height, transColor) {
		let pxPos = 0;
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			let makeTrans = false;
			if (transColor.length === 1) {
				if (transColor[0] === indata[pxPos]) makeTrans = true;
			} else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) makeTrans = true;
			if (makeTrans) for (let i = 0; i < 4; i++) outdata[pxPos + i] = 0;
			pxPos += 4;
		}
	}
	function scaleDepth(indata, outdata, width, height, depth) {
		let maxOutSample = 255;
		let maxInSample = Math.pow(2, depth) - 1;
		let pxPos = 0;
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			for (let i = 0; i < 4; i++) outdata[pxPos + i] = Math.floor(indata[pxPos + i] * maxOutSample / maxInSample + .5);
			pxPos += 4;
		}
	}
	module.exports = function(indata, imageData) {
		let depth = imageData.depth;
		let width = imageData.width;
		let height = imageData.height;
		let colorType = imageData.colorType;
		let transColor = imageData.transColor;
		let palette = imageData.palette;
		let outdata = indata;
		if (colorType === 3) dePalette(indata, outdata, width, height, palette);
		else {
			if (transColor) replaceTransparentColor(indata, outdata, width, height, transColor);
			if (depth !== 8) {
				if (depth === 16) outdata = Buffer.alloc(width * height * 4);
				scaleDepth(indata, outdata, width, height, depth);
			}
		}
		return outdata;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/parser-async.js
var require_parser_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let util$3 = __require("util");
	let zlib$4 = __require("zlib");
	let ChunkStream = require_chunkstream();
	let FilterAsync = require_filter_parse_async();
	let Parser$2 = require_parser();
	let bitmapper$1 = require_bitmapper();
	let formatNormaliser$1 = require_format_normaliser();
	let ParserAsync = module.exports = function(options) {
		ChunkStream.call(this);
		this._parser = new Parser$2(options, {
			read: this.read.bind(this),
			error: this._handleError.bind(this),
			metadata: this._handleMetaData.bind(this),
			gamma: this.emit.bind(this, "gamma"),
			palette: this._handlePalette.bind(this),
			transColor: this._handleTransColor.bind(this),
			finished: this._finished.bind(this),
			inflateData: this._inflateData.bind(this),
			simpleTransparency: this._simpleTransparency.bind(this),
			headersFinished: this._headersFinished.bind(this)
		});
		this._options = options;
		this.writable = true;
		this._parser.start();
	};
	util$3.inherits(ParserAsync, ChunkStream);
	ParserAsync.prototype._handleError = function(err) {
		this.emit("error", err);
		this.writable = false;
		this.destroy();
		if (this._inflate && this._inflate.destroy) this._inflate.destroy();
		if (this._filter) {
			this._filter.destroy();
			this._filter.on("error", function() {});
		}
		this.errord = true;
	};
	ParserAsync.prototype._inflateData = function(data) {
		if (!this._inflate) if (this._bitmapInfo.interlace) {
			this._inflate = zlib$4.createInflate();
			this._inflate.on("error", this.emit.bind(this, "error"));
			this._filter.on("complete", this._complete.bind(this));
			this._inflate.pipe(this._filter);
		} else {
			let imageSize = ((this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1) * this._bitmapInfo.height;
			let chunkSize = Math.max(imageSize, zlib$4.Z_MIN_CHUNK);
			this._inflate = zlib$4.createInflate({ chunkSize });
			let leftToInflate = imageSize;
			let emitError = this.emit.bind(this, "error");
			this._inflate.on("error", function(err) {
				if (!leftToInflate) return;
				emitError(err);
			});
			this._filter.on("complete", this._complete.bind(this));
			let filterWrite = this._filter.write.bind(this._filter);
			this._inflate.on("data", function(chunk) {
				if (!leftToInflate) return;
				if (chunk.length > leftToInflate) chunk = chunk.slice(0, leftToInflate);
				leftToInflate -= chunk.length;
				filterWrite(chunk);
			});
			this._inflate.on("end", this._filter.end.bind(this._filter));
		}
		this._inflate.write(data);
	};
	ParserAsync.prototype._handleMetaData = function(metaData) {
		this._metaData = metaData;
		this._bitmapInfo = Object.create(metaData);
		this._filter = new FilterAsync(this._bitmapInfo);
	};
	ParserAsync.prototype._handleTransColor = function(transColor) {
		this._bitmapInfo.transColor = transColor;
	};
	ParserAsync.prototype._handlePalette = function(palette) {
		this._bitmapInfo.palette = palette;
	};
	ParserAsync.prototype._simpleTransparency = function() {
		this._metaData.alpha = true;
	};
	ParserAsync.prototype._headersFinished = function() {
		this.emit("metadata", this._metaData);
	};
	ParserAsync.prototype._finished = function() {
		if (this.errord) return;
		if (!this._inflate) this.emit("error", "No Inflate block");
		else this._inflate.end();
	};
	ParserAsync.prototype._complete = function(filteredData) {
		if (this.errord) return;
		let normalisedBitmapData;
		try {
			let bitmapData = bitmapper$1.dataToBitMap(filteredData, this._bitmapInfo);
			normalisedBitmapData = formatNormaliser$1(bitmapData, this._bitmapInfo);
			bitmapData = null;
		} catch (ex) {
			this._handleError(ex);
			return;
		}
		this.emit("parsed", normalisedBitmapData);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/bitpacker.js
var require_bitpacker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let constants$3 = require_constants();
	module.exports = function(dataIn, width, height, options) {
		let outHasAlpha = [constants$3.COLORTYPE_COLOR_ALPHA, constants$3.COLORTYPE_ALPHA].indexOf(options.colorType) !== -1;
		if (options.colorType === options.inputColorType) {
			let bigEndian = (function() {
				let buffer = /* @__PURE__ */ new ArrayBuffer(2);
				new DataView(buffer).setInt16(0, 256, true);
				return new Int16Array(buffer)[0] !== 256;
			})();
			if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) return dataIn;
		}
		let data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);
		let maxValue = 255;
		let inBpp = constants$3.COLORTYPE_TO_BPP_MAP[options.inputColorType];
		if (inBpp === 4 && !options.inputHasAlpha) inBpp = 3;
		let outBpp = constants$3.COLORTYPE_TO_BPP_MAP[options.colorType];
		if (options.bitDepth === 16) {
			maxValue = 65535;
			outBpp *= 2;
		}
		let outData = Buffer.alloc(width * height * outBpp);
		let inIndex = 0;
		let outIndex = 0;
		let bgColor = options.bgColor || {};
		if (bgColor.red === void 0) bgColor.red = maxValue;
		if (bgColor.green === void 0) bgColor.green = maxValue;
		if (bgColor.blue === void 0) bgColor.blue = maxValue;
		function getRGBA() {
			let red;
			let green;
			let blue;
			let alpha = maxValue;
			switch (options.inputColorType) {
				case constants$3.COLORTYPE_COLOR_ALPHA:
					alpha = data[inIndex + 3];
					red = data[inIndex];
					green = data[inIndex + 1];
					blue = data[inIndex + 2];
					break;
				case constants$3.COLORTYPE_COLOR:
					red = data[inIndex];
					green = data[inIndex + 1];
					blue = data[inIndex + 2];
					break;
				case constants$3.COLORTYPE_ALPHA:
					alpha = data[inIndex + 1];
					red = data[inIndex];
					green = red;
					blue = red;
					break;
				case constants$3.COLORTYPE_GRAYSCALE:
					red = data[inIndex];
					green = red;
					blue = red;
					break;
				default: throw new Error("input color type:" + options.inputColorType + " is not supported at present");
			}
			if (options.inputHasAlpha) {
				if (!outHasAlpha) {
					alpha /= maxValue;
					red = Math.min(Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0), maxValue);
					green = Math.min(Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0), maxValue);
					blue = Math.min(Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0), maxValue);
				}
			}
			return {
				red,
				green,
				blue,
				alpha
			};
		}
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			let rgba = getRGBA(data, inIndex);
			switch (options.colorType) {
				case constants$3.COLORTYPE_COLOR_ALPHA:
				case constants$3.COLORTYPE_COLOR:
					if (options.bitDepth === 8) {
						outData[outIndex] = rgba.red;
						outData[outIndex + 1] = rgba.green;
						outData[outIndex + 2] = rgba.blue;
						if (outHasAlpha) outData[outIndex + 3] = rgba.alpha;
					} else {
						outData.writeUInt16BE(rgba.red, outIndex);
						outData.writeUInt16BE(rgba.green, outIndex + 2);
						outData.writeUInt16BE(rgba.blue, outIndex + 4);
						if (outHasAlpha) outData.writeUInt16BE(rgba.alpha, outIndex + 6);
					}
					break;
				case constants$3.COLORTYPE_ALPHA:
				case constants$3.COLORTYPE_GRAYSCALE: {
					let grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
					if (options.bitDepth === 8) {
						outData[outIndex] = grayscale;
						if (outHasAlpha) outData[outIndex + 1] = rgba.alpha;
					} else {
						outData.writeUInt16BE(grayscale, outIndex);
						if (outHasAlpha) outData.writeUInt16BE(rgba.alpha, outIndex + 2);
					}
					break;
				}
				default: throw new Error("unrecognised color Type " + options.colorType);
			}
			inIndex += inBpp;
			outIndex += outBpp;
		}
		return outData;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/filter-pack.js
var require_filter_pack = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let paethPredictor = require_paeth_predictor();
	function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
		for (let x = 0; x < byteWidth; x++) rawData[rawPos + x] = pxData[pxPos + x];
	}
	function filterSumNone(pxData, pxPos, byteWidth) {
		let sum = 0;
		let length = pxPos + byteWidth;
		for (let i = pxPos; i < length; i++) sum += Math.abs(pxData[i]);
		return sum;
	}
	function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let val = pxData[pxPos + x] - left;
			rawData[rawPos + x] = val;
		}
	}
	function filterSumSub(pxData, pxPos, byteWidth, bpp) {
		let sum = 0;
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let val = pxData[pxPos + x] - left;
			sum += Math.abs(val);
		}
		return sum;
	}
	function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {
		for (let x = 0; x < byteWidth; x++) {
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let val = pxData[pxPos + x] - up;
			rawData[rawPos + x] = val;
		}
	}
	function filterSumUp(pxData, pxPos, byteWidth) {
		let sum = 0;
		let length = pxPos + byteWidth;
		for (let x = pxPos; x < length; x++) {
			let up = pxPos > 0 ? pxData[x - byteWidth] : 0;
			let val = pxData[x] - up;
			sum += Math.abs(val);
		}
		return sum;
	}
	function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let val = pxData[pxPos + x] - (left + up >> 1);
			rawData[rawPos + x] = val;
		}
	}
	function filterSumAvg(pxData, pxPos, byteWidth, bpp) {
		let sum = 0;
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let val = pxData[pxPos + x] - (left + up >> 1);
			sum += Math.abs(val);
		}
		return sum;
	}
	function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
			let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
			rawData[rawPos + x] = val;
		}
	}
	function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
		let sum = 0;
		for (let x = 0; x < byteWidth; x++) {
			let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
			let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
			let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
			let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
			sum += Math.abs(val);
		}
		return sum;
	}
	let filters = {
		0: filterNone,
		1: filterSub,
		2: filterUp,
		3: filterAvg,
		4: filterPaeth
	};
	let filterSums = {
		0: filterSumNone,
		1: filterSumSub,
		2: filterSumUp,
		3: filterSumAvg,
		4: filterSumPaeth
	};
	module.exports = function(pxData, width, height, options, bpp) {
		let filterTypes;
		if (!("filterType" in options) || options.filterType === -1) filterTypes = [
			0,
			1,
			2,
			3,
			4
		];
		else if (typeof options.filterType === "number") filterTypes = [options.filterType];
		else throw new Error("unrecognised filter types");
		if (options.bitDepth === 16) bpp *= 2;
		let byteWidth = width * bpp;
		let rawPos = 0;
		let pxPos = 0;
		let rawData = Buffer.alloc((byteWidth + 1) * height);
		let sel = filterTypes[0];
		for (let y = 0; y < height; y++) {
			if (filterTypes.length > 1) {
				let min = Infinity;
				for (let i = 0; i < filterTypes.length; i++) {
					let sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
					if (sum < min) {
						sel = filterTypes[i];
						min = sum;
					}
				}
			}
			rawData[rawPos] = sel;
			rawPos++;
			filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
			rawPos += byteWidth;
			pxPos += byteWidth;
		}
		return rawData;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/packer.js
var require_packer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let constants$2 = require_constants();
	let CrcStream = require_crc();
	let bitPacker = require_bitpacker();
	let filter = require_filter_pack();
	let zlib$3 = __require("zlib");
	let Packer$3 = module.exports = function(options) {
		this._options = options;
		options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
		options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
		options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
		options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
		options.deflateFactory = options.deflateFactory || zlib$3.createDeflate;
		options.bitDepth = options.bitDepth || 8;
		options.colorType = typeof options.colorType === "number" ? options.colorType : constants$2.COLORTYPE_COLOR_ALPHA;
		options.inputColorType = typeof options.inputColorType === "number" ? options.inputColorType : constants$2.COLORTYPE_COLOR_ALPHA;
		if ([
			constants$2.COLORTYPE_GRAYSCALE,
			constants$2.COLORTYPE_COLOR,
			constants$2.COLORTYPE_COLOR_ALPHA,
			constants$2.COLORTYPE_ALPHA
		].indexOf(options.colorType) === -1) throw new Error("option color type:" + options.colorType + " is not supported at present");
		if ([
			constants$2.COLORTYPE_GRAYSCALE,
			constants$2.COLORTYPE_COLOR,
			constants$2.COLORTYPE_COLOR_ALPHA,
			constants$2.COLORTYPE_ALPHA
		].indexOf(options.inputColorType) === -1) throw new Error("option input color type:" + options.inputColorType + " is not supported at present");
		if (options.bitDepth !== 8 && options.bitDepth !== 16) throw new Error("option bit depth:" + options.bitDepth + " is not supported at present");
	};
	Packer$3.prototype.getDeflateOptions = function() {
		return {
			chunkSize: this._options.deflateChunkSize,
			level: this._options.deflateLevel,
			strategy: this._options.deflateStrategy
		};
	};
	Packer$3.prototype.createDeflate = function() {
		return this._options.deflateFactory(this.getDeflateOptions());
	};
	Packer$3.prototype.filterData = function(data, width, height) {
		let packedData = bitPacker(data, width, height, this._options);
		let bpp = constants$2.COLORTYPE_TO_BPP_MAP[this._options.colorType];
		return filter(packedData, width, height, this._options, bpp);
	};
	Packer$3.prototype._packChunk = function(type, data) {
		let len = data ? data.length : 0;
		let buf = Buffer.alloc(len + 12);
		buf.writeUInt32BE(len, 0);
		buf.writeUInt32BE(type, 4);
		if (data) data.copy(buf, 8);
		buf.writeInt32BE(CrcStream.crc32(buf.slice(4, buf.length - 4)), buf.length - 4);
		return buf;
	};
	Packer$3.prototype.packGAMA = function(gamma) {
		let buf = Buffer.alloc(4);
		buf.writeUInt32BE(Math.floor(gamma * constants$2.GAMMA_DIVISION), 0);
		return this._packChunk(constants$2.TYPE_gAMA, buf);
	};
	Packer$3.prototype.packIHDR = function(width, height) {
		let buf = Buffer.alloc(13);
		buf.writeUInt32BE(width, 0);
		buf.writeUInt32BE(height, 4);
		buf[8] = this._options.bitDepth;
		buf[9] = this._options.colorType;
		buf[10] = 0;
		buf[11] = 0;
		buf[12] = 0;
		return this._packChunk(constants$2.TYPE_IHDR, buf);
	};
	Packer$3.prototype.packIDAT = function(data) {
		return this._packChunk(constants$2.TYPE_IDAT, data);
	};
	Packer$3.prototype.packIEND = function() {
		return this._packChunk(constants$2.TYPE_IEND, null);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/packer-async.js
var require_packer_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let util$2 = __require("util");
	let Stream$1 = __require("stream");
	let constants$1 = require_constants();
	let Packer$2 = require_packer();
	let PackerAsync = module.exports = function(opt) {
		Stream$1.call(this);
		this._packer = new Packer$2(opt || {});
		this._deflate = this._packer.createDeflate();
		this.readable = true;
	};
	util$2.inherits(PackerAsync, Stream$1);
	PackerAsync.prototype.pack = function(data, width, height, gamma) {
		this.emit("data", Buffer.from(constants$1.PNG_SIGNATURE));
		this.emit("data", this._packer.packIHDR(width, height));
		if (gamma) this.emit("data", this._packer.packGAMA(gamma));
		let filteredData = this._packer.filterData(data, width, height);
		this._deflate.on("error", this.emit.bind(this, "error"));
		this._deflate.on("data", function(compressedData) {
			this.emit("data", this._packer.packIDAT(compressedData));
		}.bind(this));
		this._deflate.on("end", function() {
			this.emit("data", this._packer.packIEND());
			this.emit("end");
		}.bind(this));
		this._deflate.end(filteredData);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/sync-inflate.js
var require_sync_inflate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let assert = __require("assert").ok;
	let zlib$2 = __require("zlib");
	let util$1 = __require("util");
	let kMaxLength = __require("buffer").kMaxLength;
	function Inflate(opts) {
		if (!(this instanceof Inflate)) return new Inflate(opts);
		if (opts && opts.chunkSize < zlib$2.Z_MIN_CHUNK) opts.chunkSize = zlib$2.Z_MIN_CHUNK;
		zlib$2.Inflate.call(this, opts);
		this._offset = this._offset === void 0 ? this._outOffset : this._offset;
		this._buffer = this._buffer || this._outBuffer;
		if (opts && opts.maxLength != null) this._maxLength = opts.maxLength;
	}
	function createInflate(opts) {
		return new Inflate(opts);
	}
	function _close(engine, callback) {
		if (callback) process.nextTick(callback);
		if (!engine._handle) return;
		engine._handle.close();
		engine._handle = null;
	}
	Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
		if (typeof asyncCb === "function") return zlib$2.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
		let self = this;
		let availInBefore = chunk && chunk.length;
		let availOutBefore = this._chunkSize - this._offset;
		let leftToInflate = this._maxLength;
		let inOff = 0;
		let buffers = [];
		let nread = 0;
		let error;
		this.on("error", function(err) {
			error = err;
		});
		function handleChunk(availInAfter, availOutAfter) {
			if (self._hadError) return;
			let have = availOutBefore - availOutAfter;
			assert(have >= 0, "have should not go down");
			if (have > 0) {
				let out = self._buffer.slice(self._offset, self._offset + have);
				self._offset += have;
				if (out.length > leftToInflate) out = out.slice(0, leftToInflate);
				buffers.push(out);
				nread += out.length;
				leftToInflate -= out.length;
				if (leftToInflate === 0) return false;
			}
			if (availOutAfter === 0 || self._offset >= self._chunkSize) {
				availOutBefore = self._chunkSize;
				self._offset = 0;
				self._buffer = Buffer.allocUnsafe(self._chunkSize);
			}
			if (availOutAfter === 0) {
				inOff += availInBefore - availInAfter;
				availInBefore = availInAfter;
				return true;
			}
			return false;
		}
		assert(this._handle, "zlib binding closed");
		let res;
		do {
			res = this._handle.writeSync(flushFlag, chunk, inOff, availInBefore, this._buffer, this._offset, availOutBefore);
			res = res || this._writeState;
		} while (!this._hadError && handleChunk(res[0], res[1]));
		if (this._hadError) throw error;
		if (nread >= kMaxLength) {
			_close(this);
			throw new RangeError("Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes");
		}
		let buf = Buffer.concat(buffers, nread);
		_close(this);
		return buf;
	};
	util$1.inherits(Inflate, zlib$2.Inflate);
	function zlibBufferSync(engine, buffer) {
		if (typeof buffer === "string") buffer = Buffer.from(buffer);
		if (!(buffer instanceof Buffer)) throw new TypeError("Not a string or buffer");
		let flushFlag = engine._finishFlushFlag;
		if (flushFlag == null) flushFlag = zlib$2.Z_FINISH;
		return engine._processChunk(buffer, flushFlag);
	}
	function inflateSync$1(buffer, opts) {
		return zlibBufferSync(new Inflate(opts), buffer);
	}
	module.exports = exports = inflateSync$1;
	exports.Inflate = Inflate;
	exports.createInflate = createInflate;
	exports.inflateSync = inflateSync$1;
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/sync-reader.js
var require_sync_reader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let SyncReader$2 = module.exports = function(buffer) {
		this._buffer = buffer;
		this._reads = [];
	};
	SyncReader$2.prototype.read = function(length, callback) {
		this._reads.push({
			length: Math.abs(length),
			allowLess: length < 0,
			func: callback
		});
	};
	SyncReader$2.prototype.process = function() {
		while (this._reads.length > 0 && this._buffer.length) {
			let read = this._reads[0];
			if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {
				this._reads.shift();
				let buf = this._buffer;
				this._buffer = buf.slice(read.length);
				read.func.call(this, buf.slice(0, read.length));
			} else break;
		}
		if (this._reads.length > 0) return /* @__PURE__ */ new Error("There are some read requests waitng on finished stream");
		if (this._buffer.length > 0) return /* @__PURE__ */ new Error("unrecognised content at end of stream");
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse-sync.js
var require_filter_parse_sync = /* @__PURE__ */ __commonJSMin(((exports) => {
	let SyncReader$1 = require_sync_reader();
	let Filter = require_filter_parse();
	exports.process = function(inBuffer, bitmapInfo) {
		let outBuffers = [];
		let reader = new SyncReader$1(inBuffer);
		new Filter(bitmapInfo, {
			read: reader.read.bind(reader),
			write: function(bufferPart) {
				outBuffers.push(bufferPart);
			},
			complete: function() {}
		}).start();
		reader.process();
		return Buffer.concat(outBuffers);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/parser-sync.js
var require_parser_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let hasSyncZlib$1 = true;
	let zlib$1 = __require("zlib");
	let inflateSync = require_sync_inflate();
	if (!zlib$1.deflateSync) hasSyncZlib$1 = false;
	let SyncReader = require_sync_reader();
	let FilterSync = require_filter_parse_sync();
	let Parser$1 = require_parser();
	let bitmapper = require_bitmapper();
	let formatNormaliser = require_format_normaliser();
	module.exports = function(buffer, options) {
		if (!hasSyncZlib$1) throw new Error("To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0");
		let err;
		function handleError(_err_) {
			err = _err_;
		}
		let metaData;
		function handleMetaData(_metaData_) {
			metaData = _metaData_;
		}
		function handleTransColor(transColor) {
			metaData.transColor = transColor;
		}
		function handlePalette(palette) {
			metaData.palette = palette;
		}
		function handleSimpleTransparency() {
			metaData.alpha = true;
		}
		let gamma;
		function handleGamma(_gamma_) {
			gamma = _gamma_;
		}
		let inflateDataList = [];
		function handleInflateData(inflatedData$1) {
			inflateDataList.push(inflatedData$1);
		}
		let reader = new SyncReader(buffer);
		new Parser$1(options, {
			read: reader.read.bind(reader),
			error: handleError,
			metadata: handleMetaData,
			gamma: handleGamma,
			palette: handlePalette,
			transColor: handleTransColor,
			inflateData: handleInflateData,
			simpleTransparency: handleSimpleTransparency
		}).start();
		reader.process();
		if (err) throw err;
		let inflateData = Buffer.concat(inflateDataList);
		inflateDataList.length = 0;
		let inflatedData;
		if (metaData.interlace) inflatedData = zlib$1.inflateSync(inflateData);
		else {
			let imageSize = ((metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1) * metaData.height;
			inflatedData = inflateSync(inflateData, {
				chunkSize: imageSize,
				maxLength: imageSize
			});
		}
		inflateData = null;
		if (!inflatedData || !inflatedData.length) throw new Error("bad png - invalid inflate data response");
		let unfilteredData = FilterSync.process(inflatedData, metaData);
		inflateData = null;
		let bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
		unfilteredData = null;
		metaData.data = formatNormaliser(bitmapData, metaData);
		metaData.gamma = gamma || 0;
		return metaData;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/packer-sync.js
var require_packer_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let hasSyncZlib = true;
	let zlib = __require("zlib");
	if (!zlib.deflateSync) hasSyncZlib = false;
	let constants = require_constants();
	let Packer$1 = require_packer();
	module.exports = function(metaData, opt) {
		if (!hasSyncZlib) throw new Error("To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0");
		let packer = new Packer$1(opt || {});
		let chunks = [];
		chunks.push(Buffer.from(constants.PNG_SIGNATURE));
		chunks.push(packer.packIHDR(metaData.width, metaData.height));
		if (metaData.gamma) chunks.push(packer.packGAMA(metaData.gamma));
		let filteredData = packer.filterData(metaData.data, metaData.width, metaData.height);
		let compressedData = zlib.deflateSync(filteredData, packer.getDeflateOptions());
		filteredData = null;
		if (!compressedData || !compressedData.length) throw new Error("bad png - invalid compressed data response");
		chunks.push(packer.packIDAT(compressedData));
		chunks.push(packer.packIEND());
		return Buffer.concat(chunks);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/png-sync.js
var require_png_sync = /* @__PURE__ */ __commonJSMin(((exports) => {
	let parse = require_parser_sync();
	let pack = require_packer_sync();
	exports.read = function(buffer, options) {
		return parse(buffer, options || {});
	};
	exports.write = function(png, options) {
		return pack(png, options);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pngjs@5.0.0/node_modules/pngjs/lib/png.js
var require_png$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	let util = __require("util");
	let Stream = __require("stream");
	let Parser = require_parser_async();
	let Packer = require_packer_async();
	let PNGSync = require_png_sync();
	let PNG$1 = exports.PNG = function(options) {
		Stream.call(this);
		options = options || {};
		this.width = options.width | 0;
		this.height = options.height | 0;
		this.data = this.width > 0 && this.height > 0 ? Buffer.alloc(4 * this.width * this.height) : null;
		if (options.fill && this.data) this.data.fill(0);
		this.gamma = 0;
		this.readable = this.writable = true;
		this._parser = new Parser(options);
		this._parser.on("error", this.emit.bind(this, "error"));
		this._parser.on("close", this._handleClose.bind(this));
		this._parser.on("metadata", this._metadata.bind(this));
		this._parser.on("gamma", this._gamma.bind(this));
		this._parser.on("parsed", function(data) {
			this.data = data;
			this.emit("parsed", data);
		}.bind(this));
		this._packer = new Packer(options);
		this._packer.on("data", this.emit.bind(this, "data"));
		this._packer.on("end", this.emit.bind(this, "end"));
		this._parser.on("close", this._handleClose.bind(this));
		this._packer.on("error", this.emit.bind(this, "error"));
	};
	util.inherits(PNG$1, Stream);
	PNG$1.sync = PNGSync;
	PNG$1.prototype.pack = function() {
		if (!this.data || !this.data.length) {
			this.emit("error", "No data provided");
			return this;
		}
		process.nextTick(function() {
			this._packer.pack(this.data, this.width, this.height, this.gamma);
		}.bind(this));
		return this;
	};
	PNG$1.prototype.parse = function(data, callback) {
		if (callback) {
			let onParsed, onError;
			onParsed = function(parsedData) {
				this.removeListener("error", onError);
				this.data = parsedData;
				callback(null, this);
			}.bind(this);
			onError = function(err) {
				this.removeListener("parsed", onParsed);
				callback(err, null);
			}.bind(this);
			this.once("parsed", onParsed);
			this.once("error", onError);
		}
		this.end(data);
		return this;
	};
	PNG$1.prototype.write = function(data) {
		this._parser.write(data);
		return true;
	};
	PNG$1.prototype.end = function(data) {
		this._parser.end(data);
	};
	PNG$1.prototype._metadata = function(metadata) {
		this.width = metadata.width;
		this.height = metadata.height;
		this.emit("metadata", metadata);
	};
	PNG$1.prototype._gamma = function(gamma) {
		this.gamma = gamma;
	};
	PNG$1.prototype._handleClose = function() {
		if (!this._parser.writable && !this._packer.readable) this.emit("close");
	};
	PNG$1.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) {
		srcX |= 0;
		srcY |= 0;
		width |= 0;
		height |= 0;
		deltaX |= 0;
		deltaY |= 0;
		if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) throw new Error("bitblt reading outside image");
		if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) throw new Error("bitblt writing outside image");
		for (let y = 0; y < height; y++) src.data.copy(dst.data, (deltaY + y) * dst.width + deltaX << 2, (srcY + y) * src.width + srcX << 2, (srcY + y) * src.width + srcX + width << 2);
	};
	PNG$1.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) {
		PNG$1.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
		return this;
	};
	PNG$1.adjustGamma = function(src) {
		if (src.gamma) {
			for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
				let idx = src.width * y + x << 2;
				for (let i = 0; i < 3; i++) {
					let sample = src.data[idx + i] / 255;
					sample = Math.pow(sample, 1 / 2.2 / src.gamma);
					src.data[idx + i] = Math.round(sample * 255);
				}
			}
			src.gamma = 0;
		}
	};
	PNG$1.prototype.adjustGamma = function() {
		PNG$1.adjustGamma(this);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	function hex2rgba(hex) {
		if (typeof hex === "number") hex = hex.toString();
		if (typeof hex !== "string") throw new Error("Color should be defined as hex string");
		let hexCode = hex.slice().replace("#", "").split("");
		if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) throw new Error("Invalid hex color: " + hex);
		if (hexCode.length === 3 || hexCode.length === 4) hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
			return [c, c];
		}));
		if (hexCode.length === 6) hexCode.push("F", "F");
		const hexValue = parseInt(hexCode.join(""), 16);
		return {
			r: hexValue >> 24 & 255,
			g: hexValue >> 16 & 255,
			b: hexValue >> 8 & 255,
			a: hexValue & 255,
			hex: "#" + hexCode.slice(0, 6).join("")
		};
	}
	exports.getOptions = function getOptions(options) {
		if (!options) options = {};
		if (!options.color) options.color = {};
		const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
		const width = options.width && options.width >= 21 ? options.width : void 0;
		const scale = options.scale || 4;
		return {
			width,
			scale: width ? 4 : scale,
			margin,
			color: {
				dark: hex2rgba(options.color.dark || "#000000ff"),
				light: hex2rgba(options.color.light || "#ffffffff")
			},
			type: options.type,
			rendererOpts: options.rendererOpts || {}
		};
	};
	exports.getScale = function getScale(qrSize, opts) {
		return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
	};
	exports.getImageWidth = function getImageWidth(qrSize, opts) {
		const scale = exports.getScale(qrSize, opts);
		return Math.floor((qrSize + opts.margin * 2) * scale);
	};
	exports.qrToImageData = function qrToImageData(imgData, qr, opts) {
		const size = qr.modules.size;
		const data = qr.modules.data;
		const scale = exports.getScale(size, opts);
		const symbolSize = Math.floor((size + opts.margin * 2) * scale);
		const scaledMargin = opts.margin * scale;
		const palette = [opts.color.light, opts.color.dark];
		for (let i = 0; i < symbolSize; i++) for (let j = 0; j < symbolSize; j++) {
			let posDst = (i * symbolSize + j) * 4;
			let pxColor = opts.color.light;
			if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
				const iSrc = Math.floor((i - scaledMargin) / scale);
				const jSrc = Math.floor((j - scaledMargin) / scale);
				pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
			}
			imgData[posDst++] = pxColor.r;
			imgData[posDst++] = pxColor.g;
			imgData[posDst++] = pxColor.b;
			imgData[posDst] = pxColor.a;
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/png.js
var require_png = /* @__PURE__ */ __commonJSMin(((exports) => {
	const fs = __require("fs");
	const PNG = require_png$1().PNG;
	const Utils$3 = require_utils();
	exports.render = function render$1(qrData, options) {
		const opts = Utils$3.getOptions(options);
		const pngOpts = opts.rendererOpts;
		const size = Utils$3.getImageWidth(qrData.modules.size, opts);
		pngOpts.width = size;
		pngOpts.height = size;
		const pngImage = new PNG(pngOpts);
		Utils$3.qrToImageData(pngImage.data, qrData, opts);
		return pngImage;
	};
	exports.renderToDataURL = function renderToDataURL(qrData, options, cb) {
		if (typeof cb === "undefined") {
			cb = options;
			options = void 0;
		}
		exports.renderToBuffer(qrData, options, function(err, output) {
			if (err) cb(err);
			let url = "data:image/png;base64,";
			url += output.toString("base64");
			cb(null, url);
		});
	};
	exports.renderToBuffer = function renderToBuffer(qrData, options, cb) {
		if (typeof cb === "undefined") {
			cb = options;
			options = void 0;
		}
		const png = exports.render(qrData, options);
		const buffer = [];
		png.on("error", cb);
		png.on("data", function(data) {
			buffer.push(data);
		});
		png.on("end", function() {
			cb(null, Buffer.concat(buffer));
		});
		png.pack();
	};
	exports.renderToFile = function renderToFile(path, qrData, options, cb) {
		if (typeof cb === "undefined") {
			cb = options;
			options = void 0;
		}
		let called = false;
		const done = (...args) => {
			if (called) return;
			called = true;
			cb.apply(null, args);
		};
		const stream = fs.createWriteStream(path);
		stream.on("error", done);
		stream.on("close", done);
		exports.renderToFileStream(stream, qrData, options);
	};
	exports.renderToFileStream = function renderToFileStream(stream, qrData, options) {
		exports.render(qrData, options).pack().pipe(stream);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/utf8.js
var require_utf8 = /* @__PURE__ */ __commonJSMin(((exports) => {
	const Utils$2 = require_utils();
	const BLOCK_CHAR = {
		WW: " ",
		WB: "▄",
		BB: "█",
		BW: "▀"
	};
	const INVERTED_BLOCK_CHAR = {
		BB: " ",
		BW: "▄",
		WW: "█",
		WB: "▀"
	};
	function getBlockChar(top, bottom, blocks) {
		if (top && bottom) return blocks.BB;
		if (top && !bottom) return blocks.BW;
		if (!top && bottom) return blocks.WB;
		return blocks.WW;
	}
	exports.render = function(qrData, options, cb) {
		const opts = Utils$2.getOptions(options);
		let blocks = BLOCK_CHAR;
		if (opts.color.dark.hex === "#ffffff" || opts.color.light.hex === "#000000") blocks = INVERTED_BLOCK_CHAR;
		const size = qrData.modules.size;
		const data = qrData.modules.data;
		let output = "";
		let hMargin = Array(size + opts.margin * 2 + 1).join(blocks.WW);
		hMargin = Array(opts.margin / 2 + 1).join(hMargin + "\n");
		const vMargin = Array(opts.margin + 1).join(blocks.WW);
		output += hMargin;
		for (let i = 0; i < size; i += 2) {
			output += vMargin;
			for (let j = 0; j < size; j++) {
				const topModule = data[i * size + j];
				const bottomModule = data[(i + 1) * size + j];
				output += getBlockChar(topModule, bottomModule, blocks);
			}
			output += vMargin + "\n";
		}
		output += hMargin.slice(0, -1);
		if (typeof cb === "function") cb(null, output);
		return output;
	};
	exports.renderToFile = function renderToFile(path, qrData, options, cb) {
		if (typeof cb === "undefined") {
			cb = options;
			options = void 0;
		}
		const fs$1 = __require("fs");
		const utf8 = exports.render(qrData, options);
		fs$1.writeFile(path, utf8, cb);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal/terminal.js
var require_terminal$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.render = function(qrData, options, cb) {
		const size = qrData.modules.size;
		const data = qrData.modules.data;
		const black = "\x1B[40m  \x1B[0m";
		const white = "\x1B[47m  \x1B[0m";
		let output = "";
		const hMargin = Array(size + 3).join(white);
		const vMargin = Array(2).join(white);
		output += hMargin + "\n";
		for (let i = 0; i < size; ++i) {
			output += white;
			for (let j = 0; j < size; j++) output += data[i * size + j] ? black : white;
			output += vMargin + "\n";
		}
		output += hMargin + "\n";
		if (typeof cb === "function") cb(null, output);
		return output;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal/terminal-small.js
var require_terminal_small = /* @__PURE__ */ __commonJSMin(((exports) => {
	const backgroundWhite = "\x1B[47m";
	const backgroundBlack = "\x1B[40m";
	const foregroundWhite = "\x1B[37m";
	const foregroundBlack = "\x1B[30m";
	const reset = "\x1B[0m";
	const lineSetupNormal = backgroundWhite + foregroundBlack;
	const lineSetupInverse = backgroundBlack + foregroundWhite;
	const createPalette = function(lineSetup, foregroundWhite$1, foregroundBlack$1) {
		return {
			"00": reset + " " + lineSetup,
			"01": reset + foregroundWhite$1 + "▄" + lineSetup,
			"02": reset + foregroundBlack$1 + "▄" + lineSetup,
			10: reset + foregroundWhite$1 + "▀" + lineSetup,
			11: " ",
			12: "▄",
			20: reset + foregroundBlack$1 + "▀" + lineSetup,
			21: "▀",
			22: "█"
		};
	};
	/**
	* Returns code for QR pixel
	* @param {boolean[][]} modules
	* @param {number} size
	* @param {number} x
	* @param {number} y
	* @return {'0' | '1' | '2'}
	*/
	const mkCodePixel = function(modules, size, x, y) {
		const sizePlus = size + 1;
		if (x >= sizePlus || y >= sizePlus || y < -1 || x < -1) return "0";
		if (x >= size || y >= size || y < 0 || x < 0) return "1";
		return modules[y * size + x] ? "2" : "1";
	};
	/**
	* Returns code for four QR pixels. Suitable as key in palette.
	* @param {boolean[][]} modules
	* @param {number} size
	* @param {number} x
	* @param {number} y
	* @return {keyof palette}
	*/
	const mkCode = function(modules, size, x, y) {
		return mkCodePixel(modules, size, x, y) + mkCodePixel(modules, size, x, y + 1);
	};
	exports.render = function(qrData, options, cb) {
		const size = qrData.modules.size;
		const data = qrData.modules.data;
		const inverse = !!(options && options.inverse);
		const lineSetup = options && options.inverse ? lineSetupInverse : lineSetupNormal;
		const palette = createPalette(lineSetup, inverse ? foregroundBlack : foregroundWhite, inverse ? foregroundWhite : foregroundBlack);
		const newLine = reset + "\n" + lineSetup;
		let output = lineSetup;
		for (let y = -1; y < size + 1; y += 2) {
			for (let x = -1; x < size; x++) output += palette[mkCode(data, size, x, y)];
			output += palette[mkCode(data, size, size, y)] + newLine;
		}
		output += reset;
		if (typeof cb === "function") cb(null, output);
		return output;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal.js
var require_terminal = /* @__PURE__ */ __commonJSMin(((exports) => {
	const big = require_terminal$1();
	const small = require_terminal_small();
	exports.render = function(qrData, options, cb) {
		if (options && options.small) return small.render(qrData, options, cb);
		return big.render(qrData, options, cb);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = /* @__PURE__ */ __commonJSMin(((exports) => {
	const Utils$1 = require_utils();
	function getColorAttrib(color, attrib) {
		const alpha = color.a / 255;
		const str = attrib + "=\"" + color.hex + "\"";
		return alpha < 1 ? str + " " + attrib + "-opacity=\"" + alpha.toFixed(2).slice(1) + "\"" : str;
	}
	function svgCmd(cmd, x, y) {
		let str = cmd + x;
		if (typeof y !== "undefined") str += " " + y;
		return str;
	}
	function qrToPath(data, size, margin) {
		let path = "";
		let moveBy = 0;
		let newRow = false;
		let lineLength = 0;
		for (let i = 0; i < data.length; i++) {
			const col = Math.floor(i % size);
			const row = Math.floor(i / size);
			if (!col && !newRow) newRow = true;
			if (data[i]) {
				lineLength++;
				if (!(i > 0 && col > 0 && data[i - 1])) {
					path += newRow ? svgCmd("M", col + margin, .5 + row + margin) : svgCmd("m", moveBy, 0);
					moveBy = 0;
					newRow = false;
				}
				if (!(col + 1 < size && data[i + 1])) {
					path += svgCmd("h", lineLength);
					lineLength = 0;
				}
			} else moveBy++;
		}
		return path;
	}
	exports.render = function render$1(qrData, options, cb) {
		const opts = Utils$1.getOptions(options);
		const size = qrData.modules.size;
		const data = qrData.modules.data;
		const qrcodesize = size + opts.margin * 2;
		const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + " d=\"M0 0h" + qrcodesize + "v" + qrcodesize + "H0z\"/>";
		const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + " d=\"" + qrToPath(data, size, opts.margin) + "\"/>";
		const viewBox = "viewBox=\"0 0 " + qrcodesize + " " + qrcodesize + "\"";
		const svgTag = "<svg xmlns=\"http://www.w3.org/2000/svg\" " + (!opts.width ? "" : "width=\"" + opts.width + "\" height=\"" + opts.width + "\" ") + viewBox + " shape-rendering=\"crispEdges\">" + bg + path + "</svg>\n";
		if (typeof cb === "function") cb(null, svgTag);
		return svgTag;
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/svg.js
var require_svg = /* @__PURE__ */ __commonJSMin(((exports) => {
	const svgTagRenderer = require_svg_tag();
	exports.render = svgTagRenderer.render;
	exports.renderToFile = function renderToFile(path, qrData, options, cb) {
		if (typeof cb === "undefined") {
			cb = options;
			options = void 0;
		}
		const fs$1 = __require("fs");
		const xmlStr = "<?xml version=\"1.0\" encoding=\"utf-8\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" + exports.render(qrData, options);
		fs$1.writeFile(path, xmlStr, cb);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = /* @__PURE__ */ __commonJSMin(((exports) => {
	const Utils = require_utils();
	function clearCanvas(ctx, canvas, size) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (!canvas.style) canvas.style = {};
		canvas.height = size;
		canvas.width = size;
		canvas.style.height = size + "px";
		canvas.style.width = size + "px";
	}
	function getCanvasElement() {
		try {
			return document.createElement("canvas");
		} catch (e) {
			throw new Error("You need to specify a canvas element");
		}
	}
	exports.render = function render$1(qrData, canvas, options) {
		let opts = options;
		let canvasEl = canvas;
		if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
			opts = canvas;
			canvas = void 0;
		}
		if (!canvas) canvasEl = getCanvasElement();
		opts = Utils.getOptions(opts);
		const size = Utils.getImageWidth(qrData.modules.size, opts);
		const ctx = canvasEl.getContext("2d");
		const image = ctx.createImageData(size, size);
		Utils.qrToImageData(image.data, qrData, opts);
		clearCanvas(ctx, canvasEl, size);
		ctx.putImageData(image, 0, 0);
		return canvasEl;
	};
	exports.renderToDataURL = function renderToDataURL(qrData, canvas, options) {
		let opts = options;
		if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
			opts = canvas;
			canvas = void 0;
		}
		if (!opts) opts = {};
		const canvasEl = exports.render(qrData, canvas, opts);
		const type = opts.type || "image/png";
		const rendererOpts = opts.rendererOpts || {};
		return canvasEl.toDataURL(type, rendererOpts.quality);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/browser.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports) => {
	const canPromise$1 = require_can_promise();
	const QRCode$1 = require_qrcode();
	const CanvasRenderer = require_canvas();
	const SvgRenderer$1 = require_svg_tag();
	function renderCanvas(renderFunc, canvas, text, opts, cb) {
		const args = [].slice.call(arguments, 1);
		const argsNum = args.length;
		const isLastArgCb = typeof args[argsNum - 1] === "function";
		if (!isLastArgCb && !canPromise$1()) throw new Error("Callback required as last argument");
		if (isLastArgCb) {
			if (argsNum < 2) throw new Error("Too few arguments provided");
			if (argsNum === 2) {
				cb = text;
				text = canvas;
				canvas = opts = void 0;
			} else if (argsNum === 3) if (canvas.getContext && typeof cb === "undefined") {
				cb = opts;
				opts = void 0;
			} else {
				cb = opts;
				opts = text;
				text = canvas;
				canvas = void 0;
			}
		} else {
			if (argsNum < 1) throw new Error("Too few arguments provided");
			if (argsNum === 1) {
				text = canvas;
				canvas = opts = void 0;
			} else if (argsNum === 2 && !canvas.getContext) {
				opts = text;
				text = canvas;
				canvas = void 0;
			}
			return new Promise(function(resolve, reject) {
				try {
					resolve(renderFunc(QRCode$1.create(text, opts), canvas, opts));
				} catch (e) {
					reject(e);
				}
			});
		}
		try {
			const data = QRCode$1.create(text, opts);
			cb(null, renderFunc(data, canvas, opts));
		} catch (e) {
			cb(e);
		}
	}
	exports.create = QRCode$1.create;
	exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
	exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
	exports.toString = renderCanvas.bind(null, function(data, _, opts) {
		return SvgRenderer$1.render(data, opts);
	});
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/server.js
var require_server = /* @__PURE__ */ __commonJSMin(((exports) => {
	const canPromise = require_can_promise();
	const QRCode = require_qrcode();
	const PngRenderer = require_png();
	const Utf8Renderer = require_utf8();
	const TerminalRenderer = require_terminal();
	const SvgRenderer = require_svg();
	function checkParams(text, opts, cb) {
		if (typeof text === "undefined") throw new Error("String required as first argument");
		if (typeof cb === "undefined") {
			cb = opts;
			opts = {};
		}
		if (typeof cb !== "function") if (!canPromise()) throw new Error("Callback required as last argument");
		else {
			opts = cb || {};
			cb = null;
		}
		return {
			opts,
			cb
		};
	}
	function getTypeFromFilename(path) {
		return path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
	}
	function getRendererFromType(type) {
		switch (type) {
			case "svg": return SvgRenderer;
			case "txt":
			case "utf8": return Utf8Renderer;
			case "png":
			case "image/png":
			default: return PngRenderer;
		}
	}
	function getStringRendererFromType(type) {
		switch (type) {
			case "svg": return SvgRenderer;
			case "terminal": return TerminalRenderer;
			case "utf8":
			default: return Utf8Renderer;
		}
	}
	function render(renderFunc, text, params) {
		if (!params.cb) return new Promise(function(resolve, reject) {
			try {
				return renderFunc(QRCode.create(text, params.opts), params.opts, function(err, data) {
					return err ? reject(err) : resolve(data);
				});
			} catch (e) {
				reject(e);
			}
		});
		try {
			return renderFunc(QRCode.create(text, params.opts), params.opts, params.cb);
		} catch (e) {
			params.cb(e);
		}
	}
	exports.create = QRCode.create;
	exports.toCanvas = require_browser().toCanvas;
	exports.toString = function toString(text, opts, cb) {
		const params = checkParams(text, opts, cb);
		return render(getStringRendererFromType(params.opts ? params.opts.type : void 0).render, text, params);
	};
	exports.toDataURL = function toDataURL(text, opts, cb) {
		const params = checkParams(text, opts, cb);
		return render(getRendererFromType(params.opts.type).renderToDataURL, text, params);
	};
	exports.toBuffer = function toBuffer(text, opts, cb) {
		const params = checkParams(text, opts, cb);
		return render(getRendererFromType(params.opts.type).renderToBuffer, text, params);
	};
	exports.toFile = function toFile(path, text, opts, cb) {
		if (typeof path !== "string" || !(typeof text === "string" || typeof text === "object")) throw new Error("Invalid argument");
		if (arguments.length < 3 && !canPromise()) throw new Error("Too few arguments provided");
		const params = checkParams(text, opts, cb);
		return render(getRendererFromType(params.opts.type || getTypeFromFilename(path)).renderToFile.bind(null, path), text, params);
	};
	exports.toFileStream = function toFileStream(stream, text, opts) {
		if (arguments.length < 2) throw new Error("Too few arguments provided");
		const params = checkParams(text, opts, stream.emit.bind(stream, "error"));
		render(getRendererFromType("png").renderToFileStream.bind(null, stream), text, params);
	};
}));

//#endregion
//#region ../../node_modules/.bun/qrcode@1.5.4/node_modules/qrcode/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_server();
}));

//#endregion
export default require_lib();

export {  };