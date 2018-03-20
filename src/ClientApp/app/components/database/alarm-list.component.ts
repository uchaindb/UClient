import { Component, OnInit, Input, isDevMode, Output, EventEmitter } from '@angular/core';
import { ChainDb, Block } from '../../models/chain-db.model';
import { ChainDbService } from '../../services/chain-db.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { AlarmConfiguration } from '../../models/alarm.model';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'database-alarm-list',
    templateUrl: './alarm-list.component.html',
    styles: [`.list-group {margin-bottom: 0px;}`],
})
export class DatabaseAlarmListComponent implements OnInit {
    @Input() configs: Array<AlarmConfiguration>;

    @Output() onDelete: EventEmitter<AlarmConfiguration> = new EventEmitter<AlarmConfiguration>();

    @Input() showDb: boolean = true;
    @Input() showDelete: boolean = true;

    dblist: { [index: string]: string } = {};
    showDebugInfo = isDevMode();

    constructor(
        private dataService: ChainDbService,
        private route: ActivatedRoute,
        private router: Router,
        private alertService: AlertService,
        private notifyService: NotificationService,
    ) {
        this.dataService.getDbList()
            .subscribe(_ => {
                var obj = {};
                for (var i = 0; i < _.length; ++i)
                    obj[_[i].id] = _[i].name;
                this.dblist = obj;
            });
    }

    ngOnInit() {
    }

    remove(alarm: AlarmConfiguration) {
        this.onDelete.emit(alarm);
    }
}
