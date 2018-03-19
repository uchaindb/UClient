import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { InboxNotification } from '../../models/alarm.model';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';
import { AppTranslationService } from '../../services/app-translation.service';

@Component({
    selector: 'alarm-list-page',
    templateUrl: './detail.page.html',
    styleUrls: ['./common.css']
})
export class AlarmDetailPage implements OnInit {

    id: string;
    message: InboxNotification;
    translations: {
        dismissConfirmationMessage?: string,
        alarmDismissedTitle?: string,
        alarmDismissedContent?: string,
    } = {};

    constructor(
        private notifyService: NotificationService,
        private alertService: AlertService,
        private route: ActivatedRoute,
        private router: Router,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.dismissConfirmationMessage = gT("alarm.detail.notification.DismissConfirmationMessage");
        this.translations.alarmDismissedContent = gT("alarm.detail.notification.AlarmDismissedContent");
        this.translations.alarmDismissedTitle = gT("alarm.detail.notification.AlarmDismissedTitle");
    }

    ngOnInit() {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                this.id = params.get('id');
                this.notifyService.getNotification(this.id, true)
                    .subscribe(_ => this.message = _);
            });
    }

    dismiss() {
        this.alertService.showDialog(this.translations.dismissConfirmationMessage, DialogType.confirm, _ => {
            this.notifyService.removeNotification(this.id);
            this.alertService.showMessage(this.translations.alarmDismissedTitle, this.translations.alarmDismissedContent, MessageSeverity.success);
            this.router.navigate(["/alarm"]);
        });
    }

}
