import { Component, OnInit } from '@angular/core';
import { AuthService } from "../../services/auth.service";
import { AppTranslationService } from "../../services/app-translation.service";
import { Router } from "@angular/router";
import { MessageSeverity, AlertService, DialogType } from "../../services/alert.service";

type MenuItem = { name: string, router: string, icon: string, show: boolean, newinfo?: boolean, callback?: (item: MenuItem, origin) => boolean };

@Component({
    selector: 'me-menu-page',
    templateUrl: './menu.page.html',
    styleUrls: ['./me.css']
})
export class MeMenuPage implements OnInit {

    nickName: string;
    portrait: string;
    detail: { money?: number };

    proposedProjectId: string;
    executingProjectId: string;
    reservedProjectId: string;

    list: Array<{ category: string, items: Array<MenuItem> }>;
    translations: {
        disallowStartProject?: string,
        disallowApplyVolunteer?: string,
    } = {};

    constructor(
        private authService: AuthService,
        private alertService: AlertService,
        private router: Router,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => translationService.getTranslation(key);
        this.translations.disallowStartProject = gT("me.menu.notification.DisallowStartProject");
        this.translations.disallowApplyVolunteer = gT("me.menu.notification.DisallowApplyVolunteer");

        this.setList();
        //this.dataService
        //    .getProfile()
        //    .subscribe(res => {
        //        this.nickName = res.nickName;
        //        this.verificationStatus = res.realNameVerificationStatus;
        //        this.portrait = res.portrait;
        //        this.detail = { money: res.money };
        //        this.volunteerStatus = res.volunteerStatus;
        //        this.proposedProjectId = res.proposedProject;
        //        this.executingProjectId = res.executingProject;
        //        this.reservedProjectId = res.reservedProject;

        //        this.setList();
        //    });
    }

    ngOnInit() {
    }

    logout() {
        this.authService.logout();
        this.authService.redirectLogoutUser();
    }
    layoutclass = "col-sm-4 col-md-3";

    menuClick(item: MenuItem) {
        if (item.callback) {
            let ret = item.callback(item, this);
            if (ret == true) return;
        }
        this.router.navigate(["/me/" + item.router]);
    }

    startProjectCheck(item: MenuItem, $this): boolean {
        if ($this.verificationStatus != 'Verified') {
            $this.alertService.showDialog($this.translations.disallowStartProject, DialogType.alert);
            return true;
        }
        return false;
    }

    startVolunteerCheck(item: MenuItem, $this): boolean {
        if ($this.verificationStatus != 'Verified') {
            $this.alertService.showDialog($this.translations.disallowApplyVolunteer, DialogType.alert);
            return true;
        }
        return false;
    }

    private setList() {
        //let vs = this.volunteerStatus != null && (this.volunteerStatus == "AdminModified" || this.volunteerStatus == "Rejected" || this.volunteerStatus == "Submitted");
        //let gT = (key: string) => this.translationService.getTranslation(key);
        this.list = [
            //{
            //    category: gT("me.menu.list.function.Title"), items: [
            //        { name: gT("me.menu.list.function.StartProject"), router: "ProjectApplication", icon: "asterisk", show: this.proposedProjectId == null, callback: this.startProjectCheck },
            //        { name: gT("me.menu.list.function.ModifyProject"), router: "ProjectApplication", icon: "asterisk", show: this.proposedProjectId != null },
            //        { name: gT("me.menu.list.function.StartVolunteer"), router: "VolunteerApplication", icon: "user", show: this.volunteerStatus == null || this.volunteerStatus == "None", callback: this.startVolunteerCheck },
            //        { name: gT("me.menu.list.function.ModifyVolunteer"), router: "VolunteerApplication", icon: "user", show: vs },
            //        { name: gT("me.menu.list.function.AcceptProject"), router: "AcceptProject", icon: "ok-circle", show: this.reservedProjectId != null, newinfo: true },
            //        { name: gT("me.menu.list.function.PostProjectReport"), router: "PostProjectReport", icon: "off", show: this.executingProjectId != null },
            //    ]
            //},
            //{
            //    category: gT("me.menu.list.mine.Title"), items: [
            //        { name: gT("me.menu.list.mine.ProposedProjects"), router: "MyProjects/start", icon: "eye-open", show: true },
            //        { name: gT("me.menu.list.mine.VolunteerProjects"), router: "MyProjects/volunteer", icon: "plane", show: this.volunteerStatus == "Volunteer" },
            //        { name: gT("me.menu.list.mine.WatchedProjects"), router: "MyProjects/watch", icon: "heart", show: true },
            //        { name: gT("me.menu.list.mine.DonationRecords"), router: "DonationRecords", icon: "thumbs-up", show: true },
            //    ]
            //},
        ];
    }

}
