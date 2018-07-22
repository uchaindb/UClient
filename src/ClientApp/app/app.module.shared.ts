import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './components/app/app.component';
import { NavMenuComponent } from './components/navmenu/navmenu.component';
import { MobileNavMenuComponent } from "./components/navmenu/mobile-navmenu.component";
import { AlarmListPage } from "./components/alarm/list.page";
import { AlarmDetailPage } from "./components/alarm/detail.page";
import { UserMenuPage } from "./components/user/menu.page";
import { LoginPage } from "./components/user/login.page";
import { DiscoverPage } from "./components/app/discover.page";
import { DatabaseListPage } from "./components/database/list.page";
import { DatabaseAddPage } from "./components/database/add.page";
import { DatabaseDetailPage } from "./components/database/detail.page";
import { DatabaseTablePage } from "./components/database/table.page";
import { DatabaseChainPage } from "./components/database/chain.page";
import { DatabaseCellPage } from "./components/database/cell.page";
import { DatabaseTableComponent } from "./components/database/table.component";
import { AboutPage } from './components/app/about.page';
import { FeedbackPage } from './components/app/feedback.page';
import { ArticlePage } from './components/app/article.page';

import { NotificationService } from "./services/notification.service";
import { OnlyNumberDirective } from "./directives/only-number.directive";
import { ConfigurationService } from "./services/configuration.service";
import { AlertService } from "./services/alert.service";
import { AuthService } from "./services/auth.service";
import { LocalStoreManager } from "./services/local-store-manager.service";
import { EndpointFactory } from "./services/endpoint-factory.service";
import { AuthGuard } from "./services/auth-guard.service";
import { AlarmService } from './services/alarm.service';

import { ToastyModule } from 'ng2-toasty';
import { BusyModule, BusyConfig } from 'angular2-busy';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { AppTranslationService, TranslateLanguageLoader } from './services/app-translation.service';
import { NavService } from "./services/nav.service";
import { LightboxModule } from 'angular2-lightbox';
import { HtmlModalComponent } from "./components/controls/html-modal.component";
import { WeixinService } from "./services/weixin.service";
import { UiTextService } from "./services/uitext.service";
import { NewlinePipe } from "./pipe/newline.pipe";
import { HashBeautyPipe } from "./pipe/hashbeauty.pipe";
import { TruncatePipe } from './pipe/truncate.pipe';
import { AnalyticService } from "./services/analytic.service";
import { ChainDbService } from './services/chain-db.service';
import { CryptographyService } from './services/cryptography.service';
import { DatabaseActionComponent } from './components/database/action.component';
import { DatabaseNavComponent } from './components/database/nav.component';
import { KeyManagePage } from './components/user/key.page';
import { DatabaseAlarmListComponent } from './components/database/alarm-list.component';
import { DatabaseCreatePage } from './components/database/create.page';
import { PrivateKeyService } from './services/private-key.service';
import { RouteTransformerDirective } from './directives/route-transformer.directive';

import { Ng2SmartTableModule } from 'ng2-smart-table';
import { DragulaModule } from 'ng2-dragula';
import { SettingsPage } from './components/user/settings.page';

@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        MobileNavMenuComponent,
        AlarmListPage,
        AlarmDetailPage,
        DiscoverPage,
        ArticlePage,
        UserMenuPage,
        LoginPage,
        DatabaseListPage,
        DatabaseAddPage,
        DatabaseDetailPage,
        DatabaseTablePage,
        DatabaseChainPage,
        DatabaseCellPage,
        DatabaseCreatePage,
        DatabaseTableComponent,
        DatabaseNavComponent,
        AboutPage,
        FeedbackPage,
        KeyManagePage,
        SettingsPage,
        HtmlModalComponent,
        DatabaseActionComponent,
        DatabaseAlarmListComponent,
        OnlyNumberDirective,
        NewlinePipe,
        HashBeautyPipe,
        TruncatePipe,
        RouteTransformerDirective,
    ],
    imports: [
        CommonModule,
        HttpModule,
        FormsModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'database', pathMatch: 'full' },
            { path: 'discover', component: DiscoverPage, canActivate: [AuthGuard], data: { title: "Discover", backlink: false, } },
            { path: 'discover/:category', component: DiscoverPage, canActivate: [AuthGuard], data: { title: "Discover", backlink: false, } },
            { path: 'discover/:category/:url', component: ArticlePage, canActivate: [AuthGuard], data: { title: "Discover", } },
            { path: 'app/about', component: AboutPage, canActivate: [AuthGuard], data: { title: "me.About", } },
            { path: 'app/feedback', component: FeedbackPage, canActivate: [AuthGuard], data: { title: "me.Feedback", } },
            { path: 'database', component: DatabaseListPage, canActivate: [AuthGuard], data: { title: "db.List", backlink: false, } },
            { path: 'database/add', component: DatabaseAddPage, canActivate: [AuthGuard], data: { title: "db.Connect", } },
            { path: 'database/:dbid/create', component: DatabaseCreatePage, canActivate: [AuthGuard], data: { title: "db.Create", } },
            { path: 'database/:dbid', component: DatabaseDetailPage, canActivate: [AuthGuard], data: { title: "db.Detail", } },
            { path: 'database/:dbid/table/:tid', component: DatabaseTablePage, canActivate: [AuthGuard], data: { title: "db.Table", } },
            { path: 'database/:dbid/table/:tid/cell/:pk/:col', component: DatabaseCellPage, canActivate: [AuthGuard], data: { title: "db.Cell", } },
            { path: 'database/:dbid/chain/:id', component: DatabaseChainPage, canActivate: [AuthGuard], data: { title: "db.Chain", } },
            { path: 'alarm', component: AlarmListPage, canActivate: [AuthGuard], data: { title: "alarm.List", backlink: false, } },
            { path: 'alarm/:id', component: AlarmDetailPage, canActivate: [AuthGuard], data: { title: "alarm.Detail", } },
            { path: 'user', component: UserMenuPage, canActivate: [AuthGuard], data: { title: "me.Menu", backlink: false } },
            { path: 'user/keys', component: KeyManagePage, canActivate: [AuthGuard], data: { title: "me.Keys" } },
            { path: 'user/settings', component: SettingsPage, canActivate: [AuthGuard], data: { title: "me.Settings" } },
            { path: 'login', component: LoginPage, data: { title: "Login" } },

            { path: '**', redirectTo: '' }
        ]),
        ToastyModule.forRoot(),
        BrowserAnimationsModule,
        BusyModule.forRoot(
            new BusyConfig({
                message: '通信中...',
            })
        ),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useClass: TranslateLanguageLoader
            }
        }),
        LightboxModule,
        Ng2SmartTableModule,
        DragulaModule,
    ],
    providers: [
        NotificationService,
        WeixinService,
        AnalyticService,
        UiTextService,
        ConfigurationService,
        AlertService,
        AuthService,
        NavService,
        LocalStoreManager,
        EndpointFactory,
        AuthGuard,
        AppTranslationService,
        ChainDbService,
        CryptographyService,
        PrivateKeyService,
        AlarmService,
    ],
})
export class AppModuleShared {
}
