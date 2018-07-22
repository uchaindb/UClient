import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDb, Block } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { AlarmConfiguration } from '../../models/alarm.model';
import { NotificationService } from '../../services/notification.service';
import { AppTranslationService } from '../../services/app-translation.service';
import { Observable } from 'rxjs';
import { AlarmService } from '../../services/alarm.service';
import { ConfigurationService } from '../../services/configuration.service';

@Component({
    selector: 'database-detail',
    templateUrl: './detail.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseDetailPage implements OnInit {
    db: ChainDb;

    get efEnabled(): boolean { return this.configuration.experimentMode; }

    lastBlock: Block;
    tables: Array<any>;

    monitor: boolean;
    alarmConfigs: Array<AlarmConfiguration>;
    refreshTime: Date;

    loading = false;
    loadError = false;

    intervalCheckLastAlarmTime: number;

    translations: {
        toggleMonitorRemovedTitle?: string,
        toggleMonitorRemovedContent?: string,
        toggleMonitorAddedTitle?: string,
        toggleMonitorAddedContent?: string,
        alarmListItemRemovedTitle?: string,
        alarmListItemRemovedContent?: string,
        manualRefreshAlarmTitle?: string,
        manualRefreshAlarmContent?: string,
        toggleEditModeOnTitle?: string,
        toggleEditModeOnContent?: string,
        toggleEditModeOffTitle?: string,
        toggleEditModeOffContent?: string,
    } = {};

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
        private notifyService: NotificationService,
        private translationService: AppTranslationService,
        private alarmService: AlarmService,
        private configuration: ConfigurationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.toggleMonitorRemovedTitle = gT("db.detail.notification.ToggleMonitorRemovedTitle");
        this.translations.toggleMonitorRemovedContent = gT("db.detail.notification.ToggleMonitorRemovedContent");
        this.translations.toggleMonitorAddedTitle = gT("db.detail.notification.ToggleMonitorAddedTitle");
        this.translations.toggleMonitorAddedContent = gT("db.detail.notification.ToggleMonitorAddedContent");
        this.translations.alarmListItemRemovedTitle = gT("db.detail.notification.AlarmListItemRemovedTitle");
        this.translations.alarmListItemRemovedContent = gT("db.detail.notification.AlarmListItemRemovedContent");
        this.translations.manualRefreshAlarmTitle = gT("db.detail.notification.ManualRefreshAlarmTitle");
        this.translations.manualRefreshAlarmContent = gT("db.detail.notification.ManualRefreshAlarmContent");
        this.translations.toggleEditModeOffTitle = gT("db.detail.notification.ToggleEditModeOffTitle");
        this.translations.toggleEditModeOffContent = gT("db.detail.notification.ToggleEditModeOffContent");
        this.translations.toggleEditModeOnTitle = gT("db.detail.notification.ToggleEditModeOnTitle");
        this.translations.toggleEditModeOnContent = gT("db.detail.notification.ToggleEditModeOnContent");
    }

    ngOnInit() {
        this.refresh();
        this.intervalCheckLastAlarmTime = window.setInterval(() => {
            this.refreshTime = this.alarmService.getLastRefreshTime();
        }, 1 * 1000);
    }

    ngOnDestroy() {
        if (this.intervalCheckLastAlarmTime) {
            clearInterval(this.intervalCheckLastAlarmTime);
        }
    }

    refresh() {
        this.loading = true;
        this.loadError = false;
        this.lastBlock = null;
        let errCallback = err => { this.loadError = true; this.loading = false; };
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                let dbid = params.get('dbid');
                this.dataService.getChainDb(dbid)
                    .subscribe(_ => {
                        this.db = _;
                        // actively disable db edit mode if experiment function disabled
                        if (!this.efEnabled) this.db.editmode = false;
                        let obStatus = this.dataService.getChainDbStatus(this.db);
                        let obTable = this.dataService.getChainDbTableNames(this.db);
                        Observable.forkJoin(obStatus, obTable)
                            .subscribe(_ => {
                                const [status, tables] = _;
                                this.lastBlock = status.Tail;
                                this.tables = tables.Tables;
                                this.loading = false;
                            }, errCallback);
                    });
                this.refreshAlarms();
            }, errCallback);
    }

    refreshAlarms() {
        this.alarmService.getConfigList(this.db.id)
            .subscribe(_ => {
                this.alarmConfigs = _
                    .filter(_ => _.dbid == this.db.id);
                this.monitor = this.alarmConfigs.findIndex(_ => _.type == "chain-fork") >= 0;
                this.dataService.getDbList()
                    .subscribe(_ => {
                        this.alarmConfigs.forEach(a => (<any>a).dbname = _.find(d => d.id == a.dbid).name);
                    });
            });
    }

    toggleMonitor() {
        let config = this.alarmConfigs.find(_ => _.type == "chain-fork" && _.dbid == this.db.id);
        let obs = config
            ? this.alarmService.removeConfig(config)
                .map(() => this.alertService.showMessage(this.translations.toggleMonitorRemovedTitle, this.translations.toggleMonitorRemovedContent, MessageSeverity.success))
            : this.alarmService.addConfig({
                type: "chain-fork",
                dbid: this.db.id,
            }).map(() => this.alertService.showMessage(this.translations.toggleMonitorAddedTitle, this.translations.toggleMonitorAddedContent, MessageSeverity.success));

        obs.subscribe(() => {
            this.refreshAlarms();
        });
    }

    remove(alarm: AlarmConfiguration) {
        this.alarmService.removeConfig(alarm);
        this.alertService.showMessage(this.translations.alarmListItemRemovedTitle, this.translations.alarmListItemRemovedContent, MessageSeverity.success);
        this.refreshAlarms();
    }

    refreshAlarmNotification() {
        this.alarmService.refresh()
            .subscribe(_ => {
                this.alertService.showMessage(this.translations.manualRefreshAlarmTitle, this.translations.manualRefreshAlarmContent, MessageSeverity.success);
            });
    }

    toggleEditMode() {
        let edit = this.db.editmode;
        this.dataService.setDbEditMode(this.db.id, !edit);
        if (edit) {
            this.alertService.showMessage(this.translations.toggleEditModeOffTitle, this.translations.toggleEditModeOffContent, MessageSeverity.success);
        } else {
            this.alertService.showMessage(this.translations.toggleEditModeOnTitle, this.translations.toggleEditModeOnContent, MessageSeverity.success);
        }

        this.refresh();
    }
}
