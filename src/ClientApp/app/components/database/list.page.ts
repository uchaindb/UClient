import { Component, OnInit, Input } from '@angular/core';
import { ChainDb } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';

@Component({
    selector: 'database-list',
    templateUrl: './list.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseListPage implements OnInit {
    dblist: Array<ChainDb>;

    constructor(
        private dataService: ChainDbService
    ) { }

    ngOnInit() {
        this.dataService.getDbList()
            .subscribe(_ => this.dblist = _);
    }

}
