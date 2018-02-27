import { Component, OnInit, Input } from '@angular/core';
import { ChainDbService } from '../../services/chain-db.service';
import { CryptographyService } from '../../services/cryptography.service';
import { PrivateKeyService, KeyConfiguration } from '../../services/private-key.service';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';

@Component({
    selector: 'user-key',
    templateUrl: './key.page.html',
    styleUrls: ['./common.css']
})
export class KeyManagePage implements OnInit {
    keylist: Array<KeyConfiguration>;

    constructor(
        private dataService: PrivateKeyService,
        private cryptoService: CryptographyService,
        private alertService: AlertService,
    ) {
        this.updateList();
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
        this.dataService.removeKey(key);
        this.updateList();
    }

    import() {
        this.alertService.showDialog("type name", DialogType.prompt, name => {
            if (this.keylist.findIndex(_ => _.name == name) > -1) {
                this.alertService.showMessage("name already been taken, consider another one", "", MessageSeverity.error);
                return;
            }

            this.alertService.showDialog("type key", DialogType.prompt, key => {
                if (!this.cryptoService.validatePrivateKey(key)) {
                    this.alertService.showMessage("private key invalid", "", MessageSeverity.error);
                    return;
                }

                this.dataService.addKey({ name: name, key: key });
                this.updateList();
            });
        });
    }

    export(key: KeyConfiguration) {
        this.dataService.getPrivateKey(key)
            .subscribe(_ => {
                this.alertService.showDialog("your private key is: " + _, DialogType.alert);
            });
    }

    create() {
        this.alertService.showDialog("type name", DialogType.prompt, name => {
            if (this.keylist.findIndex(_ => _.name == name) > -1) {
                this.alertService.showMessage("name already been taken, consider another one", "", MessageSeverity.error);
            }
            else {
                let genKey = this.cryptoService.generateRandomPrivateKey();
                this.dataService.addKey({ name: name, key: genKey });
                this.updateList();
            }
        });
    }

}
