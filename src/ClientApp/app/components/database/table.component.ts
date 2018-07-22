import { Component, OnInit, Input, isDevMode, PLATFORM_ID, Inject } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { ChainDb, HistoryEntry, ColumnDef, CellDef, TableData } from '../../models/chain-db.model';
import { AlarmType, AlarmConfiguration } from '../../models/alarm.model';
import { AppTranslationService } from '../../services/app-translation.service';
import { AlarmService } from '../../services/alarm.service';
import { isPlatformBrowser } from '@angular/common';
import { ConfigurationService } from '../../services/configuration.service';

declare var $;

@Component({
    selector: 'database-table',
    templateUrl: './table.component.html',
    styleUrls: ['./common.css']
})
export class DatabaseTableComponent implements OnInit {

    _table: TableData;
    get table(): TableData { return this._table; }
    @Input() set table(value: TableData) {
        if (!value) return;
        this._table = value;
        this.refreshAlarms();
        this.enablePopovers();
    }

    @Input() highlightColumn: string;

    get efEnabled(): boolean { return this.configuration.experimentMode; }

    monitorColumn: { [idx: string]: boolean };
    monitorCell: { [idx: string]: boolean };

    alarmColumnData: AlarmType = "column-data-modify";
    alarmCellData: AlarmType = "cell-data-modify";
    alarmConfigs: Array<AlarmConfiguration>;

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
        private alarmService: AlarmService,
        @Inject(PLATFORM_ID) private platformId: string,
        private configuration: ConfigurationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.toggleMonitorRemovedTitle = gT("db.table.notification.ToggleMonitorRemovedTitle");
        this.translations.toggleMonitorRemovedContent = gT("db.table.notification.ToggleMonitorRemovedContent");
        this.translations.toggleMonitorAddedTitle = gT("db.table.notification.ToggleMonitorAddedTitle");
        this.translations.toggleMonitorAddedContent = gT("db.table.notification.ToggleMonitorAddedContent");
    }

    ngOnInit() { }

    popover(event) {
        if (isPlatformBrowser(this.platformId)) {
            var target = $(event.target).popover('show');
            let link = target.parent().children('.popover').children('.popover-title').children('a');
            link.click((e) => {
                e.preventDefault();
                let href = link.attr("href");
                this.router.navigate([href]);
            });
        }
    }

    enablePopovers() {
        if (isPlatformBrowser(this.platformId)) {
            $(function () {
                $('[data-toggle="popover"]').popover()
            });
        }
    }

    refreshAlarms() {
        this.alarmService.getConfigList(this.table.dbid)
            .subscribe(_ => {
                this.alarmConfigs = _
                    .filter(_ => _.dbid == this.table.dbid && _.tableName == this.table.tableName);
                this.monitorColumn = this.alarmConfigs.filter(_ => _.type == this.alarmColumnData)
                    .reduce((obj, item) => { obj[item.columnName] = true; return obj; }, {});
                this.monitorCell = this.alarmConfigs.filter(_ => _.type == this.alarmCellData)
                    .reduce((obj, item) => { obj[item.columnName + '-|-' + item.primaryKeyValue] = true; return obj; }, {});

                this.dataService.getDbList()
                    .subscribe(_ => {
                        this.alarmConfigs.forEach(a => (<any>a).dbname = _.find(d => d.id == a.dbid).name);
                    });
            });
    }

    toggleMonitor(type: AlarmType, colName: string, pkval: string = null) {
        let config = this.alarmConfigs
            .find(_ => _.type == type
                && _.dbid == this.table.dbid
                && _.tableName == this.table.tableName
                && _.columnName == colName
                && _.primaryKeyValue == pkval
            );

        let obs = config
            ? this.alarmService.removeConfig(config)
                .map(() => this.alertService.showMessage(this.translations.toggleMonitorRemovedTitle, this.translations.toggleMonitorRemovedContent, MessageSeverity.success))
            : this.alarmService.addConfig({
                type: type,
                dbid: this.table.dbid,
                tableName: this.table.tableName,
                columnName: colName,
                primaryKeyValue: pkval,
            }).map(() => this.alertService.showMessage(this.translations.toggleMonitorAddedTitle, this.translations.toggleMonitorAddedContent, MessageSeverity.success));

        obs.subscribe(() => {
            this.refreshAlarms();
        });
    }
}
