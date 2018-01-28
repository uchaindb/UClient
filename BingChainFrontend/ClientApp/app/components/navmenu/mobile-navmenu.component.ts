import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'mobile-nav-menu',
    templateUrl: './mobile-navmenu.component.html',
    styleUrls: ['./mobile-navmenu.component.css']
})
export class MobileNavMenuComponent implements OnInit {
    @Input() medot: boolean = false;

    constructor() { }

    ngOnInit() {
    }

}
