import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { ChainDb, HistoryEntry, RowDef, ColumnDef, TableData } from '../../models/chain-db.model';

@Component({
    selector: 'database-table-page',
    templateUrl: './table.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseTablePage implements OnInit {
    db: ChainDb;
    tid: string;

    tableData: TableData;

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
    ) { }

    ngOnInit() {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                let dbid = params.get('dbid');
                this.tid = params.get('tid');
                this.dataService.getChainDb(dbid)
                    .subscribe(_ => {
                        this.db = _;
                        this.dataService.getChainDbTable(this.db, this.tid)
                            .subscribe(_ => {
                                this.tableData = _.data;
                            });
                    });
            },
            err => isDevMode() && console.error(err)
            );
    }


}
