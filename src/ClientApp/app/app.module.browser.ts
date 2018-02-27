import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppModuleShared } from './app.module.shared';
import { AppComponent } from './components/app/app.component';
var alertify = require("alertify.js")

declare var GLOBAL_API_BASE_URL;
declare var wx;
declare var _czc;
declare var UCLIENT_VERSION;

@NgModule({
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        AppModuleShared
    ],
    providers: [
        { provide: 'ORIGIN_URL', useValue: location.origin },
        { provide: 'GLOBAL_API_BASE_URL', useValue: GLOBAL_API_BASE_URL },
        { provide: 'WINDOW', useValue: window },
        { provide: 'WEIXIN', useValue: typeof wx === 'undefined' ? null : wx },
        { provide: 'ALERTIFY', useValue: alertify },
        { provide: 'CZC', useValue: { getInstance: () => { return typeof _czc === 'undefined' ? null : _czc; } } },
        { provide: 'UCLIENT_VERSION', useValue: UCLIENT_VERSION },
    ]
})
export class AppModule {
}
