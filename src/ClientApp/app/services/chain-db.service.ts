import { Injectable, Injector } from '@angular/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { ConfigurationService } from "./configuration.service";
import { EndpointFactory } from "./endpoint-factory.service";
import { Http, Headers, Response, RequestOptions } from "@angular/http";
import { Router } from "@angular/router";
import { Pager } from "../models/pager.model";
import { ChainDb, HistoryEntry, QueryTableResponse, RowDef, ColumnDef, Transaction, QueryCellResponse, DataAction, StatusRpcResponse, ListTablesRpcResponse, QueryDataRpcResponse, QueryChainRpcResponse, QueryCellRpcResponse, CreateTransactionRpcResponse, ListTableSchema, ColumnData, SchemaAction, SchemaColumnDefinition, LockTarget } from '../models/chain-db.model';
import { LocalStoreManager } from './local-store-manager.service';
import { AlertConfiguration } from '../models/alert.model';
import { CryptographyService, Signature } from './cryptography.service';
import { NotificationService } from './notification.service';
import { AppTranslationService } from './app-translation.service';

export type ChainDbRpcMethod =
    "Status" |
    "CreateSchemaTransaction" |
    "CreateDataTransaction" |
    "CreateLockTransaction" |
    "QueryData" |
    "QueryChain" |
    "QueryCell" |
    "ListTables"
    ;
@Injectable()
export class ChainDbService extends EndpointFactory {
    private readonly _baseUrl: string = "";
    get baseUrl() { return this.configurations.baseUrl + this._baseUrl; }

    public static readonly DBKEY_CHAIN_DB_DATA = "chain_db";
    public static readonly DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS = "alert_config";

    translations: {
        chainForkMessage?: any,
        tableSchemaMessage?: any,
        cellDataModifyMessage?: any,
    } = {};

    constructor(
        http: Http,
        configurations: ConfigurationService,
        injector: Injector,
        private localStoreManager: LocalStoreManager,
        private cryptoService: CryptographyService,
        private notificationService: NotificationService,
        private translationService: AppTranslationService,
    ) {
        super(http, configurations, injector);
        let gT = (key: string, params?: Object) => translationService.getTranslation(key, params);
        this.translations.chainForkMessage = (params: Object) => gT("alert.service.ChainForkMessage", params);
        this.translations.tableSchemaMessage = (params: Object) => gT("alert.service.TableSchemaMessage", params);
        this.translations.cellDataModifyMessage = (params: Object) => gT("alert.service.CellDataModifyMessage", params);
    }

