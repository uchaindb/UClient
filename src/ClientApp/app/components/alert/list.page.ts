import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { InboxNotification } from '../../models/alarm.model';
import { AppTranslationService } from '../../services/app-translation.service';

@Component({
    selector: 'alert-list-page',
    templateUrl: './list.page.html',
    styleUrls: ['./common.css']
})
export class AlertListPage implements OnInit {

    messages: Array<InboxNotification>;
    translations: {
        dismissAllConfirmationMessage?: string,
        alertDismissedTitle?: string,
        alertDismissedContent?: string,
        markReadAllConfirmationMessage?: string,
        alertMarkReadTitle?: string,
        alertMarkReadContent?: string,
    } = {};

    constructor(
        private notifyService: NotificationService,
        private alertService: AlertService,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.dismissAllConfirmationMessage = gT("alarm.list.notification.DismissAllConfirmationMessage");
        this.translations.alertDismissedContent = gT("alarm.list.notification.AlertDismissedContent");
        this.translations.alertDismissedTitle = gT("alarm.list.notification.AlertDismissedTitle");
        this.translations.markReadAllConfirmationMessage = gT("alarm.list.notification.MarkReadAllConfirmationMessage");
        this.translations.alertMarkReadContent = gT("alarm.list.notification.AlertMarkReadContent");
        this.translations.alertMarkReadTitle = gT("alarm.list.notification.AlertMarkReadTitle");
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

            this.alertService.showMessage(this.translations.alertMarkReadTitle, this.translations.alertMarkReadContent, MessageSeverity.success);
        });
    }

    dismissAll() {
        this.alertService.showDialog(this.translations.dismissAllConfirmationMessage, DialogType.confirm, _ => {
            this.notifyService.getNotificationList()
                .subscribe(list => {
                    list.forEach(_ => this.notifyService.removeNotification(_.id));
                    this.refresh();
                });
            this.alertService.showMessage(this.translations.alertDismissedTitle, this.translations.alertDismissedContent, MessageSeverity.success);
        });
    }
}
