import { Component, OnInit, OnDestroy, Input, Inject, isDevMode } from "@angular/core";
import { DOCUMENT } from '@angular/platform-browser';

import { AlertService, MessageSeverity, DialogType } from '../../services/alert.service';
import { AuthService } from "../../services/auth.service";
import { ConfigurationService } from '../../services/configuration.service';
import { Utilities } from '../../services/utilities';
import { AppTranslationService, LoadingMessage } from "../../services/app-translation.service";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { IBusyConfig } from "angular2-busy";
import { Observable } from "rxjs/Observable";
import { WeixinService } from "../../services/weixin.service";

@Component({
    selector: 'login-page',
    templateUrl: './login.page.html',
    styles: [
        `.weixin-portrait-desktop { height: 32px; width: 32px; object-fit: cover;}`,
        `.weixin-portrait-mobile { height: 64px; width: 64px; object-fit: cover;}`,
    ]
})
export class LoginPage implements OnInit, OnDestroy {
    code: string = "";
    phonenumber: string = "";
    agree: boolean = true;
    rememberMe: boolean = true;

    isLoading = false;
    formResetToggle = true;
    modalClosedCallback: () => void;
    loginStatusSubscription: any;

    inWeixin = false;
    wxCode: string;
    wxPortrait: string;
    wxName: string;
    wxBound: boolean;
    remainSeconds: number = 0;
    isRedirectingWeixin = false;
    loginRedirectUrl: string;

    @Input()
    isModal = false;

    translations: {
        loggingIn?: string,
        loginTitle?: string,
        loginMessage?: any,
        sessionRestoreTitle?: string,
        sessionRestoreMessage?: any,
        repeatLastOperationTitle?: string,
        repeatLastOperationMessage?: string,
        unableToLoginTitle?: string,
        unableToLoginMessage?: any,
        sendCodeTitle?: string,
        sendCodeMessage?: string,
        unableToSendCodeTitle?: string,
        unableToSendCodeMessage?: any,
    } = {};

    errorTranslations: {
        GeneralError?: string,
        PhoneNumberIsNotValid?: string,
        FailedToInitializeAccount?: string,
        AccountSuspended?: string,
        AccountDisabled?: string,
        FailedToGenerateCode?: string,
        IncorrectAccountPasswordCombination?: string,
        IncorrectPhoneNumberCodeCombination?: string,
        AccountNotAllowToLogin?: string,
        RefreshTokenNotValid?: string,
        FailedToSendCode?: string,
        ExceedCodeIntervalLimit?: string,
        ExceedCodeNumberLimit?: string,
        OutdatedCode?: string,
    } = {};
    busyConfig: IBusyConfig = {};
    loadingMessage: LoadingMessage;

