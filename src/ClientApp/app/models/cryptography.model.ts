import { CryptographyService } from "../services/cryptography.service";
import { B58 } from "../services/b58";

export type Signature = { r: Uint8Array, s: Uint8Array };

export class ByteBase {
    constructor(a: ArrayLike<number>) {
        this.data = new Uint8Array(a);
    }

    toB58String(): string {
        return B58.toB58(this.data);
    }

    public data: Uint8Array;
}
export class PrivateKey extends ByteBase {
    constructor(a: ArrayLike<number>) {
        super(a);
    }

    static Parse(b58s: string): PrivateKey {
        return new PrivateKey(B58.fromB58(b58s));
    }
}

export class PublicKey extends ByteBase {
    constructor(a: ArrayLike<number>) {
        super(a);
    }

    toAddress(): Address {
        return CryptographyService.getAddress(this);
    }
}

export class Address extends ByteBase {
    constructor(a: ArrayLike<number>) {
        super(a);
    }
}

export type SavedKeyConfiguration = {
    name: string,
    key: string,
}

export type KeyConfiguration = {
    name: string,
    key: PrivateKey,
    displayKey?: string,
    address?: Address,
    pubkey?: PublicKey,
};
