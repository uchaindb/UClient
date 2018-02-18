import { Component, OnInit, Input } from '@angular/core';
import { UiTextService } from '../../services/uitext.service';

export type ArticleType = { title: string, url: string, author: string, date: string };
export type InfoTabType = "guide" | "faq" | "db" | "case";

@Component({
    selector: 'discover-page',
    templateUrl: './discover.page.html',
    styleUrls: ['./discover.page.css']
})
export class DiscoverPage implements OnInit {

    originList: { [index: string]: Array<ArticleType> };
    articleList: Array<ArticleType>;
    selectedList: InfoTabType = "guide";

    constructor(
        private uitextService: UiTextService,
    ) {
        this.uitextService.getArticleList()
            .subscribe(_ => this.setArticle(this.selectedList, _));
    }

    ngOnInit() {
    }

    setArticle(tab: InfoTabType, list?: { [index: string]: Array<ArticleType> }) {
        if (list != null) this.originList = list;

        this.articleList = this.originList[tab];
    }
}
