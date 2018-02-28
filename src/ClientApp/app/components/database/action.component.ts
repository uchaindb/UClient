import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';
import { ChainDbService } from '../../services/chain-db.service';
import { ChainDb, Transaction, Block } from '../../models/chain-db.model';

@Component({
    selector: 'database-action',
    templateUrl: './action.component.html',
    styleUrls: ['./common.css']
})
export class DatabaseActionComponent implements OnInit {

    private _originTransactions = [];
    @Input() set transactions(value: Array<Transaction>) {
        if (this._originTransactions == value) return;
        this._originTransactions == value;
        this.generateActions(value);
    }

    @Input() dbid: string;

    schemaActions: Array<any>;
    dataActions: Array<{ actions: Array<any>, pkname: string, tableName: string, columns: Array<string> }>;

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

    generateActions(transactions: Array<Transaction>) {
        if (!transactions) {
            this.dataActions = [];
            this.schemaActions = [];
            return;
        }

        transactions.forEach(t => t.Actions.forEach(a => a.transaction = t));
        let dacts = transactions
            .filter(_ => _.Type == "DataTransaction")
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

        this.schemaActions = transactions
            .filter(_ => _.Type == "SchemaTransaction")
            .map(_ => _.Actions)
            .reduce((a, b) => a.concat(b), []);
    }
}
