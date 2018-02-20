import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';
import { ChainDbService } from '../../services/chain-db.service';
import { ChainDb, Transaction, Block, HistoryEntry, RowDef, ColumnDef, TableData } from '../../models/chain-db.model';

@Component({
    selector: 'database-cell',
    templateUrl: './cell.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseCellPage implements OnInit {
    db: ChainDb;
    column: string;
    pkval: string;

    tableData: TableData;
    transactions: Array<Transaction>;

    dataActions: Array<any>;
    schemaActions: Array<any>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dataService: ChainDbService
    ) {
    }

    ngOnInit() {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                let dbid = params.get('dbid');
                let tid = params.get('tid');
                this.pkval = params.get('pk');
                this.column = params.get('col');
                this.dataService.getChainDb(dbid)
                    .subscribe(_ => {
                        this.db = _;
                        this.dataService.getQueryCell(this.db, tid, this.pkval, this.column, null)
                            .subscribe(_ => {
                                this.tableData = _.data;
                                this.transactions = _.transactions;

                                for (var i = 0; i < this.transactions.length; i++) {
                                    this.dataService.getQueryChain(this.db, this.transactions[i].Hash)
                                        .subscribe(_ => {
                                            let tran: Transaction = _.Transaction;
                                            let idx = this.transactions.findIndex(t => t.Hash == tran.Hash);
                                            this.transactions[idx] = tran;
                                            this.transactions = this.transactions.slice();
                                        });
                                }

                            });
                    });
            },
            err => isDevMode() && console.error(err)
            );
    }

}
