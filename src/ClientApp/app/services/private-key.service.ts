import { Injectable, Injector } from '@angular/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { ConfigurationService } from "./configuration.service";
import { EndpointFactory } from "./endpoint-factory.service";
import { Http, Headers, Response, RequestOptions } from "@angular/http";
import { LocalStoreManager } from './local-store-manager.service';
import { CryptographyService } from './cryptography.service';
import { NotificationService } from './notification.service';

export type KeyConfiguration = {
    name: string,
    key: string,
    address?: string,
};

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

    getKeyList(): Observable<Array<KeyConfiguration>> {
        var keyList = (this.localStoreManager.getData(PrivateKeyService.DBKEY_PRIVATE_KEY_DATA) as Array<KeyConfiguration> || [])
            .map(_ => ({
                name: _.name,
                key: _.key.slice(0, 6) + "..." + _.key.slice(-2),
                address: this.cryptoService.getAddress(this.cryptoService.getPublicKey(_.key)),
            }));

        return Observable.of(keyList);
    }

    getPrivateKey(config: KeyConfiguration): Observable<string> {
        return Observable.of(this.getPrivateKeyDirectly(config));
    }

    getPrivateKeyDirectly(config: KeyConfiguration): string {
        let keyList = (this.localStoreManager.getData(PrivateKeyService.DBKEY_PRIVATE_KEY_DATA) as Array<KeyConfiguration> || [])
        var idx = keyList
            .findIndex(_ => _.name == config.name && _.key.slice(0, 6) == config.key.slice(0, 6));
        var key = keyList[idx].key;

        return key;
    }

    addKey(config: KeyConfiguration): void {
        var keyList = this.localStoreManager.getData(PrivateKeyService.DBKEY_PRIVATE_KEY_DATA) as Array<KeyConfiguration> || [];
        if (keyList.findIndex(_ => _.name == config.name) > -1) return;
        if (!this.cryptoService.validatePrivateKey(config.key)) return;
        config.key = config.key.toLowerCase();

        keyList.push(config);
        this.localStoreManager.savePermanentData(keyList, PrivateKeyService.DBKEY_PRIVATE_KEY_DATA);
    }

    removeKey(config: KeyConfiguration): void {
        var keyList = this.localStoreManager.getData(PrivateKeyService.DBKEY_PRIVATE_KEY_DATA) as Array<KeyConfiguration> || [];
        var idx = keyList
            .findIndex(_ => _.name == config.name && _.key.slice(0, 6) == config.key.slice(0, 6));
        keyList.splice(idx, 1);
        this.localStoreManager.savePermanentData(keyList, PrivateKeyService.DBKEY_PRIVATE_KEY_DATA);
    }
}
