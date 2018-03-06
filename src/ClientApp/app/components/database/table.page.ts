import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { ChainDb, HistoryEntry, RowDef, ColumnDef, TableData } from '../../models/chain-db.model';
import { AlertConfiguration, AlertType } from '../../models/alert.model';
import { AppTranslationService } from '../../services/app-translation.service';

@Component({
    selector: 'database-table-page',
    templateUrl: './table.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseTablePage implements OnInit {
    db: ChainDb;
    tid: string;

    tableData: TableData;

    monitorSchema: boolean;
    monitorData: boolean;
    alertTableSchema: AlertType = "table-schema";
    alertTableData: AlertType = "table-data-modify";
    alertConfigs: Array<AlertConfiguration>;

    translations: {
        toggleMonitorRemovedTitle?: string,
        toggleMonitorRemovedContent?: string,
        toggleMonitorAddedTitle?: string,
        toggleMonitorAddedContent?: string,
    } = {};

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.toggleMonitorRemovedTitle = gT("db.table.notification.ToggleMonitorRemovedTitle");
        this.translations.toggleMonitorRemovedContent = gT("db.table.notification.ToggleMonitorRemovedContent");
        this.translations.toggleMonitorAddedTitle = gT("db.table.notification.ToggleMonitorAddedTitle");
        this.translations.toggleMonitorAddedContent = gT("db.table.notification.ToggleMonitorAddedContent");
    }

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
                                this.refreshAlerts();
                            });
                    });
            },
            err => isDevMode() && console.error(err)
            );
    }

    refreshAlerts() {
        this.dataService.getAlertConfigList(this.db.id)
            .subscribe(_ => {
                this.alertConfigs = _
                    .filter(_ => _.dbid == this.db.id && _.tableName == this.tableData.tableName);
                this.monitorSchema = this.alertConfigs.findIndex(_ => _.type == "table-schema") >= 0;
                this.monitorData = this.alertConfigs.findIndex(_ => _.type == "table-data-modify") >= 0;
                this.dataService.getDbList()
                    .subscribe(_ => {
                        this.alertConfigs.forEach(a => (<any>a).dbname = _.find(d => d.id == a.dbid).name);
                    });
            });
    }

    toggleMonitor(type: AlertType) {
        let config = this.alertConfigs.find(_ => _.type == type && _.dbid == this.db.id && _.tableName == this.tableData.tableName);
        if (config) {
            this.dataService.removeAlertConfig(config);
            this.alertService.showMessage(this.translations.toggleMonitorRemovedTitle, this.translations.toggleMonitorRemovedContent, MessageSeverity.success);
        } else {
            this.dataService.addAlertConfig({
                type: type,
                dbid: this.db.id,
                tableName: this.tableData.tableName,
            })
            this.alertService.showMessage(this.translations.toggleMonitorAddedTitle, this.translations.toggleMonitorAddedContent, MessageSeverity.success);
        }

        this.refreshAlerts();
    }

}
