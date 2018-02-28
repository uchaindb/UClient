import { Component, OnInit, Input } from '@angular/core';
import { ChainDb } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';

@Component({
    selector: 'database-list',
    templateUrl: './list.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseListPage implements OnInit {
    dblist: Array<ChainDb>;

    constructor(
        private dataService: ChainDbService,
        private alertService: AlertService,
    ) { }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.dataService.getDbList()
            .subscribe(_ => this.dblist = _);
    }

    remove(event: Event, db: ChainDb) {
        event.stopPropagation();

        this.alertService.showDialog("are you sure to remove?", DialogType.confirm, () => {
            this.alertService.showMessage("removed", "", MessageSeverity.success);
            this.dataService.removeChainDb(db);
            this.refresh();
        });

        return false;
    }
}
