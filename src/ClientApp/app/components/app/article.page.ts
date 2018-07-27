import { Component, OnInit, Input, isDevMode } from '@angular/core';
import { Http } from "@angular/http";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ConfigurationService } from "../../services/configuration.service";
import { UiTextService } from "../../services/uitext.service";
import { AnalyticService } from "../../services/analytic.service";
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

@Component({
    selector: 'article',
    templateUrl: './article.page.html',
    styles: [
        `.article-content /deep/ img { max-width: 100%; }`,
        `.well { background-color: white !important; }`,
    ],
})
export class ArticlePage implements OnInit {
    _url: string;

    set url(value: string) {
        if (!value) return;
        this._url = value;
        this.uiTextService.getUrlContent(this._url)
            .subscribe(html => {
                this.content = this.sanitizer.bypassSecurityTrustHtml(html);
            }, _ => isDevMode() && console.error("read url error", this._url, _));
    }
    get url(): string { return this._url; }

    title: string;
    content: SafeHtml;

    constructor(
        private http: Http,
        private route: ActivatedRoute,
        private router: Router,
        private sanitizer: DomSanitizer,
        private uiTextService: UiTextService,
        private analyticService: AnalyticService,
    ) {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                let url = params.get('url');
                let category = params.get('category');
                this.url = `/${category}/${url}`;
                this.title = "hello";
            },
            err => isDevMode() && console.error(err)
            );
    }

    ngOnInit() {
    }

}
