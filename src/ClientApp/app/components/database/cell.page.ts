import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';
import { ChainDbService } from '../../services/chain-db.service';
import { ChainDb, Tx, Block, HistoryEntry, RowDef, ColumnDef, TableData } from '../../models/chain-db.model';

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
    txs: Array<Tx>;

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
                                this.txs = _.txs;

                                for (var i = 0; i < this.txs.length; i++) {
                                    this.dataService.getQueryChain(this.db, this.txs[i].Hash)
                                        .subscribe(_ => {
                                            let tran: Tx = _.Tx;
                                            let idx = this.txs.findIndex(t => t.Hash == tran.Hash);
                                            this.txs[idx] = tran;
                                            this.txs = this.txs.slice();
                                        });
                                }

                            });
                    });
            },
            err => isDevMode() && console.error(err)
            );
    }

}
