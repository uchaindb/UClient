import { Injectable } from '@angular/core';
import { TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';

@Injectable()
export class NavService {

    private mobileNavBarVisibility = new Subject<boolean>();

    constructor(private translate: TranslateService) {
    }

    hideMobileNavBar() {
        this.mobileNavBarVisibility.next(false);
    }

    showMobileNavBar() {
        this.mobileNavBarVisibility.next(true);
    }

    getMobileNavBarVisibility(): Observable<boolean> {
        return this.mobileNavBarVisibility.asObservable();
    }
}
