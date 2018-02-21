import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { Http } from "@angular/http";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ConfigurationService } from "../../services/configuration.service";
import { UiTextService } from "../../services/uitext.service";
import { AnalyticService } from "../../services/analytic.service";
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare var $;

@Component({
    selector: 'html-modal',
    templateUrl: './html-modal.component.html',
    styles: [
        `.modal-dialog { overflow-y: initial !important }`,
        `.modal-body { max-height: calc(100vh - 200px); overflow-y: auto; }`,
    ]
})
export class HtmlModalComponent implements OnInit {
    _url: string;

    @Input() set url(value: string) {
        if (!value) return;
        this._url = value;
        this.uiTextService.getUrlContent(this._url)
            .subscribe(html => {
                this.content = this.sanitizer.bypassSecurityTrustHtml(html);
            }, _ => isDevMode() && console.error("read url error", this._url, _));
    }
    get url(): string { return this._url; }

    @Input() title: string;
    content: SafeHtml;

    constructor(
        private http: Http,
        private sanitizer: DomSanitizer,
        private uiTextService: UiTextService,
        private analyticService: AnalyticService,
        @Inject(PLATFORM_ID) private platformId: string,
    ) { }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            $('#htmlModal').on('shown.bs.modal', _ => {
                this.analyticService.trackEvent('弹出框', this.title);
            })
        }
    }

}
