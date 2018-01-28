import { Injectable, Injector } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';

import { AuthService } from './auth.service';
import { ConfigurationService } from './configuration.service';


@Injectable()
export class EndpointFactory {

    static readonly apiVersion: string = "1";

    private readonly _loginUrl: string = "/connect/token";
    private readonly _codeUrl: string = "/connect/code";

    private get loginUrl() { return this.configurations.baseUrl + this._loginUrl; }
    private get codeUrl() { return this.configurations.baseUrl + this._codeUrl; }



    private taskPauser: Subject<any>;
    private isRefreshingLogin: boolean;

    private _authService: AuthService;

    private get authService() {
        if (!this._authService)
            this._authService = this.injector.get(AuthService);

        return this._authService;
    }



    constructor(protected http: Http, protected configurations: ConfigurationService, private injector: Injector) {

    }


    getAuthRequestEndpoint(phoneNumber: string): Observable<Response> {

        let header = new Headers();
        header.append("Content-Type", "application/x-www-form-urlencoded");

        let searchParams = new URLSearchParams();
        searchParams.append('type', 'code');
        searchParams.append('phonenumber', phoneNumber);

        let requestBody = searchParams.toString();

        return this.http.post(this.codeUrl, requestBody, { headers: header });
    }

    getLoginEndpoint(phoneNumber: string, code: string): Observable<Response> {
        let header = new Headers();
        header.append("Content-Type", "application/x-www-form-urlencoded");

        let searchParams = new URLSearchParams();
        searchParams.append('username', phoneNumber);
        searchParams.append('password', code);
        searchParams.append('grant_type', 'password');
        searchParams.append('scope', 'openid email profile offline_access roles');
        searchParams.append('resource', window.location.origin);

        let requestBody = searchParams.toString();

        return this.http.post(this.loginUrl, requestBody, { headers: header });    }

    getCodeLoginEndpoint(code: string): Observable<Response> {
        // as I don't fully understand oauth, this is the tricky code
        return this.getLoginEndpoint("<SPECIAL_CODE>", code);
    }


    getRefreshLoginEndpoint(): Observable<Response> {

        let header = new Headers();
        header.append("Content-Type", "application/x-www-form-urlencoded");

        let searchParams = new URLSearchParams();
        searchParams.append('refresh_token', this.authService.refreshToken);
        searchParams.append('grant_type', 'refresh_token');
        searchParams.append('scope', 'openid email profile offline_access roles');

        let requestBody = searchParams.toString();

        return this.http.post(this.loginUrl, requestBody, { headers: header })
            .map((response: Response) => {
                return response;
            })
            .catch(error => {
                return this.handleError(error, () => this.getRefreshLoginEndpoint());
            });
    }







    protected getAuthHeader(otherOptions?: RequestOptions, includeJsonContentType?: boolean): RequestOptions {
        let options = otherOptions == null ? new RequestOptions() : otherOptions;
        options.headers = options.headers == null ? new Headers() : options.headers;
        let headers = options.headers;

        headers.append("Authorization", 'Bearer ' + this.authService.accessToken);

        if (includeJsonContentType) headers.append("Content-Type", "application/json");

        headers.append("Accept", `application/vnd.iman.v${EndpointFactory.apiVersion}+json, application/json, text/plain, */*`);
        headers.append("App-Version", ConfigurationService.appVersion);

        return options;
    }



    protected handleError(error, continuation: () => Observable<any>) {

        if (error.status == 401) {
            if (this.isRefreshingLogin) {
                return this.pauseTask(continuation);
            }

            this.isRefreshingLogin = true;

            return this.authService.refreshLogin()
                .delay(200)
                .mergeMap(data => {
                    this.isRefreshingLogin = false;
                    this.resumeTasks(true);

                    return continuation();
                })
                .catch(refreshLoginError => {
                    this.isRefreshingLogin = false;
                    this.resumeTasks(false);

                    if (refreshLoginError.status == 401 || (refreshLoginError.url && refreshLoginError.url.toLowerCase().includes(this.loginUrl.toLowerCase()))) {
                        this.authService.reLogin();
                        return Observable.throw('session expired');
                    }
                    else {
                        return Observable.throw(refreshLoginError || 'server error');
                    }
                });
        }

        if (error.url && error.url.toLowerCase().includes(this.loginUrl.toLowerCase())) {
            this.authService.logout();
            this.authService.reLogin();
            return Observable.throw('session expired');
        }
        else {
            return Observable.throw(error || 'server error');
        }
    }

    protected getFormData(file: File): FormData {
        let formData: FormData = new FormData();
        formData.append("file", file);

        //let headers = new Headers();
        //headers.append('Accept', 'application/json');
        //// DON'T SET THE Content-Type to multipart/form-data, You'll get the Missing content-type boundary error
        //let options = new RequestOptions({ headers: headers });

        return formData;
    }


    private pauseTask(continuation: () => Observable<any>) {
        if (!this.taskPauser)
            this.taskPauser = new Subject();

        return this.taskPauser.switchMap(continueOp => {
            return continueOp ? continuation() : Observable.throw('session expired');
        });
    }


    private resumeTasks(continueOp: boolean) {
        setTimeout(() => {
            if (this.taskPauser) {
                this.taskPauser.next(continueOp);
                this.taskPauser.complete();
                this.taskPauser = null;
            }
        });
    }
}
