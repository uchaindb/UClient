import { Component, OnInit, Input } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { ChainDb } from '../../models/chain-db.model';
import { Router } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';

@Component({
    selector: 'database-add',
    templateUrl: './add.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseAddPage implements OnInit {

    recommendList: Array<ChainDb>;

    constructor(
        private dataService: ChainDbService,
        private router: Router,
        private alertService: AlertService,
    ) { }

    ngOnInit() {
        this.dataService.getRecommendDbList()
            .subscribe(_ => this.recommendList = _);
    }

    select(item: ChainDb) {
        this.dataService.addChainDb(item);
                this.alertService.showMessage('database added','trying to open', MessageSeverity.success);
                this.router.navigate(["/database", item.id]);
    }
}
