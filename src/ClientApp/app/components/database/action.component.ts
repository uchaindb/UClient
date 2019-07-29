import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';
import { ChainDbService } from '../../services/chain-db.service';
import { ChainDb, Tx, Block, ScriptToken } from '../../models/chain-db.model';

@Component({
    selector: 'database-action',
    templateUrl: './action.component.html',
    styleUrls: ['./common.css']
})
export class DatabaseActionComponent implements OnInit {

    private _originTxs = [];
    @Input() set txs(value: Array<Tx>) {
        if (this._originTxs == value) return;
        this._originTxs == value;
        this.generateActions(value);
    }

    @Input() dbid: string;

    schemaActions: Array<any>;
    dataActions: Array<{ actions: Array<any>, pkname: string, tableName: string, columns: Array<string> }>;
    lockTxs: Array<Tx>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dataService: ChainDbService
    ) {
    }

    ngOnInit() {
    }

    findcoldata(cols: Array<any>, name: string) {
        if (!cols) return null;
        var col = cols.find(_ => _.Name == name);
        if (col) return col.Data;
        return null;
    }

    generateActions(txs: Array<Tx>) {
        if (!txs) {
            this.dataActions = [];
            this.schemaActions = [];
            this.lockTxs = [];
            return;
        }

        txs.forEach(t => t.Actions && t.Actions.forEach(a => (<any>a).tx = t));
        let dacts = txs
            .filter(_ => _.Type == "DataTx")
            .map(_ => _.Actions)
            .reduce((a, b) => a.concat(b), []);

        // get from https://stackoverflow.com/a/34890276/2558077
        var groupBy = function (xs, key): { [idx: string]: any } {
            return xs.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        let groupActions = groupBy(dacts, 'SchemaName');

        this.dataActions = [];
        for (var key in groupActions) {
            if (groupActions.hasOwnProperty(key)) {
                let actions = groupActions[key];
                let columns = [];
                for (let i = 0; i < actions.length; i++) {
                    let cols = actions[i].Columns;
                    if (cols) {
                        for (let j = 0; j < cols.length; j++) {
                            let col = cols[j].Name;
                            if (columns.indexOf(col) == -1) columns.push(col);
                        }
                    }
                }

                this.dataActions.push({
                    actions: actions,
                    tableName: key,
                    pkname: null,
                    columns: columns,
                });
            }
        }

        // TODO: change to query server for pkname
        setTimeout(() => {
            this.dataActions.forEach(_ => _.pkname = "Id");
        }, 1000);

        this.schemaActions = txs
            .filter(_ => _.Type == "SchemaTx")
            .map(_ => _.Actions)
            .reduce((a, b) => a.concat(b), []);

        this.lockTxs = txs
            .filter(_ => _.Type == "LockTx");
        txs.forEach(t => (<any>t).code = this.generateCode(t.LockScripts));
    }

    generateCode(tokens: Array<ScriptToken>):string {
        tokens = tokens || [];
        return tokens
            .map(_ => _.OpCode == "Object" ? _.Object : _.OpCode)
            .join('\n');
    }
}
