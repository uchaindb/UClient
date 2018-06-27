import { Injectable, Injector, isDevMode } from '@angular/core';
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
import { ListTablesRpcResponse, ChainDb, StatusRpcResponse } from '../models/chain-db.model';
import { observableToBeFn } from 'rxjs/testing/TestScheduler';
import { observeOn } from 'rxjs/operator/observeOn';
import { forEach } from '@angular/router/src/utils/collection';

@Injectable()
export class AlarmService {
    public static readonly DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS = "alarm_config";
    public static readonly DBKEY_CHAIN_DB_ALARM_LAST_REFRESH_TIME = "alarm_refresh_time";

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

    private findAlarmIndexInList(arr: Array<AlarmConfiguration>, alarm: AlarmConfiguration) {
        return arr.findIndex(
            (_) => _.type == alarm.type
                && _.tableName == alarm.tableName
                && _.columnName == alarm.columnName
                && _.dbid == alarm.dbid
                && _.primaryKeyValue == alarm.primaryKeyValue
        );
    }

    getConfigList(dbid: string): Observable<Array<AlarmConfiguration>> {
        var list = this.getSavedList();
        var dblist = list.filter(_ => _.dbid == dbid);

        return Observable.of(dblist);
    }

    addConfig(config: AlarmConfiguration): Observable<AlarmConfiguration> {
        return this.generateNotification([config])
            .map((array) => {
                var updatedConfig = array[0];
                var list = this.getSavedList();
                var index = this.findAlarmIndexInList(list, config);
                if (index == -1) {
                    list.push(updatedConfig);
                    this.localStoreManager.savePermanentData(list, AlarmService.DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS);
                }

                return updatedConfig;
            });
    }

    removeConfig(config: AlarmConfiguration): Observable<AlarmConfiguration> {
        var list = this.getSavedList();
        var idx = this.findAlarmIndexInList(list, config);
        var removedConfig = list.splice(idx, 1)[0];
        this.localStoreManager.savePermanentData(list, AlarmService.DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS);
        return Observable.of(removedConfig);
    }

    refresh(): Observable<boolean> {
        var list = this.getSavedList();
        return this.generateNotification(list)
            .map(_ => {
                this.localStoreManager.savePermanentData(_, AlarmService.DBKEY_CHAIN_DB_ALARM_CONFIGURATIONS);
                this.localStoreManager.savePermanentData(Date.now(), AlarmService.DBKEY_CHAIN_DB_ALARM_LAST_REFRESH_TIME);
                return true;
            });
    }

    getLastRefreshTime(): Date {
        var lastRefreshTimeStr = this.localStoreManager.getData(AlarmService.DBKEY_CHAIN_DB_ALARM_LAST_REFRESH_TIME);
        return lastRefreshTimeStr ? new Date(lastRefreshTimeStr) : null;
    }

    private generateNotification(alarms: Array<AlarmConfiguration>): Observable<Array<AlarmConfiguration>> {
        var dbArray = alarms
            .map(_ => _.dbid)
            .filter((v, i, a) => a.indexOf(v) === i);
        for (var i = 0; i < dbArray.length; i++) {
            let dbid = dbArray[i];
        }

        let obsList = dbArray
            .map(dbid => this.chainService.getChainDb(dbid)
                .map(db => (db && this.chainService.getChainDbStatus(db)
                    .map(sts => {
                        var als = alarms.filter(_ => _.dbid == dbid);
                        var alobsList: Array<Observable<AlarmConfiguration>> = [];
                        for (var i = 0; i < als.length; i++) {
                            let alarm = als[i];
                            if (alarm.data && alarm.data.lastBlockId && sts.Tail.Hash == alarm.data.lastBlockId) {
                                alobsList.push(Observable.of(alarm));
                                break;
                            }

                            if (alarm.type == "chain-fork") {
                                alobsList.push(this.updateChainForkAlarm(alarm, db, sts));
                            } else if (alarm.type == "table-schema") {
                                alobsList.push(this.updateTableSchemaAlarm(alarm, db, sts));
                            } else if (alarm.type == "table-data-modify") {
                                // TODO: consider once again how this function implemented
                            } else if (alarm.type == "column-data-modify") {
                                // TODO: consider once again if this type is needed
                            } else if (alarm.type == "cell-data-modify") {
                                alobsList.push(this.updateCellDataModifyAlarm(alarm, db, sts));
                            }
                            else {
                                alobsList.push(Observable.empty<AlarmConfiguration>());
                            }
                        }
                        return Observable.forkJoin(alobsList);
                    })
                    .concatAll() || Observable.empty<Array<AlarmConfiguration>>())
                )
                .concatAll()

            );
        return Observable.forkJoin(obsList)
            .map(_ => {
                //return [].concat.apply([], _);
                return _.reduce((a, b) => a.concat(b), []);
            });

    }

    private updateChainForkAlarm(alarm: AlarmConfiguration, db: ChainDb, sts: StatusRpcResponse): Observable<AlarmConfiguration> {
        let result: Observable<any> = Observable.empty();
        // detect change if data exist
        if (alarm.data && alarm.data.lastBlockId) {
            result = result.concat(this.chainService.getQueryChain(db, alarm.data.lastBlockId)
                .map(resp => {
                    //console.log("detecting change", resp, alarm.data);
                    if (!(resp.Block && resp.Block.Hash == alarm.data.lastBlockId && resp.Block.Height == alarm.data.lastBlockHeight)) {
                        this.notificationService.createNotification(this.translations.chainForkMessage(db), alarm);
                    }
                }));
        }
        // update data using fresh server data
        alarm.data = { lastBlockHeight: sts.Tail.Height, lastBlockId: sts.Tail.Hash };
        result = result.concat(Observable.of(alarm));
        return result;
    }

    private updateTableSchemaAlarm(alarm: AlarmConfiguration, db: ChainDb, sts: StatusRpcResponse): Observable<AlarmConfiguration> {
        let query: Observable<any> = this.chainService.getChainDbTableNames(db)
            .map((resp: ListTablesRpcResponse) => resp.Tables.filter(_ => _.Name == alarm.tableName)[0]);
        // detect change if data exist
        if (alarm.data && alarm.data.lastTransactionId) {
            query = query
                .map(table => {
                    if (!table)
                        return null;
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
            if (!table)
                return null;
            //console.log("update data", table);
            alarm.data = { lastTransactionId: table.History.TransactionHash, lastBlockId: sts.Tail.Hash };
            return alarm;
        });
        return query;
    }

    private updateCellDataModifyAlarm(alarm: AlarmConfiguration, db: ChainDb, sts: StatusRpcResponse): Observable<AlarmConfiguration> {
        let query: Observable<any> = this.chainService.getQueryCell(db, alarm.tableName, alarm.primaryKeyValue, alarm.columnName, [alarm.columnName])
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
            alarm.data = { lastTransactionId: hash, lastBlockId: sts.Tail.Hash };
            return alarm;
        });
        return query;
    }
}
