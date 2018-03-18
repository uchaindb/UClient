import { Component, OnInit } from '@angular/core';
import { IBusyConfig } from "angular2-busy";
import { MessageSeverity, AlertService } from "../../services/alert.service";
import { Router } from "@angular/router";
import { AppTranslationService, LoadingMessage } from "../../services/app-translation.service";

@Component({
    selector: 'feedback-page',
    templateUrl: './feedback.page.html',
    styleUrls: ['./feedback.page.css']
})
export class FeedbackPage implements OnInit {

    busyConfig: IBusyConfig = {};
    postProjectReport: string;
    loadingMessage: LoadingMessage;

    constructor(
        private alertService: AlertService,
        private router: Router,
        private translationService: AppTranslationService,
    ) {
        this.loadingMessage = this.translationService.loadingMessage;
    }

    ngOnInit() {
    }
}
