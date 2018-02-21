import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AlertService } from '../../services/alert.service';
import { InboxNotification } from '../../models/alert.model';

@Component({
    selector: 'alert-list-page',
    templateUrl: './list.page.html',
    styleUrls: ['./common.css']
})
export class AlertListPage implements OnInit {

    messages:Array<InboxNotification>;

    constructor(
        private notifyService: NotificationService,
        private alertService: AlertService,
    ) { }

    ngOnInit() {
        this.notifyService.getNotificationList()
            .subscribe(_ => this.messages = _);
    }

}
