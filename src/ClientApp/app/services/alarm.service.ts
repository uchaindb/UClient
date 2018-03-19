import { Injectable, Injector, isDevMode } from '@angular/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { ConfigurationService } from "./configuration.service";
import { EndpointFactory } from "./endpoint-factory.service";
import { Http, Headers, Response, RequestOptions } from "@angular/http";
import { LocalStoreManager } from './local-store-manager.service';
import { CryptographyService } from './cryptography.service';
import { NotificationService } from './notification.service';
import { AlertConfiguration } from '../models/alert.model';
import { AppTranslationService } from './app-translation.service';
import { ChainDbService } from './chain-db.service';
import { ListTablesRpcResponse } from '../models/chain-db.model';

@Injectable()
export class AlarmService {
    public static readonly DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS = "alert_config";

    translations: {
        chainForkMessage?: any,
        tableSchemaMessage?: any,
        cellDataModifyMessage?: any,
    } = {};

    constructor(
        private configurations: ConfigurationService,
        private localStoreManager: LocalStoreManager,
        private cryptoService: CryptographyService,
        private notificationService: NotificationService,
        private translationService: AppTranslationService,
        private chainService: ChainDbService,
    ) {
        let gT = (key: string, params?: Object) => translationService.getTranslation(key, params);
        this.translations.chainForkMessage = (params: Object) => gT("alert.service.ChainForkMessage", params);
        this.translations.tableSchemaMessage = (params: Object) => gT("alert.service.TableSchemaMessage", params);
        this.translations.cellDataModifyMessage = (params: Object) => gT("alert.service.CellDataModifyMessage", params);
    }

    getAlertConfigList(dbid: string): Observable<Array<AlertConfiguration>> {
        var alertList = this.localStoreManager.getData(AlarmService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS) as Array<AlertConfiguration> || [];
        var dblist = alertList.filter(_ => _.dbid == dbid);

        return Observable.of(dblist);
    }

    addAlertConfig(config: AlertConfiguration): void {
        var alertList = this.localStoreManager.getData(AlarmService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS) as Array<AlertConfiguration> || [];
        alertList.push(config);
        this.localStoreManager.savePermanentData(alertList, AlarmService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS);
    }

    removeAlertConfig(config: AlertConfiguration): void {
        var alertList = this.localStoreManager.getData(AlarmService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS) as Array<AlertConfiguration> || [];
        var idx = alertList
            .findIndex(_ => _.type == config.type
                && _.dbid == config.dbid
                && _.tableName == config.tableName
                && _.columnName == config.columnName
                && _.primaryKeyValue == config.primaryKeyValue
            );
        alertList.splice(idx, 1);
        this.localStoreManager.savePermanentData(alertList, AlarmService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS);
    }

    refreshAlerts(): Observable<boolean> {
        let alertList = this.localStoreManager.getData(AlarmService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS) as Array<AlertConfiguration> || [];
        let obsList = alertList
            .map(_ => this.generateAlertNotification(_));

        return Observable.forkJoin(obsList)
            .map(_ => {
                this.localStoreManager.savePermanentData(alertList, AlarmService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS);
                return true;
            });

    }

    private generateAlertNotification(alert: AlertConfiguration): Observable<any> {
        return this.chainService.getChainDb(alert.dbid)
            .map(db => {
                let result: Observable<any> = Observable.of({});

                if (alert.type == "chain-fork") {
                    // detect change if data exist
                    if (alert.data && alert.data.lastBlockId) {
                        result = result.concat(
                            this.chainService.getQueryChain(db, alert.data.lastBlockId)
                                .map(resp => {
                                    //console.log("detecting change", resp, alert.data);
                                    if (!(resp.Block && resp.Block.Hash == alert.data.lastBlockId && resp.Block.Height == alert.data.lastBlockHeight)) {
                                        this.notificationService.createNotification(this.translations.chainForkMessage(db), alert);
                                    }
                                }));
                    }

                    // update data using fresh server data
                    result = result.concat(this.chainService.getChainDbStatus(db)
                        .map(sts => {
                            alert.data = { lastBlockHeight: sts.Tail.Height, lastBlockId: sts.Tail.Hash };
                            //console.log("update data", sts);
                        }));
                } else if (alert.type == "table-schema") {
                    let query = this.chainService.getChainDbTableNames(db)
                        .map((resp: ListTablesRpcResponse) => resp.Tables.filter(_ => _.Name == alert.tableName)[0]);
                    // detect change if data exist
                    if (alert.data && alert.data.lastTransactionId) {
                        query = query
                            .map(table => {
                                if (!table) return null;
                                if (table.History.TransactionHash != alert.data.lastTransactionId) {
                                    let data = Object.assign({}, alert, table);
                                    this.notificationService.createNotification(this.translations.tableSchemaMessage(data), alert);
                                }
                                //console.log("generate noti.. from data", table);
                                return table;
                            });
                    }

                    // update data using fresh server data
                    query = query.map(table => {
                        if (!table) return null;
                        //console.log("update data", table);
                        alert.data = { lastTransactionId: table.History.TransactionHash };
                        return table;
                    })
                    result = result.concat(query);
                } else if (alert.type == "table-data-modify") {
                    // TODO: consider once again how this function implemented
                } else if (alert.type == "column-data-modify") {
                    // TODO: consider once again if this type is needed
                } else if (alert.type == "cell-data-modify") {
                    let query = this.chainService.getQueryCell(db, alert.tableName, alert.primaryKeyValue, alert.columnName, [alert.columnName])
                        .map(_ => _.transactions.slice(-1)[0].Hash);
                    // detect change if data exist
                    if (alert.data && alert.data.lastTransactionId) {
                        query = query
                            .map(hash => {
                                if (hash != alert.data.lastTransactionId) {
                                    let data = Object.assign({ hash: hash }, alert);
                                    this.notificationService.createNotification(this.translations.cellDataModifyMessage(data), alert);
                                }
                                return hash;
                            });
                    }

                    // update data using fresh server data
                    query = query.map(hash => {
                        alert.data = { lastTransactionId: hash };
                        return hash;
                    })
                    result = result.concat(query);
                }

                return result;
            })
            .concatAll();
    }

}
