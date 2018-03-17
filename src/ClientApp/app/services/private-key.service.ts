import { Injectable, Injector, isDevMode } from '@angular/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { ConfigurationService } from "./configuration.service";
import { EndpointFactory } from "./endpoint-factory.service";
import { Http, Headers, Response, RequestOptions } from "@angular/http";
import { LocalStoreManager } from './local-store-manager.service';
import { CryptographyService } from './cryptography.service';
import { NotificationService } from './notification.service';
import { KeyConfiguration, PrivateKey, SavedKeyConfiguration } from '../models/cryptography.model';

@Injectable()
export class PrivateKeyService extends EndpointFactory {
    private readonly _baseUrl: string = "";
    get baseUrl() { return this.configurations.baseUrl + this._baseUrl; }

    public static readonly DBKEY_PRIVATE_KEY_DATA = "private_keys";

    constructor(
        http: Http,
        configurations: ConfigurationService,
        injector: Injector,
        private localStoreManager: LocalStoreManager,
        private cryptoService: CryptographyService,
        private notificationService: NotificationService,
    ) {
        super(http, configurations, injector);
    }

    getKeyListFromStore(): Array<KeyConfiguration> {
        try {
            return (this.localStoreManager.getData(PrivateKeyService.DBKEY_PRIVATE_KEY_DATA) as Array<SavedKeyConfiguration> || [])
                .map<KeyConfiguration>(_ => ({ name: _.name, key: PrivateKey.Parse(_.key) }))
        }
        catch (err) {
            isDevMode() && console.error(err);
            return [];
        }
    }

    saveKeyListToStore(keyList: Array<KeyConfiguration>): void {
        var arr = keyList
            .map<SavedKeyConfiguration>(_ => ({
                name: _.name,
                key: _.key.toB58String(),
            }));
        this.localStoreManager.savePermanentData(arr, PrivateKeyService.DBKEY_PRIVATE_KEY_DATA);
    }

    getKeyList(): Observable<Array<KeyConfiguration>> {
        var keyList = this.getKeyListFromStore()
            .map<KeyConfiguration>(_ => ({
                name: _.name,
                key: _.key,
                displayKey: this.maskKey(_.key),
                address: this.cryptoService.getPublicKey(_.key).toAddress(),
                pubKey: this.cryptoService.getPublicKey(_.key),
            }));

        return Observable.of(keyList);
    }

    getPrivateKey(name: string): Observable<PrivateKey> {
        return Observable.of(this.getPrivateKeyDirectly(name));
    }

    getPrivateKeyDirectly(name: string): PrivateKey {
        let keyList = this.getKeyListFromStore();
        var idx = keyList
            .findIndex(_ => _.name == name);
        var key = keyList[idx].key;

        return key;
    }

    addKey(name: string, b58keystr: string): void {
        var keyList = this.getKeyListFromStore();
        if (keyList.findIndex(_ => _.name == name) > -1) return;
        let privateKey = this.cryptoService.parsePrivateKey(b58keystr);
        if (!privateKey) return;

        keyList.push({ name: name, key: privateKey });
        this.saveKeyListToStore(keyList);
    }

    removeKey(name: string): void {
        var keyList = this.getKeyListFromStore();
        var idx = keyList
            .findIndex(_ => _.name == name);
        keyList.splice(idx, 1);
        this.saveKeyListToStore(keyList);
    }

    private maskKey(privateKey: PrivateKey): string {
        if (!privateKey) return null;
        let key = privateKey.toB58String();
        if (!key) return null;
        return key.slice(0, 6) + "..." + key.slice(-2);
    }
}