    constructor(
        private alertService: AlertService,
        private authService: AuthService,
        private configurations: ConfigurationService,
        private translationService: AppTranslationService,
        private route: ActivatedRoute,
        private wxService: WeixinService,
        @Inject(DOCUMENT) private document: any,
    ) {
        this.loginRedirectUrl =this.authService.loginRedirectUrl;
        this.authService.localLogin();
        this.authService.redirectLoginUser();

        let t = 1;
        if (t == 1) return;

        let gT = (key: string, params?: Object) => translationService.getTranslation(key, params);
        this.loadingMessage = translationService.loadingMessage;

        this.translations.loggingIn = gT("me.login.notification.LoggingIn");
        this.translations.loginTitle = gT("me.login.notification.LoginTitle");
        this.translations.loginMessage = (params: Object) => gT("me.login.notification.LoginMessage", params);
        this.translations.sessionRestoreTitle = gT("me.login.notification.SessionRestoreTitle");
        this.translations.sessionRestoreMessage = (params: Object) => gT("me.login.notification.SessionRestoreMessage", params);
        this.translations.repeatLastOperationTitle = gT("me.login.notification.RepeatLastOperationTitle");
        this.translations.repeatLastOperationMessage = gT("me.login.notification.RepeatLastOperationMessage");
        this.translations.unableToLoginTitle = gT("me.login.notification.UnableToLoginTitle");
        this.translations.unableToLoginMessage = (params: Object) => gT("me.login.notification.UnableToLoginMessage", params);
        this.translations.sendCodeTitle = gT("me.login.notification.SendCodeTitle");
        this.translations.sendCodeMessage = gT("me.login.notification.SendCodeMessage");
        this.translations.unableToSendCodeTitle = gT("me.login.notification.UnableToSendCodeTitle");
        this.translations.unableToSendCodeMessage = (params: Object) => gT("me.login.notification.UnableToSendCodeMessage", params);

        this.errorTranslations.GeneralError = gT("me.login.error.GeneralError");
        this.errorTranslations.PhoneNumberIsNotValid = gT("me.login.error.PhoneNumberIsNotValid");
        this.errorTranslations.FailedToInitializeAccount = gT("me.login.error.FailedToInitializeAccount");
        this.errorTranslations.AccountSuspended = gT("me.login.error.AccountSuspended");
        this.errorTranslations.AccountDisabled = gT("me.login.error.AccountDisabled");
        this.errorTranslations.FailedToGenerateCode = gT("me.login.error.FailedToGenerateCode");
        this.errorTranslations.IncorrectAccountPasswordCombination = gT("me.login.error.IncorrectAccountPasswordCombination");
        this.errorTranslations.IncorrectPhoneNumberCodeCombination = gT("me.login.error.IncorrectPhoneNumberCodeCombination");
        this.errorTranslations.AccountNotAllowToLogin = gT("me.login.error.AccountNotAllowToLogin");
        this.errorTranslations.RefreshTokenNotValid = gT("me.login.error.RefreshTokenNotValid");
        this.errorTranslations.FailedToSendCode = gT("me.login.error.FailedToSendCode");
        this.errorTranslations.ExceedCodeIntervalLimit = gT("me.login.error.ExceedCodeIntervalLimit");
        this.errorTranslations.ExceedCodeNumberLimit = gT("me.login.error.ExceedCodeNumberLimit");
        this.errorTranslations.OutdatedCode = gT("me.login.error.OutdatedCode");

        this.inWeixin = this.wxService.isInWeiXin();
        this.route.queryParamMap
            .subscribe((params: ParamMap) => {
                this.wxCode = <string>params.get('code');
                this.wxPortrait = <string>params.get('portrait');
                this.wxName = <string>params.get('name');
                let redirectUrl = <string>params.get('returnUrl');
                this.authService.loginRedirectUrl = redirectUrl;
                this.wxBound = (params.get('bound') || "").toLowerCase() == "true";

                if (this.wxCode != null) {
                    if (this.wxBound) {
                        // directly weixin auth code login process
                        this.isLoading = true;
                        this.alertService.startLoadingMessage("", this.translations.loggingIn);
                        this.busyConfig.message = this.loadingMessage.load;
                        this.busyConfig.busy = authService.codeLogin(this.wxCode)
                            .subscribe(user => {
                                this.alertService.stopLoadingMessage();
                                this.isLoading = false;
                                this.reset();

                                this.alertService.resetStickyMessage();
                                this.alertService.showMessage(this.translations.loginTitle, this.translations.loginMessage({ name: user.nickName }), MessageSeverity.success);

                            }, err => {
                                this.alertService.stopLoadingMessage();
                                this.isLoading = false;
                                this.reset();
                                isDevMode() && console.warn(err);
                            });
                    } else {
                        // display weixin info and ask user to login
                    }
                } else {
                    if (this.inWeixin) {
                        this.wxAuth();
                    }
                }
            },
            err => isDevMode() && console.error(err)
            );

    }

    wxAuth() {
        this.isRedirectingWeixin = true;
        let baseUrl = this.configurations.siteUrl;
        let returnUrl = `${baseUrl}/login` + (this.loginRedirectUrl == null ? '' : `?returnUrl=${this.loginRedirectUrl}`);
        let redirectUrl = `${this.configurations.baseUrl}/wx/signin?returnUrl=${encodeURIComponent(returnUrl)}`
        this.document.location.href = redirectUrl;
    }

    sendCode() {
        if (this.remainSeconds > 0) return;
        this.startCountDown();
        this.authService.sendCode(this.phonenumber)
            .subscribe(
            _ => {
                setTimeout(() => {
                    this.alertService.resetStickyMessage();
                    this.alertService.showMessage(this.translations.sendCodeTitle, this.translations.sendCodeMessage, MessageSeverity.success);
                }, 500);
            },
            error => {
                if (Utilities.checkNoNetwork(error)) {
                    this.alertService.showStickyMessage(Utilities.noNetworkMessageCaption, Utilities.noNetworkMessageDetail, MessageSeverity.error, error);
                    // this.offerAlternateHost();
                }
                else {
                    let errorMessage = Utilities.findHttpResponseMessage("error_description", error);
                    let errorCode = Utilities.findHttpResponseMessage("code", error);

                    if (!errorCode && errorMessage) isDevMode() && console.warn(errorMessage);
                    if (errorCode)
                        this.alertService.showStickyMessage(this.translations.unableToSendCodeTitle, this.errorTranslations[errorCode], MessageSeverity.error, error);
                    else
                        this.alertService.showStickyMessage(this.translations.unableToSendCodeTitle, this.translations.unableToSendCodeMessage({ error: error.statusText || error.status }),
                            MessageSeverity.error, error);
                }
                this.remainSeconds = 0;
            });
    }

