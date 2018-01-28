import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDb, Block } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { AlertService } from '../../services/alert.service';

@Component({
    selector: 'database-detail',
    templateUrl: './detail.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseDetailPage implements OnInit {
    db: ChainDb;

    lastBlock: Block;
    tables: Array<any>;

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
                this.dataService.getChainDb(dbid)
                    .subscribe(_ => {
                        this.db = _;
                        this.dataService.getChainDbStatus(this.db)
                            .subscribe(_ => this.lastBlock = _.Tail);
                        this.dataService.getChainDbTableNames(this.db)
                            .subscribe(_ => this.tables = _.Tables);
                    });
            },
            err => isDevMode() && console.error(err)
            );
    }

    //select(item: ChainDb) {
    //    this.dataService.addChainDb(item);
    //            this.alertService.showMessage('database added','trying to open', MessageSeverity.success);
    //            this.router.navigate(["/database", item.id]);
    //}

}
