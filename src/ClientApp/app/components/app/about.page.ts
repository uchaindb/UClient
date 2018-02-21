import { Component, OnInit } from '@angular/core';
import { IBusyConfig } from "angular2-busy";
import { MessageSeverity, AlertService } from "../../services/alert.service";
import { Router } from "@angular/router";
import { AppTranslationService, LoadingMessage } from "../../services/app-translation.service";

@Component({
    selector: 'about-page',
    templateUrl: './about.page.html',
    styles: []
})
export class AboutPage implements OnInit {

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
    }

    ngOnInit() {
    }
}
