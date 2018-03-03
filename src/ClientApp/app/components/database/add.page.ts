import { Component, OnInit, Input } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { ChainDb } from '../../models/chain-db.model';
import { Router } from '@angular/router';
import { AlertService, MessageSeverity } from '../../services/alert.service';
import { AppTranslationService } from '../../services/app-translation.service';

@Component({
    selector: 'database-add',
    templateUrl: './add.page.html',
    styleUrls: ['./common.css']
})
export class DatabaseAddPage implements OnInit {

    readonly maxSearchListNumber = 5;

    searchList: Array<ChainDb>;
    recommendList: Array<ChainDb>;
    wholeList: Array<ChainDb>;
    translations: {
        databaseAddedTitle?: string,
        databaseAddedContent?: string,
        manualAddEmptyAddressTitle?: string,
        manualAddEmptyAddressContent?: string,
    } = {};

    manualName: string;
    manualDesc: string;
    manualAddress: string;

    constructor(
        private dataService: ChainDbService,
        private router: Router,
        private alertService: AlertService,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.databaseAddedTitle = gT('db.add.notification.DatabaseAddedTitle')
        this.translations.databaseAddedContent = gT('db.add.notification.DatabaseAddedContent')
        this.translations.manualAddEmptyAddressTitle = gT('db.add.notification.ManualAddEmptyAddressTitle')
        this.translations.manualAddEmptyAddressContent = gT('db.add.notification.ManualAddEmptyAddressContent')
    }

    ngOnInit() {
        this.dataService.getRecommendDbList()
            .subscribe(_ => this.setList(_));
    }

    setList(list: Array<ChainDb>) {
        this.wholeList = list;
        this.recommendList = list
            .filter(_ => _.staffpick > 0)
            .sort((a, b) => a.staffpick == b.staffpick ? 0 : +(a.staffpick > b.staffpick) || -1);
    }

    updateSearchList(searchText: string) {
        if (!searchText) {
            this.searchList = [];
            return;
        }

        this.searchList = this.wholeList
            .filter(_ => _.name.indexOf(searchText) > -1
                || _.description.indexOf(searchText) > -1
                || _.id == searchText
                || _.address.indexOf(searchText) > -1
            )
            .slice(0, this.maxSearchListNumber);
    }

    select(item: ChainDb) {
        this.dataService.addChainDb(item);
        this.alertService.showMessage(this.translations.databaseAddedTitle, this.translations.databaseAddedContent, MessageSeverity.success);
        this.router.navigate(["/database", item.id]);
    }

    saveManual() {
        if (!this.manualAddress) {
            this.alertService.showMessage(this.translations.manualAddEmptyAddressTitle, this.translations.manualAddEmptyAddressContent, MessageSeverity.error);
            return;
        }
        this.dataService.getDbList()
            .subscribe(list => {
                let id = 100000;
                while (list.findIndex(_ => _.id == id.toString()) > -1) {
                    id++;
                }
                let item: ChainDb = {
                    id: id.toString(),
                    name: this.manualName ? this.manualName : this.manualAddress,
                    description: this.manualDesc ? this.manualDesc : this.manualName ? this.manualName : this.manualAddress,
                    address: this.manualAddress,
                    image: '/apple-touch-icon.png',
                };
                this.dataService.addChainDb(item);
                this.alertService.showMessage(this.translations.databaseAddedTitle, this.translations.databaseAddedContent, MessageSeverity.success);
                this.router.navigate(["/database", item.id]);
            });
    }
}
