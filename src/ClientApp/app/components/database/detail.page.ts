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

@Component({
    selector: 'database-detail',
    templateUrl: './detail.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseDetailPage implements OnInit {
    db: ChainDb;

    lastBlock: Block;
    tables: Array<any>;

    monitor: boolean;
    alertConfigs: Array<AlarmConfiguration>;

    loading = false;
    loadError = false;

    translations: {
        toggleMonitorRemovedTitle?: string,
        toggleMonitorRemovedContent?: string,
        toggleMonitorAddedTitle?: string,
        toggleMonitorAddedContent?: string,
        alertListItemRemovedTitle?: string,
        alertListItemRemovedContent?: string,
        manualRefreshAlertTitle?: string,
        manualRefreshAlertContent?: string,
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
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.toggleMonitorRemovedTitle = gT("db.detail.notification.ToggleMonitorRemovedTitle");
        this.translations.toggleMonitorRemovedContent = gT("db.detail.notification.ToggleMonitorRemovedContent");
        this.translations.toggleMonitorAddedTitle = gT("db.detail.notification.ToggleMonitorAddedTitle");
        this.translations.toggleMonitorAddedContent = gT("db.detail.notification.ToggleMonitorAddedContent");
        this.translations.alertListItemRemovedTitle = gT("db.detail.notification.AlertListItemRemovedTitle");
        this.translations.alertListItemRemovedContent = gT("db.detail.notification.AlertListItemRemovedContent");
        this.translations.manualRefreshAlertTitle = gT("db.detail.notification.ManualRefreshAlertTitle");
        this.translations.manualRefreshAlertContent = gT("db.detail.notification.ManualRefreshAlertContent");
        this.translations.toggleEditModeOffTitle = gT("db.detail.notification.ToggleEditModeOffTitle");
        this.translations.toggleEditModeOffContent = gT("db.detail.notification.ToggleEditModeOffContent");
        this.translations.toggleEditModeOnTitle = gT("db.detail.notification.ToggleEditModeOnTitle");
        this.translations.toggleEditModeOnContent = gT("db.detail.notification.ToggleEditModeOnContent");
    }

    ngOnInit() {
        this.refresh();
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
                this.refreshAlerts();
            }, errCallback);
    }

    refreshAlerts() {
        this.alarmService.getConfigList(this.db.id)
            .subscribe(_ => {
                this.alertConfigs = _
                    .filter(_ => _.dbid == this.db.id);
                this.monitor = this.alertConfigs.findIndex(_ => _.type == "chain-fork") >= 0;
                this.dataService.getDbList()
                    .subscribe(_ => {
                        this.alertConfigs.forEach(a => (<any>a).dbname = _.find(d => d.id == a.dbid).name);
                    });
            });
    }

    toggleMonitor() {
        let config = this.alertConfigs.find(_ => _.type == "chain-fork" && _.dbid == this.db.id);
        if (config) {
            this.alarmService.removeConfig(config);
            this.alertService.showMessage(this.translations.toggleMonitorRemovedTitle, this.translations.toggleMonitorRemovedContent, MessageSeverity.success);
        } else {
            this.alarmService.addConfig({
                type: "chain-fork",
                dbid: this.db.id,
            })
            this.alertService.showMessage(this.translations.toggleMonitorAddedTitle, this.translations.toggleMonitorAddedContent, MessageSeverity.success);
        }

        this.refreshAlerts();
    }

    remove(alert: AlarmConfiguration) {
        this.alarmService.removeConfig(alert);
        this.alertService.showMessage(this.translations.alertListItemRemovedTitle, this.translations.alertListItemRemovedContent, MessageSeverity.success);
        this.refreshAlerts();
    }

    refreshAlertNotification() {
        this.alarmService.refresh()
            .subscribe(_ => {
                this.alertService.showMessage(this.translations.manualRefreshAlertTitle, this.translations.manualRefreshAlertContent, MessageSeverity.success);
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
