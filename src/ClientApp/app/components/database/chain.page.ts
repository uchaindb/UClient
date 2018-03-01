import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { Location } from '@angular/common';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';
import { ChainDbService } from '../../services/chain-db.service';
import { ChainDb, Transaction, Block } from '../../models/chain-db.model';

@Component({
    selector: 'database-chain',
    templateUrl: './chain.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseChainPage implements OnInit {
    dbid: string;
    mixid: string;
    db: ChainDb;
    block: Block;
    transaction: Transaction;
    error = false;
    loading = true;

    constructor(
        private location: Location,
        private route: ActivatedRoute,
        private router: Router,
        private dataService: ChainDbService
    ) {
    }

    ngOnInit() {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                this.dbid = params.get('dbid');
                this.mixid = params.get('id');
                this.dataService.getChainDb(this.dbid)
                    .subscribe(_ => {
                        this.db = _;
                        this.loadData();
                    });
            });
    }

    loadData() {
        this.error = false;
        this.loading = true;
        setTimeout(() => {
            if (this.loading) {
                this.block = null;
                this.transaction = null;
            }
        }, 500);
        this.dataService.getQueryChain(this.db, this.mixid)
            .subscribe(_ => {
                this.block = _.Block;
                this.transaction = _.Transaction;
                this.loading = false;
            },
            err => {
                isDevMode() && console.error(err);
                this.error = true;
                this.loading = false;
            });
    }

    back() {
        this.location.back()
    }

}
