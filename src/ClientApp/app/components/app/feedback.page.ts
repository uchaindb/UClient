import { Component, OnInit } from '@angular/core';
import { IBusyConfig } from "angular2-busy";
import { MessageSeverity, AlertService } from "../../services/alert.service";
import { Router } from "@angular/router";
import { AppTranslationService, LoadingMessage } from "../../services/app-translation.service";

@Component({
    selector: 'feedback-page',
    templateUrl: './feedback.page.html',
    styles: []
})
export class FeedbackPage implements OnInit {

    busyConfig: IBusyConfig = {};
    postProjectReport: string;
    loadingMessage: LoadingMessage;
    translations: { saved?: string } = {};
    executingProjectId: string;

    constructor(
        private alertService: AlertService,
        private router: Router,
        private translationService: AppTranslationService,
    ) {
        this.loadingMessage = this.translationService.loadingMessage;
        let gT = (key: string) => translationService.getTranslation(key);
        this.translations.saved = gT("me.postProjectReport.notification.Saved");
        //this.busyConfig.message = this.loadingMessage.load;
        //this.busyConfig.busy = this.dataService
        //    .getProfile()
        //    .subscribe(res => {
        //        this.executingProjectId = res.executingProject;
        //        this.projectService
        //            .getPostProjectReport(this.executingProjectId)
        //            .subscribe(res => {
        //                this.postProjectReport = res.postProjectReport;
        //            });
        //    });
    }

    ngOnInit() {
    }

    submit() {
        //this.busyConfig.message = this.loadingMessage.submit;
        //this.busyConfig.busy = this.projectService
        //    .updatePostProjectReport(this.executingProjectId, this.postProjectReport)
        //    .subscribe(res => {
        //        this.alertService.showMessage(this.translations.saved, ``, MessageSeverity.success);
        //        this.router.navigate(["me"]);
        //    });
    }

}
