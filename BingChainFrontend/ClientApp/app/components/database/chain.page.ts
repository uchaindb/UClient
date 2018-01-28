import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';
import { ChainDbService } from '../../services/chain-db.service';
import { ChainDb, Transaction, Block } from '../../models/chain-db.model';

@Component({
    selector: 'database-chain',
    templateUrl: './chain.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseChainPage implements OnInit {
    db: ChainDb;
    result: any;
    block: Block;
    transaction: Transaction;

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
                let mixid = params.get('id');
                this.dataService.getChainDb(dbid)
                    .subscribe(_ => {
                        this.db = _;
                        this.dataService.getQueryChain(this.db, mixid)
                            .subscribe(_ => {
                                this.result = _;
                                this.block = _.Block;
                                this.transaction = _.Transaction;
                            });
                    });
            },
            err => isDevMode() && console.error(err)
            );
    }

}
