import { Injectable, Inject, isDevMode } from '@angular/core';
import { LocalStoreManager } from './local-store-manager.service';
import { DBkeys } from './db-keys';
import { Utilities } from './utilities';
import { LocalSettings } from '../models/settings.model';

type UserConfiguration = {
    theme: string,
};

@Injectable()
export class ConfigurationService {

    public static readonly appVersion: string = "1.0.0";

    public siteUrl: string = this.rawBaseUrl;
    public baseUrl: string = this.apiBaseUrl || this.rawBaseUrl.replace(/\/$/, '');
    public fallbackBaseUrl: string = "http://uchaindb.com/ucdb/api";
    public loginUrl: string = "/login";
    public experimentMode: boolean = false;

    private _theme: string = null;

    //***Specify default configurations here***
    public static readonly defaultTheme: string = "Default";
    public static readonly defaultHomeUrl: string = "/";
    //***End of defaults***  

    public static readonly DBKEY_SETTINGS_KEY_DATA = "settings_key";

    constructor(
        private localStorage: LocalStoreManager,
        @Inject("GLOBAL_API_BASE_URL") private apiBaseUrl,
        @Inject("WINDOW") private window,
        @Inject("ORIGIN_URL") private origin_url,
    ) {
        this.loadLocalChanges();
        this.getSettingsFromStore();
    }

    getSettingsFromStore(): LocalSettings {
        try {
            var settings = this.localStorage.getData(ConfigurationService.DBKEY_SETTINGS_KEY_DATA) as LocalSettings || {};
            this.experimentMode = settings.enableExperimentFunction;
            return settings;
        }
        catch (err) {
            isDevMode() && console.error(err);
            return { enableExperimentFunction: false };
        }
    }

    saveSettingsToStore(settings: LocalSettings): void {
        this.localStorage.savePermanentData(settings, ConfigurationService.DBKEY_SETTINGS_KEY_DATA);
        this.experimentMode = settings.enableExperimentFunction;
    }

    public get rawBaseUrl() {
        if (this.origin_url) return this.origin_url;
        if (!this.window.location) return "";
        if (this.window.location.origin)
            return this.window.location.origin

        return this.window.location.protocol + "//" + this.window.location.hostname + (this.window.location.port ? ':' + this.window.location.port : '');
    }

    private loadLocalChanges() {
        if (this.localStorage.exists(DBkeys.THEME))
            this._theme = this.localStorage.getDataObject<string>(DBkeys.THEME);
    }


    private saveToLocalStore(data: any, key: string) {
        setTimeout(() => this.localStorage.savePermanentData(data, key));
    }


    public import(jsonValue: string) {

        this.clearLocalChanges();

        if (!jsonValue)
            return;

        let importValue: UserConfiguration = Utilities.JSonTryParse(jsonValue);

        if (importValue.theme != null)
            this.theme = importValue.theme;
    }


    public export(changesOnly = true): string {

        let exportValue: UserConfiguration =
            {
                theme: changesOnly ? this._theme : this.theme,
            };

        return JSON.stringify(exportValue);
    }


    public clearLocalChanges() {
        this._theme = null;

        this.localStorage.deleteData(DBkeys.THEME);
    }

    set theme(value: string) {
        this._theme = value;
        this.saveToLocalStore(value, DBkeys.THEME);
    }
    get theme() {
        if (this._theme != null)
            return this._theme;

        return ConfigurationService.defaultTheme;
    }
}
