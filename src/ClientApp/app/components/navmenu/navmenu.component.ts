import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from "../../services/auth.service";
import { ConfigurationService } from '../../services/configuration.service';

@Component({
    selector: 'nav-menu',
    templateUrl: './navmenu.component.html',
    styleUrls: ['./navmenu.component.css']
})
export class NavMenuComponent implements OnInit {
    @Input() isUserLoggedIn: boolean;
    @Input() medot: boolean = false;
    get efEnabled(): boolean { return this.configuration.experimentMode; }

    constructor(
        private configuration: ConfigurationService,
    ) { }

    ngOnInit() {
    }
}
