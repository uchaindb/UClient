import { Injectable, Injector } from '@angular/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { ConfigurationService } from "./configuration.service";
import { EndpointFactory } from "./endpoint-factory.service";
import { Http, Headers, Response, RequestOptions } from "@angular/http";
import { Router } from "@angular/router";
import { Pager } from "../models/pager.model";
import { ChainDb, HistoryEntry, QueryTableResponse, RowDef, ColumnDef, Transaction, QueryCellResponse } from '../models/chain-db.model';
import { LocalStoreManager } from './local-store-manager.service';

export type ChainDbRpcMethod =
    "Status" |
    "CreateSchemaTransaction" |
    "CreateDataTransaction" |
    "QueryData" |
    "QueryChain" |
    "QueryCell" |
    "ListTables"
    ;
@Injectable()
export class ChainDbService extends EndpointFactory {
    //private readonly _baseUrl: string = "/api/client/activities";
    //get baseUrl() { return this.configurations.baseUrl + this._baseUrl; }

    public static readonly DBKEY_CHAIN_DB_DATA = "chain_db";

    constructor(
        http: Http,
        configurations: ConfigurationService,
        injector: Injector,
        private localStoreManager: LocalStoreManager,
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

    getRecommendDbList(pager?: Pager): Observable<Array<ChainDb>> {
        var dblist: Array<ChainDb> = [
            {
                id: "1",
                name: "灯火计划捐赠数据",
                description: "由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。",
                address: "http://localhost:7847/api/rpc",
                image: "https://placeimg.com/200/200/any",
            },
            {
                id: "2",
                name: "XXXX捐赠数据",
                description: "由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。由。。。运营，保存有从xxx开始的数据，为实时数据，接受大众监督。",
                address: "http://localhost:7848/api/rpc",
                image: "https://placeimg.com/100/100/any",
            },
        ];
        return Observable.of(dblist);
    }

    addChainDb(db: ChainDb): Observable<any> {
        var dblist = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_DATA) as Array<ChainDb>;
        dblist.push(db);
        this.localStoreManager.savePermanentData(dblist, ChainDbService.DBKEY_CHAIN_DB_DATA);

        return Observable.of(null);
    }

    getChainDbStatus(db: ChainDb): Observable<any> {
        return this.rpcCall(db.address, "Status", []);
    }

    getChainDb(dbid: string): Observable<ChainDb> {
        var dblist = this.localStoreManager.getData(ChainDbService.DBKEY_CHAIN_DB_DATA) as Array<ChainDb>;
        return Observable.of(dblist.find(_ => _.id == dbid));
    }

    getChainDbTableNames(db: ChainDb): Observable<any> {
        return this.rpcCall(db.address, "ListTables", []);
    }

    getChainDbTable(db: ChainDb, tableName: string): Observable<QueryTableResponse> {
        return this.rpcCall(db.address, "QueryData", [tableName, 0, 100]).
            map(_ => {
                let dataHist = _.DataHistories as Array<HistoryEntry>;
                let colHist = _.HeaderHistories as Array<HistoryEntry>;
                let pkname = _.PrimaryKeyName;

                let columns: Array<ColumnDef> = [];
                let headers: Array<any> = _.Headers;
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

    getQueryChain(db: ChainDb, mixId: string): Observable<any> {
        return this.rpcCall(db.address, "QueryChain", [mixId]);
    }

    getQueryCell(db: ChainDb, tableName: string, primaryKeyValue: string, columnName: string): Observable<QueryCellResponse> {
        return this.rpcCall(db.address, "QueryCell", [tableName, primaryKeyValue, columnName])
            .map(_ => {
                let row: RowDef = [];
                let headers: Array<any> = _.Headers;
                let data: Array<any> = _.Row;
                let datahist: Array<HistoryEntry> = _.RowHistories;
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
