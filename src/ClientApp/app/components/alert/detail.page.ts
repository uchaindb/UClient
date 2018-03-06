import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { InboxNotification } from '../../models/alert.model';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';
import { AppTranslationService } from '../../services/app-translation.service';

@Component({
    selector: 'alert-list-page',
    templateUrl: './detail.page.html',
    styleUrls: ['./common.css']
})
export class AlertDetailPage implements OnInit {

    id: string;
    message: InboxNotification;
    translations: {
        dismissConfirmationMessage?: string,
        alertDismissedTitle?: string,
        alertDismissedContent?: string,
    } = {};

    constructor(
        private notifyService: NotificationService,
        private alertService: AlertService,
        private route: ActivatedRoute,
        private router: Router,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.dismissConfirmationMessage = gT("alert.detail.notification.DismissConfirmationMessage");
        this.translations.alertDismissedContent = gT("alert.detail.notification.AlertDismissedContent");
        this.translations.alertDismissedTitle = gT("alert.detail.notification.AlertDismissedTitle");
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
            this.alertService.showMessage(this.translations.alertDismissedTitle, this.translations.alertDismissedContent, MessageSeverity.success);
            this.router.navigate(["/alert"]);
        });
    }

}
