import { Injectable } from '@angular/core';
import { TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';
import { ec as EC } from 'elliptic';
import * as shajs from 'sha.js';

type Signature = { r: Uint8Array, s: Uint8Array };

@Injectable()
export class CryptographyService {

    private ec: any;
    size = 32;

    constructor() {
        this.ec = new EC('secp256k1');
        this.initb58();
    }

    generateRandomPrivateKey(): string {
        var a = [];
        for (var i = 0; i < this.size; i++) {
            a.push(Math.floor(Math.random() * 256));
        }
        return this.toHexString(a);
    }

    sign(data: string, privateKey: string): Signature {
        var hash = shajs('sha256').update(data).digest('hex');

        let key = this.ec.keyFromPrivate(this.hexStringToByte(privateKey));
        var sig = key.sign(hash);
        return {
            r: new Uint8Array(sig.r.toArray()),
            s: new Uint8Array(sig.s.toArray()),
        };
    }

    verify(data: string, publicKey: string, sig: Signature): boolean {
        var hash: Uint8Array = shajs('sha256').update(data).digest();

        let key = this.ec.keyFromPublic(this.hexStringToByte(publicKey));
        return key.verify(hash, sig);
    }

    getPublicKey(privateKey: string): string {
        let key = this.ec.keyFromPrivate(this.hexStringToByte(privateKey));
        var pubKey = key.getPublic();
        return key.getPublic(true, "hex");
    }

    getAddress(publicKey: string): string {
        var hash: Uint8Array = shajs('sha256').update(publicKey).digest();
        var cut = hash.slice(0, 20);
        return this.to_b58(cut);
    }

    private hexStringToByte(str) {
        if (!str) {
            return new Uint8Array(0);
        }

        var a = [];
        for (var i = 0, len = str.length; i < len; i += 2) {
            a.push(parseInt(str.substr(i, 2), 16));
        }

        return new Uint8Array(a);
    }

    private toHexString(byteArray) {
        return Array.from(byteArray, (byte: any) => {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }

    private test() {
        var privKey = this.generateRandomPrivateKey();
        var pubKey = this.getPublicKey(privKey);
        var sig = this.sign("中文", privKey);
        var ret = this.verify("中文", pubKey, sig);
        console.log(privKey, pubKey, sig, ret);
    }

    //got from: https://github.com/45678/Base58
    private ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    private ALPHABET_MAP = {};

    private initb58() {
        let i = 0;

        while (i < this.ALPHABET.length) {
            this.ALPHABET_MAP[this.ALPHABET.charAt(i)] = i;
            i++;
        }
    }

    to_b58(buffer: Uint8Array) :string{
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
        return digits.reverse().map((digit)=> {
            return this.ALPHABET[digit];
        }).join("");
    }

    from_b58(string: string) {
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
