import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'discover-page',
    templateUrl: './discover.page.html',
    styleUrls: ['./discover.page.css']
})
export class DiscoverPage implements OnInit {

    articleList: Array<{ title: string, source: string, time: string, tags?: Array<string> }>;

    constructor() {
        this.articleList = [
            {
                title: "​将区块链技术映射到实体经济？「UChainDb」想成为下一代区块链底层",
                source: "Uchaindb",
                time: "10 min ago",
                tags: ["New"],
            },
            {
                title: "布局区块链底层技术，「UChainDb」认为未来区块链底层公司不超过三家",
                source: "Uchaindb",
                time: "14 min ago",
                tags: ["FAQ"],
            },
        ];
    }

    ngOnInit() {
    }

}
