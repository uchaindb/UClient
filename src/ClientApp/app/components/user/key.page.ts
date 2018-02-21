import { Component, OnInit, Input } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';

@Component({
    selector: 'user-key',
    templateUrl: './key.page.html',
    styleUrls: ['./common.css']
})
export class KeyManagePage implements OnInit {
    keylist: Array<{ name: string, address: string }>;

    constructor(
        private dataService: ChainDbService
    ) {
        this.keylist = [{
            name: "hello",
            address: "AB-CD-EF-45-33-...-44",
        }];
    }

    ngOnInit() {
    }

}
