import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { ChainDb, HistoryEntry, ColumnDef, CellDef, TableData } from '../../models/chain-db.model';

@Component({
    selector: 'database-table',
    templateUrl: './table.component.html',
    styleUrls: ['./common.css']
})
export class DatabaseTableComponent implements OnInit {

    @Input() table: TableData;
    @Input() highlightColumn: string;

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
    ) { }

    ngOnInit() {}


}
