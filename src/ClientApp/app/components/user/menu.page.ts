import { Component, OnInit } from '@angular/core';
import { AuthService } from "../../services/auth.service";
import { AppTranslationService } from "../../services/app-translation.service";
import { Router } from "@angular/router";
import { MessageSeverity, AlertService, DialogType } from "../../services/alert.service";

type MenuItem = { name: string, router: string, icon: string, show: boolean, newinfo?: boolean, callback?: (item: MenuItem, origin) => boolean };

@Component({
    selector: 'me-menu-page',
    templateUrl: './menu.page.html',
    styleUrls: ['./common.css']
})
export class UserMenuPage implements OnInit {

    nickName: string;
    portrait: string;

    constructor(
        private authService: AuthService,
        private alertService: AlertService,
        private router: Router,
        private translationService: AppTranslationService,
    ) {
    }

    ngOnInit() {
    }

    logout() {
        this.authService.logout();
        this.authService.redirectLogoutUser();
    }
    layoutclass = "col-sm-4 col-md-3";
}
