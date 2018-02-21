import { Component, ViewEncapsulation, OnInit, ViewChildren, QueryList, Inject, isDevMode } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd, NavigationStart } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { AuthService } from "../../services/auth.service";
import { MessageSeverity, AlertService, AlertDialog, AlertMessage, DialogType } from "../../services/alert.service";
import { ToastyService, ToastyConfig, ToastOptions, ToastData } from 'ng2-toasty';
import { AppTranslationService } from "../../services/app-translation.service";
import { NavService } from "../../services/nav.service";
import { ConfigurationService } from '../../services/configuration.service';
import { WeixinService } from "../../services/weixin.service";
import { AnalyticService } from "../../services/analytic.service";

@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css', '../../style.css'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
    title: string;
    canBack: boolean;
    disableNavigationBar: boolean;
    enableContainer: boolean = true;
    isUserLoggedIn: boolean;
    shouldShowLoginModal: boolean;
    stickyToasties: number[] = [];
    mobileNavBarVisibility = true;
    medot = false;
    prevUrl: string;
    inWeixin = false;
    titleTranslations: { [id: string]: string } = {};
    translations: {
        okLabel?: string,
        cancelLabel?: string,
        sessionExpiredTitle?: string,
        sessionExpiredContent?: string,
        sessionEndedTitle?: string,
        sessionEndedContent?: string
        defaultTitle?: string
        defaultDescription?: string
    } = {};

    constructor(private location: Location,
        titleService: Title,
        private router: Router,
        private authService: AuthService,
        private alertService: AlertService,
        private toastyService: ToastyService,
        private toastyConfig: ToastyConfig,
        activatedRoute: ActivatedRoute,
        private translationService: AppTranslationService,
        private navService: NavService,
        private configurations: ConfigurationService,
        private wxService: WeixinService,
        private analyticService: AnalyticService,
        @Inject("ALERTIFY") private alertify,
    ) {
        this.router.events
            .filter(e => e instanceof NavigationEnd)
            .pairwise().subscribe((e) => {
                this.prevUrl = (<any>e[0]).url;
            });
        this.router.events
            .pairwise()
            .filter(e => e[0] instanceof NavigationEnd || e[1] instanceof NavigationStart)
            .subscribe((e) => {
                this.analyticService.trackPageview((<any>e[1]).url, (<any>e[0]).url)
            });
        translationService.addLanguages(["zh"]);
        translationService.setDefaultLanguage('zh');

        let gT = (key: string) => this.translationService.getTranslation(key);
        this.title = gT('app.title.Default');
        this.translations.okLabel = gT("app.dialog.OkLabel");
        this.translations.cancelLabel = gT("app.dialog.CancelLabel");
        this.translations.sessionEndedTitle = gT('app.notification.SessionEndedTitle')
        this.translations.sessionEndedContent = gT('app.notification.SessionEndedContent')
        this.translations.sessionExpiredTitle = gT('app.notification.SessionExpiredTitle')
        this.translations.sessionExpiredContent = gT('app.notification.SessionExpiredContent')
        this.translations.defaultTitle = gT('app.share.DefaultTitle')
        this.translations.defaultDescription = gT('app.share.DefaultDescription')

        this.titleTranslations = {
            "Home": gT('app.title.Home'),
            "Latest": gT('app.title.Latest'),
            "Hot": gT('app.title.Hot'),
            "Executing": gT('app.title.Executing'),
            "Completed": gT('app.title.Completed'),
            "Pool": gT('app.title.Pool'),
            "Activity": gT('app.title.Activity'),
            "Me": gT('app.title.Me'),
            "ProjectApplication": gT('app.title.ProjectApplication'),
            "VolunteerApplication": gT('app.title.VolunteerApplication'),
            "AcceptProject": gT('app.title.AcceptProject'),
            "PostProjectReport": gT('app.title.PostProjectReport'),
            "MyProjects": gT('app.title.MyProjects'),
            "DonationRecords": gT('app.title.DonationRecords'),
            "Profile": gT('app.title.Profile'),
            "RealName": gT('app.title.RealName'),
            "Login": gT('app.title.Login'),
            "Notification": gT('app.title.Notification'),
            "ProjectDefault": gT('app.title.ProjectDefault'),
            "Donation": gT('app.title.Donation'),
            "CreateActivity": gT('app.title.CreateActivity'),
        }
        this.inWeixin = this.wxService.isInWeiXin();

        router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                // set nested title
                this.title = this.getTitle(router.routerState, router.routerState.root).join('-');
                if (this.title) titleService.setTitle(this.title);
                let data = router.routerState.root.snapshot.firstChild.data;
                let backlink = data.backlink;
                this.canBack = !(backlink === false);
                this.disableNavigationBar = data.disableNavigationBar || false;
                this.enableContainer = !data.noContainer;

                if (this.inWeixin) {
                    // share link to home page for general config
                    this.wxService.configWxShare(
                        this.configurations.siteUrl + event.urlAfterRedirects,
                        this.configurations.siteUrl,
                        this.translations.defaultTitle,
                        this.translations.defaultDescription,
                        this.configurations.siteUrl + "/android-chrome-512x512.png",
                    );
                }
            }
        });

        this.toastyConfig.theme = 'bootstrap';
        this.toastyConfig.position = 'bottom-center';
        this.toastyConfig.limit = 5;
        this.toastyConfig.showClose = true;
    }

    ngOnInit() {

        this.alertService.getDialogEvent().subscribe(alert => this.showDialog(alert));
        this.alertService.getMessageEvent().subscribe(message => this.showToast(message, false));
        this.alertService.getStickyMessageEvent().subscribe(message => this.showToast(message, true));

        this.navService.getMobileNavBarVisibility().subscribe(_ => this.mobileNavBarVisibility = _);

        this.isUserLoggedIn = this.authService.isLoggedIn;

        //setTimeout(() => {
        //    if (this.isUserLoggedIn) {
        //        this.alertService.resetStickyMessage();

        //        //if (!this.authService.isSessionExpired)
        //        //    this.alertService.showMessage("Login", `Welcome back!`, MessageSeverity.default);
        //        //else
        //        //    this.alertService.showStickyMessage("Session Expired", "Your Session has expired. Please log in again", MessageSeverity.warn);
        //        //
        //        if (this.authService.isSessionExpired) {
        //            this.authService.refreshLogin().subscribe(
        //                _ => isDevMode() && console.log("refreshed login"),
        //                err => {
        //                    this.alertService.showStickyMessage(this.translations.sessionExpiredTitle, this.translations.sessionExpiredContent, MessageSeverity.warn);
        //                });
        //        }
        //    }
        //}, 1000);

        //this.authService.reLoginDelegate = () => this.shouldShowLoginModal = true;

        this.authService.getLoginStatusEvent().subscribe(isLoggedIn => {
            this.isUserLoggedIn = isLoggedIn;

            setTimeout(() => {
                if (!this.isUserLoggedIn) {
                    this.alertService.showMessage(this.translations.sessionEndedTitle, this.translations.sessionEndedContent, MessageSeverity.default);
                }
            }, 500);
        });

        //if (this.authService.isLoggedIn) {
        //    this.meService
        //        .getProfile();
        //    this.meService.ProfileUpdated
        //        .subscribe(res => {
        //            isDevMode() && console.log("app updated profile");
        //            this.tagCustomer(res);
        //            this.medot = res.reservedProject != null;
        //        });
        //}
    }

    //taggedRealNameStatus: string;
    //taggedVolunteerStatus: string;
    //taggedLoggedIn: string;
    taggedLevel: string;
    tagCustomer(profile: any) {
        var level = "登录用户";
        level = (profile.realNameVerificationStatus == "Verified" ? "实名认证" : level);
        level = (profile.volunteerStatus == "Volunteer" ? "点灯人" : level);
        if (this.taggedLevel != level) {
            this.taggedLevel = level;
            this.analyticService.tagCustomer("用户级别", this.taggedLevel);
        }

        //var realNameStatus = (profile.realNameVerificationStatus == "Verified" ? "已实名认证" : null)
        //if (this.taggedRealNameStatus != realNameStatus) {
        //    this.taggedRealNameStatus = realNameStatus;
        //    this.analyticService.tagCustomer("实名认证", this.taggedRealNameStatus);
        //}
        //var volunteerStatus = (profile.volunteerStatus == "Volunteer" ? "已成为点灯人" : null)
        //if (this.taggedVolunteerStatus != volunteerStatus) {
        //    this.taggedVolunteerStatus = volunteerStatus;
        //    this.analyticService.tagCustomer("点灯人", this.taggedVolunteerStatus);
        //}
        //if (this.taggedLoggedIn == null) {
        //    this.taggedLoggedIn = "已登录用户";
        //    this.analyticService.tagCustomer("登录用户", this.taggedLoggedIn);
        //}
    }

    // get from https://stackoverflow.com/a/38652281/2558077
    getTitle(state, parent): string[] {
        var data = [];
        if (parent && parent.snapshot.data && parent.snapshot.data.title) {
            data.push(this.titleTranslations[parent.snapshot.data.title]);
        }

        if (state && parent) {
            data.push(... this.getTitle(state, state.firstChild(parent)));
        }
        return data;
    }

    back() {
        if (this.prevUrl) {
            this.router.navigateByUrl(this.prevUrl);
        } else {
            this.location.back();
        }
    }

    showDialog(dialog: AlertDialog) {
        let labels = {
            ok: dialog.okLabel || this.translations.okLabel,
            cancel: dialog.cancelLabel || this.translations.cancelLabel
        };

        switch (dialog.type) {
            case DialogType.alert:
                this.alertify
                    .okBtn(labels.ok)
                    .alert(dialog.message);

                break
            case DialogType.confirm:
                this.alertify
                    .okBtn(labels.ok)
                    .cancelBtn(labels.cancel)
                    .confirm(dialog.message,
                    (e) => dialog.okCallback(),
                    (e) => {
                        if (dialog.cancelCallback)
                            dialog.cancelCallback();
                    });

                break;
            case DialogType.prompt:
                this.alertify
                    .okBtn(labels.ok)
                    .cancelBtn(labels.cancel)
                    .defaultValue(dialog.defaultValue)
                    .prompt(dialog.message,
                    (val, e) => dialog.okCallback(val),
                    (e) => {
                        if (dialog.cancelCallback)
                            dialog.cancelCallback();
                    });

                break;
        }
    }





    showToast(message: AlertMessage, isSticky: boolean) {
        if (message == null) {
            for (let id of this.stickyToasties.slice(0)) {
                this.toastyService.clear(id);
            }

            return;
        }

        let toastOptions: ToastOptions = {
            title: message.summary,
            msg: message.detail,
            timeout: isSticky ? 0 : 4000
        };


        if (isSticky) {
            toastOptions.onAdd = (toast: ToastData) => this.stickyToasties.push(toast.id);

            toastOptions.onRemove = (toast: ToastData) => {
                let index = this.stickyToasties.indexOf(toast.id, 0);

                if (index > -1) {
                    this.stickyToasties.splice(index, 1);
                }

                toast.onAdd = null;
                toast.onRemove = null;
            };
        }


        switch (message.severity) {
            case MessageSeverity.default: this.toastyService.default(toastOptions); break
            case MessageSeverity.info: this.toastyService.info(toastOptions); break;
            case MessageSeverity.success: this.toastyService.success(toastOptions); break;
            case MessageSeverity.error: this.toastyService.error(toastOptions); break
            case MessageSeverity.warn: this.toastyService.warning(toastOptions); break;
            case MessageSeverity.wait: this.toastyService.wait(toastOptions); break;
        }
    }

    //@ViewChildren('loginModal,loginControl')
    //modalLoginControls: QueryList<any>;

    //loginModal: ModalDirective;
    //loginControl: LoginComponent;

    //ngAfterViewInit() {

    //    this.modalLoginControls.changes.subscribe((controls: QueryList<any>) => {
    //        controls.forEach(control => {
    //            if (control) {
    //                if (control instanceof LoginComponent) {
    //                    this.loginControl = control;
    //                    this.loginControl.modalClosedCallback = () => this.loginModal.hide();
    //                }
    //                else {
    //                    this.loginModal = control;
    //                    this.loginModal.show();
    //                }
    //            }
    //        });
    //    });
    //}

    //onLoginModalShown() {
    //    this.alertService.showStickyMessage("Session Expired", "Your Session has expired. Please log in again", MessageSeverity.info);
    //}


    //onLoginModalHidden() {
    //    this.alertService.resetStickyMessage();
    //    this.loginControl.reset();
    //    this.shouldShowLoginModal = false;

    //    if (this.authService.isSessionExpired)
    //        this.alertService.showStickyMessage("Session Expired", "Your Session has expired. Please log in again to renew your session", MessageSeverity.warn);
    //}


    //onLoginModalHide() {
    //    this.alertService.resetStickyMessage();
    //}
}
