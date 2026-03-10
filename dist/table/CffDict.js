const OPERATOR_NAMES = {
    15: 'charset',
    16: 'encoding',
    17: 'charStrings',
    18: 'private',
    19: 'subrs',
    20: 'defaultWidthX',
    21: 'nominalWidthX',
    24: 'vstore'
};
const OPERATOR_NAMES_ESCAPE = {
    30: 'ros',
    36: 'fdArray',
    37: 'fdSelect'
};
export class CffDict {
    values = new Map();
    getNumber(key, fallback = 0) {
        const v = this.values.get(key);
        if (typeof v === 'number')
            return v;
        if (Array.isArray(v) && typeof v[0] === 'number')
            return v[0];
        return fallback;
    }
    getArray(key) {
        const v = this.values.get(key);
        return Array.isArray(v) ? v : null;
    }
    static parse(bytes) {
        const dict = new CffDict();
        let i = 0;
        const stack = [];
        while (i < bytes.length) {
            const b0 = bytes[i++];
            if (b0 <= 21 || b0 === 24) {
                let opName = OPERATOR_NAMES[b0] ?? null;
                if (b0 === 12) {
                    const b1 = bytes[i++];
                    opName = OPERATOR_NAMES_ESCAPE[b1] ?? null;
                }
                if (opName) {
                    const vals = stack.splice(0, stack.length);
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
                const [value, next] = CffDict.readNumber(bytes, i - 1);
                stack.push(value);
                i = next;
            }
        }
        return dict;
    }
    static readNumber(bytes, start) {
        const b0 = bytes[start];
        if (b0 >= 32 && b0 <= 246) {
            return [b0 - 139, start + 1];
        }
        if (b0 >= 247 && b0 <= 250) {
            const b1 = bytes[start + 1];
            return [(b0 - 247) * 256 + b1 + 108, start + 2];
        }
        if (b0 >= 251 && b0 <= 254) {
            const b1 = bytes[start + 1];
            return [-(b0 - 251) * 256 - b1 - 108, start + 2];
        }
        if (b0 === 28) {
            const b1 = bytes[start + 1];
            const b2 = bytes[start + 2];
            let v = (b1 << 8) | b2;
            if (v & 0x8000)
                v = v - 0x10000;
            return [v, start + 3];
        }
        if (b0 === 29) {
            const b1 = bytes[start + 1];
            const b2 = bytes[start + 2];
            const b3 = bytes[start + 3];
            const b4 = bytes[start + 4];
            let v = (b1 << 24) | (b2 << 16) | (b3 << 8) | b4;
            if (v & 0x80000000)
                v = v - 0x100000000;
            return [v, start + 5];
        }
        if (b0 === 30) {
            // Real number in DICT (nibbles)
            let num = '';
            let i = start + 1;
            let done = false;
            while (!done && i < bytes.length) {
                const b = bytes[i++];
                const n1 = b >> 4;
                const n2 = b & 0x0f;
                [n1, n2].forEach(n => {
                    if (done)
                        return;
                    if (n === 0x0f) {
                        done = true;
                        return;
                    }
                    if (n === 0x0a)
                        num += '.';
                    else if (n === 0x0b)
                        num += 'E';
                    else if (n === 0x0c)
                        num += 'E-';
                    else if (n === 0x0e)
                        num += '-';
                    else
                        num += String(n);
                });
            }
            const v = parseFloat(num);
            return [isNaN(v) ? 0 : v, i];
        }
        return [0, start + 1];
    }
}
