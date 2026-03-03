var OPERATOR_NAMES = {
    15: 'charset',
    16: 'encoding',
    17: 'charStrings',
    18: 'private',
    19: 'subrs',
    20: 'defaultWidthX',
    21: 'nominalWidthX'
};
var OPERATOR_NAMES_ESCAPE = {
    30: 'ros'
};
var CffDict = /** @class */ (function () {
    function CffDict() {
        this.values = new Map();
    }
    CffDict.prototype.getNumber = function (key, fallback) {
        if (fallback === void 0) { fallback = 0; }
        var v = this.values.get(key);
        if (typeof v === 'number')
            return v;
        if (Array.isArray(v) && typeof v[0] === 'number')
            return v[0];
        return fallback;
    };
    CffDict.prototype.getArray = function (key) {
        var v = this.values.get(key);
        return Array.isArray(v) ? v : null;
    };
    CffDict.parse = function (bytes) {
        var _a, _b;
        var dict = new CffDict();
        var i = 0;
        var stack = [];
        while (i < bytes.length) {
            var b0 = bytes[i++];
            if (b0 <= 21) {
                var opName = (_a = OPERATOR_NAMES[b0]) !== null && _a !== void 0 ? _a : null;
                if (b0 === 12) {
                    var b1 = bytes[i++];
                    opName = (_b = OPERATOR_NAMES_ESCAPE[b1]) !== null && _b !== void 0 ? _b : null;
                }
                if (opName) {
                    var vals = stack.splice(0, stack.length);
                    if (vals.length === 1) {
                        dict.values.set(opName, vals[0]);
                    }
                    else if (vals.length > 1) {
                        dict.values.set(opName, vals);
                    }
                }
                else {
                    stack.splice(0, stack.length);
                }
            }
            else {
                var _c = CffDict.readNumber(bytes, i - 1), value = _c[0], next = _c[1];
                stack.push(value);
                i = next;
            }
        }
        return dict;
    };
    CffDict.readNumber = function (bytes, start) {
        var b0 = bytes[start];
        if (b0 >= 32 && b0 <= 246) {
            return [b0 - 139, start + 1];
        }
        if (b0 >= 247 && b0 <= 250) {
            var b1 = bytes[start + 1];
            return [(b0 - 247) * 256 + b1 + 108, start + 2];
        }
        if (b0 >= 251 && b0 <= 254) {
            var b1 = bytes[start + 1];
            return [-(b0 - 251) * 256 - b1 - 108, start + 2];
        }
        if (b0 === 28) {
            var b1 = bytes[start + 1];
            var b2 = bytes[start + 2];
            var v = (b1 << 8) | b2;
            if (v & 0x8000)
                v = v - 0x10000;
            return [v, start + 3];
        }
        if (b0 === 29) {
            var b1 = bytes[start + 1];
            var b2 = bytes[start + 2];
            var b3 = bytes[start + 3];
            var b4 = bytes[start + 4];
            var v = (b1 << 24) | (b2 << 16) | (b3 << 8) | b4;
            if (v & 0x80000000)
                v = v - 0x100000000;
            return [v, start + 5];
        }
        if (b0 === 30) {
            // Real number in DICT (nibbles)
            var num_1 = '';
            var i = start + 1;
            var done_1 = false;
            while (!done_1 && i < bytes.length) {
                var b = bytes[i++];
                var n1 = b >> 4;
                var n2 = b & 0x0f;
                [n1, n2].forEach(function (n) {
                    if (done_1)
                        return;
                    if (n === 0x0f) {
                        done_1 = true;
                        return;
                    }
                    if (n === 0x0a)
                        num_1 += '.';
                    else if (n === 0x0b)
                        num_1 += 'E';
                    else if (n === 0x0c)
                        num_1 += 'E-';
                    else if (n === 0x0e)
                        num_1 += '-';
                    else
                        num_1 += String(n);
                });
            }
            var v = parseFloat(num_1);
            return [isNaN(v) ? 0 : v, i];
        }
        return [0, start + 1];
    };
    return CffDict;
}());
export { CffDict };
