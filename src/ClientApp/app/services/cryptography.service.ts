import { Injectable } from '@angular/core';
import { TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';
import { ec as EC } from 'elliptic';
import * as shajs from 'sha.js';
import * as RIPEMD160 from 'ripemd160';

export type Signature = { r: Uint8Array, s: Uint8Array };

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

    hash(data: string): Uint8Array {
        return this.hexStringToByte( shajs('sha256').update(data).digest('hex'));
    }

    sign(data: string | Uint8Array, privateKey: string): Signature {
        var hash = this.hexStringToByte(shajs('sha256').update(data).digest('hex'));

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
        var hash: Uint8Array = shajs('sha256').update(this.hexStringToByte(publicKey)).digest();
        var rip: Uint8Array = new RIPEMD160().update(hash).digest();
        return this.to_b58(rip);
    }

    validatePrivateKey(privateKey: string): boolean {
        if (privateKey.length != this.size * 2)
            return false;

        if ((privateKey.toLowerCase().match(/([0-9]|[a-f])/gim) || []).length != privateKey.length) {
            return false;
        }

        return true;
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

    unitTests() {
        var privKey = this.generateRandomPrivateKey();
        var pubKey = this.getPublicKey(privKey);
        var sig = this.sign("中文", privKey);
        var ret = this.verify("中文", pubKey, sig);
        //console.log(privKey, pubKey, sig, ret);
        console.log('%ctesting: general sign and verify process', 'color:blue',
            ret);

        console.log('%ctesting: #generateRandomPrivateKey should generate private key with right length', 'color:green',
            this.generateRandomPrivateKey().length == 64);

        let verifyCases = [
            {
                pub: "03ea01cb94bdaf0cd1c01b159d474f9604f4af35a3e2196f6bdfdb33b2aa4961fa",
                msg: "hello",
                r: "5331be791532d157df5b5620620d938bcb622ad02c81cfc184c460efdad18e69",
                s: "5480d77440c511e9ad02ea30d773cb54e88f8cbb069644aefa283957085f38b5",
            }, {
                pub: "03661b86d54eb3a8e7ea2399e0db36ab65753f95fff661da53ae0121278b881ad0",
                msg: "world",
                r: "b1e6ff4f40536fb7ed706b0f7567903cc227a5241a079fb86f3de51b8321c1e6",
                s: "90f37ad0c788848605c1653567935845f0d35a8a1a37174dcbbd235caac8e969",
            }, {
                pub: "03661b86d54eb3a8e7ea2399e0db36ab65753f95fff661da53ae0121278b881ad0",
                msg: "中文",
                r: "b8cba1ff42304d74d083e87706058f59cdd4f755b995926d2cd80a734c5a3c37",
                s: "e4583bfd4339ac762c1c91eee3782660a6baf62cd29e407eccd3da3e9de55a02",
            }];
        for (let i = 0; i < verifyCases.length; i++) {
            let c = verifyCases[i];
            console.log(`%ctesting: could verify message[${c.msg}] with given r and s through public key`, 'color:blue',
                this.verify(c.msg, c.pub, { r: this.hexStringToByte(c.r), s: this.hexStringToByte(c.s) }));
        }

        let addressCases = [
            {
                pub: "03ea01cb94bdaf0cd1c01b159d474f9604f4af35a3e2196f6bdfdb33b2aa4961fa",
                address: "Pz1YdSerVNjpLkuJj52ytPNWPKh",
            }, {
                pub: "03661b86d54eb3a8e7ea2399e0db36ab65753f95fff661da53ae0121278b881ad0",
                address: "44pzjeaz2TyPjdUjHhXELiBe2tCy",
            }];
        for (let i = 0; i < addressCases.length; i++) {
            let c = addressCases[i];
            console.log(`%ctesting: generating address [${c.address}]`, 'color:green',
                c.address == this.getAddress(c.pub));
        }
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

    toB58FromHex(str: string): string {
        return this.to_b58(this.hexStringToByte(str));
    }

    to_b58(buffer: Uint8Array): string {
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
