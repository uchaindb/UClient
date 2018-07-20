import { Injectable, Injector } from '@angular/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { ConfigurationService } from "./configuration.service";
import { EndpointFactory } from "./endpoint-factory.service";
import { Http, Headers, Response, RequestOptions } from "@angular/http";
import { Router } from "@angular/router";
import { Pager } from "../models/pager.model";
import { ChainDb, HistoryEntry, QueryTableResponse, RowDef, ColumnDef, Transaction, QueryCellResponse, DataAction, StatusRpcResponse, ListTablesRpcResponse, QueryDataRpcResponse, QueryChainRpcResponse, QueryCellRpcResponse, CreateTransactionRpcResponse, ListTableSchema, ColumnData, SchemaAction, SchemaColumnDefinition, LockTarget, ChainDbRpcMethod } from '../models/chain-db.model';
import { LocalStoreManager } from './local-store-manager.service';
import { CryptographyService } from './cryptography.service';
import { NotificationService } from './notification.service';
import { Signature, PrivateKey, Address } from '../models/cryptography.model';
import { B58 } from './b58';

@Injectable()
export class ChainDbService extends EndpointFactory {
    private readonly _baseUrl: string = "";
    get baseUrl() { return this.configurations.baseUrl + this._baseUrl; }

    public static readonly DBKEY_CHAIN_DB_DATA = "chain_db";

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

    addChainDb(db: ChainDb): Observable<boolean> {
        if (!db) throw 'db not exist calling addChainDb';
        var dblist = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_DATA) as Array<ChainDb>;
        if (dblist.findIndex(_ => _.id == db.id) > -1) return Observable.of(false);
        dblist.push(db);
        this.localStoreManager.savePermanentData(dblist, ChainDbService.DBKEY_CHAIN_DB_DATA);

