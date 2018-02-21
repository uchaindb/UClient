import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDb, Block } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { AlertConfiguration } from '../../models/alert.model';

@Component({
    selector: 'database-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./common.css']
})
export class DatabaseNavComponent implements OnInit {
    @Input() dbid: string;
    @Input() dbname: string;
    @Input() tableName: string;
    @Input() columnName: string;
    @Input() chainHash: string;
    @Input() current: string;

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
    ) { }

    ngOnInit() {
        //this.route.paramMap
        //    .subscribe((params: ParamMap) => {
        //        let dbid = params.get('dbid');
        //        this.dataService.getChainDb(dbid)
        //            .subscribe(_ => {
        //                this.db = _;
        //            });
        //    },
        //    err => isDevMode() && console.error(err)
        //    );
    }

}
