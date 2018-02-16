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
}
