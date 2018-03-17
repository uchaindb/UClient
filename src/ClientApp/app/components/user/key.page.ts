import { Component, OnInit, Input } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { CryptographyService } from '../../services/cryptography.service';
import { PrivateKeyService } from '../../services/private-key.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { AppTranslationService } from '../../services/app-translation.service';
import { KeyConfiguration } from '../../models/cryptography.model';

@Component({
    selector: 'user-key',
    templateUrl: './key.page.html',
    styleUrls: ['./common.css']
})
export class KeyManagePage implements OnInit {
    keylist: Array<KeyConfiguration>;

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
        private dataService: PrivateKeyService,
        private cryptoService: CryptographyService,
        private alertService: AlertService,
        private translationService: AppTranslationService,
    ) {
        this.updateList();
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
    }

    updateList() {
        this.dataService.getKeyList()
            .subscribe(_ => {
                this.keylist = _;
            });
    }

    ngOnInit() {
    }

    delete(key: KeyConfiguration) {
        this.dataService.removeKey(key.name);
        this.updateList();
    }

    import() {
        this.alertService.showDialog(this.translations.importNamePromptMessage, DialogType.prompt, name => {
            if (this.keylist.findIndex(_ => _.name == name) > -1) {
                this.alertService.showMessage(this.translations.importNameTakenTitle, this.translations.importNameTakenContent, MessageSeverity.error);
                return;
            }

            this.alertService.showDialog(this.translations.importKeyPromptMessage, DialogType.prompt, key => {
                let privateKey = this.cryptoService.parsePrivateKey(key);
                if (!privateKey) {
                    this.alertService.showMessage(this.translations.importInvalidKeyTitle, this.translations.importInvalidKeyContent, MessageSeverity.error);
                    return;
                }

                this.dataService.addKey(name, key);
                this.updateList();
            });
        });
    }

    export(key: KeyConfiguration) {
        this.dataService.getPrivateKey(key.name)
            .subscribe(_ => {
                this.alertService.showDialog(this.translations.exportMessage + _.toB58String(), DialogType.alert);
            });
    }

    create() {
        this.alertService.showDialog(this.translations.createNamePromptMessage, DialogType.prompt, name => {
            if (this.keylist.findIndex(_ => _.name == name) > -1) {
                this.alertService.showMessage(this.translations.createNameTakenTitle, this.translations.createNameTakenContent, MessageSeverity.error);
            }
            else {
                let genKey = this.cryptoService.generateRandomPrivateKey();
                let key = genKey.toB58String();
                this.dataService.addKey(name, key);
                this.updateList();
            }
        });
    }

}
