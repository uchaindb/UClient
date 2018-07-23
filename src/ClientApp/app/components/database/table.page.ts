﻿import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { ChainDb, HistoryEntry, RowDef, ColumnDef, TableData } from '../../models/chain-db.model';
import { AlarmConfiguration, AlarmType } from '../../models/alarm.model';
import { AppTranslationService } from '../../services/app-translation.service';
import { Utilities } from '../../services/utilities';
import { PaginationType } from '../../models/pager.model';
import { AlarmService } from '../../services/alarm.service';
import { ConfigurationService } from '../../services/configuration.service';

@Component({
    selector: 'database-table-page',
    templateUrl: './table.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseTablePage implements OnInit {
    get efEnabled(): boolean { return this.configuration.experimentMode; }
    db: ChainDb;
    tid: string;

    tableData: TableData;

    monitorSchema: boolean;
    monitorData: boolean;
    alarmTableSchema: AlarmType = "table-schema";
    alarmTableData: AlarmType = "table-data-modify";
    alarmConfigs: Array<AlarmConfiguration>;

    pager: PaginationType = <any>{};
    pagedItems: any[];
    totalPage: number;
    pageSize: number = 20;
    enablePager: boolean = false;
    lastCursorId: number = 0;

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
        private configuration: ConfigurationService,
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
                        if (!this.efEnabled) this.db.editmode = false;
                        this.dataService.getChainDbTableNames(this.db)
                            .subscribe(o => {
                                if (this.enablePager) {
                                    this.totalPage = o.Tables.find(t => t.Name == this.tid).RecordCount;
                                    this.setPage(1);
                                } else {
                                    this.loadMore();
                                }
                            });
                        this.refreshAlarms();
                    });
            },
            err => isDevMode() && console.error(err)
            );
    }

    refreshAlarms() {
        this.alarmService.getConfigList(this.db.id)
            .subscribe(_ => {
                this.alarmConfigs = _
                    .filter(_ => _.dbid == this.db.id && _.tableName == this.tid);
                this.monitorSchema = this.alarmConfigs.findIndex(_ => _.type == "table-schema") >= 0;
                this.monitorData = this.alarmConfigs.findIndex(_ => _.type == "table-data-modify") >= 0;
                this.dataService.getDbList()
                    .subscribe(_ => {
                        this.alarmConfigs.forEach(a => (<any>a).dbname = _.find(d => d.id == a.dbid).name);
                    });
            });
    }

    toggleMonitor(type: AlarmType) {
        let config = this.alarmConfigs.find(_ => _.type == type && _.dbid == this.db.id && _.tableName == this.tableData.tableName);
        let obs = config
            ? this.alarmService.removeConfig(config)
                .map(() => this.alertService.showMessage(this.translations.toggleMonitorRemovedTitle, this.translations.toggleMonitorRemovedContent, MessageSeverity.success))
            : this.alarmService.addConfig({
                type: type,
                dbid: this.db.id,
                tableName: this.tableData.tableName,
            }).map(() => this.alertService.showMessage(this.translations.toggleMonitorAddedTitle, this.translations.toggleMonitorAddedContent, MessageSeverity.success));

        obs.subscribe(() => {
            this.refreshAlarms();
        });
    }

    setPage(page: number) {
        if (page < 1 || page > this.totalPage) {
            return;
        }

        this.pager = Utilities.getPager(this.totalPage, page, this.pageSize);

        this.dataService.getChainDbTable(this.db, this.tid, this.pager.startIndex, this.pager.pageSize)
            .subscribe(_ => {
                this.tableData = _.data;
            });
    }

    loadMore() {
        this.dataService.getChainDbTable(this.db, this.tid, this.lastCursorId, this.pageSize)
            .subscribe(_ => {
                var rows = this.tableData && this.tableData.rows || [];
                this.tableData = {
                    dbid: _.data.dbid,
                    pkname: _.data.pkname,
                    columns: _.data.columns,
                    tableName: _.data.tableName,
                    rows: rows.concat(_.data.rows)
                };
                this.lastCursorId = _.cursorId;
            });
    }
}
