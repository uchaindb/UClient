﻿import { Injectable, Injector, isDevMode } from '@angular/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { ConfigurationService } from "./configuration.service";
import { EndpointFactory } from "./endpoint-factory.service";
import { Http, Headers, Response, RequestOptions } from "@angular/http";
import { LocalStoreManager } from './local-store-manager.service';
import { CryptographyService } from './cryptography.service';
import { NotificationService } from './notification.service';
import { AlarmConfiguration } from '../models/alarm.model';
import { AppTranslationService } from './app-translation.service';
import { ChainDbService } from './chain-db.service';
import { ListTablesRpcResponse } from '../models/chain-db.model';

@Injectable()
export class AlarmService {
    public static readonly DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS = "alarm_config";

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
        this.translations.chainForkMessage = (params: Object) => gT("alarm.service.ChainForkMessage", params);
        this.translations.tableSchemaMessage = (params: Object) => gT("alarm.service.TableSchemaMessage", params);
        this.translations.cellDataModifyMessage = (params: Object) => gT("alarm.service.CellDataModifyMessage", params);
    }

    private getSavedList(): Array<AlarmConfiguration> {
        return this.localStoreManager.getData(AlarmService.DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS) as Array<AlarmConfiguration> || [];
    }

    getConfigList(dbid: string): Observable<Array<AlarmConfiguration>> {
        var list = this.getSavedList();
        var dblist = list.filter(_ => _.dbid == dbid);

        return Observable.of(dblist);
    }

    addConfig(config: AlarmConfiguration): void {
        var list = this.getSavedList();
        list.push(config);
        this.localStoreManager.savePermanentData(list, AlarmService.DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS);
    }

    removeConfig(config: AlarmConfiguration): void {
        var list = this.getSavedList();
        var idx = list
            .findIndex(_ => _.type == config.type
                && _.dbid == config.dbid
                && _.tableName == config.tableName
                && _.columnName == config.columnName
                && _.primaryKeyValue == config.primaryKeyValue
            );
        list.splice(idx, 1);
        this.localStoreManager.savePermanentData(list, AlarmService.DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS);
    }

    refresh(): Observable<boolean> {
        var list = this.getSavedList();
        let obsList = list
            .map(_ => this.generateNotification(_));

        return Observable.forkJoin(obsList)
            .map(_ => {
                this.localStoreManager.savePermanentData(list, AlarmService.DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS);
                return true;
            });

    }

    private generateNotification(alarm: AlarmConfiguration): Observable<any> {
        return this.chainService.getChainDb(alarm.dbid)
            .map(db => {
                let result: Observable<any> = Observable.of({});

                if (alarm.type == "chain-fork") {
                    // detect change if data exist
                    if (alarm.data && alarm.data.lastBlockId) {
                        result = result.concat(
                            this.chainService.getQueryChain(db, alarm.data.lastBlockId)
                                .map(resp => {
                                    //console.log("detecting change", resp, alarm.data);
                                    if (!(resp.Block && resp.Block.Hash == alarm.data.lastBlockId && resp.Block.Height == alarm.data.lastBlockHeight)) {
                                        this.notificationService.createNotification(this.translations.chainForkMessage(db), alarm);
                                    }
                                }));
                    }

                    // update data using fresh server data
                    result = result.concat(this.chainService.getChainDbStatus(db)
                        .map(sts => {
                            alarm.data = { lastBlockHeight: sts.Tail.Height, lastBlockId: sts.Tail.Hash };
                            //console.log("update data", sts);
                        }));
                } else if (alarm.type == "table-schema") {
                    let query = this.chainService.getChainDbTableNames(db)
                        .map((resp: ListTablesRpcResponse) => resp.Tables.filter(_ => _.Name == alarm.tableName)[0]);
                    // detect change if data exist
                    if (alarm.data && alarm.data.lastTransactionId) {
                        query = query
                            .map(table => {
                                if (!table) return null;
                                if (table.History.TransactionHash != alarm.data.lastTransactionId) {
                                    let data = Object.assign({}, alarm, table);
                                    this.notificationService.createNotification(this.translations.tableSchemaMessage(data), alarm);
                                }
                                //console.log("generate noti.. from data", table);
                                return table;
                            });
                    }

                    // update data using fresh server data
                    query = query.map(table => {
                        if (!table) return null;
                        //console.log("update data", table);
                        alarm.data = { lastTransactionId: table.History.TransactionHash };
                        return table;
                    })
                    result = result.concat(query);
                } else if (alarm.type == "table-data-modify") {
                    // TODO: consider once again how this function implemented
                } else if (alarm.type == "column-data-modify") {
                    // TODO: consider once again if this type is needed
                } else if (alarm.type == "cell-data-modify") {
                    let query = this.chainService.getQueryCell(db, alarm.tableName, alarm.primaryKeyValue, alarm.columnName, [alarm.columnName])
                        .map(_ => _.transactions.slice(-1)[0].Hash);
                    // detect change if data exist
                    if (alarm.data && alarm.data.lastTransactionId) {
                        query = query
                            .map(hash => {
                                if (hash != alarm.data.lastTransactionId) {
                                    let data = Object.assign({ hash: hash }, alarm);
                                    this.notificationService.createNotification(this.translations.cellDataModifyMessage(data), alarm);
                                }
                                return hash;
                            });
                    }

                    // update data using fresh server data
                    query = query.map(hash => {
                        alarm.data = { lastTransactionId: hash };
                        return hash;
                    })
                    result = result.concat(query);
                }

                return result;
            })
            .concatAll();
    }
}