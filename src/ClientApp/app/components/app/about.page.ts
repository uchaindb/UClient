import { Component, OnInit, Inject } from '@angular/core';
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


    constructor(
        private alertService: AlertService,
        private router: Router,
        private translationService: AppTranslationService,
        @Inject("UCLIENT_VERSION") private UCLIENT_VERSION,
    ) {
    }

    ngOnInit() {
    }
}