    getDbList(pager?: Pager): Observable<Array<ChainDb>> {
        if (!this.localStoreManager.exists(ChainDbService.DBKEY_CHAIN_DB_DATA)) {
            this.localStoreManager.savePermanentData([], ChainDbService.DBKEY_CHAIN_DB_DATA);
        }
        var dblist = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_DATA);
        return Observable.of(dblist);
    }

    setDbEditMode(dbid: string, edit = true): void {
        var dblist = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_DATA) as Array<ChainDb>;
        var idx = dblist.findIndex(_ => _.id == dbid);
        if (idx == -1) {
            console.warn("setDbEditMode failed due to cannot find dbid");
            return;
        }

        dblist[idx].editmode = edit;
        this.localStoreManager.savePermanentData(dblist, ChainDbService.DBKEY_CHAIN_DB_DATA);
    }

    getRecommendDbList(pager?: Pager): Observable<Array<ChainDb>> {
        var dblist: Array<ChainDb> = [
            {
                id: "1",
                name: "备份灯火计划捐赠数据",
                description: "由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。",
                address: "http://localhost:7847/api/rpc",
                image: "https://placeimg.com/200/200/any",
                staffpick: 1,
            },
            {
                id: "2",
                name: "XXXX捐赠数据",
                description: "由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。",
                address: "http://localhost:7848/api/rpc",
                image: "https://placeimg.com/100/100/any",
            },
        ];
        let endpointUrl = `${this.baseUrl}/database.json`;

        return this.http.get(endpointUrl)
            .map((response: Response) => response.json())
            .catch(error => Observable.of(dblist));
    }

    getAlertConfigList(dbid: string): Observable<Array<AlertConfiguration>> {
        var alertList = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS) as Array<AlertConfiguration> || [];
        var dblist = alertList.filter(_ => _.dbid == dbid);

        return Observable.of(dblist);
    }

    addAlertConfig(config: AlertConfiguration): void {
        var alertList = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS) as Array<AlertConfiguration> || [];
        alertList.push(config);
        this.localStoreManager.savePermanentData(alertList, ChainDbService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS);
    }

    removeAlertConfig(config: AlertConfiguration): void {
        var alertList = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS) as Array<AlertConfiguration> || [];
        var idx = alertList
            .findIndex(_ => _.type == config.type
                && _.dbid == config.dbid
                && _.tableName == config.tableName
                && _.columnName == config.columnName
                && _.primaryKeyValue == config.primaryKeyValue
            );
        alertList.splice(idx, 1);
        this.localStoreManager.savePermanentData(alertList, ChainDbService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS);
    }

    refreshAlerts(): Observable<boolean> {
        let alertList = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS) as Array<AlertConfiguration> || [];
        let obsList = alertList
            .map(_ => this.generateAlertNotification(_));

        return Observable.forkJoin(obsList)
            .map(_ => {
                this.localStoreManager.savePermanentData(alertList, ChainDbService.DBKEY_CHAIN_DB_ALERT_CONFIGURATIONS);
                return true;
            });

    }

    private generateAlertNotification(alert: AlertConfiguration): Observable<any> {
        return this.getChainDb(alert.dbid)
            .map(db => {
                let result: Observable<any> = Observable.of({});

                if (alert.type == "chain-fork") {
                    // detect change if data exist
                    if (alert.data && alert.data.lastBlockId) {
                        result = result.concat(
                            this.getQueryChain(db, alert.data.lastBlockId)
                                .map(resp => {
                                    //console.log("detecting change", resp, alert.data);
                                    if (!(resp.Block && resp.Block.Hash == alert.data.lastBlockId && resp.Block.Height == alert.data.lastBlockHeight)) {
                                        this.notificationService.createNotification(this.translations.chainForkMessage(db), alert);
                                    }
                                }));
                    }

                    // update data using fresh server data
                    result = result.concat(this.getChainDbStatus(db)
                        .map(sts => {
                            alert.data = { lastBlockHeight: sts.Tail.Height, lastBlockId: sts.Tail.Hash };
                            //console.log("update data", sts);
                        }));
                } else if (alert.type == "table-schema") {
                    let query = this.getChainDbTableNames(db)
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
                    let query = this.getQueryCell(db, alert.tableName, alert.primaryKeyValue, alert.columnName, [alert.columnName])
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

    addChainDb(db: ChainDb): Observable<boolean> {
        var dblist = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_DATA) as Array<ChainDb>;
        if (dblist.findIndex(_ => _.id == db.id) > -1) return;
        dblist.push(db);
        this.localStoreManager.savePermanentData(dblist, ChainDbService.DBKEY_CHAIN_DB_DATA);

        return Observable.of(true);
    }

    removeChainDb(db: ChainDb): void {
        var dblist = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_DATA) as Array<ChainDb>;
        var idx = dblist
            .findIndex(_ => _.id == db.id);
        dblist.splice(idx, 1);
        this.localStoreManager.savePermanentData(dblist, ChainDbService.DBKEY_CHAIN_DB_DATA);
    }

    getChainDbStatus(db: ChainDb): Observable<StatusRpcResponse> {
        return this.rpcCall(db.address, "Status", []);
    }

    getChainDb(dbid: string): Observable<ChainDb> {
        var dblist = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_DATA) as Array<ChainDb>;
        return Observable.of(dblist.find(_ => _.id == dbid));
    }

    getChainDbTableNames(db: ChainDb): Observable<ListTablesRpcResponse> {
        return this.rpcCall(db.address, "ListTables", []);
    }

    getChainDbTable(db: ChainDb, tableName: string): Observable<QueryTableResponse> {
        return this.rpcCall(db.address, "QueryData", [tableName, 0, 100]).
            map((_: QueryDataRpcResponse) => {
                let dataHist = _.DataHistories;
                let colHist = _.HeaderHistories;
                let pkname = _.PrimaryKeyName;

                let columns: Array<ColumnDef> = [];
                let headers = _.Headers;
                let pkidx = headers.findIndex(_ => _ == pkname);
                let colCount = headers.length;
                for (let i = 0; i < colCount; i++) {
                    let hist = colHist[i];
                    columns.push({
                        name: headers[i],
                        tran: hist.TransactionHash,
                        history: hist.HistoryLength,
                    });
                }

                let rows: Array<RowDef> = [];
                let data = _.Data;
                let rowCount = data.length / colCount;
                for (let i = 0; i < rowCount; i++) {
                    let row: RowDef = [];
                    for (let j = 0; j < colCount; j++) {
                        let hist = dataHist[i * colCount + j];
                        let pkval = data[i * colCount + pkidx];
                        row.push({
                            name: headers[j],
                            pkval: pkval,
                            data: data[i * colCount + j],
                            tran: hist.TransactionHash,
                            history: hist.HistoryLength,
                        });
                    }
                    rows.push(row);
                }

                return {
                    data: {
                        rows: rows,
                        columns: columns,
                        pkname: pkname,
                        dbid: db.id,
                        tableName: tableName,
                    }
                }
            });
    }

    getQueryChain(db: ChainDb, mixId: string): Observable<QueryChainRpcResponse> {
        return this.rpcCall(db.address, "QueryChain", [mixId]);
    }

    getQueryCell(db: ChainDb, tableName: string, primaryKeyValue: string, columnName: string, columns: string[]): Observable<QueryCellResponse> {
        columns = columns || [];
        return this.rpcCall(db.address, "QueryCell", [tableName, primaryKeyValue, columnName, ...columns])
            .map((_: QueryCellRpcResponse) => {
                let row: RowDef = [];
                let headers = _.Headers;
                let data = _.Row;
                let datahist = _.RowHistories;
                let pkname = _.PrimaryKeyName;
                let pkidx = headers.findIndex(_ => _ == pkname);
                let pkval = data[pkidx];
                let colCount = headers.length;
                for (let i = 0; i < colCount; i++) {
                    let hist = datahist[i];
                    row.push({
                        name: headers[i],
                        pkval: pkval,
                        data: data[i],
                        tran: hist.TransactionHash,
                        history: hist.HistoryLength,
                    });
                }
                let rows = [row];
                let columns = row.map(r => ({ name: r.name, tran: null, history: null }));

                let transactions = _.Transactions
                    .map(_ => new Transaction({ Hash: _ }));
                return {
                    data: {
                        rows: rows,
                        columns: columns,
                        pkname: pkname,
                        dbid: db.id,
                        tableName: tableName,
                    },
                    transactions: transactions,
                }
            });
    }

    createDataTransaction(db: ChainDb, privateKey: string, unlockPrivateKey: string, actions: Array<DataAction>): Observable<CreateTransactionRpcResponse> {
        let pubKey = this.cryptoService.getPublicKey(privateKey);
        let initiator = this.cryptoService.getAddress(pubKey);

        return this.getChainDbStatus(db)
            .flatMap(result => {
                let witness = result.Tail.Hash;
                let unlockScripts = this.generateUnlockScriptsForDataTransaction(unlockPrivateKey, initiator, witness, actions);
                let hashContent = this.getDataTransactionHashContent(initiator, witness, actions, unlockScripts);
                let sig = this.signTransaction(privateKey, hashContent);
                let as = actions.map(_ => JSON.stringify(_));
                return this.rpcCall(db.address, "CreateDataTransaction", [initiator, sig, witness, unlockScripts, ...as]);
            });
    }

    createSchemaTransaction(db: ChainDb, privateKey: string, unlockPrivateKey: string, actions: Array<SchemaAction>): Observable<CreateTransactionRpcResponse> {
        let pubKey = this.cryptoService.getPublicKey(privateKey);
        let initiator = this.cryptoService.getAddress(pubKey);

        return this.getChainDbStatus(db)
            .flatMap(result => {
                let witness = result.Tail.Hash;
                let unlockScripts = this.generateUnlockScriptsForSchemaTransaction(unlockPrivateKey, initiator, witness, actions);
                let hashContent = this.getSchemaTransactionHashContent(initiator, witness, actions, unlockScripts);
                let sig = this.signTransaction(privateKey, hashContent);
                let as = actions.map(_ => JSON.stringify(_));
                return this.rpcCall(db.address, "CreateSchemaTransaction", [initiator, sig, witness, unlockScripts, ...as]);
            });
    }

    createLockTransaction(db: ChainDb, privateKey: string, unlockPrivateKey: string, lockScripts: string, targets: Array<LockTarget>): Observable<CreateTransactionRpcResponse> {
        let pubKey = this.cryptoService.getPublicKey(privateKey);
        let initiator = this.cryptoService.getAddress(pubKey);

        return this.getChainDbStatus(db)
            .flatMap(result => {
                let witness = result.Tail.Hash;
                let unlockScripts = this.generateUnlockScriptsForLockTransaction(unlockPrivateKey, initiator, witness, lockScripts, targets);
                let hashContent = this.getLockTransactionHashContent(initiator, witness, lockScripts, targets, unlockScripts);
                let sig = this.signTransaction(privateKey, hashContent);
                let as = targets.map(_ => JSON.stringify(_));
                return this.rpcCall(db.address, "CreateLockTransaction", [initiator, sig, witness, unlockScripts, lockScripts, ...as]);
            });
    }

    private generateUnlockScriptsForDataTransaction(privateKey: string, initiator: string, witness: string, actions: Array<DataAction>): string {
        let hashContent = this.getDataTransactionHashContent(initiator, witness, actions);
        return this.generateUnlockScriptsForTransaction(privateKey, hashContent);
    }

    private generateUnlockScriptsForSchemaTransaction(privateKey: string, initiator: string, witness: string, actions: Array<SchemaAction>): string {
        let hashContent = this.getSchemaTransactionHashContent(initiator, witness, actions);
        return this.generateUnlockScriptsForTransaction(privateKey, hashContent);
    }

    private generateUnlockScriptsForLockTransaction(privateKey: string, initiator: string, witness: string, lockScripts: string, targets: Array<LockTarget>): string {
        let hashContent = this.getLockTransactionHashContent(initiator, witness, lockScripts, targets);
        return this.generateUnlockScriptsForTransaction(privateKey, hashContent);
    }

    private generateUnlockScriptsForTransaction(privateKey: string, hashContent:string): string {
        let tosign = this.cryptoService.hash(hashContent);
        let signature = this.cryptoService.signData(tosign, privateKey);
        return this.getSignatureB58(signature);
    }

    private signTransaction(privateKey: string, hashContent: string): string {
        let signature = this.cryptoService.sign(hashContent, privateKey);
        return this.getSignatureB58(signature);
    }

    private getSignatureB58(signature: Signature): string {
        let sigarr = new Uint8Array(signature.r.length + signature.s.length);
        sigarr.set(signature.r);
        sigarr.set(signature.s, signature.r.length);
        let sig = this.cryptoService.to_b58(sigarr);
        return sig;
    }

    private getDataTransactionHashContent(initiator: string, witness: string, actions: Array<DataAction>, unlockScripts: string = null): string {
        let mapColumns = (columns: Array<ColumnData>): Array<string> =>
            columns.map(_ => `${_.Name}:${_.Data}`);
        let acts = actions
            .map(_ => {
                switch (_.Type) {
                    case "InsertDataAction":
                        return `[${_.SchemaName}]Insert:${mapColumns(_.Columns).join(",")}`;
                    case "UpdateDataAction":
                        return `[${_.SchemaName}]Update[${_.PrimaryKeyValue}]:${mapColumns(_.Columns).join(",")}`;
                    case "DeleteDataAction":
                        return `[${_.SchemaName}]Delete[${_.PrimaryKeyValue}]`;
                    default:
                }
            });
        let unlockContent = unlockScripts ? unlockScripts + "|" : "";
        return `${unlockContent}${initiator}|${witness}|${acts.join(",")}`
    }

    private getSchemaTransactionHashContent(initiator: string, witness: string, actions: Array<SchemaAction>, unlockScripts: string = null): string {
        let mapColumns = (columns: Array<SchemaColumnDefinition>): Array<string> =>
            !columns ? []
                : columns.map(_ => `${(_.PrimaryKey ? '[P]' : '')}${_.Name}:${_.Type}`);
        let acts = actions
            .map(_ => {
                switch (_.Type) {
                    case "CreateSchemaAction":
                        return `[${_.Name}]CreateColumns:${mapColumns(_.Columns).join(",")}`;
                    case "ModifySchemaAction":
                        return `[${_.Name}]DropColumns:${(_.DropColumns || []).join(",")};AddOrModifyColumns:${mapColumns(_.AddOrModifyColumns).join(",")}`;
                    case "DropSchemaAction":
                        return `[${_.Name}]DropSchema`;
                    default:
                }
            });
        let unlockContent = unlockScripts ? unlockScripts + "|" : "";
        return `${unlockContent}${initiator}|${witness}|${acts.join(",")}`
    }

    private getLockTransactionHashContent(initiator: string, witness: string, lockScripts: string, targets: Array<LockTarget>, unlockScripts: string = null): string {
        let mapColumns = (columns: Array<LockTarget>): Array<string> =>
            columns.map(_ => `[${_.TargetType}][${_.PublicPermission}]${(!_.TableName ? '' : _.TableName)}:${(!_.PrimaryKey ? '' : _.PrimaryKey)}:${(!_.ColumnName ? '' : _.ColumnName)}`);
        let unlockContent = unlockScripts ? unlockScripts + "|" : "";
        return `${unlockContent}${initiator}|${witness}|${lockScripts}|${mapColumns(targets).join(",")}`
    }

    readonly errorCodes = {
        '-32700': 'JSON-RPC server reported a parse error in JSON request',
        '-32600': 'JSON-RPC server reported an invalid request',
        '-32601': 'Method not found',
        '-32602': 'Invalid parameters',
        '-32603': 'Internal error'
    };

    rpcCall(url: string, method: ChainDbRpcMethod, params): Observable<any> {
        let jsonParams = {
            jsonrpc: '2.0',
            id: 1,//(new Date).getTime(),
            method: method,
            params: params
        };
        let requestString = JSON.stringify(jsonParams);
        return this.http.post(url, requestString)
            .map((response: Response) => {
                console.debug(response);
                let decodedResponse = response.json();
                if (decodedResponse.error) {
                    let errorMessage = this.errorCodes[decodedResponse.error.code];
                    errorMessage += " " + decodedResponse.error.message;
                    throw new Error(errorMessage);
                }
                return decodedResponse.result;
            })
            .catch(error => this.handleError(error, () => this.rpcCall(url, method, params)));
    }

}
