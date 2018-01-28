import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from "../../services/auth.service";

@Component({
    selector: 'nav-menu',
    templateUrl: './navmenu.component.html',
    styleUrls: ['./navmenu.component.css']
})
export class NavMenuComponent implements OnInit {
    @Input() isUserLoggedIn: boolean;
    @Input() medot: boolean = false;

    constructor() { }

    ngOnInit() {
    }
}
