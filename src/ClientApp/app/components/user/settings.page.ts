import { Component, OnInit, Input } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { AppTranslationService } from '../../services/app-translation.service';
import { LocalSettings } from '../../models/settings.model';
import { ConfigurationService } from '../../services/configuration.service';

@Component({
    selector: 'user-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./common.css']
})
export class SettingsPage implements OnInit {
    settings: LocalSettings = {};
    get efEnabled() { return this.settings.enableExperimentFunction; }
    set efEnabled(value: boolean) { this.settings.enableExperimentFunction = value; }

    translations: {
        importNameTakenTitle?: string,
        importNameTakenContent?: string,
        importNamePromptMessage?: string,
        importInvalidKeyTitle?: string,
        importInvalidKeyContent?: string,
        importKeyPromptMessage?: string,
        createNameTakenTitle?: string,
        createNameTakenContent?: string,
        createNamePromptMessage?: string,
        exportMessage?: string,
    } = {};

    constructor(
        private dataService: ConfigurationService,
        private alertService: AlertService,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.importNameTakenTitle = gT("me.key.notification.ImportNameTakenTitle");
        this.translations.importNameTakenContent = gT("me.key.notification.ImportNameTakenContent");
        this.translations.importNamePromptMessage = gT("me.key.notification.ImportNamePromptMessage");
        this.translations.importInvalidKeyTitle = gT("me.key.notification.ImportInvalidKeyTitle");
        this.translations.importInvalidKeyContent = gT("me.key.notification.ImportInvalidKeyContent");
        this.translations.importKeyPromptMessage = gT("me.key.notification.ImportKeyPromptMessage");
        this.translations.createNameTakenTitle = gT("me.key.notification.CreateNameTakenTitle");
        this.translations.createNameTakenContent = gT("me.key.notification.CreateNameTakenContent");
        this.translations.createNamePromptMessage = gT("me.key.notification.CreateNamePromptMessage");
        this.translations.exportMessage = gT("me.key.notification.ExportMessage");

        this.settings = this.dataService.getSettingsFromStore();
    }

    ngOnInit() {
    }

    toggleExperimentFunction() {
        this.efEnabled = !this.efEnabled;
        this.dataService.saveSettingsToStore(this.settings);
    }
}
