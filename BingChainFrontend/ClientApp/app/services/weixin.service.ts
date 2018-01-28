import { Injectable, Injector, isDevMode, Inject } from '@angular/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { ConfigurationService } from "./configuration.service";
import { EndpointFactory } from "./endpoint-factory.service";
import { Http, Headers, Response } from "@angular/http";
import { Router } from "@angular/router";

@Injectable()
export class WeixinService extends EndpointFactory {

    private readonly _baseUrl: string = "/wx";
    get baseUrl() { return this.configurations.baseUrl + this._baseUrl; }

    constructor(
        http: Http,
        configurations: ConfigurationService,
        injector: Injector,
        @Inject("WINDOW") private window,
        @Inject("WEIXIN") private wx,
    ) {
        super(http, configurations, injector);
    }

    private getConfigEndpoint(url: string): Observable<Response> {
        let endpointUrl = `${this.baseUrl}/config?url=${encodeURIComponent(url)}`;

        return this.http.get(endpointUrl, this.getAuthHeader())
            .map((response: Response) => response)
            .catch(error => this.handleError(error, () => this.getConfigEndpoint(url)));
    }

    getConfig(url: string): Observable<any> {
        return this.getConfigEndpoint(url)
            .map((response: Response) => response.json());
    }

    public isInWeiXin() {
        // no instance mean maybe in node server
        if (!this.window.navigator) return false;
        let ua = this.window.navigator.userAgent.toLowerCase();
        let match = ua.match(/MicroMessenger/i);
        return (match != null && match.length > 0);
    }

    configWxJs(url: string, wxApiList: Array<string>) {
        if (!this.wx) return;
        this.getConfig(url)
            .subscribe(
            _ => {
                if (isDevMode()) this.wx.error(function (res) { console.error("wx error", res); });
                this.wx.config({
                    //debug: isDevMode(), // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: '', // 必填，公众号的唯一标识
                    timestamp: _.timeStamp, // 必填，生成签名的时间戳
                    nonceStr: _.nonce, // 必填，生成签名的随机串
                    signature: _.signature,// 必填，签名，见附录1
                    jsApiList: wxApiList // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                });
            });
    }

    configWxShare(url: string, shareUrl: string, title: string, desc: string, imgUrl: string, success?: () => void, cancel?: () => void) {
        if (!this.wx) return;
        let shareData = {
            title: title,
            link: shareUrl || url,
            desc: desc,
            imgUrl: imgUrl,
            success: success,
            cancel: cancel,
        };

        this.wx.ready(() => {
            this.wx.onMenuShareAppMessage(shareData);  // 分享微信
            this.wx.onMenuShareTimeline(shareData);    // 分享到朋友圈
            this.wx.onMenuShareQQ(shareData);          // 分享到QQ
            this.wx.onMenuShareWeibo(shareData);
            this.wx.onMenuShareQZone(shareData);
        });

        this.configWxJs(url, [
            'onMenuShareTimeline',
            'onMenuShareAppMessage',
            'onMenuShareQQ',
            'onMenuShareWeibo',
            'onMenuShareQZone',
        ]);
    }
}
