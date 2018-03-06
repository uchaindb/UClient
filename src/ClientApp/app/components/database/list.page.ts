import { Component, OnInit, Input } from '@angular/core';
import { ChainDb } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { AppTranslationService } from '../../services/app-translation.service';

@Component({
    selector: 'database-list',
    templateUrl: './list.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseListPage implements OnInit {
    dblist: Array<ChainDb>;

    translations: {
        removeConfirmation?: string,
        databaseRemovedTitle?: string,
        databaseRemovedContent?: string,
    } = {};

    constructor(
        private dataService: ChainDbService,
        private alertService: AlertService,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.removeConfirmation = gT("db.list.notification.RemoveConfirmation");
        this.translations.databaseRemovedTitle = gT("db.list.notification.DatabaseRemovedTitle");
        this.translations.databaseRemovedContent = gT("db.list.notification.DatabaseRemovedContent");
    }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.dataService.getDbList()
            .subscribe(_ => this.dblist = _);
    }

    remove(event: Event, db: ChainDb) {
        event.stopPropagation();

        this.alertService.showDialog(this.translations.removeConfirmation, DialogType.confirm, () => {
            this.dataService.removeChainDb(db);
            this.alertService.showMessage(this.translations.databaseRemovedTitle, this.translations.databaseRemovedContent, MessageSeverity.success);
            this.refresh();
        });

        return false;
    }
}
