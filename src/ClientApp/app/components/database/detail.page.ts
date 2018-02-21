import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { ChainDb, Block } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { AlertConfiguration } from '../../models/alert.model';
import { NotificationService } from '../../services/notification.service';

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
    alertConfigs: Array<AlertConfiguration>;

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
        private notifyService: NotificationService,
    ) { }

    ngOnInit() {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                let dbid = params.get('dbid');
                this.dataService.getChainDb(dbid)
                    .subscribe(_ => {
                        this.db = _;
                        this.dataService.getChainDbStatus(this.db)
                            .subscribe(_ => this.lastBlock = _.Tail);
                        this.dataService.getChainDbTableNames(this.db)
                            .subscribe(_ => this.tables = _.Tables);
                    });
                this.refreshAlerts();
            },
            err => isDevMode() && console.error(err)
            );
    }

    refreshAlerts() {
        this.dataService.getAlertConfigList(this.db.id)
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
            this.dataService.removeAlertConfig(config);
            this.alertService.showMessage('alert removed', '', MessageSeverity.success);
        } else {
            this.dataService.addAlertConfig({
                type: "chain-fork",
                dbid: this.db.id,
            })
            this.alertService.showMessage('alert added', '', MessageSeverity.success);
        }

        this.refreshAlerts();
    }

    remove(alert: AlertConfiguration) {
        console.info("remove", alert);
        this.dataService.removeAlertConfig(alert);
        this.alertService.showMessage('alert removed', '', MessageSeverity.success);
        this.refreshAlerts();
    }

    refreshAlertNotification() {
        this.dataService.refreshAlerts()
            .subscribe(_ => {
                console.log("refreshed",_);
                this.alertService.showMessage('alert notification refreshed', '', MessageSeverity.success);
            });
    }
}