    startCountDown() {
        var start = 60;
        Observable
            .timer(0, 1000) // timer(firstValueDelay, intervalBetweenValues)
            .map(i => start - i)
            .take(start + 1)
            .subscribe(i => this.remainSeconds = i);
    }

    ngOnInit() {

        this.rememberMe = this.authService.rememberMe;

        if (this.getShouldRedirect()) {
            this.authService.redirectLoginUser();
        }
        else {
            this.loginStatusSubscription = this.authService.getLoginStatusEvent().subscribe(isLoggedIn => {
                if (this.getShouldRedirect()) {
                    this.authService.redirectLoginUser();
                }
            });
        }
    }


    ngOnDestroy() {
        if (this.loginStatusSubscription)
            this.loginStatusSubscription.unsubscribe();
    }


    getShouldRedirect() {
        return !this.isModal && this.authService.isLoggedIn && !this.authService.isSessionExpired;
    }


    showErrorAlert(caption: string, message: string) {
        this.alertService.showMessage(caption, message, MessageSeverity.error);
    }

    closeModal() {
        if (this.modalClosedCallback) {
            this.modalClosedCallback();
        }
    }


    login() {
        this.isLoading = true;
        this.alertService.startLoadingMessage("", this.translations.loggingIn);

        var password = this.wxCode ? `${this.code}|${this.wxCode}` : this.code;
        let rememberMe = this.wxCode ? true : this.rememberMe;
        this.authService.login(this.phonenumber, password, this.rememberMe)
            .subscribe(
            user => {
                setTimeout(() => {
                    this.alertService.stopLoadingMessage();
                    this.isLoading = false;
                    this.reset();

                    if (!this.isModal) {
                        this.alertService.resetStickyMessage();
                        this.alertService.showMessage(this.translations.loginTitle, this.translations.loginMessage({ name: user.nickName }), MessageSeverity.success);
                    }
                    else {
                        this.alertService.resetStickyMessage();
                        this.alertService.showMessage(this.translations.sessionRestoreTitle, this.translations.sessionRestoreMessage({ name: user.nickName }), MessageSeverity.success);
                        setTimeout(() => {
                            this.alertService.showStickyMessage(this.translations.repeatLastOperationTitle, this.translations.repeatLastOperationMessage, MessageSeverity.default);
                        }, 500);

                        this.closeModal();
                    }
                }, 500);
            },
            error => {

                this.alertService.stopLoadingMessage();

                if (Utilities.checkNoNetwork(error)) {
                    this.alertService.showStickyMessage(Utilities.noNetworkMessageCaption, Utilities.noNetworkMessageDetail, MessageSeverity.error, error);
                    // this.offerAlternateHost();
                }
                else {
                    let errorMessage = Utilities.findHttpResponseMessage("error_description", error);
                    let errorCode = Utilities.findHttpResponseMessage("code", error);

                    if (!errorCode && errorMessage) isDevMode() && console.warn(errorMessage);
                    if (errorCode)
                        this.alertService.showStickyMessage(this.translations.unableToLoginTitle, this.errorTranslations[errorCode], MessageSeverity.error, error);
                    else
                        this.alertService.showStickyMessage(this.translations.unableToLoginTitle, this.translations.unableToLoginMessage({ error: error.statusText || error.status }),
                            MessageSeverity.error, error);
                }

                setTimeout(() => {
                    this.isLoading = false;
                }, 500);
            });
    }


    offerAlternateHost() {

        if (Utilities.checkIsLocalHost(location.origin) && Utilities.checkIsLocalHost(this.configurations.baseUrl)) {
            this.alertService.showDialog("服务器连接出现问题，是否要连接到开发用备用服务器？（测试使用）",
                DialogType.prompt,
                (value: string) => {
                    this.configurations.baseUrl = value;
                    this.alertService.showStickyMessage("API地址修改了!", "目标API地址已成功修改为: " + value, MessageSeverity.warn);
                },
                null,
                null,
                null,
                this.configurations.fallbackBaseUrl);
        }
    }

    reset() {
        this.formResetToggle = false;

        setTimeout(() => {
            this.formResetToggle = true;
        });
    }
}

