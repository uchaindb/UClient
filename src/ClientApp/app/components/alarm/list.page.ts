import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { InboxNotification } from '../../models/alarm.model';
import { AppTranslationService } from '../../services/app-translation.service';

@Component({
    selector: 'alarm-list-page',
    templateUrl: './list.page.html',
    styleUrls: ['./common.css']
})
export class AlarmListPage implements OnInit {

    messages: Array<InboxNotification>;
    translations: {
        dismissAllConfirmationMessage?: string,
        alarmDismissedTitle?: string,
        alarmDismissedContent?: string,
        markReadAllConfirmationMessage?: string,
        alarmMarkReadTitle?: string,
        alarmMarkReadContent?: string,
    } = {};

    constructor(
        private notifyService: NotificationService,
        private alertService: AlertService,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.dismissAllConfirmationMessage = gT("alarm.list.notification.DismissAllConfirmationMessage");
        this.translations.alarmDismissedContent = gT("alarm.list.notification.AlarmDismissedContent");
        this.translations.alarmDismissedTitle = gT("alarm.list.notification.AlarmDismissedTitle");
        this.translations.markReadAllConfirmationMessage = gT("alarm.list.notification.MarkReadAllConfirmationMessage");
        this.translations.alarmMarkReadContent = gT("alarm.list.notification.AlarmMarkReadContent");
        this.translations.alarmMarkReadTitle = gT("alarm.list.notification.AlarmMarkReadTitle");
    }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.notifyService.getNotificationList()
            .subscribe(_ => this.messages = _);
    }

    markReadAll() {
        this.alertService.showDialog(this.translations.markReadAllConfirmationMessage, DialogType.confirm, _ => {
            this.notifyService.getNotificationList()
                .subscribe(list => {
                    list.forEach(_ => this.notifyService.markRead(_.id, true));
                    this.refresh();
                });

            this.alertService.showMessage(this.translations.alarmMarkReadTitle, this.translations.alarmMarkReadContent, MessageSeverity.success);
        });
    }

    dismissAll() {
        this.alertService.showDialog(this.translations.dismissAllConfirmationMessage, DialogType.confirm, _ => {
            this.notifyService.getNotificationList()
                .subscribe(list => {
                    list.forEach(_ => this.notifyService.removeNotification(_.id));
                    this.refresh();
                });
            this.alertService.showMessage(this.translations.alarmDismissedTitle, this.translations.alarmDismissedContent, MessageSeverity.success);
        });
    }
}
