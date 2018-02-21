import { Component, OnInit, Input, isDevMode, Output, EventEmitter } from '@angular/core';
import { ChainDb, Block } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { AlertConfiguration } from '../../models/alert.model';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'database-alert-list',
    templateUrl: './alert-list.component.html',
    styles: [`.list-group {margin-bottom: 0px;}`],
})
export class DatabaseAlertListComponent implements OnInit {
    @Input() configs: Array<AlertConfiguration>;

    @Output() onDelete: EventEmitter<AlertConfiguration> = new EventEmitter<AlertConfiguration>();

    @Input() showDb: boolean = true;
    @Input() showDelete: boolean = true;

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
        private notifyService: NotificationService,
    ) { }

    ngOnInit() {
    }

    remove(alert: AlertConfiguration) {
        this.onDelete.emit(alert);
    }

    notify(alert: AlertConfiguration) {
        this.notifyService.createNotification("something", alert);
    }
}
