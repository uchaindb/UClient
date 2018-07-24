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
        enableExperimentFunctionConfirm?: string,
        experimentFunctionDisabledTitle?: string,
        experimentFunctionDisabledContent?: string,
        experimentFunctionEnabledTitle?: string,
        experimentFunctionEnabledContent?: string,
    } = {};

    constructor(
        private dataService: ConfigurationService,
        private alertService: AlertService,
        private translationService: AppTranslationService,
    ) {
        let gT = (key: string) => this.translationService.getTranslation(key);
        this.translations.enableExperimentFunctionConfirm = gT("me.settings.notification.EnableExperimentFunctionConfirm");
        this.translations.experimentFunctionDisabledTitle = gT("me.settings.notification.ExperimentFunctionDisabledTitle");
        this.translations.experimentFunctionDisabledContent = gT("me.settings.notification.ExperimentFunctionDisabledContent");
        this.translations.experimentFunctionEnabledTitle = gT("me.settings.notification.ExperimentFunctionEnabledTitle");
        this.translations.experimentFunctionEnabledContent = gT("me.settings.notification.ExperimentFunctionEnabledContent");

        this.settings = this.dataService.getSettingsFromStore();
    }

    ngOnInit() {
    }

    toggleExperimentFunction() {
        if (!this.efEnabled) {
            this.alertService.showDialog(this.translations.enableExperimentFunctionConfirm, DialogType.confirm, name => {
                this.toggleExperimentFunctionInternal();
                this.alertService.showMessage(this.translations.experimentFunctionEnabledTitle, this.translations.experimentFunctionEnabledContent, MessageSeverity.success);
            });
        } else {
            this.toggleExperimentFunctionInternal();
            this.alertService.showMessage(this.translations.experimentFunctionDisabledTitle, this.translations.experimentFunctionDisabledContent, MessageSeverity.success);
        }
    }

    toggleExperimentFunctionInternal() {
        this.efEnabled = !this.efEnabled;
        this.dataService.saveSettingsToStore(this.settings);
    }
}
