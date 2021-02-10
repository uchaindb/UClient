import { Component, OnInit, Input } from '@angular/core';
import { UiTextService } from '../../services/uitext.service';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { ArticleType, ArticleList, InfoTabType } from '../../models/discover.model';

@Component({
    selector: 'discover-page',
    templateUrl: './discover.page.html',
    styleUrls: ['./discover.page.css']
})
export class DiscoverPage implements OnInit {

    originList: ArticleList;
    articleList: Array<ArticleType>;
    selectedList: InfoTabType = "guide";

    constructor(
        private uitextService: UiTextService,
        private route: ActivatedRoute,
        private router: Router,
    ) {
        this.route.paramMap
            .subscribe((params: ParamMap) => {
                let category = params.get('category') as InfoTabType;
                if (category) this.selectedList = category;
                this.uitextService.getArticleList()
                    .subscribe(_ => this.setArticle(this.selectedList, _));
            });
    }

    ngOnInit() {
    }

    setArticle(tab: InfoTabType, list?: { [index: string]: Array<ArticleType> }) {
        if (list != null) {
            this.originList = list;
        }

        this.selectedList = tab;
        this.articleList = this.originList[tab];
        for (var item of this.articleList) {
            item.title = item.title.replace("优链", "优擎区块链");
        }
    }

    genLink(article: ArticleType) {
        var segments = article.url.split("/").filter(_ => _);
        var last = segments.length - 1;
        segments[last] = segments[last].replace(/.html$/, '');
        return ['/discover', ...segments];
    }
}
