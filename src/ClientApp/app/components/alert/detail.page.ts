import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { InboxNotification } from '../../models/alert.model';
import { ParamMap, ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'alert-list-page',
    templateUrl: './detail.page.html',
    styleUrls: ['./common.css']
})
export class AlertDetailPage implements OnInit {

    id: string;
    message: InboxNotification;

    constructor(
        private notifyService: NotificationService,
        private alertService: AlertService,
        private route: ActivatedRoute,
        private router: Router,
    ) { }

    ngOnInit() {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                this.id = params.get('id');
                this.notifyService.getNotification(this.id, true)
                    .subscribe(_ => this.message = _);
            });
    }

    dismiss() {
        this.alertService.showDialog("dismiss?", DialogType.confirm, _ => {
            this.notifyService.removeNotification(this.id);
            this.alertService.showMessage("removed!", "", MessageSeverity.success);
            this.router.navigate(["/alert"]);
        });
    }

}