        return Observable.of(true);
    }

    removeChainDb(db: ChainDb): void {
        if (!db) throw 'db not exist calling removeChainDb';
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
        var cdb = dblist && dblist.find(_ => _.id == dbid);
        if (cdb) return Observable.of(cdb);
        // add db from recommend list if not exist
        return this.getRecommendDbList()
            .switchMap(cdblist => {
                var ncdb = cdblist.find(_ => _.id == dbid);
                if (ncdb) {
                    return this.addChainDb(ncdb)
                        .map(result => result ? ncdb : null);
                }

                return Observable.of(null);
            });
    }

    getChainDbTableNames(db: ChainDb): Observable<ListTablesRpcResponse> {
        return this.rpcCall(db.address, "ListTables", []);
    }

    getChainDbTable(db: ChainDb, tableName: string, start: number = 0, size: number = 100): Observable<QueryTableResponse> {
        return this.rpcCall(db.address, "QueryData", [tableName, start, size, "", ""]).
            map((_: QueryDataRpcResponse) => {
                let allHist = _.Histories || [];
                let dataHist = _.DataHistories || [];
                let colHist = _.HeaderHistories || [];
                let pkname = _.PrimaryKeyName;

                let columns: Array<ColumnDef> = [];
                let headers = _.Headers;
                let pkidx = headers.findIndex(_ => _ == pkname);
                let colCount = headers.length;
                for (let i = 0; i < colCount; i++) {
                    let hist = allHist[colHist[i]];
                    columns.push({
                        name: headers[i],
                        tran: hist && hist.TransactionHash,
                        history: hist && hist.HistoryLength,
                    });
                }

                let rows: Array<RowDef> = [];
                let data = _.Data;
                let rowCount = data.length / colCount;
                for (let i = 0; i < rowCount; i++) {
                    let row: RowDef = [];
                    for (let j = 0; j < colCount; j++) {
                        let hist = allHist[dataHist[i * colCount + j]];
                        let pkval = data[i * colCount + pkidx];
                        row.push({
                            name: headers[j],
                            pkval: pkval,
                            data: data[i * colCount + j],
                            tran: hist && hist.TransactionHash,
                            history: hist && hist.HistoryLength,
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
                    },
                    cursorId: _.CursorId,
                }
            });
    }

    getQueryChain(db: ChainDb, mixId: string): Observable<QueryChainRpcResponse> {
        if (!db) throw 'db not exist calling getQueryChain';
        return this.rpcCall(db.address, "QueryChain", [mixId]);
    }

    getQueryCell(db: ChainDb, tableName: string, primaryKeyValue: string, columnName: string, columns: string[]): Observable<QueryCellResponse> {
        if (!db) throw 'db not exist calling getQueryCell';
        columns = columns || [];
        return this.rpcCall(db.address, "QueryCell", [tableName, primaryKeyValue, columnName, ...columns])
            .map((_: QueryCellRpcResponse) => {
                let row: RowDef = [];
                let headers = _.Headers;
                let data = _.Row;
                if (!data) throw "unexpected data";
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

    createDataTransaction(db: ChainDb, privateKey: PrivateKey, unlockPrivateKey: PrivateKey, actions: Array<DataAction>): Observable<CreateTransactionRpcResponse> {
        let pubKey = this.cryptoService.getPublicKey(privateKey);
        let initiator = pubKey.toAddress();

        return this.getChainDbStatus(db)
            .flatMap(result => {
                let witness = result.Tail.Hash;
                let unlockScripts = this.generateUnlockScriptsForDataTransaction(unlockPrivateKey, initiator, witness, actions);
                let hashContent = this.getDataTransactionHashContent(initiator, witness, actions, unlockScripts);
                let sig = this.signTransaction(privateKey, hashContent);
                let as = actions.map(_ => JSON.stringify(_));
                return this.rpcCall(db.address, "CreateDataTransaction", [initiator.toB58String(), sig, witness, unlockScripts, ...as]);
            });
    }

    createSchemaTransaction(db: ChainDb, privateKey: PrivateKey, unlockPrivateKey: PrivateKey, actions: Array<SchemaAction>): Observable<CreateTransactionRpcResponse> {
        let pubKey = this.cryptoService.getPublicKey(privateKey);
        let initiator = pubKey.toAddress();

        return this.getChainDbStatus(db)
            .flatMap(result => {
                let witness = result.Tail.Hash;
                let unlockScripts = this.generateUnlockScriptsForSchemaTransaction(unlockPrivateKey, initiator, witness, actions);
                let hashContent = this.getSchemaTransactionHashContent(initiator, witness, actions, unlockScripts);
                let sig = this.signTransaction(privateKey, hashContent);
                let as = actions.map(_ => JSON.stringify(_));
                return this.rpcCall(db.address, "CreateSchemaTransaction", [initiator.toB58String(), sig, witness, unlockScripts, ...as]);
            });
    }

    createLockTransaction(db: ChainDb, privateKey: PrivateKey, unlockPrivateKey: PrivateKey, lockScripts: string, targets: Array<LockTarget>): Observable<CreateTransactionRpcResponse> {
        let pubKey = this.cryptoService.getPublicKey(privateKey);
        let initiator = pubKey.toAddress();

        return this.getChainDbStatus(db)
            .flatMap(result => {
                let witness = result.Tail.Hash;
                let unlockScripts = this.generateUnlockScriptsForLockTransaction(unlockPrivateKey, initiator, witness, lockScripts, targets);
                let hashContent = this.getLockTransactionHashContent(initiator, witness, lockScripts, targets, unlockScripts);
                let sig = this.signTransaction(privateKey, hashContent);
                let as = targets.map(_ => JSON.stringify(_));
                return this.rpcCall(db.address, "CreateLockTransaction", [initiator.toB58String(), sig, witness, unlockScripts, lockScripts, ...as]);
            });
    }

    private generateUnlockScriptsForDataTransaction(privateKey: PrivateKey, initiator: Address, witness: string, actions: Array<DataAction>): string {
        if (!privateKey) return null;
        let hashContent = this.getDataTransactionHashContent(initiator, witness, actions);
        return this.generateUnlockScriptsForTransaction(privateKey, hashContent);
    }

    private generateUnlockScriptsForSchemaTransaction(privateKey: PrivateKey, initiator: Address, witness: string, actions: Array<SchemaAction>): string {
        if (!privateKey) return null;
        let hashContent = this.getSchemaTransactionHashContent(initiator, witness, actions);
        return this.generateUnlockScriptsForTransaction(privateKey, hashContent);
    }

    private generateUnlockScriptsForLockTransaction(privateKey: PrivateKey, initiator: Address, witness: string, lockScripts: string, targets: Array<LockTarget>): string {
        if (!privateKey) return null;
        let hashContent = this.getLockTransactionHashContent(initiator, witness, lockScripts, targets);
        return this.generateUnlockScriptsForTransaction(privateKey, hashContent);
    }

    private generateUnlockScriptsForTransaction(privateKey: PrivateKey, hashContent: string): string {
        let tosign = this.cryptoService.hash(hashContent);
        let signature = this.cryptoService.sign(tosign, privateKey);
        return this.getSignatureB58(signature);
    }

    private signTransaction(privateKey: PrivateKey, hashContent: string): string {
        let signature = this.cryptoService.sign(hashContent, privateKey);
        return this.getSignatureB58(signature);
    }

    private getSignatureB58(signature: Signature): string {
        let sigarr = new Uint8Array(64);
        sigarr.set(signature.r);
        sigarr.set(signature.s, 32);
        let sig = B58.toB58(sigarr);
        return sig;
    }

    private getDataTransactionHashContent(initiator: Address, witness: string, actions: Array<DataAction>, unlockScripts: string = null): string {
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
        return `${unlockContent}${initiator.toB58String()}|${witness}|${acts.join(",")}`
    }

    private getSchemaTransactionHashContent(initiator: Address, witness: string, actions: Array<SchemaAction>, unlockScripts: string = null): string {
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
        return `${unlockContent}${initiator.toB58String()}|${witness}|${acts.join(",")}`
    }

    private getLockTransactionHashContent(initiator: Address, witness: string, lockScripts: string, targets: Array<LockTarget>, unlockScripts: string = null): string {
        let mapColumns = (columns: Array<LockTarget>): Array<string> =>
            columns.map(_ => `[${_.TargetType}][${_.PublicPermission}]${(!_.TableName ? '' : _.TableName)}:${(!_.PrimaryKey ? '' : _.PrimaryKey)}:${(!_.ColumnName ? '' : _.ColumnName)}`);
        let unlockContent = unlockScripts ? unlockScripts + "|" : "";
        return `${unlockContent}${initiator.toB58String()}|${witness}|${lockScripts ? lockScripts : ''}|${mapColumns(targets).join(",")}`
    }

    readonly errorCodes = {
        '-32700': 'JSON-RPC server reported a parse error in JSON request',
        '-32600': 'JSON-RPC server reported an invalid request',
        '-32601': 'Method not found',
        '-32602': 'Invalid parameters',
        '-32603': 'Internal error'
    };

    rpcCall(url: string, method: ChainDbRpcMethod, params: Array<string | number>): Observable<any> {
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
