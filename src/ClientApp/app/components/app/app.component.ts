import { Component, ViewEncapsulation, OnInit, ViewChildren, QueryList, Inject, isDevMode, PLATFORM_ID } from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
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
import { ChainDbService } from '../../services/chain-db.service';
import { NotificationService } from '../../services/notification.service';
import { AlarmService } from '../../services/alarm.service';

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
    intervalCheckAlert: number;
    isCheckingAlert = false;

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
        private chainDbService: ChainDbService,
        private alarmService: AlarmService,
        private notificationService: NotificationService,
        @Inject(PLATFORM_ID) private platformId: string,
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
            "Discover": gT('app.title.Discover'),
            "me.About": gT('app.title.me.About'),
            "me.Feedback": gT('app.title.me.Feedback'),
            "me.Menu": gT('app.title.me.Menu'),
            "me.Keys": gT('app.title.me.Keys'),
            "db.List": gT('app.title.db.List'),
            "db.Connect": gT('app.title.db.Connect'),
            "db.Create": gT('app.title.db.Create'),
            "db.Detail": gT('app.title.db.Detail'),
            "db.Table": gT('app.title.db.Table'),
            "db.Cell": gT('app.title.db.Cell'),
            "db.Chain": gT('app.title.db.Chain'),
            "alert.List": gT('app.title.alert.List'),
            "alert.Detail": gT('app.title.alert.Detail'),
            "Login": gT('app.title.Login'),
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

        this.authService.getLoginStatusEvent().subscribe(isLoggedIn => {
            this.isUserLoggedIn = isLoggedIn;
        });

        if (isPlatformBrowser(this.platformId)) {
            this.intervalCheckAlert = window.setInterval(() => {
                if (this.isCheckingAlert) return;
                this.isCheckingAlert = true;
                this.alarmService.refreshAlerts()
                    .subscribe(_ => {
                        this.isCheckingAlert = false;
                    });
            }, 60 * 1000);

            this.notificationService.getNewNotificationIdentity()
                .subscribe(_ => {
                    this.medot = _;
                    //console.log("set medot", this.medot, _);
                });
        }
    }

    ngOnDestroy() {
        if (this.intervalCheckAlert) {
            clearInterval(this.intervalCheckAlert);
        }
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
}
