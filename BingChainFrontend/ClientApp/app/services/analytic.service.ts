import { Injectable, Inject } from '@angular/core';
import { Router } from "@angular/router";
import 'rxjs/add/operator/pairwise';

@Injectable()
export class AnalyticService {

    get czc() {
        if (this.czcFactory == null) return null;
        return this.czcFactory.getInstance();
    }

    constructor(
        @Inject("CZC") private czcFactory,
        private router: Router,
    ) {
    }

    trackPageview(currentUrl: string, refererUrl: string) {
        if (this.czc != null) {
            //console.log("trackview", currentUrl, refererUrl);
            this.czc.push(["_trackPageview", currentUrl, refererUrl]);
        }
    }

    tagCustomer(name: string, value: string, time?: number) {
        //0:表示只在该页面进行相关统计。
        //1:表示长期。
        //2:表示只在该访客的这一访问之内进行统计
        time = time == null ? 1 : time;
        if (this.czc != null) {
            //console.log("tagcustomer", name, value, time);
            this.czc.push(["_setCustomVar", name, value, time]);
        }
    }

    untagCustomer(name: string) {
        if (this.czc != null) {
            this.czc.push(["_deleteCustomVar", name]);
        }
    }

    trackEvent(category: string, action: string, label?: string, value?: string, nodeid?: string) {
        if (this.czc != null) {
            this.czc.push(["_trackEvent", category, action, label, value, nodeid]);
            //category：事件类别，必填项，表示事件发生在谁身上，如“视频”、“小说”、“轮显层”等等。
            //action：事件操作，必填项，表示访客跟元素交互的行为动作，如"播放"、"收藏"、"翻层"等等。
            //label：事件标签，选填项，用于更详细的描述事件，从各个方面都可以，比如具体是哪个视频，哪部小说，翻到了第几层等等。
            //value：事件值，选填项，整数型，用于填写打分型事件的分值，加载时间型事件的时长，订单型事件的价格等等。
            //nodeid：div元素id，选填项，填写网页中的div元素id值，用于在“用户视点”功能上重绘元素的事件发生情况。
        }
    }
}
