import { Component, OnInit, Input } from '@angular/core';
import { ConfigurationService } from '../../services/configuration.service';

@Component({
    selector: 'mobile-nav-menu',
    templateUrl: './mobile-navmenu.component.html',
    styleUrls: ['./mobile-navmenu.component.css']
})
export class MobileNavMenuComponent implements OnInit {
    @Input() medot: boolean = false;
    get efEnabled(): boolean { return this.configuration.experimentMode; }

    constructor(
        private configuration: ConfigurationService,
    ) { }

    ngOnInit() {
    }

}
