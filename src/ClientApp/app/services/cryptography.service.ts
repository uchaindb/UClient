import { Injectable, isDevMode } from '@angular/core';
import { TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';
import { ec as EC } from 'elliptic';
import * as shajs from 'sha.js';
import * as RIPEMD160 from 'ripemd160';
import { Signature, PrivateKey, PublicKey, Address, ByteBase } from '../models/cryptography.model';
import { B58 } from './b58';

interface BigInteger {
    toArray: () => number[];
}

interface KeyStore {
    sign: (a: Uint8Array) => { r: BigInteger, s: BigInteger };
    verify: (a: Uint8Array, sig: Signature) => boolean;
    getPublic: (ex: boolean, encoding: "utf8" | "ascii" | "hex") => Uint8Array;
}

interface Elliptic {
    keyFromPrivate: (a: Uint8Array) => KeyStore;
    keyFromPublic: (a: Uint8Array) => KeyStore;
}

@Injectable()
export class CryptographyService {

    private ec: Elliptic;
    size = 32;

    constructor() {
        this.ec = new EC('secp256k1');
    }

    generateRandomPrivateKey(): PrivateKey {
        var a = [];
        for (var i = 0; i < this.size; i++) {
            a.push(Math.floor(Math.random() * 256));
        }
        return new PrivateKey(a);
    }

    hash(data: string | Uint8Array): Uint8Array {
        return CryptographyService.hash(data);
    }
    static hash(data: string | Uint8Array): Uint8Array {
        return shajs('sha256').update(data).digest();
    }

    sign(data: string | Uint8Array, privateKey: PrivateKey): Signature {
        var hash = this.hash(data);

        let key = this.ec.keyFromPrivate(privateKey.data);
        var sig = key.sign(hash);
        return {
            r: new Uint8Array(sig.r.toArray()),
            s: new Uint8Array(sig.s.toArray()),
        };
    }

    verify(data: string | Uint8Array, publicKey: PublicKey, sig: Signature): boolean {
        var hash = this.hash(data);

        let key = this.ec.keyFromPublic(publicKey.data);
        return key.verify(hash, sig);
    }

    getPublicKey(privateKey: PrivateKey): PublicKey {
        let key = this.ec.keyFromPrivate(privateKey.data);
        return new PublicKey(key.getPublic(true, "ascii"));
    }

    static getAddress(publicKey: PublicKey): Address {
        var hash = this.hash(publicKey.data);
        var rip: Uint8Array = new RIPEMD160().update(hash).digest();
        return new Address(rip);
    }

    parsePrivateKey(keyString: string): PrivateKey {
        try {
            var a = PrivateKey.Parse(keyString);
            if (a.data.length != this.size) return null;
            return a;
        }
        catch (err) {
            isDevMode() && console.error("parse error", err);
            return null;
        }
    }

    private hexStringToByte(str: string) {
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
            this.generateRandomPrivateKey().data.length == this.size);

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
                this.verify(c.msg, new PublicKey(this.hexStringToByte(c.pub)), { r: this.hexStringToByte(c.r), s: this.hexStringToByte(c.s) }));
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
                c.address == B58.toB58(new PublicKey(this.hexStringToByte(c.pub)).toAddress().data));
        }
    }
}
