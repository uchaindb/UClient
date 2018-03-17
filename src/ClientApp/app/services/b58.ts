import { ByteBase } from "../models/cryptography.model";

export class B58 {
    //got from: https://github.com/45678/Base58
    private static ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    private static ALPHABET_MAP = {};
    private static inited = false;

    private static initb58() {
        // only init once
        if (this.inited) return;

        let i = 0;
        while (i < this.ALPHABET.length) {
            this.ALPHABET_MAP[this.ALPHABET.charAt(i)] = i;
            i++;
        }
        this.inited = true;
    }

    static toB58(a: Uint8Array | ByteBase): string {
        if (!a) return null;
        let arr = a as Uint8Array;
        if (a instanceof ByteBase) {
            arr = a.data;
        }

        return this.to_b58(arr);
    }

    private static to_b58(buffer: Uint8Array): string {
        this.initb58();
        var carry, digits, j, i;
        if (buffer.length === 0) {
            return "";
        }
        i = void 0;
        j = void 0;
        digits = [0];
        i = 0;
        while (i < buffer.length) {
            j = 0;
            while (j < digits.length) {
                digits[j] <<= 8;
                j++;
            }
            digits[0] += buffer[i];
            carry = 0;
            j = 0;
            while (j < digits.length) {
                digits[j] += carry;
                carry = (digits[j] / 58) | 0;
                digits[j] %= 58;
                ++j;
            }
            while (carry) {
                digits.push(carry % 58);
                carry = (carry / 58) | 0;
            }
            i++;
        }
        i = 0;
        while (buffer[i] === 0 && i < buffer.length - 1) {
            digits.push(0);
            i++;
        }
        return digits.reverse().map((digit) => {
            return this.ALPHABET[digit];
        }).join("");
    }

    static fromB58(string: string): Uint8Array{
        this.initb58();
        var bytes, c, carry, j, i;
        if (string.length === 0) {
            return new (typeof Uint8Array !== "undefined" && Uint8Array !== null ? Uint8Array : Buffer)(0);
        }
        i = void 0;
        j = void 0;
        bytes = [0];
        i = 0;
        while (i < string.length) {
            c = string[i];
            if (!(c in this.ALPHABET_MAP)) {
                throw "Base58.decode received unacceptable input. Character '" + c + "' is not in the Base58 alphabet.";
            }
            j = 0;
            while (j < bytes.length) {
                bytes[j] *= 58;
                j++;
            }
            bytes[0] += this.ALPHABET_MAP[c];
            carry = 0;
            j = 0;
            while (j < bytes.length) {
                bytes[j] += carry;
                carry = bytes[j] >> 8;
                bytes[j] &= 0xff;
                ++j;
            }
            while (carry) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
            i++;
        }
        i = 0;
        while (string[i] === "1" && i < string.length - 1) {
            bytes.push(0);
            i++;
        }
        return new (typeof Uint8Array !== "undefined" && Uint8Array !== null ? Uint8Array : Buffer)(bytes.reverse());
    };
}
